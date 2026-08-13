import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifests = [
  'apps/playground/gds-adoption.json',
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];
const explorerSource = readFileSync(resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.tsx'), 'utf8');
const ownedContrastSource = readFileSync(resolve(root, 'packages/gds-core/src/OwnedContrastSurface.tsx'), 'utf8');
const explorerCopySource = readFileSync(resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.copy.ts'), 'utf8');
const explorerContractSource = `${explorerSource}\n${explorerCopySource}`;
const themePresetSource = readFileSync(resolve(root, 'packages/gds-theme/src/theme-presets.ts'), 'utf8');
const vibeThemeSource = readFileSync(resolve(root, 'packages/gds-theme/src/vibe-themes.ts'), 'utf8');
const themeStylesSource = readFileSync(resolve(root, 'packages/gds-theme/styles.css'), 'utf8');
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
  'cosmic',
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
  if (!explorerContractSource.includes(proof)) {
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

  if (!vibeThemeSource.includes(`${presetId}:`) && !vibeThemeSource.includes(`'${presetId}':`)) {
    failures.push(`vibe-themes.ts must ship CSS VibeTheme "${presetId}".`);
  }
}

if (!explorerSource.includes('getGdsThemePresets()')) {
  failures.push('ReferenceThemeExplorer must source theme options from getGdsThemePresets().');
}

const requiredVibeThemeProof = [
  'getGdsVibeThemes',
  'CSS VibeTheme',
  'Current VibeTheme contract',
  'not bitmap backgrounds',
];

for (const proof of requiredVibeThemeProof) {
  if (!explorerContractSource.includes(proof)) {
    failures.push(`ReferenceThemeExplorer must include VibeTheme proof: ${proof}`);
  }
}

const requiredVibeRuntimeProof = [
  'getGdsVibeThemeCssVariables',
  'data-gds-theme-preset',
  '--gds-vibe-primary',
  '--gds-vibe-accent',
];

for (const proof of requiredVibeRuntimeProof) {
  if (!themeRuntimeSource.includes(proof) && !themeStylesSource.includes(proof) && !themeProviderTestSource.includes(proof)) {
    failures.push(`Theme runtime/styles/tests must preserve VibeTheme proof: ${proof}`);
  }
}

const requiredPresetContrastProof = [
  '--mantine-color-text: var(--gds-vibe-text)',
  '--mantine-color-dimmed: var(--gds-vibe-muted)',
  '--gds-vibe-control-text',
  '--gds-vibe-link',
  'data-gds-owned-contrast',
  'data-gds-local-contrast',
  '--gds-local-background',
  '--gds-local-radius',
  "html[data-mantine-color-scheme='dark'][data-gds-theme-preset]",
  ".mantine-Text-root[style*='--text-color: var(--mantine-color-red']",
  "html[data-mantine-color-scheme='dark'][data-gds-theme-preset='cosmic'] body",
  '--gds-vibe-danger',
];

for (const proof of requiredPresetContrastProof) {
  if (!themeStylesSource.includes(proof) && !explorerSource.includes(proof)) {
    failures.push(`Theme styles/explorer must preserve preset contrast proof: ${proof}`);
  }
}

if (/html\[data-gds-theme-preset='cosmic'\]\s+\.mantine-Paper-root[\s\S]*?border-radius:\s*28px/.test(themeStylesSource)) {
  failures.push('Cosmic preset must not force a fixed Paper/Card radius over component radius props.');
}

if (!themeStylesSource.includes("[data-gds-local-contrast] .mantine-Button-root[data-variant='default']")) {
  failures.push('Local contrast surfaces must override default buttons and controls inside preset pages.');
}

for (const proof of [
  'createGdsOwnedContrastTokens',
  'getGdsOwnedContrastProps',
  'data-gds-owned-contrast',
  'data-gds-local-contrast',
]) {
  if (!ownedContrastSource.includes(proof)) {
    failures.push(`Owned contrast helper must preserve proof: ${proof}`);
  }
}

if (!themeGovernanceSource.includes('Light mode and dark mode are scheme choices, not the full theme offering.')) {
  failures.push('THEME_GOVERNANCE.md must state that light/dark schemes are not the full theme offering.');
}

for (const proof of [
  'Owned contrast is a first-class contract',
  'BoundedPreviewSurface',
  'getGdsOwnedContrastProps',
  'verify:theme-trust-runtime',
]) {
  if (!themeGovernanceSource.includes(proof)) {
    failures.push(`THEME_GOVERNANCE.md must document theme trust hardening: ${proof}`);
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
  '/general-design-system/live-proofs/surfaces',
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
