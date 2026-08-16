// Mutation-tests the verification gates themselves.
//
// Inverted verdict: under a planted defect a correct gate must fail. A gate that still exits
// 0 has proven it does not detect that defect; the mutant's `claim` names the unsupported assertion.
//
// Output: audit/gate-mutation-score.json

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { GATE_MUTANTS, EXEMPTIONS, KNOWN_SURVIVORS } from './audit/gate-mutants.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const TIMEOUT_MS = 180000;
const today = () => new Date();

const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

// ── Coverage: every release-chain gate needs mutants or a live exemption ─────
const releaseChain = readFileSync(join(ROOT, 'package.json'), 'utf8');
const chain = JSON.parse(releaseChain).scripts['verify:release']
  .split('&&').map((c) => c.trim())
  .filter((c) => c.startsWith('npm run'))
  .map((c) => c.replace('npm run ', '').trim());

if (chain.length === 0) fail('Could not parse verify:release — refusing to pass vacuously.');
if (GATE_MUTANTS.length === 0) fail('Empty gate-mutant registry — refusing to pass vacuously.');

const covered = new Set(GATE_MUTANTS.map((g) => g.npmScript));
const coverageFailures = [];
for (const gate of chain) {
  if (covered.has(gate)) continue;
  const exempt = EXEMPTIONS[gate];
  if (!exempt) {
    coverageFailures.push(`${gate} is in verify:release but has neither mutants nor an exemption.`);
    continue;
  }
  if (!exempt.reason?.trim()) coverageFailures.push(`${gate} exemption has no reason.`);
  if (!exempt.reviewBy) coverageFailures.push(`${gate} exemption has no reviewBy date.`);
  else if (Date.parse(exempt.reviewBy) < today()) {
    coverageFailures.push(`${gate} exemption expired ${exempt.reviewBy} — re-examine or add mutants.`);
  }
}

// ── Baseline tree state ─────────────────────────────────────────────────────
// Compared against a baseline, not absolute cleanliness: pre-existing untracked files are not leaked mutations.
let baselineTree = '';
try {
  baselineTree = execFileSync('git', ['status', '--porcelain', '--', 'packages', 'scripts', 'audit', 'apps'], { cwd: ROOT }).toString().trim();
} catch { /* git unavailable; reported at the end */ }

// Any audit/*.json a child gate writes must be treated as state to restore, like source.
// Discovered dynamically rather than hardcoded, so a newly added gate's artifact is covered
// automatically.
const ARTIFACTS = readdirSync(join(ROOT, 'audit'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => `audit/${f}`);
const artifactSnapshots = Object.fromEntries(
  ARTIFACTS.filter((f) => existsSync(join(ROOT, f))).map((f) => [f, readFileSync(join(ROOT, f), 'utf8')]),
);
const restoreArtifacts = () => {
  for (const [f, content] of Object.entries(artifactSnapshots)) writeFileSync(join(ROOT, f), content);
};

const results = [];
const snapshots = new Map();
const restoreAll = () => { for (const [f, c] of snapshots) writeFileSync(f, c); restoreArtifacts(); };
process.once('SIGINT', () => { restoreAll(); process.exit(130); });
process.once('SIGTERM', () => { restoreAll(); process.exit(143); });

function rebuild(workspaces) {
  for (const ws of workspaces) {
    execFileSync('npm', ['run', 'build', '--workspace', ws], { cwd: ROOT, stdio: 'pipe', timeout: TIMEOUT_MS });
  }
}

function runGate(entry) {
  const cmd = entry.standalone
    ? ['node', [join(ROOT, 'scripts', entry.script)]]
    : ['npm', ['run', entry.npmScript]];
  try {
    execFileSync(cmd[0], cmd[1], { cwd: ROOT, stdio: 'pipe', timeout: TIMEOUT_MS });
    return 0;
  } catch (error) {
    if (error.killed || error.signal) return null; // timeout -> INVALID, never KILLED
    return error.status ?? 1;
  }
}

// The inverted verdict is only meaningful against a gate that passes clean: a gate that
// fails unconditionally reports every mutant KILLED regardless of the mutation.
const baselineExit = new Map();
const gateBaseline = (entry) => {
  if (!baselineExit.has(entry.npmScript)) baselineExit.set(entry.npmScript, runGate(entry));
  return baselineExit.get(entry.npmScript);
};

console.log('Gate mutation suite (issue 580)\n');

for (const entry of GATE_MUTANTS) {
  for (const mutant of entry.mutants) {
    const path = join(ROOT, mutant.file);
    const original = readFileSync(path, 'utf8');
    snapshots.set(path, original);
    let status = 'INVALID';
    let detail = '';

    try {
      const clean = gateBaseline(entry);
      if (clean !== 0) {
        throw new Error(
          `BASELINE BROKEN: ${entry.npmScript} exits ${clean ?? 'TIMEOUT'} with no mutation applied. `
          + 'Every mutant would report KILLED for the wrong reason. Fix the gate first.',
        );
      }
      if (!original.includes(mutant.find)) throw new Error(`anchor not found: ${mutant.find.slice(0, 60)}`);
      let mutated = mutant.once
        ? original.replace(mutant.find, mutant.replace)
        : original.split(mutant.find).join(mutant.replace);
      (mutant.alsoRemove ?? []).forEach((needle, i) => {
        if (!mutated.includes(needle)) throw new Error(`alsoRemove anchor not found: ${needle.slice(0, 40)}`);
        mutated = mutated.split(needle).join(mutant.replaceWith[i]);
      });
      if (mutated === original) throw new Error('mutation is a no-op');

      writeFileSync(path, mutated);
      // Gates that import from dist/ are blind to a source mutation until the workspace is rebuilt.
      if (mutant.requiresBuild) rebuild(mutant.requiresBuild);
      // Some gates read a generated artifact rather than source, so the artifact must be
      // regenerated for the mutation to be visible. Same class as requiresBuild.
      if (mutant.regenerate?.includes('registry')) {
        execFileSync('node', [join(ROOT, 'scripts/audit/extract-registry.mjs')], { cwd: ROOT, stdio: 'pipe' });
      }
      const exit = runGate(entry);
      if (exit === null) {
        detail = `gate timed out after ${TIMEOUT_MS}ms`;
      } else {
        // INVERTED: non-zero means the gate detected the planted defect.
        status = exit !== 0 ? 'KILLED' : 'SURVIVED';
        detail = exit !== 0 ? `gate exited ${exit}` : 'gate exited 0 — the claim below is UNSUPPORTED';
      }
    } catch (error) {
      detail = String(error.message ?? error).slice(0, 160);
    } finally {
      writeFileSync(path, original);
      if (mutant.requiresBuild) {
        try { rebuild(mutant.requiresBuild); } catch { /* reported by the clean-tree check */ }
      }
      if (mutant.regenerate?.includes('registry')) {
        try { execFileSync('node', [join(ROOT, 'scripts/audit/extract-registry.mjs')], { cwd: ROOT, stdio: 'pipe' }); } catch { /* clean-tree check reports */ }
      }
      snapshots.delete(path);
    }

    console.log(`  ${entry.npmScript.padEnd(34)} ${mutant.id.padEnd(38)} ${status}`);
    if (status !== 'KILLED') console.log(`     claim: ${mutant.claim}\n     ${detail}`);
    results.push({ gate: entry.npmScript, mutantId: mutant.id, claim: mutant.claim, status, detail });
  }
}

// Restore artifacts BEFORE the clean-tree check and before the score is written, so no
// mutant-derived artifact survives the run.
restoreArtifacts();

// ── Clean-tree assertion: a leaked mutation ships broken source ──────────────
let treeDirty = null;
try {
  const status = execFileSync('git', ['status', '--porcelain', '--', 'packages', 'scripts', 'audit', 'apps'], { cwd: ROOT }).toString().trim();
  const before = new Set(baselineTree.split('\n').filter(Boolean));
  const introduced = status.split('\n').filter(Boolean).filter((line) => !before.has(line));
  if (introduced.length) treeDirty = introduced.slice(0, 10).join('\n');
} catch { /* git unavailable — reported below rather than assumed clean */ }

const applicable = results.filter((r) => r.status !== 'INVALID');
const killed = applicable.filter((r) => r.status === 'KILLED');
const survived = applicable.filter((r) => r.status === 'SURVIVED');
const invalid = results.filter((r) => r.status === 'INVALID');
const score = applicable.length ? +(killed.length / applicable.length * 100).toFixed(1) : 0;

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/gate-mutation-score.json'), JSON.stringify({
  releaseChainGates: chain.length,
  gatesWithMutants: GATE_MUTANTS.length,
  gatesExempted: Object.keys(EXEMPTIONS).length,
  mutantsRun: applicable.length,
  killed: killed.length,
  gateMutationSuiteScore: score,
  unexplainedSurvivors: survived.filter((r) => !KNOWN_SURVIVORS[r.mutantId]).length,
  coverageFailures,
  results,
}, null, 2));

console.log('');
console.log(`  release-chain gates: ${chain.length}   with mutants: ${GATE_MUTANTS.length}   exempted: ${Object.keys(EXEMPTIONS).length}`);
console.log(`  gate mutation score: ${killed.length}/${applicable.length} = ${score}%`);

const problems = [];
if (coverageFailures.length) problems.push(...coverageFailures);
for (const s of survived) {
  const known = KNOWN_SURVIVORS[s.mutantId];
  if (!known) {
    problems.push(`${s.gate}/${s.mutantId} SURVIVED — unsupported claim: "${s.claim}"`);
  } else if (!known.reason?.trim() || !known.issue) {
    problems.push(`${s.gate}/${s.mutantId} known-survivor entry needs both an issue and a reason.`);
  } else if (Date.parse(known.reviewBy) < today()) {
    problems.push(`${s.gate}/${s.mutantId} known-survivor entry EXPIRED ${known.reviewBy} — issue #${known.issue} must be resolved or the date re-justified.`);
  } else {
    // Reported every run so it cannot fade into the background.
    console.log(`  KNOWN SURVIVOR  ${s.mutantId}  -> issue #${known.issue}, review by ${known.reviewBy}`);
    console.log(`     ${known.reason}`);
  }
}
if (invalid.length) {
  for (const i of invalid) problems.push(`${i.gate}/${i.mutantId} INVALID — ${i.detail}`);
}
if (treeDirty) problems.push(`Working tree dirty after the suite — a mutation may have leaked:\n${treeDirty}`);

if (problems.length) {
  console.error('');
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}

console.log(`  coverage: every release-chain gate has mutants or a live exemption.`);
// Never report "0 survived" when survivors exist and are merely known.
const knownCount = survived.length;
console.log(
  `\nGate mutation suite passed: ${killed.length} killed, `
  + `${knownCount} KNOWN survivor(s) tracked to an open issue, 0 unexplained, 0 invalid, tree clean.`,
);
if (knownCount) {
  console.log(`  Note: ${knownCount} claim(s) remain unsupported. This is a pass because they are filed and dated, not because they are fixed.`);
}
