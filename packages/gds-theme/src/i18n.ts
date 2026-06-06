import { createContext, useContext } from 'react';

export const gdsLocaleMetadata = {
  en: { label: 'English', direction: 'ltr', script: 'latin' },
  de: { label: 'Deutsch', direction: 'ltr', script: 'latin' },
  fr: { label: 'Français', direction: 'ltr', script: 'latin' },
  it: { label: 'Italiano', direction: 'ltr', script: 'latin' },
  hu: { label: 'Magyar', direction: 'ltr', script: 'latin' },
  ru: { label: 'Русский', direction: 'ltr', script: 'cyrillic' },
  he: { label: 'עברית', direction: 'rtl', script: 'hebrew' },
  ar: { label: 'العربية', direction: 'rtl', script: 'arabic' },
} as const;

export type GdsLocaleId = keyof typeof gdsLocaleMetadata;
export type GdsLocaleDirection = (typeof gdsLocaleMetadata)[GdsLocaleId]['direction'];
export type GdsLocaleScript = (typeof gdsLocaleMetadata)[GdsLocaleId]['script'];

export function getGdsLocaleMetadata(locale: string) {
  return gdsLocaleMetadata[locale as GdsLocaleId] ?? gdsLocaleMetadata.en;
}

export function isGdsRtlLocale(locale: string) {
  return getGdsLocaleMetadata(locale).direction === 'rtl';
}

export function getGdsLocaleIdsByScript(scripts: GdsLocaleScript[]) {
  return Object.entries(gdsLocaleMetadata)
    .filter(([, metadata]) => scripts.includes(metadata.script))
    .map(([locale]) => locale);
}

export interface GdsI18nContextValue {
  locale: string;
  messages: Record<string, string>;
}

export const GdsI18nContext = createContext<GdsI18nContextValue>({
  locale: 'en',
  messages: {},
});

/**
 * useGdsTranslation provides a lightweight translation hook.
 * It looks up the translation key in the provider's message dictionary,
 * and falls back to the default semantic English string if not found.
 */
export function useGdsTranslation() {
  const { messages, locale } = useContext(GdsI18nContext);
  return {
    t: (id: string, defaultMessage: string) => messages[id] || defaultMessage,
    locale,
  };
}
