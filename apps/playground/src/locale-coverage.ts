export interface LocalizedRouteCoverageRule {
  routePrefix: string;
  fullCopyLocales: string[];
}

export const localizedRouteCoverage: LocalizedRouteCoverageRule[] = [
  {
    routePrefix: '/',
    fullCopyLocales: ['en', 'de', 'fr', 'it', 'ru', 'he', 'ar', 'hu'],
  },
  {
    routePrefix: '/install',
    fullCopyLocales: ['en', 'de', 'fr', 'it', 'ru', 'he', 'ar', 'hu'],
  },
  {
    routePrefix: '/governance',
    fullCopyLocales: ['en', 'de', 'fr', 'it', 'ru', 'he', 'ar', 'hu'],
  },
  {
    routePrefix: '/themes',
    fullCopyLocales: ['en'],
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
    return ['en'];
  }

  return matchingRules[0].fullCopyLocales;
}

export function hasFullRouteLocalization(pathname: string, locale: string) {
  return getFullCopyLocalesForRoute(pathname).includes(locale);
}
