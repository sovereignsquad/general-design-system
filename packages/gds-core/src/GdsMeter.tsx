import { Progress } from '@mantine/core';
import type { MantineColor, MantineRadius, MantineSize } from '@mantine/core';

/**
 * A static measurement, not an operation in flight — `role="meter"`. Mantine's top-level
 * `Progress` convenience component hardcodes `role="progressbar"` on the element that
 * actually carries ARIA semantics and does not expose a way to override it; this builds on
 * Mantine's lower-level `Progress.Root`/`Progress.Section` compound API instead, with
 * `withAria={false}` on the section so this component supplies the ARIA block itself.
 */

/** Props for {@link GdsMeter}. */
export interface GdsMeterProps {
  /** Current value, within `[min, max]`. */
  value: number;
  /** Defaults to `0`. */
  min?: number;
  /** Defaults to `100`. */
  max?: number;
  /** Accessible name for the meter. */
  label: string;
  /** Announced value text. Defaults to `"{value} of {max}"`. */
  valueText?: string;
  /** Track height. Defaults to `'md'`. */
  size?: MantineSize | number;
  /** Key of `theme.radius` or any valid CSS value. Defaults to `'xl'`. */
  radius?: MantineRadius;
  /** Key of `theme.colors` or any valid CSS color. Defaults to `theme.primaryColor`. */
  color?: MantineColor;
  className?: string;
}

/**
 * Static score/measurement bar with real `role="meter"` semantics — not a progress
 * indicator for an operation in flight (use `ProgressCard`/`Progress` for that).
 *
 * @example
 * ```tsx
 * <GdsMeter value={72} max={100} label="Fit score" />
 * ```
 */
export function GdsMeter({ value, min = 0, max = 100, label, valueText, size = 'md', radius = 'xl', color, className }: GdsMeterProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <Progress.Root size={size} radius={radius} className={className}>
      <Progress.Section
        value={Math.min(100, Math.max(0, percent))}
        color={color}
        withAria={false}
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText ?? `${value} of ${max}`}
      />
    </Progress.Root>
  );
}
