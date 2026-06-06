import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const apiRegistryPath = resolve(root, 'apps/playground/src/api-reference-registry.ts');
const patternCoveragePath = resolve(root, 'apps/playground/src/pattern-export-coverage.ts');

const apiRegistrySource = readFileSync(apiRegistryPath, 'utf8');
const patternCoverageSource = readFileSync(patternCoveragePath, 'utf8');

const packageSourceDirs = {
  '@doneisbetter/gds-theme': resolve(root, 'packages/gds-theme/src'),
  '@doneisbetter/gds-core': resolve(root, 'packages/gds-core/src'),
  '@doneisbetter/gds-admin': resolve(root, 'packages/gds-admin/src'),
};

const ignoredExports = new Set([
  'PROVIDER_IDENTITY_REGISTRY',
  'ar',
  'de',
  'en',
  'es',
  'fr',
  'gdsLocales',
  'he',
  'hu',
  'it',
  'ru',
]);

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

function collectRuntimeExports(sourceDir) {
  const names = new Set();
  for (const file of walk(sourceDir)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/export\s+(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

const coverageEntries = [
  ...patternCoverageSource.matchAll(
    /\{\s*packageName:\s*'([^']+)'[\s\S]*?exportName:\s*'([^']+)'[\s\S]*?status:\s*'([^']+)'[\s\S]*?registryId:\s*'([^']+)'/g,
  ),
].map((match) => ({
  packageName: match[1],
  exportName: match[2],
  status: match[3],
  registryId: match[4],
}));

const failures = [];
const seenCoverage = new Set();

for (const entry of coverageEntries) {
  const key = `${entry.packageName}:${entry.exportName}`;
  if (seenCoverage.has(key)) {
    failures.push(`Duplicate pattern export coverage entry: ${key}`);
  }
  seenCoverage.add(key);
}

for (const [packageName, sourceDir] of Object.entries(packageSourceDirs)) {
  for (const exportName of collectRuntimeExports(sourceDir)) {
    if (ignoredExports.has(exportName)) {
      continue;
    }

    const key = `${packageName}:${exportName}`;
    if (!seenCoverage.has(key)) {
      failures.push(`Missing API documentation registry source coverage for ${key}`);
    }
  }
}

for (const snippet of [
  'export interface ApiReferenceEntry',
  'export const apiReferenceEntries',
  'runtimeLane',
  'accessibility',
  'testing',
  'getApiReferenceSummary',
]) {
  if (!apiRegistrySource.includes(snippet)) {
    failures.push(`api-reference-registry.ts must include ${snippet}.`);
  }
}

for (const entry of coverageEntries) {
  for (const field of [entry.packageName, entry.exportName, entry.registryId]) {
    if (!apiRegistrySource.includes(field) && !patternCoverageSource.includes(field)) {
      failures.push(`API registry cannot resolve ${field} for ${entry.packageName}:${entry.exportName}.`);
    }
  }
}

if (failures.length) {
  console.error('API docs coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`API docs coverage verification passed for ${coverageEntries.length} documented exports.`);
