import { translateSiteDom } from './site-phrase-translation';

/**
 * Regression cover for the locale selector appearing not to work.
 *
 * Translation used to overwrite each node's text in place, destroying the English the phrase
 * index is keyed by. The pass therefore worked exactly once: switching from one non-English
 * locale to another looked up the PREVIOUS language's text in the new locale's English-keyed
 * map, matched nothing, and left the page in the old language while the selector showed the new
 * one. Reported from a phone with the selector reading "Français" over a fully Korean page.
 */
function mount(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe('translateSiteDom', () => {
  it('translates from the original English on every pass, not from the previous locale', async () => {
    const host = mount('<p>Accent band</p>');
    const paragraph = host.querySelector('p') as HTMLParagraphElement;

    await translateSiteDom(host, 'de');
    const german = paragraph.textContent;

    await translateSiteDom(host, 'fr');
    const french = paragraph.textContent;

    // The second switch must not be a no-op, which is exactly what happened when the English
    // source had been overwritten and could no longer be found in the index.
    expect(german).not.toBe('Accent band');
    expect(french).not.toBe('Accent band');
    expect(french).not.toBe(german);
  });

  it('restores English rather than leaving the previous locale in place', async () => {
    const host = mount('<p>Accent band</p>');
    const paragraph = host.querySelector('p') as HTMLParagraphElement;

    await translateSiteDom(host, 'de');
    expect(paragraph.textContent).not.toBe('Accent band');

    await translateSiteDom(host, 'en');
    expect(paragraph.textContent).toBe('Accent band');
  });

  it('is idempotent — running the same locale twice changes nothing', async () => {
    const host = mount('<p>Accent band</p>');
    const paragraph = host.querySelector('p') as HTMLParagraphElement;

    await translateSiteDom(host, 'de');
    const once = paragraph.textContent;
    await translateSiteDom(host, 'de');

    expect(paragraph.textContent).toBe(once);
  });
});
