import { describe, expect, it } from 'vitest';
import { contrastRatio, mixCssColors } from './color-math';
import { validateGdsAccessibilityFloor } from './accessibility-floor';
import { deriveVibeSemanticCssVariables, getGdsVibeCardSurface } from './semantic-token-source';
import { assertGdsHandAuthoredCardMatchesSurface, GdsCardSurfaceError, getGdsVibeThemeCssVariables, resolveGdsVibeTheme } from './vibe-themes';

// A fixture modelled on try-on's palette (#865): canvas #0b0b0f, card #16161e.
const base = resolveGdsVibeTheme('default');
const opaque = { ...base, canvasDark: '#0b0b0f', surfaceDark: '#16161e' };
const translucent = { ...base, canvasDark: '#0b0b0f', surfaceDark: 'rgba(22, 22, 30, 0.9)' };

describe('card surface from the palette (#865)', () => {
  it('treats only alpha-1 colours as opaque', () => {
    for (const value of ['#16161e', '#16161eff', 'rgb(22, 22, 30)', 'rgba(22, 22, 30, 1)']) {
      expect(getGdsVibeCardSurface({ surfaceLight: '#fff', surfaceDark: value }, 'dark'), value).toBe(value);
    }
    for (const value of ['rgba(22, 22, 30, 0.9)', '#16161e80', 'var(--x)', 'color-mix(in srgb, red, blue)']) {
      expect(getGdsVibeCardSurface({ surfaceLight: '#fff', surfaceDark: value }, 'dark'), value).toBeUndefined();
    }
  });

  it('an opaque surface is the card and surface role; a translucent one keeps the canvas mix', () => {
    const derived = deriveVibeSemanticCssVariables(opaque);
    expect(derived['--gds-bg-card-dark']).toBe('#16161e');
    expect(derived['--gds-bg-surface-dark']).toBe('#16161e');
    const fallback = deriveVibeSemanticCssVariables(translucent);
    expect(fallback['--gds-bg-card-dark']).toBe(mixCssColors('#0b0b0f', '#ffffff', 0.88, '#0b0b0f'));
  });

  it('badge tints re-derive against the declared card and stay legible', () => {
    const derived = deriveVibeSemanticCssVariables(opaque);
    for (const tone of ['success', 'warning', 'danger', 'info'] as const) {
      expect(derived[`--gds-badge-soft-${tone}-dark`]).toBe(mixCssColors(derived[`--gds-state-${tone}-dark`], '#16161e', 0.16, '#16161e'));
    }
    expect(derived['--gds-badge-soft-neutral-dark']).toBe('#16161e');
    const darkTokens = Object.fromEntries(Object.entries(derived).filter(([k]) => k.endsWith('-dark')).map(([k, v]) => [k.replace(/-dark$/, ''), v]));
    expect(validateGdsAccessibilityFloor({ presetId: 'fixture', scheme: 'dark', tokens: darkTokens }).filter((v) => v.ruleId === 'badge-tone-pairs-legible')).toEqual([]);
  });

  it('the two opaque presets take their declared dark card; light stays white', () => {
    expect(getGdsVibeThemeCssVariables('high-contrast', 'dark')['--gds-bg-card']).toBe('#000000');
    expect(getGdsVibeThemeCssVariables('colorblind-safe', 'dark')['--gds-bg-card']).toBe('#101b28');
    expect(getGdsVibeThemeCssVariables('high-contrast', 'light')['--gds-bg-card']).toBe('#ffffff');
    expect(getGdsVibeThemeCssVariables('colorblind-safe', 'light')['--gds-bg-card']).toBe('#ffffff');
    expect(getGdsVibeThemeCssVariables('colorblind-safe', 'dark')['--gds-vibe-card']).toBe('#101b28');
    const body = getGdsVibeThemeCssVariables('colorblind-safe', 'dark');
    expect(contrastRatio(body['--gds-text-body'], body['--gds-bg-card'], body['--gds-bg-card']) ?? 0).toBeGreaterThanOrEqual(4.5);
  });

  it('emits --gds-vibe-card only for a preset and scheme with an opaque surface', () => {
    expect(getGdsVibeThemeCssVariables('default', 'dark')['--gds-vibe-card']).toBeUndefined();
    expect(getGdsVibeThemeCssVariables('sunset', 'light')['--gds-vibe-card']).toBeUndefined();
  });

  it('a hand-authored card that contradicts an opaque surface fails construction; the same value is accepted', () => {
    expect(() => assertGdsHandAuthoredCardMatchesSurface('fixture', opaque, { '--gds-bg-card-dark': '#000000' })).toThrow(GdsCardSurfaceError);
    expect(() => assertGdsHandAuthoredCardMatchesSurface('fixture', opaque, { '--gds-bg-card-dark': '#16161E' })).not.toThrow();
    expect(() => assertGdsHandAuthoredCardMatchesSurface('fixture', translucent, { '--gds-bg-card-dark': '#000000' })).not.toThrow();
  });
});
