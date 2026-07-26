/**
 * Consumer WCAG contrast checker (issue #453).
 *
 * Surfaces the same WCAG 2.x contrast math GDS uses in CI
 * (`verify:token-contrast-scoring`) as a small, pure, server-safe API so a
 * consumer can validate *their own* token pairs — brand colors, custom surface
 * tokens — against the WCAG AA/AAA thresholds before shipping, instead of
 * eyeballing them or re-implementing the formula.
 *
 * Pure data: no React, no DOM. Accepts `#hex` (3- or 6-digit) and
 * `rgb()`/`rgba()` strings; a translucent foreground is composited over the
 * background (or white) so the scored color is the one a user actually sees.
 */

/** WCAG conformance level: `'AA'` (4.5:1 / 3:1) or `'AAA'` (7:1 / 4.5:1). */
export type GdsContrastLevel = 'AA' | 'AAA';

/** Text size bucket: `'normal'` (< 18pt / < 14pt bold) or `'large'`. */
export type GdsContrastTextSize = 'normal' | 'large';

/** Outcome of a single `checkGdsContrast` call: the measured ratio, the threshold, and whether it passes. */
export interface GdsContrastResult {
  /** WCAG contrast ratio, 1–21, rounded to 2 decimals. */
  ratio: number;
  /** The threshold the pair was checked against for the given level + size. */
  required: number;
  /** `true` when `ratio >= required`. */
  passes: boolean;
  /** The level checked. */
  level: GdsContrastLevel;
  /** The text size checked. */
  size: GdsContrastTextSize;
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const THRESHOLDS: Record<GdsContrastLevel, Record<GdsContrastTextSize, number>> = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

function parseColor(value: string): Rgba | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const rgba = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+))?\s*\)$/i.exec(v);
  if (rgba) {
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: rgba[4] === undefined ? 1 : +rgba[4] };
  }
  return null;
}

function composite(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Returns the WCAG 2.x contrast ratio (1–21, rounded to 2 decimals) between a
 * foreground and background color. A translucent foreground (`rgba(...)` with
 * alpha < 1) is composited over the background before scoring, so the ratio
 * reflects what a user actually sees.
 *
 * @throws if either color cannot be parsed (`#hex`, `rgb()`, `rgba()` only).
 *
 * @example
 * ```ts
 * getGdsContrastRatio('#767676', '#ffffff'); // 4.54
 * ```
 */
export function getGdsContrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  const fgRaw = parseColor(foreground);
  if (!bg) throw new Error(`getGdsContrastRatio: could not parse background color "${background}".`);
  if (!fgRaw) throw new Error(`getGdsContrastRatio: could not parse foreground color "${foreground}".`);

  const fg = fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/**
 * Checks a foreground/background pair against a WCAG threshold and reports the
 * ratio, the required minimum, and whether it passes. Defaults to the GDS
 * baseline: **AA, normal text (4.5:1)** — the same bar `verify:token-contrast-scoring`
 * hard-gates GDS's own readable-text token pairs at.
 *
 * Thresholds: AA `normal` 4.5 / `large` 3; AAA `normal` 7 / `large` 4.5.
 *
 * @example
 * ```ts
 * checkGdsContrast('#5f6d82', '#eef2ff');
 * // { ratio: 4.7, required: 4.5, passes: true, level: 'AA', size: 'normal' }
 * ```
 */
export function checkGdsContrast(
  foreground: string,
  background: string,
  options: { level?: GdsContrastLevel; size?: GdsContrastTextSize } = {},
): GdsContrastResult {
  const level = options.level ?? 'AA';
  const size = options.size ?? 'normal';
  const required = THRESHOLDS[level][size];
  const ratio = getGdsContrastRatio(foreground, background);
  return { ratio, required, passes: ratio >= required, level, size };
}
