import { gdsDevWarnOnce } from '@sovereignsquad/gds-theme';
import { en } from '../en';

/** Shape of every locale dictionary — every key `en` declares, verbatim. */
export type GdsLocaleDictionary = typeof en;

const registry = new Map<string, GdsLocaleDictionary>([['en', en]]);

/**
 * Registers a locale dictionary for {@link getGdsMessagesLazy}.
 *
 * Called as a side effect by each `@sovereignsquad/gds-core/locales/lazy/<locale>` subpath —
 * importing that subpath is the registration. Consumers do not call this directly except to
 * register a dictionary they maintain themselves.
 */
export function registerGdsLocale(locale: string, dictionary: GdsLocaleDictionary): void {
  registry.set(locale, dictionary);
}

/**
 * Synchronous locale lookup backed by an opt-in registry, rather than `getGdsMessages`'s
 * eager all-twelve import. Same calling convention — no async, no Suspense — so it drops in
 * anywhere `getGdsMessages` is called.
 *
 * Falls back to English when `locale` was never registered, exactly like `getGdsMessages`'s
 * fallback for an unrecognized locale — but distinguishes the two cases in the dev warning it
 * emits, because "you forgot to import this locale's subpath" and "this locale doesn't exist"
 * call for different fixes.
 */
export function getGdsMessagesLazy(locale: string): GdsLocaleDictionary {
  const dictionary = registry.get(locale);
  if (dictionary) return dictionary;

  gdsDevWarnOnce(
    `gds-i18n-lazy:${locale}`,
    `getGdsMessagesLazy('${locale}') fell back to English because no dictionary is registered `
      + `for '${locale}'. Import '@sovereignsquad/gds-core/locales/lazy/${locale}' (or `
      + `'@sovereignsquad/gds-core/locales/lazy/all' for every locale) before this lookup runs.`,
  );
  return en;
}
