import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { createAdoptionReport, createExceptionLifecycleReport, formatAdoptionReport, formatReport, runComplianceCheck } from './index.js';

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

describe('@sovereignsquad/gds-compliance strict mode', () => {
  it('flags local shell adapters and Mantine AppShell wrappers in strict mode', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
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
    expect(rules).toContain('strict.import.mantine-core');
  });

  it('flags strict consumer import, raw control, browser dialog, raw table, and inline-style drift', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.2.0',
        productArchetype: 'admin',
        requiredContracts: ['AdminTextInput', 'AdminDataTable', 'GdsIcon'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-06',
        compliance: { strictMode: true },
      }, null, 2),
      'src/AdminPage.tsx': `
        import { Button } from '@mantine/core';
        import { IconTrash } from '@tabler/icons-react';
        export function AdminPage() {
          window.confirm('Delete?');
          return <div style={{ color: 'red', backgroundColor: '#123456', borderRadius: 12 }}><button>Delete</button><table><tbody><tr><td>1</td></tr></tbody></table></div>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);

    expect(rules).toContain('strict.import.mantine-core');
    expect(rules).toContain('strict.import.tabler-icons');
    expect(rules).toContain('strict.raw-control');
    expect(rules).toContain('strict.browser-dialog');
    expect(rules).toContain('strict.raw-table');
    expect(rules).toContain('strict.inline-style');
    expect(rules).toContain('strict.inline-color');
    expect(rules).toContain('strict.raw-color');
    expect(rules).toContain('strict.non-token-radius');
    expect(report.findings.find((finding) => finding.rule === 'strict.inline-style')?.message).toContain('GdsSafeBox');
  });

  it('allows raw brand values only in declared strict theme ownership lanes', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.8.0',
        productArchetype: 'public',
        requiredContracts: ['GdsProvider'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-30',
        compliance: {
          strictMode: true,
          themeOwnershipPaths: ['src/theme/**'],
        },
      }, null, 2),
      'src/theme/brand.ts': `
        export const brand = { gold: '#d7a433', radius: 12 };
      `,
      'src/cards/LocalCard.tsx': `
        export function LocalCard() {
          return <section style={{ backgroundColor: '#d7a433', borderRadius: 12 }}>Card</section>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const strictFindings = report.findings.filter((finding) => finding.rule.startsWith('strict.'));
    const themeFindings = strictFindings.filter((finding) => finding.file === 'src/theme/brand.ts');
    const cardRules = strictFindings.filter((finding) => finding.file === 'src/cards/LocalCard.tsx').map((finding) => finding.rule);

    expect(themeFindings).toEqual([]);
    expect(cardRules).toEqual(expect.arrayContaining([
      'strict.raw-color',
      'strict.inline-color',
      'strict.non-token-radius',
    ]));
  });

  it('suppresses strict drift only when the exception category and status match the violation family', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.2.0',
        productArchetype: 'public',
        requiredContracts: ['PublicCaptureFlow'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Capture hardware controls',
            category: 'runtime-constraint',
            scope: ['src/capture/HardwareControls.tsx'],
            reason: 'Native hardware controls are temporarily runtime-owned.',
            allowedImplementation: ['Bounded hardware slot'],
            mustStillUse: ['PublicCaptureFlow'],
            mustNotDo: ['Replace GDS shell'],
            owner: 'platform-ui',
            reviewDate: '2026-06-06',
            exitCondition: 'Replace once hardware controls are package-native.',
            status: 'temporary',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-06',
        compliance: { strictMode: true },
      }, null, 2),
      'src/capture/HardwareControls.tsx': `
        export function HardwareControls() {
          window.confirm('Retry?');
          return <button>Runtime control</button>;
        }
      `,
      'src/capture/Unrelated.tsx': `
        import { IconTrash } from '@tabler/icons-react';
        export function Unrelated() { return <IconTrash />; }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const strictFindings = report.findings.filter((finding) => finding.rule.startsWith('strict.'));

    expect(strictFindings.map((finding) => finding.rule)).not.toContain('strict.browser-dialog');
    expect(strictFindings.map((finding) => finding.rule)).not.toContain('strict.raw-control');
    expect(strictFindings.map((finding) => finding.rule)).toContain('strict.import.tabler-icons');
  });

  it('flags local card, upload, reporting, and auth wrappers in strict mode', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'hybrid',
        requiredContracts: ['ListingCard', 'MediaField', 'ReportingSection', 'AuthShell'],
        localAdapters: [
          { contract: 'EventCard', path: 'src/EventCard.tsx', status: 'active' },
          { contract: 'AssetUpload', path: 'src/AssetUpload.tsx', status: 'active' },
          { contract: 'RevenueChart', path: 'src/RevenueChart.tsx', status: 'active' },
          { contract: 'SocialLogin', path: 'src/SocialLogin.tsx', status: 'active' },
        ],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-31',
        compliance: {
          strictMode: true,
          approvedListingPrimitives: ['ListingCard'],
          approvedMediaPrimitives: ['MediaField', 'UploadDropzone'],
          approvedReportingPrimitives: ['ReportingSection', 'ChartTokenPanel'],
          approvedAccessPrimitives: ['AuthShell', 'AccessRecoveryPanel'],
        },
      }, null, 2),
      'src/EventCard.tsx': `
        import { Card } from '@mantine/core';
        export function EventCard() { return <Card>Event</Card>; }
      `,
      'src/AssetUpload.tsx': `
        export function AssetUpload() { return <input type="file" />; }
      `,
      'src/RevenueChart.tsx': `
        export function RevenueChart() { return <canvas />; }
      `,
      'src/SocialLogin.tsx': `
        import { Button } from '@mantine/core';
        export function SocialLogin() { return <Button>Continue with Google</Button>; }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);

    expect(rules).toContain('strict.listing.local-adapter');
    expect(rules).toContain('strict.media.local-adapter');
    expect(rules).toContain('strict.reporting.local-adapter');
    expect(rules).toContain('strict.access.local-adapter');
    expect(rules).toContain('strict.listing.local-card-wrapper');
    expect(rules).toContain('strict.media.local-upload-wrapper');
    expect(rules).toContain('strict.reporting.local-chart-wrapper');
    expect(rules).toContain('strict.access.local-auth-wrapper');
  });

  it('flags local admin layout and form wrapper shims in strict mode', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.5.1',
        productArchetype: 'admin',
        requiredContracts: ['AdminCrudForm', 'AdminFormSection', 'AdminFormActions', 'AdminTextInput'],
        localAdapters: [{ contract: 'AdminFormShim', path: 'app/admin/events/new/page.tsx', status: 'active' }],
        approvedExceptions: [],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-07',
        compliance: {
          strictMode: true,
          approvedAdminPrimitives: ['AdminCrudForm', 'AdminFormSection', 'AdminFormActions', 'AdminTextInput'],
        },
      }, null, 2),
      'app/admin/events/new/page.tsx': `
        const Stack = ({ children }) => <div>{children}</div>;
        const TextInput = ({ label }) => <label>{label}<input /></label>;
        export default function NewEventPage() {
          return <Stack><TextInput label="Name" /></Stack>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);

    expect(rules).toContain('strict.admin.local-adapter');
    expect(rules).toContain('strict.admin.local-wrapper');
  });

  it('allows admin pages that consume canonical GDS admin primitives in strict mode', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.5.1',
        productArchetype: 'admin',
        requiredContracts: ['AdminCrudForm', 'AdminFormSection', 'AdminFormActions', 'AdminTextInput'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-07',
        compliance: {
          strictMode: true,
          approvedAdminPrimitives: ['AdminCrudForm', 'AdminFormSection', 'AdminFormActions', 'AdminTextInput'],
        },
      }, null, 2),
      'app/admin/events/new/page.tsx': `
        import { AdminCrudForm, AdminFormSection, AdminTextInput } from '@sovereignsquad/gds-admin';
        export default function NewEventPage() {
          return (
            <AdminCrudForm title="Create record">
              <AdminFormSection title="Details">
                <AdminTextInput name="name" label="Name" value="" />
              </AdminFormSection>
            </AdminCrudForm>
          );
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).not.toContain('strict.admin.local-wrapper');
  });

  it('keeps failing admin pages when canonical imports coexist with leftover local shims', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.5.1',
        productArchetype: 'admin',
        requiredContracts: ['AdminCrudForm', 'AdminTextInput'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-07',
        compliance: {
          strictMode: true,
          approvedAdminPrimitives: ['AdminCrudForm', 'AdminTextInput'],
        },
      }, null, 2),
      'app/admin/events/new/page.tsx': `
        import { AdminCrudForm, AdminTextInput } from '@sovereignsquad/gds-admin';
        const Stack = ({ children }) => <div>{children}</div>;
        export default function NewEventPage() {
          return <AdminCrudForm><Stack><AdminTextInput name="name" label="Name" value="" /></Stack></AdminCrudForm>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('strict.admin.local-wrapper');
  });

  it('passes strict mode when adapters are approved exceptions and no local wrappers exist', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        gdsVersion: '2.6.7',
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
        import { GdsProvider, extendGdsTheme } from '@sovereignsquad/gds-theme/client';

        const customTheme = extendGdsTheme({ primaryColor: 'blue' });

        export function Providers({ children }) {
          return <GdsProvider theme={customTheme}>{children}</GdsProvider>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('theme.noncanonical-extend-helper');
    const finding = report.findings.find((item) => item.rule === 'theme.noncanonical-extend-helper');
    expect(finding.message).toContain('src/providers.tsx');
    expect(finding.message).toContain('gdsTheme');
    expect(finding.message).toContain('createPublicBrandTheme');
  });

  it('passes canonical theme ownership when the repo uses approved shipped lanes', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
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
        import { GdsProvider, createPublicBrandTheme } from '@sovereignsquad/gds-theme/client';

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
        gdsVersion: '2.6.7',
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
    const finding = report.findings.find((item) => item.rule === 'theme.parallel-branding-layer');
    expect(finding.message).toContain('src/theme.ts');
    expect(finding.message).toContain('createPublicBrandTheme(...)');
  });

  it('flags SocialAuthButtons providers that are not in identity branding policy', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['SocialAuthButtons'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google', 'apple', 'github'],
            forbiddenCustomizations: ['variant'],
            minTouchTargetPx: 44,
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `
        import { SocialAuthButtons } from '@sovereignsquad/gds-core';

        export function Auth() {
          return (
            <SocialAuthButtons
              providers={[
                { id: 'google', href: '/auth/google' },
                { id: 'microsoft', href: '/auth/microsoft' },
              ]}
            />
          );
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);
    expect(rules).toContain('identity.provider.unapproved-id');
  });

  it('enforces identity policy for ProviderIdentityButtonGroup provider ids', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['ProviderIdentityButton'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google', 'apple'],
            forbiddenCustomizations: ['size'],
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `
        import { ProviderIdentityButtonGroup } from '@sovereignsquad/gds-core';

        export function Auth() {
          return (
            <ProviderIdentityButtonGroup
              providers={[
                { provider: 'google', href: '/auth/google' },
                { provider: 'microsoft', href: '/auth/microsoft' },
              ]}
            />
          );
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);
    expect(rules).toContain('identity.provider.unapproved-id');
  });

  it('enforces allowed provider identity variants from policy', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['ProviderIdentityButton'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-31',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google'],
            allowedVariants: ['neutral'],
            minTouchTargetPx: 44,
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `
        import { ProviderIdentityButton } from '@sovereignsquad/gds-core';

        export function Auth() {
          return <ProviderIdentityButton provider="google" variant="solid" />;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('identity.provider.disallowed-variant');
  });

  it('flags forbidden SocialAuthButtons customizations from policy', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['SocialAuthButtons'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google'],
            forbiddenCustomizations: ['leftSection', 'size'],
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `
        import { SocialAuthButtons } from '@sovereignsquad/gds-core';

        export function Auth() {
          return (
            <SocialAuthButtons
              providers={[{ id: 'google', leftSection: <span/> }]}
              size="md"
            />
          );
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const rules = report.findings.map((finding) => finding.rule);
    expect(rules).toContain('identity.provider.forbidden-customization');
  });

  it('warns when social auth appears custom-implemented with Mantine buttons', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['SocialAuthButtons'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google'],
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `
        import { Button } from '@mantine/core';

        export function Auth() {
          return <Button>Sign in with Google</Button>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('identity.provider.custom-controls.warn');
  });

  it('fails invalid identity provider branding variant values', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'public',
        requiredContracts: ['SocialAuthButtons'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-29',
        compliance: {
          identityProviderBranding: {
            approvedProviders: ['google'],
            allowedVariants: ['invalid-variant'],
          },
        },
      }, null, 2),
      'src/components/Auth.tsx': `export const x = true;`,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.map((finding) => finding.rule)).toContain('manifest.invalidComplianceConfig');
  });

  it('tracks dependency-boundary lifecycle metadata and flags expired removeBy dates', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.4.14',
        productArchetype: 'hybrid',
        requiredContracts: ['GdsIcon'],
        localAdapters: [],
        approvedExceptions: [
          {
            surface: 'Legacy icon bridge',
            category: 'dependency-boundary',
            scope: ['src/icons/*.tsx'],
            dependency: 'lucide-react',
            reason: 'Temporary icon bridge remains in use during migration.',
            replacementIssue: 'https://github.com/sovereignsquad/general-design-system/issues/299',
            rollbackPlan: 'Delete the bridge and move the remaining consumers to GdsIcon.',
            riskLevel: 'high',
            enforcementMode: 'error',
            allowedImplementation: ['Bridge-only import boundary'],
            mustStillUse: ['GDS semantics'],
            mustNotDo: ['Spread direct lucide imports into feature code'],
            a11yRequirements: ['Icon-only controls preserve accessible names'],
            testingRequirements: ['Bridge import coverage remains green'],
            observabilityRequirements: ['Bridge usage appears in adoption reports'],
            owner: 'platform-ui',
            reviewDate: '2026-06-01',
            removeBy: '2026-06-10',
            exitCondition: 'Remove after the icon migration completes.',
            status: 'active',
          },
        ],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-01',
      }, null, 2),
      'src/icons/LegacyIcon.tsx': `export const LegacyIcon = true;`,
    });

    const report = runComplianceCheck({
      manifestPath: join(fixture, 'gds-adoption.json'),
      currentDate: '2026-06-14',
    });

    const rules = report.findings.map((finding) => finding.rule);
    expect(rules).toContain('dependency-boundary.remove-by-expired');

    const lifecycle = createExceptionLifecycleReport(report.manifest, { currentDate: '2026-06-14' });
    expect(lifecycle.dependencyBoundaryCount).toBe(1);
    expect(lifecycle.items[0].expiryBucket).toBe('expired');
    expect(lifecycle.items[0].riskLevel).toBe('high');
  });

  it('creates adoption reports with score, debt, and markdown output', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '3.4.14',
        productArchetype: 'admin',
        requiredContracts: ['AdminTextInput'],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'partial',
        owner: 'platform-ui',
        lastReviewedAt: '2026-06-14',
        compliance: { strictMode: true },
      }, null, 2),
      'src/AdminPage.tsx': `
        import { Button } from '@mantine/core';
        export function AdminPage() {
          return <div style={{ color: 'red' }}><button>Delete</button><Button>Unsafe</Button></div>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json'), currentDate: '2026-06-14' });
    const adoptionReport = createAdoptionReport(report, { currentDate: '2026-06-14' });
    const markdown = formatAdoptionReport(adoptionReport, 'md');

    expect(adoptionReport.score).toBeLessThan(100);
    expect(['excellent', 'at-risk', 'blocked']).toContain(adoptionReport.status);
    expect(markdown).toContain('# GDS Adoption Report');
    expect(markdown).toContain('Top remediation steps');
  });

  // Issue 615 — two releases went red on rule matches INSIDE COMMENTS: `#600` (an issue
  // reference) read as a three-digit hex by the raw-colour rule, and "`<select>`'s options" in a
  // comment read as a native control. Comments are not code; only code is scanned.
  it('ignores rule-shaped text inside comments while still failing on the same shape in code', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        schemaVersion: 1,
        gdsVersion: '2.6.7',
        productArchetype: 'admin',
        requiredContracts: [],
        localAdapters: [],
        approvedExceptions: [],
        migrationStatus: 'governed',
        owner: 'platform-ui',
        lastReviewedAt: '2026-05-27',
        compliance: { strictMode: true },
      }, null, 2),
      'src/commented.tsx': `
        // Was static-reference under #600: the frame was built (#609) rather than staged.
        /* A <select>'s options include the locale names; <button> markup is shown for contrast. */
        // background: rgba(0, 0, 0, 0.4) was the old treatment before tokens.
        export function Commented() {
          const docsUrl = 'https://example.com/#section'; // a URL fragment, not a colour
          return <div>{docsUrl}</div>;
        }
      `,
      'src/violating.tsx': `
        export function Violating() {
          return <div style={{ background: '#600' }}><select><option>en</option></select></div>;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const byFile = (name) => report.findings.filter((f) => f.file.includes(name)).map((f) => f.rule);

    expect(byFile('commented.tsx')).toEqual([]);
    expect(byFile('violating.tsx')).toContain('strict.raw-color');
    expect(byFile('violating.tsx')).toContain('strict.raw-control');
  });
});

const REQUIRED_MANIFEST_FIELDS = {
  schemaVersion: 1,
  gdsVersion: '2.6.7',
  productArchetype: 'admin',
  requiredContracts: [],
  localAdapters: [],
  approvedExceptions: [],
  migrationStatus: 'governed',
  owner: 'platform-ui',
  lastReviewedAt: '2026-05-27',
};

describe('@sovereignsquad/gds-compliance design-rule scan (issue #652)', () => {
  it('flags an accent-classed token used as a background, with severity warn by default', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/Hero.tsx': `
        export function Hero() {
          return <div style={{ background: 'var(--gds-brand-accent)' }} />;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const finding = report.findings.find((f) => f.rule === 'design-rule.accent-as-background');

    expect(finding).toBeDefined();
    expect(finding.severity).toBe('warn');
    expect(finding.file).toMatch(/Hero\.tsx:\d+/);
    expect(finding.message).toContain('--gds-brand-accent');
  });

  it('does not flag the same token in a non-background (text color) property', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/Hero.tsx': `
        export function Hero() {
          return <div style={{ color: 'var(--gds-brand-accent)' }} />;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.filter((f) => f.rule === 'design-rule.accent-as-background')).toEqual([]);
  });

  it('raises severity to error when compliance.designRuleProfile.enforced is true', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        ...REQUIRED_MANIFEST_FIELDS,
        compliance: { designRuleProfile: { enforced: true } },
      }, null, 2),
      'src/Hero.tsx': `
        export function Hero() {
          return <div style={{ background: 'var(--gds-brand-accent)' }} />;
        }
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const finding = report.findings.find((f) => f.rule === 'design-rule.accent-as-background');
    expect(finding.severity).toBe('error');
  });

  it('flags a createBrandTheme(...) call with no designRuleProfile as an informational (warn) finding', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/theme.ts': `
        import { createBrandTheme } from '@sovereignsquad/gds-theme';
        export const theme = createBrandTheme('class-usa', { fonts });
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const finding = report.findings.find((f) => f.rule === 'design-rule.missing-profile');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('warn');
  });

  it('does not flag a createBrandTheme(...) call that already passes designRuleProfile, even across lines', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/theme.ts': `
        import { createBrandTheme } from '@sovereignsquad/gds-theme';
        export const theme = createBrandTheme('class-usa', {
          fonts,
          designRuleProfile: myProfile,
        });
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.filter((f) => f.rule === 'design-rule.missing-profile')).toEqual([]);
  });

  it('produces no design-rule findings for a repo with no createBrandTheme calls at all', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/App.tsx': `
        import { gdsTheme } from '@sovereignsquad/gds-theme';
        export const theme = gdsTheme;
      `,
    });

    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    expect(report.findings.filter((f) => f.rule.startsWith('design-rule.'))).toEqual([]);
  });

  it('formatReport renders a design-rule finding (text and json) the same way as any other finding', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/Hero.tsx': `export function Hero() { return <div style={{ background: 'var(--gds-brand-accent)' }} />; }`,
    });
    const report = runComplianceCheck({ manifestPath: join(fixture, 'gds-adoption.json') });
    const designRuleReport = { manifest: report.manifest, findings: report.findings.filter((f) => f.rule.startsWith('design-rule.')) };

    expect(formatReport(designRuleReport, 'text')).toContain('accent-as-background');
    expect(JSON.parse(formatReport(designRuleReport, 'json')).findings[0].rule).toBe('design-rule.accent-as-background');
  });
});

describe('gds-compliance check-design-rules CLI (issue #652)', () => {
  const BIN = resolve(import.meta.dirname, 'bin/gds-compliance.js');

  function runCli(args, cwd) {
    try {
      const output = execFileSync('node', [BIN, ...args], { cwd, encoding: 'utf8' });
      return { exitCode: 0, output };
    } catch (error) {
      return { exitCode: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
    }
  }

  it('exits 0 and reports only design-rule findings when not enforced', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({ ...REQUIRED_MANIFEST_FIELDS, compliance: {} }, null, 2),
      'src/Hero.tsx': `export function Hero() { return <div style={{ background: 'var(--gds-brand-accent)' }} />; }`,
    });

    const { exitCode, output } = runCli(['check-design-rules', '--manifest', './gds-adoption.json'], fixture);
    expect(exitCode).toBe(0);
    expect(output).toContain('design-rule.accent-as-background');
    // Filtered view: other rule families (e.g. manifest checks) must not appear.
    expect(output).not.toContain('manifest.missingField');
  });

  it('exits 1 when enforced and an accent-as-background finding exists', () => {
    const fixture = createFixture({
      'gds-adoption.json': JSON.stringify({
        ...REQUIRED_MANIFEST_FIELDS,
        compliance: { designRuleProfile: { enforced: true } },
      }, null, 2),
      'src/Hero.tsx': `export function Hero() { return <div style={{ background: 'var(--gds-brand-accent)' }} />; }`,
    });

    const { exitCode } = runCli(['check-design-rules', '--manifest', './gds-adoption.json'], fixture);
    expect(exitCode).toBe(1);
  });
});
