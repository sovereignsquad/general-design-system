import { cloneElement, createElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeGdsThemeIdentity, getGdsContrastRatio } from '@sovereignsquad/gds-theme';
import type { GdsThemePresetId } from '@sovereignsquad/gds-theme';
import { GdsBadgeShapes } from './badge-shapes';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import { gdsSeededRandom, resolveGdsGeneratedPaletteHex } from './generated-art-engine';
import type { GdsGeneratedPaletteColors } from './generated-art-engine';

/**
 * Headless brand-badge/favicon builder (issue 699, filling epic 503's
 * missing favicon/app-icon slot): a non-React twin of `GdsGeneratedMark` — see
 * `generated-art-svg.ts`'s module docs for why a headless twin exists at
 * all (no `var(...)`/`color-mix()` outside a browser, `react-dom/server`
 * for icon motifs, geometry re-derived rather than imported across the
 * React/non-React boundary). This module lives in `server.ts` only, for
 * the same reason.
 *
 * **What's different from the other headless twins.** A favicon/app-icon
 * has one requirement `buildGdsThumbnailSvg`/`buildGdsHeroSvg` don't: the
 * motif sits directly on the raw gradient with nothing behind it, so the
 * white motif ink must individually clear WCAG's 1.4.11 non-text floor
 * (≥3:1) against whatever color is actually under it — the gradient's own
 * midpoint, since the canvas is a corner-to-corner `primary → accent`
 * gradient and the motif is centred, i.e. exactly on that diagonal's
 * midpoint. `resolveMotifBackingKeepPercent` finds the largest
 * `mixHexTowardBlack` `keepPercent` (in the same 5% steps a badge's own
 * darkening step already uses) that still clears the floor, and applies it
 * to both gradient stops equally — so the badge darkens exactly as much as
 * its own palette needs and no more, and the gradient's visual balance
 * (the ratio between its two stops) is unchanged, only its overall depth.
 *
 * See `docs/GENERATED_IMAGERY.md` for the favicon/manifest recipes this
 * powers, and `GdsGeneratedMark` for the live-DOM sibling whose canvas
 * size, gradient direction, motif proportion, and tilt formula this
 * module's geometry is held identical to (twin-tested).
 */

const CANVAS = 48;
const DEFAULT_CORNER_RADIUS_RATIO = 0.25;
const MASKABLE_SAFE_ZONE_RATIO = 0.8;
/** Matches `GdsGeneratedMark`'s `size="55%"` icon proportion. */
const MOTIF_SIZE_RATIO = 0.55;
/** Motif ink color — fixed literal, matching `generated-art-svg.ts`'s identical `inverse = '#ffffff'` precedent for the same reason: this is the headless equivalent of `GdsGeneratedMark`'s `var(--gds-text-on-inverse, var(--mantine-color-white, #ffffff))`, and CSS variables don't resolve outside a browser. */
const MOTIF_COLOR = '#ffffff';

const isIconKey = (icon: GdsIconKey | ReactNode | undefined): icon is GdsIconKey => typeof icon === 'string';

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parses `#rgb`, `#rrggbb`, `rgb(r, g, b)`, or `rgba(r, g, b, a)` (alpha
 * ignored — every consumer of this is an opaque brand fill) into 0-255
 * channels. Resolved GDS brand tokens are not always `#rrggbb` — `default`'s
 * `--gds-brand-accent` resolves to an `rgb(...)` string, since the
 * accent-axis derivation (`ensureContrast`/`mixCssColors`) emits that
 * format — so both forms are real, built-in-preset input, not just a
 * hypothetical consumer override. `null` for anything else (a CSS keyword,
 * a gradient/`color-mix()` function, malformed input).
 */
function parseColorChannels(value: string): { r: number; g: number; b: number } | null {
  const trimmed = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) digits = digits.split('').map((c) => c + c).join('');
    const parsed = parseInt(digits, 16);
    return { r: (parsed >> 16) & 0xff, g: (parsed >> 8) & 0xff, b: parsed & 0xff };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*[\d.]+)?\s*\)$/i.exec(trimmed);
  if (rgb) {
    return { r: Math.round(+rgb[1]), g: Math.round(+rgb[2]), b: Math.round(+rgb[3]) };
  }
  return null;
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Mixes `color` toward black by RGB arithmetic — the headless equivalent of `color-mix(in srgb, <color> N%, black)`. Unparseable input (see {@link parseColorChannels} — a genuinely non-color `colors` override, e.g. a CSS gradient function) is returned unchanged: there is no live browser to resolve a CSS mix function against, and the darkening step degrades gracefully rather than throwing (documented limitation, scoped to such overrides). */
function mixHexTowardBlack(color: string, keepPercent: number): string {
  const channels = parseColorChannels(color);
  if (!channels) {
    return color;
  }
  const mix = (channel: number) => (channel * keepPercent) / 100;
  return toHex({ r: mix(channels.r), g: mix(channels.g), b: mix(channels.b) });
}

/** Channel-wise linear mix of two colors (any form {@link parseColorChannels} accepts) at `t` (`0` = `a`, `1` = `b`), returned as `#rrggbb`. Same unparseable-input fallback as {@link mixHexTowardBlack}. */
function mixHexChannelwise(a: string, b: string, t: number): string {
  const colorA = parseColorChannels(a);
  const colorB = parseColorChannels(b);
  if (!colorA || !colorB) {
    return a;
  }
  const mix = (from: number, to: number) => from + (to - from) * t;
  return toHex({ r: mix(colorA.r, colorB.r), g: mix(colorA.g, colorB.g), b: mix(colorA.b, colorB.b) });
}

/** Rounds to 4 decimal places — keeps computed SVG numeric attributes free of floating-point noise (`0.1 * 48` is `4.800000000000001` in IEEE 754) without affecting determinism: the same input always rounds to the same output. */
function roundNum(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** XML id-safe form of an arbitrary string: everything but `[a-zA-Z0-9-]` becomes `-`. */
function sanitizeForId(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, '-');
}

/**
 * Renders `icon` to an explicitly-sized nested `<svg width="{size}"
 * height="{size}" viewBox="0 0 24 24">` fragment — see `generated-art-svg.ts`'s
 * `iconSvg` for why the explicit size matters (a bare `<g>` wrapper leaves
 * `GdsIcon`'s own `width="100%"` resolving against the outer canvas instead).
 */
function iconToStaticSvg(icon: GdsIconKey | ReactNode, color: string, size: number): string {
  const element = isIconKey(icon)
    ? createElement(GdsIcon, { icon, size: '100%', tone: 'default' })
    : isValidElement<{ stroke?: number }>(icon)
      ? cloneElement(icon, { stroke: 1.75 })
      : icon;
  const rendered = renderToStaticMarkup(createElement('g', { style: { color } }, element));
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24">${rendered}</svg>`;
}

/**
 * The largest `mixHexTowardBlack` `keepPercent` (100 down to 0, in 5% steps)
 * at which darkening `primary`/`accent` equally still clears the 3:1
 * non-text contrast floor for {@link MOTIF_COLOR} at the gradient's midpoint
 * — see the module docs for why the midpoint is the color that matters.
 * `mixHexTowardBlack(hex, k)` scales every channel by `k/100`, so scaling
 * both stops by the same `k` scales their midpoint by that same `k` — the
 * gradient's own balance is preserved, only its depth changes. Guaranteed
 * to terminate: at `keepPercent: 0` both stops are black, and black clears
 * 3:1 against white unconditionally. Falls back to `100` (no darkening) if
 * either input isn't a resolvable `#rrggbb` color — an override `colors`
 * value supplied as `rgba(...)` degrades the same way `mixHexTowardBlack`
 * itself does, rather than throwing over a caller-supplied color GDS
 * doesn't govern.
 */
function resolveMotifBackingKeepPercent(primary: string, accent: string): number {
  for (let keepPercent = 100; keepPercent >= 0; keepPercent -= 5) {
    const midpoint = mixHexChannelwise(
      mixHexTowardBlack(primary, keepPercent),
      mixHexTowardBlack(accent, keepPercent),
      0.5,
    );
    let ratio: number;
    try {
      ratio = getGdsContrastRatio(MOTIF_COLOR, midpoint);
    } catch {
      return 100;
    }
    if (ratio >= 3) {
      return keepPercent;
    }
  }
  return 0;
}

/** Options for {@link buildGdsBrandBadgeSvg}. */
export interface GdsBrandBadgeSvgOptions {
  /** Required for the default theme palette unless `colors` is given (`resolveGdsGeneratedPaletteHex` contract). */
  themePresetId?: GdsThemePresetId;
  /** Defaults to `'light'`. */
  colorScheme?: 'light' | 'dark';
  /** Explicit palette override for custom brand themes; used exactly as supplied. */
  colors?: GdsGeneratedPaletteColors;
  /** Motif: a canonical `GdsIcons` key or any icon element (`GdsBadgeShapes` components included). Defaults to the `GdsBadgeShapes.circle` silhouette, the shape vocabulary's documented neutral default. */
  icon?: GdsIconKey | ReactNode;
  /** Geometry seed. Defaults to `computeGdsThemeIdentity({ preset: themePresetId, colorScheme })` (or `'override'` when `colors` is supplied instead of a preset); pass an explicit seed to pin geometry across token changes. */
  seed?: string;
  /** Corner rounding as a fraction of the edge, `0`–`0.5`. Defaults to `0.25` (the 12px default radius of `GdsGeneratedMark` over its 48-unit canvas). Mutually exclusive with `maskable`. */
  cornerRadiusRatio?: number;
  /** `true` = full-bleed square with the motif scaled into the W3C maskable safe zone (a centred circle spanning 80% of the edge). Mutually exclusive with `cornerRadiusRatio`. */
  maskable?: boolean;
  /** Rendered width/height attributes in px; the viewBox stays 48-unit. Defaults to `48`. */
  size?: number;
  /** Accessible name embedded as the SVG's own `<title>`; required, since a standalone image file has no adjacent DOM (same contract as `GdsGeneratedThumbnailSvgOptions.label`). */
  label: string;
}

/**
 * Builds a deterministic, self-contained brand-badge SVG string for a GDS
 * theme preset (or an explicit palette override) — suitable as an SVG
 * favicon (`<link rel="icon" type="image/svg+xml">`) or a
 * `getGdsWebAppManifest` icon entry. See the module docs for why this can't
 * just reuse `GdsGeneratedMark`'s output, and `docs/GENERATED_IMAGERY.md`
 * for the full favicon/manifest recipes and the consumer-replacement path
 * (swap the generated default for real brand PNGs whenever one exists).
 *
 * Deterministic: identical options always produce a byte-identical string —
 * no `Date`, no `Math.random`, no environment-dependent input anywhere in
 * this module. Server-safe: literal hex colors only (no `var(...)`, no
 * `color-mix()`), via `react-dom/server`'s `renderToStaticMarkup` for the
 * motif, which is why this export lives in `@sovereignsquad/gds-core/server`
 * only.
 *
 * @throws if `label` is empty/whitespace, if neither `themePresetId` nor
 * `colors` is given, if `maskable` and `cornerRadiusRatio` are both
 * supplied, if `cornerRadiusRatio` is outside `0`–`0.5`, or if `size` isn't
 * a finite, positive number.
 *
 * @example
 * ```ts
 * import { buildGdsBrandBadgeSvg } from '@sovereignsquad/gds-core/server';
 *
 * const svg = buildGdsBrandBadgeSvg({
 *   themePresetId: 'default',
 *   colorScheme: 'light',
 *   label: 'Acme',
 * });
 * // Serve with Content-Type: image/svg+xml and reference it:
 * //   <link rel="icon" type="image/svg+xml" href="/icon.svg">
 * // or list it in getGdsWebAppManifest({ icons: [...] }).
 * ```
 */
export function buildGdsBrandBadgeSvg(options: GdsBrandBadgeSvgOptions): string {
  const { themePresetId, colorScheme, colors, icon, seed: explicitSeed, cornerRadiusRatio, maskable = false, size = CANVAS, label } = options;

  if (!label || !label.trim()) {
    throw new Error(
      'buildGdsBrandBadgeSvg: `label` is required and must not be empty — a standalone image file has no adjacent DOM to fall back on for an accessible name.',
    );
  }
  if (maskable && cornerRadiusRatio !== undefined) {
    throw new Error(
      'buildGdsBrandBadgeSvg: `maskable` and `cornerRadiusRatio` are mutually exclusive — a maskable badge is always a full-bleed square with no corner rounding of its own (the host platform applies its own mask shape).',
    );
  }
  const resolvedCornerRadiusRatio = cornerRadiusRatio ?? DEFAULT_CORNER_RADIUS_RATIO;
  if (!Number.isFinite(resolvedCornerRadiusRatio) || resolvedCornerRadiusRatio < 0 || resolvedCornerRadiusRatio > 0.5) {
    throw new Error(`buildGdsBrandBadgeSvg: \`cornerRadiusRatio\` must be between 0 and 0.5 (received ${resolvedCornerRadiusRatio}).`);
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`buildGdsBrandBadgeSvg: \`size\` must be a positive, finite number (received ${size}).`);
  }

  const scheme = colorScheme ?? 'light';
  // Throws when neither `themePresetId` nor `colors` is given — the shared
  // engine precedent of a loud, actionable error over a silent wrong badge.
  const palette = resolveGdsGeneratedPaletteHex({ colors, themePresetId, colorScheme: scheme });

  // Reachable only when `colors` is absent, which means `resolveGdsGeneratedPaletteHex`
  // above already required (and found) a `themePresetId` — the cast records that
  // invariant rather than re-deriving it.
  const identity = colors ? 'override' : computeGdsThemeIdentity({ preset: themePresetId as GdsThemePresetId, colorScheme: scheme });
  const seed = explicitSeed ?? identity;
  const tiltDeg = Math.round((gdsSeededRandom(seed)() - 0.5) * 40);

  const keepPercent = resolveMotifBackingKeepPercent(palette.primary, palette.accent);
  const gradientStart = mixHexTowardBlack(palette.primary, keepPercent);
  const gradientEnd = mixHexTowardBlack(palette.accent, keepPercent);

  const idNamespace = sanitizeForId(colors ? `override-${palette.primary}-${palette.accent}` : `${themePresetId}-${scheme}`);
  const gradientId = `gds-badge-grad-${idNamespace}`;
  const clipId = `gds-badge-clip-${idNamespace}`;

  const motifIcon = icon ?? createElement(GdsBadgeShapes.circle);
  const motifSize = roundNum(maskable ? (CANVAS * MASKABLE_SAFE_ZONE_RATIO) / Math.SQRT2 : CANVAS * MOTIF_SIZE_RATIO);
  const motifMarkup = iconToStaticSvg(motifIcon, MOTIF_COLOR, motifSize);
  const clipRectRx = roundNum(maskable ? 0 : resolvedCornerRadiusRatio * CANVAS);
  const motifOffset = roundNum(-motifSize / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${size}" height="${size}" data-gds-theme-identity="${escapeXmlText(identity)}">
    <title>${escapeXmlText(label)}</title>
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradientStart}" />
        <stop offset="100%" stop-color="${gradientEnd}" />
      </linearGradient>
      <clipPath id="${clipId}">
        <rect width="${CANVAS}" height="${CANVAS}" rx="${clipRectRx}" />
      </clipPath>
    </defs>
    <rect width="${CANVAS}" height="${CANVAS}" rx="${clipRectRx}" fill="url(#${gradientId})" clip-path="url(#${clipId})" />
    <g transform="translate(${CANVAS / 2} ${CANVAS / 2}) rotate(${tiltDeg})">
      <g transform="translate(${motifOffset} ${motifOffset})">${motifMarkup}</g>
    </g>
  </svg>`;
}
