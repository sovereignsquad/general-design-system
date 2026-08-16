import { describe, expect, it } from 'vitest';
import { gdsBadgeAccentShades } from './GdsBadge';
import {
  gdsGeneratedPaletteCssRefs,
  gdsSeededRandom,
  resolveGdsGeneratedPaletteHex,
} from './generated-art-engine';

describe('gdsSeededRandom (#504)', () => {
  it('is deterministic: the same seed always produces the same sequence', () => {
    const a = gdsSeededRandom('listing-42');
    const b = gdsSeededRandom('listing-42');
    const sequenceA = [a(), a(), a(), a()];
    const sequenceB = [b(), b(), b(), b()];
    expect(sequenceA).toEqual(sequenceB);
  });

  it('produces different sequences for different seeds', () => {
    const a = gdsSeededRandom('listing-42');
    const b = gdsSeededRandom('listing-43');
    expect(a()).not.toBe(b());
  });

  it('stays in [0, 1) across many draws', () => {
    const next = gdsSeededRandom('range-check');
    for (let i = 0; i < 200; i += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('does not repeat the first value as a degenerate cycle of length 1', () => {
    const next = gdsSeededRandom('cycle-check');
    const first = next();
    const second = next();
    expect(second).not.toBe(first);
  });
});

describe('gdsGeneratedPaletteCssRefs (#504)', () => {
  it('defaults to theme mode: CSS var-reference strings, not literal hex', () => {
    const palette = gdsGeneratedPaletteCssRefs();
    expect(palette.source).toBe('theme');
    expect(palette.primary).toMatch(/^var\(--gds-brand-primary, #[0-9a-f]{6}\)$/);
    expect(palette.accent).toMatch(/^var\(--gds-brand-accent, #[0-9a-f]{6}\)$/);
  });

  it('category mode references the accent token so a category follows the theme', () => {
    // The live-DOM path emits a token with the axis-derived value as its var() fallback.
    const palette = gdsGeneratedPaletteCssRefs({ paletteSource: 'category', category: 'forest', shade: 'deep' });
    const expected = `var(--gds-accent-forest-deep, ${gdsBadgeAccentShades.forest.deep})`;
    expect(palette).toEqual({ primary: expected, accent: expected, source: 'category' });
  });

  it('category mode defaults shade to base', () => {
    const palette = gdsGeneratedPaletteCssRefs({ paletteSource: 'category', category: 'ocean' });
    expect(palette.primary).toBe(`var(--gds-accent-ocean-base, ${gdsBadgeAccentShades.ocean.base})`);
  });

  it('the non-DOM path still resolves to a literal, because var() does not resolve outside a browser', () => {
    // A var() in an OG image or an email silently produces an unpainted shape, not an error.
    const hex = resolveGdsGeneratedPaletteHex({ paletteSource: 'category', category: 'forest', shade: 'deep' });
    expect(hex.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(hex.primary).toBe(gdsBadgeAccentShades.forest.deep);
  });

  it('the non-DOM path resolves a category against the requested preset', () => {
    const themed = resolveGdsGeneratedPaletteHex({ paletteSource: 'category', category: 'plum', shade: 'deep', themePresetId: 'editorial' });
    expect(themed.primary).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('category mode throws a clear error when category is omitted', () => {
    expect(() => gdsGeneratedPaletteCssRefs({ paletteSource: 'category' })).toThrow(/requires a `category` option/);
  });

  it('an explicit colors override wins over paletteSource and passes through unchanged', () => {
    const palette = gdsGeneratedPaletteCssRefs({ paletteSource: 'category', colors: { primary: '#123456', accent: '#abcdef' } });
    expect(palette).toEqual({ primary: '#123456', accent: '#abcdef', source: 'override' });
  });

  it('tintWithBackground + mixRatio wraps each resolved color in color-mix()', () => {
    const palette = gdsGeneratedPaletteCssRefs({
      paletteSource: 'category', category: 'forest', shade: 'deep',
      tintWithBackground: 'var(--gds-bg-canvas)', mixRatio: 0.6,
    });
    const expected = `color-mix(in srgb, var(--gds-accent-forest-deep, ${gdsBadgeAccentShades.forest.deep}) 60%, var(--gds-bg-canvas))`;
    expect(palette).toEqual({ primary: expected, accent: expected, source: 'category' });
  });

  it('an explicit colors override is used exactly as supplied, ignoring tintWithBackground/mixRatio', () => {
    const palette = gdsGeneratedPaletteCssRefs({
      colors: { primary: '#123456', accent: '#abcdef' },
      tintWithBackground: 'var(--gds-bg-canvas)', mixRatio: 0.5,
    });
    expect(palette).toEqual({ primary: '#123456', accent: '#abcdef', source: 'override' });
  });
});

describe('resolveGdsGeneratedPaletteHex (#504)', () => {
  it('resolves literal theme hex for a built-in preset, matching getGdsVibeThemeCssVariables', () => {
    const palette = resolveGdsGeneratedPaletteHex({ themePresetId: 'class-usa' });
    expect(palette.source).toBe('theme');
    expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.accent).toMatch(/^#[0-9a-f]{6}$/);
    // class-usa's hand-authored brand primary, per vibe-themes.ts's classUsaSemanticCssVariables.
    expect(palette.primary).toBe('#0f2c4a');
  });

  it('resolves the default preset without requiring themePresetId to be class-usa specifically', () => {
    const palette = resolveGdsGeneratedPaletteHex({ themePresetId: 'default' });
    expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('throws a clear, actionable error for theme mode with neither themePresetId nor colors', () => {
    expect(() => resolveGdsGeneratedPaletteHex({})).toThrow(/requires either `themePresetId`.*or an explicit `colors`/);
  });

  it('category mode needs no themePresetId and matches the CSS-ref resolver', () => {
    const palette = resolveGdsGeneratedPaletteHex({ paletteSource: 'category', category: 'bronze', shade: 'deepest' });
    expect(palette).toEqual({ primary: gdsBadgeAccentShades.bronze.deepest, accent: gdsBadgeAccentShades.bronze.deepest, source: 'category' });
  });

  it('an explicit colors override still wins even with theme mode and no themePresetId', () => {
    const palette = resolveGdsGeneratedPaletteHex({ colors: { primary: '#111111', accent: '#222222' } });
    expect(palette).toEqual({ primary: '#111111', accent: '#222222', source: 'override' });
  });

  it('tintWithBackground + mixRatio mixes the literal hex via mixCssColors', () => {
    const untinted = resolveGdsGeneratedPaletteHex({ paletteSource: 'category', category: 'forest', shade: 'deep' });
    const tinted = resolveGdsGeneratedPaletteHex({
      paletteSource: 'category', category: 'forest', shade: 'deep',
      tintWithBackground: '#ffffff', mixRatio: 0.5,
    });
    expect(tinted.primary).toMatch(/^rgb\(/);
    expect(tinted.primary).not.toBe(untinted.primary);
  });
});
