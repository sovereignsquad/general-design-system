import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifests = [
  'apps/playground/gds-adoption.json',
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];
const explorerSource = readFileSync(resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.tsx'), 'utf8');
const playgroundAppSource = readFileSync(resolve(root, 'apps/playground/src/App.tsx'), 'utf8');
const runtimeTestSource = readFileSync(resolve(root, 'apps/playground/src/app-theme-runtime.test.tsx'), 'utf8');
const themeGovernanceSource = readFileSync(resolve(root, 'THEME_GOVERNANCE.md'), 'utf8');
const complianceToolkitSource = readFileSync(resolve(root, 'COMPLIANCE_TOOLKIT.md'), 'utf8');

const canonicalThemeLanes = [
  'gdsTheme',
  'gdsDarkPublicTheme',
  'gdsFlatSurfaceTheme',
  'gdsEditorialPublicTheme',
  'createPublicBrandTheme',
];

const failures = [];

for (const manifestPath of manifests) {
  const absolutePath = resolve(root, manifestPath);
  const manifest = JSON.parse(readFileSync(absolutePath, 'utf8'));
  const lanes = manifest.compliance?.approvedThemeLanes ?? [];
  const ownershipPaths = manifest.compliance?.themeOwnershipPaths ?? [];

  if (!Array.isArray(lanes) || lanes.length === 0) {
    failures.push(`${manifestPath} must declare compliance.approvedThemeLanes.`);
  }

  if (!Array.isArray(ownershipPaths) || ownershipPaths.length === 0) {
    failures.push(`${manifestPath} must declare at least one compliance.themeOwnershipPaths entry.`);
  }

  const missingCanonicalLane = canonicalThemeLanes.find((lane) => !lanes.includes(lane));
  if (missingCanonicalLane) {
    failures.push(`${manifestPath} is missing canonical approvedThemeLane "${missingCanonicalLane}".`);
  }
}

const requiredExplorerProof = [
  'Light, dark, and auto proof',
  'Unsupported lane boundary',
  'Compare against a second shipped preset',
  'Reset theme lab',
  'extendGdsTheme(...) / createTheme(...) / mergeMantineTheme(...)',
];

for (const proof of requiredExplorerProof) {
  if (!explorerSource.includes(proof)) {
    failures.push(`ReferenceThemeExplorer must include theme-governance proof: ${proof}`);
  }
}

for (const lane of canonicalThemeLanes) {
  if (!themeGovernanceSource.includes(lane)) {
    failures.push(`THEME_GOVERNANCE.md must document approved lane "${lane}".`);
  }
}

if (!themeGovernanceSource.includes('3.0.0 theme explorer proof contract')) {
  failures.push('THEME_GOVERNANCE.md must document the 3.0.0 theme explorer proof contract.');
}

const requiredRuntimeGovernance = [
  'Runtime persistence contract',
  'Store only serializable theme intent',
  'What ruins the system',
  'data-gds-theme-runtime',
  'data-gds-font-lane',
  'direct links to nested routes',
  'static-host SPA fallback reloads',
];

for (const proof of requiredRuntimeGovernance) {
  if (!themeGovernanceSource.includes(proof)) {
    failures.push(`THEME_GOVERNANCE.md must document runtime persistence governance: ${proof}`);
  }
}

const requiredPlaygroundRuntimeContract = [
  'gds-reference-theme-selection',
  'createThemeSelection',
  'loadThemeSelection',
  'persistThemeSelection',
  'resolveGdsThemePreset',
  'applyGdsFontLane',
  'data-gds-theme-runtime',
  'data-gds-font-lane',
  'initialThemeSelection',
];

for (const proof of requiredPlaygroundRuntimeContract) {
  if (!playgroundAppSource.includes(proof)) {
    failures.push(`apps/playground/src/App.tsx must preserve runtime theme persistence contract: ${proof}`);
  }
}

const requiredRuntimeRegressionProof = [
  'persists selected theme and font lane across direct route loads',
  '/general-design-system/live-demos/surfaces',
  'oceanic',
  'space-grotesk',
  'gds-reference-theme-selection',
];

for (const proof of requiredRuntimeRegressionProof) {
  if (!runtimeTestSource.includes(proof)) {
    failures.push(`app-theme-runtime.test.tsx must cover runtime persistence regression: ${proof}`);
  }
}

if (!complianceToolkitSource.includes('offending theme ownership file') || !complianceToolkitSource.includes('approved remediation path')) {
  failures.push('COMPLIANCE_TOOLKIT.md must document theme-governance compliance output requirements.');
}

if (failures.length > 0) {
  console.error('Theme governance verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Theme governance verification passed.');
