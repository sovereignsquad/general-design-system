import type { CSSProperties } from 'react';
import { Group, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsIcons } from './icons';

/**
 * Read-only display of a rating (item 11 / issue 642) — filled/half/empty star glyphs
 * plus an optional count, exposed as one accessible name stating the value rather than
 * announcing N separate star images. Never accepts input; use `GdsRatingScale` to collect
 * a rating from the user.
 */

/** Props for {@link GdsRatingDisplay}. */
export interface GdsRatingDisplayProps {
  /** Rating value; clamped to `0..max` and snapped to the nearest half. */
  value: number;
  /** Upper bound of the scale (glyph count). Defaults to `5`. */
  max?: number;
  /** Number of ratings/reviews behind the value; appended to the accessible name and shown after the glyphs when given. */
  count?: number;
  /** Overrides the computed accessible name. */
  label?: string;
  /** Star glyph size, passed to the underlying icon. Defaults to `'1rem'`. */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

const STAR_FILL = 'var(--gds-star, var(--gds-brand-accent-action, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))';
const STAR_EMPTY = 'var(--mantine-color-gray-4)';

function StarGlyph({ fraction, size }: { fraction: number; size: number | string }) {
  if (fraction <= 0) {
    return <GdsIcons.Star size={size} stroke={1.75} style={{ color: STAR_EMPTY }} />;
  }
  if (fraction >= 1) {
    return <GdsIcons.StarFilled size={size} stroke={1.75} style={{ color: STAR_FILL }} />;
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}>
      <GdsIcons.Star size={size} stroke={1.75} style={{ color: STAR_EMPTY }} />
      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${Math.round(fraction * 100)}%` }}>
        <GdsIcons.StarFilled size={size} stroke={1.75} style={{ color: STAR_FILL }} />
      </span>
    </span>
  );
}

/**
 * Read-only value + scale + optional count, rendered as filled/half/empty star glyphs
 * under one accessible name (e.g. "4.5 out of 5 stars, 128 ratings") — a screen reader
 * announces the value once, never one image per star. Not an input; use `GdsRatingScale`
 * to collect a rating.
 *
 * @example
 * ```tsx
 * <GdsRatingDisplay value={4.5} count={128} />
 * <GdsRatingDisplay value={3} max={5} label="3 out of 5 stars" />
 * ```
 */
export function GdsRatingDisplay({ value, max = 5, count, label, size = '1rem', className, style }: GdsRatingDisplayProps) {
  const { t } = useGdsTranslation();
  const clamped = Math.min(max, Math.max(0, value));
  const rounded = Math.round(clamped * 2) / 2;
  const valueText = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const accessibleLabel = label ?? (
    count != null
      ? t('gds.ratingDisplay.labelWithCount', '{value} out of {max} stars, {count} ratings')
          .replace('{value}', valueText)
          .replace('{max}', String(max))
          .replace('{count}', String(count))
      : t('gds.ratingDisplay.label', '{value} out of {max} stars')
          .replace('{value}', valueText)
          .replace('{max}', String(max))
  );

  return (
    <Group gap={4} wrap="nowrap" role="img" aria-label={accessibleLabel} className={className} style={style}>
      <Group gap={2} wrap="nowrap" aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
          <StarGlyph key={index} fraction={Math.min(1, Math.max(0, rounded - index))} size={size} />
        ))}
      </Group>
      {count != null ? (
        <Text size="sm" c="dimmed" aria-hidden="true">({count})</Text>
      ) : null}
    </Group>
  );
}
