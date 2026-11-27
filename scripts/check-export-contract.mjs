import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();

const packages = [
  'packages/gds-theme',
  'packages/gds-core',
  'packages/gds-admin',
  'packages/gds',
];

const mismatches = [];

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const entryPath = join(dir, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      walk(entryPath, found);
    } else {
      found.push(entryPath);
    }
  }

  return found;
}

for (const packageDir of packages) {
  const packageRoot = resolve(root, packageDir);
  const pkg = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));

  for (const exportConfig of Object.values(pkg.exports)) {
    const exportTargets =
      typeof exportConfig === 'string' ? [exportConfig] : Object.values(exportConfig);

    for (const exportTarget of exportTargets) {
      const resolvedTarget = resolve(packageRoot, exportTarget);
      if (!existsSync(resolvedTarget)) {
        mismatches.push(`${pkg.name} is missing published export target ${exportTarget}`);
      }
    }
  }

  // What a server entry may reach is checked by verify-server-entry-boundaries.mjs: a 'use client'
  // module is a client boundary there, and the rules apply to the modules that load on the server.

  const distFiles = walk(resolve(packageRoot, 'dist')).filter((filePath) => ['.js', '.mjs', '.d.ts'].includes(extname(filePath)));
  const unexpectedClientDirective = distFiles.filter(
    (filePath) => filePath.includes('/server.') && readFileSync(filePath, 'utf8').includes("'use client'"),
  );

  if (unexpectedClientDirective.length) {
    mismatches.push(
      `${pkg.name} server dist output contains client directive: ${unexpectedClientDirective
        .map((filePath) => filePath.replace(`${packageRoot}/`, ''))
        .join(', ')}`,
    );
  }
}

if (mismatches.length) {
  console.error('Export contract verification failed:');
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch}`);
  }
  process.exit(1);
}

console.log('Export contract verification passed.');
