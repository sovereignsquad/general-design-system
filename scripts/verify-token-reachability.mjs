// Issue 586 — no `--gds-*` token may be declared without a rendering path.
//
// Finding F13. A declared-but-unreachable token is not merely dead weight: it appears in
// the docs and in the published DTCG graph, so a consumer or a design tool believes it is
// available when nothing renders it. The system's advertised surface exceeds its real one.
//
// Declared tokens are MEASURED from what the theme actually emits, never listed by hand —
// same principle as the Mantine census (issue 589) and for the same reason: a hand-written
// roster is a second source of truth that can claim a token exists when it does not.
//
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
// Comments are stripped first: a token named only inside a comment is not declared, and
// counting one would understate the finding by inventing a declaration.
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
}
if (!referenced.size) fail('No var(--gds-*) references found. Extraction is broken.');

// ── Unreachable ─────────────────────────────────────────────────────────────
// A `-dark` sibling is not an independent token: the document path collapses it onto the
// base name in dark mode, so it renders through its base's reference. Counting them would
// roughly double the finding with entries that are reachable by construction.
const isDarkSibling = (t) => t.endsWith('-dark') && declared.has(t.replace(/-dark$/, ''));

const rows = [];
for (const [token, where] of [...declared].sort()) {
  if (referenced.has(token) || isDarkSibling(token)) continue;

  // A pending wire-up is a DEFECT waiting on review, not a working extension point. Kept
  // in its own bucket so the two are never conflated in the count or the report.
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
