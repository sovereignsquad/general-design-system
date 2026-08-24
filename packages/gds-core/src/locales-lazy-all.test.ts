import { describe, expect, it } from 'vitest';
import { de } from './locales/de';
import { es } from './locales/es';
import { ko } from './locales/ko';
import { getGdsMessagesLazy } from './locales/lazy/registry';
import './locales/lazy/all';

describe('locales/lazy/all (issue 662)', () => {
  it('registers every non-English locale in one import', () => {
    expect(getGdsMessagesLazy('de')).toBe(de);
    expect(getGdsMessagesLazy('es')).toBe(es);
    expect(getGdsMessagesLazy('ko')).toBe(ko);
  });
});
