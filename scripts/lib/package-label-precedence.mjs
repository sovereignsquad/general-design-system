// Package message pack values for short site labels.
//
// A site phrase that is a short label and equals the English text of one or more package
// messages takes the package pack's translation for that locale. Package packs are
// hand-correctable; generated site packs are not, so a correction made once in
// packages/gds-core/src/locales/<locale>.ts reaches both surfaces.
//
// Shared by the site phrase generator and its verification gate.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALE_DIR = 'packages/gds-core/src/locales';

/**
 * A short label: starts with an uppercase letter, at most three words, no sentence or
 * fragment punctuation. Lower-case starts and trailing punctuation mark fragments that the
 * package composes with a field name (`"is required."`), whose word order is not the site's.
 */
export function isShortLabel(phrase) {
  if (typeof phrase !== 'string') return false;
  const trimmed = phrase.trim();
  if (trimmed !== phrase || trimmed.length === 0) return false;
  if (!/^\p{Lu}/u.test(trimmed)) return false;
  if (/[.,:;!?…%{}()<>"'`/\\|]/.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 3;
}

/** Parse a package pack source into an id -> text object. */
export function parsePackageLocale(source) {
  const body = /export const \w+ = (\{[\s\S]*\n\});/.exec(source);
  if (!body) throw new Error('Could not parse package locale pack.');
  return Function(`return (${body[1]});`)();
}

export function readPackageLocale(root, locale) {
  return parsePackageLocale(readFileSync(resolve(root, LOCALE_DIR, `${locale}.ts`), 'utf8'));
}

/**
 * English label -> translation for one locale.
 *
 * Only short labels are indexed. An English text whose message ids carry different
 * translations in the locale is ambiguous and is returned in `ambiguous`, not in `labels`.
 * Ids missing from the locale pack are skipped.
 */
export function buildLabelIndex(enPack, localePack) {
  const valuesByEnglish = new Map();
  for (const [id, english] of Object.entries(enPack)) {
    if (!isShortLabel(english)) continue;
    const translated = localePack[id];
    if (typeof translated !== 'string' || translated.trim().length === 0) continue;
    if (!valuesByEnglish.has(english)) valuesByEnglish.set(english, new Set());
    valuesByEnglish.get(english).add(translated);
  }

  const labels = new Map();
  const ambiguous = new Map();
  for (const [english, values] of valuesByEnglish) {
    if (values.size === 1) labels.set(english, [...values][0]);
    else ambiguous.set(english, [...values].sort());
  }
  return { labels, ambiguous };
}

/** Label indexes for every locale in `locales`, read from the package packs under `root`. */
export function readLabelIndexes(root, locales) {
  const en = readPackageLocale(root, 'en');
  return Object.fromEntries(locales.map((locale) => [
    locale,
    buildLabelIndex(en, readPackageLocale(root, locale)),
  ]));
}
