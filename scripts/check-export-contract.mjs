import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

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

function getLocalSpecifiers(source) {
  const regex = /(?:import|export)\s+(?:[^'"]+from\s+)?['"](\.[^'"]+)['"]/g;
  const matches = [];
  let match = regex.exec(source);

  while (match) {
    matches.push(match[1]);
    match = regex.exec(source);
  }

  return matches;
}

function resolveModule(baseFile, specifier) {
  const baseDir = dirname(baseFile);
  const candidateBase = resolve(baseDir, specifier);
  const candidates = [
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    `${candidateBase}.js`,
    `${candidateBase}.jsx`,
    join(candidateBase, 'index.ts'),
    join(candidateBase, 'index.tsx'),
    join(candidateBase, 'index.js'),
    join(candidateBase, 'index.jsx'),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function collectGraph(entryFile, seen = new Set()) {
  if (seen.has(entryFile)) {
    return seen;
  }

  seen.add(entryFile);
  const source = readFileSync(entryFile, 'utf8');

  for (const specifier of getLocalSpecifiers(source)) {
    const resolved = resolveModule(entryFile, specifier);
    if (resolved) {
      collectGraph(resolved, seen);
    }
  }

  return seen;
}

for (const packageDir of packages) {
  const packageRoot = resolve(root, packageDir);
  const pkg = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
  const sourceFiles = walk(resolve(packageRoot, 'src'));
  const clientOnlyFiles = new Set(
    sourceFiles.filter((filePath) => readFileSync(filePath, 'utf8').startsWith("'use client';")),
  );

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

  const serverEntry = resolve(packageRoot, 'src/server.ts');
  if (existsSync(serverEntry)) {
    const graph = collectGraph(serverEntry);
    const clientLeaks = [...graph].filter((filePath) => clientOnlyFiles.has(filePath));
    if (clientLeaks.length) {
      mismatches.push(
        `${pkg.name} server entrypoint reaches client-only files: ${clientLeaks
          .map((filePath) => filePath.replace(`${packageRoot}/`, ''))
          .join(', ')}`,
      );
    }
  }

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
