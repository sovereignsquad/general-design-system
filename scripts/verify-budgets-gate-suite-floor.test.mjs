// Issue 602. The gate suite that verifies every OTHER gate had no floor on its own coverage.
//
// `gateSuiteUnexplainedSurvivors` reads like that floor and is not one: deleting a mutant
// lowers coverage WITHOUT raising survivors, because a mutant that no longer exists survives
// nothing. So the suite could shrink toward zero mutants with every budget still green.
//
// These tests run `verify-budgets` for real against a temporarily-lowered artifact, rather
// than asserting on a re-implementation of its arithmetic. A test that recomputes the rule it
// is checking passes in exactly the cases where the rule itself is wrong.

import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ARTIFACT = join(ROOT, 'audit/gate-mutation-score.json');
const BACKUP = join(ROOT, 'audit/.gate-mutation-score.test-backup.json');

function runBudgets() {
  try {
    execFileSync('node', [join(ROOT, 'scripts/verify-budgets.mjs')], { cwd: ROOT, encoding: 'utf8' });
    return { exitCode: 0, output: '' };
  } catch (error) {
    return { exitCode: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

// Restoring in afterEach as well as inline: a failed assertion throws past the inline restore,
// and leaving a mutated artifact behind would fail preflight's clean-after check with a
// mystery diff rather than a test failure.
afterEach(() => {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, ARTIFACT);
    unlinkSync(BACKUP);
  }
});

describe('gate-suite mutation floor (issue 602)', () => {
  it('is green as committed', () => {
    expect(runBudgets().exitCode).toBe(0);
  });

  it('blocks when the gate suite loses coverage, with survivors still at zero', () => {
    copyFileSync(ARTIFACT, BACKUP);
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    // Exactly the shape of a deleted mutant: fewer killed, score down, survivors untouched.
    writeFileSync(ARTIFACT, `${JSON.stringify({
      ...artifact, killed: artifact.killed - 3, gateMutationSuiteScore: 89.7, unexplainedSurvivors: 0,
    }, null, 2)}\n`);

    const { exitCode, output } = runBudgets();
    expect(exitCode).toBe(1);
    expect(output).toContain('gateSuiteMutationScore');
    // The point of the issue: the budget that was already there does NOT see this.
    expect(output).toMatch(/gateSuiteUnexplainedSurvivors\s+0\s+<=\s+0\s+0\s+OK/);
  });

  it('names the artifact it read, so a failure can be traced without guessing', () => {
    copyFileSync(ARTIFACT, BACKUP);
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    writeFileSync(ARTIFACT, `${JSON.stringify({ ...artifact, gateMutationSuiteScore: 50 }, null, 2)}\n`);

    expect(runBudgets().output).toContain('gate-mutation-score.json#/gateMutationSuiteScore');
  });
});
