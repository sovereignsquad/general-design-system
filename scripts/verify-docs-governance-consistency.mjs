import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();

const ssotDocs = [
  'README.md',
  'FOUNDATION.md',
  'COMPONENTS_AND_PATTERNS.md',
  'GOVERNANCE_AND_ADOPTION.md',
  'THEME_GOVERNANCE.md',
  'INSTALLATION_GUIDE.md',
  'COMPATIBILITY_AND_RELEASES.md',
];

const requiredThemeLanes = [
  'gdsTheme',
  'gdsDarkPublicTheme',
  'gdsFlatSurfaceTheme',
  'gdsEditorialPublicTheme',
  'createPublicBrandTheme',
];

const failures = [];

for (const relativeFile of ssotDocs) {
  const source = readFileSync(resolve(root, relativeFile), 'utf8');

  const versionMatch = source.match(/^Version:\s*(.+)$/m);
  if (!versionMatch) {
    failures.push(`${relativeFile} is missing a "Version:" header.`);
    continue;
  }

  if (versionMatch[1].trim() !== version) {
    failures.push(`${relativeFile} version header is "${versionMatch[1].trim()}" but VERSION is "${version}".`);
  }

  if (!/^Last updated:\s*\d{4}-\d{2}-\d{2}$/m.test(source)) {
    failures.push(`${relativeFile} must include a "Last updated: YYYY-MM-DD" header.`);
  }
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
if (readme.includes('legacy/compatibility surface')) {
  failures.push('README.md still describes canonical reference-site primitives as a legacy/compatibility surface.');
}

const installGuide = readFileSync(resolve(root, 'INSTALLATION_GUIDE.md'), 'utf8');
const themeGovernance = readFileSync(resolve(root, 'THEME_GOVERNANCE.md'), 'utf8');

for (const lane of requiredThemeLanes) {
  if (!installGuide.includes(lane)) {
    failures.push(`INSTALLATION_GUIDE.md is missing canonical theme lane: ${lane}`);
  }
  if (!themeGovernance.includes(lane)) {
    failures.push(`THEME_GOVERNANCE.md is missing canonical theme lane: ${lane}`);
  }
}

if (failures.length > 0) {
  console.error('Docs/governance consistency verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Docs/governance consistency verification passed for ${version}.`);
