import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifests = [
  'apps/playground/gds-adoption.json',
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];
const explorerSource = readFileSync(resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.tsx'), 'utf8');
const themePresetSource = readFileSync(resolve(root, 'packages/gds-theme/src/theme-presets.ts'), 'utf8');
const playgroundAppSource = readFileSync(resolve(root, 'apps/playground/src/App.tsx'), 'utf8');
const runtimeTestSource = readFileSync(resolve(root, 'apps/playground/src/app-theme-runtime.test.tsx'), 'utf8');
const themeRuntimeSource = readFileSync(resolve(root, 'packages/gds-theme/src/theme-runtime.ts'), 'utf8');
const themeProviderTestSource = readFileSync(resolve(root, 'packages/gds-theme/src/GdsProvider.test.tsx'), 'utf8');
const themeGovernanceSource = readFileSync(resolve(root, 'THEME_GOVERNANCE.md'), 'utf8');
const complianceToolkitSource = readFileSync(resolve(root, 'COMPLIANCE_TOOLKIT.md'), 'utf8');

const canonicalThemeLanes = [
  'gdsTheme',
  'gdsDarkPublicTheme',
  'gdsFlatSurfaceTheme',
  'gdsEditorialPublicTheme',
  'createPublicBrandTheme',
];

const colorfulThemePresetIds = [
  'sunset',
  'oceanic',
  'forest',
  'ruby',
  'amber',
  'neon-night',
  'skyline',
  'aurora',
  'coral',
  'mint',
  'orchid',
  'royal',
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

for (const presetId of colorfulThemePresetIds) {
  if (!themeGovernanceSource.includes(`\`${presetId}\``)) {
    failures.push(`THEME_GOVERNANCE.md must document colorful preset "${presetId}".`);
  }

  if (!themePresetSource.includes(`'${presetId}'`)) {
    failures.push(`theme-presets.ts must ship colorful preset "${presetId}".`);
  }
}

if (!explorerSource.includes('getGdsThemePresets()')) {
  failures.push('ReferenceThemeExplorer must source theme options from getGdsThemePresets().');
}

if (!themeGovernanceSource.includes('Light mode and dark mode are scheme choices, not the full theme offering.')) {
  failures.push('THEME_GOVERNANCE.md must state that light/dark schemes are not the full theme offering.');
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
  'useGdsThemePresetState',
  'initialThemeSelection',
];

for (const proof of requiredPlaygroundRuntimeContract) {
  if (!playgroundAppSource.includes(proof)) {
    failures.push(`apps/playground/src/App.tsx must preserve runtime theme persistence contract: ${proof}`);
  }
}

const requiredThemeRuntimeHookContract = [
  'useGdsThemePresetState',
  'createGdsThemePresetSelection',
  'setPreset',
  'setScheme',
  'setFontLane',
  'setBrandOptions',
  'reset',
  'resolveGdsThemePreset',
  'applyGdsFontLane',
  'data-gds-theme-runtime',
  'data-gds-font-lane',
  'localStorage.setItem',
];

for (const proof of requiredThemeRuntimeHookContract) {
  if (!themeRuntimeSource.includes(proof)) {
    failures.push(`theme-runtime.ts must preserve shared runtime preset hook contract: ${proof}`);
  }
}

const requiredRuntimeHookTestProof = [
  'exposes a persistent runtime preset hook for global theme switching',
  'gds-test-theme-runtime',
  'coral-dark-blue-true-false-space-grotesk',
];

for (const proof of requiredRuntimeHookTestProof) {
  if (!themeProviderTestSource.includes(proof)) {
    failures.push(`GdsProvider.test.tsx must cover shared runtime preset hook behavior: ${proof}`);
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
