import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GDS_ACCENT_NAMES, GDS_ACCENT_SHADES, gdsDevWarnOnce, resolveGdsAccentTokens, useGdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import type { GdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import { GdsBadgeShapes } from './badge-shapes';
import type { GdsBadgeShapeName } from './badge-shapes';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';

/**
 * GdsBadge (issue 489, part of epic #484): the unified, always-theme-aware
 * static status/meaning label. Never interactive — removable tokens are
 * `GdsRemovableTag`'s job, counts are `GdsCountBadge`'s.
 *
 * Color is a closed two-axis union, never a free string: a semantic `tone`
 * mapped to the `--gds-state-*` role tokens every preset defines (WCAG-
 * validated per preset by the #485 derivation), or a curated non-semantic
 * `accent` name for categorization. The two axes are mutually exclusive at
 * the type level. Meaning always lives in the required `label`, never in
 * color alone (forced-colors flattens every badge to one pair).
 */

/** Semantic tone: maps to the `--gds-state-*` role tokens. */
export type GdsBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Curated non-semantic accent palette for categorization (10 names, per the
 * closed-union precedent of 9 of 11 surveyed design systems). Fixed sRGB
 * values, all verified ≥ 4.5:1 against their white foreground via
 * `pickGdsAutoForeground` — the palette is theme-independent so category
 * colors stay stable across all 25 presets.
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

interface BadgeColors {
  bg: string;
  fg: string;
  border?: string;
}

/**
 * Tone colours, as COMPUTED pairs (issue 595).
 *
 * This table previously paired a fixed white foreground with a variable background, and read
 * `-dark` for three tones while `success` read the light one. Measured: with white text,
 * `--gds-state-success` fails 4.5:1 in 9 of 25 presets in LIGHT mode (class-usa 4.10, sunset
 * 4.40). The inconsistency is why it survived — three tones were pinned dark and one was not.
 *
 * Both halves of each pair now come from the theme, derived against each other per preset and
 * per scheme, so the badge follows the scheme AND the contrast is guaranteed rather than
 * assumed. Same fix as issue 537's `--gds-text-on-support`.
 */
const toneColors: Record<GdsBadgeTone, BadgeColors> = {
  success: { bg: 'var(--gds-badge-solid-success)', fg: 'var(--gds-badge-solid-success-fg)' },
  warning: { bg: 'var(--gds-badge-solid-warning)', fg: 'var(--gds-badge-solid-warning-fg)' },
  danger: { bg: 'var(--gds-badge-solid-danger)', fg: 'var(--gds-badge-solid-danger-fg)' },
  info: { bg: 'var(--gds-badge-solid-info)', fg: 'var(--gds-badge-solid-info-fg)' },
  neutral: {
    bg: 'var(--gds-bg-card, var(--mantine-color-gray-1, #f1f3f5))',
    fg: 'var(--gds-text-primary, var(--mantine-color-dark-7, #1f2937))',
    border: '1px solid var(--gds-border-card, var(--mantine-color-gray-4, #ced4da))',
  },
};

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
const gdsResolvedAccentTokens = resolveGdsAccentTokens(undefined, 'light');

const accentToken = (accent: GdsBadgeAccentName, shade: GdsBadgeAccentShade = 'base') =>
  `var(--gds-accent-${accent}-${shade}, ${gdsResolvedAccentTokens[`--gds-accent-${accent}-${shade}`]})`;

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

interface GdsBadgeBaseProps extends Omit<BadgeProps, 'color' | 'children' | 'variant' | 'leftSection'> {
  /** Badge text — the meaning carrier. Required: color is never the only signal. */
  label: ReactNode;
  /** Canonical `GdsIcons` key rendered decoratively ahead of the label. */
  icon?: GdsIconKey;
  /**
   * Badge silhouette from the governed `GdsBadgeShapes` vocabulary, rendered
   * as a leading currentColor mark (with `icon` composed inside it when both
   * are given).
   */
  shape?: GdsBadgeShapeName;
  /**
   * Emoji glyph rendered instead of `icon` when the effective badge glyph
   * mode is `'emoji'` (issue 525) — see `iconStyle` and `GdsProvider`'s
   * `defaultBadgeIconStyle`. Optional: a badge with no `emoji` simply keeps
   * rendering its Tabler `icon` even in emoji mode — that fallback is the
   * point, not a gap to close. Renders on a fixed neutral disc (never
   * directly on the badge's own accent/tone color — emoji are OS-rendered
   * color glyphs whose color can't be forced via CSS the way a Tabler
   * `currentColor` icon can, so contrast against an arbitrary accent can't
   * be guaranteed the same way), and is always `aria-hidden` — the
   * required `label` carries meaning, exactly like `icon` today. Not
   * currently composable with `shape`: a badge given both renders the
   * emoji disc alone and ignores `shape`, with a dev-mode warning.
   */
  emoji?: string;
  /**
   * Per-instance override for the ambient badge glyph mode (issue 525).
   * Defaults to whatever `GdsProvider`'s `defaultBadgeIconStyle` resolves
   * to (itself defaulting to `'tabler'`, today's only behavior). Rarely
   * needed — most consumers set the mode once on `GdsProvider` and let
   * every badge follow it.
   */
  iconStyle?: GdsBadgeIconStyle;
}

/**
 * Emoji badge glyph (issue 525): centered on a fixed dark-neutral disc,
 * never directly on the badge's own accent/tone background. The disc uses
 * the same fixed neutral-dark value `toneColors.neutral` already uses for
 * its own foreground below (`var(--mantine-color-dark-7, #1f2937)`) — not a
 * theme- or brand-specific color — so it reads consistently against every
 * accent and every built-in preset, the same way the curated accent
 * palette itself stays fixed across presets.
 */
function GdsBadgeEmojiCoin({ emoji }: { emoji: string }) {
  return (
    <span
      data-gds-badge-emoji-coin=""
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.35em',
        height: '1.35em',
        borderRadius: '50%',
        background: 'var(--mantine-color-dark-7, #1f2937)',
        fontSize: '0.75em',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {emoji}
    </span>
  );
}

/**
 * Props for {@link GdsBadge}: the `tone` and `accent` axes are mutually
 * exclusive at the type level (à la Fluent's narrowed unions), so an invalid
 * combination fails to typecheck instead of shipping an ambiguous badge.
 */
export type GdsBadgeProps =
  | (GdsBadgeBaseProps & { tone?: GdsBadgeTone; accent?: never })
  | (GdsBadgeBaseProps & { accent: GdsBadgeAccentName; tone?: never });

/**
 * Static status/meaning label. `tone` renders theme-aware semantic color from
 * the `--gds-state-*` role tokens; `accent` renders a fixed categorization
 * color from the curated palette. Defaults to `tone="neutral"`. Renders
 * `null` when `label` is empty.
 *
 * @example
 * ```tsx
 * <GdsBadge tone="success" icon="Success" label="Published" />
 * <GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
 * ```
 */
export function GdsBadge(props: GdsBadgeProps) {
  const { label, icon, shape, tone, accent, emoji, iconStyle, style, ...rest } = props as GdsBadgeBaseProps & {
    tone?: GdsBadgeTone;
    accent?: GdsBadgeAccentName;
  };
  // Hooks must run before the `label` early return below, so this stays
  // unconditional even though its result is only used once we know we're
  // actually rendering.
  const resolvedIconStyle = useGdsBadgeIconStyle(iconStyle);
  if (!label) {
    return null;
  }

  const colors: BadgeColors = accent
    ? { bg: accentToken(accent), fg: `var(--gds-accent-${accent}-on, #ffffff)` }
    : toneColors[tone ?? 'neutral'];

  // The failsafe (issue 525): a badge with no `emoji` keeps its Tabler
  // icon even when the ambient/overridden mode is `'emoji'` — this is the
  // one branch that decides emoji-vs-Tabler for the whole component.
  const useEmoji = resolvedIconStyle === 'emoji' && Boolean(emoji);

  let leading: ReactNode = null;
  if (useEmoji) {
    if (shape) {
      gdsDevWarnOnce(
        'GdsBadge:emoji-with-shape',
        'GdsBadge received both `shape` and an active `emoji` glyph — shape composition is not supported in emoji mode yet, so `shape` is ignored and the emoji renders on its own disc instead.',
      );
    }
    leading = <GdsBadgeEmojiCoin emoji={emoji as string} />;
  } else if (shape) {
    const Shape = GdsBadgeShapes[shape];
    leading = (
      <GdsBadgeStack size="1.1em">
        <GdsBadgeStackLayer>
          <Shape size="100%" stroke={1.75} aria-hidden="true" />
        </GdsBadgeStackLayer>
        {icon ? (
          <GdsBadgeStackLayer
            scale={shape === 'pin' ? 0.42 : 0.55}
            // A GdsBadgeStackLayer's own scale applies via a CSS class rule
            // reading --gds-badge-stack-layer-scale; an inline `style.transform`
            // (needed here for the pin's vertical offset) takes cascade
            // priority over that class rule and would silently replace it, so
            // the scale must be included directly in this transform string
            // too, not left to the class rule to add on top.
            style={shape === 'pin' ? { transform: 'translateY(-4.1667%) scale(0.42)' } : undefined}
          >
            <GdsIcon icon={icon} size="100%" />
          </GdsBadgeStackLayer>
        ) : null}
      </GdsBadgeStack>
    );
  } else if (icon) {
    leading = <GdsIcon icon={icon} size="xs" />;
  }

  return (
    <Badge
      data-gds-badge=""
      data-gds-badge-fixed-tone="true"
      variant="filled"
      leftSection={leading}
      {...rest}
      style={{ backgroundColor: colors.bg, color: colors.fg, border: colors.border ?? 'none', ...style }}
    >
      {label}
    </Badge>
  );
}
