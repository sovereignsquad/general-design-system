import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { getGdsContrastRatio, getGdsThemePresets, YOUR_FIELD_NAVY, YOUR_FIELD_PEACH, YOUR_FIELD_SAGE } from '@sovereignsquad/gds-theme';
import { buildGdsBrandBadgeSvg } from './generated-brand-badge';
import { gdsSeededRandom } from './generated-art-engine';
import { GdsBadgeShapes } from './badge-shapes';

const ALL_PRESETS = getGdsThemePresets().map((preset) => preset.id);
const SCHEMES = ['light', 'dark'] as const;

/** Channel-wise midpoint of two `#rrggbb` colors, mirroring the module's own gradient-midpoint contrast check. */
function hexMidpoint(a: string, b: string): string {
  const parse = (hex: string) => {
    const value = parseInt(hex.slice(1), 16);
    return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
  };
  const ca = parse(a);
  const cb = parse(b);
  const mix = (x: number, y: number) => Math.round((x + y) / 2);
  return `#${[mix(ca.r, cb.r), mix(ca.g, cb.g), mix(ca.b, cb.b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Mirrors the module's own rounding so test-computed geometry strings match its output exactly. */
function roundNum(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function extractStopColors(svg: string): [string, string] {
  const matches = [...svg.matchAll(/stop-color="(#[0-9a-fA-F]{6})"/g)];
  expect(matches.length).toBe(2);
  return [matches[0][1], matches[1][1]];
}

describe('buildGdsBrandBadgeSvg (issue 699)', () => {
  it('returns a complete, self-contained <svg> string', () => {
    const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'Acme' });
    expect(svg.trimStart().startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('embeds the label as the SVG title, XML-escaped', () => {
    const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'Tom & Jerry\'s <Gym>' });
    expect(svg).toContain('<title>Tom &amp; Jerry\'s &lt;Gym&gt;</title>');
  });

  it('embeds a data-gds-theme-identity attribute matching computeGdsThemeIdentity', () => {
    const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'dark', label: 'x' });
    expect(svg).toMatch(/data-gds-theme-identity="default:dark:[0-9a-f]{8}"/);
  });

  it('carries the override identity marker when colors is supplied instead of a preset', () => {
    const svg = buildGdsBrandBadgeSvg({ colors: { primary: '#112233', accent: '#445566' }, label: 'x' });
    expect(svg).toContain('data-gds-theme-identity="override"');
  });

  it('contains only literal colors — zero occurrences of var( or color-mix(', () => {
    const svg = buildGdsBrandBadgeSvg({ themePresetId: 'your-field', colorScheme: 'dark', label: 'x' });
    expect(svg).not.toContain('var(');
    expect(svg).not.toContain('color-mix(');
  });

  describe('determinism and distinctness', () => {
    it('is deterministic: identical options produce byte-identical output', () => {
      const a = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'light', label: 'x' });
      const b = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'light', label: 'x' });
      expect(a).toBe(b);
    });

    it('changing themePresetId changes the output', () => {
      const a = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      const b = buildGdsBrandBadgeSvg({ themePresetId: 'oceanic', label: 'x' });
      expect(a).not.toBe(b);
    });

    it('changing colorScheme changes the output', () => {
      const a = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'light', label: 'x' });
      const b = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'dark', label: 'x' });
      expect(a).not.toBe(b);
    });

    it('changing seed changes the output while the palette still tracks the preset', () => {
      const a = buildGdsBrandBadgeSvg({ themePresetId: 'default', seed: 'seed-a', label: 'x' });
      const b = buildGdsBrandBadgeSvg({ themePresetId: 'default', seed: 'seed-b', label: 'x' });
      expect(a).not.toBe(b);
      // Same gradient stops on both — seed pins geometry, not color.
      expect(extractStopColors(a)).toEqual(extractStopColors(b));
    });

    it('an explicit seed pins geometry across a colorScheme/token change', () => {
      const a = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'light', seed: 'pinned', label: 'x' });
      const b = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'dark', seed: 'pinned', label: 'x' });
      const rotateOf = (svg: string) => /rotate\(([-\d.]+)\)/.exec(svg)?.[1];
      expect(rotateOf(a)).toBe(rotateOf(b));
    });

    it('repeated calls remain stable (no hidden mutable module state)', () => {
      const outputs = Array.from({ length: 5 }, () => buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' }));
      expect(new Set(outputs).size).toBe(1);
    });
  });

  describe('full preset x scheme sweep', () => {
    for (const presetId of ALL_PRESETS) {
      for (const scheme of SCHEMES) {
        it(`builds a valid, literal-color, identified badge for ${presetId} (${scheme})`, () => {
          const svg = buildGdsBrandBadgeSvg({ themePresetId: presetId, colorScheme: scheme, label: `${presetId} ${scheme}` });
          expect(svg.trimStart().startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
          expect(svg).not.toContain('var(');
          expect(svg).not.toContain('color-mix(');
          expect(svg).toContain(`data-gds-theme-identity="${presetId}:${scheme}:`);
        });
      }
    }

    it('produces distinct, namespaced gradient/clip ids per preset+scheme, so inlining several badges cannot collide', () => {
      const seen = new Map<string, string>();
      for (const presetId of ALL_PRESETS) {
        for (const scheme of SCHEMES) {
          const svg = buildGdsBrandBadgeSvg({ themePresetId: presetId, colorScheme: scheme, label: 'x' });
          const gradientId = /id="(gds-badge-grad-[^"]+)"/.exec(svg)?.[1];
          const clipId = /id="(gds-badge-clip-[^"]+)"/.exec(svg)?.[1];
          expect(gradientId).toBeTruthy();
          expect(clipId).toBeTruthy();
          expect(gradientId).not.toBe(clipId);
          const key = `${presetId}:${scheme}`;
          expect(seen.has(gradientId as string)).toBe(false);
          seen.set(gradientId as string, key);
        }
      }
      // Many: every preset x scheme combination produced a distinct id.
      expect(seen.size).toBe(ALL_PRESETS.length * SCHEMES.length);
    });
  });

  describe('color parsing beyond #rrggbb', () => {
    it('normalizes a preset whose resolved brand token is rgb(...), not hex (the default preset\'s accent)', () => {
      // `--gds-brand-accent` for `default` resolves to `rgb(5, 148, 172)`, not `#rrggbb` —
      // real built-in-preset input, not a hypothetical override. Confirms it renders as a
      // normalized literal hex stop rather than leaking the rgb() string through unmixed.
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', colorScheme: 'light', label: 'x' });
      const [, accentStop] = extractStopColors(svg);
      expect(accentStop).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('degrades gracefully (no throw) for a genuinely unparseable colors override, per the documented limitation', () => {
      const svg = buildGdsBrandBadgeSvg({ colors: { primary: 'not-a-color', accent: '#123456' }, label: 'x' });
      expect(svg).toContain('<title>x</title>');
      // Darkening no-ops on the unparseable stop instead of throwing over a caller-supplied
      // color GDS doesn't govern — the value passes through exactly as supplied.
      expect(svg).toContain('stop-color="not-a-color"');
    });
  });

  describe('accessibility: motif-on-fill contrast floor (WCAG 1.4.11, >= 3:1)', () => {
    for (const presetId of ALL_PRESETS) {
      for (const scheme of SCHEMES) {
        it(`clears 3:1 white-on-gradient-midpoint contrast for ${presetId} (${scheme})`, () => {
          const svg = buildGdsBrandBadgeSvg({ themePresetId: presetId, colorScheme: scheme, label: 'x' });
          const [start, end] = extractStopColors(svg);
          const midpoint = hexMidpoint(start, end);
          expect(getGdsContrastRatio('#ffffff', midpoint)).toBeGreaterThanOrEqual(3);
        });
      }
    }
  });

  describe('geometry', () => {
    it('twin: 48-unit canvas, matching GdsGeneratedMark', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      expect(svg).toContain('viewBox="0 0 48 48"');
    });

    it('twin: gradient direction matches GdsGeneratedMark (0%,0% -> 100%,100%)', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      expect(svg).toContain('x1="0%" y1="0%" x2="100%" y2="100%"');
    });

    it('twin: default motif proportion is 55% of the canvas, matching GdsGeneratedMark', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      // 0.55 * 48 = 26.4; the inner motif group centers it via a -13.2 translate.
      expect(svg).toContain('translate(-13.2 -13.2)');
    });

    it('twin: the ±20° tilt formula matches GdsGeneratedMark exactly for a given seed', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', seed: 'twin-seed', label: 'x' });
      const expectedTilt = Math.round((gdsSeededRandom('twin-seed')() - 0.5) * 40);
      expect(svg).toContain(`rotate(${expectedTilt})`);
    });

    it('default corner radius is 0.25 (12 units on the 48-unit canvas)', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      expect(svg).toContain('rx="12"');
    });

    it('an explicit cornerRadiusRatio scales the rounded-rect radius', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', cornerRadiusRatio: 0.1, label: 'x' });
      expect(svg).toContain('rx="4.8"');
    });

    it('maskable produces a full-bleed square (rx 0) with the motif inside the 80% safe-zone circle', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', maskable: true, label: 'x' });
      expect(svg).toContain('rx="0"');
      const widthMatch = /<svg width="([\d.]+)" height="\1" viewBox="0 0 24 24">/.exec(svg);
      expect(widthMatch).toBeTruthy();
      const motifSize = Number(widthMatch?.[1]);
      const diagonal = motifSize * Math.SQRT2;
      // W3C maskable safe zone: bounding box fits a centred circle of diameter 0.8 * edge.
      expect(diagonal).toBeLessThanOrEqual(48 * 0.8 + 0.001);
      const offset = roundNum(-motifSize / 2);
      expect(svg).toContain(`translate(${offset} ${offset})`);
    });

    it('size sets only the rendered width/height attributes; the viewBox stays 48-unit', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', size: 96, label: 'x' });
      expect(svg).toContain('width="96" height="96"');
      expect(svg).toContain('viewBox="0 0 48 48"');
    });
  });

  describe('motif selection', () => {
    it('defaults to the GdsBadgeShapes.circle silhouette', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: 'x' });
      expect(svg).toContain('M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0');
    });

    it('renders a GdsIconKey motif', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', icon: 'Location', label: 'x' });
      expect(svg).toContain('<svg width="26.4" height="26.4" viewBox="0 0 24 24">');
    });

    it('renders any other GdsBadgeShapes component as a motif element', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', icon: createElement(GdsBadgeShapes.hexagon), label: 'x' });
      expect(svg).toContain('M19.875 6.27');
    });
  });

  describe('error paths', () => {
    it('throws when label is empty', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', label: '' })).toThrow(/label.*required/i);
    });

    it('throws when label is whitespace-only', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', label: '   ' })).toThrow(/label.*required/i);
    });

    it('throws when neither themePresetId nor colors is given', () => {
      expect(() => buildGdsBrandBadgeSvg({ label: 'x' })).toThrow(/requires either `themePresetId`.*or an explicit `colors`/);
    });

    it('throws when maskable and an explicit cornerRadiusRatio are combined', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', maskable: true, cornerRadiusRatio: 0.2, label: 'x' })).toThrow(
        /mutually exclusive/,
      );
    });

    it('throws when cornerRadiusRatio is negative', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', cornerRadiusRatio: -0.1, label: 'x' })).toThrow(
        /cornerRadiusRatio.*between 0 and 0.5/,
      );
    });

    it('throws when cornerRadiusRatio exceeds 0.5', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', cornerRadiusRatio: 0.6, label: 'x' })).toThrow(
        /cornerRadiusRatio.*between 0 and 0.5/,
      );
    });

    it('throws when size is non-finite', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', size: Number.NaN, label: 'x' })).toThrow(/size.*positive, finite/);
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', size: Number.POSITIVE_INFINITY, label: 'x' })).toThrow(
        /size.*positive, finite/,
      );
    });

    it('throws when size is zero or negative', () => {
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', size: 0, label: 'x' })).toThrow(/size.*positive, finite/);
      expect(() => buildGdsBrandBadgeSvg({ themePresetId: 'default', size: -10, label: 'x' })).toThrow(/size.*positive, finite/);
    });
  });

  describe('escaping', () => {
    it('escapes <, &, and " in the label', () => {
      const svg = buildGdsBrandBadgeSvg({ themePresetId: 'default', label: `"quoted" & <script>` });
      expect(svg).toContain('<title>&quot;quoted&quot; &amp; &lt;script&gt;</title>');
      expect(svg).not.toContain('<script>alert');
    });
  });

  describe('zero / one / many', () => {
    it('zero: no palette source at all throws rather than guessing', () => {
      expect(() => buildGdsBrandBadgeSvg({ label: 'x' })).toThrow();
    });

    it('one: a single explicit colors override builds successfully', () => {
      const svg = buildGdsBrandBadgeSvg({ colors: { primary: '#123456', accent: '#654321' }, label: 'x' });
      expect(svg).toContain('data-gds-theme-identity="override"');
    });

    it('many: every built-in preset x scheme combination builds (covered by the sweep above)', () => {
      expect(ALL_PRESETS.length).toBeGreaterThan(0);
      expect(ALL_PRESETS.length * SCHEMES.length).toBeGreaterThan(0);
    });
  });

  describe('Your Field validation target (issue 699, after issue 693)', () => {
    const variants = [
      ['navy', YOUR_FIELD_NAVY],
      ['sage', YOUR_FIELD_SAGE],
      ['terracotta', YOUR_FIELD_PEACH],
    ] as const;

    for (const [name, hex] of variants) {
      it(`builds the ${name} app-icon variant deterministically, independent of colorScheme, clearing the contrast floor`, () => {
        const light = buildGdsBrandBadgeSvg({ colors: { primary: hex, accent: hex }, colorScheme: 'light', label: `Your Field ${name}` });
        const dark = buildGdsBrandBadgeSvg({ colors: { primary: hex, accent: hex }, colorScheme: 'dark', label: `Your Field ${name}` });
        expect(light).toBe(dark);
        // A flat single-color badge (primary === accent, matching the real PNG variant's solid
        // fill): the two stops are equal, and darkened together if `hex` alone doesn't already
        // clear 3:1 white-on-fill (sage and terracotta do; navy already clears it undarkened).
        const [start, end] = extractStopColors(light);
        expect(start).toBe(end);
        expect(getGdsContrastRatio('#ffffff', start)).toBeGreaterThanOrEqual(3);
      });
    }

    it('renders the your-field preset itself for both schemes (theme-sourced, not an override)', () => {
      for (const scheme of SCHEMES) {
        const svg = buildGdsBrandBadgeSvg({ themePresetId: 'your-field', colorScheme: scheme, label: 'Your Field' });
        expect(svg).toContain(`data-gds-theme-identity="your-field:${scheme}:`);
      }
    });

    it('renders at 96x96 with a 22px corner radius, matching the bundle app-icon presentation', () => {
      const svg = buildGdsBrandBadgeSvg({
        colors: { primary: YOUR_FIELD_NAVY, accent: YOUR_FIELD_NAVY },
        size: 96,
        cornerRadiusRatio: 22 / 96,
        label: 'Your Field',
      });
      expect(svg).toContain('width="96" height="96"');
      // 22/96 * 48 = 11 viewBox units, which renders at 22px once scaled 48 -> 96.
      expect(svg).toContain('rx="11"');
    });
  });
});
