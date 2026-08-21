import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  brandContrastRatio,
  createBrandTheme,
  deriveBrandSemanticTokens,
  GdsBrandThemeError,
  type BrandColorRamps,
  type BrandFonts,
} from './brand-tokens';
import { GDS_DEFAULT_DESIGN_RULE_PROFILE, GdsAxisError } from './axes';
import { resetGdsDevWarnings } from './dev-warnings';

const classScoutColors: BrandColorRamps = {
  navy: '#0b223e',
  terracotta: '#ca8570',
  sage: '#90a287',
  cream: '#faf7f1',
  slate: '#434c59',
};

const fonts: BrandFonts = { display: 'Bogart', body: 'Garet' };

describe('createBrandTheme', () => {
  it('returns a mantine theme, css variables, and a validated token graph', () => {
    const result = createBrandTheme({ brandColors: classScoutColors, fonts });
    expect(result.mantineTheme).toBeTruthy();
    expect(result.tokenGraph.themes).toEqual(['brand']);
    expect(result.cssVariables['--gds-brand-primary']).toBe('#0b223e');
    expect(result.cssVariables['--gds-brand-accent']).toBe('#ca8570');
    expect(result.cssVariables['--gds-bg-page']).toBe('#faf7f1');
  });

  it('creates the first-class Class USA theme from ramps and semantic roles (v2 re-base, issue 536)', () => {
    const result = createBrandTheme('class-usa');

    expect(result.tokenGraph.themes).toEqual(['class-usa']);
    expect(result.mantineTheme.primaryColor).toBe('classUsaNavy');

    // Named radius steps map to the handoff's 8/12/16/24/pill scale.
    expect(result.mantineTheme.radius).toEqual({
      xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '624.9375rem',
    });
    expect(result.mantineTheme.defaultRadius).toBe('md');
    expect(result.mantineTheme.components?.Button?.defaultProps?.radius).toBe('sm');
    expect(result.mantineTheme.components?.Card?.defaultProps?.radius).toBe('md');
    expect(result.mantineTheme.components?.Paper?.defaultProps?.radius).toBe('md');
    expect(result.mantineTheme.components?.Badge?.defaultProps?.radius).toBe('xl');
    expect(result.mantineTheme.other?.gdsBrandThemeId).toBe('class-usa');
    expect(result.cssVariables['--gds-brand-primary']).toBe('#0f2c4a');
    expect(result.cssVariables['--gds-brand-primary-pressed']).toBe('#071626');
    expect(result.cssVariables['--gds-brand-accent']).toBe('#c24a0a');
    expect(result.cssVariables['--gds-brand-accent-dark']).toBe('#f5793b');
    expect(result.cssVariables['--gds-brand-accent-action']).toBe('#c24a0a');
    expect(result.cssVariables['--gds-bg-card']).toBe('#ffffff');
    expect(result.cssVariables['--gds-border-card']).toBe('#e6e1d8');
  });

  it('renders Class USA CTAs in the action ramp, not navy chrome (v2 re-base, issue 536)', () => {
    const result = createBrandTheme('class-usa');

    expect((result.mantineTheme.components?.Button?.defaultProps as { color?: string } | undefined)?.color).toBe('classUsaAction');
    expect(result.mantineTheme.colors?.classUsaAction?.[6]).toBe('#c24a0a');
    expect(result.mantineTheme.colors?.classUsaBrand?.[5]).toBe('#f5793b');
    expect(result.mantineTheme.colors?.classUsaTrust?.[6]).toBe('#4f8a5b');
    // White CTA-label text against the action color the button actually renders.
    expect(brandContrastRatio('#ffffff', result.cssVariables['--gds-brand-accent-action'])).toBeGreaterThanOrEqual(4.5);
  });

  it('creates the first-class Gold Athlete theme from ramps and semantic roles', () => {
    const result = createBrandTheme('gold-athlete');

    expect(result.tokenGraph.themes).toEqual(['gold-athlete']);
    expect(result.mantineTheme.primaryColor).toBe('goldAthleteCharcoal');
    expect(result.mantineTheme.other?.gdsBrandThemeId).toBe('gold-athlete');
    expect(result.cssVariables['--gds-brand-primary']).toBe('#12161c');
    expect(result.cssVariables['--gds-brand-primary-pressed']).toBe('#0a0d12');
    expect(result.cssVariables['--gds-brand-accent']).toBe('#c08a12');
    expect(result.cssVariables['--gds-brand-accent-action']).toBe('#8a5a00');
    expect(result.cssVariables['--gds-bg-card']).toBe('#ffffff');
    expect(result.cssVariables['--gds-border-card']).toBe('#ede2c6');
    // Gold accent must never be the on-white body-text color; body stays charcoal.
    expect(brandContrastRatio('#ffffff', result.cssVariables['--gds-brand-accent-action'])).toBeGreaterThanOrEqual(4.5);
    expect(brandContrastRatio(result.cssVariables['--gds-text-primary'], result.cssVariables['--gds-bg-page'])).toBeGreaterThanOrEqual(4.5);
  });

  it('emits light and dark values for every semantic role', () => {
    const { cssVariables } = createBrandTheme({ brandColors: classScoutColors, fonts });
    const roles = Object.keys(deriveBrandSemanticTokens(classScoutColors));

    // `role.replace('.', '-')` leaves the camelCase segment intact for these two roles, so
    // they must resolve to their fully-kebab alias, the spelling consumers actually read.
    const kebabOnly = { 'brand.primaryPressed': '--gds-brand-primary-pressed', 'text.onInverse': '--gds-text-on-inverse' };

    for (const role of roles) {
      const base = kebabOnly[role as keyof typeof kebabOnly] ?? `--gds-${role.replace('.', '-')}`;
      expect(cssVariables[base]).toBeTruthy();
      expect(cssVariables[`${base}-dark`]).toBeTruthy();
    }

    // The removed spellings must stay removed: re-emitting one reintroduces a dead token.
    expect(cssVariables['--gds-brand-primaryPressed']).toBeUndefined();
    expect(cssVariables['--gds-text-onInverse']).toBeUndefined();
  });

  it('emits --gds-text-on-inverse (the fully-kebab name every consumer and preset actually reads), not just --gds-text-onInverse', () => {
    const { cssVariables } = createBrandTheme({ brandColors: classScoutColors, fonts });
    const tokens = deriveBrandSemanticTokens(classScoutColors);
    expect(cssVariables['--gds-text-on-inverse']).toBe(tokens['text.onInverse'].light);
    expect(cssVariables['--gds-text-on-inverse-dark']).toBe(tokens['text.onInverse'].dark);
  });

  it('applies the display font to headings and the body font to body', () => {
    const { mantineTheme } = createBrandTheme({ brandColors: classScoutColors, fonts });
    expect(mantineTheme.headings.fontFamily).toContain('Bogart');
    expect(mantineTheme.fontFamily).toContain('Garet');
  });

  it('is deterministic for identical input', () => {
    const a = createBrandTheme({ brandColors: classScoutColors, fonts });
    const b = createBrandTheme({ brandColors: classScoutColors, fonts });
    expect(a.cssVariables).toEqual(b.cssVariables);
    expect(a.tokenGraph.nodes).toEqual(b.tokenGraph.nodes);
  });

  it('throws GdsBrandThemeError on invalid hex', () => {
    expect(() =>
      createBrandTheme({ brandColors: { ...classScoutColors, navy: 'navy' }, fonts }),
    ).toThrow(GdsBrandThemeError);
  });

  it('throws GdsBrandThemeError on a missing font slot', () => {
    expect(() =>
      createBrandTheme({ brandColors: classScoutColors, fonts: { display: 'Bogart', body: '' } }),
    ).toThrow(GdsBrandThemeError);
  });

  it('throws when a derived text/surface pair fails WCAG AA', () => {
    // sage page background with sage text would collapse contrast; force via cream==navy.
    expect(() =>
      createBrandTheme({ brandColors: { ...classScoutColors, cream: '#0b223e' }, fonts }),
    ).toThrow(GdsBrandThemeError);
  });
});

describe('createBrandTheme designRuleProfile (issue #648)', () => {
  beforeEach(() => resetGdsDevWarnings());

  it('defaults to the computed 60-30-10 profile for a named preset', () => {
    const result = createBrandTheme('class-usa');
    expect(result.designRuleProfile.colorProportion.rule).toBe('60-30-10');
  });

  it('defaults to GDS_DEFAULT_DESIGN_RULE_PROFILE for a custom brand (no preset identity)', () => {
    const result = createBrandTheme({ brandColors: classScoutColors, fonts });
    expect(result.designRuleProfile).toEqual(GDS_DEFAULT_DESIGN_RULE_PROFILE);
  });

  it('respects an explicit designRuleProfile', () => {
    const result = createBrandTheme('gold-athlete', { designRuleProfile: GDS_DEFAULT_DESIGN_RULE_PROFILE });
    expect(result.designRuleProfile).toEqual(GDS_DEFAULT_DESIGN_RULE_PROFILE);
  });

  it('throws for an invalid explicit designRuleProfile', () => {
    const invalid = { ...GDS_DEFAULT_DESIGN_RULE_PROFILE, typeScale: { ratio: 1.4 as never } };
    expect(() => createBrandTheme('class-usa', { designRuleProfile: invalid })).toThrow(GdsAxisError);
  });

  describe('accent-as-background dev warning', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns exactly once when overrides sets a background-relevant key to an accent-classed color', () => {
      const accent = createBrandTheme('class-usa').cssVariables['--gds-brand-accent'];
      createBrandTheme('class-usa', {
        overrides: { components: { Card: { styles: { root: { background: accent } } } } },
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('accent-classed color');
    });

    it('does not warn for the identical color in a non-background (text color) path', () => {
      const accent = createBrandTheme('class-usa').cssVariables['--gds-brand-accent'];
      createBrandTheme('class-usa', {
        overrides: { components: { Card: { styles: { root: { color: accent } } } } },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn when overrides has no colliding value', () => {
      createBrandTheme('class-usa', {
        overrides: { components: { Card: { styles: { root: { background: '#123456' } } } } },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('respects an explicit designRuleProfile opt-out (rule: "none"), even with a colliding override', () => {
      const accent = createBrandTheme('class-usa').cssVariables['--gds-brand-accent'];
      createBrandTheme('class-usa', {
        designRuleProfile: GDS_DEFAULT_DESIGN_RULE_PROFILE,
        overrides: { components: { Card: { styles: { root: { background: accent } } } } },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});

describe('brandContrastRatio', () => {
  it('computes a high ratio for navy on cream and white on navy', () => {
    expect(brandContrastRatio('#0b223e', '#faf7f1')).toBeGreaterThan(4.5);
    expect(brandContrastRatio('#ffffff', '#0b223e')).toBeGreaterThan(4.5);
  });

  it('accepts 3-digit hex shorthand', () => {
    expect(brandContrastRatio('#000', '#fff')).toBeGreaterThan(20);
  });

  it('throws instead of silently scoring unparseable input against black', () => {
    expect(() => brandContrastRatio('var(--gds-brand-accent)', '#faf7f1')).toThrow(/hex color/);
    expect(() => brandContrastRatio('#0b223e', 'not-a-color')).toThrow(/hex color/);
    expect(() => brandContrastRatio('#gggggg', '#faf7f1')).toThrow(/hex color/);
    expect(() => brandContrastRatio('0b223e', '#faf7f1')).toThrow(/hex color/);
  });
});
