import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'apps/playground/gds-adoption.json');
const appPath = resolve(root, 'apps/playground/src/App.tsx');
const localeCoveragePath = resolve(root, 'apps/playground/src/locale-coverage.ts');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const appSource = readFileSync(appPath, 'utf8');
const localeCoverageSource = readFileSync(localeCoveragePath, 'utf8');

const failures = [];

const localizedRouteCoverage = manifest.compliance?.localizedRouteCoverage;

if (!Array.isArray(localizedRouteCoverage) || localizedRouteCoverage.length === 0) {
  failures.push('apps/playground/gds-adoption.json must define compliance.localizedRouteCoverage.');
} else {
  for (const rule of localizedRouteCoverage) {
    if (typeof rule.routePrefix !== 'string' || rule.routePrefix.length === 0) {
      failures.push('localizedRouteCoverage rules must define a non-empty routePrefix.');
      continue;
    }

    if (!Array.isArray(rule.fullCopyLocales) || rule.fullCopyLocales.length === 0) {
      failures.push(`localizedRouteCoverage rule for ${rule.routePrefix} must define fullCopyLocales.`);
      continue;
    }

    for (const locale of rule.fullCopyLocales) {
      if (typeof locale !== 'string' || locale.length === 0) {
        failures.push(`localizedRouteCoverage rule for ${rule.routePrefix} contains invalid locale entry.`);
      }
    }

    if (!localeCoverageSource.includes(`routePrefix: '${rule.routePrefix}'`)) {
      failures.push(`locale-coverage.ts must include routePrefix ${rule.routePrefix}.`);
    }

    for (const locale of rule.fullCopyLocales) {
      if (!localeCoverageSource.includes(`'${locale}'`)) {
        failures.push(`locale-coverage.ts must include locale '${locale}' for ${rule.routePrefix}.`);
      }
    }
  }
}

if (!localeCoverageSource.includes('hasFullRouteLocalization')) {
  failures.push('locale-coverage.ts must export hasFullRouteLocalization for deterministic locale coverage checks.');
}

if (!appSource.includes("from './locale-coverage'")) {
  failures.push('App.tsx must import route coverage from locale-coverage.ts.');
}

if (!appSource.includes('Only routes listed as fully localized in the official coverage contract ship complete translated copy.')) {
  failures.push('App.tsx must keep locale disclosure copy aligned with route-coverage policy.');
}

if (failures.length > 0) {
  console.error('Locale coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Locale coverage verification passed.');
