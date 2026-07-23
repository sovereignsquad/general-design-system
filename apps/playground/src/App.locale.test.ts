import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import App from './App';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';
import { translateSiteDom } from './site-phrase-translation';

const allLocaleIds = ['en', 'de', 'fr', 'it', 'es', 'ru', 'he', 'ar', 'hu'];

describe('playground route locale coverage', () => {
  it('allows full-copy locales on every public route', () => {
    expect(hasFullRouteLocalization('/install', 'en')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'fr')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'es')).toBe(true);
    expect(hasFullRouteLocalization('/', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'it')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'ru')).toBe(true);
    expect(hasFullRouteLocalization('/', 'hu')).toBe(true);
    expect(hasFullRouteLocalization('/install', 'pl')).toBe(false);
    expect(hasFullRouteLocalization('/patterns/public', 'de')).toBe(true);
    expect(hasFullRouteLocalization('/patterns/public', 'en')).toBe(true);
  });

  it('returns the full-copy locale list for each route', () => {
    expect(getFullCopyLocalesForRoute('/').includes('es')).toBe(true);
    expect(getFullCopyLocalesForRoute('/install')).toContain('hu');
    expect(getFullCopyLocalesForRoute('/api')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/maturity')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/use-cases')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/coverage')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/patterns')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/governance')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/themes')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/live-demos')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/request-feature')).toEqual(allLocaleIds);
    expect(getFullCopyLocalesForRoute('/patterns/public')).toEqual(allLocaleIds);
  });

  it('keeps the selected locale on every public route', async () => {
    window.history.pushState({}, '', '/general-design-system/');

    render(createElement(App));

    const localeSelect = screen.getByLabelText('Select site locale') as HTMLSelectElement;
    fireEvent.change(localeSelect, { target: { value: 'hu' } });
    expect(localeSelect.value).toBe('hu');

    fireEvent.click(screen.getByRole('link', { name: 'Témák' }));

    await waitFor(() => expect(window.location.pathname).toBe('/general-design-system/themes'));
    await waitFor(() => expect(localeSelect.value).toBe('hu'));

    expect(Array.from(localeSelect.options).map((option) => option.value)).toEqual(allLocaleIds);
  });

  it('does not rewrite interactive control text with generated phrase translation', async () => {
    const root = document.createElement('div');
    const nodes = ['button', 'label', 'a', 'p'].map((tagName) => {
      const element = document.createElement(tagName);
      element.textContent = 'Accent band';
      if (tagName === 'a') {
        element.setAttribute('href', '/general-design-system/patterns');
      }
      root.appendChild(element);
      return element;
    });

    await translateSiteDom(root, 'fr');

    expect(nodes[0].textContent).toBe('Accent band');
    expect(nodes[1].textContent).toBe('Accent band');
    expect(nodes[2].textContent).toBe('Accent band');
    expect(nodes[3].textContent).toBe("Bande d'accent");
  });
});
