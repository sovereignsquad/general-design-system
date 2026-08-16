import { cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { gdsDevWarnOnce, useGdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import type { GdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import { GdsBadgeShapePin } from './badge-shapes';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import { resolveGdsAccentTokens } from '@sovereignsquad/gds-theme';

const gdsResolvedAccentFallback = resolveGdsAccentTokens(undefined, 'light');
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';

/**
 * Category-colored map-pin marker: pin shape + centered icon, exactly two layers (no
 * ring/capsule).
 *
 * - Centering offset `translateY(-4.1667%)`: derived from the pin head's solved arc center
 *   `(12, 11)` in its 24-unit path space, vs the path box's own center `(12, 12)`.
 * - Pin and icon share `stroke={1.75}`.
 * - Icon color never equals the pin fill: outline mode both render `accent`; filled mode the
 *   icon uses inverse (white-on-dark), always fully opaque regardless of `fillOpacity`.
 * - `shade` darkens one accent by a fixed step (`deep`/`deeper`/`deepest`) for related
 *   sub-categories. Darker-only: lightening breaks filled-mode icon contrast for some accents
 *   (e.g. teal fails at +4 lightness).
 *
 * The pin's true circle center sits above the visible dome's midpoint (the tail hides part of
 * the circle below its chord); centering targets the circle, not the visible dome.
 */

/** Props for {@link GdsMapPinBadge}. */
export interface GdsMapPinBadgeProps {
  /** Curated accent driving the pin/icon color. Fixed sRGB, independent of theme. */
  accent: GdsBadgeAccentName;
  /** A canonical `GdsIcons` key, or any externally-sourced icon element (outline style, matching stroke recommended). */
  icon: GdsIconKey | ReactNode;
  /** Accessible name (e.g. "Riverside Field — soccer"). Never derive from an icon library's import name. */
  label: string;
  /**
   * Solid pin + inverse (white-on-dark) icon, for real basemap imagery.
   * Default (`false`) is an outline pin + accent-colored icon, for
   * schematic/light contexts. See `docs/BADGE_SYSTEM.md`'s map section.
   */
  filled?: boolean;
  /**
   * Opacity of the pin's own fill when `filled` is true (0–1). Defaults to
   * `1` (fully opaque). Has no effect in outline mode, which never fills,
   * and never affects the icon layer — the icon is always fully opaque.
   */
  fillOpacity?: number;
  /**
   * Darkens `accent` by a fixed step (`'deep' | 'deeper' | 'deepest'`) for related
   * sub-categories. Defaults to `'base'`. Darker-only — see {@link GdsBadgeAccentShade}.
   */
  shade?: GdsBadgeAccentShade;
  /** Marker size (width = height). Defaults to `40`. */
  size?: number | string;
  /**
   * Emoji glyph shown instead of `icon` when the effective badge glyph mode is `'emoji'`.
   * Optional: a marker with no `emoji` keeps its Tabler `icon` even in emoji mode. In emoji
   * mode the pin fills with a fixed dark-neutral disc, ignoring `filled`/`fillOpacity` (with a
   * dev-mode warning); the ring/silhouette keeps `accent`.
   */
  emoji?: string;
  /** Per-instance override for the ambient badge glyph mode. Defaults to `GdsProvider`'s `defaultBadgeIconStyle` (`'tabler'`). */
  iconStyle?: GdsBadgeIconStyle;
  /**
   * Interaction/confidence state of the marker. State is carried by silhouette and scale only,
   * never by repainting the category's own hue.
   *
   * - `'idle'` (default).
   * - `'hovered'`: stroke steps to `2.25`, darkens one step down the accent's shade ladder
   *   (`base → deep → deeper → deepest`, saturating at `deepest`).
   * - `'selected'`: marker scales `1.15` around the tail tip (`transform-origin: 50% 100%`),
   *   same `2.25` stroke.
   * - `'approximate'`: stroke goes dashed in the fixed dark-neutral, replacing the solid
   *   accent stroke; the icon keeps `accent`.
   *
   * `saved` is not a state here — compose `<GdsSavedIndicator mode="corner" anchor={<GdsMapPinBadge …/>} />`.
   */
  state?: GdsMapPinState;
}

/** Interaction/confidence states of {@link GdsMapPinBadge} — see the `state` prop. */
export type GdsMapPinState = 'idle' | 'hovered' | 'selected' | 'approximate';

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

/** One step down the accent shade ladder, saturating at `deepest` — used by the hovered state. */
const DEEPER_SHADE: Record<GdsBadgeAccentShade, GdsBadgeAccentShade> = {
  base: 'deep', deep: 'deeper', deeper: 'deepest', deepest: 'deepest',
};

/** Stroke weight for hovered/selected states. Idle keeps 1.75. Exported for the map's marker renderer, which can't compose this component. */
export const GDS_PIN_EMPHASIS_STROKE = 2.25;

/** Selected-state scale step. Applied around the tail tip so the anchored map point holds still. */
export const GDS_PIN_SELECTED_SCALE = 1.15;

/** Dash pattern for the approximate-location stroke, in the pin's 24-unit path space. Exported for the map's marker renderer. */
export const GDS_PIN_APPROXIMATE_DASH = '3 2.5';

/** Solved pin-head centring offset. Exported so documentation reads it directly, not retyped. */
export const GDS_PIN_HEAD_CENTER_OFFSET = 'translateY(-4.1667%)';
const PIN_HEAD_CENTER_OFFSET = GDS_PIN_HEAD_CENTER_OFFSET;

/** Icon scale bound: widest shipped glyphs (e.g. IconMasksTheater, IconBike) overflow the pin's circle above ~0.48. */
export const GDS_PIN_ICON_SCALE = 0.46;
const ICON_SCALE = GDS_PIN_ICON_SCALE;

/**
 * Emoji scale, derived from `GDS_PIN_ICON_SCALE` rather than set independently, so both move
 * together. 0.9 factor: a Tabler glyph paints ~0.83 of its box, an emoji paints nearly its
 * whole em, so equal scale would render the emoji visibly larger.
 */
export const GDS_PIN_EMOJI_SCALE = GDS_PIN_ICON_SCALE * 0.9;

/** Fixed dark-neutral fill for the emoji-mode disc, same value as `GdsBadge`'s emoji coin. Not theme-derived. */
const EMOJI_DISC_FILL = 'var(--mantine-color-dark-7, #1f2937)';

/**
 * Category-colored map-pin marker: pin outline + centered icon in one `accent` color.
 *
 * `emoji`/`iconStyle` add a third composition alongside outline/filled: ring stays `accent`,
 * pin fills with a fixed dark-neutral disc, emoji centers on it, ignoring `filled`/`fillOpacity`.
 *
 * @example
 * ```tsx
 * <GdsMapPinBadge accent="ocean" icon="Location" label="Community pool" />
 * <GdsMapPinBadge accent="forest" icon={<IconBallFootball />} label="Riverside Field — soccer" filled />
 * <GdsMapPinBadge accent="forest" icon="Habit" label="Trailhead" filled fillOpacity={0.85} />
 * <GdsMapPinBadge accent="forest" shade="deeper" icon={<IconBallBasketball />} label="Rec Center — basketball" filled />
 * <GdsMapPinBadge accent="terracotta" icon={<IconBallBasketball />} emoji="🏀" label="Pivot Point Basketball" />
 * ```
 */
export function GdsMapPinBadge({
  accent,
  icon,
  label,
  filled = false,
  fillOpacity = 1,
  shade = 'base',
  size = 40,
  emoji,
  iconStyle,
  state = 'idle',
}: GdsMapPinBadgeProps) {
  // Token reference with axis-derived fallback, never hand-typed (would drift from the axis).
  const accentColor = `var(--gds-accent-${accent}-${shade}, ${gdsResolvedAccentFallback[`--gds-accent-${accent}-${shade}`]})`;
  // Hovered darkens the stroke only; fill and icon keep accentColor untouched.
  const hoverStrokeShade = DEEPER_SHADE[shade];
  const hoverStrokeColor = `var(--gds-accent-${accent}-${hoverStrokeShade}, ${gdsResolvedAccentFallback[`--gds-accent-${accent}-${hoverStrokeShade}`]})`;
  const inverseColor = 'var(--gds-text-on-inverse, var(--mantine-color-white))';
  const resolvedIconStyle = useGdsBadgeIconStyle(iconStyle);
  // A marker with no emoji keeps its Tabler icon even in emoji mode.
  const useEmoji = resolvedIconStyle === 'emoji' && Boolean(emoji);

  if (useEmoji && filled) {
    gdsDevWarnOnce(
      'GdsMapPinBadge:emoji-with-filled',
      'GdsMapPinBadge received both an active `emoji` glyph and `filled` — emoji mode always fills the pin with its own fixed dark-neutral disc, so `filled`/`fillOpacity` have no effect while emoji is active.',
    );
  }

  // Filled mode: icon uses inverse color to contrast the pin's fill. Outline mode: both share accentColor.
  const iconColor = filled ? inverseColor : accentColor;

  // Externally-sourced icons get their stroke forced to match the pin, overriding whatever the consumer passed.
  const iconElement = isIconKey(icon)
    ? <GdsIcon icon={icon} size="100%" tone="default" />
    : isValidElement<{ stroke?: number }>(icon)
      ? cloneElement(icon, { stroke: 1.75 })
      : icon;

  const pinFill = useEmoji ? EMOJI_DISC_FILL : filled ? accentColor : 'none';
  const pinFillOpacity = useEmoji ? 1 : filled ? fillOpacity : undefined;
  const numericSize = typeof size === 'number' ? size : undefined;

  // State resolves to silhouette properties only — never to the fill or the icon color.
  const pinStroke = state === 'hovered' || state === 'selected' ? GDS_PIN_EMPHASIS_STROKE : 1.75;
  const pinStrokeColor = state === 'hovered' ? hoverStrokeColor
    : state === 'approximate' ? EMOJI_DISC_FILL
    : accentColor;
  const pinDash = state === 'approximate' ? GDS_PIN_APPROXIMATE_DASH : undefined;
  // Scale origin is the tail tip so the anchored coordinate doesn't drift.
  const stackStyle = state === 'selected'
    ? { transform: `scale(${GDS_PIN_SELECTED_SCALE})`, transformOrigin: '50% 100%' }
    : undefined;

  return (
    <GdsBadgeStack size={size} label={label} style={stackStyle}>
      <GdsBadgeStackLayer>
        <GdsBadgeShapePin size="100%" stroke={pinStroke} color={pinStrokeColor} fill={pinFill} fillOpacity={pinFillOpacity} strokeDasharray={pinDash} />
      </GdsBadgeStackLayer>
      {/* scale included directly in the transform string: style.transform overrides the scale prop's CSS class. */}
      {useEmoji ? (
        <GdsBadgeStackLayer
          style={{
            transform: PIN_HEAD_CENTER_OFFSET,
            fontSize: numericSize ? `${numericSize * GDS_PIN_EMOJI_SCALE}px` : `${GDS_PIN_EMOJI_SCALE * 100}%`,
            lineHeight: 1,
          }}
        >
          <span aria-hidden="true">{emoji}</span>
        </GdsBadgeStackLayer>
      ) : (
        <GdsBadgeStackLayer style={{ transform: `${PIN_HEAD_CENTER_OFFSET} scale(${ICON_SCALE})`, color: iconColor }}>
          {iconElement}
        </GdsBadgeStackLayer>
      )}
    </GdsBadgeStack>
  );
}
