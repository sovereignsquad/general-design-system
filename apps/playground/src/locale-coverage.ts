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
    fullCopyLocales: ['en', 'de', 'fr', 'it', 'ru', 'he', 'ar', 'hu'],
  },
];

export function hasFullRouteLocalization(pathname: string, locale: string) {
  const matchingRules = localizedRouteCoverage
    .filter((rule) => pathname === rule.routePrefix || pathname.startsWith(`${rule.routePrefix}/`))
    .sort((a, b) => b.routePrefix.length - a.routePrefix.length);

  if (matchingRules.length === 0) {
    return locale === 'en';
  }

  return matchingRules[0].fullCopyLocales.includes(locale);
}
