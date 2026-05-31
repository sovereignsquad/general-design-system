import { readFileSync } from 'node:fs';
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

if (failures.length > 0) {
  console.error('Playground shell contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Playground shell contract verification passed.');
