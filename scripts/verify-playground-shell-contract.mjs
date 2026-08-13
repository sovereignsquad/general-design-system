import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const appPath = resolve(root, 'apps/playground/src/App.tsx');
const manifestPath = resolve(root, 'apps/playground/gds-adoption.json');
const appSource = readFileSync(appPath, 'utf8');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const failures = [];

if (!appSource.includes('DocsShell')) {
  failures.push('apps/playground/src/App.tsx must use DocsShell as the official docs-site shell contract.');
}

if (!appSource.includes('<DocsShell')) {
  failures.push('apps/playground/src/App.tsx must render <DocsShell> in the runtime tree.');
}

if (!appSource.includes('DocsHeaderActionSelect')) {
  failures.push('apps/playground/src/App.tsx must use DocsHeaderActionSelect for localized header actions.');
}

if (appSource.includes('ReferenceSiteShell')) {
  failures.push('apps/playground/src/App.tsx may not use ReferenceSiteShell for the official site shell path.');
}

if (appSource.includes("from '@mantine/core'")) {
  failures.push('apps/playground/src/App.tsx may not import from @mantine/core; use GDS primitives only.');
}

if (!manifest.requiredContracts?.includes('DocsShell')) {
  failures.push('apps/playground/gds-adoption.json must declare DocsShell in requiredContracts.');
}

if (manifest.requiredContracts?.includes('ReferenceSiteShell')) {
  failures.push('apps/playground/gds-adoption.json may not require ReferenceSiteShell for the official site path.');
}

if (!manifest.compliance?.approvedShellPrimitives?.includes('DocsShell')) {
  failures.push('apps/playground/gds-adoption.json must declare DocsShell in compliance.approvedShellPrimitives.');
}

// Issue 605. The site tells consumers "One GdsProvider at the app root — never nest a second
// one". Nothing checked that the site itself obeys it, so the rule was advice the reference
// implementation could quietly break. A nested provider is not a cosmetic mistake: the inner
// one re-declares the theme, so theme identity, colour scheme and the governed variant lane
// stop agreeing between subtrees — the class of bug issue 597 traced.
{
  const providerSources = ['apps/playground/src/App.tsx', 'apps/playground/src/main.tsx'];
  let mounts = 0;
  for (const rel of providerSources) {
    const file = resolve(root, rel);
    if (!existsSync(file)) {
      failures.push(`${rel} is missing; the single-provider check would silently pass.`);
      continue;
    }
    // Opening tags only: the closing tag and the import are not mounts.
    mounts += (readFileSync(file, 'utf8').match(/<GdsProvider(?=[\s>])/g) ?? []).length;
  }
  if (mounts === 0) failures.push('No <GdsProvider> mount found in the playground; the site cannot demonstrate the rule it states.');
  if (mounts > 1) failures.push(`Found ${mounts} <GdsProvider> mounts in the playground. The site states "never nest a second one" — it has to obey that itself.`);
}

if (failures.length > 0) {
  console.error('Playground shell contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Playground shell contract verification passed.');
