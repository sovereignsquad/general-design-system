import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
  status: StatusVariant;
  children: ReactNode;
}

export type LabelTagTone = 'neutral' | 'info' | 'warning' | 'success';

export interface LabelTagProps extends Omit<BadgeProps, 'color' | 'children'> {
  tone?: LabelTagTone;
  label: ReactNode;
}

export interface CountBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  value: number;
  cap?: number;
  srLabel?: string;
}

const statusColorMap: Record<StatusVariant, string> = {
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  info: 'blue',
  neutral: 'gray',
};

const labelTagColorMap: Record<LabelTagTone, string> = {
  neutral: 'gray',
  info: 'blue',
  warning: 'yellow',
  success: 'green',
};

/**
 * StatusBadge enforces strict semantic coloring. 
 * Arbitrary hex colors are prohibited.
 */
export function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  return (
    <Badge color={statusColorMap[status]} variant="light" {...props}>
      {children}
    </Badge>
  );
}

export function LabelTag({ tone = 'neutral', label, ...props }: LabelTagProps) {
  return (
    <Badge color={labelTagColorMap[tone]} variant="outline" {...props}>
      {label}
    </Badge>
  );
}

export function CountBadge({ value, cap = 99, srLabel, ...props }: CountBadgeProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const normalizedCap = Math.max(1, Math.floor(cap));
  const displayValue = normalizedValue > normalizedCap ? `${normalizedCap}+` : String(normalizedValue);
  return (
    <Badge color="violet" variant="filled" aria-label={srLabel} {...props}>{displayValue}</Badge>
  );
}
