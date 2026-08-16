// One implementation of "this value was never actually translated", shared by the
// generator that repairs leakage and the gate that fails on it.
//
// Detection is by peer evidence, not a hand-maintained allowlist: if another locale
// translated a phrase, the phrase is translatable, and a locale that left it in English
// missed it. A phrase no locale translated is invisible to this rule.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Script per locale, read at load time from `gdsLocaleMetadata` in packages/gds-theme/src/i18n.ts.
 */
export function readLocaleScripts(root = process.cwd()) {
  const source = readFileSync(join(root, 'packages/gds-theme/src/i18n.ts'), 'utf8');
  const block = /export const gdsLocaleMetadata = \{([\s\S]*?)\n\} as const;/.exec(source);
  if (!block) throw new Error('Could not read gdsLocaleMetadata — refusing to guess locale scripts.');
  return Object.fromEntries(
    [...block[1].matchAll(/^\s*(\w+):\s*\{[^}]*script:\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]),
  );
}

/**
 * Content that is legitimately identical in every language: code identifiers and identifier
 * lists, package/CLI commands, emails and URLs, keyboard shortcuts, and byte sizes.
 */
export function isUntranslatableToken(value) {
  const text = value.trim();
  if (!text) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return true;                       // email
  if (/^(https?:\/\/|www\.|\/|\.\/)/.test(text)) return true;                     // url / path
  if (/(^|\s)(npm|npx|node|git|yarn|pnpm)\s/.test(text) || text.includes('--')) return true; // command
  if (/^(Cmd|Ctrl|Alt|Shift|Option)\s?\+/.test(text)) return true;                // shortcut
  if (/^\d+(\.\d+)?\s?(B|KB|MB|GB|TB)\b/.test(text)) return true;                 // byte size
  if (/^[A-Za-z_$][\w$]*(\s*[,/]\s*[A-Za-z_$][\w$]*)+$/.test(text)) return true;  // identifier list
  if (/^[A-Za-z_$][\w$]*$/.test(text)) return true;                               // single identifier
  if (/^[A-Z]{2,}(,\s*[A-Z]{2,})*$/.test(text)) return true;                      // acronym list, e.g. JPEG, PNG, WebP
  return false;
}

/** Prose: enough words to be a phrase, with at least one lower-case word carrying it. */
export function isProse(value) {
  const words = value.trim().split(/\s+/);
  return words.length >= 3 && words.some((word) => /^[a-z]{2,}$/.test(word));
}

/**
 * Letters and digits only, lowercased. Strips punctuation/spacing/casing so e.g. Arabic
 * comma substitution doesn't register as a translation.
 */
function normalize(value) {
  return value.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
}

/** Reads a locale module's `key: 'value'` pairs without evaluating it. */
export function readLocaleValues(file) {
  const source = readFileSync(file, 'utf8');
  return Object.fromEntries(
    [...source.matchAll(/^\s*["']([^"']+)["']\s*:\s*["']([^"']*)["']/gm)].map((match) => [match[1], match[2]]),
  );
}

/** Lists the locale ids in a corpus directory. */
export function listLocales(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file) => file.replace('.ts', ''));
}

/**
 * Measures untranslated-English leakage for one corpus.
 *
 * @param dir corpus directory
 * @param referenceIsKey site packs key their map BY the English phrase, so the key is the
 *   reference. Package packs key by a dotted id, so `en.ts`'s value is the reference.
 * @returns `{ rows }`, sorted worst-first. Each row carries the leaked keys, so a caller can
 *   repair them rather than only count them.
 */
export function measureCorpusLeakage(dir, { referenceIsKey }) {
  const locales = listLocales(dir);
  const reference = referenceIsKey ? null : readLocaleValues(join(dir, 'en.ts'));

  const packs = {};
  for (const locale of locales) {
    if (locale === 'en') continue;
    packs[locale] = readLocaleValues(join(dir, `${locale}.ts`));
  }

  const englishFor = (key) => (referenceIsKey ? key : reference?.[key]);

  // How many locales produced something different from English for this key. One is enough
  // to prove the phrase is translatable.
  const translatedBy = {};
  for (const values of Object.values(packs)) {
    for (const [key, value] of Object.entries(values)) {
      const english = englishFor(key);
      if (value && english && normalize(value) !== normalize(english)) {
        translatedBy[key] = (translatedBy[key] ?? 0) + 1;
      }
    }
  }

  // Latin-script languages legitimately share cognate words with English; non-Latin-script
  // languages share none, so any English phrase left there is a miss.
  const scripts = readLocaleScripts();

  const rows = Object.entries(packs).map(([locale, values]) => {
    const latinScript = (scripts[locale] ?? 'latin') === 'latin';

    const leakedKeys = Object.entries(values)
      .filter(([key, value]) => {
        const english = englishFor(key);
        if (!value || !english || normalize(value) !== normalize(english)) return false;
        if (isUntranslatableToken(english)) return false;
        // Peer evidence: some other locale rendered this phrase differently, so it can be
        // translated and this pack has not been.
        if ((translatedBy[key] ?? 0) === 0) return false;
        return latinScript ? isProse(english) : true;
      })
      .map(([key]) => key);

    const total = Object.keys(values).length;
    return {
      locale,
      total,
      leaked: leakedKeys.length,
      rate: total ? +((leakedKeys.length / total) * 100).toFixed(2) : 0,
      leakedKeys,
    };
  });

  rows.sort((a, b) => b.rate - a.rate || a.locale.localeCompare(b.locale));
  return { locales, rows };
}
