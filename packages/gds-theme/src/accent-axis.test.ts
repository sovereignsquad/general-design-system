import { describe, expect, it } from 'vitest';
import {
  GDS_ACCENT_MODES, GDS_ACCENT_MODE_ENFORCEMENT, GDS_ACCENT_NAMES, GDS_ACCENT_SHADES,
  GDS_DEFAULT_ACCENT_AXIS, GdsAccentError,
  deriveGdsAccentShades, evaluateGdsAccentContrast, resolveGdsAccentTokens,
} from './accent-axis';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

describe('accent axis (issue 593)', () => {
  it('declares base colours only — no hand-authored shade table', () => {
    // The whole point of the axis. A hand-written shade is a value nobody recomputes when the
    // base changes, and the pair silently drifts apart.
    for (const name of GDS_ACCENT_NAMES) {
      const ramp = GDS_DEFAULT_ACCENT_AXIS.ramps![name]!;
      expect(ramp.base).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ramp.shades).toBeUndefined();
    }
  });

  it('emits every accent and shade for every preset', () => {
    for (const { id } of getGdsVibeThemes()) {
      const vars = getGdsVibeThemeCssVariables(id, 'light');
      for (const name of GDS_ACCENT_NAMES) {
        for (const shade of GDS_ACCENT_SHADES) expect(vars[`--gds-accent-${name}-${shade}`]).toMatch(/^#[0-9a-f]{6}$/i);
        expect(vars[`--gds-accent-${name}-on`]).toBeTruthy();
      }
    }
  });

  it('derives strictly darker shades', () => {
    const shades = deriveGdsAccentShades({ base: '#7c3a6e' }, 'light', 'probe');
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    expect(lum(shades.deep)).toBeLessThan(lum(shades.base));
    expect(lum(shades.deeper)).toBeLessThan(lum(shades.deep));
    expect(lum(shades.deepest)).toBeLessThan(lum(shades.deeper));
  });

  it('refuses to lighten, because lightening breaks the filled-mode guarantee', () => {
    expect(() => deriveGdsAccentShades({ base: '#7c3a6e', shadeFactors: [1.2, 0.5, 0.3] }, 'light', 'probe'))
      .toThrow(/lightening is not representable/);
    expect(() => deriveGdsAccentShades({ base: '#7c3a6e', shadeFactors: [0.5, 0.6, 0.3] }, 'light', 'probe'))
      .toThrow(/must strictly decrease/);
  });

  it('refuses shades a reader cannot tell apart', () => {
    // A shade system whose steps look identical conveys nothing.
    expect(() => deriveGdsAccentShades({ base: '#7c3a6e', shadeFactors: [0.999, 0.998, 0.997] }, 'light', 'probe'))
      .toThrow(/below the 6 floor/);
  });

  it('holds an explicit override to the same threshold as a derived value', () => {
    expect(() => resolveGdsAccentTokens({ ramps: { plum: { base: '#7c3a6e', shades: { deep: '#7c3a6d' } } } }, 'light', 'probe'))
      .toThrow(GdsAccentError);
  });

  it('replaces a declared ramp rather than merging it over the default', () => {
    // Merging would let a theme's new base silently keep the default's shades, which belong
    // to a different colour — the mismatch defect #537 shipped, in another namespace.
    const tokens = resolveGdsAccentTokens({ ramps: { plum: { base: '#204080' } } }, 'light', 'probe');
    expect(tokens['--gds-accent-plum-base']).toBe('#204080');
    expect(tokens['--gds-accent-plum-deep']).not.toBe('#612d56');
  });

  it('clears the filled-mode guarantee on every preset, which is what the frozen palette bought', () => {
    let enforced = 0;
    for (const { id } of getGdsVibeThemes()) {
      const light = getGdsVibeThemeCssVariables(id, 'light');
      const dark = getGdsVibeThemeCssVariables(id, 'dark');
      for (const r of evaluateGdsAccentContrast(undefined, { light: light['--gds-bg-page'], dark: dark['--gds-bg-page'] }, id)) {
        if (!r.enforced) continue;
        enforced += 1;
        expect(`${id} ${r.accent}-${r.shade} ${r.mode}: ${r.ratio}`).toBe(`${id} ${r.accent}-${r.shade} ${r.mode}: ${r.ratio}`);
        expect(r.passes).toBe(true);
      }
    }
    expect(enforced).toBe(getGdsVibeThemes().length * GDS_ACCENT_NAMES.length * GDS_ACCENT_SHADES.length * 2);
  });

  it('enforces only the modes that actually render, with a reason for each', () => {
    expect(GDS_ACCENT_MODE_ENFORCEMENT.filled.enforced).toBe(true);
    for (const mode of GDS_ACCENT_MODES) {
      expect(GDS_ACCENT_MODE_ENFORCEMENT[mode].reason.length).toBeGreaterThan(40);
    }
  });
});
