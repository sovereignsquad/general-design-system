import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'apps/playground/gds-adoption.json');
const appPath = resolve(root, 'apps/playground/src/App.tsx');
const localeCoveragePath = resolve(root, 'apps/playground/src/locale-coverage.ts');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const appSource = readFileSync(appPath, 'utf8');
const localeCoverageSource = readFileSync(localeCoveragePath, 'utf8');
const infoPagesSource = readFileSync(resolve(root, 'apps/playground/src/info-pages.tsx'), 'utf8');

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

const requiredCopyObjectsByRoute = new Map([
  ['/', 'export function OverviewPage()'],
  ['/install', 'export function InstallPage()'],
  ['/api', 'export function ApiReferencePage()'],
  ['/maturity', 'export function MaturityPage()'],
  ['/use-cases', 'export function UseCasesPage()'],
  ['/governance', 'export function RulebookPage()'],
  ['/themes', 'export function TokensPage'],
]);

function ensureLocalesInCopyBlock(routePrefix, marker, locales) {
  const markerIndex = infoPagesSource.indexOf(marker);
  if (markerIndex === -1) {
    failures.push(`info-pages.tsx must define copy block marker "${marker}" for route ${routePrefix}.`);
    return;
  }

  const blockSource = infoPagesSource.slice(markerIndex, markerIndex + 60000);
  for (const locale of locales) {
    if (locale === 'en') {
      continue;
    }
    const localeKey = `${locale}: {`;
    const localeBranch = `locale === '${locale}'`;
    if (!blockSource.includes(localeKey) && !blockSource.includes(localeBranch)) {
      failures.push(`info-pages.tsx copy block for route ${routePrefix} must include locale "${locale}".`);
    }
  }
}

for (const rule of localizedRouteCoverage ?? []) {
  const marker = requiredCopyObjectsByRoute.get(rule.routePrefix);
  if (!marker) {
    continue;
  }
  ensureLocalesInCopyBlock(rule.routePrefix, marker, rule.fullCopyLocales ?? []);
}

for (const match of localeCoverageSource.matchAll(/routePrefix:\s*'([^']+)'/g)) {
  const routePrefix = match[1];
  const existsInManifest = (localizedRouteCoverage ?? []).some((rule) => rule.routePrefix === routePrefix);
  if (!existsInManifest) {
    failures.push(`apps/playground/gds-adoption.json must declare localizedRouteCoverage for ${routePrefix}.`);
  }
}

if (failures.length > 0) {
  console.error('Locale coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Locale coverage verification passed.');
