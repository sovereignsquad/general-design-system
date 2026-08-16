// Checks that no `--gds-*` token is declared without a rendering path.
// Declared tokens are measured from what the theme actually emits, never listed by hand.
// Output: audit/token-reachability.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { EXTENSION_POINTS, PENDING_WIRE_UP } from './token-reachability.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const theme = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
if (!theme.getGdsVibeThemes) fail('Could not load packages/gds-theme/dist — run `npm run build` first.');

// ── Declared: every token any lane actually emits, plus CSS declarations ─────
const declared = new Map();
const declare = (token, where) => { if (!declared.has(token)) declared.set(token, where); };

for (const { id } of theme.getGdsVibeThemes()) {
  for (const scheme of ['light', 'dark']) {
    for (const token of Object.keys(theme.getGdsVibeThemeCssVariables(id, scheme))) {
      declare(token, 'getGdsVibeThemeCssVariables');
    }
  }
}
for (const lane of ['class-usa', 'gold-athlete']) {
  for (const token of Object.keys(theme.createBrandTheme(lane).mantineTheme.other.gdsCssVariables)) {
    declare(token, `createBrandTheme('${lane}')`);
  }
}

const stylesPath = join(ROOT, 'packages/gds-theme/styles.css');
// Comments stripped first: a token named only in a comment is not declared.
const styles = readFileSync(stylesPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of styles.matchAll(/(--gds-[a-zA-Z0-9-]+)\s*:/g)) declare(m[1], 'packages/gds-theme/styles.css');

if (declared.size < 50) fail(`Only ${declared.size} tokens declared; extraction is broken, not the system empty.`);

// ── Referenced: any var() reference in shipped CSS or component source ──────
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    else if (/\.(ts|tsx|css)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

const referenced = new Map();
for (const file of [...walk(join(ROOT, 'packages')), ...walk(join(ROOT, 'apps/playground/src'))]) {
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of text.matchAll(/var\(\s*(--gds-[a-zA-Z0-9-]+)/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, file));
  }
  // Reading a custom property via the CSSOM counts as consumption too, not just var().
  for (const m of text.matchAll(/getPropertyValue\(\s*['"`](--gds-[a-zA-Z0-9-]+)/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, file));
  }
  // A preview component (e.g. VibeThemePicker) can index a non-active preset's token record
  // directly via getGdsVibeThemeCssVariables() instead of the ambient var(--gds-*). Scoped to
  // .tsx component files and --gds-vibe-* only, so token emitters building the same record
  // aren't themselves counted as consumers.
  if (file.endsWith('.tsx')) {
    for (const m of text.matchAll(/\[\s*['"`](--gds-vibe-[a-zA-Z0-9-]+)['"`]\s*\]/g)) {
      if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, file));
    }
  }
}
if (!referenced.size) fail('No var(--gds-*) references found. Extraction is broken.');

// ── Unreachable ─────────────────────────────────────────────────────────────
// A `-dark` sibling collapses onto its base name in dark mode; not counted separately.
const isDarkSibling = (t) => t.endsWith('-dark') && declared.has(t.replace(/-dark$/, ''));

const rows = [];
for (const [token, where] of [...declared].sort()) {
  if (referenced.has(token) || isDarkSibling(token)) continue;

  // A pending wire-up is a defect awaiting review, kept separate from extension points.
  const pending = PENDING_WIRE_UP[token];
  if (pending) {
    if (!pending.issue) fail(`Pending wire-up ${token} has no tracking issue; it would be indistinguishable from an oversight.`);
    if (!pending.reason?.trim()) fail(`Pending wire-up ${token} has no reason.`);
    if (Date.parse(pending.reviewBy) < Date.now()) fail(`Pending wire-up ${token} expired ${pending.reviewBy}. Wire it up or reclassify it.`);
    rows.push({ token, classification: 'pending-wire-up', reason: pending.reason, issue: pending.issue, reviewBy: pending.reviewBy, declaredIn: where });
    continue;
  }

  const entry = EXTENSION_POINTS[token];
  if (entry) {
    if (!entry.reason?.trim()) fail(`Extension point ${token} has no reason.`);
    if (!entry.reviewBy) fail(`Extension point ${token} has no reviewBy; an allowlist entry that cannot expire becomes permanent by neglect.`);
    if (Date.parse(entry.reviewBy) < Date.now()) fail(`Extension point ${token} expired ${entry.reviewBy}. Re-examine it.`);
    rows.push({ token, classification: 'extension-point', reason: entry.reason, reviewBy: entry.reviewBy, declaredIn: where });
    continue;
  }
  rows.push({ token, classification: 'unreachable', declaredIn: where });
}

const unreachable = rows.filter((r) => r.classification === 'unreachable');
const extensionPoints = rows.filter((r) => r.classification === 'extension-point');
const pendingWireUp = rows.filter((r) => r.classification === 'pending-wire-up');

const budgets = JSON.parse(readFileSync(join(ROOT, 'audit/budgets.json'), 'utf8')).budgets;
const budget = budgets.unreachableTokens;
if (!budget) fail('audit/budgets.json has no `unreachableTokens` budget. Refusing to pass without one.');

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/token-reachability.json'), `${JSON.stringify({
  declared: declared.size,
  referenced: referenced.size,
  extensionPoints: extensionPoints.length,
  pendingWireUp: pendingWireUp.length,
  unreachableCount: unreachable.length,
  budget: budget.value,
  rows,
}, null, 2)}\n`);

console.log('Token reachability (issue 586)\n');
console.log(`  declared          ${String(declared.size).padStart(4)}`);
console.log(`  referenced        ${String(referenced.size).padStart(4)}`);
console.log(`  extension points  ${String(extensionPoints.length).padStart(4)}   (documented, each with a reason and an expiry)`);
console.log(`  pending wire-up   ${String(pendingWireUp.length).padStart(4)}   (should render and does not — tracked defects)`);
console.log(`  unreachable       ${String(unreachable.length).padStart(4)}   budget ${budget.value}`);
for (const r of pendingWireUp) console.log(`      ${r.token} -> issue #${r.issue}, review by ${r.reviewBy}`);

if (unreachable.length > budget.value) {
  console.error('');
  for (const r of unreachable) {
    console.error(`FAIL ${r.token} — declared by ${r.declaredIn}, referenced by nothing.`);
    console.error('     Wire it up in a GDS component, remove it, or allowlist it as an extension point with a reason.');
  }
  console.error(`\nUnreachable ${unreachable.length} exceeds budget ${budget.value}.`);
  process.exit(1);
}

console.log(`\nWithin budget: ${unreachable.length} unreachable <= ${budget.value}.`);
