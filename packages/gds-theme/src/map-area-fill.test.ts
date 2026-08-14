import { describe, expect, it } from 'vitest';
import { getGdsMapAreaFill, GDS_MAP_AREA_FILL_ACCENT_WEIGHT, GDS_MAP_AREA_FILL_OPACITY } from './map-area-fill';
import { mixCssColors } from './color-math';

describe('getGdsMapAreaFill (#550)', () => {
  it('mixes the accent into the canvas at the governed weight', () => {
    const fill = getGdsMapAreaFill('#1d6fb8', '#faf6ee');
    expect(fill.fill).toBe(mixCssColors('#1d6fb8', '#faf6ee', GDS_MAP_AREA_FILL_ACCENT_WEIGHT, '#ffffff'));
    expect(fill.fillOpacity).toBe(GDS_MAP_AREA_FILL_OPACITY);
  });

  it('is theme-aware: a dark canvas yields a dark-family fill, not a cream one', () => {
    const cream = getGdsMapAreaFill('#1d6fb8', '#faf6ee');
    const dark = getGdsMapAreaFill('#1d6fb8', '#10162a');
    expect(cream.fill).not.toBe(dark.fill);
    expect(dark.hairline).toBe('#10162a');
  });

  it('the hairline is the canvas itself, so boundaries read as paper', () => {
    expect(getGdsMapAreaFill('#1d6fb8', '#faf6ee').hairline).toBe('#faf6ee');
  });

  it('follows color-math on unparseable input: returns the accent unchanged rather than inventing', () => {
    expect(getGdsMapAreaFill('not-a-colour', '#faf6ee').fill).toBe('not-a-colour');
  });
});
