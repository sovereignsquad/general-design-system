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
        gdsVersion: '2.6.6',
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
        gdsVersion: '2.6.6',
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

  it('fails legacy approved exceptions that do not use the canonical exception contract', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['PublicShell'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Map embed',
            reason: 'Third-party map engine remains outside canonical GDS scope.',
            owner: 'platform-ui',
            reviewDate: '2026-05-27',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-27',
      }, null, 2),
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('exception-required-fields');
  });

  it('fails approved exceptions that use over-broad scope patterns', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'hybrid',
        requiredContracts: ['DiscoveryShell'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Playback runtime',
            category: 'runtime-constraint',
            scope: ['src/**'],
            reason: 'Playback still depends on a runtime outside canonical package scope.',
            allowedImplementation: ['PlaybackSurface with bounded runtime slot'],
            mustStillUse: ['GDS layout tokens'],
            mustNotDo: ['Replace the GDS public shell'],
            owner: 'platform-ui',
            reviewDate: '2026-05-27',
            exitCondition: 'Replace once playback runtime can move into the package line.',
            status: 'temporary',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-27',
      }, null, 2),
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('exception-broad-scope');
  });

  it('fails stale approved exceptions whose scope no longer matches repository files', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['MapPanel'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Legacy creator stylesheet',
            category: 'product-authored-experience',
            scope: ['src/creator/theme.css.ts'],
            reason: 'Creator-authored experience styling remains temporarily local.',
            allowedImplementation: ['Bounded creator canvas only'],
            mustStillUse: ['GDS public shell', 'GDS consent controls'],
            mustNotDo: ['Replace shared app chrome'],
            a11yRequirements: ['Shared controls stay keyboard accessible'],
            testingRequirements: ['Fallback experience remains covered'],
            observabilityRequirements: ['Broken theme load is visible to operators'],
            owner: 'platform-ui',
            reviewDate: '2026-05-28',
            exitCondition: 'Replace with packaged creator theme lane.',
            status: 'temporary',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-28',
      }, null, 2),
      'src/app/page.tsx': `export default function Page() { return null; }`,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('exception-scope-no-matches');
  });

  it('fails local exception adapters that are not covered by an approved exception scope', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'hybrid',
        requiredContracts: ['PublicShell'],
        localAdapters: [
          { contract: 'CreatorExperienceShell', path: 'src/creator/CreatorExperienceShell.tsx', status: 'exception' },
        ],
        approvedExceptions: [
          {
            surface: 'Creator canvas css',
            category: 'product-authored-experience',
            scope: ['src/creator/theme/*.ts'],
            reason: 'Creator-authored experience styling remains temporarily local.',
            allowedImplementation: ['Bounded creator canvas only'],
            mustStillUse: ['GDS public shell', 'GDS consent controls'],
            mustNotDo: ['Replace shared app chrome'],
            a11yRequirements: ['Shared controls stay keyboard accessible'],
            testingRequirements: ['Fallback experience remains covered'],
            observabilityRequirements: ['Broken theme load is visible to operators'],
            owner: 'platform-ui',
            reviewDate: '2026-05-28',
            exitCondition: 'Replace with packaged creator theme lane.',
            status: 'temporary',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-28',
      }, null, 2),
      'src/creator/CreatorExperienceShell.tsx': `export function CreatorExperienceShell() { return null; }`,
      'src/creator/theme/tokens.ts': `export const themeToken = true;`,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('exception-adapter-outside-scope');
  });

  it('requires accessibility, testing, and observability metadata for creator-authored experience exceptions', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['PublicShell'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Creator-owned public canvas',
            category: 'product-authored-experience',
            scope: ['src/creator/canvas.tsx'],
            reason: 'A creator-owned branded experience canvas remains temporarily local.',
            allowedImplementation: ['Bounded creator canvas only'],
            mustStillUse: ['GDS public shell'],
            mustNotDo: ['Replace GDS app chrome'],
            owner: 'platform-ui',
            reviewDate: '2026-05-28',
            exitCondition: 'Replace once the shared creator canvas lane lands.',
            status: 'temporary',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-28',
      }, null, 2),
      'src/creator/canvas.tsx': `export const creatorCanvas = true;`,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('exception-product-authored-metadata');
  });

  it('flags direct consumer extendGdsTheme usage in declared theme ownership files', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['GdsProvider'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          approvedThemeLanes: [
            'gdsTheme',
            'gdsDarkPublicTheme',
            'gdsFlatSurfaceTheme',
            'gdsEditorialPublicTheme',
            'createPublicBrandTheme',
          ],
          themeOwnershipPaths: ['src/providers.tsx'],
        },
      }, null, 2),
      'src/providers.tsx': `
        import { GdsProvider, extendGdsTheme } from '@doneisbetter/gds-theme/client';

        const customTheme = extendGdsTheme({ primaryColor: 'blue' });

        export function Providers({ children }) {
          return <GdsProvider theme={customTheme}>{children}</GdsProvider>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('theme.noncanonical-extend-helper');
  });

  it('passes canonical theme ownership when the repo uses approved shipped lanes', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['GdsProvider'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          approvedThemeLanes: [
            'gdsTheme',
            'gdsDarkPublicTheme',
            'gdsFlatSurfaceTheme',
            'gdsEditorialPublicTheme',
            'createPublicBrandTheme',
          ],
          themeOwnershipPaths: ['src/providers.tsx'],
        },
      }, null, 2),
      'src/providers.tsx': `
        import { GdsProvider, createPublicBrandTheme } from '@doneisbetter/gds-theme/client';

        const theme = createPublicBrandTheme({
          flatSurfaces: true,
          overrides: { primaryColor: 'blue' },
        });

        export function Providers({ children }) {
          return <GdsProvider theme={theme}>{children}</GdsProvider>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.filter((finding) => finding.rule.startsWith('theme.'))).toHaveLength(0);
  });

  it('flags local Mantine theme construction in declared theme ownership files', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.6',
        productArchetype: 'public',
        requiredContracts: ['GdsProvider'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          approvedThemeLanes: [
            'gdsTheme',
            'gdsDarkPublicTheme',
            'gdsFlatSurfaceTheme',
            'gdsEditorialPublicTheme',
            'createPublicBrandTheme',
          ],
          themeOwnershipPaths: ['src/theme.ts'],
        },
      }, null, 2),
      'src/theme.ts': `
        import { createTheme } from '@mantine/core';

        export const appTheme = createTheme({
          primaryColor: 'blue',
        });
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('theme.parallel-branding-layer');
  });
});
