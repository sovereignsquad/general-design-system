import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';
import { GdsBadgeShapes } from './badge-shapes';
import type { GdsBadgeShapeName } from './badge-shapes';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';

/**
 * GdsBadge (issue #489, part of epic #484): the unified, always-theme-aware
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

const toneColors: Record<GdsBadgeTone, BadgeColors> = {
  success: { bg: 'var(--gds-state-success, #157a52)', fg: 'var(--gds-text-on-inverse, #ffffff)' },
  warning: { bg: 'var(--gds-state-warning-dark, #7a5b00)', fg: 'var(--gds-text-on-inverse, #ffffff)' },
  danger: { bg: 'var(--gds-state-danger-dark, #8c2f39)', fg: 'var(--gds-text-on-inverse, #ffffff)' },
  info: { bg: 'var(--gds-state-info-dark, #1f4a8a)', fg: 'var(--gds-text-on-inverse, #ffffff)' },
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
export const gdsBadgeAccentColors: Record<GdsBadgeAccentName, string> = {
  plum: '#7c3a6e',
  indigo: '#3f4d9e',
  ocean: '#1f6e8c',
  teal: '#0f766e',
  forest: '#2f6b3a',
  bronze: '#8a5a00',
  terracotta: '#b04a2f',
  magenta: '#a52a6c',
  slate: '#52606d',
  grape: '#5b3374',
};

/**
 * A within-accent differentiation step for {@link GdsMapPinBadge}'s `shade`
 * prop (issue #502): related sub-categories that should read as "the same
 * accent family" (e.g. several sports) but still be individually
 * distinguishable, without spending a second accent slot on each one.
 *
 * **Darker-only, on purpose.** Sweeping lightness deltas across all 10
 * accents against the white icon color `GdsMapPinBadge` uses in filled mode
 * shows that lightening any accent — even slightly — drops some of them
 * below the 4.5:1 WCAG AA bar the base palette already guarantees (`teal`
 * fails first, at only +4 lightness; `ocean`/`bronze`/`forest`/`terracotta`
 * follow shortly after). Darkening has generous headroom for all 10, so
 * that's the only direction this axis offers.
 */
export type GdsBadgeAccentShade = 'base' | 'deep' | 'deeper' | 'deepest';

/**
 * Precomputed, contrast-verified shade steps for every accent (issue #502).
 * Each accent's four levels are spaced by interpolating *proportionally*
 * from that accent's own base lightness down to a shared lightness floor
 * (12%) — not a fixed absolute lightness delta. A fixed delta reaches the
 * floor at different levels for different accents (e.g. `teal`, which
 * starts darker than most), producing near-duplicate `deeper`/`deepest`
 * colors for exactly those accents; proportional spacing keeps all four
 * steps visually distinct for every accent. Every one of the 40 resulting
 * colors is verified ≥ 4.5:1 against white in badge tests (the same bar
 * `gdsBadgeAccentColors` itself is held to) — do not edit a hex without the
 * test confirming the pair still passes.
 */
export const gdsBadgeAccentShades: Record<GdsBadgeAccentName, Record<GdsBadgeAccentShade, string>> = {
  plum: { base: '#7c3a6e', deep: '#612d56', deeper: '#45203d', deepest: '#2a1425' },
  indigo: { base: '#3f4d9e', deep: '#303a78', deeper: '#212852', deepest: '#11152c' },
  ocean: { base: '#1f6e8c', deep: '#18566e', deeper: '#123f50', deepest: '#0b2732' },
  teal: { base: '#0f766e', deep: '#0c615a', deeper: '#0a4c46', deepest: '#073633' },
  forest: { base: '#2f6b3a', deep: '#26562e', deeper: '#1c4023', deepest: '#132b17' },
  bronze: { base: '#8a5a00', deep: '#704900', deeper: '#573900', deepest: '#3d2800' },
  terracotta: { base: '#b04a2f', deep: '#853824', deeper: '#5b2618', deepest: '#30140d' },
  magenta: { base: '#a52a6c', deep: '#7e2053', deeper: '#581639', deepest: '#310c20' },
  slate: { base: '#52606d', deep: '#3f4a54', deeper: '#2d353c', deepest: '#1a1f23' },
  grape: { base: '#5b3374', deep: '#48285c', deeper: '#351d43', deepest: '#21132b' },
};

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
  const { label, icon, shape, tone, accent, style, ...rest } = props as GdsBadgeBaseProps & {
    tone?: GdsBadgeTone;
    accent?: GdsBadgeAccentName;
  };
  if (!label) {
    return null;
  }

  const colors: BadgeColors = accent
    ? { bg: gdsBadgeAccentColors[accent], fg: '#ffffff' }
    : toneColors[tone ?? 'neutral'];

  let leading: ReactNode = null;
  if (shape) {
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
