import { cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import { GdsBadgeShapePin } from './badge-shapes';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import { gdsBadgeAccentShades } from './GdsBadge';
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
}

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

/** The pin head circle's own center, solved from its path's arc geometry — see the module docs. */
const PIN_HEAD_CENTER_OFFSET = 'translateY(-4.1667%)';

/**
 * Icon fills the pin head directly — there is no ring capsule to share the
 * space with. `0.46`, not the `0.62` the removed ring capsule used to
 * occupy: the pin head is a *circle*, and wide-content icons (e.g.
 * `IconMasksTheater`, `IconBike`, whose glyphs run close to their own
 * viewBox edges) render past that circle's boundary above `~0.48`, verified
 * by overlaying the pin head's own solved-center circle on the rendered
 * icon and checking the widest icons in practice, not just centered ones.
 */
const ICON_SCALE = 0.46;

/**
 * Category-colored map-pin marker: a pin outline and a centered icon in one
 * curated `accent` color, exactly two layers. See the module docs for why
 * this exists instead of hand-composing `GdsBadgeShapePin` + an icon, and
 * why there is no ring/capsule option.
 *
 * @example
 * ```tsx
 * <GdsMapPinBadge accent="ocean" icon="Location" label="Community pool" />
 * <GdsMapPinBadge accent="forest" icon={<IconBallFootball />} label="Riverside Field — soccer" filled />
 * <GdsMapPinBadge accent="forest" icon="Habit" label="Trailhead" filled fillOpacity={0.85} />
 * <GdsMapPinBadge accent="forest" shade="deeper" icon={<IconBallBasketball />} label="Rec Center — basketball" filled />
 * ```
 */
export function GdsMapPinBadge({ accent, icon, label, filled = false, fillOpacity = 1, shade = 'base', size = 40 }: GdsMapPinBadgeProps) {
  const accentColor = gdsBadgeAccentShades[accent][shade];
  const inverseColor = 'var(--gds-text-on-inverse, var(--mantine-color-white))';
  // Filled mode: the icon must contrast with the pin's own fill, so it
  // switches to the inverse color — it never reuses `accentColor` once the
  // pin behind it is that same color. Outline mode: there is no fill to
  // collide with, so pin and icon share the one accent color.
  const iconColor = filled ? inverseColor : accentColor;

  // Externally-sourced icons (not a GdsIconKey) get their stroke forced to
  // match the pin, regardless of what the consumer's element passed — this
  // is the exact mismatch that kept recurring by hand.
  const iconElement = isIconKey(icon)
    ? <GdsIcon icon={icon} size="100%" tone="default" />
    : isValidElement<{ stroke?: number }>(icon)
      ? cloneElement(icon, { stroke: 1.75 })
      : icon;

  return (
    <GdsBadgeStack size={size} label={label}>
      <GdsBadgeStackLayer>
        <GdsBadgeShapePin
          size="100%"
          stroke={1.75}
          color={accentColor}
          fill={filled ? accentColor : 'none'}
          fillOpacity={filled ? fillOpacity : undefined}
        />
      </GdsBadgeStackLayer>
      {/*
        A GdsBadgeStackLayer's `scale` prop applies via a CSS class reading
        --gds-badge-stack-layer-scale; supplying our own `style.transform`
        (needed for the vertical offset) takes cascade priority over that
        class rule and would silently drop the scale, so it's included
        directly in this transform string instead of left to the `scale`
        prop to add on top.
      */}
      <GdsBadgeStackLayer style={{ transform: `${PIN_HEAD_CENTER_OFFSET} scale(${ICON_SCALE})`, color: iconColor }}>
        {iconElement}
      </GdsBadgeStackLayer>
    </GdsBadgeStack>
  );
}
