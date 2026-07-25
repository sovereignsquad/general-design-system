import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();

const ssotDocs = [
  'README.md',
  'FOUNDATION.md',
  'COMPONENTS_AND_PATTERNS.md',
  'GOVERNANCE_AND_ADOPTION.md',
  'THEME_GOVERNANCE.md',
  'DEPENDENCY_GOVERNANCE.md',
  'INSTALLATION_GUIDE.md',
  'COMPATIBILITY_AND_RELEASES.md',
  'CONTRIBUTING.md',
  'PATTERN_SERVICE_MODEL.md',
  'SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md',
  'PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md',
  'TEMPLATES/README.md',
  // The accessibility conformance report is refreshed per release (its version
  // header must track VERSION), so it is governed like the other SSOT docs (#447).
  'VPAT_CONFORMANCE.md',
];

const requiredThemeLanes = [
  'gdsTheme',
  'gdsDarkPublicTheme',
  'gdsFlatSurfaceTheme',
  'gdsEditorialPublicTheme',
  'createPublicBrandTheme',
];

const failures = [];

function listMarkdownFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'dist') {
      continue;
    }

    const path = resolve(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...listMarkdownFiles(path));
    } else if (path.endsWith('.md')) {
      files.push(path);
    }
  }

  return files;
}

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

const docsWithAbsoluteLocalLinks = listMarkdownFiles(root).filter((file) => {
  const source = readFileSync(file, 'utf8');
  return /\]\(\/Users\/Shared\/Projects\/general-design-system\//.test(source);
});

for (const file of docsWithAbsoluteLocalLinks) {
  failures.push(`${file.replace(`${root}/`, '')} contains a local filesystem Markdown link target instead of a repository-relative link.`);
}

const installGuide = readFileSync(resolve(root, 'INSTALLATION_GUIDE.md'), 'utf8');
const themeGovernance = readFileSync(resolve(root, 'THEME_GOVERNANCE.md'), 'utf8');
const implementationPlan = readFileSync(resolve(root, 'GDS_3_0_IMPLEMENTATION_PLAN.md'), 'utf8');
const siteCopy = readFileSync(resolve(root, 'apps/playground/src/site-copy.ts'), 'utf8')
  + readFileSync(resolve(root, 'apps/playground/src/page-copy.ts'), 'utf8');

for (const lane of requiredThemeLanes) {
  if (!installGuide.includes(lane)) {
    failures.push(`INSTALLATION_GUIDE.md is missing canonical theme lane: ${lane}`);
  }
  if (!themeGovernance.includes(lane)) {
    failures.push(`THEME_GOVERNANCE.md is missing canonical theme lane: ${lane}`);
  }
}

if (implementationPlan.includes('Current stable baseline: 2.6.7')) {
  failures.push('GDS_3_0_IMPLEMENTATION_PLAN.md still references a pre-release stable baseline.');
}

if (!siteCopy.includes('Dependency governance is now explicit')) {
  failures.push('Governance page copy does not describe the current dependency-governance release.');
}

if (siteCopy.includes('What changed in 3.4.14') && siteCopy.includes('Theme ownership now includes full CSS VibeThemes')) {
  failures.push('Governance page copy still describes the previous theme release as the current 3.4.14 change.');
}

if (failures.length > 0) {
  console.error('Docs/governance consistency verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Docs/governance consistency verification passed for ${version}.`);
