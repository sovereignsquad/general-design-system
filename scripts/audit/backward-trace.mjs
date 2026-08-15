// Phase 1 of docs/DEEP_AUDIT_PLAN.md — backward trace.
//
// Rule 1: nothing but GDS tokens may render on the reference site. Any value that
// cannot be traced to a governed token is extraneous (DO-178C) and is a finding
// regardless of whether it looks correct.
//
// Provenance is resolved against EACH THEME'S OWN token map, not by string match
// against a single theme. That is what catches a hardcoded value that happens to
// equal the default theme's token — it passes under `default` and fails under the
// other 24.
//
// Output: audit/backward-trace.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createCdpClient, launchBrowser, startPreviewServer, wait, waitForReady, evaluate,
} from '../lib/browser-runtime.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;
const baseUrl = process.env.GDS_AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_AUDIT_BASE_URL;

// Overridable so the mutation harness (#579) can run a reduced cell set: one route is
// enough to observe a per-theme delta, at roughly a quarter of the cost.
const ROUTES = (process.env.GDS_AUDIT_ROUTES ?? '/live-proofs,/patterns/foundations,/live-proofs/surfaces,/patterns/operations').split(',');
// Weighted by §3.1.1 defect history: brand lanes over-represented, dark scheme
// specific defects real, high-contrast/colorblind lanes are the a11y edge.
const PRESETS = (process.env.GDS_AUDIT_PRESETS ?? 'default,class-usa,gold-athlete,dark-public,high-contrast').split(',');
const SCHEMES = (process.env.GDS_AUDIT_SCHEMES ?? 'light,dark').split(',');

// Properties where a token match is MEANINGFUL. Deliberately excluded, with reasons,
// so the exclusion is a stated decision rather than a silent gap:
//   min-height / width / height  - layout-computed, never style-authored
//   line-height                  - computed from a unitless ratio x font-size; the
//                                  computed px can never equal a declared token
//   font-family                  - computed value is the whole fallback stack
import { TRACKED, CAPTURE, absoluteUrlFor } from './lib/render-capture.mjs';
const absoluteUrl = (route) => absoluteUrlFor(baseUrl, route);

async function run() {
  const preview = ownsPreviewServer
    ? await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'audit backward-trace' })
    : null;
  const { browser, userDataDir, webSocketDebuggerUrl } = await launchBrowser({
    tmpPrefix: 'gds-audit-backward-', portBase: 9600, portRange: 300,
    windowSize: '1280,900', verificationLabel: 'audit backward-trace', unrefBrowser: true,
  });
  const client = await createCdpClient(webSocketDebuggerUrl);

  const cells = [];
  let planned = 0, executed = 0;
  const skipped = [];

  for (const route of ROUTES) {
    for (const preset of PRESETS) {
      for (const scheme of SCHEMES) {
        planned++;
        try {
          await client.send('Page.navigate', { url: absoluteUrl(route) });
          await wait(250); await waitForReady(client);
          await evaluate(client, `
            localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
              preset: '${preset}', colorScheme: '${scheme}', primaryColor: 'blue',
              focusRing: true, editorialSerif: false, fontLane: 'inter'
            })); location.reload();`);
          await wait(450); await waitForReady(client);
          const res = await evaluate(client, CAPTURE);
          const literals = res.observations.filter((o) => o.provenance === 'literal');
          cells.push({ route, preset, scheme, tokenCount: res.tokenCount,
            observed: res.observations.length, literals: literals.length,
            literalSample: literals.slice(0, 400) });
          executed++;
          process.stdout.write('.');
        } catch (error) {
          skipped.push({ route, preset, scheme, reason: String(error).slice(0, 200) });
          process.stdout.write('x');
        }
      }
    }
  }
  console.log('');

  // Aggregate: a value is a CONFIRMED literal only if it fails to resolve under
  // the theme it rendered in. Group by (prop, value) across themes to expose the
  // "matches the default theme by coincidence" class.
  const byKey = new Map();
  for (const c of cells) {
    for (const l of c.literalSample) {
      const k = `${l.prop}|${l.value}|${l.sel}`;
      const e = byKey.get(k) ?? { prop: l.prop, value: l.value, sel: l.sel, themes: new Set() };
      e.themes.add(`${c.preset}/${c.scheme}`);
      byKey.set(k, e);
    }
  }
  const findings = [...byKey.values()]
    .map((e) => ({ ...e, themes: [...e.themes], themeCount: e.themes.size }))
    .sort((a, b) => b.themeCount - a.themeCount);

  const report = {
    commit: process.env.GIT_COMMIT ?? null,
    plannedCells: planned, executedCells: executed, skippedCells: skipped,
    coverage: executed / planned,
    totalObservations: cells.reduce((n, c) => n + c.observed, 0),
    totalLiteralObservations: cells.reduce((n, c) => n + c.literals, 0),
    distinctLiterals: findings.length,
    findings: findings.slice(0, 500),
    cells: cells.map(({ literalSample, ...rest }) => rest),
    literalsByPreset: cells.reduce((acc, c) => {
      acc[`${c.preset}/${c.scheme}`] = (acc[`${c.preset}/${c.scheme}`] ?? 0) + c.literals;
      return acc;
    }, {}),
  };

  mkdirSync(join(ROOT, 'audit'), { recursive: true });
  const outPath = process.env.GDS_AUDIT_OUT ?? 'audit/backward-trace.json';
  writeFileSync(join(ROOT, outPath), JSON.stringify(report, null, 2));

  console.log(`\nPhase 1 backward trace`);
  console.log(`  cells: ${executed}/${planned}  coverage ${(report.coverage * 100).toFixed(1)}%`);
  console.log(`  observations: ${report.totalObservations}`);
  console.log(`  literal (untraceable) observations: ${report.totalLiteralObservations}`);
  console.log(`  distinct literals: ${report.distinctLiterals}`);
  if (skipped.length) {
    console.log(`  SKIPPED ${skipped.length} cell(s) — coverage is PARTIAL:`);
    for (const s of skipped) console.log(`    ${s.route} ${s.preset}/${s.scheme}: ${s.reason}`);
  }
  console.log(`\n  top untraceable values by theme spread:`);
  for (const f of findings.slice(0, 15)) {
    console.log(`    ${String(f.themeCount).padStart(2)} themes  ${f.prop} = ${f.value.slice(0, 42).padEnd(42)} ${f.sel.slice(0, 40)}`);
  }

  await client.close?.();
  const { disposeBrowser } = await import('../lib/browser-runtime.mjs');
  await disposeBrowser(browser, userDataDir);
  if (preview?.kill) await preview.kill('SIGTERM');
}

run().catch((e) => { console.error(e); process.exit(1); });
