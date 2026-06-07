import { siteLocaleRegistry } from './site-copy';

export interface LocalizedRouteCoverageRule {
  routePrefix: string;
  fullCopyLocales: string[];
}

const allSiteLocaleIds = Object.keys(siteLocaleRegistry);
const englishOnlyLocaleIds = ['en'];

export const localizedRouteCoverage: LocalizedRouteCoverageRule[] = [
  {
    routePrefix: '/',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/install',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/patterns',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/api',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/maturity',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/use-cases',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/coverage',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/governance',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/themes',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/live-demos',
    fullCopyLocales: englishOnlyLocaleIds,
  },
  {
    routePrefix: '/request-feature',
    fullCopyLocales: englishOnlyLocaleIds,
  },
];

function getRouteLocalizationRule(pathname: string) {
  return localizedRouteCoverage
    .filter((rule) => pathname === rule.routePrefix || pathname.startsWith(`${rule.routePrefix}/`))
    .sort((a, b) => b.routePrefix.length - a.routePrefix.length);
}

export function getFullCopyLocalesForRoute(pathname: string) {
  const matchingRules = getRouteLocalizationRule(pathname);

  if (matchingRules.length === 0) {
    return [allSiteLocaleIds[0] ?? 'en'];
  }

  return matchingRules[0].fullCopyLocales;
}

export function hasFullRouteLocalization(pathname: string, locale: string) {
  return getFullCopyLocalesForRoute(pathname).includes(locale);
}
