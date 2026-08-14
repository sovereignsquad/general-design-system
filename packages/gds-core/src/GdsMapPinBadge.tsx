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
 * GdsMapPinBadge (issue #501): a category-colored map-pin marker with a
 * centered icon, correct by construction. Ships because consumers repeatedly
 * hand-composed `GdsBadgeShapePin` + an externally-sourced icon (categories
 * like sports/hobbies/interests have no `GdsIcons` equivalent, so external
 * sourcing is the sanctioned path) and got the centering, stroke weight, and
 * accessible label wrong every time — there was a set of constants to match,
 * not a component to use. This locks those constants in.
 *
 * **Exactly two layers: the pin shape, and the icon. No ring/capsule.** An
 * earlier revision of this component added a ring capsule behind the icon to
 * guarantee contrast in filled mode. That was the wrong fix: in filled mode
 * the opaque ring disc ate most of the icon's own size; in outline mode
 * (ring drawn unfilled) it added a second visible circle with no contrast
 * benefit at all. The actual defect it was covering for — the icon
 * disappearing into a same-color fill — is fixed directly instead: the icon
 * always renders in a color that contrasts with the pin's fill (see
 * `iconColor` below), never the ring's former job of providing that
 * contrast via a background disc. With the ring gone, the icon is sized to
 * `0.46` of the stack box (up from `0.42`) so it fills more of the head than
 * before — but not the ring's old `0.62` footprint: the pin head is a
 * *circle*, and wide-content icons (a soccer ball is round and forgiving,
 * but `IconMasksTheater`'s two side-by-side masks or `IconBike`'s two
 * separated wheels are not) render past that circle's own boundary above
 * roughly `0.48`, verified against the widest icons actually shipped here,
 * not just centered ones.
 *
 * - **Centering: `translateY(-4.1667%)`, not eyeballed.** `GdsBadgeShapePin`'s
 *   head is a true circle (its path is an SVG arc of radius 8), and that
 *   arc's own center — solved with the standard SVG endpoint-to-center arc
 *   formula, not approximated — sits at `(12, 11)` in the pin's 24-unit path
 *   space, one unit above the path box's own center `(12, 12)`. `-1/24 =
 *   -4.1667%` is the exact, derived offset — the rule is "center on the
 *   pin's own circle," not a value tuned until it looked right.
 * - **Matching `stroke={1.75}`** across both the pin and the icon.
 * - **The icon is never the same color as the pin's fill.** Outline mode
 *   (default): pin and icon both render in the `accent` color — there is no
 *   fill to collide with, so a single shared color reads as one mark.
 *   Filled mode: the pin fills solid `accent` (optionally at `fillOpacity`
 *   below full), and the icon switches to an inverse (white-on-dark)
 *   color — never `accent` — so it stays legible against its own
 *   background at any fill opacity. `fillOpacity` only ever touches the
 *   pin's fill; the icon layer always renders fully opaque.
 * - **`shade` differentiates within one accent, darker-only** (issue #502).
 *   `accent` alone is coarse — 10 slots for top-level categories. When
 *   several related sub-categories (e.g. different sports) should read as
 *   one family, `shade: 'deep' | 'deeper' | 'deepest'` darkens `accent` by
 *   one of three precomputed, WCAG-verified steps (see
 *   {@link GdsBadgeAccentShade}) instead of spending a second accent on
 *   each one. Lightening isn't offered: it silently breaks the filled-mode
 *   icon's white-on-`accent` contrast guarantee for several accents (`teal`
 *   fails at only +4 lightness) — darkening has headroom for all 10.
 *
 * Note the pin's tail hides more than a third of that circle below the arc's
 * chord, so the visible dome's own midpoint sits above this point — the
 * circle's true center is not the same thing as "the middle of what's
 * visibly rendered." This component centers on the circle itself, per its
 * own governing rule; centering on the visible dome instead is a distinct,
 * deliberate alternative, not an error in this one.
 */

/** Props for {@link GdsMapPinBadge}. */
export interface GdsMapPinBadgeProps {
  /** Curated accent driving the pin/icon color. Fixed sRGB, independent of theme. */
  accent: GdsBadgeAccentName;
  /** A canonical `GdsIcons` key, or any externally-sourced icon element (outline style, matching stroke recommended). */
  icon: GdsIconKey | ReactNode;
  /**
   * Accessible name for the marker (e.g. "Riverside Field — soccer"). Always
   * consumer-supplied — never derive this from an icon library's own import
   * or display name (e.g. Tabler's `IconBallFootball` displays as
   * `"BallFootball"`, not a real category label).
   */
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
   * Darkens `accent` by one of three fixed, contrast-verified steps —
   * `'deep' | 'deeper' | 'deepest'` — so several related sub-categories
   * (e.g. different sports) can read as one accent family while staying
   * individually distinguishable, without spending a second accent slot on
   * each one. Defaults to `'base'` (the plain `accent` color, unchanged).
   * Darker-only: see {@link GdsBadgeAccentShade} for why lightening isn't
   * offered. `shade` combines with `filled`/`fillOpacity` normally — the
   * shaded color is just what `accent` resolves to underneath.
   */
  shade?: GdsBadgeAccentShade;
  /** Marker size (width = height). Defaults to `40`. */
  size?: number | string;
  /**
   * Emoji glyph rendered instead of `icon` when the effective badge glyph
   * mode is `'emoji'` (issue #525) — see `iconStyle` and `GdsProvider`'s
   * `defaultBadgeIconStyle`. Optional: a marker with no `emoji` simply
   * keeps rendering its Tabler `icon` even in emoji mode. In emoji mode the
   * pin fills with a fixed dark-neutral disc (never the accent color, and
   * never governed by `filled`/`fillOpacity` — both are ignored, with a
   * dev-mode warning, since emoji legibility needs a fixed neutral behind
   * it rather than an arbitrary accent) while the ring/silhouette keeps
   * `accent`, matching the client-provided reference composition.
   */
  emoji?: string;
  /**
   * Per-instance override for the ambient badge glyph mode (issue #525).
   * Defaults to whatever `GdsProvider`'s `defaultBadgeIconStyle` resolves
   * to (itself defaulting to `'tabler'`, today's only behavior).
   */
  iconStyle?: GdsBadgeIconStyle;
  /**
   * Interaction/confidence state of the marker (issue #545). The governing rule, from the
   * source spec and enforced by test: **the fill belongs to the activity — state is carried by
   * silhouette and scale**, so no state ever repaints the category's own hue.
   *
   * - `'idle'` (default): exactly today's rendering.
   * - `'hovered'`: the pin's stroke steps up to `2.25` and darkens ONE step down the same
   *   accent's own shade ladder (`base → deep → deeper → deepest`, saturating at `deepest`).
   *   The source spec's fixed navy hover (`#245A8C`) was rejected as brand-hardcoded: a
   *   cross-theme primitive darkens the accent it already has — same family, existing
   *   WCAG-verified steps, no new token to document and govern.
   * - `'selected'`: the whole marker scales up one step (`1.15`) around the TAIL TIP
   *   (`transform-origin: 50% 100%`), so the geographic point the pin anchors does not move,
   *   with the same `2.25` stroke. The source spec's `#F5793B` selected fill was rejected for
   *   violating the spec's own stated principle — a repainted fill makes "selected" read as a
   *   different category everywhere the accent means something.
   * - `'approximate'`: the stroke goes DASHED in the fixed dark-neutral (the same neutral the
   *   emoji disc uses), replacing the solid accent stroke per the spec — location uncertainty
   *   is a property of the silhouette. The icon keeps the accent, so the category stays
   *   readable; a `filled` pin keeps its accent fill for the same reason.
   *
   * `saved` is NOT a state here: a pin can be saved while hovered or selected, and saving is a
   * user action with its own governed control — compose
   * `<GdsSavedIndicator mode="corner" anchor={<GdsMapPinBadge …/>} />`, which issue #546 built
   * for exactly this.
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

/**
 * Stroke weight for the emphasised states, from the source spec's `2.25`. Idle keeps `1.75` —
 * the constant the whole component exists to hold steady.
 */
const EMPHASIS_STROKE = 2.25;

/** Selected-state scale step. Applied around the tail tip so the anchored map point holds still. */
export const GDS_PIN_SELECTED_SCALE = 1.15;

/**
 * Dash pattern for the approximate-location stroke, in the pin path's own 24-unit space —
 * sized against the head's radius-8 arc so the dashes read as segments rather than dots.
 */
const APPROXIMATE_DASH = '3 2.5';

/** The pin head circle's own center, solved from its path's arc geometry — see the module docs. */
/**
 * The solved centring offset, exported so documentation can SURFACE it rather than retype it.
 *
 * Issue 571. A copied constant drifts the first time the source changes — which is the exact
 * failure the pin component exists to prevent, reappearing in its own documentation.
 */
export const GDS_PIN_HEAD_CENTER_OFFSET = 'translateY(-4.1667%)';
const PIN_HEAD_CENTER_OFFSET = GDS_PIN_HEAD_CENTER_OFFSET;

/**
 * Icon fills the pin head directly — there is no ring capsule to share the
 * space with. `0.46`, not the `0.62` the removed ring capsule used to
 * occupy: the pin head is a *circle*, and wide-content icons (e.g.
 * `IconMasksTheater`, `IconBike`, whose glyphs run close to their own
 * viewBox edges) render past that circle's boundary above `~0.48`, verified
 * by overlaying the pin head's own solved-center circle on the rendered
 * icon and checking the widest icons in practice, not just centered ones.
 */
/**
 * Icon scale bound, exported for the same reason as the centring offset.
 *
 * Bounded empirically: the widest shipped glyphs — `IconMasksTheater`'s side-by-side masks and
 * `IconBike`'s separated wheels — render past the solved circle above roughly `0.48`.
 */
export const GDS_PIN_ICON_SCALE = 0.46;
const ICON_SCALE = GDS_PIN_ICON_SCALE;

/**
 * Emoji scale bound, reported 2026-08-14: the emoji overflowed the pin head, leaving barely any
 * of the dark-neutral disc visible and touching the accent ring — so the composition the docs
 * describe ("the pin fills with a fixed dark-neutral disc, and the emoji centres on it") was not
 * what the page showed.
 *
 * It was a bare `0.5`, set independently of the icon bound beside it, which is how the two drifted.
 * Derived from `GDS_PIN_ICON_SCALE` instead, so tightening the head can only move both together.
 *
 * The factor is not cosmetic. A Tabler glyph sits inside a 24px viewBox with ~2px of padding, so
 * it paints roughly 0.83 of the box it is scaled to. An emoji paints nearly its whole em. Setting
 * both to the same number therefore renders the emoji visibly larger; `0.9` brings the painted
 * areas to about the same width, which is what makes the disc read as a disc.
 */
export const GDS_PIN_EMOJI_SCALE = GDS_PIN_ICON_SCALE * 0.9;

/**
 * Fixed dark-neutral fill for the emoji-mode pin disc (issue #525) — the
 * same value `GdsBadge`'s own emoji coin and `toneColors.neutral` (in
 * `GdsBadge.tsx`) already use. Fixed, not theme- or brand-specific, so
 * emoji legibility doesn't depend on which of the 25 presets or 10 accents
 * is active — the same reasoning `GdsBadge`'s emoji coin documents.
 */
const EMOJI_DISC_FILL = 'var(--mantine-color-dark-7, #1f2937)';

/**
 * Category-colored map-pin marker: a pin outline and a centered icon in one
 * curated `accent` color, exactly two layers. See the module docs for why
 * this exists instead of hand-composing `GdsBadgeShapePin` + an icon, and
 * why there is no ring/capsule option.
 *
 * `emoji`/`iconStyle` (issue #525) add a third pin composition alongside
 * outline/filled: the ring stays `accent`, but the pin fills with a fixed
 * dark-neutral disc (`EMOJI_DISC_FILL`) and the emoji renders centered on
 * it, ignoring `filled`/`fillOpacity` — modeled directly on a client-
 * provided reference (a sports-activity map using this component).
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
  // Issue 594: reference the token so a pin follows the active theme, with the axis-derived
  // value as the fallback. The fallback is computed from the same source, never typed here —
  // a hand-written fallback is a second definition that drifts the moment the axis changes.
  const accentColor = `var(--gds-accent-${accent}-${shade}, ${gdsResolvedAccentFallback[`--gds-accent-${accent}-${shade}`]})`;
  // Hovered darkens the STROKE one step down the same accent's ladder — the fill and icon keep
  // `accentColor` untouched, which is what keeps the category hue meaning one thing (issue 545).
  const hoverStrokeShade = DEEPER_SHADE[shade];
  const hoverStrokeColor = `var(--gds-accent-${accent}-${hoverStrokeShade}, ${gdsResolvedAccentFallback[`--gds-accent-${accent}-${hoverStrokeShade}`]})`;
  const inverseColor = 'var(--gds-text-on-inverse, var(--mantine-color-white))';
  const resolvedIconStyle = useGdsBadgeIconStyle(iconStyle);
  // The failsafe (issue #525): a marker with no `emoji` keeps its Tabler
  // icon even when the ambient/overridden mode is `'emoji'`.
  const useEmoji = resolvedIconStyle === 'emoji' && Boolean(emoji);

  if (useEmoji && filled) {
    gdsDevWarnOnce(
      'GdsMapPinBadge:emoji-with-filled',
      'GdsMapPinBadge received both an active `emoji` glyph and `filled` — emoji mode always fills the pin with its own fixed dark-neutral disc, so `filled`/`fillOpacity` have no effect while emoji is active.',
    );
  }

  // Filled mode: the icon must contrast with the pin's own fill, so it
  // switches to the inverse color — it never reuses `accentColor` once the
  // pin behind it is that same color. Outline mode: there is no fill to
  // collide with, so pin and icon share the one accent color. Emoji mode
  // doesn't use this at all — the emoji glyph carries its own color.
  const iconColor = filled ? inverseColor : accentColor;

  // Externally-sourced icons (not a GdsIconKey) get their stroke forced to
  // match the pin, regardless of what the consumer's element passed — this
  // is the exact mismatch that kept recurring by hand.
  const iconElement = isIconKey(icon)
    ? <GdsIcon icon={icon} size="100%" tone="default" />
    : isValidElement<{ stroke?: number }>(icon)
      ? cloneElement(icon, { stroke: 1.75 })
      : icon;

  const pinFill = useEmoji ? EMOJI_DISC_FILL : filled ? accentColor : 'none';
  const pinFillOpacity = useEmoji ? 1 : filled ? fillOpacity : undefined;
  const numericSize = typeof size === 'number' ? size : undefined;

  // State resolves to silhouette properties only — never to the fill or the icon color.
  const pinStroke = state === 'hovered' || state === 'selected' ? EMPHASIS_STROKE : 1.75;
  const pinStrokeColor = state === 'hovered' ? hoverStrokeColor
    : state === 'approximate' ? EMOJI_DISC_FILL
    : accentColor;
  const pinDash = state === 'approximate' ? APPROXIMATE_DASH : undefined;
  // Scaling around the tail tip keeps the anchored map coordinate exactly where it was — a
  // center-origin scale would drift the point the pin exists to mark.
  const stackStyle = state === 'selected'
    ? { transform: `scale(${GDS_PIN_SELECTED_SCALE})`, transformOrigin: '50% 100%' }
    : undefined;

  return (
    <GdsBadgeStack size={size} label={label} style={stackStyle}>
      <GdsBadgeStackLayer>
        <GdsBadgeShapePin size="100%" stroke={pinStroke} color={pinStrokeColor} fill={pinFill} fillOpacity={pinFillOpacity} strokeDasharray={pinDash} />
      </GdsBadgeStackLayer>
      {/*
        A GdsBadgeStackLayer's `scale` prop applies via a CSS class reading
        --gds-badge-stack-layer-scale; supplying our own `style.transform`
        (needed for the vertical offset) takes cascade priority over that
        class rule and would silently drop the scale, so it's included
        directly in this transform string instead of left to the `scale`
        prop to add on top.
      */}
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
