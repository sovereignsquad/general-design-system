// Mantine dependency-boundary census: classifies every consumed `--mantine-*` custom property
// as governed, delegated or ungoverned, and fails when ungoverned exceeds its budget.
//
// "Governed" is measured, not declared: the gate resolves each variable to the theme field
// Mantine emits it from and compares GDS's theme against Mantine's `DEFAULT_THEME`.
//
// Output: audit/mantine-governance.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DEFAULT_THEME } from '@mantine/core';
import { DELEGATED, DYNAMIC_REFERENCES } from './mantine-governance.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const themeModule = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
const gds = themeModule.gdsTheme;
if (!gds) fail('Could not load gdsTheme from packages/gds-theme/dist — run `npm run build` first.');

// Two questions: does the default lane dictate this value, and does any lane dictate it? A
// variable governed only in one preset still renders Mantine's default everywhere else.
const LANES = [
  'gdsDarkPublicTheme', 'gdsFlatSurfaceTheme', 'gdsEditorialPublicTheme',
  'partnerDiscoveryThemePreset', 'classUsaThemePreset', 'goldAthleteThemePreset',
].map((name) => [name, themeModule[name]]).filter(([, t]) => t);
if (!LANES.length) fail('No runtime lanes resolved; the per-lane half of the census would be vacuous.');

// ── Collect consumption from source ──────────────────────────────────────────
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    else if (/\.(ts|tsx|css)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

const consumed = new Map();
for (const file of [...walk(join(ROOT, 'packages')), ...walk(join(ROOT, 'apps/playground/src'))]) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  for (const m of text.matchAll(/var\(\s*(--mantine-[a-zA-Z0-9-]*)/g)) {
    if (!consumed.has(m[1])) consumed.set(m[1], new Set());
    consumed.get(m[1]).add(rel);
  }
}
if (!consumed.size) fail('No --mantine-* references found. Extraction is broken, not the dependency absent.');

// ── Resolve a variable to the theme value Mantine emits it from ──────────────
/**
 * Returns `{ gds, mantine }` for a variable, or null when the variable does not map to a
 * theme field (z-index, `default-*` composites and other runtime-derived properties). A
 * null mapping is never silently treated as governed — it falls through to delegation or
 * to the ungoverned count.
 */
function resolve(variable) {
  const rest = variable.slice('--mantine-'.length);
  const pick = (theme, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), theme);

  const table = [
    [/^color-(black|white)$/, (m) => [m[1]]],
    [/^color-([a-z]+)-(\d)$/, (m) => ['colors', m[1], Number(m[2])]],
    [/^shadow-(\w+)$/, (m) => ['shadows', m[1]]],
    [/^spacing-(\w+)$/, (m) => ['spacing', m[1]]],
    [/^radius-(\w+)$/, (m) => ['radius', m[1]]],
    [/^font-size-(\w+)$/, (m) => ['fontSizes', m[1]]],
    [/^line-height-(\w+)$/, (m) => ['lineHeights', m[1]]],
    [/^font-family$/, () => ['fontFamily']],
    [/^font-family-monospace$/, () => ['fontFamilyMonospace']],
    [/^breakpoint-(\w+)$/, (m) => ['breakpoints', m[1]]],
  ];

  for (const [pattern, toPath] of table) {
    const m = rest.match(pattern);
    if (!m) continue;
    const path = toPath(m);
    return { path: path.join('.'), gds: pick(gds, path), mantine: pick(DEFAULT_THEME, path) };
  }
  return null;
}

// ── Classify ─────────────────────────────────────────────────────────────────
const rows = [];
for (const [variable, files] of [...consumed].sort()) {
  const where = [...files].sort();

  if (DYNAMIC_REFERENCES[variable]) {
    rows.push({ variable, classification: 'dynamic', reason: DYNAMIC_REFERENCES[variable].reason, files: where });
    continue;
  }

  const mapped = resolve(variable);
  if (mapped && mapped.gds !== undefined && JSON.stringify(mapped.gds) !== JSON.stringify(mapped.mantine)) {
    rows.push({
      variable,
      classification: 'governed',
      declaredIn: `gdsTheme.${mapped.path}`,
      value: String(mapped.gds).slice(0, 60),
      files: where,
    });
    continue;
  }

  // Governed by a lane but not by the default theme: the value depends on which theme is
  // active, so a component consuming it unconditionally renders Mantine's default under
  // every other lane.
  if (mapped) {
    const lanes = LANES.filter(([, theme]) => {
      const value = mapped.path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), theme);
      return value !== undefined && JSON.stringify(value) !== JSON.stringify(mapped.mantine);
    }).map(([name]) => name);
    if (lanes.length) {
      rows.push({
        variable,
        classification: 'lane-governed',
        lanes,
        why: `governed by ${lanes.join(', ')} but not by the default gdsTheme; renders Mantine's default under every other lane`,
        files: where,
      });
      continue;
    }
  }

  const delegated = DELEGATED[variable];
  if (delegated) {
    if (!delegated.reason?.trim()) fail(`Delegated ${variable} has no reason.`);
    if (!delegated.reviewBy) fail(`Delegated ${variable} has no reviewBy; a delegation that cannot expire becomes permanent by neglect.`);
    if (Date.parse(delegated.reviewBy) < Date.now()) {
      fail(`Delegation of ${variable} expired ${delegated.reviewBy}. Re-examine it or move it to governed.`);
    }
    rows.push({ variable, classification: 'delegated', reason: delegated.reason, reviewBy: delegated.reviewBy, files: where });
    continue;
  }

  rows.push({
    variable,
    classification: 'ungoverned',
    // Stated as why, not just a count, so the row names its own fix.
    why: mapped ? `GDS does not change gdsTheme.${mapped.path} from Mantine's default` : 'no GDS theme field maps to this variable',
    files: where,
  });
}

const by = (c) => rows.filter((r) => r.classification === c);
// lane-governed counts as ungoverned for the budget; reported separately so remediation is visible.
const ungoverned = [...by('ungoverned'), ...by('lane-governed')];

const budgets = JSON.parse(readFileSync(join(ROOT, 'audit/budgets.json'), 'utf8')).budgets;
const entry = budgets.undeclaredMantineDependencies;
if (!entry) fail('audit/budgets.json has no `undeclaredMantineDependencies` budget. Refusing to pass without one.');

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/mantine-governance.json'), `${JSON.stringify({
  consumed: consumed.size,
  governed: by('governed').length,
  delegated: by('delegated').length,
  dynamic: by('dynamic').length,
  laneGoverned: by('lane-governed').length,
  ungovernedCount: ungoverned.length,
  budget: entry.value,
  rows,
}, null, 2)}\n`);

console.log('Mantine governance census (issue 589)\n');
console.log(`  consumed    ${String(consumed.size).padStart(4)}`);
console.log(`  governed    ${String(by('governed').length).padStart(4)}   (GDS theme changes the value from Mantine's default)`);
console.log(`  delegated   ${String(by('delegated').length).padStart(4)}   (Mantine owns it, with a reason and an expiry)`);
console.log(`  dynamic     ${String(by('dynamic').length).padStart(4)}   (name built at runtime — not statically governable)`);
console.log(`  lane-only   ${String(by('lane-governed').length).padStart(4)}   (a preset dictates it; the default lane does not — counts as ungoverned)`);
console.log(`  ungoverned  ${String(ungoverned.length).padStart(4)}   budget ${entry.value}`);

if (ungoverned.length > entry.value) {
  console.error('');
  for (const r of ungoverned.slice(0, 40)) console.error(`FAIL ${r.variable} — ${r.why} (${r.files[0]})`);
  if (ungoverned.length > 40) console.error(`  … and ${ungoverned.length - 40} more.`);
  console.error(`\nUngoverned ${ungoverned.length} exceeds budget ${entry.value}.`);
  process.exit(1);
}

console.log(`\nWithin budget: ${ungoverned.length} ungoverned <= ${entry.value}.`);
