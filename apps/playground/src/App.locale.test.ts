import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import App from './App';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';

describe('playground route locale coverage', () => {
  it('allows full-copy locales on covered routes and keeps other routes English-default', () => {
    expect(hasFullRouteLocalization('/install', 'en')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'es')).toBe(true);
    expect(hasFullRouteLocalization('/', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'it')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'ru')).toBe(true);
    expect(hasFullRouteLocalization('/', 'hu')).toBe(true);

    expect(hasFullRouteLocalization('/api', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/maturity', 'es')).toBe(false);
    expect(hasFullRouteLocalization('/use-cases', 'hu')).toBe(false);
    expect(hasFullRouteLocalization('/governance', 'fr')).toBe(false);
    expect(hasFullRouteLocalization('/governance', 'ar')).toBe(false);
    expect(hasFullRouteLocalization('/themes', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/themes', 'he')).toBe(false);
    expect(hasFullRouteLocalization('/install', 'pl')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'en')).toBe(true);
  });

  it('returns the full-copy locale list for each route', () => {
    expect(getFullCopyLocalesForRoute('/').includes('es')).toBe(true);
    expect(getFullCopyLocalesForRoute('/install')).toContain('hu');
    expect(getFullCopyLocalesForRoute('/api')).toEqual(['en']);
    expect(getFullCopyLocalesForRoute('/maturity')).toEqual(['en']);
    expect(getFullCopyLocalesForRoute('/use-cases')).toEqual(['en']);
    expect(getFullCopyLocalesForRoute('/governance')).toEqual(['en']);
    expect(getFullCopyLocalesForRoute('/themes')).toEqual(['en']);
    expect(getFullCopyLocalesForRoute('/patterns/public')).toEqual(['en']);
  });

  it('falls back to English on routes without complete translated copy', async () => {
    window.history.pushState({}, '', '/general-design-system/');

    render(createElement(App));

    const localeSelect = screen.getByLabelText('Select site locale') as HTMLSelectElement;
    fireEvent.change(localeSelect, { target: { value: 'hu' } });
    expect(localeSelect.value).toBe('hu');

    fireEvent.click(screen.getByRole('link', { name: 'Témák' }));

    await waitFor(() => expect(window.location.pathname).toBe('/general-design-system/themes'));
    await waitFor(() => expect(localeSelect.value).toBe('en'));

    expect(Array.from(localeSelect.options).map((option) => option.value)).toEqual(['en']);
    expect(screen.getByText(/Only routes listed as fully localized/)).toBeTruthy();
  });
});
