import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { en } from './locales/en';
import { getGdsMessagesLazy, registerGdsLocale } from './locales/lazy/registry';

describe('lazy locale registry (issue 662)', () => {
  beforeEach(() => {
    resetGdsDevWarnings();
  });

  it('always has English registered without any subpath import', () => {
    expect(getGdsMessagesLazy('en')).toBe(en);
  });

  it('returns a registered dictionary by locale id', () => {
    const fr = { ...en, 'gds.action.save': 'Enregistrer' };
    registerGdsLocale('fr', fr);
    expect(getGdsMessagesLazy('fr')).toBe(fr);
  });

  it('falls back to English, synchronously, for a locale that was never registered', () => {
    expect(getGdsMessagesLazy('xx-unregistered')).toBe(en);
  });

  it('warns once (dev-only channel) when a lookup falls back because the locale is unregistered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getGdsMessagesLazy('yy-unregistered');
    getGdsMessagesLazy('yy-unregistered');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('locales/lazy/yy-unregistered');
    warn.mockRestore();
  });
});
