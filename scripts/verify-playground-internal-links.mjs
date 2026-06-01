import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const files = [
  'apps/playground/src/App.tsx',
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/pattern-pages.tsx',
  'apps/playground/src/showcase-pages.tsx',
];

const forbiddenLegacyPaths = [
  '/general-design-system/tokens',
  '/general-design-system/rulebook',
];

const failures = [];

for (const relativeFile of files) {
  const source = readFileSync(resolve(root, relativeFile), 'utf8');
  for (const legacyPath of forbiddenLegacyPaths) {
    if (source.includes(legacyPath)) {
      failures.push(`${relativeFile} references legacy route "${legacyPath}". Use canonical route paths.`);
    }
  }
}

if (failures.length > 0) {
  console.error('Playground internal-link verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Playground internal-link verification passed.');
