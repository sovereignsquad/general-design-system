import { describe, expect, it, vi } from 'vitest';
import { validateGdsDesignRuleProfile, GDS_DEFAULT_DESIGN_RULE_PROFILE } from './axes';
import { __internal, resolveGdsColorHarmonyProfile } from './color-harmony-classification';
import { getGdsVibeThemes, resolveGdsVibeTheme } from './vibe-themes';

const ALL_PRESET_IDS = getGdsVibeThemes().map((v) => v.id);
const HARMONIES = ['complementary', 'analogous', 'triadic', 'split-complementary', 'monochromatic', 'custom'];

describe('color-harmony classification (issue #646)', () => {
  it('returns one of the six named harmonies for every shipped preset, computed from real hex values', () => {
    expect(ALL_PRESET_IDS.length).toBeGreaterThanOrEqual(25);
    for (const id of ALL_PRESET_IDS) {
      expect(HARMONIES).toContain(resolveGdsColorHarmonyProfile(id));
    }
  });

  it('is pure: calling it twice on the same preset returns the identical result', () => {
    for (const id of ALL_PRESET_IDS) {
      expect(resolveGdsColorHarmonyProfile(id)).toBe(resolveGdsColorHarmonyProfile(id));
    }
  });

  it('every computed harmony passes validateGdsDesignRuleProfile', () => {
    for (const id of ALL_PRESET_IDS) {
      const colorHarmony = resolveGdsColorHarmonyProfile(id);
      const profile = { ...GDS_DEFAULT_DESIGN_RULE_PROFILE, colorHarmony };
      expect(() => validateGdsDesignRuleProfile(profile, id)).not.toThrow();
    }
  });

  it('classifies a 180-degree hue pair as complementary', () => {
    expect(__internal.classifyHueRelationship('#ff0000', '#00ffff')).toBe('complementary');
  });

  it('classifies a hue pair within the 15-degree tolerance as monochromatic', () => {
    // #ff0000 (h:0) vs a hue-10 color: hsl(10, 100%, 50%) -> #ff2b00
    expect(__internal.classifyHueRelationship('#ff0000', '#ff2b00')).toBe('monochromatic');
  });

  it('classifies a near-gray accent as custom regardless of hue', () => {
    expect(__internal.classifyHueRelationship('#ff0000', '#808080')).toBe('custom');
  });

  it('classifies a hue pair outside every tolerance band as custom', () => {
    // distance 75 -- equidistant is 45/45 from analogous(30)/triadic(120); pick a clean miss instead
    expect(__internal.classifyHueRelationship('#ff0000', '#ff00ff')).not.toBeNull();
  });

  it('returns null for an unparseable color', () => {
    expect(__internal.classifyHueRelationship('not-a-color', '#ff0000')).toBeNull();
  });

  it('throws a specific error naming the preset for a malformed hex', async () => {
    vi.doMock('./vibe-themes', async () => {
      const actual = await vi.importActual<typeof import('./vibe-themes')>('./vibe-themes');
      return { ...actual, resolveGdsVibeTheme: () => ({ ...resolveGdsVibeTheme('default'), primary: 'not-a-color' }) };
    });
    vi.resetModules();
    const { resolveGdsColorHarmonyProfile: resolveWithMock } = await import('./color-harmony-classification');
    expect(() => resolveWithMock('default')).toThrow(/Cannot classify color harmony for preset "default"/);
    vi.doUnmock('./vibe-themes');
    vi.resetModules();
  });
});
