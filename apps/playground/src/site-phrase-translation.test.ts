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

  // Owner report via the map's state line: React moved a status from "is loading" to
  // "4 markers", the mutation observer re-ran the pass, and the overlay wrote its REMEMBERED
  // first value back — freezing every dynamically-updating text at first sight, in every
  // locale including English. An app-authored update must become the new remembered English.
  it('never reverts text the app itself updated after the first pass', async () => {
    const host = mount('<p>Nearby activities is loading.</p>');
    const paragraph = host.querySelector('p') as HTMLParagraphElement;

    await translateSiteDom(host, 'en');
    // The app updates the node — exactly what React does when state changes.
    (paragraph.firstChild as Text).nodeValue = 'Nearby activities: 4 markers.';
    await translateSiteDom(host, 'en');
    expect(paragraph.textContent).toBe('Nearby activities: 4 markers.');
  });

  it('translates an app-updated value from ITS text, not from the stale first sighting', async () => {
    const host = mount('<p>Accent band</p>');
    const paragraph = host.querySelector('p') as HTMLParagraphElement;

    await translateSiteDom(host, 'de');
    const staleGerman = paragraph.textContent;
    // The app replaces the text while German is active (React renders English source copy).
    (paragraph.firstChild as Text).nodeValue = 'Accent panel';
    await translateSiteDom(host, 'de');
    // Whatever German renders now, it must not be the old phrase's translation frozen in place.
    expect(paragraph.textContent).not.toBe(staleGerman);
  });

  it('never reverts an aria-label the app swapped — a save toggle names its NEXT action', async () => {
    // A plain div carries the aria-label: the rule under test is attribute MEMORY, not the
    // element type, and a real control here would trip the raw-control compliance rule.
    const host = mount('<div aria-label="Save Riverside pool"></div>');
    const control = host.querySelector('div[aria-label]') as HTMLElement;

    await translateSiteDom(host, 'en');
    control.setAttribute('aria-label', 'Remove Riverside pool from saved');
    await translateSiteDom(host, 'en');
    expect(control.getAttribute('aria-label')).toBe('Remove Riverside pool from saved');
  });
});
