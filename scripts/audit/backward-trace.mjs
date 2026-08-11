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
const ROUTES = (process.env.GDS_AUDIT_ROUTES ?? '/live-demos,/patterns/foundations,/live-demos/surfaces,/patterns/operations').split(',');
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
const TRACKED = [
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'padding-top', 'padding-left', 'row-gap', 'column-gap',
  'font-size', 'font-weight', 'letter-spacing',
  'color', 'background-color', 'border-top-color', 'border-top-width',
  'box-shadow', 'transition-duration', 'transition-timing-function',
  'outline-width', 'outline-color',
];

const absoluteUrl = (route) => `${baseUrl}${route}`;

/** Captures the theme's resolved token map + every element's tracked properties. */
const CAPTURE = `(() => {
  // 1. Resolve every custom property to COMPUTED form via a probe element, so
  //    '#7c3aed' and 'rgb(124, 58, 237)' compare equal, and '2rem' and '32px' do.
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    const walk = rs => { for (const r of rs) { if (r.style) for (const p of r.style) if (p.startsWith('--')) names.add(p); if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  const inline = el => { if (el) for (const p of el.style) if (p.startsWith('--')) names.add(p); };
  inline(document.documentElement); inline(document.body);
  document.querySelectorAll('[style*="--"]').forEach(inline);

  const probe = document.createElement('div');
  probe.style.position = 'absolute'; probe.style.visibility = 'hidden';
  document.body.appendChild(probe);

  const tokenIndex = {};   // computedValue -> [tokenName]
  const tokenValues = {};  // tokenName -> computedValue
  // Probe EVERY category a token could belong to. A token only indexes into the
  // categories where it actually resolves, so a colour token never pollutes the
  // duration index and vice versa.
  const PROBES = [
    ['color', 'color'], ['paddingTop', 'paddingTop'], ['transitionDuration', 'transitionDuration'],
    ['transitionTimingFunction', 'transitionTimingFunction'], ['boxShadow', 'boxShadow'],
    ['fontWeight', 'fontWeight'], ['letterSpacing', 'letterSpacing'], ['borderTopWidth', 'borderTopWidth'],
  ];
  const INERT = new Set(['0px', 'rgba(0, 0, 0, 0)', 'none', 'normal', '0s', 'auto', '400', '']);
  for (const name of names) {
    const declared = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const cands = [declared];
    for (const [set, read] of PROBES) {
      probe.style[set] = '';
      probe.style[set] = 'var(' + name + ')';
      const got = getComputedStyle(probe)[read];
      probe.style[set] = '';
      if (got) cands.push(String(got).trim());
    }
    for (const cand of cands) {
      if (!cand || INERT.has(cand)) continue;
      (tokenIndex[cand] ||= []).push(name);
    }
    tokenValues[name] = declared;
  }
  probe.remove();

  // 2. Sweep every visible element.
  const TRACKED = ${JSON.stringify(TRACKED)};
  const UA_DEFAULTS = new Set(['0px','normal','none','auto','rgba(0, 0, 0, 0)','0s','currentcolor','medium','400','0s, 0s','0px 0px 0px 0px']);
  const observations = [];
  const els = [...document.querySelectorAll('*')];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    for (const prop of TRACKED) {
      const value = cs.getPropertyValue(prop);
      if (!value) continue;
      if (UA_DEFAULTS.has(value.trim().toLowerCase())) continue;
      // Multi-value shorthands compute as comma lists ('0.12s, 0.12s'). Match each
      // part: a value is token-derived only if EVERY part resolves to a token.
      const parts = value.trim().includes(',') && /^[^(]*$|s,|ease|cubic/.test(value)
        ? value.split(',').map(x => x.trim()).filter(Boolean)
        : [value.trim()];
      const partHits = parts.map(p => tokenIndex[p]);
      const hit = partHits.every(Boolean) ? partHits[0] : undefined;
      observations.push({
        prop,
        value: value.trim(),
        provenance: hit ? 'token' : 'literal',
        token: hit ? hit[0] : undefined,
        sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''),
      });
    }
  }
  return { tokenCount: Object.keys(tokenValues).length, observations };
})()`;

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
