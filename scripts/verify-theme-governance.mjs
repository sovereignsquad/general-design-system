import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifests = [
  'apps/playground/gds-adoption.json',
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];
const explorerSource = readFileSync(resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.tsx'), 'utf8');
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
