import { describe, expect, it } from 'vitest';
import { gdsBadgeAccentShades } from './GdsBadge';
import { buildGdsHeroSvg, buildGdsThumbnailSvg } from './generated-art-svg';

const CATEGORIES = [
  { key: 'soccer', label: 'Soccer', icon: 'Location' as const },
  { key: 'basketball', label: 'Basketball', icon: 'Habit' as const },
  { key: 'gymnastics', label: 'Gymnastics', icon: 'Trophy' as const },
];

describe('buildGdsThumbnailSvg (#508)', () => {
  it('returns a complete, self-contained <svg> string', () => {
    const svg = buildGdsThumbnailSvg({ seed: 'listing-1', categories: CATEGORIES, themePresetId: 'default', label: 'Riverside Field — soccer' });
    expect(svg.trimStart().startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('embeds the label as the SVG title, XML-escaped', () => {
    const svg = buildGdsThumbnailSvg({ seed: 'listing-1', categories: CATEGORIES, themePresetId: 'default', label: 'Tom & Jerry\'s <Gym>' });
    expect(svg).toContain('<title>Tom &amp; Jerry\'s &lt;Gym&gt;</title>');
  });

  it('renders the lead category label as real SVG text', () => {
    const svg = buildGdsThumbnailSvg({ seed: 'listing-1', categories: CATEGORIES, themePresetId: 'default', label: 'x' });
    expect(svg).toContain('>Soccer<');
  });

  it('throws when categories is empty', () => {
    expect(() => buildGdsThumbnailSvg({ seed: 'listing-1', categories: [], themePresetId: 'default', label: 'x' })).toThrow(
      /must contain at least one entry/,
    );
  });

  it('theme mode without themePresetId or colors throws the same clear error as the palette resolver', () => {
    expect(() => buildGdsThumbnailSvg({ seed: 'listing-1', categories: CATEGORIES, label: 'x' })).toThrow(
      /requires either `themePresetId`.*or an explicit `colors`/,
    );
  });

  it('category mode resolves the gradient to the accent TOKEN, so a category follows the theme (issue 594)', () => {
    const svg = buildGdsThumbnailSvg({ seed: 'listing-1', categories: CATEGORIES, paletteSource: 'category', category: 'forest', shade: 'deep', label: 'x' });
    expect(svg).toContain(`stop-color="${gdsBadgeAccentShades.forest.deep}"`);
  });

  it('is deterministic: the same seed always produces byte-identical output', () => {
    const a = buildGdsThumbnailSvg({ seed: 'listing-42', categories: CATEGORIES, themePresetId: 'default', label: 'x' });
    const b = buildGdsThumbnailSvg({ seed: 'listing-42', categories: CATEGORIES, themePresetId: 'default', label: 'x' });
    expect(a).toBe(b);
  });

  it('different seeds produce different motif placement', () => {
    const a = buildGdsThumbnailSvg({ seed: 'listing-a', categories: CATEGORIES, themePresetId: 'default', label: 'x' });
    const b = buildGdsThumbnailSvg({ seed: 'listing-b', categories: CATEGORIES, themePresetId: 'default', label: 'x' });
    expect(a).not.toBe(b);
  });
});

describe('buildGdsHeroSvg (#508)', () => {
  it('returns a complete, self-contained <svg> string with the label as its title', () => {
    const svg = buildGdsHeroSvg({ seed: 'loc-1', themePresetId: 'default', label: 'Sports classes in Riverdale' });
    expect(svg.trimStart().startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('<title>Sports classes in Riverdale</title>');
  });

  it('defaults to the wash background: only the gradient rect, no mosaic/icon-field/region shapes', () => {
    const svg = buildGdsHeroSvg({ seed: 'loc-1', themePresetId: 'default', label: 'x' });
    expect((svg.match(/<rect/g) ?? []).length).toBe(1);
  });

  it('mosaic-abstract renders more than the base gradient rect', () => {
    const svg = buildGdsHeroSvg({ seed: 'loc-1', themePresetId: 'default', label: 'x', background: 'mosaic-abstract' });
    expect((svg.match(/<rect/g) ?? []).length).toBeGreaterThan(1);
  });

  it('region-mosaic renders exactly one rect per supplied region, plus the base gradient rect', () => {
    const svg = buildGdsHeroSvg({
      seed: 'loc-1',
      themePresetId: 'default',
      label: 'x',
      background: {
        type: 'region-mosaic',
        regions: [
          { x0: 0, y0: 0, x1: 0.5, y1: 0.5 },
          { x0: 0.5, y0: 0.5, x1: 1, y1: 1, weight: 2 },
        ],
      },
    });
    expect((svg.match(/<rect/g) ?? []).length).toBe(3);
  });

  it('caps badges at 6 and places each as a circle', () => {
    const sevenBadges = [...CATEGORIES, ...CATEGORIES.map((c) => ({ ...c, key: `${c.key}-2` }))].slice(0, 7);
    const svg = buildGdsHeroSvg({ seed: 'loc-1', themePresetId: 'default', label: 'x', badges: sevenBadges });
    expect((svg.match(/<circle/g) ?? []).length).toBe(6);
  });

  it('is deterministic: the same seed always produces byte-identical output', () => {
    const a = buildGdsHeroSvg({ seed: 'loc-42', themePresetId: 'default', label: 'x', badges: CATEGORIES, background: 'mosaic-abstract' });
    const b = buildGdsHeroSvg({ seed: 'loc-42', themePresetId: 'default', label: 'x', badges: CATEGORIES, background: 'mosaic-abstract' });
    expect(a).toBe(b);
  });

  it('category mode resolves to the literal shaded accent hex', () => {
    const svg = buildGdsHeroSvg({ seed: 'loc-1', paletteSource: 'category', category: 'magenta', shade: 'deeper', label: 'x' });
    expect(svg).toContain(`stop-color="${gdsBadgeAccentShades.magenta.deeper}"`);
  });
});
