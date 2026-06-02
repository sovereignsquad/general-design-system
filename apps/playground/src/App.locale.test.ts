import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import App from './App';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';

describe('playground route locale coverage', () => {
  it('allows full-copy locales on covered routes and keeps other routes English-default', () => {
    expect(hasFullRouteLocalization('/install', 'en')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/themes', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/governance', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'it')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'ru')).toBe(true);
    expect(hasFullRouteLocalization('/themes', 'he')).toBe(true);
    expect(hasFullRouteLocalization('/governance', 'ar')).toBe(true);
    expect(hasFullRouteLocalization('/', 'hu')).toBe(true);

    expect(hasFullRouteLocalization('/install', 'pl')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'de')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'en')).toBe(true);
  });

  it('returns the full-copy locale list for each route', () => {
    expect(getFullCopyLocalesForRoute('/install')).toContain('hu');
    expect(getFullCopyLocalesForRoute('/themes')).toContain('hu');
    expect(getFullCopyLocalesForRoute('/patterns/public')).toEqual(['en']);
  });

  it('keeps supported localized languages available on the themes route', async () => {
    window.history.pushState({}, '', '/general-design-system/');

    render(createElement(App));

    const localeSelect = screen.getByLabelText('Select site locale') as HTMLSelectElement;
    fireEvent.change(localeSelect, { target: { value: 'hu' } });
    expect(localeSelect.value).toBe('hu');

    fireEvent.click(screen.getByRole('link', { name: 'Themes' }));

    await waitFor(() => expect(window.location.pathname).toBe('/general-design-system/themes'));
    await waitFor(() => expect(localeSelect.value).toBe('hu'));

    expect(Array.from(localeSelect.options).map((option) => option.value)).toContain('hu');
    expect(screen.getByRole('option', { name: 'Magyar' })).toBeTruthy();
  });
});
