// Issue 588 — one implementation of "this value was never actually translated",
// shared by the generator that repairs leakage and the gate that fails on it.
//
// Two implementations of the same measurement would eventually disagree, and a gate that
// contradicts the tool it polices is worse than no gate (the reasoning already recorded for
// GdsAccentContrastMatrix, which reads the same evaluator verify:accent-contrast runs).
//
// DETECTION IS BY PEER EVIDENCE, NOT BY A HAND-MAINTAINED ALLOWLIST.
//
// A value identical to its English source is not automatically a defect: `"GdsAccessGate /
// resolveGdsAccessState"` is a list of code identifiers and must stay identical in every
// language. Measured across the site corpus, 79 distinct phrases are identical somewhere and
// only 6 are identical in ALL eight locales — and those six are exactly the component-name
// lists. The signal separating the two cases is already in the data:
//
//   **if another locale translated this same phrase, the phrase is translatable, so a locale
//   that left it in English has missed it.**
//
// That is the reasoning issue 517 used by hand ("all 7 other non-English locales translated
// these correctly — he.ts is the sole outlier"), computed instead of argued. It needs no
// allowlist to maintain, invents no judgement about what "should" be translatable, and it
// cannot drift the way an enumerated exemption list does (Rule 14).
//
// The cost is stated rather than hidden: a phrase NO locale translated is invisible to this
// rule. If all twelve packs miss the same string, nothing here objects. That is a real blind
// spot, and it is the price of not hand-maintaining ~46 exemptions per corpus.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Script per locale, mirrored from `gdsLocaleMetadata` in packages/gds-theme/src/i18n.ts.
 * Read from source at load time rather than copied, so a new locale cannot be added to the
 * system without this rule seeing it (Rule 14 — derived, not retyped).
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
 *
 * Every pattern here was derived from the measured residue rather than imagined. `"you@
 * company.com"`, `"Cmd+1"`, `"npm run verify:references"` and `"ChatThread, ChatMessage,
 * ChatInput, StreamingIndicator"` are not translation failures, and counting them would put
 * ~40 non-problems per pack in front of a reader looking for the real ones.
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
 * Letters and digits only, lowercased.
 *
 * Peer evidence has to be evidence of TRANSLATION, and a first version counted any
 * difference at all. Arabic renders `"ChatThread, ChatMessage, ChatInput"` with Arabic commas
 * — `"ChatThread، ChatMessage، ChatInput"` — which differs byte-wise while translating
 * nothing. That made every component-name list look translatable and put a dozen of them on
 * the leak list for other locales. Comparing letters alone removes punctuation, spacing and
 * casing from the question.
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

  // A Latin-script language legitimately shares words with English — `Pause`, `Filter` and
  // `Message` are real German and French words, and the package packs are full of them. A
  // non-Latin-script language shares none, so ANY English phrase left in `zh`/`he`/`ar`/`ru`/
  // `ja`/`ko` is a miss. Measured: the peer rule alone flagged 15 package values, of which
  // exactly one — `zh`'s `"Trending Up"` — was a real defect. Splitting by script is what
  // separates the defect from the fourteen cognates.
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
