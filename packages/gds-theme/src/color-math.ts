/** An opaque or translucent RGB color. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

/** Parses a `#hex`/`#hex8` or `rgb()`/`rgba()` string into `{ r, g, b, a }`; returns `null` for anything else (e.g. `var(...)`). */
export function parseCssColor(value: string): RgbColor | null {
  const input = value.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input);
  if (hex) {
    const raw = hex[1];
    const expanded = raw.length === 3
      ? raw.split('').map((char) => `${char}${char}`).join('')
      : raw;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    const a = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(input);
  if (!rgb) {
    return null;
  }

  const parts = rgb[1].split(',').map((part) => part.trim());
  if (parts.length < 3) {
    return null;
  }

  const [r, g, b] = parts.slice(0, 3).map((part) => {
    if (part.endsWith('%')) {
      return clampChannel((Number(part.slice(0, -1)) / 100) * 255);
    }
    return clampChannel(Number(part));
  });
  const a = parts[3] === undefined ? 1 : Math.max(0, Math.min(1, Number(parts[3])));

  if ([r, g, b, a].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { r, g, b, a };
}

/** Alpha-composites a translucent `foreground` over an opaque `background`. */
export function blend(foreground: RgbColor, background: RgbColor): RgbColor {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) {
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  return {
    r: ((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha,
    g: ((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha,
    b: ((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha,
    a: alpha,
  };
}

/** Parses `color` and, if translucent, composites it over `fallback`; returns `null` if either string can't be parsed. */
export function resolveOpaque(color: string, fallback: string) {
  const parsed = parseCssColor(color);
  const parsedFallback = parseCssColor(fallback);

  if (!parsed || !parsedFallback) {
    return null;
  }

  return parsed.a < 1 ? blend(parsed, parsedFallback) : parsed;
}

/** Formats an `RgbColor` as a CSS `rgb()` string, discarding alpha (the color is expected to already be opaque). */
export function toRgbString(color: RgbColor) {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}

/**
 * Mixes `first` and `second` in sRGB space (matching CSS `color-mix(in srgb, ...)`),
 * weighting `first` by `firstWeight` (0-1). Translucent inputs are composited over
 * `fallbackBackground` first. Returns `first` unchanged if either input can't be parsed.
 */
export function mixCssColors(first: string, second: string, firstWeight: number, fallbackBackground: string) {
  const firstColor = resolveOpaque(first, fallbackBackground);
  const secondColor = resolveOpaque(second, fallbackBackground);

  if (!firstColor || !secondColor) {
    return first;
  }

  const secondWeight = 1 - firstWeight;
  return toRgbString({
    r: (firstColor.r * firstWeight) + (secondColor.r * secondWeight),
    g: (firstColor.g * firstWeight) + (secondColor.g * secondWeight),
    b: (firstColor.b * firstWeight) + (secondColor.b * secondWeight),
    a: 1,
  });
}

function linearize(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0-1) of an opaque `RgbColor`. */
export function luminance(color: RgbColor) {
  return (0.2126 * linearize(color.r)) + (0.7152 * linearize(color.g)) + (0.0722 * linearize(color.b));
}

/**
 * WCAG contrast ratio between `foreground` and `background`, compositing either over
 * `fallbackBackground` first if translucent. Returns `null` if either can't be parsed.
 */
export function contrastRatio(foreground: string, background: string, fallbackBackground: string) {
  const foregroundColor = resolveOpaque(foreground, fallbackBackground);
  const backgroundColor = resolveOpaque(background, fallbackBackground);

  if (!foregroundColor || !backgroundColor) {
    return null;
  }

  const light = Math.max(luminance(foregroundColor), luminance(backgroundColor));
  const dark = Math.min(luminance(foregroundColor), luminance(backgroundColor));
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}
