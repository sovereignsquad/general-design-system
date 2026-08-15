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
const unsettledCells = [];
const truncatedCells = [];
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

    // Issue 599 — wait for a SETTLED DOM, not a fixed delay.
    //
    // Three consecutive runs on one commit reported 33.96 / 33.95 / 33.94 percent with element
    // counts of 28,242 / 28,128 / 28,238. The rate band is small; the ~114-element spread is
    // the real problem, because it means the sweep sampled a different amount of each route
    // depending on render timing. A fixed `wait(350)` is a guess about how long React, lazy
    // routes and web fonts take, and it is a different guess on a loaded CI runner.
    //
    // Polling until the node count is unchanged across two consecutive reads replaces the
    // guess with the condition it was standing in for. The cap is a real bound, not a hang:
    // a route that never settles is reported rather than silently sampled mid-render.
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

      // Resolve every token THROUGH THE BROWSER, so the oracle is in the same normalised form
      // as the computed styles it is compared against. A probe element is the only way to get
      // a resolved value: getPropertyValue('--x') returns the declaration, not the result.
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      // This oracle tracked color/padding-top/border-top-width/font-size only, while the
      // properties above it (TRACKED_PROPERTIES) also include font-weight, box-shadow and
      // transition-duration — none of which share a value space with the four probed
      // properties. A token whose only expression is a weight, a shadow or a duration could
      // never appear here, so every element rendering it was misclassified untraceable
      // regardless of whether it actually came from a token. Brought to parity with the
      // shared render classifier's probe set (render-capture.mjs), which already covers
      // these categories (issue 625 — a second instance of the same instrument-gap class as
      // the outline-width fix: the classifier was wrong, not the rendered page).
      const oracle = new Set();
      for (const name of tokenNames) {
        for (const [cssProp, read] of [
          ['color', 'color'], ['padding-top', 'paddingTop'], ['border-top-width', 'borderTopWidth'], ['font-size', 'fontSize'],
          ['font-weight', 'fontWeight'], ['box-shadow', 'boxShadow'], ['transition-duration', 'transitionDuration'],
          ['transition-timing-function', 'transitionTimingFunction'], ['letter-spacing', 'letterSpacing'],
        ]) {
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
      //
      // Issue 599. DOM order is only stable once the DOM is, which is what the settle poll
      // above now guarantees — before it, a slower route contributed a DIFFERENT first 400.
      // The cap is reported rather than applied silently: a truncated route is a route this
      // sweep did not fully see, and a coverage number that hides that reads as more than it is.
      const allNodes = Array.from(document.querySelectorAll('body *'));
      const SAMPLE_CAP = 400;
      for (const el of allNodes.slice(0, SAMPLE_CAP)) {
        if (!visible(el)) continue;
        const s = getComputedStyle(el);
        for (const p of props) {
          const value = s.getPropertyValue(p);
          if (!value) continue;
          // Inert-outline rule, identical to the shared render classifier (issue 625): the UA
          // default outline-width ('medium' -> 3px) sits on every unfocused element painting
          // nothing while outline-style is none — counting it accuses a value that does not
          // render. Two classifiers must agree, or the same page gets two different verdicts.
          if ((p === 'outline-width' || p === 'outline-color') && s.getPropertyValue('outline-style') === 'none') continue;
          // Same Mantine ScrollArea internal-geometry exemption as the shared render
          // classifier (issue 625): 'padding: calc(--scrollarea-scrollbar-size / 5)' and the
          // 150ms scrollbar transition are literals in Mantine's own shipped ScrollArea.css,
          // untouched by any GDS theme override, so there is no token to trace them to.
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
            traceable: oracle.has(value.trim().toLowerCase()),
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
  // `kill`, not `close`: the handle from startPreviewServer has no `close`, so an optional
  // call to it is a SILENT NO-OP that leaks the server. It then holds port 4173, and the next
  // runtime gate — which spawns with --strictPort — waits on that port forever. Observed:
  // a preflight run that sat on verify:forced-colors-runtime indefinitely, and, earlier, a
  // gate run served by a stale build that reported 344 already-fixed failures.
  await previewServer?.kill('SIGTERM');
}

// Issue 599 — EXACT figures, because the sweep is now reproducible.
//
// This block used to bucket counts to the nearest thousand and round the rate to a whole
// percent, and said so plainly: three runs on one commit measured 33.94/33.95/33.96 with
// element counts of 28,128-28,242, and recording more precision would have asserted an
// accuracy the measurement did not have. Reducing precision was the honest response to
// variance, but it also meant a real 0.05pp regression was indistinguishable from noise.
//
// The variance was render timing, not measurement error: a fixed `wait(350)` sampled whatever
// had rendered by then. Waiting for a settled DOM removed it. Three consecutive runs on one
// commit now produce IDENTICAL results — 28,203 properties checked, 9,313 untraceable, every
// cell settled — so the artifact records what was actually measured.
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
  // Stated, never silent (issue 599). A truncated cell is one this sweep did not fully see,
  // and a coverage number that hides truncation reads as more coverage than it has.
  cellsTruncatedAtSampleCap: truncatedCells.length,
  sampleCapPerCell: 400,
  trackedProperties: TRACKED_PROPERTIES,
  // The findings LIST stays uncommitted as a diagnostic. The measurement is reproducible now,
  // but the list is thousands of rows of element detail that would bury a real artifact diff.
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
