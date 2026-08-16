import { translateGdsDom, translateGdsPhrase } from '@sovereignsquad/gds-core';
import type { SiteLocaleId } from './site-copy';

type PhraseMap = Record<string, string>;

/**
 * Translation engine lives in gds-core (`translateGdsDom`/`useGdsDomPhraseTranslation`).
 * This file holds only the generated phrase packs and their loaders.
 *
 * Each loader is a static dynamic-import() call, not a template-literal path, so
 * each locale code-splits into its own chunk.
 */
const localeLoaders: Partial<Record<SiteLocaleId, () => Promise<{ generatedSitePhrases: PhraseMap }>>> = {
  de: () => import('./generated-site-phrases/de'),
  fr: () => import('./generated-site-phrases/fr'),
  it: () => import('./generated-site-phrases/it'),
  es: () => import('./generated-site-phrases/es'),
  ru: () => import('./generated-site-phrases/ru'),
  he: () => import('./generated-site-phrases/he'),
  ar: () => import('./generated-site-phrases/ar'),
  hu: () => import('./generated-site-phrases/hu'),
  ja: () => import('./generated-site-phrases/ja'),
  ko: () => import('./generated-site-phrases/ko'),
  zh: () => import('./generated-site-phrases/zh'),
};

const phraseIndexCache = new Map<string, Map<string, string>>();

/** The site's phrase-index loader — the `loadIndex` the GDS engine is driven with. */
export async function loadSitePhraseIndex(locale: string): Promise<Map<string, string>> {
  const cached = phraseIndexCache.get(locale);
  if (cached) {
    return cached;
  }

  const loader = localeLoaders[locale as SiteLocaleId];
  const index = new Map<string, string>();
  if (loader) {
    const { generatedSitePhrases } = await loader();
    for (const [en, translated] of Object.entries(generatedSitePhrases)) {
      index.set(en, translated);
    }
  }

  phraseIndexCache.set(locale, index);
  return index;
}

/** The site's DOM pass: the GDS engine over the site's packs. Kept for tests and callers. */
export function translateSiteDom(root: ParentNode, locale: string) {
  return translateGdsDom(root, locale, loadSitePhraseIndex);
}

/** Single-phrase form, same delegation. */
export function translateSitePhrase(value: string, locale: string) {
  return translateGdsPhrase(value, locale, loadSitePhraseIndex);
}
