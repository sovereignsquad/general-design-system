import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'apps/playground/gds-adoption.json');
const siteCopyPath = resolve(root, 'apps/playground/src/site-copy.ts');
const localeCoveragePath = resolve(root, 'apps/playground/src/locale-coverage.ts');
const siteRoutesPath = resolve(root, 'apps/playground/src/site-routes.ts');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const siteCopySource = readFileSync(siteCopyPath, 'utf8');
const localeCoverageSource = readFileSync(localeCoveragePath, 'utf8');
const siteRoutesSource = readFileSync(siteRoutesPath, 'utf8');

const failures = [];

// Package/site locale parity: a language the packages support but the site does not would
// otherwise pass every within-corpus gate.
{
  const packageLocales = readdirSync(resolve(root, 'packages/gds-core/src/locales'))
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file) => file.replace('.ts', ''));
  const sitePackLocales = readdirSync(resolve(root, 'apps/playground/src/generated-site-phrases'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace('.ts', ''));

  if (packageLocales.length === 0 || sitePackLocales.length === 0) {
    failures.push('Locale parity: read 0 packs from one of the corpora — refusing to pass vacuously.');
  }

  // `en` needs no site phrase pack: the site's phrase maps are keyed BY the English phrase.
  for (const locale of packageLocales) {
    if (locale === 'en' || sitePackLocales.includes(locale)) continue;
    failures.push(
      `Package locale "${locale}" has no site phrase pack. The packages advertise this language `
      + 'while the reference site cannot render it — add it to scripts/generate-site-phrase-translations.mjs.',
    );
  }

  for (const locale of sitePackLocales) {
    if (packageLocales.includes(locale)) continue;
    failures.push(`Site phrase pack "${locale}" has no package locale pack backing it.`);
  }
}

const localizedRouteCoverage = manifest.compliance?.localizedRouteCoverage;
const expectedLocaleIds = new Set();
const routeCoverageFromManifest = new Map();

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

    routeCoverageFromManifest.set(rule.routePrefix, rule.fullCopyLocales.join(','));
  }
}

const routeCoverageEntries = [
  ...localeCoverageSource.matchAll(/routePrefix:\s*'([^']+)'[\s\S]*?fullCopyLocales:\s*([^,\n}]+)/g),
].map((match) => ({
  routePrefix: match[1],
  sourceValue: match[2].trim(),
}));

const sourceRoutePrefixes = new Set(routeCoverageEntries.map((entry) => entry.routePrefix));
for (const routePrefix of routeCoverageFromManifest.keys()) {
  if (!sourceRoutePrefixes.has(routePrefix)) {
    failures.push(`locale-coverage.ts must include routePrefix "${routePrefix}" from gds-adoption.json.`);
  }
}

for (const entry of routeCoverageEntries) {
  if (!routeCoverageFromManifest.has(entry.routePrefix)) {
    failures.push(`gds-adoption.json must include routePrefix "${entry.routePrefix}" from locale-coverage.ts.`);
  }

  const manifestValue = routeCoverageFromManifest.get(entry.routePrefix);
  const sourceDeclaresAllLocales = entry.sourceValue === 'allSiteLocaleIds';
  const manifestDeclaresAllLocales = manifestValue === [...expectedLocaleIds].join(',');

  if (!sourceDeclaresAllLocales) {
    failures.push(`${entry.routePrefix} must use allSiteLocaleIds in locale-coverage.ts; English-only route coverage is not allowed.`);
  }

  if (!manifestDeclaresAllLocales) {
    failures.push(`${entry.routePrefix} must declare every supported site locale in gds-adoption.json; English-only route coverage is not allowed.`);
  }
}

const primaryRoutePaths = [
  ...siteRoutesSource.matchAll(/path:\s*'([^']+)'[\s\S]*?navGroup:\s*'primary'/g),
].map((match) => match[1]);

for (const routePath of primaryRoutePaths) {
  if (!routeCoverageFromManifest.has(routePath)) {
    failures.push(`gds-adoption.json must declare localizedRouteCoverage for primary route "${routePath}".`);
  }
  if (!sourceRoutePrefixes.has(routePath)) {
    failures.push(`locale-coverage.ts must declare localizedRouteCoverage for primary route "${routePath}".`);
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
