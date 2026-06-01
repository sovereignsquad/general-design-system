import { hasFullRouteLocalization } from './locale-coverage';

describe('playground route locale coverage', () => {
  it('allows full-copy locales on covered routes and keeps other routes English-default', () => {
    expect(hasFullRouteLocalization('/install', 'en')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/themes', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/governance', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'it')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'ru')).toBe(true);
    expect(hasFullRouteLocalization('/themes', 'he')).toBe(false);
    expect(hasFullRouteLocalization('/governance', 'ar')).toBe(true);
    expect(hasFullRouteLocalization('/', 'hu')).toBe(true);

    expect(hasFullRouteLocalization('/install', 'pl')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'en')).toBe(true);
  });
});
