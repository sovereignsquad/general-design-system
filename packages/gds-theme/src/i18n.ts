import { createContext, useContext } from 'react';
import { gdsDevWarnOnce } from './dev-warnings';

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

/** Returns the ids of all supported locales whose script is in `scripts`. */
export function getGdsLocaleIdsByScript(scripts: GdsLocaleScript[]) {
  return Object.entries(gdsLocaleMetadata)
    .filter(([, metadata]) => scripts.includes(metadata.script))
    .map(([locale]) => locale);
}

/** Value carried by `GdsI18nContext`: the active locale and its message dictionary. */
export interface GdsI18nContextValue {
  /** Active locale id. */
  locale: string;
  /** Translation dictionary keyed by message id. */
  messages: Record<string, string>;
}

/**
 * The context's default value, used when no `GdsProvider` is mounted above the
 * consumer. Kept as a stable singleton reference so `useGdsTranslation` can detect
 * "no provider supplied a value" by identity — any real `GdsProvider` passes a
 * freshly-constructed `{ locale, messages }` object, which is never this reference.
 */
const defaultGdsI18nContextValue: GdsI18nContextValue = {
  locale: 'en',
  messages: {},
};

/** React context supplying the active locale and messages to `useGdsTranslation`. */
export const GdsI18nContext = createContext<GdsI18nContextValue>(defaultGdsI18nContextValue);

/**
 * useGdsTranslation provides a lightweight translation hook.
 * It looks up the translation key in the provider's message dictionary,
 * and falls back to the default semantic English string if not found.
 *
 * In development, warns once if it is called without a `GdsProvider` ancestor —
 * that setup mistake otherwise silently pins every string to built-in English and
 * the default locale/direction with no runtime signal.
 */
export function useGdsTranslation() {
  const context = useContext(GdsI18nContext);
  if (context === defaultGdsI18nContextValue) {
    gdsDevWarnOnce(
      'i18n:missing-provider',
      'useGdsTranslation() was called without a <GdsProvider> ancestor. Falling back to built-in English strings and the default locale — wrap your app in <GdsProvider locale messages> to supply real translations.',
    );
  }
  const { messages, locale } = context;
  return {
    t: (id: string, defaultMessage: string) => messages[id] || defaultMessage,
    locale,
  };
}
