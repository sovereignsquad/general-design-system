import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import App from './App';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';
import { translateSiteDom } from './site-phrase-translation';
import { siteLocaleRegistry } from './site-copy';

// Derived from the registry, not listed. A written list made this test assert the locale set
// of the day it was written: adding `ja`, `ko` and `zh` (issue 587) failed it for being right.
// A test that has to be edited whenever the system grows is testing the editor, not the system.
const allLocaleIds = Object.keys(siteLocaleRegistry);

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
    expect(getFullCopyLocalesForRoute('/live-proofs')).toEqual(allLocaleIds);
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

  // CONTRACT CHANGED, issue 617. This used to assert that `button`, `label` and `a` text was
  // NEVER rewritten, on the principle that interactive labels are owned by the localized copy
  // maps and the message catalogue rather than by the phrase overlay.
  //
  // That principle is sound and the copy layer does own most of them — but measured on the
  // Korean site, 25 link texts and 8 button texts were still rendering in ENGLISH, because the
  // copy layer did not in fact cover them. The rule was protecting an ownership boundary that
  // left readers looking at English navigation.
  //
  // What must stay verbatim is narrower and concrete: CODE (a snippet is not prose) and FORM
  // CONTROL VALUES (a select element's options include the locale names themselves, which stay in
  // their own language by design). That is what this now asserts.
  it('translates link and button copy but never code or form control values', async () => {
    const root = document.createElement('div');
    const make = (tagName: string) => {
      const element = document.createElement(tagName);
      element.textContent = 'Accent band';
      root.appendChild(element);
      return element;
    };

    const paragraph = make('p');
    const anchor = make('a');
    const button = make('button');
    const label = make('label');
    const code = make('code');
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.textContent = 'Accent band';
    select.appendChild(option);
    root.appendChild(select);

    await translateSiteDom(root, 'fr');

    const french = "Bande d'accent";
    expect(paragraph.textContent).toBe(french);
    expect(anchor.textContent).toBe(french);
    expect(button.textContent).toBe(french);
    expect(label.textContent).toBe(french);

    // Verbatim: translating either would break something a reader depends on.
    expect(code.textContent).toBe('Accent band');
    expect(option.textContent).toBe('Accent band');
  });
});
