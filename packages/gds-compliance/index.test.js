import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runComplianceCheck } from './index.js';

const tempDirs = [];

function createFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'gds-compliance-'));
  tempDirs.push(dir);

  for (const [relativePath, content] of Object.entries(files)) {
    const parts = relativePath.split('/');
    const fileName = parts.pop();
    const folder = join(dir, ...parts);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, fileName), content);
  }

  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('@doneisbetter/gds-compliance strict mode', () => {
  it('flags local shell adapters and Mantine AppShell wrappers in strict mode', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.3',
        productArchetype: 'admin',
        requiredContracts: ['DiscoveryShell'],
        localAdapters: [{ contract: 'LocalShell', path: 'src/ui/LocalShell.tsx', status: 'active' }],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-27',
        compliance: {
          strictMode: true,
          approvedShellPrimitives: ['DiscoveryShell'],
        },
      }, null, 2),
      'src/ui/LocalShell.tsx': `
        import { AppShell as MantineAppShell } from '@mantine/core';
        export function LocalShell() {
          return <MantineAppShell />;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);

    expect(rules).toContain('strict.shell.local-adapter');
    expect(rules).toContain('strict.shell.mantine-app-shell');
  });

  it('passes strict mode when adapters are approved exceptions and no local wrappers exist', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.3',
        productArchetype: 'hybrid',
        requiredContracts: ['DiscoveryShell', 'ActionBar'],
        localAdapters: [{ contract: 'DetailProfileShell', path: 'src/gds/detail.tsx', status: 'exception' }],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-27',
        compliance: {
          strictMode: true,
          approvedDetailPrimitives: ['DetailProfileShell'],
          approvedTemporaryExceptions: ['DetailProfileShell'],
        },
      }, null, 2),
      'src/gds/detail.tsx': `export const placeholder = true;`,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.filter((finding) => finding.rule.startsWith('strict.'))).toHaveLength(0);
  });
});
