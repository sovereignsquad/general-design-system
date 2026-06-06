import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const packageDirs = [
  resolve(root, 'packages/gds-core/src'),
  resolve(root, 'packages/gds-admin/src'),
  resolve(root, 'packages/gds-theme/src'),
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

const forbiddenDialogPatterns = [
  /\bwindow\.alert\s*\(\s*['"`][^'"`]+['"`]/,
  /\bwindow\.confirm\s*\(\s*['"`][^'"`]+['"`]/,
  /\balert\s*\(\s*['"`][^'"`]+['"`]/,
  /\bconfirm\s*\(\s*['"`][^'"`]+['"`]/,
  /\bprompt\s*\(\s*['"`][^'"`]+['"`]/,
];

const failures = [];

for (const dir of packageDirs) {
  for (const file of walk(dir)) {
    if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      continue;
    }

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (forbiddenDialogPatterns.some((pattern) => pattern.test(line))) {
        failures.push(`${relative(root, file)}:${index + 1} uses native dialog copy instead of a GDS i18n feedback contract.`);
      }
    });
  }
}

if (failures.length) {
  console.error('i18n package copy verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('i18n package copy verification passed.');
