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
 * GdsGeneratedThumbnail (epic #503, issue 505): a deterministic, zero-network
 * SVG+HTML card thumbnail composed entirely from a listing's own category
 * data — no image hosting, no AI image generation, no per-consumer design
 * work. Generalizes a ClassScout engineering proposal (verified against real
 * `GdsMapPinBadge`/`gdsBadgeAccentShades` values before this was built) into
 * a theme-managed GDS primitive: `paletteSource: 'theme'` (default) resolves
 * from the active theme's `brand.primary`/`brand.accent` tokens, so it's
 * on-brand for any consumer with zero config; `paletteSource: 'category'`
 * opts into the existing fixed curated-accent system for consumers who want
 * category color to stay stable across theme changes.
 *
 * **Two rendering layers, two technologies, on purpose.** The background
 * (accent wash + oversized low-opacity icon motif) is decorative and is
 * drawn as inline SVG so it's zero-network and forced-colors-inert by
 * construction. The badges are real information (a category name a screen
 * reader must announce, text that must remain selectable/translatable) and
 * are rendered as HTML, absolutely positioned over the SVG — not composited
 * into it. This also means `GdsBadge`/`GdsBadgeStack` (both HTML-rooted)
 * aren't reusable here as-is: `GdsBadge`'s `accent`/`tone` props are closed
 * unions that can't accept an arbitrary resolved theme color, so the badge
 * pill here is a small dedicated element instead.
 *
 * **Contrast is guaranteed, not assumed, for `paletteSource: 'theme'`.**
 * `'theme'` mode's colors arrive as CSS `var(...)` references — there is no
 * live-resolved hex value in JS to run a contrast check against. Every
 * surface that carries fixed white/inverse text (the badge pill; the
 * gradient's dark stop) is pushed through
 * `color-mix(in srgb, <color> 30%, black)` first: even the lightest
 * possible input (pure white) mixed at that ratio still clears 7:1 against
 * white text, so the guarantee holds for every theme without needing to
 * know its actual values. `paletteSource: 'category'` colors are already
 * individually verified ≥4.5:1 against white (`gdsBadgeAccentShades`'s own
 * test suite); the same mix is applied anyway for one visual language
 * across both modes, not because category mode needs it.
 *
 * A headless, non-React `buildGdsThumbnailSvg()` twin for OG/share-image use
 * (issue 508) lives in `generated-art-svg.ts`, exported from
 * `@sovereignsquad/gds-core/server` only — it needs hand-rendered SVG
 * `<text>` for the badge labels (no HTML/CSS cascade outside a browser),
 * real enough of a difference from this component's HTML badge layer that
 * it's a genuinely separate implementation, not a thin wrapper around this
 * one. See `docs/GENERATED_IMAGERY.md`'s OG-image recipe section.
 */

/** One ranked category driving {@link GdsGeneratedThumbnail}'s motif and badges. */
export interface GdsGeneratedThumbnailCategory {
  /** Stable identity for React keys — not rendered. */
  key: string;
  /** Real, consumer-supplied category name (never an icon library's own display name). */
  label: string;
  /** A canonical `GdsIcons` key, or any externally-sourced icon element. */
  icon: GdsIconKey | ReactNode;
  /** When given, this badge renders as a real button (native focus/click/keyboard) instead of static content, and fires with the category's `key` on activation. */
  onSelect?: (key: string) => void;
}

/** Supported card aspect ratios. */
export type GdsGeneratedThumbnailAspectRatio = '3:2' | '16:9' | '4:3' | '1:1';

const ASPECT_RATIO_VIEWBOX: Record<GdsGeneratedThumbnailAspectRatio, { width: number; height: number }> = {
  '3:2': { width: 300, height: 200 },
  '16:9': { width: 320, height: 180 },
  '4:3': { width: 320, height: 240 },
  '1:1': { width: 240, height: 240 },
};

/** Props for {@link GdsGeneratedThumbnail}. */
export interface GdsGeneratedThumbnailProps {
  /** Stable entity id (e.g. a listing id) driving the deterministic motif placement — same seed, same composition, every render. */
  seed: string;
  /** Ranked categories: index 0 is the lead badge and the motif source; the rest render as icon-only secondary badges up to `maxBadges`. At least one required. */
  categories: GdsGeneratedThumbnailCategory[];
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
  /** Defaults to `'3:2'`. */
  aspectRatio?: GdsGeneratedThumbnailAspectRatio;
  /** Maximum badges shown (1 lead + up to `maxBadges - 1` secondary). Defaults to `3`. */
  maxBadges?: number;
  /**
   * `'ranked'` (default) renders the category badges over the motif. `'none'` renders the motif
   * alone.
   *
   * Motif-only exists for the case where the thumbnail is a **fallback image** rather than a
   * summary: `ListingCard` shows one when a listing has no photo, and the card already prints
   * the title directly beneath it. Repeating it in a badge duplicated the text on screen and in
   * the accessibility tree — `getByText` started matching two nodes, which is the machine
   * noticing what a reader would have seen.
   */
  badges?: 'ranked' | 'none';
  /** Opacity of the background icon motif (0-1). Defaults to `0.14`. */
  motifOpacity?: number;
  /**
   * Optional overall name for the whole composition. When given, the root
   * renders `role="group"` with this label — `role="img"` is deliberately
   * not used here: unlike `GdsBadgeStack`/`GdsMapPinBadge`, this component's
   * badges are individually meaningful content (real category names a
   * screen reader must be able to reach one at a time), and `role="img"`
   * would collapse them into a single opaque graphic, hiding them. The
   * badges stay in the accessibility tree and keep their own labels
   * regardless of whether `label` is set — only the SVG background
   * (gradient + motif) is `aria-hidden`, unconditionally, since that part
   * really is pure decoration.
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

function renderIcon(icon: GdsIconKey | ReactNode, size: number | string = '100%') {
  if (isIconKey(icon)) {
    return <GdsIcon icon={icon} size={size} tone="default" />;
  }
  if (isValidElement<{ stroke?: number }>(icon)) {
    return cloneElement(icon, { stroke: 1.75 });
  }
  return icon;
}

/** Darkens `colorRef` by a fixed, provably-safe ratio for white text on top — see the module docs for why a fixed ratio is enough without knowing the resolved value. */
function darkSurface(colorRef: string): string {
  return `color-mix(in srgb, ${colorRef} 30%, black)`;
}

interface MotifTransform {
  rotationDeg: number;
  scale: number;
  centerX: number;
  centerY: number;
}

function computeMotifTransform(seed: string, viewBoxWidth: number, viewBoxHeight: number): MotifTransform {
  const next = gdsSeededRandom(seed);
  const rotationDeg = (next() - 0.5) * 26;
  const scale = (viewBoxHeight / 24) * (1.7 + next() * 0.3);
  // Anchored toward the top-right quadrant so the motif bleeds off the top
  // and right edges, leaving the bottom-left clear for the badge overlay.
  const centerX = viewBoxWidth * (0.78 + (next() - 0.5) * 0.12);
  const centerY = viewBoxHeight * (0.28 + (next() - 0.5) * 0.14);
  return { rotationDeg, scale, centerX, centerY };
}

/**
 * Card-scale generated thumbnail: an accent wash, an oversized low-opacity
 * icon motif, and up to `maxBadges` ranked category badges. See the module
 * docs for the palette/contrast/two-layer rationale.
 *
 * @example
 * ```tsx
 * <GdsGeneratedThumbnail
 *   seed={listing.id}
 *   categories={[
 *     { key: 'soccer', label: 'Soccer', icon: <IconBallFootball /> },
 *     { key: 'basketball', label: 'Basketball', icon: <IconBallBasketball /> },
 *   ]}
 * />
 * <GdsGeneratedThumbnail seed={listing.id} categories={categories} paletteSource="category" category="forest" shade="deep" />
 * ```
 */
export function GdsGeneratedThumbnail({
  seed,
  categories,
  paletteSource,
  category,
  shade,
  colors,
  tintWithBackground,
  mixRatio,
  aspectRatio = '3:2',
  maxBadges = 3,
  badges = 'ranked',
  motifOpacity = 0.14,
  label,
  className,
  style,
}: GdsGeneratedThumbnailProps) {
  if (categories.length === 0) {
    throw new Error('GdsGeneratedThumbnail: `categories` must contain at least one entry.');
  }

  const gradientId = useId();
  const palette = useMemo(
    () => gdsGeneratedPaletteCssRefs({ paletteSource, category, shade, colors, tintWithBackground, mixRatio }),
    [paletteSource, category, shade, colors, tintWithBackground, mixRatio],
  );
  const { width: viewBoxWidth, height: viewBoxHeight } = ASPECT_RATIO_VIEWBOX[aspectRatio];
  const motif = useMemo(() => computeMotifTransform(seed, viewBoxWidth, viewBoxHeight), [seed, viewBoxWidth, viewBoxHeight]);

  const lead = categories[0];
  const secondary = categories.slice(1, Math.max(maxBadges, 1));
  const inverseColor = 'var(--gds-text-on-inverse, var(--mantine-color-white))';
  const pillBg = darkSurface(palette.accent);

  return (
    <div
      data-gds-generated-thumbnail=""
      role={label ? 'group' : undefined}
      aria-label={label || undefined}
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
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={darkSurface(palette.primary)} />
          </linearGradient>
        </defs>
        <rect width={viewBoxWidth} height={viewBoxHeight} fill={`url(#${gradientId})`} />
        <g
          transform={`translate(${motif.centerX} ${motif.centerY}) rotate(${motif.rotationDeg}) scale(${motif.scale})`}
          opacity={motifOpacity}
          style={{ color: inverseColor }}
        >
          <svg x={-12} y={-12} width={24} height={24} viewBox="0 0 24 24">
            {renderIcon(lead.icon)}
          </svg>
        </g>
      </svg>

{badges === 'none' ? null : (
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          insetBlockEnd: 0,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(to top, ${darkSurface(palette.primary)} 0%, transparent 100%)`,
        }}
      >
        {(() => {
          const LeadTag = lead.onSelect ? 'button' : 'span';
          return (
            <LeadTag
              data-gds-generated-thumbnail-badge="lead"
              type={lead.onSelect ? 'button' : undefined}
              onClick={lead.onSelect ? () => lead.onSelect?.(lead.key) : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35em',
                padding: '0.3em 0.65em 0.3em 0.45em',
                borderRadius: 'var(--gds-radius-pill)',
                background: pillBg,
                color: inverseColor,
                fontSize: '13px',
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                border: 'none',
                font: lead.onSelect ? 'inherit' : undefined,
                cursor: lead.onSelect ? 'pointer' : undefined,
              }}
            >
              <span aria-hidden="true" style={{ width: '1.1em', height: '1.1em', display: 'inline-flex' }}>
                {renderIcon(lead.icon, '100%')}
              </span>
              {lead.label}
            </LeadTag>
          );
        })()}
        {secondary.map((entry, index) => {
          const SecondaryTag = entry.onSelect ? 'button' : 'span';
          return (
            <SecondaryTag
              key={entry.key}
              data-gds-generated-thumbnail-badge="secondary"
              type={entry.onSelect ? 'button' : undefined}
              onClick={entry.onSelect ? () => entry.onSelect?.(entry.key) : undefined}
              role={entry.onSelect ? undefined : 'img'}
              aria-label={entry.label}
              title={entry.onSelect ? undefined : entry.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.9em',
                height: '1.9em',
                marginInlineStart: index === 0 ? '-0.3em' : '-0.5em',
                borderRadius: '50%',
                background: pillBg,
                color: inverseColor,
                border: '2px solid ' + darkSurface(palette.primary),
                opacity: 1 - index * 0.12,
                flexShrink: 0,
                font: entry.onSelect ? 'inherit' : undefined,
                cursor: entry.onSelect ? 'pointer' : undefined,
              }}
            >
              <span aria-hidden="true" style={{ width: '1em', height: '1em', display: 'inline-flex' }}>
                {renderIcon(entry.icon, '100%')}
              </span>
            </SecondaryTag>
          );
        })}
      </div>
      )}
    </div>
  );
}
