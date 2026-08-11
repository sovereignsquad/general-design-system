import { describe, expect, it } from 'vitest';
import baseline from './__snapshots__/token-baseline.json';
import { createBrandTheme } from './brand-tokens';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

/**
 * Issue 554. These guard the property the consolidation bought: a semantic role has one
 * definition, so the two consumption paths cannot disagree.
 *
 * The previous guard in `vibe-themes.test.ts` only asserted that the preset *id sets*
 * matched across files. It could not have caught a value diverging between the two
 * tables, which is the defect that actually shipped.
 */
describe('semantic token single source (issue 554)', () => {
  const LANES = ['class-usa', 'gold-athlete'] as const;

  it.each(LANES)('%s resolves every shared role identically through both paths', (lane) => {
    const brand = createBrandTheme(lane).mantineTheme.other.gdsCssVariables as Record<string, string>;
    let compared = 0;

    for (const scheme of ['light', 'dark'] as const) {
      const vibe = getGdsVibeThemeCssVariables(lane, scheme);
      for (const [name, value] of Object.entries(brand)) {
        const isDark = name.endsWith('-dark');
        if ((scheme === 'dark') !== isDark) continue;
        // The document path collapses `-dark` onto the base name in dark mode.
        const painted = isDark ? name.replace(/-dark$/, '') : name;
        compared += 1;
        expect(`${scheme} ${painted}=${vibe[painted]}`).toBe(`${scheme} ${painted}=${value}`);
      }
    }

    // Guards against the assertion loop silently comparing nothing.
    expect(compared).toBeGreaterThan(50);
  });

  it('emits an identical role key set from both paths, for both lanes', () => {
    for (const lane of LANES) {
      const brand = Object.keys(createBrandTheme(lane).mantineTheme.other.gdsCssVariables).sort();
      const vibe = Object.keys(getGdsVibeThemeCssVariables(lane, 'light'))
        .filter((k) => !k.startsWith('--gds-vibe-'))
        .sort();
      expect(vibe).toEqual(brand);
    }
  });

  it('reproduces the committed token baseline for every preset and scheme', () => {
    // A frozen fixture of all 25 presets x 2 schemes. Any token value change anywhere in
    // the theme package surfaces here as an explicit diff that has to be re-committed on
    // purpose, rather than riding along unnoticed inside a refactor.
    const snapshot: Record<string, Record<string, string>> = {};
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        snapshot[`vibe:${id}:${scheme}`] = getGdsVibeThemeCssVariables(id, scheme);
      }
    }
    for (const lane of LANES) {
      snapshot[`brand:${lane}`] = createBrandTheme(lane).mantineTheme.other.gdsCssVariables as Record<string, string>;
    }

    for (const [key, expected] of Object.entries(baseline as Record<string, Record<string, string>>)) {
      expect(Object.entries(snapshot[key] ?? {}).sort()).toEqual(Object.entries(expected).sort());
    }
    expect(Object.keys(baseline).length).toBe(getGdsVibeThemes().length * 2 + LANES.length);
  });
});
