import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();

// The governed set is derived, not listed. A document that declares `Status: Active SSOT`
// is claiming to describe the current system, so its `Version:` header must match VERSION.
// A hand-written array governs whatever someone remembered to add: this one covered 14 of
// the 43 documents that make that claim, and the other 29 sat four releases behind (#658).
//
// Documents declaring any other status — `Planned`, `Proposed`, `Decision record`,
// `Active reference` — are point-in-time records. Restamping them would make them claim to
// describe a release they predate, so they are reported rather than governed.
const SSOT_STATUS = 'Active SSOT';

/** Governed despite not declaring `Active SSOT`, each with the reason it still tracks VERSION. */
const ALSO_GOVERNED = {
  'CONTRIBUTING.md': 'Declares `Status: Active`; governed since before the derivation and describes the current contribution contract.',
  'TEMPLATES/README.md': 'Declares `Status: Reference`; the templates it indexes are consumed at the current version.',
};

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

const allDocs = listMarkdownFiles(root)
  .map((absolute) => absolute.replace(`${root}/`, ''))
  .sort();

const declaredStatus = (relative) =>
  (readFileSync(resolve(root, relative), 'utf8').match(/^Status:\s*(.+)$/m)?.[1] ?? '').trim();

const versionedDocs = allDocs.filter(
  (relative) => /^Version:\s*\S/m.test(readFileSync(resolve(root, relative), 'utf8')),
);

// A doc claiming Active SSOT status but carrying no Version header at all is invisible to the
// derivation below, which only ever inspects docs that already have one — the exact defect
// found in docs/MAP_SYSTEM.md, docs/SITE_ARCHITECTURE.md, and docs/ACCESS_GATE.md (#658
// follow-up). Scanning every doc for the status, not just the versioned subset, is what closes
// that blind spot rather than re-creating it.
for (const relative of allDocs) {
  if (versionedDocs.includes(relative)) continue;
  if (declaredStatus(relative) === SSOT_STATUS) {
    failures.push(`${relative} declares "Status: Active SSOT" but has no "Version:" header — invisible to this gate otherwise.`);
  }
}

const ssotDocs = versionedDocs.filter(
  (relative) => declaredStatus(relative) === SSOT_STATUS || relative in ALSO_GOVERNED,
);

// An empty or collapsed derivation would pass every check below without reading a thing.
// The floor is the count the hand-written array carried, so the derivation can never quietly
// govern less than the list it replaced.
const GOVERNED_FLOOR = 14;
if (ssotDocs.length < GOVERNED_FLOOR) {
  console.error(
    `Docs/governance consistency verification failed:\n`
    + `- derived only ${ssotDocs.length} governed document(s), below the floor of ${GOVERNED_FLOOR}. `
    + `Extraction is broken, not the repository empty.`,
  );
  process.exit(1);
}

for (const missing of Object.keys(ALSO_GOVERNED)) {
  if (!ssotDocs.includes(missing)) {
    failures.push(`${missing} is listed in ALSO_GOVERNED but carries no "Version:" header.`);
  }
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

// The AI Agent Guide states the live component count in prose (Rule 14: a checkable claim
// must be computed, not typed) rather than importing the generated constant, since it isn't a
// TypeScript module. Checked against the same source every other surface quotes, so a stale
// hand-typed number (this doc sat at "250+" against a real, gated 306 — deep-audit F4) fails
// the build instead of drifting silently.
const componentCensusSource = readFileSync(
  resolve(root, 'apps/playground/src/generated-component-census.ts'), 'utf8',
);
const componentCountMatch = componentCensusSource.match(/GDS_PUBLIC_COMPONENT_COUNT = (\d+);/);
if (!componentCountMatch) {
  failures.push('Could not read GDS_PUBLIC_COMPONENT_COUNT from generated-component-census.ts — extraction is broken, not the constant missing.');
} else {
  const componentCount = componentCountMatch[1];
  const aiAgentGuide = readFileSync(resolve(root, 'docs/AI_AGENT_GUIDE.md'), 'utf8');
  if (!aiAgentGuide.includes(`ships ${componentCount} components`)) {
    failures.push(`docs/AI_AGENT_GUIDE.md does not state the current component count (${componentCount}) — check it wasn't left stale after a regeneration.`);
  }
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

// Checks a standing statement (no version attached), not a release-specific claim.
if (!siteCopy.includes('Dependency governance is explicit')) {
  failures.push('Governance page copy no longer states the standing dependency-governance rule.');
}

if (siteCopy.includes('What changed in 3.4.14') && siteCopy.includes('Theme ownership now includes full CSS VibeThemes')) {
  failures.push('Governance page copy still describes the previous theme release as the current 3.4.14 change.');
}

// Report what this gate does not govern, so the exclusion set can never grow silently.
const ungoverned = versionedDocs.filter((relative) => !ssotDocs.includes(relative));
if (ungoverned.length > 0) {
  console.log(`  not governed (${ungoverned.length} versioned document(s), by their own declared status):`);
  for (const relative of ungoverned) {
    console.log(`    ${relative.padEnd(48)} ${declaredStatus(relative) || '<no Status header>'}`);
  }
}

if (failures.length > 0) {
  console.error('Docs/governance consistency verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Docs/governance consistency verification passed for ${version} across ${ssotDocs.length} governed document(s).`);
