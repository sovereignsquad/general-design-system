import { describe, expect, it } from 'vitest';
import { hueAngleDistance, parseCssColor, rgbToHsl } from './color-math';

describe('rgbToHsl (issue #646)', () => {
  it.each([
    ['#ff0000', { h: 0, s: 100, l: 50 }],
    ['#00ff00', { h: 120, s: 100, l: 50 }],
    ['#0000ff', { h: 240, s: 100, l: 50 }],
    ['#ffffff', { h: 0, s: 0, l: 100 }],
    ['#000000', { h: 0, s: 0, l: 0 }],
    ['#808080', { h: 0, s: 0, l: 50.196078431372555 }],
  ])('converts %s to the known HSL value', (hex, expected) => {
    const rgb = parseCssColor(hex)!;
    const hsl = rgbToHsl(rgb);
    expect(hsl.h).toBeCloseTo(expected.h, 5);
    expect(hsl.s).toBeCloseTo(expected.s, 5);
    expect(hsl.l).toBeCloseTo(expected.l, 5);
  });
});

describe('hueAngleDistance (issue #646)', () => {
  it('returns the direct distance for angles within 180 degrees', () => {
    expect(hueAngleDistance(0, 180)).toBe(180);
    expect(hueAngleDistance(0, 90)).toBe(90);
  });

  it('wraps around 360 for the shorter path', () => {
    expect(hueAngleDistance(10, 350)).toBe(20);
  });

  it('is symmetric', () => {
    expect(hueAngleDistance(10, 350)).toBe(hueAngleDistance(350, 10));
  });
});
