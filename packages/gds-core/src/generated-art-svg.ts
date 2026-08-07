import { cloneElement, createElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';
import { gdsSeededRandom, resolveGdsGeneratedPaletteHex } from './generated-art-engine';
import type { GdsGeneratedPaletteColors, GdsGeneratedPaletteSource } from './generated-art-engine';
import type { GdsGeneratedThumbnailAspectRatio, GdsGeneratedThumbnailCategory } from './GdsGeneratedThumbnail';
import type { GdsGeneratedHeroAspectRatio, GdsGeneratedHeroBackground, GdsGeneratedHeroBadge } from './GdsGeneratedHero';
import type { GdsThemePresetId } from '@sovereignsquad/gds-theme';

/**
 * Headless, non-React twins of `GdsGeneratedThumbnail`/`GdsGeneratedHero`
 * (epic #503, issue #508): plain functions returning a complete, valid,
 * self-contained `<svg>...</svg>` string — for `og:image` routes, email,
 * or any SSR/rasterization context with no live browser CSS cascade.
 *
 * **Why this can't just reuse the React components' output.** Both
 * components lean on two browser-only CSS features for their theme-managed
 * colors and contrast guarantee: `var(--gds-brand-primary, ...)` (resolved
 * by the browser against whichever theme is active) and
 * `color-mix(in srgb, ...)` (the fixed-ratio darkening that makes the
 * contrast guarantee hold without knowing the resolved value). Neither
 * resolves outside a real DOM. This module's palette input is therefore
 * always literal hex — see {@link resolveGdsGeneratedPaletteHex} — and its
 * darkening step is real RGB arithmetic on that hex ({@link mixHexTowardBlack}),
 * not a CSS function. Badge labels are hand-laid-out SVG `<text>`, not
 * HTML: there's no flexbox/CSS cascade here to lay them out for us.
 *
 * **Icons still work exactly like the React components' `icon` prop** —
 * a canonical `GdsIconKey`, or any externally-sourced icon element — via
 * `react-dom/server`'s `renderToStaticMarkup`, which is Node/edge-SSR-safe
 * (no browser required, the same primitive Next.js's own SSR pipeline is
 * built on). This is why this module lives in `server.ts` only, never
 * `client.ts`/`index.ts`: `react-dom/server` has no browser bundle to be
 * pulled into by mistake.
 *
 * **The placement math here is intentionally re-derived, not imported**
 * from `GdsGeneratedThumbnail.tsx`/`GdsGeneratedHero.tsx`: those functions
 * are small, pure arithmetic (a rotation, a scale, a slot table) with their
 * own tests here holding both sides to the same documented geometry, not
 * business logic likely to drift silently. Importing across the
 * React/non-React boundary would risk pulling `react-dom/server` into the
 * client bundle transitively — not a tradeoff worth making for ~30 lines of
 * arithmetic.
 *
 * See `docs/GENERATED_IMAGERY.md` for the OG-image recipes this powers.
 */

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

/**
 * Renders `icon` to a **explicitly-sized** nested `<svg width="{size}"
 * height="{size}" viewBox="0 0 24 24">` fragment. `size` is never omitted:
 * the rendered icon element's own root `<svg>` (from `GdsIcon`/Tabler) uses
 * `width="100%" height="100%"`, which only resolves correctly against an
 * explicitly-sized ancestor SVG viewport — a bare `<g>` wrapper (no size of
 * its own) leaves that percentage resolving against the outermost canvas
 * instead, rendering the icon at the wrong (usually far too large) size.
 * This is why every call site below passes a real pixel size, even the
 * motif (24, matching its own `viewBox`) which gets scaled up afterward via
 * its enclosing `<g transform="scale(...)">`, exactly mirroring
 * `GdsGeneratedThumbnail.tsx`'s identical `<svg x={-12} y={-12} width={24}
 * height={24} viewBox="0 0 24 24">` nesting.
 */
function iconSvg(icon: GdsIconKey | ReactNode, color: string, size: number): string {
  const element = isIconKey(icon)
    ? createElement(GdsIcon, { icon, size: '100%', tone: 'default' })
    : isValidElement<{ stroke?: number }>(icon)
      ? cloneElement(icon, { stroke: 1.75 })
      : icon;
  const rendered = renderToStaticMarkup(createElement('g', { style: { color } }, element));
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24">${rendered}</svg>`;
}

/** Mixes `hex` toward black by RGB arithmetic — the headless equivalent of the React components' `color-mix(in srgb, <color> 30%, black)`, since CSS color functions don't resolve outside a browser. Same 30% ratio, same provable guarantee (even a pure-white input clears ~7:1 against white text). */
function mixHexTowardBlack(hex: string, keepPercent: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    return hex;
  }
  const value = parseInt(match[1], 16);
  const mix = (channel: number) => Math.round((channel * keepPercent) / 100);
  const r = mix((value >> 16) & 0xff);
  const g = mix((value >> 8) & 0xff);
  const b = mix(value & 0xff);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const THUMBNAIL_ASPECT_RATIO_VIEWBOX: Record<GdsGeneratedThumbnailAspectRatio, { width: number; height: number }> = {
  '3:2': { width: 300, height: 200 },
  '16:9': { width: 320, height: 180 },
  '4:3': { width: 320, height: 240 },
  '1:1': { width: 240, height: 240 },
};

function computeMotifTransform(seed: string, viewBoxWidth: number, viewBoxHeight: number) {
  const next = gdsSeededRandom(seed);
  const rotationDeg = (next() - 0.5) * 26;
  const scale = (viewBoxHeight / 24) * (1.7 + next() * 0.3);
  const centerX = viewBoxWidth * (0.78 + (next() - 0.5) * 0.12);
  const centerY = viewBoxHeight * (0.28 + (next() - 0.5) * 0.14);
  return { rotationDeg, scale, centerX, centerY };
}

/** Options for {@link buildGdsThumbnailSvg}. Mirrors `GdsGeneratedThumbnailProps`, with `themePresetId` added (required for `paletteSource: 'theme'` unless `colors` is given) since there's no live theme to read here. */
export interface GdsGeneratedThumbnailSvgOptions {
  seed: string;
  categories: GdsGeneratedThumbnailCategory[];
  paletteSource?: GdsGeneratedPaletteSource;
  category?: GdsBadgeAccentName;
  shade?: GdsBadgeAccentShade;
  colors?: GdsGeneratedPaletteColors;
  /** Required for `paletteSource: 'theme'` (the default) unless `colors` is given — see {@link resolveGdsGeneratedPaletteHex}. */
  themePresetId?: GdsThemePresetId;
  colorScheme?: 'light' | 'dark';
  aspectRatio?: GdsGeneratedThumbnailAspectRatio;
  maxBadges?: number;
  motifOpacity?: number;
  /** Accessible name embedded as the SVG's own `<title>` — always set here, unlike the React component's optional `label`, since a standalone image file has no adjacent DOM to fall back on. */
  label: string;
}

/**
 * Headless twin of `GdsGeneratedThumbnail` — see the module docs. Returns a
 * complete `<svg>` string; embed it directly (`Content-Type: image/svg+xml`)
 * or rasterize it with any SVG-to-PNG tool.
 *
 * @example
 * ```ts
 * const svg = buildGdsThumbnailSvg({
 *   seed: listing.id,
 *   categories: [{ key: 'soccer', label: 'Soccer', icon: 'Location' }],
 *   themePresetId: 'default',
 *   label: `${listing.title} — Soccer`,
 * });
 * return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
 * ```
 */
export function buildGdsThumbnailSvg(options: GdsGeneratedThumbnailSvgOptions): string {
  const { seed, categories, paletteSource, category, shade, colors, themePresetId, colorScheme, aspectRatio = '3:2', maxBadges = 3, motifOpacity = 0.14, label } = options;
  if (categories.length === 0) {
    throw new Error('buildGdsThumbnailSvg: `categories` must contain at least one entry.');
  }

  const palette = resolveGdsGeneratedPaletteHex({ paletteSource, category, shade, colors, themePresetId, colorScheme });
  const { width, height } = THUMBNAIL_ASPECT_RATIO_VIEWBOX[aspectRatio];
  const motif = computeMotifTransform(seed, width, height);
  const inverse = '#ffffff';
  const pillBg = mixHexTowardBlack(palette.accent, 30);
  const gradientDark = mixHexTowardBlack(palette.primary, 30);

  const lead = categories[0];
  const secondary = categories.slice(1, Math.max(maxBadges, 1));

  const badgeAreaHeight = height * 0.22;
  const badgeY = height - badgeAreaHeight / 2;
  let cursorX = 14;
  const leadFontSize = Math.max(11, height * 0.065);
  const leadIconSize = leadFontSize * 1.3;
  const leadTextWidth = lead.label.length * leadFontSize * 0.58;
  const leadPillWidth = leadIconSize + leadTextWidth + leadFontSize * 1.4;
  const leadPillHeight = leadIconSize + leadFontSize * 0.6;

  const leadBadgeSvg = `
    <g transform="translate(${cursorX} ${badgeY - leadPillHeight / 2})">
      <rect width="${leadPillWidth}" height="${leadPillHeight}" rx="${leadPillHeight / 2}" fill="${pillBg}" />
      <g transform="translate(${leadPillHeight * 0.28} ${leadPillHeight / 2 - leadIconSize / 2})">${iconSvg(lead.icon, inverse, leadIconSize)}</g>
      <text x="${leadIconSize + leadPillHeight * 0.4}" y="${leadPillHeight / 2}" fill="${inverse}" font-family="system-ui, sans-serif" font-size="${leadFontSize}" font-weight="600" dominant-baseline="central">${escapeXmlText(lead.label)}</text>
    </g>`;
  cursorX += leadPillWidth + 8;

  const secondaryBadgesSvg = secondary
    .map((entry, index) => {
      const discSize = leadPillHeight * (0.92 - index * 0.06);
      const svg = `
      <g transform="translate(${cursorX} ${badgeY - discSize / 2})" opacity="${1 - index * 0.12}">
        <circle cx="${discSize / 2}" cy="${discSize / 2}" r="${discSize / 2}" fill="${pillBg}" stroke="${gradientDark}" stroke-width="2" />
        <g transform="translate(${discSize * 0.24} ${discSize * 0.24})">${iconSvg(entry.icon, inverse, discSize * 0.52)}</g>
      </g>`;
      cursorX += discSize * 0.75;
      return svg;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <title>${escapeXmlText(label)}</title>
    <defs>
      <linearGradient id="gds-thumb-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.primary}" />
        <stop offset="100%" stop-color="${gradientDark}" />
      </linearGradient>
      <linearGradient id="gds-thumb-scrim" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${gradientDark}" />
        <stop offset="100%" stop-color="${gradientDark}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#gds-thumb-bg)" />
    <g transform="translate(${motif.centerX} ${motif.centerY}) rotate(${motif.rotationDeg}) scale(${motif.scale})" opacity="${motifOpacity}">
      <g transform="translate(-12 -12)">${iconSvg(lead.icon, inverse, 24)}</g>
    </g>
    <rect x="0" y="${height - badgeAreaHeight * 1.6}" width="${width}" height="${badgeAreaHeight * 1.6}" fill="url(#gds-thumb-scrim)" />
    ${leadBadgeSvg}
    ${secondaryBadgesSvg}
  </svg>`;
}

const HERO_ASPECT_RATIO_VIEWBOX: Record<GdsGeneratedHeroAspectRatio, { width: number; height: number }> = {
  '21:9': { width: 630, height: 270 },
  '16:9': { width: 640, height: 360 },
  '3:1': { width: 600, height: 200 },
};

type SlotSize = 'large' | 'medium' | 'small';
interface SlotPosition {
  x: number;
  y: number;
}
const BADGE_SLOTS: Record<SlotSize, SlotPosition[]> = {
  large: [{ x: 0.85, y: 0.32 }],
  medium: [
    { x: 0.14, y: 0.72 },
    { x: 0.52, y: 0.82 },
  ],
  small: [
    { x: 0.34, y: 0.18 },
    { x: 0.7, y: 0.6 },
    { x: 0.94, y: 0.84 },
  ],
};
const SLOT_SIZE_FACTOR: Record<SlotSize, number> = { large: 0.32, medium: 0.2, small: 0.13 };
const SLOT_OPACITY: Record<SlotSize, number> = { large: 1, medium: 0.85, small: 0.6 };

function seededShuffle<T>(items: readonly T[], next: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function placeHeroBadges(badges: GdsGeneratedHeroBadge[], seed: string) {
  const next = gdsSeededRandom(`${seed}:badges`);
  const capped = badges.slice(0, 6);
  const bySize: Record<SlotSize, GdsGeneratedHeroBadge[]> = {
    large: capped.slice(0, 1),
    medium: capped.slice(1, 3),
    small: capped.slice(3, 6),
  };
  const placed: { badge: GdsGeneratedHeroBadge; size: SlotSize; x: number; y: number; jitterDeg: number }[] = [];
  (Object.keys(BADGE_SLOTS) as SlotSize[]).forEach((size) => {
    const slots = seededShuffle(BADGE_SLOTS[size], next);
    bySize[size].forEach((badge, index) => {
      const slot = slots[index];
      placed.push({ badge, size, x: slot.x, y: slot.y, jitterDeg: (next() - 0.5) * 10 });
    });
  });
  return placed;
}

function computeMosaicTilesSvg(seed: string, width: number, height: number, primary: string, accent: string): string {
  const next = gdsSeededRandom(`${seed}:mosaic`);
  const columns = 9;
  const rows = 4;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const tiles: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      if (next() < 0.32) {
        continue;
      }
      const inset = 0.08 + next() * 0.1;
      const x = col * cellWidth + cellWidth * inset;
      const y = row * cellHeight + cellHeight * inset;
      const w = cellWidth * (1 - inset * 2);
      const h = cellHeight * (1 - inset * 2);
      const opacity = 0.05 + next() * 0.11;
      const fill = next() < 0.5 ? primary : accent;
      tiles.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.12}" fill="${fill}" opacity="${opacity}" />`);
    }
  }
  return tiles.join('');
}

function computeIconFieldSvg(seed: string, badges: GdsGeneratedHeroBadge[], width: number, height: number): string {
  if (badges.length === 0) {
    return '';
  }
  const placementRandom = gdsSeededRandom(`${seed}:icon-field`);
  const pickRandom = gdsSeededRandom(`${seed}:icon-field-pick`);
  const count = Math.min(badges.length, 8);
  const groups: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = width * (0.08 + placementRandom() * 0.84);
    const y = height * (0.1 + placementRandom() * 0.8);
    const size = height * (0.22 + placementRandom() * 0.16);
    const rotationDeg = (placementRandom() - 0.5) * 40;
    const badge = badges[Math.floor(pickRandom() * badges.length)];
    groups.push(
      `<g transform="translate(${x} ${y}) rotate(${rotationDeg}) scale(${size / 24})" opacity="0.1"><g transform="translate(-12 -12)">${iconSvg(badge.icon, '#ffffff', 24)}</g></g>`,
    );
  }
  return groups.join('');
}

/** Options for {@link buildGdsHeroSvg}. Mirrors `GdsGeneratedHeroProps`, with `themePresetId` added for the same reason as {@link GdsGeneratedThumbnailSvgOptions}. */
export interface GdsGeneratedHeroSvgOptions {
  seed: string;
  paletteSource?: GdsGeneratedPaletteSource;
  category?: GdsBadgeAccentName;
  shade?: GdsBadgeAccentShade;
  colors?: GdsGeneratedPaletteColors;
  themePresetId?: GdsThemePresetId;
  colorScheme?: 'light' | 'dark';
  background?: GdsGeneratedHeroBackground;
  badges?: GdsGeneratedHeroBadge[];
  aspectRatio?: GdsGeneratedHeroAspectRatio;
  label: string;
}

/** Headless twin of `GdsGeneratedHero` — see the module docs and {@link buildGdsThumbnailSvg}'s example (the usage shape is identical). */
export function buildGdsHeroSvg(options: GdsGeneratedHeroSvgOptions): string {
  const { seed, paletteSource, category, shade, colors, themePresetId, colorScheme, background = 'wash', badges = [], aspectRatio = '21:9', label } = options;
  const palette = resolveGdsGeneratedPaletteHex({ paletteSource, category, shade, colors, themePresetId, colorScheme });
  const { width, height } = HERO_ASPECT_RATIO_VIEWBOX[aspectRatio];
  const gradientDark = mixHexTowardBlack(palette.primary, 30);
  const accentDark = mixHexTowardBlack(palette.accent, 30);

  let backgroundSvg = '';
  if (background === 'mosaic-abstract') {
    backgroundSvg = computeMosaicTilesSvg(seed, width, height, palette.primary, palette.accent);
  } else if (background === 'icon-field') {
    backgroundSvg = computeIconFieldSvg(seed, badges, width, height);
  } else if (typeof background === 'object' && background.type === 'region-mosaic') {
    backgroundSvg = background.regions
      .map((region) => {
        const weight = region.weight ?? 1;
        const opacity = Math.min(0.85, 0.06 + weight * 0.05);
        return `<rect x="${region.x0 * width}" y="${region.y0 * height}" width="${(region.x1 - region.x0) * width}" height="${(region.y1 - region.y0) * height}" fill="${palette.accent}" opacity="${opacity}" />`;
      })
      .join('');
  }

  const placedBadges = placeHeroBadges(badges, seed);
  const badgesSvg = placedBadges
    .map(({ badge, size, x, y, jitterDeg }) => {
      const boxSize = height * SLOT_SIZE_FACTOR[size];
      const cx = x * width;
      const cy = y * height;
      return `
      <g transform="translate(${cx} ${cy}) rotate(${jitterDeg})" opacity="${SLOT_OPACITY[size]}">
        <circle r="${boxSize / 2}" fill="${accentDark}" stroke="${gradientDark}" stroke-width="2" />
        <g transform="translate(${-boxSize * 0.275} ${-boxSize * 0.275})">${iconSvg(badge.icon, '#ffffff', boxSize * 0.55)}</g>
      </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <title>${escapeXmlText(label)}</title>
    <defs>
      <linearGradient id="gds-hero-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.primary}" />
        <stop offset="100%" stop-color="${gradientDark}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#gds-hero-bg)" />
    ${backgroundSvg}
    ${badgesSvg}
  </svg>`;
}
