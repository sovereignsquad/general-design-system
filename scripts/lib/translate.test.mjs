import { describe, expect, it } from 'vitest';
import { chooseTranslationValue } from './translate.mjs';

describe('chooseTranslationValue (issue 660)', () => {
  it('writes the translation when the call succeeded', () => {
    expect(chooseTranslationValue({ text: 'Layoutschema JSON', ok: true }, 'Layoutschema JSON'))
      .toEqual({ value: 'Layoutschema JSON', preserved: false, failed: false });
  });

  it('keeps the committed translation when the call failed, rather than downgrading it to English', () => {
    expect(chooseTranslationValue({ text: 'Layout schema JSON', ok: false }, 'Layoutschema JSON'))
      .toEqual({ value: 'Layoutschema JSON', preserved: true, failed: true });
  });

  it('falls back to English only when nothing is committed to preserve', () => {
    expect(chooseTranslationValue({ text: 'Layout schema JSON', ok: false }, undefined))
      .toEqual({ value: 'Layout schema JSON', preserved: false, failed: true });
  });

  it('treats a blank stored value as nothing to preserve', () => {
    expect(chooseTranslationValue({ text: 'Overlay stack governance', ok: false }, '   '))
      .toEqual({ value: 'Overlay stack governance', preserved: false, failed: true });
  });

  it('reports a successful call that legitimately returns the source text as a success, not a fallback', () => {
    expect(chooseTranslationValue({ text: 'JSON', ok: true }, 'JSON'))
      .toEqual({ value: 'JSON', preserved: false, failed: false });
  });
});
