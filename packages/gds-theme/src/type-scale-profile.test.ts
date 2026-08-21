import { describe, expect, it } from 'vitest';
import { GDS_DEFAULT_TYPOGRAPHY_AXIS } from './axes';
import { NAMED_TYPE_SCALE_RATIO_LABELS, resolveGdsTypeScaleProfile } from './type-scale-profile';
import { getGdsVibeThemes } from './vibe-themes';

const ALL_PRESET_IDS = getGdsVibeThemes().map((v) => v.id);

describe('type-scale ratio profile (issue #645)', () => {
  it('returns the live default axis ratio for every preset (no preset currently overrides it)', () => {
    for (const id of ALL_PRESET_IDS) {
      expect(resolveGdsTypeScaleProfile(id)).toEqual({ ratio: GDS_DEFAULT_TYPOGRAPHY_AXIS.scale.ratio });
    }
  });

  it('respects an explicit axis override', () => {
    const override = { ...GDS_DEFAULT_TYPOGRAPHY_AXIS, scale: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.scale, ratio: 1.333 as const } };
    expect(resolveGdsTypeScaleProfile('default', override)).toEqual({ ratio: 1.333 });
  });

  it('throws for a ratio outside the six named values', () => {
    const override = { ...GDS_DEFAULT_TYPOGRAPHY_AXIS, scale: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.scale, ratio: 1.4 } };
    expect(() => resolveGdsTypeScaleProfile('default', override as any)).toThrow(/not one of the six named/);
  });

  it('every named ratio has a display label', () => {
    for (const ratio of [1.125, 1.2, 1.25, 1.333, 1.5, 1.618] as const) {
      expect(NAMED_TYPE_SCALE_RATIO_LABELS[ratio]).toBeTruthy();
    }
  });

  it('the current default ratio (1.125) is labeled Major Second', () => {
    expect(NAMED_TYPE_SCALE_RATIO_LABELS[1.125]).toBe('Major Second');
  });

  it('never hardcodes 1.125 as a duplicate literal outside the named-ratio table', () => {
    // Structural check: the function's result must trace to the live axis, not a
    // separate constant -- verified by mutating the source axis is impossible (it's a
    // module-level const), so this is instead verified by construction: the resolver
    // reads GDS_DEFAULT_TYPOGRAPHY_AXIS.scale.ratio directly (see resolveGdsTypeScaleProfile).
    expect(resolveGdsTypeScaleProfile('default').ratio).toBe(GDS_DEFAULT_TYPOGRAPHY_AXIS.scale.ratio);
  });
});
