import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const files = [
  'apps/playground/src/App.tsx',
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/pattern-pages.tsx',
  'apps/playground/src/showcase-pages.tsx',
];

const failures = [];

for (const relativeFile of files) {
  const source = readFileSync(resolve(root, relativeFile), 'utf8');

  if (source.includes("from '@mantine/core'") || source.includes('from "@mantine/core"')) {
    failures.push(`${relativeFile} may not import from @mantine/core. Use GDS package exports only.`);
  }

  if (/style=\{\{[\s\S]*?\}\}/m.test(source)) {
    failures.push(`${relativeFile} may not use inline style objects. Use GDS primitives/contracts instead.`);
  }
}

if (failures.length > 0) {
  console.error('Playground GDS-only verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Playground GDS-only verification passed.');
