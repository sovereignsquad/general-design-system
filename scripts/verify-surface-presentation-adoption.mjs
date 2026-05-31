import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const registrySource = readFileSync(resolve(root, 'apps/playground/src/pattern-registry.ts'), 'utf8');
const patternPagesSource = readFileSync(resolve(root, 'apps/playground/src/pattern-pages.tsx'), 'utf8');
const playbookSource = readFileSync(resolve(root, 'ADOPTION_AND_MIGRATION_PLAYBOOK.md'), 'utf8');

const failures = [];

for (const id of ["id: 'state-blocks'", "id: 'section-panels'"]) {
  if (!registrySource.includes(id)) {
    failures.push(`Missing required pattern registry coverage: ${id}`);
  }
}

if (!patternPagesSource.includes('presentation="centered"')) {
  failures.push('Pattern demos must include centered surface-presentation usage.');
}

if (!patternPagesSource.includes('presentation="fill"')) {
  failures.push('Pattern demos must include fill surface-presentation usage.');
}

if (!playbookSource.includes('Surface presentation migration')) {
  failures.push('Adoption playbook must include a Surface presentation migration section.');
}

if (!playbookSource.includes('inline') || !playbookSource.includes('centered') || !playbookSource.includes('fill')) {
  failures.push('Adoption playbook must document inline/centered/fill presentation modes.');
}

if (failures.length > 0) {
  console.error('Surface presentation adoption verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Surface presentation adoption verification passed.');
