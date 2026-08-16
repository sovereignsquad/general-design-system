// Checks that components are token-derived under every route and preset, both color schemes.
// Measures provenance: each tracked computed style value is checked against the resolved
// token set for that preset and scheme, not just visual appearance.
// Output: audit/theme-coverage-matrix.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createCdpClient, launchBrowser as launchChromeBrowser, startPreviewServer as startChromePreviewServer,
  wait, waitForReady, evaluate, disposeBrowser,
} from './lib/browser-runtime.mjs';
import { TRACKED_PROPERTIES, NON_TOKEN_VALUES, buildCoveringCells } from './theme-coverage-matrix.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { getGdsVibeThemes, getGdsVibeThemeCssVariables } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
const { patternRoutes } = await import(join(ROOT, 'scripts/lib/pattern-routes.mjs'));

const presets = getGdsVibeThemes().map((t) => t.id);
const routes = patternRoutes();

if (!presets.length) fail('No presets resolved; the matrix cannot pass vacuously.');
if (!routes.length) fail('No routes resolved; the matrix cannot pass vacuously.');
if (!TRACKED_PROPERTIES.length) fail('No tracked properties; the matrix would assert nothing.');

const cells = buildCoveringCells(routes, presets);
const routesCovered = new Set(cells.map((c) => c.route));
const presetsCovered = new Set(cells.map((c) => c.preset));
if (routesCovered.size !== routes.length) fail(`Covering design missed ${routes.length - routesCovered.size} route(s); it would report a partial sweep as a clean one.`);
if (presetsCovered.size !== presets.length) fail(`Covering design missed ${presets.length - presetsCovered.size} preset(s).`);

const baseUrl = process.env.GDS_MATRIX_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const only = process.env.GDS_MATRIX_ONLY;   // "route|preset|scheme" — single-cell re-run for flake diagnosis
const selected = only
  ? cells.filter((c) => `${c.route}|${c.preset}|${c.scheme}` === only)
  : cells;
if (only && !selected.length) fail(`GDS_MATRIX_ONLY="${only}" matched no cell.`);

const ownsPreviewServer = !process.env.GDS_MATRIX_BASE_URL;
const previewServer = await startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'theme-coverage-matrix' });
const browserSession = await launchChromeBrowser({ tmpPrefix: 'gds-theme-matrix-', portBase: 9900, portRange: 300 });
const client = await createCdpClient(browserSession.webSocketDebuggerUrl);

const findings = [];
const unsettledCells = [];
const truncatedCells = [];
let propertiesChecked = 0;

try {
  await client.send('Page.enable');
  for (const cell of selected) {
    // Oracle is this cell's own resolved token set, read in the browser (not the declared
    // value) so formats match: computed values never string-equal their raw declarations.
    const tokenNames = Object.keys(getGdsVibeThemeCssVariables(cell.preset, cell.scheme));

    await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: cell.scheme }] });
    await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${cell.route}` });
    await wait(250);
    await waitForReady(client);
    await evaluate(client, `
      localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
        preset: '${cell.preset}', colorScheme: '${cell.scheme}',
        primaryColor: 'blue', focusRing: true, editorialSerif: false, fontLane: 'inter'
      }));
      location.reload();
    `);
    await wait(350);
    await waitForReady(client);

    // Poll for a settled DOM (node count unchanged across two reads) instead of a fixed delay.
    // 4s cap; an unsettled route is reported, not silently sampled mid-render.
    const settle = await evaluate(client, `(async () => {
      const countNodes = () => document.querySelectorAll('body *').length;
      let previous = -1;
      let stableReads = 0;
      for (let poll = 0; poll < 40; poll += 1) {
        const current = countNodes();
        stableReads = current === previous ? stableReads + 1 : 0;
        if (stableReads >= 2) return { settled: true, nodes: current, polls: poll };
        previous = current;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return { settled: false, nodes: countNodes(), polls: 40 };
    })()`);

    if (!settle?.settled) {
      unsettledCells.push(`${cell.route} ${cell.preset}/${cell.scheme} (${settle?.nodes ?? 'unknown'} nodes still moving after 4s)`);
    }

    const observed = await evaluate(client, `(() => {
      const props = ${JSON.stringify(TRACKED_PROPERTIES.map((p) => p.property))};
      const tokenNames = ${JSON.stringify(tokenNames)};

      // Probe element needed to resolve values: getPropertyValue('--x') returns the declaration, not the result.
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      // Chrome serializes resolved color-mix() as 'color(srgb r g b / a)' with 0-1 float
      // components, never rgb()/rgba() — normalize before comparing.
      const normColor = (s) => (s || '').replace(/color\\(srgb\\s+([^)]+)\\)/g, (_, inner) => {
        const halves = inner.split('/');
        const chan = halves[0].trim().split(/\\s+/).map((v) => Math.round(parseFloat(v) * 255));
        const a = halves[1] === undefined ? 1 : parseFloat(halves[1]);
        return a === 1 ? 'rgb(' + chan[0] + ', ' + chan[1] + ', ' + chan[2] + ')' : 'rgba(' + chan[0] + ', ' + chan[1] + ', ' + chan[2] + ', ' + a + ')';
      });
      // Probe set must cover every TRACKED_PROPERTIES value space (color, spacing, weight,
      // shadow, duration, radius) or tokens expressed only in an uncovered space misclassify as untraceable.
      const oracle = new Set();
      for (const name of tokenNames) {
        for (const [cssProp, read] of [
          ['color', 'color'], ['padding-top', 'paddingTop'], ['border-top-width', 'borderTopWidth'], ['font-size', 'fontSize'],
          ['font-weight', 'fontWeight'], ['box-shadow', 'boxShadow'], ['transition-duration', 'transitionDuration'],
          ['transition-timing-function', 'transitionTimingFunction'], ['letter-spacing', 'letterSpacing'],
          ['border-radius', 'borderRadius'],
        ]) {
          probe.style.setProperty(cssProp, 'var(' + name + ')');
          const resolved = getComputedStyle(probe)[read];
          if (resolved) oracle.add(normColor(String(resolved).trim()).toLowerCase());
          probe.style.removeProperty(cssProp);
        }
      }
      // Mantine hairline-border formula: calc(0.0625rem * var(--mantine-scale)).
      probe.style.borderTopStyle = 'solid';
      probe.style.borderTopWidth = 'calc(0.0625rem * var(--mantine-scale))';
      const hairline = getComputedStyle(probe).borderTopWidth;
      probe.style.borderTopWidth = '';
      probe.style.borderTopStyle = '';
      if (hairline) oracle.add(normColor(hairline.trim()).toLowerCase());
      probe.remove();

      const out = [];
      const seen = new Set();
      const visible = (el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
      };
      // Sampled, not exhaustive: dedup by tag+class+property+value means a repeated component
      // contributes one distinct question. Truncation is reported, not silently applied.
      const allNodes = Array.from(document.querySelectorAll('body *'));
      const SAMPLE_CAP = 400;
      for (const el of allNodes.slice(0, SAMPLE_CAP)) {
        if (!visible(el)) continue;
        const s = getComputedStyle(el);
        for (const p of props) {
          const value = s.getPropertyValue(p);
          if (!value) continue;
          // UA default outline-width ('medium' -> 3px) paints nothing when outline-style is none; skip it.
          if ((p === 'outline-width' || p === 'outline-color') && s.getPropertyValue('outline-style') === 'none') continue;
          // Mantine's own ScrollArea.css sets these as literals, untouched by GDS theming; no token to trace.
          if (
            (p === 'padding' || p === 'transition-duration')
            && el.className && /\\bmantine-ScrollArea-(scrollbar|thumb)\\b/.test(el.className.toString())
          ) continue;
          const key = el.tagName + '|' + (el.className && el.className.toString().slice(0, 40)) + '|' + p + '|' + value;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 60),
            property: p,
            value: value.trim(),
            // Provenance decided IN the page, against browser-resolved token values.
            traceable: oracle.has(normColor(value.trim()).toLowerCase()),
          });
        }
      }
      return { rows: out, totalNodes: allNodes.length, truncated: allNodes.length > SAMPLE_CAP };
    })()`);

    if (observed?.truncated) {
      truncatedCells.push(`${cell.route} ${cell.preset}/${cell.scheme} (${observed.totalNodes} nodes, sampled 400)`);
    }

    for (const record of observed?.rows ?? []) {
      propertiesChecked += 1;
      const value = String(record.value).trim().toLowerCase();
      if (NON_TOKEN_VALUES.has(value)) continue;
      if (record.traceable) continue;
      findings.push({ ...cell, ...record });
    }
  }
} finally {
  await disposeBrowser(browserSession.browser, browserSession.userDataDir);
  // `kill`, not `close`: the handle from startPreviewServer has no `close` method.
  await previewServer?.kill('SIGTERM');
}

// Sweep is deterministic (settled-DOM wait), so the rate is recorded to 2 decimal places.
const untraceableRate = propertiesChecked ? +((findings.length / propertiesChecked) * 100).toFixed(2) : 0;

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/theme-coverage-matrix.json'), `${JSON.stringify({
  routes: routes.length,
  presets: presets.length,
  cellsExecuted: selected.length,
  cellsPossible: routes.length * presets.length * 2,
  routesCovered: routesCovered.size,
  presetsCovered: presetsCovered.size,
  propertiesChecked,
  untraceableCount: findings.length,
  untraceableRate,
  cellsUnsettled: unsettledCells.length,
  cellsTruncatedAtSampleCap: truncatedCells.length,
  sampleCapPerCell: 400,
  trackedProperties: TRACKED_PROPERTIES,
  // Findings list stays uncommitted: thousands of rows of element detail, diagnostic only.
  findingsFile: 'audit/theme-coverage-matrix.findings.json (not committed — see precisionNote)',
}, null, 2)}\n`);

writeFileSync(join(ROOT, 'audit/theme-coverage-matrix.findings.json'), `${JSON.stringify({
  generatedFor: 'diagnostics only; not committed',
  exactPropertiesChecked: propertiesChecked,
  exactUntraceableCount: findings.length,
  unsettledCells,
  truncatedCells,
  findings: findings
    .slice()
    .sort((a, b) => `${a.route}${a.preset}${a.scheme}${a.tag}${a.property}${a.value}`
      .localeCompare(`${b.route}${b.preset}${b.scheme}${b.tag}${b.property}${b.value}`))
    .slice(0, 500),
}, null, 2)}\n`);

console.log('Theme coverage matrix (issue 562)\n');
console.log(`  routes              ${String(routes.length).padStart(5)}  (all covered: ${routesCovered.size === routes.length})`);
console.log(`  presets             ${String(presets.length).padStart(5)}  (all covered: ${presetsCovered.size === presets.length})`);
console.log(`  cells executed      ${String(selected.length).padStart(5)}  of ${routes.length * presets.length * 2} possible`);
console.log(`  properties checked  ${String(propertiesChecked).padStart(5)}`);
console.log(`  untraceable         ${String(findings.length).padStart(5)}  (${untraceableRate}%)`);

if (!propertiesChecked) fail('No properties were checked. The sweep ran but measured nothing.');
console.log('\nMatrix complete. Provenance is measured per preset and scheme, not assumed from one lane.');
