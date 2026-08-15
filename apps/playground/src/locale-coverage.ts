import { siteLocaleRegistry } from './site-copy';

export interface LocalizedRouteCoverageRule {
  routePrefix: string;
  fullCopyLocales: string[];
}

const allSiteLocaleIds = Object.keys(siteLocaleRegistry);

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
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/api',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/maturity',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/use-cases',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/coverage',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/components',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/governance',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/themes',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/live-proofs',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/request-feature',
    fullCopyLocales: allSiteLocaleIds,
  },
  {
    routePrefix: '/ai',
    fullCopyLocales: allSiteLocaleIds,
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
