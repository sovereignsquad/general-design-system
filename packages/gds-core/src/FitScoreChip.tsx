import { Badge, Tooltip } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';

/**
 * FitScoreChip (gap B5 / issue #319).
 *
 * Compact match-quality pill. Takes a `value` (0–100) and/or `label`, colors on
 * a deterministic sage -> terracotta band scale from brand tokens, and exposes
 * an accessible tooltip listing the matched dimensions. Meaning is always
 * conveyed by text (label + value), never color alone.
 */

/** One matched dimension listed in the chip's tooltip. */
export interface FitScoreDimension {
  label: string;
  /** Relative importance of this dimension, if scored. */
  weight?: number;
}

/** Props for {@link FitScoreChip}; extends Mantine `BadgeProps` minus `color`/`children`, which the chip controls. */
export interface FitScoreChipProps extends Omit<BadgeProps, 'color' | 'children'> {
  /** Match score 0–100; clamped and rounded before display. */
  value?: number;
  /** Overrides the derived band label (e.g. "Great fit"). */
  label?: string;
  /** Matched dimensions; when present, the chip gains a tooltip listing them. */
  dimensions?: FitScoreDimension[];
}

type ScoreBand = 'great' | 'good' | 'partial';

function bandForScore(value: number): ScoreBand {
  if (value >= 80) return 'great';
  if (value >= 50) return 'good';
  return 'partial';
}

const bandColor: Record<ScoreBand, string> = {
  great: 'var(--gds-state-success, var(--mantine-color-teal-6))',
  good: 'var(--gds-brand-accent, var(--mantine-color-orange-5))',
  partial: 'var(--gds-brand-accent-action, var(--mantine-color-orange-7))',
};

const bandLabel: Record<ScoreBand, string> = {
  great: 'Great fit',
  good: 'Good fit',
  partial: 'Partial fit',
};

/**
 * Compact match-quality pill. Pass a `value` (0–100) and/or `label`; it colors on
 * a deterministic great/good/partial band from brand tokens and, when
 * `dimensions` are supplied, exposes an accessible tooltip listing the matched
 * dimensions. Meaning is always conveyed by text (label + score), never color
 * alone. Renders `null` when given neither `value` nor `label`.
 */
export function FitScoreChip({ value, label, dimensions, size = 'md', ...props }: FitScoreChipProps) {
  if (value == null && !label) {
    return null;
  }

  const clamped = value == null ? undefined : Math.min(100, Math.max(0, Math.round(value)));
  const band = clamped == null ? 'good' : bandForScore(clamped);
  const text = label ?? bandLabel[band];
  const display = clamped == null ? text : `${text} · ${clamped}`;
  const accessibleLabel = clamped == null ? text : `${text}, score ${clamped} of 100`;
  const hasTooltip = Boolean(dimensions && dimensions.length > 0);

  const chip = (
    <Badge
      size={size}
      variant="filled"
      aria-label={accessibleLabel}
      tabIndex={hasTooltip ? 0 : undefined}
      style={{ backgroundColor: bandColor[band], color: 'var(--gds-text-on-inverse, var(--mantine-color-white))' }}
      {...props}
    >
      {display}
    </Badge>
  );

  if (dimensions && dimensions.length > 0) {
    const tooltipLabel = dimensions.map((dimension) => dimension.label).join(', ');
    return (
      <Tooltip label={`Matched: ${tooltipLabel}`} withArrow multiline events={{ hover: true, focus: true, touch: false }}>
        {chip}
      </Tooltip>
    );
  }

  return chip;
}
