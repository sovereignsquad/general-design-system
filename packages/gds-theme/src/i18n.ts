'use client';

import { createContext, useContext } from 'react';
import { gdsDevWarnOnce } from './dev-warnings';

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
