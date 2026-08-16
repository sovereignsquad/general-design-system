import { cloneElement, isValidElement, useId, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';
import {
  gdsGeneratedPaletteCssRefs,
  gdsSeededRandom,
} from './generated-art-engine';
import type { GdsGeneratedPaletteColors, GdsGeneratedPaletteSource } from './generated-art-engine';

/**
 * GdsGeneratedHero (epic #503, issue #506): a deterministic, zero-network
 * generated backdrop for a page/section hero — a background (one of four
 * pluggable strategies) plus a seeded scatter of up to 6 category badges at
 * a fixed size ladder. This is the backdrop only, not a full hero-with-copy
 * component: eyebrow/title/description/CTAs stay whatever the consumer
 * already renders (e.g. `EditorialHero`, or their own copy) — `GdsGeneratedHero`
 * supplies `background: absolute; inset: 0` art to sit behind it.
 *
 * Shares its palette/contrast/accessibility architecture with
 * `GdsGeneratedThumbnail` — see that module's docs for the full rationale
 * (`paletteSource` theme-vs-category tradeoff, the `color-mix(...30%,
 * black)` contrast guarantee for arbitrary theme colors, and why badges are
 * real HTML rather than composited into the SVG). The one accessibility
 * difference: `label` is **required** here, not optional — a hero backdrop
 * is never used without adjacent context the way a thumbnail sometimes is
 * beside a card title, so there's no decorative-only case to default to.
 *
 * **Fixed slots, not free placement.** Six freely-scattered marks at random
 * sizes reads as clutter and buries whatever headline sits over this
 * backdrop. Six fixed position slots at three sizes (one large, two medium,
 * three small — small ones at reduced opacity, reading as depth rather than
 * debris) is the actual composition; the seed only shuffles which ranked
 * badge lands in which same-size slot (plus a little jitter), never the
 * slot geometry itself or the size-to-rank mapping.
 */

/** One ranked category badge scattered over the hero backdrop. */
export interface GdsGeneratedHeroBadge {
  key: string;
  label: string;
  icon: GdsIconKey | ReactNode;
  /** When given, this badge renders as a real button (native focus/click/keyboard) instead of static content, and fires with the category's `key` on activation. */
  onSelect?: (key: string) => void;
}

/** A consumer-supplied region for the `region-mosaic` background strategy — normalized fractions of the hero's own box, so GDS never needs real geo math or projection logic. */
export interface GdsGeneratedHeroRegion {
  /** Left edge, 0-1. */
  x0: number;
  /** Top edge, 0-1. */
  y0: number;
  /** Right edge, 0-1. */
  x1: number;
  /** Bottom edge, 0-1. */
  y1: number;
  /** Relative tint weight (higher = more visible). Defaults to `1`. */
  weight?: number;
}

/**
 * Background strategy. `'wash'` (a flat/gradient accent panel) needs no
 * data and is the true turnkey default. `'mosaic-abstract'` and
 * `'icon-field'` are also data-free (seeded generative texture, and a
 * scatter of the `badges` icons at low opacity, respectively).
 * `{ type: 'region-mosaic', regions }` is how a consumer with their own geo
 * bounding-box data (e.g. neighborhood boxes) builds a map-like mosaic —
 * GDS renders the shape, the consumer supplies every region.
 */
export type GdsGeneratedHeroBackground =
  | 'wash'
  | 'mosaic-abstract'
  | 'icon-field'
  | { type: 'region-mosaic'; regions: GdsGeneratedHeroRegion[] };

/** Supported hero aspect ratios. */
export type GdsGeneratedHeroAspectRatio = '21:9' | '16:9' | '3:1';

const ASPECT_RATIO_VIEWBOX: Record<GdsGeneratedHeroAspectRatio, { width: number; height: number }> = {
  '21:9': { width: 630, height: 270 },
  '16:9': { width: 640, height: 360 },
  '3:1': { width: 600, height: 200 },
};

/** Props for {@link GdsGeneratedHero}. */
export interface GdsGeneratedHeroProps {
  /** Stable entity id (e.g. a page/location id) driving the deterministic background texture and badge scatter. */
  seed: string;
  /** Defaults to `'theme'`. */
  paletteSource?: GdsGeneratedPaletteSource;
  /** Required when `paletteSource` is `'category'`. */
  category?: GdsBadgeAccentName;
  /** `'category'` mode only. Defaults to `'base'`. */
  shade?: GdsBadgeAccentShade;
  /** Explicit palette override — wins over `paletteSource` entirely when given. */
  colors?: GdsGeneratedPaletteColors;
  /** CSS color/var reference to tint the resolved palette toward. Requires `mixRatio`. */
  tintWithBackground?: string;
  /** Weight of the original palette color, `0`–`1`. Required when `tintWithBackground` is given. */
  mixRatio?: number;
  /** Defaults to `'wash'`. */
  background?: GdsGeneratedHeroBackground;
  /** Up to 6 ranked badges; index 0 gets the large slot, 1-2 the medium slots, 3-5 the small slots. Extra entries beyond 6 are ignored. */
  badges?: GdsGeneratedHeroBadge[];
  /** Defaults to `'21:9'`. */
  aspectRatio?: GdsGeneratedHeroAspectRatio;
  /** Required accessible name for the whole backdrop (e.g. "Sports classes in Riverdale"). Renders `role="group"`, not `role="img"` — see the module docs for why. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

function renderIcon(icon: GdsIconKey | ReactNode) {
  if (isIconKey(icon)) {
    return <GdsIcon icon={icon} size="100%" tone="default" />;
  }
  if (isValidElement<{ stroke?: number }>(icon)) {
    return cloneElement(icon, { stroke: 1.75 });
  }
  return icon;
}

function darkSurface(colorRef: string): string {
  return `color-mix(in srgb, ${colorRef} 30%, black)`;
}

/** Slot size tier — see the module docs for why size (not position) is what encodes rank. */
type SlotSize = 'large' | 'medium' | 'small';

interface SlotPosition {
  x: number;
  y: number;
}

/** Fixed slot geometry (fractions of the viewBox) — see the module docs for why these never move. */
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

interface PlacedBadge {
  badge: GdsGeneratedHeroBadge;
  size: SlotSize;
  x: number;
  y: number;
  jitterDeg: number;
}

/** Shuffles `items` deterministically using `next` (Fisher-Yates), so a seed picks a stable arrangement rather than the array's own order. */
function seededShuffle<T>(items: readonly T[], next: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function placeBadges(badges: GdsGeneratedHeroBadge[], seed: string): PlacedBadge[] {
  const next = gdsSeededRandom(`${seed}:badges`);
  const capped = badges.slice(0, 6);
  const bySize: Record<SlotSize, GdsGeneratedHeroBadge[]> = {
    large: capped.slice(0, 1),
    medium: capped.slice(1, 3),
    small: capped.slice(3, 6),
  };

  const placed: PlacedBadge[] = [];
  (Object.keys(BADGE_SLOTS) as SlotSize[]).forEach((size) => {
    const slots = seededShuffle(BADGE_SLOTS[size], next);
    bySize[size].forEach((badge, index) => {
      const slot = slots[index];
      placed.push({ badge, size, x: slot.x, y: slot.y, jitterDeg: (next() - 0.5) * 10 });
    });
  });
  return placed;
}

interface MosaicTile {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  usePrimary: boolean;
}

function computeMosaicTiles(seed: string, viewBoxWidth: number, viewBoxHeight: number): MosaicTile[] {
  const next = gdsSeededRandom(`${seed}:mosaic`);
  const columns = 9;
  const rows = 4;
  const cellWidth = viewBoxWidth / columns;
  const cellHeight = viewBoxHeight / rows;
  const tiles: MosaicTile[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      if (next() < 0.32) {
        continue;
      }
      const inset = 0.08 + next() * 0.1;
      tiles.push({
        x: col * cellWidth + cellWidth * inset,
        y: row * cellHeight + cellHeight * inset,
        width: cellWidth * (1 - inset * 2),
        height: cellHeight * (1 - inset * 2),
        opacity: 0.05 + next() * 0.11,
        usePrimary: next() < 0.5,
      });
    }
  }
  return tiles;
}

function computeIconFieldPlacements(seed: string, count: number, viewBoxWidth: number, viewBoxHeight: number) {
  const next = gdsSeededRandom(`${seed}:icon-field`);
  return Array.from({ length: count }, () => ({
    x: viewBoxWidth * (0.08 + next() * 0.84),
    y: viewBoxHeight * (0.1 + next() * 0.8),
    size: viewBoxHeight * (0.22 + next() * 0.16),
    rotationDeg: (next() - 0.5) * 40,
  }));
}

/**
 * Renders {@link GdsGeneratedHeroProps.background}. Returns SVG children
 * only — the caller supplies the `<svg>`/`<defs>` wrapper and gradient.
 */
function renderBackground(
  background: GdsGeneratedHeroBackground,
  badges: GdsGeneratedHeroBadge[],
  seed: string,
  palette: { primary: string; accent: string },
  viewBoxWidth: number,
  viewBoxHeight: number,
) {
  if (background === 'mosaic-abstract') {
    const tiles = computeMosaicTiles(seed, viewBoxWidth, viewBoxHeight);
    return (
      <>
        {tiles.map((tile, index) => (
          <rect
            key={index}
            x={tile.x}
            y={tile.y}
            width={tile.width}
            height={tile.height}
            rx={Math.min(tile.width, tile.height) * 0.12}
            fill={tile.usePrimary ? palette.primary : palette.accent}
            opacity={tile.opacity}
          />
        ))}
      </>
    );
  }

  if (background === 'icon-field') {
    const icons = badges.length > 0 ? badges : null;
    if (!icons) {
      return null;
    }
    const next = gdsSeededRandom(`${seed}:icon-field-pick`);
    const placements = computeIconFieldPlacements(seed, Math.min(icons.length, 8), viewBoxWidth, viewBoxHeight);
    return (
      <>
        {placements.map((placement, index) => {
          const icon = icons[Math.floor(next() * icons.length)];
          return (
            <g
              key={index}
              transform={`translate(${placement.x} ${placement.y}) rotate(${placement.rotationDeg}) scale(${placement.size / 24})`}
              opacity={0.1}
              style={{ color: 'var(--gds-text-on-inverse, var(--mantine-color-white))' }}
            >
              <svg x={-12} y={-12} width={24} height={24} viewBox="0 0 24 24">
                {renderIcon(icon.icon)}
              </svg>
            </g>
          );
        })}
      </>
    );
  }

  if (typeof background === 'object' && background.type === 'region-mosaic') {
    return (
      <>
        {background.regions.map((region, index) => {
          const weight = region.weight ?? 1;
          return (
            <rect
              key={index}
              x={region.x0 * viewBoxWidth}
              y={region.y0 * viewBoxHeight}
              width={(region.x1 - region.x0) * viewBoxWidth}
              height={(region.y1 - region.y0) * viewBoxHeight}
              fill={palette.accent}
              opacity={Math.min(0.85, 0.06 + weight * 0.05)}
            />
          );
        })}
      </>
    );
  }

  return null;
}

/**
 * Generated hero backdrop: an accent wash, a pluggable background texture,
 * and a seeded scatter of up to 6 ranked category badges. See the module
 * docs for the palette/contrast/accessibility rationale shared with
 * `GdsGeneratedThumbnail`.
 *
 * @example
 * ```tsx
 * <GdsGeneratedHero
 *   seed={location.id}
 *   label="Sports classes in Riverdale"
 *   background="mosaic-abstract"
 *   badges={topCategories}
 * />
 * ```
 */
export function GdsGeneratedHero({
  seed,
  paletteSource,
  category,
  shade,
  colors,
  tintWithBackground,
  mixRatio,
  background = 'wash',
  badges = [],
  aspectRatio = '21:9',
  label,
  className,
  style,
}: GdsGeneratedHeroProps) {
  const gradientId = useId();
  const palette = useMemo(
    () => gdsGeneratedPaletteCssRefs({ paletteSource, category, shade, colors, tintWithBackground, mixRatio }),
    [paletteSource, category, shade, colors, tintWithBackground, mixRatio],
  );
  const { width: viewBoxWidth, height: viewBoxHeight } = ASPECT_RATIO_VIEWBOX[aspectRatio];
  const placedBadges = useMemo(() => placeBadges(badges, seed), [badges, seed]);
  const inverseColor = 'var(--gds-text-on-inverse, var(--mantine-color-white))';

  return (
    <div
      data-gds-generated-hero=""
      role="group"
      aria-label={label}
      className={className}
      style={{
        position: 'relative',
        aspectRatio: aspectRatio.replace(':', ' / '),
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-md, 12px)',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={darkSurface(palette.primary)} />
          </linearGradient>
        </defs>
        <rect width={viewBoxWidth} height={viewBoxHeight} fill={`url(#${gradientId})`} />
        {renderBackground(background, badges, seed, palette, viewBoxWidth, viewBoxHeight)}
      </svg>

      {placedBadges.map(({ badge, size, x, y, jitterDeg }) => {
        const boxSize = viewBoxHeight * SLOT_SIZE_FACTOR[size];
        const BadgeTag = badge.onSelect ? 'button' : 'span';
        return (
          <BadgeTag
            key={badge.key}
            data-gds-generated-hero-badge={size}
            type={badge.onSelect ? 'button' : undefined}
            onClick={badge.onSelect ? () => badge.onSelect?.(badge.key) : undefined}
            role={badge.onSelect ? undefined : 'img'}
            aria-label={badge.label}
            title={badge.onSelect ? undefined : badge.label}
            style={{
              position: 'absolute',
              insetInlineStart: `${x * 100}%`,
              insetBlockStart: `${y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${jitterDeg}deg)`,
              width: boxSize,
              height: boxSize,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: darkSurface(palette.accent),
              color: inverseColor,
              opacity: SLOT_OPACITY[size],
              boxShadow: `0 2px 10px ${darkSurface(palette.primary)}`,
              border: 'none',
              padding: 0,
              font: badge.onSelect ? 'inherit' : undefined,
              cursor: badge.onSelect ? 'pointer' : undefined,
            }}
          >
            <span aria-hidden="true" style={{ width: '55%', height: '55%', display: 'inline-flex' }}>
              {renderIcon(badge.icon)}
            </span>
          </BadgeTag>
        );
      })}
    </div>
  );
}
