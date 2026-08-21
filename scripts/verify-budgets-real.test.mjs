// Tests that run `verify-budgets` for real against a temporarily-mutated committed
// artifact, rather than reimplementing its arithmetic (which would pass even if the rule
// itself were wrong). Deliberately kept in ONE file: every test here shells out to the
// real `node scripts/verify-budgets.mjs`, which writes the shared `audit/budget-results.json`
// as a side effect of every invocation. Vitest runs separate test FILES in parallel by
// default (tests within one file run sequentially), so splitting these across files lets
// two subprocess invocations race on that shared output -- observed directly (issue 650):
// a second file's "missing artifact" test renaming an unrelated committed artifact away
// mid-run caused THIS file's own invocations to also see it missing and write that
// snapshot, leaving the tree dirty after a clean run. One file, one queue.

import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RESULTS = join(ROOT, 'audit/budget-results.json');
const RESULTS_BACKUP = join(ROOT, 'audit/.budget-results.test-backup.json');

function runBudgets() {
  try {
    const output = execFileSync('node', [join(ROOT, 'scripts/verify-budgets.mjs')], { cwd: ROOT, encoding: 'utf8' });
    return { exitCode: 0, output };
  } catch (error) {
    return { exitCode: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

function backupResults() {
  if (existsSync(RESULTS)) copyFileSync(RESULTS, RESULTS_BACKUP);
}

// Also restored in afterEach: a failed assertion throws past an inline restore, and a
// leftover mutated artifact would fail preflight's clean-after check instead.
afterEach(() => {
  if (existsSync(RESULTS_BACKUP)) {
    copyFileSync(RESULTS_BACKUP, RESULTS);
    unlinkSync(RESULTS_BACKUP);
  }
});

describe('gate-suite mutation floor (issue 602)', () => {
  const ARTIFACT = join(ROOT, 'audit/gate-mutation-score.json');
  const BACKUP = join(ROOT, 'audit/.gate-mutation-score.test-backup.json');

  afterEach(() => {
    if (existsSync(BACKUP)) {
      copyFileSync(BACKUP, ARTIFACT);
      unlinkSync(BACKUP);
    }
  });

  it('is green as committed', () => {
    expect(runBudgets().exitCode).toBe(0);
  });

  it('blocks when the gate suite loses coverage, with survivors still at zero', () => {
    copyFileSync(ARTIFACT, BACKUP);
    backupResults();
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    // Exactly the shape of a deleted mutant: fewer killed, score down, survivors untouched.
    writeFileSync(ARTIFACT, `${JSON.stringify({
      ...artifact, killed: artifact.killed - 3, gateMutationSuiteScore: 89.7, unexplainedSurvivors: 0,
    }, null, 2)}\n`);

    const { exitCode, output } = runBudgets();
    expect(exitCode).toBe(1);
    expect(output).toContain('gateSuiteMutationScore');
    // The pre-existing survivors budget does not see this regression.
    expect(output).toMatch(/gateSuiteUnexplainedSurvivors\s+0\s+<=\s+0\s+0\s+OK/);
  });

  it('names the artifact it read, so a failure can be traced without guessing', () => {
    copyFileSync(ARTIFACT, BACKUP);
    backupResults();
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    writeFileSync(ARTIFACT, `${JSON.stringify({ ...artifact, gateMutationSuiteScore: 50 }, null, 2)}\n`);

    expect(runBudgets().output).toContain('gate-mutation-score.json#/gateMutationSuiteScore');
  });
});

describe('designRuleUnclassifiedRate budget (issue 650)', () => {
  const ARTIFACT = join(ROOT, 'audit/design-rule-coverage.json');
  const BACKUP = join(ROOT, 'audit/.design-rule-coverage.test-backup.json');

  afterEach(() => {
    if (existsSync(BACKUP)) {
      copyFileSync(BACKUP, ARTIFACT);
      unlinkSync(BACKUP);
    }
  });

  it('is green as committed', () => {
    expect(runBudgets().exitCode).toBe(0);
  });

  it('reports EXCEEDED for a worse value but does not fail the exit code (advisory)', () => {
    copyFileSync(ARTIFACT, BACKUP);
    backupResults();
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    const mutated = { ...artifact, presets: { ...artifact.presets, warm: { ...artifact.presets.warm, unclassified: 99.9 } } };
    writeFileSync(ARTIFACT, `${JSON.stringify(mutated, null, 2)}\n`);

    const { exitCode, output } = runBudgets();
    expect(exitCode).toBe(0);
    expect(output).toMatch(/designRuleUnclassifiedRate\s+99\.9.*EXCEEDED ADVISORY/);
  });

  it('produces MISSING_ARTIFACT, not a crash, when the artifact is absent', () => {
    backupResults();
    const moved = `${ARTIFACT}.moved`;
    renameSync(ARTIFACT, moved);
    try {
      const { exitCode, output } = runBudgets();
      expect(exitCode).toBe(0);
      expect(output).toContain('designRuleUnclassifiedRate');
      expect(output).toMatch(/MISSING_ARTIFACT/);
    } finally {
      renameSync(moved, ARTIFACT);
    }
  });
});
