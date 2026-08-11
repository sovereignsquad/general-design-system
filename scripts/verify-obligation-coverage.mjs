// Issue 581 — registry-derived obligation coverage.
//
// Checks every atom in audit/registry.json against the obligations its kind carries, so
// a newly added export, prop, variant or accent acquires obligations automatically with
// no manual registration step.
//
// Ratcheted, not absolute: existing debt (F18: 1,699 atoms) never blocks work — only
// adding to it does.
//
// Output: audit/obligation-coverage.json

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OBLIGATION_MODEL, COVERED_ELSEWHERE } from './audit/obligation-model.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const registryPath = join(ROOT, 'audit/registry.json');
if (!existsSync(registryPath)) fail('audit/registry.json missing. Run `npm run registry:build`.');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

if (!Object.keys(OBLIGATION_MODEL).length) fail('Empty obligation model — refusing to pass vacuously.');
if (!registry.atoms?.length) fail('Registry has no atoms — extraction is broken, not the system empty.');

// ── Corpora, built ONCE. 2,845 atoms x naive per-atom file reads is pathological. ──
const sourceCache = new Map();
const readSource = (file) => {
  if (!sourceCache.has(file)) {
    const p = join(ROOT, file);
    sourceCache.set(file, existsSync(p) ? readFileSync(p, 'utf8').split('\n') : null);
  }
  return sourceCache.get(file);
};

/** Demo corpus: every playground source, for variation-shown checks. */
const demoBlob = (() => {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!/node_modules|dist/.test(e.name)) walk(p); }
      else if (/\.(ts|tsx)$/.test(e.name) && !e.name.includes('.test.')) out.push(readFileSync(p, 'utf8'));
    }
  };
  walk(join(ROOT, 'apps/playground/src'));
  return out.join('\n');
})();

/** Contrast evidence for accents, from the built theme package. */
const accentContrastEvidence = (() => {
  try {
    const badge = readFileSync(join(ROOT, 'packages/gds-core/src/GdsBadge.tsx'), 'utf8');
    return badge;
  } catch { return ''; }
})();

// ── Obligation predicates ────────────────────────────────────────────────────
const SATISFIES = {
  /** A JSDoc block terminator on the line above the declaration. */
  jsdoc(atom) {
    const lines = readSource(atom.source.file);
    if (!lines) return { met: false, why: 'source file unreadable' };
    // The registry records the interface's line for props; scan a small window for the
    // member itself rather than assuming an exact line, since the extractor stores the
    // interface start.
    const member = atom.name.split('.').pop();
    const start = Math.max(0, atom.source.line - 1);
    for (let i = start; i < Math.min(lines.length, start + 400); i += 1) {
      if (!new RegExp(`(^|\\s)${member.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\??\\s*[:(<]`).test(lines[i])) continue;
      const prev = (lines[i - 1] ?? '').trim();
      return { met: prev.endsWith('*/'), why: prev.endsWith('*/') ? '' : 'no JSDoc block above the declaration' };
    }
    return { met: false, why: 'declaration not located within scan window' };
  },

  /** The literal value appears in a playground demo. */
  variationShown(atom) {
    const value = atom.name.split('=').pop();
    if (!value) return { met: false, why: 'no literal value parsed' };
    const shown = new RegExp(`['"\`]${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`).test(demoBlob);
    return { met: shown, why: shown ? '' : `literal '${value}' is rendered by no playground demo` };
  },

  /** The accent appears in the contrast-bearing shade table. */
  contrastVerified(atom) {
    const present = new RegExp(`\\b${atom.name}\\b`).test(accentContrastEvidence)
      && /gdsBadgeAccentShades/.test(accentContrastEvidence);
    return { met: present, why: present ? '' : 'accent has no entry in the contrast-verified shade table' };
  },
};

// ── Evaluate ─────────────────────────────────────────────────────────────────
const gaps = [];
const excluded = [];
const byKind = {};
let evaluated = 0;

for (const atom of registry.atoms) {
  const spec = OBLIGATION_MODEL[atom.kind];
  if (!spec) continue;

  const hit = (spec.exclude ?? []).find((x) => new RegExp(x.pattern).test(atom.name));
  if (hit) { excluded.push({ atom: atom.name, kind: atom.kind, reason: hit.reason }); continue; }

  evaluated += 1;
  byKind[atom.kind] ??= { evaluated: 0, gaps: 0 };
  byKind[atom.kind].evaluated += 1;

  const unmet = [];
  for (const ob of spec.obligations) {
    const predicate = SATISFIES[ob];
    // An obligation with no predicate is a gap in THIS gate; count it, never pass it.
    if (!predicate) { unmet.push({ obligation: ob, why: 'no predicate implemented — counted as a gap, not a pass' }); continue; }
    const r = predicate(atom);
    if (!r.met) unmet.push({ obligation: ob, why: r.why });
  }
  if (unmet.length) {
    byKind[atom.kind].gaps += 1;
    gaps.push({ atom: atom.name, kind: atom.kind, source: atom.source, unmet });
  }
}

// Kinds present in the registry that this gate does not model — reported in its own
// output so the gate's coverage gap is visible where the gate runs, not only in an issue.
const unmodelled = Object.keys(registry.counts)
  .filter((k) => !OBLIGATION_MODEL[k] && !COVERED_ELSEWHERE[k])
  .map((k) => ({ kind: k, atoms: registry.counts[k] }));

const budgets = JSON.parse(readFileSync(join(ROOT, 'audit/budgets.json'), 'utf8')).budgets;
// Finding F25. This read `registryAtomsWithoutCoverage`, which the same change set had
// just ratcheted to 0 because the measurement moved here — so the gate compared 410 gaps
// against a budget of 0 and failed on every clean run. It was invisible because the gate
// mutation suite reported its mutant KILLED: a gate that ALWAYS fails "detects" every
// planted defect. Reading a budget that does not exist must also be loud, not Infinity,
// which would pass vacuously — the failure mode issue 516 shipped.
const budgetEntry = budgets.obligationGaps;
if (!budgetEntry) fail('audit/budgets.json has no `obligationGaps` budget. Refusing to pass without one.');
const budget = budgetEntry.value;

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/obligation-coverage.json'), JSON.stringify({
  evaluated, gapCount: gaps.length, excludedCount: excluded.length,
  byKind, unmodelled, budget,
  gaps: gaps.slice(0, 500),
}, null, 2));

console.log('Registry obligation coverage (issue 581)\n');
for (const [kind, v] of Object.entries(byKind)) {
  const pct = v.evaluated ? (((v.evaluated - v.gaps) / v.evaluated) * 100).toFixed(1) : '0.0';
  console.log(`  ${kind.padEnd(10)} ${String(v.evaluated - v.gaps).padStart(5)}/${String(v.evaluated).padEnd(6)} ${pct}%   gaps: ${v.gaps}`);
}
console.log(`\n  evaluated ${evaluated}   excluded ${excluded.length} (with reasons)   gaps ${gaps.length}   budget ${budget}`);
if (unmodelled.length) {
  console.log('\n  kinds this gate does NOT model (its own coverage gap):');
  for (const u of unmodelled) console.log(`    ${u.kind} (${u.atoms} atoms)`);
}

if (gaps.length > budget) {
  console.error('');
  for (const g of gaps.slice(0, 50)) {
    console.error(`FAIL ${g.kind} ${g.atom} — ${g.unmet.map((u) => `${u.obligation}: ${u.why}`).join('; ')} (${g.source.file}:${g.source.line})`);
  }
  if (gaps.length > 50) console.error(`  … and ${gaps.length - 50} more. Showing 50 of ${gaps.length}.`);
  console.error(`\nObligation gaps ${gaps.length} exceed budget ${budget}.`);
  process.exit(1);
}

console.log(`\nObligation coverage within budget: ${gaps.length} gap(s) <= ${budget}.`);
