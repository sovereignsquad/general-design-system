import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';

/** Semantic status meaning that maps to a fixed badge color. */
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Props for `StatusBadge`; extends Mantine `BadgeProps` but replaces `color` with `status`. */
export interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
  /** Semantic status that determines the badge color. */
  status: StatusVariant;
  /**
   * Renders the canonical status icon from the governed `GdsIcons` dictionary
   * (`Success`/`Warning`/`Danger`/`Info`) ahead of the label. `neutral` has no
   * canonical status icon and renders none. The icon is decorative — the label
   * text always carries the meaning.
   */
  withIcon?: boolean;
  children: ReactNode;
}

/** Semantic tone for a `LabelTag`, mapped to a fixed color. */
export type LabelTagTone = 'neutral' | 'info' | 'warning' | 'success';

/** Props for `LabelTag`; extends Mantine `BadgeProps` minus `color`/`children`. */
export interface LabelTagProps extends Omit<BadgeProps, 'color' | 'children'> {
  /** Semantic tone that determines the tag color; defaults to `neutral`. */
  tone?: LabelTagTone;
  label: ReactNode;
}

/** Props for `CountBadge`; extends Mantine `BadgeProps` minus `color`/`children`. */
export interface CountBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  value: number;
  /** Maximum shown before displaying `{cap}+`; defaults to 99. */
  cap?: number;
  /** Accessible label (`aria-label`) for the badge. */
  srLabel?: string;
}


const statusIconMap: Partial<Record<StatusVariant, GdsIconKey>> = {
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
};

/**
 * StatusBadge enforces strict semantic coloring.
 * Arbitrary hex colors are prohibited. With `withIcon`, the matching canonical
 * status icon from `GdsIcons` renders ahead of the label (inheriting the
 * badge's text color); `neutral` renders no icon.
 */
export function StatusBadge({ status, withIcon, children, ...props }: StatusBadgeProps) {
  const iconKey = withIcon ? statusIconMap[status] : undefined;
  return (
    <Badge
      data-gds-badge-fixed-tone="true"
      variant="filled"
      leftSection={iconKey ? <GdsIcon icon={iconKey} size="xs" /> : undefined}
      {...props}
      // Issue 595 / #534. This rendered Mantine's `variant="light"` — pastel text on a
      // low-alpha tint of the same hue — which measured 1.81:1 and 2.55:1 in dark mode. GDS
      // never controlled that pair, because it came from Mantine's variant rather than a GDS
      // token, and an rgba tint's contrast cannot be computed at all. The soft lane mixes the
      // state colour against a real surface and derives the foreground against the result.
      style={{
        background: `var(--gds-badge-soft-${status})`,
        color: `var(--gds-badge-soft-${status}-fg)`,
        ...(props.style as React.CSSProperties | undefined),
      }}
    >
      {children}
    </Badge>
  );
}

/**
 * Outline badge that renders `label` in a governed color chosen by its semantic `tone`.
 *
 * Issue 597: this used to render a raw Mantine palette colour as text on a TRANSPARENT
 * background, so what it landed on was whatever the consumer put behind it. Measured live it
 * was 1.86:1 for `warning` and 3.32:1 for `neutral`. It now uses the same derived soft pair as
 * `StatusBadge`, which is opaque and therefore measurable; the outline reads as the
 * foreground colour so the shape survives.
 */
export function LabelTag({ tone = 'neutral', label, ...props }: LabelTagProps) {
  return (
    <Badge
      data-gds-badge-fixed-tone="true"
      variant="outline"
      {...props}
      style={{
        background: `var(--gds-badge-soft-${tone})`,
        color: `var(--gds-badge-soft-${tone}-fg)`,
        borderColor: `var(--gds-badge-soft-${tone}-fg)`,
        ...(props.style as React.CSSProperties | undefined),
      }}
    >
      {label}
    </Badge>
  );
}

/** Numeric count badge that clamps to a non-negative integer and shows `{cap}+` once the value exceeds `cap`. */
export function CountBadge({ value, cap = 99, srLabel, ...props }: CountBadgeProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const normalizedCap = Math.max(1, Math.floor(cap));
  const displayValue = normalizedValue > normalizedCap ? `${normalizedCap}+` : String(normalizedValue);
  return (
    <Badge color="violet" variant="filled" aria-label={srLabel} {...props}>{displayValue}</Badge>
  );
}
