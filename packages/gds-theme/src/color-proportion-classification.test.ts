import { describe, expect, it } from 'vitest';
import { validateGdsDesignRuleProfile, GDS_DEFAULT_DESIGN_RULE_PROFILE } from './axes';
import {
  ACCENT_ROLES, DOMINANT_ROLES, SECONDARY_ROLES,
  colorProportionClassificationByPreset, resolveGdsColorProportionProfile,
} from './color-proportion-classification';
import { getGdsVibeThemes } from './vibe-themes';
import type { BrandSemanticRole } from './semantic-token-source';

const ALL_PRESET_IDS = getGdsVibeThemes().map((v) => v.id);

const DECLARED_ROLES: BrandSemanticRole[] = [
  'brand.primary', 'brand.primaryPressed', 'brand.accent', 'accent', 'support',
  'bg.canvas', 'bg.card', 'bg.page', 'bg.surface', 'bg.inverse', 'border.card',
  'text.body', 'text.meta', 'text.primary', 'text.secondary', 'text.onInverse',
  'nav.inactiveOnInverse', 'price', 'star',
  'state.success', 'state.warning', 'state.danger', 'state.info',
  'badge.attention', 'badge.validation', 'badge.info', 'badge.urgencyBg',
  'focus.ring', 'control.disabledBg', 'control.disabledText',
];

describe('color-proportion classification (issue #644)', () => {
  it('classifies every declared BrandSemanticRole into exactly one class', () => {
    for (const role of DECLARED_ROLES) {
      const count = [DOMINANT_ROLES, SECONDARY_ROLES, ACCENT_ROLES].filter((list) => (list as string[]).includes(role)).length;
      expect(count).toBe(1);
    }
  });

  it('classified roles cover the full declared role set with no extras', () => {
    const classified = new Set([...DOMINANT_ROLES, ...SECONDARY_ROLES, ...ACCENT_ROLES]);
    expect(classified.size).toBe(DECLARED_ROLES.length);
    for (const role of DECLARED_ROLES) expect(classified.has(role)).toBe(true);
  });

  it('has a classification entry for every shipped preset (all 25)', () => {
    expect(ALL_PRESET_IDS.length).toBeGreaterThanOrEqual(25);
    for (const id of ALL_PRESET_IDS) {
      expect(colorProportionClassificationByPreset[id]).toBeDefined();
    }
    expect(Object.keys(colorProportionClassificationByPreset).length).toBe(ALL_PRESET_IDS.length);
  });

  it('resolveGdsColorProportionProfile returns rule 60-30-10 with the shared classification, for every preset', () => {
    for (const id of ALL_PRESET_IDS) {
      const profile = resolveGdsColorProportionProfile(id);
      expect(profile.rule).toBe('60-30-10');
      expect(profile.classification.dominant).toEqual(DOMINANT_ROLES);
      expect(profile.classification.secondary).toEqual(SECONDARY_ROLES);
      expect(profile.classification.accent).toEqual(ACCENT_ROLES);
    }
  });

  it('every preset\'s resolved color-proportion profile passes validateGdsDesignRuleProfile with no throw', () => {
    for (const id of ALL_PRESET_IDS) {
      const colorProportion = resolveGdsColorProportionProfile(id);
      const profile = { ...GDS_DEFAULT_DESIGN_RULE_PROFILE, colorProportion };
      expect(() => validateGdsDesignRuleProfile(profile, id)).not.toThrow();
    }
  });

  it('throws a specific error for an unregistered preset id', () => {
    expect(() => resolveGdsColorProportionProfile('not-a-real-preset' as any)).toThrow(/No color-proportion classification registered/);
  });

  it('focus.ring is classified accent, not secondary (documented judgment: thin stroke, negligible area)', () => {
    expect(ACCENT_ROLES).toContain('focus.ring');
    expect(SECONDARY_ROLES).not.toContain('focus.ring');
  });
});
