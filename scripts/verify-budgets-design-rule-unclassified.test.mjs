// designRuleUnclassifiedRate (issue 650) is advisory: a regression must be reported but
// must never fail the release chain while this brand-new (issue 649) measurement mechanism
// proves itself. These tests run verify-budgets for real against temporarily-mutated
// artifacts, rather than reimplementing its arithmetic, mirroring
// verify-budgets-gate-suite-floor.test.mjs's established pattern.

import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ARTIFACT = join(ROOT, 'audit/design-rule-coverage.json');
const BACKUP = join(ROOT, 'audit/.design-rule-coverage.test-backup.json');
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

afterEach(() => {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, ARTIFACT);
    unlinkSync(BACKUP);
  }
  if (existsSync(RESULTS_BACKUP)) {
    copyFileSync(RESULTS_BACKUP, RESULTS);
    unlinkSync(RESULTS_BACKUP);
  }
});

describe('designRuleUnclassifiedRate budget (issue 650)', () => {
  it('is green as committed', () => {
    expect(runBudgets().exitCode).toBe(0);
  });

  it('reports EXCEEDED for a worse value but does not fail the exit code (advisory)', () => {
    copyFileSync(ARTIFACT, BACKUP);
    if (existsSync(RESULTS)) copyFileSync(RESULTS, RESULTS_BACKUP);
    const artifact = JSON.parse(readFileSync(ARTIFACT, 'utf8'));
    const mutated = { ...artifact, presets: { ...artifact.presets, warm: { ...artifact.presets.warm, unclassified: 99.9 } } };
    writeFileSync(ARTIFACT, `${JSON.stringify(mutated, null, 2)}\n`);

    const { exitCode, output } = runBudgets();
    expect(exitCode).toBe(0);
    expect(output).toMatch(/designRuleUnclassifiedRate\s+99\.9.*EXCEEDED ADVISORY/);
  });

  it('produces MISSING_ARTIFACT, not a crash, when the artifact is absent', () => {
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
