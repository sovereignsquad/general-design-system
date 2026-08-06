import { describe, it, expect } from 'vitest';
import { getGdsContrastRatio, checkGdsContrast, pickGdsAutoForeground } from './contrast';

describe('getGdsContrastRatio', () => {
  it('returns 21 for black on white and 1 for identical colors', () => {
    expect(getGdsContrastRatio('#000000', '#ffffff')).toBe(21);
    expect(getGdsContrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('is symmetric — order of the pair does not change the ratio', () => {
    expect(getGdsContrastRatio('#000000', '#ffffff')).toBe(getGdsContrastRatio('#ffffff', '#000000'));
  });

  it('expands 3-digit hex the same as its 6-digit form', () => {
    expect(getGdsContrastRatio('#fff', '#000')).toBe(getGdsContrastRatio('#ffffff', '#000000'));
  });

  it('parses rgb()/rgba() the same as the equivalent hex', () => {
    expect(getGdsContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBe(21);
    expect(getGdsContrastRatio('rgb(118, 118, 118)', '#ffffff')).toBe(4.54);
  });

  it('composites a translucent foreground over the background before scoring', () => {
    // Fully transparent foreground resolves to the background → ratio 1.
    expect(getGdsContrastRatio('rgba(0, 0, 0, 0)', '#ffffff')).toBe(1);
    // Half-alpha black over white sits between white (1) and black (21).
    const half = getGdsContrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff');
    expect(half).toBeGreaterThan(1);
    expect(half).toBeLessThan(21);
  });

  it('throws on an unparseable color', () => {
    expect(() => getGdsContrastRatio('not-a-color', '#ffffff')).toThrow(/foreground/);
    expect(() => getGdsContrastRatio('#000000', 'nope')).toThrow(/background/);
  });
});

describe('checkGdsContrast', () => {
  it('defaults to AA / normal (4.5:1)', () => {
    expect(checkGdsContrast('#767676', '#ffffff')).toEqual({
      ratio: 4.54,
      required: 4.5,
      passes: true,
      level: 'AA',
      size: 'normal',
    });
  });

  it('holds a pair that clears AA-normal but fails AAA-normal', () => {
    // #767676 on white ≈ 4.54: passes AA normal (4.5), fails AAA normal (7).
    expect(checkGdsContrast('#767676', '#ffffff', { level: 'AA' }).passes).toBe(true);
    expect(checkGdsContrast('#767676', '#ffffff', { level: 'AAA' }).passes).toBe(false);
  });

  it('holds a pair that fails AA-normal but passes AA-large', () => {
    // #8f8f8f on white ≈ 3.23: fails AA normal (4.5), passes AA large (3).
    expect(checkGdsContrast('#8f8f8f', '#ffffff', { size: 'normal' }).passes).toBe(false);
    expect(checkGdsContrast('#8f8f8f', '#ffffff', { size: 'large' }).passes).toBe(true);
  });

  it('reports the required threshold for each level/size combination', () => {
    expect(checkGdsContrast('#000', '#fff', { level: 'AA', size: 'normal' }).required).toBe(4.5);
    expect(checkGdsContrast('#000', '#fff', { level: 'AA', size: 'large' }).required).toBe(3);
    expect(checkGdsContrast('#000', '#fff', { level: 'AAA', size: 'normal' }).required).toBe(7);
    expect(checkGdsContrast('#000', '#fff', { level: 'AAA', size: 'large' }).required).toBe(4.5);
  });
});

describe('pickGdsAutoForeground', () => {
  it('picks white for a dark background that clears AA with white', () => {
    // white vs #155724 ≈ 8.68:1, black vs #155724 ≈ 2.42:1 — white is tried first and clears 4.5.
    expect(pickGdsAutoForeground('#155724')).toBe('#ffffff');
  });

  it('picks black for a near-white background that clears AA with black', () => {
    // white vs #f5f5f5 ≈ 1.09:1 (fails), black vs #f5f5f5 ≈ 19.26:1 (passes).
    expect(pickGdsAutoForeground('#f5f5f5')).toBe('#000000');
  });

  it('falls back to whichever default candidate scores higher when neither clears the bar', () => {
    // At AAA/normal (7:1): white vs #808080 ≈ 3.95:1, black vs #808080 ≈ 5.32:1 — neither
    // passes, so the higher-scoring candidate (black) wins rather than an arbitrary default.
    expect(pickGdsAutoForeground('#808080', { level: 'AAA' })).toBe('#000000');
  });

  it('respects a custom candidates list instead of the white/black default', () => {
    // Yellow clears AA against this dark green (≈11.49:1) and is tried first.
    expect(pickGdsAutoForeground('#0b3d20', { candidates: ['#ffff00', '#000000'] })).toBe('#ffff00');
  });

  it('respects level/size options the same way checkGdsContrast does', () => {
    // #767676 on white ≈ 4.54:1: white passes AA/normal (4.5) but fails AAA/normal (7),
    // so raising the level should flip the pick to black.
    expect(pickGdsAutoForeground('#767676', { level: 'AA' })).toBe('#ffffff');
    expect(pickGdsAutoForeground('#767676', { level: 'AAA' })).toBe('#000000');
  });

  it('never throws — an unparseable background falls back to the first candidate', () => {
    expect(pickGdsAutoForeground('not-a-color')).toBe('#ffffff');
    expect(pickGdsAutoForeground('not-a-color', { candidates: ['#000000', '#ffffff'] })).toBe('#000000');
  });
});
