// Runs the WGA-ordered covering array and reports achieved t-way coverage. Reuses the
// classifier from lib/render-capture.mjs verbatim; only cell selection/order changes.
//
// Skipped cells fail the phase and are listed individually.
// GDS_COVERAGE_LIMIT is for harness smoke-testing only: a limited run reports
// partial: true, marks unexecuted cells as skipped, and exits nonzero.
//
// Run: node scripts/audit/render-coverage.mjs      Output: audit/coverage-array.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createCdpClient, launchBrowser, startPreviewServer, wait, waitForReady, evaluate,
} from '../lib/browser-runtime.mjs';
import { CAPTURE_PREP, captureSweepChunk } from './lib/render-capture.mjs';
import { FACTORS, A11Y_CRITICAL_GROUP, EXISTING_SUITE, PAGE_FACTORS } from './factor-model.config.mjs';
import { generateCoveringArray, measureCoverage } from './covering-array.mjs';
import { selectAndOrder } from './wga-select.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;
const baseUrl = process.env.GDS_AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_AUDIT_BASE_URL;
const limit = process.env.GDS_COVERAGE_LIMIT ? Number(process.env.GDS_COVERAGE_LIMIT) : Infinity;

const rows = generateCoveringArray(FACTORS, A11Y_CRITICAL_GROUP);
const { ordered, dropped, measuredExisting, totalCost } = selectAndOrder(FACTORS, rows, EXISTING_SUITE);
console.log(`Covering array: ${rows.length} rows; ${ordered.length} to execute (${dropped.length} already covered by the runtime gates, ${measuredExisting} existing 2-tuples measured); planned transition cost ${totalCost}.`);

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'render-coverage' });
const launch = () => launchBrowser({
  tmpPrefix: 'gds-render-coverage-', portBase: 9930, portRange: 200,
  windowSize: '1408,900', verificationLabel: 'render-coverage', unrefBrowser: true,
});
let session = await launch();

const executed = [];
const skipped = [];
const pageKey = (row) => PAGE_FACTORS.map((f) => row[f]).join('|');

// A command whose execution context was destroyed never gets a reply; without a deadline
// one stranded await freezes the whole sweep.
const OP_TIMEOUT_MS = 30000;
const withDeadline = (promise, what) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} exceeded ${OP_TIMEOUT_MS}ms`)), OP_TIMEOUT_MS)),
]);

try {
  let client = await createCdpClient(session.webSocketDebuggerUrl);
  let currentPage = null;
  let currentViewport = null;
  let currentMedia = null;

  // Relaunches the browser after any cell failure so a dead renderer costs one cell, not the run.
  const hardRecover = async () => {
    try { await client.close(); } catch { /* already gone */ }
    try { await session.close(); } catch { /* already gone */ }
    session = await launch();
    client = await createCdpClient(session.webSocketDebuggerUrl);
    currentPage = null; currentViewport = null; currentMedia = null;
  };

  for (let i = 0; i < ordered.length; i += 1) {
    if (i >= limit) { skipped.push({ cell: ordered[i], why: 'GDS_COVERAGE_LIMIT smoke cap' }); continue; }
    const cell = ordered[i];
    try {
      if (currentViewport !== cell.viewport) {
        await withDeadline(client.send('Emulation.setDeviceMetricsOverride', { width: cell.viewport, height: 900, deviceScaleFactor: 1, mobile: cell.viewport < 768 }), 'viewport');
        currentViewport = cell.viewport;
      }
      const media = `${cell.reducedMotion}|${cell.forcedColors}`;
      if (currentMedia !== media) {
        await withDeadline(client.send('Emulation.setEmulatedMedia', {
          features: [
            { name: 'prefers-reduced-motion', value: cell.reducedMotion === 'reduce' ? 'reduce' : 'no-preference' },
            { name: 'forced-colors', value: cell.forcedColors },
            { name: 'prefers-color-scheme', value: cell.scheme },
          ],
        }), 'media');
        currentMedia = media;
      }
      if (currentPage !== pageKey(cell)) {
        await withDeadline(evaluate(client, `localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
          preset: '${cell.theme}', colorScheme: '${cell.scheme}', primaryColor: 'blue',
          focusRing: true, editorialSerif: false, fontLane: 'inter'
        }))`), 'storage').catch(() => {});
        await withDeadline(client.send('Page.navigate', { url: `${baseUrl}${cell.route}?locale=${cell.locale}` }), 'navigate');
        if (!(await withDeadline(waitForReady(client, { timeout: 25000 }), 'readiness'))) throw new Error('page did not render readable content');
        await wait(250);
        currentPage = pageKey(cell);
      }
      if (cell.state === 'focus-visible') {
        await withDeadline(client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }), 'input');
        await withDeadline(client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }), 'input');
      }

      // Chunked to avoid killing the renderer on /api; classifier logic is unchanged, only the transport is batched.
      const prep = await withDeadline(evaluate(client, CAPTURE_PREP), 'capture-prep');
      let observations = 0;
      let literal = 0;
      const CHUNK = 1500;
      for (let start = 0; start < prep.elements; start += CHUNK) {
        const part = await withDeadline(evaluate(client, captureSweepChunk(start, start + CHUNK)), `capture[${start}]`);
        observations += part.total;
        literal += part.literal;
      }
      executed.push({
        ...cell,
        observations,
        literal,
        untraceableRate: observations ? Math.round((literal / observations) * 1000) / 10 : 0,
      });
    } catch (error) {
      skipped.push({ cell, why: String(error.message ?? error) });
      console.error(`  ! cell ${i + 1} failed [${cell.route} ${cell.theme}/${cell.scheme} ${cell.locale} ${cell.viewport}px fc:${cell.forcedColors} rm:${cell.reducedMotion} ${cell.state}] — ${error.message ?? error}`);
      await hardRecover();
    }
    if ((i + 1) % 5 === 0 || i === ordered.length - 1) {
      console.log(`  ${i + 1}/${ordered.length} cells (${skipped.length} skipped, ${Math.round(process.uptime())}s)`);
    }
  }
  await client.close();
} finally {
  await session.close();
  await server?.kill('SIGTERM');
}

// Achieved coverage — reported for the ARRAY's executed cells alone, and again with the
// existing runtime-gate cells credited (they are real executions by other gates).
const coverageArrayOnly = measureCoverage(FACTORS, executed, A11Y_CRITICAL_GROUP);
const coverageWithGates = measureCoverage(FACTORS, [...executed, ...EXISTING_SUITE], A11Y_CRITICAL_GROUP);
const rates = executed.map((cell) => cell.untraceableRate);
const partial = Number.isFinite(limit);

const report = {
  partial,
  factorLevels: Object.fromEntries(FACTORS.map((f) => [f.name, f.levels.length])),
  arrayRows: rows.length,
  selected: ordered.length,
  droppedAlreadyCovered: dropped.length,
  existingSuiteTuples: measuredExisting,
  plannedTransitionCost: totalCost,
  executedCells: executed.length,
  skippedCells: skipped.length,
  skipped,
  achievedCoverage: { arrayOnly: coverageArrayOnly, withExistingGates: coverageWithGates },
  untraceable: executed.length ? {
    meanRate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length * 10) / 10,
    worst: executed.reduce((a, b) => (b.untraceableRate > a.untraceableRate ? b : a)),
  } : null,
  cells: executed,
};
mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/coverage-array.json'), `${JSON.stringify(report, null, 2)}\n`);

const worstPair = Object.entries(coverageWithGates.pairwise).reduce((a, b) => (b[1].rate < a[1].rate ? b : a));
console.log(`Achieved 2-way coverage (with gates): worst group ${worstPair[0]} at ${worstPair[1].rate}% (${worstPair[1].covered}/${worstPair[1].required}); a11y 3-way ${coverageWithGates.a11yTriples.rate}%.`);
if (skipped.length > 0) {
  console.error(`Render coverage FAILED: ${skipped.length} cell(s) not executed:`);
  for (const s of skipped.slice(0, 15)) console.error(`- ${JSON.stringify(s.cell)} — ${s.why}`);
  if (skipped.length > 15) console.error(`- …and ${skipped.length - 15} more (all listed in audit/coverage-array.json).`);
  process.exit(1);
}
console.log(`Render coverage complete: ${executed.length} cells executed, 0 skipped; mean untraceable ${report.untraceable?.meanRate}%.`);
