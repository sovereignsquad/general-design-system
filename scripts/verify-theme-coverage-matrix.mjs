// Issue 562 — prove components are token-derived under every preset, not just the one checked.
//
// The audit's Phase 1 executed 4 of 24 routes at 5 of 25 presets. Every finding it produced is
// real; every NON-finding is worthless, because "no untraceable value on route X under preset
// Y" says nothing when X and Y were never visited. This gate closes that: a covering sweep in
// which every route and every preset is visited, in both schemes.
//
// It measures PROVENANCE, not appearance. A resolved value that merely looks right under the
// one preset somebody opened is exactly the defect — so each tracked property is checked
// against the resolved token set for that preset and scheme.
//
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

// A gate that sweeps nothing reports zero failures, which is what a clean system reports.
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
let propertiesChecked = 0;

try {
  await client.send('Page.enable');
  for (const cell of selected) {
    // The resolved token set for THIS preset and scheme is the provenance oracle. Comparing
    // against the default preset's tokens would pass anything that happens to match the
    // default, which is the bug rather than the check.
    // The token NAMES come from the theme; their RESOLVED values must be read in the browser.
    // A first pass compared computed styles against declared token values and reported 52%
    // untraceable — almost all of it an artifact: `#ffffff` never equals `rgb(255, 255, 255)`,
    // and `calc(1rem * var(--mantine-scale))` never equals `16px`. Comparing a declaration to
    // a computed value measures the formats, not the provenance.
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

    const observed = await evaluate(client, `(() => {
      const props = ${JSON.stringify(TRACKED_PROPERTIES.map((p) => p.property))};
      const tokenNames = ${JSON.stringify(tokenNames)};

      // Resolve every token THROUGH THE BROWSER, so the oracle is in the same normalised form
      // as the computed styles it is compared against. A probe element is the only way to get
      // a resolved value: getPropertyValue('--x') returns the declaration, not the result.
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      const oracle = new Set();
      for (const name of tokenNames) {
        for (const [cssProp, read] of [['color', 'color'], ['padding-top', 'paddingTop'], ['border-top-width', 'borderTopWidth'], ['font-size', 'fontSize']]) {
          probe.style.setProperty(cssProp, 'var(' + name + ')');
          const resolved = getComputedStyle(probe)[read];
          if (resolved) oracle.add(String(resolved).trim().toLowerCase());
          probe.style.removeProperty(cssProp);
        }
      }
      probe.remove();

      const out = [];
      const seen = new Set();
      const visible = (el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
      };
      // Sampled rather than exhaustive: a route can render thousands of nodes, and the same
      // component repeated 200 times contributes one distinct provenance question, not 200.
      for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 400)) {
        if (!visible(el)) continue;
        const s = getComputedStyle(el);
        for (const p of props) {
          const value = s.getPropertyValue(p);
          if (!value) continue;
          const key = el.tagName + '|' + (el.className && el.className.toString().slice(0, 40)) + '|' + p + '|' + value;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 60),
            property: p,
            value: value.trim(),
            // Provenance decided IN the page, against browser-resolved token values.
            traceable: oracle.has(value.trim().toLowerCase()),
          });
        }
      }
      return out;
    })()`);

    for (const record of observed ?? []) {
      propertiesChecked += 1;
      const value = String(record.value).trim().toLowerCase();
      if (NON_TOKEN_VALUES.has(value)) continue;
      if (record.traceable) continue;
      findings.push({ ...cell, ...record });
    }
  }
} finally {
  await disposeBrowser(browserSession.browser, browserSession.userDataDir);
  // `kill`, not `close`: the handle from startPreviewServer has no `close`, so an optional
  // call to it is a SILENT NO-OP that leaks the server. It then holds port 4173, and the next
  // runtime gate — which spawns with --strictPort — waits on that port forever. Observed:
  // a preflight run that sat on verify:forced-colors-runtime indefinitely, and, earlier, a
  // gate run served by a stale build that reported 344 already-fixed failures.
  await previewServer?.kill('SIGTERM');
}

// Rounded to one decimal, and counts bucketed, because the sweep is not yet reproducible
// (issue 599): three runs on one commit measured 33.94/33.95/33.96 with element counts of
// 28128-28242. A committed artifact that changes every run makes the clean-tree rule
// unsatisfiable. The precision is reduced deliberately and stated — not to make the number
// look stable, but because claiming two decimals from a sweep with this variance would assert
// precision that does not exist.
// INTEGER precision, and counts to the nearest thousand. One decimal was tried and still
// moved: the observed band 33.94-33.96 straddles 33.9 and 34.0. The sweep supports an integer
// percentage and nothing finer, so that is what the artifact records. Recording more would be
// asserting precision the measurement does not have — and would make the clean-tree rule
// unsatisfiable, which is how a real leak would stop being visible among the noise.
const untraceableRate = propertiesChecked ? Math.round((findings.length / propertiesChecked) * 100) : 0;
const bucket = (n) => Math.round(n / 1000) * 1000;

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/theme-coverage-matrix.json'), `${JSON.stringify({
  routes: routes.length,
  presets: presets.length,
  cellsExecuted: selected.length,
  cellsPossible: routes.length * presets.length * 2,
  routesCovered: routesCovered.size,
  presetsCovered: presetsCovered.size,
  propertiesCheckedApprox: bucket(propertiesChecked),
  untraceableCountApprox: bucket(findings.length),
  untraceableRate,
  precisionNote: 'Counts bucketed to 1000 and the rate to whole percent: the sweep is not yet reproducible (issue 599), and recording two decimals would assert precision it does not have.',
  trackedProperties: TRACKED_PROPERTIES,
  // The findings LIST is not committed. Which elements a route renders varies with timing
  // (issue 599), so the list changes between runs even when the measurement does not — and a
  // committed artifact that churns every run makes the clean-tree rule unsatisfiable, which
  // is how a genuinely leaked mutation would stop being visible. The list is written beside
  // it as a diagnostic and gitignored; the stable measurement is what the budget reads.
  findingsFile: 'audit/theme-coverage-matrix.findings.json (not committed — see precisionNote)',
}, null, 2)}\n`);

writeFileSync(join(ROOT, 'audit/theme-coverage-matrix.findings.json'), `${JSON.stringify({
  generatedFor: 'diagnostics only; not committed',
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
