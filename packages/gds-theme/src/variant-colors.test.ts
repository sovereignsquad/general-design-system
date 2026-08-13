import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@mantine/core';
import { gdsTheme } from './theme';
import { getGdsVibeThemes, getGdsVibeThemeCssVariables } from './vibe-themes';
import { getGdsContrastRatio } from './contrast';

const hexToRgb = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const parse = (s: string) => {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
  return m ? [+m[1], +m[2], +m[3]] : hexToRgb(s);
};
const over = (fg: number[], a: number, bg: number[]) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

describe('light-variant governance (issue 597)', () => {
  it('makes the light variant OPAQUE, so its contrast can be measured at all', () => {
    // The deeper defect behind #534: a translucent background makes the pair uncomputable, so
    // 83 badges were invisible to every contrast sweep. They were not passing — they could
    // not be evaluated.
    const r = gdsTheme.variantColorResolver({ color: 'blue', variant: 'light', theme: gdsTheme } as never);
    expect(r.background).toContain('color-mix');
    expect(r.background).not.toMatch(/-light\)/);
    expect(r.color).toBe('var(--gds-text-body)');
  });

  it('leaves every other variant untouched', () => {
    for (const variant of ['filled', 'outline', 'subtle', 'default'] as const) {
      const r = gdsTheme.variantColorResolver({ color: 'blue', variant, theme: gdsTheme } as never);
      expect(r.color).not.toBe('var(--gds-text-body)');
    }
  });

  it('clears 4.5:1 across every preset, scheme and Mantine colour', () => {
    // The same composition the resolver emits, computed here: shade 6 at 10% over the card in
    // light, shade 8 at 15% in dark, against the governed body text.
    let worst = { ratio: Infinity, where: '' };
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const vars = getGdsVibeThemeCssVariables(id, scheme);
        const card = parse(vars['--gds-bg-card']);
        for (const [name, palette] of Object.entries(DEFAULT_THEME.colors)) {
          const tint = over(hexToRgb(palette[scheme === 'dark' ? 8 : 6]), scheme === 'dark' ? 0.15 : 0.1, card);
          const ratio = getGdsContrastRatio(vars['--gds-text-body'], `rgb(${tint.join(', ')})`) ?? 0;
          if (ratio < worst.ratio) worst = { ratio, where: `${id}/${scheme}/${name}` };
        }
      }
    }
    expect(`${worst.where}: ${worst.ratio.toFixed(2)}`).toBe(`${worst.where}: ${worst.ratio.toFixed(2)}`);
    expect(worst.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('does not keep the hue-tinted foreground, which could not be guaranteed', () => {
    // Shade 9 on the tint was measured first: orange 3.91:1, green 4.03:1. Keeping the tinted
    // text would have looked better and failed.
    const r = gdsTheme.variantColorResolver({ color: 'orange', variant: 'light', theme: gdsTheme } as never);
    expect(r.color).not.toMatch(/--mantine-color-orange/);
  });
});

describe('derived badge foregrounds (issue 597)', () => {
  // Every pair emitted as "<fill>" + "<fill>-fg" claims to be legible. That claim is worth
  // exactly as much as the sweep behind it, so it is swept: all 25 presets, both schemes.
  const PAIRS = [
    '--gds-badge-solid-success', '--gds-badge-solid-warning', '--gds-badge-solid-danger',
    '--gds-badge-solid-info', '--gds-badge-solid-neutral',
    '--gds-badge-soft-success', '--gds-badge-soft-warning', '--gds-badge-soft-danger',
    '--gds-badge-soft-info', '--gds-badge-soft-neutral',
    '--gds-brand-accent', '--gds-brand-accent-action', '--gds-bg-info-tag', '--gds-brand-accent-tint',
  ];

  it('clears 4.5:1 for every fill in every preset and scheme', () => {
    const failures: string[] = [];
    let checked = 0;
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const vars = getGdsVibeThemeCssVariables(id, scheme);
        for (const fill of PAIRS) {
          const bg = vars[fill];
          const fg = vars[`${fill}-fg`];
          if (!bg || !fg) continue;
          checked += 1;
          const ratio = getGdsContrastRatio(fg, bg) ?? 0;
          if (ratio < 4.5) failures.push(`${id}/${scheme} ${fill}: ${ratio.toFixed(2)}`);
        }
      }
    }
    // A sweep that checks nothing reports no failures, which is what a clean system reports.
    expect(checked).toBeGreaterThan(500);
    expect(failures).toEqual([]);
  });

  it('emits a foreground for every fill a component pairs with one', () => {
    // GdsCountBadge, FitScoreChip, MeaningBadge and LabelTag all reference `<fill>-fg`. A
    // missing token renders as transparent text, so absence must fail here rather than on a
    // consumer's page.
    const vars = getGdsVibeThemeCssVariables('default', 'light');
    for (const fill of PAIRS) {
      if (!vars[fill]) continue;
      expect(`${fill}-fg=${vars[`${fill}-fg`] ?? 'MISSING'}`).not.toContain('MISSING');
    }
  });
});
