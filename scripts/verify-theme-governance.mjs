import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifests = [
  'apps/playground/gds-adoption.json',
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];

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

if (failures.length > 0) {
  console.error('Theme governance verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Theme governance verification passed.');
