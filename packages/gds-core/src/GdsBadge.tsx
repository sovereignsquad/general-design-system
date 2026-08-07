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
