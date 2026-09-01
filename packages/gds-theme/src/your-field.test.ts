import { describe, expect, it } from 'vitest';
import {
  YOUR_FIELD_CORE_PALETTE,
  YOUR_FIELD_CREAM,
  YOUR_FIELD_NAVY,
  YOUR_FIELD_PEACH,
  YOUR_FIELD_PEACH_DEEP,
  YOUR_FIELD_RAMP_ANCHOR_INDEX,
  YOUR_FIELD_RAMPS,
  YOUR_FIELD_ROLES,
  yourFieldThemePreset,
} from './your-field';
import { getGdsThemePresets, resolveGdsThemePreset } from './theme-presets';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';
import { contrastRatio } from './color-math';

describe('your-field preset', () => {
  it('is registered in the catalog and resolvable', () => {
    expect(getGdsThemePresets().map((p) => p.id)).toContain('your-field');
    expect(resolveGdsThemePreset('your-field')).toBe(yourFieldThemePreset);
    expect(getGdsVibeThemes().map((v) => v.id)).toContain('your-field');
  });

  it('does not touch class-usa', () => {
    // The lane ships as a new preset, not a rename or re-base — this is the regression a
    // careless refactor of theme-presets.ts could most easily introduce.
    expect(getGdsThemePresets().map((p) => p.id)).toContain('class-usa');
    const classUsa = resolveGdsThemePreset('class-usa');
    expect(classUsa).not.toBe(yourFieldThemePreset);
  });

  it('preserves every brand anchor colour verbatim at its fig-verified ramp index', () => {
    const colors = yourFieldThemePreset.colors as Record<string, readonly string[]>;
    for (const [name, hex] of Object.entries(YOUR_FIELD_CORE_PALETTE)) {
      const rampKey = YOUR_FIELD_RAMPS[name as keyof typeof YOUR_FIELD_RAMPS];
      const index = YOUR_FIELD_RAMP_ANCHOR_INDEX[name as keyof typeof YOUR_FIELD_RAMP_ANCHOR_INDEX];
      expect(colors[rampKey][index], `${name} survives at index ${index}`).toBe(hex.toUpperCase());
    }
  });

  it('registers a ten-step ramp for every core colour', () => {
    const colors = yourFieldThemePreset.colors as Record<string, readonly string[]>;
    expect(Object.keys(colors).sort()).toEqual(Object.values(YOUR_FIELD_RAMPS).sort());
    for (const [key, ramp] of Object.entries(colors)) {
      expect(ramp, `${key} is a ten-step ramp`).toHaveLength(10);
    }
  });

  it('pins the primary to navy in BOTH schemes', () => {
    // Mantine's dark default is shade 8, which would paint a darkened navy the brand never chose.
    expect(yourFieldThemePreset.primaryColor).toBe(YOUR_FIELD_RAMPS.navy);
    expect(yourFieldThemePreset.primaryShade).toEqual({
      light: YOUR_FIELD_RAMP_ANCHOR_INDEX.navy,
      dark: YOUR_FIELD_RAMP_ANCHOR_INDEX.navy,
    });
  });

  it('paints the governed button rule with navy in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      expect(getGdsVibeThemeCssVariables('your-field', scheme)['--gds-vibe-primary']?.toUpperCase())
        .toBe(YOUR_FIELD_NAVY.toUpperCase());
    }
  });

  it('white on navy clears AA for the primary button', () => {
    const ratio = contrastRatio('#ffffff', YOUR_FIELD_NAVY, YOUR_FIELD_NAVY);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(4.5);
  });

  it('records both halves of the peach accent contrast tradeoff', () => {
    // Raw peach fails even the 3:1 non-text floor as a functional accent on the cream canvas —
    // it stays scoped to outlines and strokes. Peach-deep is the carrier for anything functional.
    const rawPeachOnCream = contrastRatio(YOUR_FIELD_PEACH, YOUR_FIELD_CREAM, YOUR_FIELD_CREAM);
    expect(rawPeachOnCream).not.toBeNull();
    expect(rawPeachOnCream!).toBeLessThan(3);

    const peachDeepOnCream = contrastRatio(YOUR_FIELD_PEACH_DEEP, YOUR_FIELD_CREAM, YOUR_FIELD_CREAM);
    expect(peachDeepOnCream).not.toBeNull();
    expect(peachDeepOnCream!).toBeGreaterThanOrEqual(3);
  });

  it('never uses peach or peach-deep for body text roles', () => {
    // A regression guard for the source material's own documented limitation.
    const textRoles = [YOUR_FIELD_ROLES.heading, YOUR_FIELD_ROLES.price, YOUR_FIELD_ROLES.navInactiveText];
    expect(textRoles).not.toContain(YOUR_FIELD_PEACH);
    expect(textRoles).not.toContain(YOUR_FIELD_PEACH_DEEP);
  });

  it('reserves the Scout AI gradient tokens under their own role namespace', () => {
    expect(YOUR_FIELD_ROLES.aiGradient).toContain('#FF6B35');
    expect(YOUR_FIELD_ROLES.aiGradient).toContain('#FF9055');
    expect(YOUR_FIELD_ROLES.focusRing).toBe('#FF6B35');
  });

  it('carries the brand roles on theme.other for consumers to read by name', () => {
    expect((yourFieldThemePreset.other as Record<string, unknown>).yourField).toEqual(YOUR_FIELD_ROLES);
  });

  it('never redefines a shared Mantine radius step (the class-usa xl/pill collision)', () => {
    // Regression guard for the live classscout.ai incident (2026-09-01): class-usa's issue 551
    // repointed the shared `xl` step to mean "pill", silently turning every consumer's
    // radius="xl" rounded-rectangle into a full ellipse. This preset must never touch the shared
    // scale — every radius value is literal, at the specific component that needs it.
    expect(yourFieldThemePreset.radius).toBeUndefined();
    expect(yourFieldThemePreset.defaultRadius).toBeUndefined();
  });
});
