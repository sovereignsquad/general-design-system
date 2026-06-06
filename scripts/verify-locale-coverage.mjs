import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'apps/playground/gds-adoption.json');
const siteCopyPath = resolve(root, 'apps/playground/src/site-copy.ts');
const localeCoveragePath = resolve(root, 'apps/playground/src/locale-coverage.ts');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const siteCopySource = readFileSync(siteCopyPath, 'utf8');
const localeCoverageSource = readFileSync(localeCoveragePath, 'utf8');

const failures = [];
const localizedRouteCoverage = manifest.compliance?.localizedRouteCoverage;
const expectedLocaleIds = new Set();

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
        continue;
      }

      expectedLocaleIds.add(locale);
    }
  }
}

for (const locale of expectedLocaleIds) {
  const registryKey = `${locale}: {`;
  if (!siteCopySource.includes(registryKey)) {
    failures.push(`site-copy.ts must register locale "${locale}" in siteLocaleRegistry and copy resources.`);
  }
}

for (const requiredExport of [
  'siteLocaleRegistry',
  'getSiteLocaleOptions',
  'getSiteRouteLabel',
  'getSiteHeaderContext',
  'getAppShellCopy',
  'getSiteCopy',
]) {
  if (!siteCopySource.includes(`export ${requiredExport}`) && !siteCopySource.includes(`export function ${requiredExport}`) && !siteCopySource.includes(`export const ${requiredExport}`)) {
    failures.push(`site-copy.ts must export ${requiredExport}.`);
  }
}

if (!localeCoverageSource.includes("import { siteLocaleRegistry } from './site-copy'")) {
  failures.push('locale-coverage.ts must derive locale ids from siteLocaleRegistry.');
}

if (!localeCoverageSource.includes('Object.keys(siteLocaleRegistry)')) {
  failures.push('locale-coverage.ts must not duplicate hardcoded locale lists.');
}

if (!localeCoverageSource.includes('hasFullRouteLocalization')) {
  failures.push('locale-coverage.ts must export hasFullRouteLocalization for deterministic locale coverage checks.');
}

const forbiddenRuntimeFiles = [
  'apps/playground/src/App.tsx',
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/site-routes.ts',
  'apps/playground/src/locale-coverage.ts',
  'packages/gds-core/src/ReferenceThemeExplorer.tsx',
  'packages/gds-theme/src/GdsProvider.tsx',
  'packages/gds-theme/src/font-lanes.ts',
];

const forbiddenPatterns = [
  { pattern: /localizedLabels/, message: 'localizedLabels belongs in site-copy.ts, not route definitions.' },
  { pattern: /locale\s*(?:===|!==)\s*['"][a-z]{2}['"]/, message: 'runtime components must not branch on concrete locale ids.' },
  { pattern: /\[\s*['"][a-z]{2}['"]\s*,\s*['"][a-z]{2}['"]/, message: 'runtime components must not define locale arrays.' },
  { pattern: /(?:^|\n)\s*(?:de|fr|it|ru|he|ar|hu):\s*\{/, message: 'localized copy dictionaries belong in i18n resource files only.' },
  { pattern: /Only routes listed as fully localized in the official coverage contract/, message: 'locale-disclosure prose belongs in site-copy.ts.' },
];

for (const relativePath of forbiddenRuntimeFiles) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(source)) {
      failures.push(`${relativePath}: ${message}`);
    }
  }
}

if (!readFileSync(resolve(root, 'apps/playground/src/App.tsx'), 'utf8').includes("from './site-copy'")) {
  failures.push('App.tsx must consume locale resources from site-copy.ts.');
}

if (!readFileSync(resolve(root, 'apps/playground/src/info-pages.tsx'), 'utf8').includes("from './site-copy'")) {
  failures.push('info-pages.tsx must consume page copy from site-copy.ts.');
}

if (failures.length > 0) {
  console.error('Locale coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Locale coverage verification passed.');
