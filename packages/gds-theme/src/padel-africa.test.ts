import { describe, expect, it } from 'vitest';
import {
  PADEL_AFRICA_BASE_INDEX,
  PADEL_AFRICA_CORE_PALETTE,
  PADEL_AFRICA_ACCESSIBLE_CTA,
  PADEL_AFRICA_EMERALD,
  PADEL_AFRICA_RAMPS,
  PADEL_AFRICA_ROLES,
  buildPadelAfricaRamp,
  padelAfricaThemePreset,
} from './padel-africa';
import { getGdsThemePresets, resolveGdsThemePreset } from './theme-presets';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';
import { contrastRatio } from './color-math';

describe('padel-africa preset', () => {
  it('is registered in the catalog and resolvable', () => {
    expect(getGdsThemePresets().map((p) => p.id)).toContain('padel-africa');
    expect(resolveGdsThemePreset('padel-africa')).toBe(padelAfricaThemePreset);
    expect(getGdsVibeThemes().map((v) => v.id)).toContain('padel-africa');
  });

  // The whole reason ramps are explicit: createBrandTheme's interpolating form produced a colour
  // present in no brand asset, and primaryShade then painted it everywhere.
  it('preserves every brand colour verbatim at the painted index', () => {
    for (const [name, hex] of Object.entries(PADEL_AFRICA_CORE_PALETTE)) {
      expect(buildPadelAfricaRamp(hex)[PADEL_AFRICA_BASE_INDEX], `${name} survives its ramp`)
        .toBe(hex.toUpperCase());
    }
  });

  it('registers a ten-step ramp for every core colour', () => {
    const colors = padelAfricaThemePreset.colors as Record<string, readonly string[]>;
    expect(Object.keys(colors).sort()).toEqual(Object.values(PADEL_AFRICA_RAMPS).sort());
    for (const [key, ramp] of Object.entries(colors)) {
      expect(ramp, `${key} is a ten-step ramp`).toHaveLength(10);
    }
  });

  it('pins the primary to Emerald in BOTH schemes', () => {
    // Mantine's dark default is shade 8, which would paint a darkened Emerald the brand never chose.
    expect(padelAfricaThemePreset.primaryColor).toBe(PADEL_AFRICA_RAMPS.emerald);
    expect(padelAfricaThemePreset.primaryShade).toEqual({
      light: PADEL_AFRICA_BASE_INDEX,
      dark: PADEL_AFRICA_BASE_INDEX,
    });
    const emeraldRamp = (padelAfricaThemePreset.colors as Record<string, readonly string[]>)[PADEL_AFRICA_RAMPS.emerald];
    expect(emeraldRamp[PADEL_AFRICA_BASE_INDEX]).toBe(PADEL_AFRICA_EMERALD.toUpperCase());
  });

  it('paints buttons with the guide\'s primary CTA in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      // Hex case carries no meaning; the vibe table is authored lowercase.
      expect(getGdsVibeThemeCssVariables('padel-africa', scheme)['--gds-vibe-primary']?.toUpperCase())
        .toBe(PADEL_AFRICA_EMERALD.toUpperCase());
    }
  });

  // The tradeoff is recorded rather than hidden: the guide's CTA is below AA for normal text, and
  // the in-palette alternative that clears it is exported alongside (issue 680).
  it('records both halves of the CTA contrast tradeoff', () => {
    const emerald = contrastRatio('#ffffff', PADEL_AFRICA_EMERALD, PADEL_AFRICA_EMERALD);
    expect(emerald).not.toBeNull();
    expect(emerald!).toBeLessThan(4.5);
    expect(emerald!).toBeGreaterThanOrEqual(3);

    const safe = contrastRatio('#ffffff', PADEL_AFRICA_ACCESSIBLE_CTA, PADEL_AFRICA_ACCESSIBLE_CTA);
    expect(safe).not.toBeNull();
    expect(safe!).toBeGreaterThanOrEqual(4.5);
    // The accessible variant stays inside the brand's own vocabulary.
    expect(PADEL_AFRICA_ACCESSIBLE_CTA).toBe(PADEL_AFRICA_CORE_PALETTE.forestGreen);
  });

  it('clears AA for everything the guide places on the dark nav', () => {
    const nav = PADEL_AFRICA_ROLES.navBackground;
    for (const on of ['#ffffff', PADEL_AFRICA_CORE_PALETTE.gold, PADEL_AFRICA_CORE_PALETTE.limeAccent]) {
      const ratio = contrastRatio(on, nav, nav);
      expect(ratio, `${on} on the nav`).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('resolves the active pill to Emerald, matching the rendered guide rather than the variations table', () => {
    // The guide's "Best Variations" cell says Lime, but every rendered example and both written
    // guidance blocks say otherwise; Lime carries focus instead (issue 678).
    expect(PADEL_AFRICA_ROLES.activePill).toBe(PADEL_AFRICA_EMERALD);
    expect(PADEL_AFRICA_ROLES.focusRing).toBe(PADEL_AFRICA_CORE_PALETTE.limeAccent);
  });

  it('carries the brand roles on theme.other for consumers to read by name', () => {
    expect((padelAfricaThemePreset.other as Record<string, unknown>).padelAfrica).toEqual(PADEL_AFRICA_ROLES);
  });
});
