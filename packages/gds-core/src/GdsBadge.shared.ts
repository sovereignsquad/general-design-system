import { GDS_ACCENT_NAMES, GDS_ACCENT_SHADES, resolveGdsAccentTokens } from '@sovereignsquad/gds-theme';

/**
 * Curated non-semantic accent palette for categorization (10 names, per the
 * closed-union precedent of 9 of 11 surveyed design systems). Fixed sRGB
 * values, all verified ≥ 4.5:1 against their white foreground via
 * `pickGdsAutoForeground` — the palette is theme-independent so category
 * colors stay stable across every preset.
 */
export type GdsBadgeAccentName =
  | 'plum'
  | 'indigo'
  | 'ocean'
  | 'teal'
  | 'forest'
  | 'bronze'
  | 'terracotta'
  | 'magenta'
  | 'slate'
  | 'grape';

/**
 * The accent palette values. Every entry's white foreground is verified
 * ≥ 4.5:1 (WCAG AA normal) in badge tests via `pickGdsAutoForeground` — do
 * not edit a hex without the test confirming the pair still passes.
 */
/**
 * A within-accent differentiation step for {@link GdsMapPinBadge}'s `shade` prop (issue 502):
 * related sub-categories that should read as "the same accent family" but stay individually
 * distinguishable, without spending a second accent slot on each.
 *
 * **Darker-only, on purpose.** Lightening any accent — even slightly — drops some below the
 * 4.5:1 bar the palette guarantees (`teal` fails first, at only +4 lightness). The accent axis
 * enforces that direction now; this type is the vocabulary for it.
 */
export type GdsBadgeAccentShade = 'base' | 'deep' | 'deeper' | 'deepest';

/**
 * Resolved default accent values, DERIVED from the accent axis (issue 594).
 *
 * These were two hand-authored tables — 10 base colours and 40 shades — living here as
 * "fixed sRGB, independent of theme". They are now computed from
 * `GDS_DEFAULT_ACCENT_AXIS`'s ten base colours by the axis's own derivation, so there is one
 * definition of what `plum` means and it is not in this file.
 *
 * They exist at all only as FALLBACKS for `var(--gds-accent-*)` and for non-DOM rendering,
 * where CSS custom properties do not resolve. Every value here comes from the axis; nothing
 * is typed by hand.
 */
export const gdsResolvedAccentTokens = resolveGdsAccentTokens(undefined, 'light');

/**
 * @deprecated Derived from the accent axis; read `var(--gds-accent-<name>-base)` instead so
 * the value follows the active theme. Removed in 8.0.0.
 */
export const gdsBadgeAccentColors: Record<GdsBadgeAccentName, string> = Object.fromEntries(
  GDS_ACCENT_NAMES.map((name) => [name, gdsResolvedAccentTokens[`--gds-accent-${name}-base`]]),
) as Record<GdsBadgeAccentName, string>;

/**
 * @deprecated Derived from the accent axis; read `var(--gds-accent-<name>-<shade>)` instead.
 * Removed in 8.0.0.
 */
export const gdsBadgeAccentShades: Record<GdsBadgeAccentName, Record<GdsBadgeAccentShade, string>> = Object.fromEntries(
  GDS_ACCENT_NAMES.map((name) => [
    name,
    Object.fromEntries(GDS_ACCENT_SHADES.map((shade) => [shade, gdsResolvedAccentTokens[`--gds-accent-${name}-${shade}`]])),
  ]),
) as Record<GdsBadgeAccentName, Record<GdsBadgeAccentShade, string>>;
