// Issue 578 — ratcheted quality budgets.
//
// Compares measured values in audit/*.json against the committed expectations in
// audit/budgets.json. This gate MEASURES NOTHING itself; the audit scripts measure,
// this compares. Its whole purpose is to give the repository a memory: without it,
// nothing anywhere records "18.4% today", so 19% tomorrow is invisible.
//
// Two failure modes, both blocking:
//   EXCEEDED        a value got worse than its budget
//   UNCLAIMED_SLACK a value got measurably better and the budget was not lowered
//
// The second is what keeps the ratchet ratcheting. Without it a budget set once drifts
// into meaninglessness as the system improves around it, and the gate degrades into a
// no-op — the issue-516 failure mode expressed as numbers rather than coverage.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const AUDIT_DIR = join(ROOT, 'audit');
const DEFAULT_SLACK = 0.10;

const fail = (message) => { console.error(`FAIL ${message}`); process.exit(1); };

const budgetFile = join(AUDIT_DIR, 'budgets.json');
if (!existsSync(budgetFile)) fail('audit/budgets.json is missing.');
const { budgets } = JSON.parse(readFileSync(budgetFile, 'utf8'));

const keys = Object.keys(budgets ?? {});
// A gate that can pass with nothing to check is not a gate.
if (keys.length === 0) fail('Empty budget set — refusing to pass vacuously.');

/**
 * Resolve a measured value. Each budget names its artifact and how the number is
 * derived; derivations live here rather than in the JSON so the data file stays
 * declarative and cannot smuggle in executable logic.
 */
function measure(key) {
  const read = (name) => {
    const p = join(AUDIT_DIR, name);
    // Pointer confined to audit/: a `source` value must never be able to read
    // arbitrary files.
    if (!p.startsWith(AUDIT_DIR)) fail(`Budget "${key}" resolves outside audit/.`);
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
  };

  switch (key) {
    case 'untraceableRenderRate': {
      const a = read('backward-trace.json');
      return a && +(a.totalLiteralObservations / a.totalObservations * 100).toFixed(1);
    }
    case 'tokensWithGaps':        return read('forward-trace.json')?.tokensWithGaps;
    case 'unreachableTokens':     return read('forward-trace.json')?.rows.filter((r) => !r.demoed).length;
    case 'publishedGraphOverlap': return read('forward-trace.json')?.rows.filter((r) => r.variationsShown).length;
    case 'undeclaredMantineDependencies':
      return read('dimensions.json')?.themeControl.mantineVarsGdsConsumesButNeverDeclares;
    case 'registryAtomsWithoutCoverage': {
      const reg = read('registry.json');
      if (!reg) return undefined;
      const COVERED = new Set(['token-declared', 'token-emitted', 'token-published', 'token-referenced',
        'motion-token', 'motion-shipped', 'motion-keyframes', 'motion-reduced-guard', 'interaction-state',
        'locale-pack-package', 'locale-pack-site', 'theme', 'route', 'pattern']);
      return Object.entries(reg.counts).filter(([k]) => !COVERED.has(k)).reduce((n, [, v]) => n + v, 0);
    }
    case 'localesWithoutSitePack':
      return read('dimensions.json')?.languageVariants.packageLocalesWithNoSitePack.length;
    case 'englishLeakageWorstLocale':
      return read('dimensions.json')?.languageVariants.englishLeakage[0]?.rate;
    case 'gateMutationScore':     return read('mutation-score.json')?.mutationScore;
    case 'renderMutationScore':   return read('render-mutation-score.json')?.renderMutationScore;
    case 'gateSuiteUnexplainedSurvivors': return read('gate-mutation-score.json')?.unexplainedSurvivors;
    default: fail(`Budget "${key}" has no measurement resolver.`); return undefined;
  }
}

const results = [];
for (const [key, b] of Object.entries(budgets)) {
  // Provenance is mandatory: a budget with no finding cannot be reviewed, and an
  // unreviewable budget can be invented.
  if (!b.finding) fail(`Budget "${key}" has no finding id.`);
  if (!b.justifiedBy) fail(`Budget "${key}" has no justifyingBy commit.`);

  const measured = measure(key);
  if (measured === undefined || measured === null || Number.isNaN(measured)) {
    // A deleted artifact must NOT silently disable its budget.
    results.push({ key, ...b, measured: null, status: 'MISSING_ARTIFACT', delta: null });
    continue;
  }

  const exceeded = b.direction === 'max' ? measured > b.value : measured < b.value;
  const tol = b.slackTolerance ?? DEFAULT_SLACK;
  // A zero-valued budget has no meaningful relative tolerance; require exact match.
  const slack = b.value === 0
    ? measured !== 0
    : b.direction === 'max'
      ? measured < b.value * (1 - tol)
      : measured > b.value * (1 + tol);

  results.push({
    key, ...b, measured, delta: +(measured - b.value).toFixed(2),
    status: exceeded ? 'EXCEEDED' : slack ? 'UNCLAIMED_SLACK' : 'OK',
  });
}

const pad = (s, n) => String(s).padEnd(n);
console.log('Quality budgets\n');
console.log(`  ${pad('BUDGET', 32)}${pad('MEASURED', 10)}${pad('LIMIT', 10)}${pad('DELTA', 9)}${pad('STATUS', 17)}FINDING`);
for (const r of results) {
  const advisory = r.advisory ? ' ADVISORY' : '';
  const arrow = r.direction === 'max' ? '<=' : '>=';
  console.log(`  ${pad(r.key, 32)}${pad(r.measured ?? '-', 10)}${pad(`${arrow} ${r.value}${r.unit === '%' ? '%' : ''}`, 10)}${pad(r.delta ?? '-', 9)}${pad(r.status + advisory, 17)}${r.finding}`);
}

const blocking = results.filter((r) => !r.advisory && r.status !== 'OK');
const advisoryIssues = results.filter((r) => r.advisory && r.status !== 'OK');

if (advisoryIssues.length) {
  console.log('');
  for (const r of advisoryIssues) {
    console.log(`  ADVISORY ${r.key}: ${r.status}. ${r.advisoryReason ?? ''}`);
  }
}

if (blocking.length) {
  console.error('');
  for (const r of blocking) {
    if (r.status === 'EXCEEDED') {
      console.error(`FAIL ${r.key} — measured ${r.measured}${r.unit === '%' ? '%' : ''}, budget ${r.direction} ${r.value}. Finding ${r.finding}. Source: ${r.source}`);
    } else if (r.status === 'UNCLAIMED_SLACK') {
      console.error(`FAIL ${r.key} — measured ${r.measured} is materially better than budget ${r.value}. Lower the budget in this PR and cite the commit in justifiedBy.`);
    } else {
      console.error(`FAIL ${r.key} — ${r.status}. Source artifact missing: ${r.source}`);
    }
  }
  console.error(`\n${blocking.length} blocking budget failure(s).`);
  process.exit(1);
}

console.log(`\n${results.length} budget(s), ${results.filter((r) => r.status === 'OK').length} OK, ${advisoryIssues.length} advisory, 0 blocking.`);
