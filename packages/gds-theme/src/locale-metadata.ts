/** Built-in locale catalog: label, writing direction, and script for each supported locale. */
export const gdsLocaleMetadata = {
  en: { label: 'English', direction: 'ltr', script: 'latin' },
  es: { label: 'Español', direction: 'ltr', script: 'latin' },
  de: { label: 'Deutsch', direction: 'ltr', script: 'latin' },
  fr: { label: 'Français', direction: 'ltr', script: 'latin' },
  it: { label: 'Italiano', direction: 'ltr', script: 'latin' },
  hu: { label: 'Magyar', direction: 'ltr', script: 'latin' },
  ru: { label: 'Русский', direction: 'ltr', script: 'cyrillic' },
  he: { label: 'עברית', direction: 'rtl', script: 'hebrew' },
  ar: { label: 'العربية', direction: 'rtl', script: 'arabic' },
  zh: { label: '简体中文', direction: 'ltr', script: 'han' },
  ja: { label: '日本語', direction: 'ltr', script: 'kana' },
  ko: { label: '한국어', direction: 'ltr', script: 'hangul' },
} as const;

/** Any supported locale id (a key of `gdsLocaleMetadata`). */
export type GdsLocaleId = keyof typeof gdsLocaleMetadata;
/** Writing direction of a supported locale (`'ltr'` or `'rtl'`). */
export type GdsLocaleDirection = (typeof gdsLocaleMetadata)[GdsLocaleId]['direction'];
/** Script of a supported locale (e.g. `'latin'`, `'cyrillic'`, `'arabic'`). */
export type GdsLocaleScript = (typeof gdsLocaleMetadata)[GdsLocaleId]['script'];

/** Returns metadata for `locale`, falling back to English for unknown locales. */
export function getGdsLocaleMetadata(locale: string) {
  return gdsLocaleMetadata[locale as GdsLocaleId] ?? gdsLocaleMetadata.en;
}

/** `true` when `locale` is a right-to-left locale. */
export function isGdsRtlLocale(locale: string) {
  return getGdsLocaleMetadata(locale).direction === 'rtl';
}

/** Every locale id GDS supports. */
export function getGdsLocaleIds() {
  return Object.keys(gdsLocaleMetadata) as GdsLocaleId[];
}

/**
 * Every script GDS must be able to render, derived from the locale catalog.
 *
 * Exported so nothing downstream writes its own list. A font lane that hard-coded
 * `['latin', 'cyrillic']` would keep passing its own check on the day a locale in a new
 * script is added, which is exactly how `ja`/`ko`/`zh` ended up with no lane that could
 * render them (issue 587).
 */
export function getGdsLocaleScripts() {
  return [...new Set(Object.values(gdsLocaleMetadata).map((metadata) => metadata.script))] as GdsLocaleScript[];
}

/** Returns the ids of all supported locales whose script is in `scripts`. */
export function getGdsLocaleIdsByScript(scripts: GdsLocaleScript[]) {
  return Object.entries(gdsLocaleMetadata)
    .filter(([, metadata]) => scripts.includes(metadata.script))
    .map(([locale]) => locale);
}
