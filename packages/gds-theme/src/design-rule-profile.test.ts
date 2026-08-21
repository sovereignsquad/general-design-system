import { describe, expect, it } from 'vitest';
import {
  GDS_DEFAULT_DESIGN_RULE_PROFILE, GdsAxisError, validateGdsDesignRuleProfile,
} from './axes';
import type { GdsDesignRuleProfile } from './axes';

function baseProfile(): GdsDesignRuleProfile {
  return {
    colorProportion: { rule: '60-30-10', classification: { dominant: ['bg.page'], secondary: ['brand.primary'], accent: ['brand.accent'] } },
    colorHarmony: 'complementary',
    typeScale: { ratio: 1.333 },
    contrastTarget: 'AA',
  };
}

describe('design rule profile (issue #643)', () => {
  it('the default profile passes validation with no throw', () => {
    expect(() => validateGdsDesignRuleProfile(GDS_DEFAULT_DESIGN_RULE_PROFILE)).not.toThrow();
  });

  it('a well-formed 60-30-10 profile with a correctly-partitioned classification passes', () => {
    expect(() => validateGdsDesignRuleProfile(baseProfile())).not.toThrow();
  });

  it('rejects a colorProportion.rule outside the closed union', () => {
    const profile = { ...baseProfile(), colorProportion: { ...baseProfile().colorProportion, rule: '70-20-10' as any } };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(GdsAxisError);
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/colorProportion\.rule/);
  });

  it('rejects a colorHarmony outside the closed union', () => {
    const profile = { ...baseProfile(), colorHarmony: 'tetradic' as any };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/colorHarmony/);
  });

  it('rejects a typeScale.ratio outside the six named ratios', () => {
    const profile = { ...baseProfile(), typeScale: { ratio: 1.4 as any } };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/typeScale\.ratio/);
  });

  it('rejects a near-miss ratio that is not exactly one of the six named values', () => {
    const profile = { ...baseProfile(), typeScale: { ratio: 1.334 as any } };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/typeScale\.ratio/);
  });

  it('rejects a contrastTarget outside AA/AAA', () => {
    const profile = { ...baseProfile(), contrastTarget: 'AAAA' as any };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/contrastTarget/);
  });

  it('rejects rule "none" with a non-empty classification as a contradiction', () => {
    const profile = { ...baseProfile(), colorProportion: { rule: 'none' as const, classification: baseProfile().colorProportion.classification } };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/either declare a rule or clear the classification/);
  });

  it('rejects a role classified in more than one proportion class', () => {
    const profile = {
      ...baseProfile(),
      colorProportion: {
        rule: '60-30-10' as const,
        classification: { dominant: ['bg.page'], secondary: ['bg.page'], accent: [] },
      },
    };
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/may belong to exactly one proportion class/);
  });

  it('does not reject a role duplicated within the same class', () => {
    const profile = {
      ...baseProfile(),
      colorProportion: {
        rule: '60-30-10' as const,
        classification: { dominant: ['bg.page', 'bg.page'], secondary: [], accent: [] },
      },
    };
    expect(() => validateGdsDesignRuleProfile(profile)).not.toThrow();
  });

  it('throws on the first violation when a profile has more than one problem', () => {
    const profile = { ...baseProfile(), colorHarmony: 'tetradic' as any, typeScale: { ratio: 1.4 as any } };
    // colorHarmony is checked before typeScale.ratio in validateGdsDesignRuleProfile's own order.
    expect(() => validateGdsDesignRuleProfile(profile)).toThrow(/colorHarmony/);
  });

  it('is a pure function: never mutates its profile argument', () => {
    const profile = baseProfile();
    const frozen = Object.freeze({ ...profile, colorProportion: Object.freeze({ ...profile.colorProportion, classification: Object.freeze({ ...profile.colorProportion.classification }) }) });
    expect(() => validateGdsDesignRuleProfile(frozen)).not.toThrow();
  });

  it('includes the themeId in the thrown message', () => {
    const profile = { ...baseProfile(), colorHarmony: 'tetradic' as any };
    expect(() => validateGdsDesignRuleProfile(profile, 'my-theme')).toThrow(/my-theme/);
  });
});
