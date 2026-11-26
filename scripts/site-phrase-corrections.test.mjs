import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readLabelIndexes } from './lib/package-label-precedence.mjs';
import { TRANSLATION_LOCALES } from './lib/translate.mjs';
import { SITE_PHRASE_CORRECTIONS } from './site-phrase-corrections.mjs';

const root = resolve(import.meta.dirname, '..');

describe('reviewed site phrase corrections (#999)', () => {
  it('covers only supported locales, with non-empty values', () => {
    for (const [locale, entries] of Object.entries(SITE_PHRASE_CORRECTIONS)) {
      expect(TRANSLATION_LOCALES).toContain(locale);
      for (const [phrase, value] of Object.entries(entries)) expect(value.trim(), `${locale} ${phrase}`).not.toBe('');
    }
  });

  it('never corrects a label a package message translates; that is fixed in the package pack', () => {
    const indexes = readLabelIndexes(root, Object.keys(SITE_PHRASE_CORRECTIONS));
    for (const [locale, entries] of Object.entries(SITE_PHRASE_CORRECTIONS)) {
      for (const phrase of Object.keys(entries)) {
        expect(indexes[locale].labels.has(phrase), `${locale} "${phrase}" belongs in packages/gds-core/src/locales/${locale}.ts`).toBe(false);
      }
    }
  });
});
