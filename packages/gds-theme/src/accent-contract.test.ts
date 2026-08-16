import { describe, expect, it } from 'vitest';
import {
  evaluateGdsAccentContrast, getGdsVibeThemes, getGdsVibeThemeCssVariables, resolveGdsAccentTokens,
} from './index';

// Accents are a fixed category vocabulary by default — a category means the same thing
// across every theme. A preset may override them, in which case the contrast gate verifies
// the override rather than trusting it. Both halves are asserted here.
describe('accent contract', () => {
  it('is a fixed vocabulary: every preset and scheme resolves identical accents', () => {
    const palettes = new Map<string, string[]>();
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const tokens = resolveGdsAccentTokens(undefined, scheme, id);
        const key = Object.keys(tokens).sort().map((k) => `${k}=${tokens[k]}`).join(';');
        if (!palettes.has(key)) palettes.set(key, []);
        palettes.get(key)!.push(`${id}/${scheme}`);
      }
    }
    const combos = [...palettes.values()].flat();
    expect(combos.length).toBe(getGdsVibeThemes().length * 2);
    // One palette across every combination — measured, not assumed.
    expect(palettes.size).toBe(1);
  });

  it('no preset overrides today, so the vocabulary is shared in practice as well as in theory', () => {
    const overriding = getGdsVibeThemes().filter((t) => (t as { axes?: { accent?: unknown } }).axes?.accent);
    expect(overriding.map((t) => t.id)).toEqual([]);
  });

  it('accepts an override, so a brand can carry its own category colours', () => {
    const tokens = resolveGdsAccentTokens({ ramps: { forest: { base: '#7a1fa2' } } }, 'light', 'brand');
    expect(tokens['--gds-accent-forest-base']).toBe('#7a1fa2');
    // Untouched accents still come from the shared vocabulary.
    expect(tokens['--gds-accent-ocean-base']).toBe(resolveGdsAccentTokens(undefined, 'light', 'brand')['--gds-accent-ocean-base']);
  });

  it('verifies an override instead of trusting it', () => {
    // Pale yellow is illegible under the white-icon filled mode the gate enforces.
    const page = getGdsVibeThemeCssVariables('default', 'light')['--gds-bg-page'];
    const pageDark = getGdsVibeThemeCssVariables('default', 'dark')['--gds-bg-page'];
    const backgrounds = { light: page, dark: pageDark };

    const violations = evaluateGdsAccentContrast({ ramps: { forest: { base: '#f5e663' } } }, backgrounds, 'brand')
      .filter((r) => r.enforced && !r.passes);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ratio).toBeLessThan(4.5);

    // And the shared vocabulary itself is clean, so the assertion above is detecting the
    // override rather than a pre-existing failure.
    expect(evaluateGdsAccentContrast(undefined, backgrounds, 'brand').filter((r) => r.enforced && !r.passes)).toEqual([]);
  });
});
