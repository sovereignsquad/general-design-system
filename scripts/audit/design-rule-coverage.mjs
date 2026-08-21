// Rendered color-proportion sample (issue #649): for every shipped preset x color scheme,
// visits a fixed set of representative reference-site routes, captures each visible
// element's rendered background-color area, classifies it against issue #644's
// dominant/secondary/accent role split, and aggregates an area-weighted percentage per
// preset. The one measurement in this milestone that checks the reference site's actual
// rendered pixels, not a theme's declared intent -- scoped to apps/playground only, never
// a consumer app GDS cannot see.
//
// Run: node scripts/audit/design-rule-coverage.mjs   Output: audit/design-rule-coverage.json
// GDS_COVERAGE_LIMIT caps the number of preset x scheme x route cells executed, for
// harness smoke-testing only (matches render-coverage.mjs's own convention) -- a limited
// run is marked partial: true in the artifact and must not be mistaken for a real result.

import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import {
  createCdpClient, launchBrowser, startPreviewServer, wait, waitForReady, evaluate,
} from '../lib/browser-runtime.mjs';
import { CAPTURE_PROPORTION } from './lib/design-rule-capture.mjs';
import { buildColorToClassLookup, aggregateProportionCoverage } from './lib/design-rule-sampling.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;
const baseUrl = process.env.GDS_AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_AUDIT_BASE_URL;
const limit = process.env.GDS_COVERAGE_LIMIT ? Number(process.env.GDS_COVERAGE_LIMIT) : Infinity;

// A fixed, small, representative sample -- not every route (26 exist). Chosen for
// content density and variety: the landing page, one pattern-family listing, the full
// component gallery (/components -- the single most complete cross-section of shipped
// UI, including every button/badge variant, so accent-classed surfaces are actually
// represented rather than sampled out by chance), and the Theme Lab itself (the densest
// page in the app). Documented, not exhaustive.
const ROUTES = ['/', '/patterns/public', '/components', '/themes'];

const theme = await import(resolve(ROOT, 'packages/gds-theme/dist/index.mjs'));
const { getGdsVibeThemes, getGdsVibeThemeCssVariables, resolveGdsColorProportionProfile } = theme;

const presets = getGdsVibeThemes();
if (presets.length === 0) {
  console.error('FAIL getGdsVibeThemes() resolved zero presets -- refusing to sample nothing.');
  process.exit(1);
}

const cells = [];
for (const preset of presets) {
  for (const scheme of ['light', 'dark']) {
    for (const route of ROUTES) {
      cells.push({ presetId: preset.id, scheme, route });
    }
  }
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'design-rule-coverage' });
const session = await launchBrowser({
  tmpPrefix: 'gds-design-rule-coverage-', portBase: 9960, portRange: 200,
  windowSize: '1408,900', verificationLabel: 'design-rule-coverage', unrefBrowser: true,
});

const OP_TIMEOUT_MS = 30000;
const withDeadline = (promise, what) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} exceeded ${OP_TIMEOUT_MS}ms`)), OP_TIMEOUT_MS)),
]);

// { presetId: { elements: [...], areaByRoute: Map } }
const byPreset = new Map();
const skipped = [];

try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);
  for (let i = 0; i < cells.length; i += 1) {
    if (i >= limit) { skipped.push({ cell: cells[i], why: 'GDS_COVERAGE_LIMIT smoke cap' }); continue; }
    const { presetId, scheme, route } = cells[i];
    try {
      await withDeadline(evaluate(client, `localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
        preset: '${presetId}', colorScheme: '${scheme}', primaryColor: 'blue',
        focusRing: true, editorialSerif: false, fontLane: 'inter'
      }))`), 'storage').catch(() => {});
      await withDeadline(client.send('Page.navigate', { url: `${baseUrl}${route}` }), 'navigate');
      if (!(await withDeadline(waitForReady(client, { timeout: 25000 }), 'readiness'))) {
        throw new Error('page did not render readable content');
      }
      await wait(250);
      const result = await withDeadline(evaluate(client, CAPTURE_PROPORTION), 'capture');

      const cssVariables = getGdsVibeThemeCssVariables(presetId, scheme);
      const classification = resolveGdsColorProportionProfile(presetId).classification;
      const lookup = buildColorToClassLookup(cssVariables, classification);
      for (const el of result.elements) el.colorClassLookup = lookup;

      if (!byPreset.has(presetId)) byPreset.set(presetId, []);
      byPreset.get(presetId).push(...result.elements);
    } catch (error) {
      skipped.push({ cell: cells[i], why: String(error.message ?? error) });
      console.error(`  ! cell ${i + 1} failed [${presetId} ${scheme} ${route}] — ${error.message ?? error}`);
    }
    if ((i + 1) % 25 === 0 || i === cells.length - 1) {
      console.log(`  ${i + 1}/${cells.length} cells (${skipped.length} skipped, ${Math.round(process.uptime())}s)`);
    }
  }
  await client.close();
} finally {
  await session.close();
  await server?.kill('SIGTERM');
}

const partial = Number.isFinite(limit) || skipped.length > 0;
const presetResults = {};
for (const [presetId, elements] of byPreset) {
  presetResults[presetId] = aggregateProportionCoverage(elements);
}

const commit = (() => { try { return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { return null; } })();

const report = {
  generatedAt: null,
  commit,
  partial,
  methodology: {
    scope: 'apps/playground reference site only, not consumer apps',
    routes: ROUTES,
    aggregation: 'area-weighted-sum-across-sampled-routes: every visible, opaque, solid-colored element across all sampled routes for a preset is summed into one area total before computing percentages, so a route with more visible content correctly counts for more.',
    excludedPaintSources: ['background-image', 'gradients', 'svg-fill'],
    excludedFromDenominator: ['invisible elements (aria-hidden/inert/display:none/visibility:hidden/opacity:0)', 'zero-area elements', 'fully transparent backgrounds', 'background-image-painted elements'],
    knownLimitations: [
      'Overlapping elements (a child painted on top of its parent) are summed independently, not resolved to one topmost-paint-per-pixel-region -- a documented approximation, not real rasterization.',
      'No overflow-hidden clip-region intersection: a clipped element counts at its full box area, not its visually clipped area.',
      'Classifies only issue #644\'s BrandSemanticRole tokens (dominant/secondary/accent). A meaningful share of rendered area on decorated presets comes from the separate --gds-vibe-* atmosphere variables (glow/gradient/swatch/hero) -- deliberately outside #644\'s classification scope -- and lands in unclassified; this is not itself a 60-30-10 violation, since those variables were never part of the classified role vocabulary.',
      'Secondary/accent role usage as a literal background-color fill is genuinely rare across the sampled routes: most accent-classed tokens (buttons, badges, tab indicators) paint small, scarce surfaces by design, and a 4-route sample does not guarantee catching every such instance.',
    ],
  },
  skippedCells: skipped.length,
  skipped: skipped.slice(0, 15),
  presets: presetResults,
};

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/design-rule-coverage.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log('preset            dominant%  secondary%  accent%  unclassified%');
for (const [presetId, r] of Object.entries(presetResults)) {
  console.log(`${presetId.padEnd(18)} ${String(r.dominant).padStart(9)} ${String(r.secondary).padStart(11)} ${String(r.accent).padStart(8)} ${String(r.unclassified).padStart(14)}`);
}

if (skipped.length > 0 && !Number.isFinite(limit)) {
  console.error(`Design rule coverage FAILED: ${skipped.length} cell(s) not executed:`);
  for (const s of skipped.slice(0, 15)) console.error(`- ${JSON.stringify(s.cell)} — ${s.why}`);
  process.exit(1);
}
console.log(`Design rule coverage complete: ${byPreset.size} preset(s) sampled, ${skipped.length} skipped.`);
