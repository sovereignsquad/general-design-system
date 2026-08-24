import { mixCssColors, resolveGdsAccentTokens } from '@sovereignsquad/gds-theme';

/** Axis-derived defaults, for the paths where a CSS variable cannot resolve. */
const gdsResolvedAccentFallback = resolveGdsAccentTokens(undefined, 'light');
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';
import { getGdsVibeThemeCssVariables, resolveGdsVibeTheme } from '@sovereignsquad/gds-theme';
import type { GdsThemePresetId } from '@sovereignsquad/gds-theme';

/**
 * Shared foundations for GDS's generated-imagery system (epic #503): a seeded
 * PRNG so composed art is deterministic (same entity id, same result, every
 * render, on server and client alike), and a palette resolver so that art can
 * be either theme-managed (beautiful against any consumer's brand, zero
 * config) or category-managed (the existing curated accent system, for
 * consumers who want category color to stay stable across themes). No
 * component lives here yet — `GdsGeneratedThumbnail`/`GdsGeneratedHero`
 * (issues #505/#506) are the first consumers of this module.
 */

/**
 * A small, dependency-free deterministic PRNG (mulberry32) seeded from an
 * arbitrary string via FNV-1a hashing. Never use `Math.random()` for
 * generated-art placement: the same entity id must produce the same
 * composition on every render, including the first server-rendered paint,
 * or hydration mismatches and "the card looks different every reload" bugs
 * follow directly.
 *
 * @example
 * ```ts
 * const next = gdsSeededRandom(listing.id);
 * const rotationDeg = (next() - 0.5) * 24; // same listing.id -> same angle, always
 * ```
 */
export function gdsSeededRandom(seed: string): () => number {
  let hash = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let state = hash >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which color source a generated-art palette resolves from. See `GENERATED_IMAGERY.md` (#507) for the full comparison once it ships. */
export type GdsGeneratedPaletteSource = 'theme' | 'category';

/** A resolved primary/accent color pair — the two hues generated art composes from. */
export interface GdsGeneratedPaletteColors {
  /** Dominant hue: the wash/fill color. */
  primary: string;
  /** Secondary hue: badges, motif highlights, gradient endpoints. */
  accent: string;
}

/** Options shared by both palette resolvers ({@link gdsGeneratedPaletteCssRefs} and {@link resolveGdsGeneratedPaletteHex}). */
export interface GdsGeneratedPaletteOptions {
  /** Defaults to `'theme'`. */
  paletteSource?: GdsGeneratedPaletteSource;
  /** Required when `paletteSource` is `'category'`. */
  category?: GdsBadgeAccentName;
  /** `'category'` mode only. Defaults to `'base'`. */
  shade?: GdsBadgeAccentShade;
  /**
   * Explicit override — wins over `paletteSource` entirely when given, and is
   * used exactly as supplied (no CSS-var wrapping, no lookup). This is the
   * only way to resolve a custom, non-built-in brand theme (one made with a
   * consumer's own `createBrandTheme(...)`, not one of GDS's 25 built-in
   * presets) for {@link resolveGdsGeneratedPaletteHex} — GDS has no static
   * record of a consumer's own brand values to look up outside a live DOM.
   */
  colors?: GdsGeneratedPaletteColors;
  /**
   * Background to tint the resolved palette toward. On {@link gdsGeneratedPaletteCssRefs}
   * (live DOM) this must be a CSS color/var reference, mixed via `color-mix()`; on
   * {@link resolveGdsGeneratedPaletteHex} (no live DOM) it must be a literal hex, mixed via
   * `mixCssColors`. Requires `mixRatio`. Does not apply when `colors` is given — an explicit
   * override is used exactly as supplied.
   */
  tintWithBackground?: string;
  /** Weight of the original palette color, `0`–`1`. Required when `tintWithBackground` is given. */
  mixRatio?: number;
}

/** A resolved palette plus which strategy actually produced it. */
export interface GdsGeneratedPalette extends GdsGeneratedPaletteColors {
  source: GdsGeneratedPaletteSource | 'override';
}

const DEFAULT_VIBE = resolveGdsVibeTheme('default');

/**
 * The category accent as a CSS VARIABLE REFERENCE, for live-DOM rendering.
 *
 * issue 594. This used to return a fixed hex, and the reason was sound at the time: accents
 * were "deliberately theme-independent fixed sRGB — there is no variable to reference". The
 * accent axis makes that premise false, so a category surface now follows the active theme.
 */
function resolveCategoryColorToken(options: GdsGeneratedPaletteOptions): string {
  if (!options.category) {
    throw new Error("gds-core generated-art-engine: paletteSource 'category' requires a `category` option (a GdsBadgeAccentName).");
  }
  // issue 594. This returned a fixed hex because the comment below was true: accents were
  // "deliberately theme-independent fixed sRGB — there is no variable to reference". The
  // accent axis makes that premise false, so the live-DOM path now references the token and
  // follows the theme. `resolveGdsGeneratedPaletteHex` still resolves to a literal, because
  // CSS variables genuinely do not resolve outside a browser — that distinction is real and
  // is why this is the one consumer that needs both forms.
  const shade = options.shade ?? 'base';
  return `var(--gds-accent-${options.category}-${shade}, ${gdsResolvedAccentFallback[`--gds-accent-${options.category}-${shade}`]})`;
}

/**
 * The category accent as a RESOLVED LITERAL, for rendering with no browser.
 *
 * OG images, share cards and email are composed outside a document, where a CSS custom
 * property resolves to nothing at all — a `var()` here would silently produce an unpainted
 * shape rather than an error. This is the one consumer that genuinely needs both forms, and
 * it is why the migration was split from the token layer.
 *
 * When a preset is supplied the accent is resolved FOR THAT PRESET, so a themed share image
 * carries the theme's accents rather than the default lane's.
 */
function resolveCategoryColorHex(options: ResolveGdsGeneratedPaletteHexOptions): string {
  if (!options.category) {
    throw new Error("gds-core generated-art-engine: paletteSource 'category' requires a `category` option (a GdsBadgeAccentName).");
  }
  const shade = options.shade ?? 'base';
  const tokens = options.themePresetId
    ? getGdsVibeThemeCssVariables(options.themePresetId, options.colorScheme ?? 'light')
    : gdsResolvedAccentFallback;
  const resolved = tokens[`--gds-accent-${options.category}-${shade}`];
  if (!resolved) {
    throw new Error(
      `gds-core generated-art-engine: no resolved value for --gds-accent-${options.category}-${shade}. `
      + 'A missing accent token must fail here rather than emit an unpainted shape.',
    );
  }
  return resolved;
}

/**
 * Resolves a palette for **live-DOM rendering** (the `GdsGeneratedThumbnail`/
 * `GdsGeneratedHero` React components): `'theme'` mode returns CSS
 * var-reference strings (e.g. `"var(--gds-brand-primary, #1f2a3c)"`), which
 * the browser resolves natively against whichever theme is actually active —
 * safe to render on the server (the string is just text; no DOM API is
 * called) and correct on the client without any hydration mismatch, exactly
 * like `GdsBadge.tsx`'s own `toneColors` already does. `'category'` mode
 * returns the curated accent's literal hex directly, since
 * `gdsBadgeAccentColors`/`gdsBadgeAccentShades` are deliberately
 * theme-independent fixed sRGB — there is no variable to reference.
 *
 * For non-DOM rendering (OG/share images, email) use
 * {@link resolveGdsGeneratedPaletteHex} instead — CSS variables don't resolve
 * outside a browser.
 */
function applyCssTint(color: string, options: GdsGeneratedPaletteOptions): string {
  if (!options.tintWithBackground || options.mixRatio === undefined) {
    return color;
  }
  return `color-mix(in srgb, ${color} ${Math.round(options.mixRatio * 100)}%, ${options.tintWithBackground})`;
}

export function gdsGeneratedPaletteCssRefs(options: GdsGeneratedPaletteOptions = {}): GdsGeneratedPalette {
  if (options.colors) {
    return { ...options.colors, source: 'override' };
  }
  const source = options.paletteSource ?? 'theme';
  if (source === 'category') {
    const color = applyCssTint(resolveCategoryColorToken(options), options);
    return { primary: color, accent: color, source: 'category' };
  }
  return {
    primary: applyCssTint(`var(--gds-brand-primary, ${DEFAULT_VIBE.primary})`, options),
    accent: applyCssTint(`var(--gds-brand-accent, ${DEFAULT_VIBE.accent})`, options),
    source: 'theme',
  };
}

/** {@link GdsGeneratedPaletteOptions} plus what {@link resolveGdsGeneratedPaletteHex} additionally needs to resolve a literal hex value for `'theme'` mode. */
export interface ResolveGdsGeneratedPaletteHexOptions extends GdsGeneratedPaletteOptions {
  /** One of the 25 built-in presets, required for `'theme'` mode unless `colors` is supplied instead. */
  themePresetId?: GdsThemePresetId;
  /** Defaults to `'light'`. */
  colorScheme?: 'light' | 'dark';
}

/**
 * Resolves a palette to **literal hex values**, for contexts with no live
 * CSS cascade to resolve a `var(...)` reference against — an `og:image`
 * route, an email template, any SSR-to-string/rasterization pipeline
 * (see #508). `'category'` mode is unchanged from
 * {@link gdsGeneratedPaletteCssRefs} (already a static literal). `'theme'`
 * mode requires either `themePresetId` (looked up via
 * `getGdsVibeThemeCssVariables`, which already derives real `--gds-brand-*`
 * hex values for all 25 built-in presets) or an explicit `colors` override
 * for a custom brand theme — there is deliberately no silent fallback
 * guess when neither is given, since guessing a consumer's brand color
 * wrong is worse than a clear error at build time.
 */
function applyHexTint(color: string, options: ResolveGdsGeneratedPaletteHexOptions): string {
  if (!options.tintWithBackground || options.mixRatio === undefined) {
    return color;
  }
  return mixCssColors(color, options.tintWithBackground, options.mixRatio, '#ffffff');
}

export function resolveGdsGeneratedPaletteHex(options: ResolveGdsGeneratedPaletteHexOptions = {}): GdsGeneratedPalette {
  if (options.colors) {
    return { ...options.colors, source: 'override' };
  }
  const source = options.paletteSource ?? 'theme';
  if (source === 'category') {
    const color = applyHexTint(resolveCategoryColorHex(options), options);
    return { primary: color, accent: color, source: 'category' };
  }
  if (!options.themePresetId) {
    throw new Error(
      "gds-core generated-art-engine: resolveGdsGeneratedPaletteHex with paletteSource 'theme' requires either `themePresetId` (one of the 25 built-in presets) or an explicit `colors` override for a custom brand theme — there is no live DOM to read CSS variables from outside a browser.",
    );
  }
  const variables = getGdsVibeThemeCssVariables(options.themePresetId, options.colorScheme ?? 'light');
  return {
    primary: applyHexTint(variables['--gds-brand-primary'] ?? DEFAULT_VIBE.primary, options),
    accent: applyHexTint(variables['--gds-brand-accent'] ?? DEFAULT_VIBE.accent, options),
    source: 'theme',
  };
}
