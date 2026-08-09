import { describe, expect, it } from 'vitest';
import {
  brandContrastRatio,
  createBrandTheme,
  deriveBrandSemanticTokens,
  GdsBrandThemeError,
  type BrandColorRamps,
  type BrandFonts,
} from './brand-tokens';

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
    for (const role of roles) {
      const base = `--gds-${role.replace('.', '-')}`;
      expect(cssVariables[base]).toBeTruthy();
      expect(cssVariables[`${base}-dark`]).toBeTruthy();
    }
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
