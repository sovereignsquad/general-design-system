import { describe, expect, it } from 'vitest';
import { gdsLocaleMetadata } from '@sovereignsquad/gds-theme';
import { gdsLocales } from './locales';

describe('locale metadata parity', () => {
  it('registers direction/script metadata for every shipped message locale', () => {
    const messageLocales = Object.keys(gdsLocales).sort();
    const metadataLocales = Object.keys(gdsLocaleMetadata).sort();
    expect(metadataLocales).toEqual(messageLocales);
  });
});
