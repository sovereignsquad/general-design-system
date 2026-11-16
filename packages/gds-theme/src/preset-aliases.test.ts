import { describe, expect, it } from 'vitest';
import { GDS_THEME_PRESET_ALIASES, normalizeGdsThemePresetId } from './presets/aliases';
import { getGdsThemePresets, resolveGdsThemePreset } from './theme-presets';
import { getGdsVibeThemeCssVariables, resolveGdsVibeTheme } from './vibe-themes';
import { createBrandTheme } from './brand-tokens';
import { createGdsThemePresetSelection } from './theme-runtime';
import { computeGdsThemeIdentity } from './theme-identity';

describe('deprecated preset ids resolve to their neutral replacements (#985)', () => {
  const pairs = Object.entries(GDS_THEME_PRESET_ALIASES) as Array<[keyof typeof GDS_THEME_PRESET_ALIASES, string]>;

  it('every replacement is a registered preset and no old id is', () => {
    const ids = getGdsThemePresets().map((preset) => preset.id as string);
    for (const [old, current] of pairs) {
      expect(ids).toContain(current);
      expect(ids).not.toContain(old);
    }
  });

  it.each(pairs)('%s resolves to %s everywhere a preset id is accepted', (old, current) => {
    expect(normalizeGdsThemePresetId(old)).toBe(current);
    expect(resolveGdsVibeTheme(old)).toBe(resolveGdsVibeTheme(current as never));
    expect(getGdsVibeThemeCssVariables(old, 'dark')).toEqual(getGdsVibeThemeCssVariables(current as never, 'dark'));
    expect(resolveGdsThemePreset(old)).toBe(resolveGdsThemePreset(current as never));
    expect(createGdsThemePresetSelection({ preset: old }).preset).toBe(current);
    expect(computeGdsThemeIdentity({ preset: old, colorScheme: 'light' })).toBe(computeGdsThemeIdentity({ preset: current, colorScheme: 'light' }));
  });

  it('createBrandTheme accepts the old brand ids', () => {
    expect(createBrandTheme('class-usa').mantineTheme.other?.gdsBrandThemeId).toBe('harbor');
    expect(createBrandTheme('gold-athlete').mantineTheme.other?.gdsBrandThemeId).toBe('ochre');
  });

  it('leaves current and unknown ids unchanged', () => {
    expect(normalizeGdsThemePresetId('default')).toBe('default');
    expect(normalizeGdsThemePresetId('not-a-preset')).toBe('not-a-preset');
  });
});
