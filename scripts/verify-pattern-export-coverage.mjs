import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const registryPath = resolve(root, 'apps/playground/src/pattern-registry.ts');
const coveragePath = resolve(root, 'apps/playground/src/pattern-export-coverage.ts');

const registrySource = readFileSync(registryPath, 'utf8');
const coverageSource = readFileSync(coveragePath, 'utf8');

const registryIds = new Set([...registrySource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]));
const registryStatus = new Map();
const registrySourceComponents = new Map();

// Issue 608. `coverageStatus` is no longer written in the registry — it is DERIVED from the
// generated proven-pattern list, so an entry cannot claim a proof the catalog does not render.
// This gate therefore derives it the same way rather than reading a field that no longer
// exists; parsing for it silently produced "unknown" for all 113 entries, which this gate
// reported as a failure rather than passing over — the guard working.
const provenSource = readFileSync(resolve(root, 'apps/playground/src/generated-pattern-coverage.ts'), 'utf8');
const provenIds = new Set([...provenSource.matchAll(/"([^"]+)"/g)].map((match) => match[1]));
if (provenIds.size === 0) {
  throw new Error('Parsed 0 proven pattern ids — refusing to evaluate coverage against an empty set.');
}

for (const block of registrySource.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?\n\s*\},/g)) {
  const id = block[1];
  const body = block[0];
  const status = provenIds.has(id) ? 'live-proof' : 'static-reference';
  const sourceComponent = /sourceComponent:\s*'([^']+)'/.exec(body)?.[1];

  if (status) {
    registryStatus.set(id, status);
  }
  if (sourceComponent) {
    registrySourceComponents.set(id, sourceComponent);
  }
}

const coverageEntries = [
  ...coverageSource.matchAll(
    /\{\s*packageName:\s*'([^']+)'[\s\S]*?exportName:\s*'([^']+)'[\s\S]*?status:\s*'([^']+)'[\s\S]*?registryId:\s*'([^']+)'/g,
  ),
].map((match) => ({
  packageName: match[1],
  exportName: match[2],
  status: match[3],
  registryId: match[4],
}));

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

function collectPublicRuntimeExports(sourceDir) {
  const names = new Set();

  for (const file of walk(sourceDir)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/export\s+(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) {
      names.add(match[1]);
    }
  }

  return names;
}

const packageSourceDirs = {
  '@sovereignsquad/gds-theme': resolve(root, 'packages/gds-theme/src'),
  '@sovereignsquad/gds-core': resolve(root, 'packages/gds-core/src'),
  '@sovereignsquad/gds-admin': resolve(root, 'packages/gds-admin/src'),
};

import { INTERNAL_EXPORTS as ignoredExports } from './config/internal-exports.config.mjs';


const coveredByPackage = new Map();
for (const entry of coverageEntries) {
  const key = `${entry.packageName}:${entry.exportName}`;
  if (coveredByPackage.has(key)) {
    throw new Error(`Duplicate export coverage entry: ${key}`);
  }
  coveredByPackage.set(key, entry);
}

const failures = [];

for (const entry of coverageEntries) {
  const sourceDir = packageSourceDirs[entry.packageName];
  if (!sourceDir) {
    failures.push(`Unknown package in export coverage: ${entry.packageName}`);
    continue;
  }

  if (!registryIds.has(entry.registryId)) {
    failures.push(`${entry.packageName} ${entry.exportName} points to missing registry id: ${entry.registryId}`);
    continue;
  }

  if (entry.status === 'live-proof') {
    const status = registryStatus.get(entry.registryId);
    if (status !== 'live-proof') {
      failures.push(`${entry.packageName} ${entry.exportName} requires live-proof coverage, but ${entry.registryId} is ${status ?? 'unknown'}.`);
    }

    const sourceComponent = registrySourceComponents.get(entry.registryId);
    if (!sourceComponent || !sourceComponent.includes(entry.exportName)) {
      failures.push(`${entry.packageName} ${entry.exportName} requires sourceComponent evidence on ${entry.registryId}.`);
    }
  }
}

for (const [packageName, sourceDir] of Object.entries(packageSourceDirs)) {
  for (const exportName of collectPublicRuntimeExports(sourceDir)) {
    if (ignoredExports.has(exportName)) {
      continue;
    }

    const key = `${packageName}:${exportName}`;
    if (!coveredByPackage.has(key)) {
      failures.push(`Missing export coverage entry for ${key}`);
    }
  }
}

if (failures.length) {
  console.error('Pattern export coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Pattern export coverage verification passed.');
