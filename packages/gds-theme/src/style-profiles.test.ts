import { describe, expect, it } from 'vitest';
import { validateGdsAccessibilityFloor } from './accessibility-floor';
import { GDS_DEFAULT_ELEVATION_AXIS, GDS_DEFAULT_SHAPE_AXIS } from './axes';
import {
  applyGdsStyleProfile,
  GDS_STYLE_PROFILE_IDS,
  GDS_STYLE_PROFILES,
  GDS_UTILITY_RADIUS_CAP,
  GDS_UTILITY_RADIUS_ROLES,
  normalizeGdsStyleProfile,
} from './style-profiles';
import { createGdsThemePresetSelection } from './theme-runtime';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

const RADIUS_ORDER = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill'];

describe('style profiles (#987)', () => {
  it('default leaves the preset axes untouched', () => {
    const axes = { shape: GDS_DEFAULT_SHAPE_AXIS };
    expect(applyGdsStyleProfile(axes, 'default')).toBe(axes);
    expect(getGdsVibeThemeCssVariables('harbor', 'light', { styleProfile: 'default' })).toEqual(getGdsVibeThemeCssVariables('harbor', 'light'));
  });

  it('each profile sets its radius roles, density mode and resting elevation', () => {
    for (const [id, definition] of Object.entries(GDS_STYLE_PROFILES)) {
      const axes = applyGdsStyleProfile(undefined, id as keyof typeof GDS_STYLE_PROFILES)!;
      expect(axes.density?.mode, id).toBe(definition.density);
      expect(axes.elevation?.roles?.card, id).toBe(definition.elevation.card);
      expect(axes.elevation?.roles?.modal, `${id} keeps overlay elevation`).toBe(GDS_DEFAULT_ELEVATION_AXIS.roles?.modal);
      const vars = getGdsVibeThemeCssVariables('default', 'light', { styleProfile: id as keyof typeof GDS_STYLE_PROFILES });
      expect(vars['--gds-radius-card'], id).toBe(GDS_DEFAULT_SHAPE_AXIS.scale[definition.radius.card!]);
    }
  });

  it('keeps the preset radius scale and changes only the role map', () => {
    const preset = getGdsVibeThemes().find((t) => t.id === 'harbor')!;
    const axes = applyGdsStyleProfile(preset.axes, 'soft')!;
    expect(axes.shape?.scale).toEqual(preset.axes?.shape?.scale);
  });

  it('caps utility radius roles in every profile', () => {
    for (const id of Object.keys(GDS_STYLE_PROFILES) as (keyof typeof GDS_STYLE_PROFILES)[]) {
      const roles = applyGdsStyleProfile(undefined, id)!.shape!.roles!;
      for (const role of GDS_UTILITY_RADIUS_ROLES) {
        const step = roles[role] as string | undefined;
        if (step) expect(RADIUS_ORDER.indexOf(step), `${id} ${role}`).toBeLessThanOrEqual(RADIUS_ORDER.indexOf(GDS_UTILITY_RADIUS_CAP));
      }
    }
  });

  it('every preset passes the accessibility floor under every profile, in both schemes', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const styleProfile of GDS_STYLE_PROFILE_IDS) {
        for (const scheme of ['light', 'dark'] as const) {
          const tokens = getGdsVibeThemeCssVariables(id, scheme, { styleProfile });
          const violations = validateGdsAccessibilityFloor({ presetId: id, scheme, tokens }).filter((v) => v.severity === 'violation');
          expect(violations, `${id} ${styleProfile} ${scheme}`).toEqual([]);
        }
      }
    }
  });

  it('normalises unknown values and keeps pre-existing runtime keys', () => {
    expect(normalizeGdsStyleProfile('nope')).toBe('default');
    expect(normalizeGdsStyleProfile('soft')).toBe('soft');
    const plain = createGdsThemePresetSelection({ preset: 'harbor', colorScheme: 'light' });
    expect(plain.styleProfile).toBe('default');
    expect(plain.runtimeKey).toBe('harbor-light-blue-true-false-inter');
    expect(createGdsThemePresetSelection({ preset: 'harbor', colorScheme: 'light', styleProfile: 'structured' }).runtimeKey).toBe('harbor-light-blue-true-false-inter-structured');
  });
});
