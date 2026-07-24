'use client';

import type { CSSProperties, ReactNode } from 'react';
import { DateInput, DatePickerInput, DateTimePicker } from '@mantine/dates';

function resolveDateValue(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.length > 0) return new Date(value);
  return null;
}

function resolveBoundDate(value: Date | string | undefined): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.length > 0) return new Date(value);
  return undefined;
}

/**
 * Shared, GDS-owned prop surface for the date/time input family — deliberately
 * NOT `extends`-ing any `@mantine/dates` prop type. Structurally reusing a
 * vendor prop type in a public interface leaks it into GDS's public `.d.ts`
 * surface (`scripts/verify-public-types-boundary.mjs`'s gate exists exactly
 * to catch this), which defeats the point of wrapping `@mantine/dates` behind
 * a GDS contract in the first place (see DEPENDENCY_GOVERNANCE.md's Primitive
 * engine class).
 */
export interface GdsDateInputBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: ReactNode;
  id?: string;
  name?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  /** Dayjs format string for the displayed value (Mantine's own default is `'MMMM D, YYYY'`). */
  valueFormat?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export interface GdsDateInputProps extends GdsDateInputBaseProps {
  value?: Date | string | null;
  onChange?: (value: Date | null) => void;
}

export function GdsDateInput({ value, onChange, minDate, maxDate, ...rest }: GdsDateInputProps) {
  return (
    <DateInput
      value={resolveDateValue(value)}
      onChange={(next) => onChange?.(next as Date | null)}
      minDate={resolveBoundDate(minDate)}
      maxDate={resolveBoundDate(maxDate)}
      clearable
      {...rest}
    />
  );
}

export interface GdsDateTimeInputProps extends GdsDateInputBaseProps {
  value?: Date | string | null;
  onChange?: (value: Date | null) => void;
}

export function GdsDateTimeInput({ value, onChange, minDate, maxDate, ...rest }: GdsDateTimeInputProps) {
  return (
    <DateTimePicker
      value={resolveDateValue(value)}
      onChange={(next) => onChange?.(next as Date | null)}
      minDate={resolveBoundDate(minDate)}
      maxDate={resolveBoundDate(maxDate)}
      clearable
      {...rest}
    />
  );
}

export type GdsDateRangeValue = [Date | null, Date | null];

export interface GdsDateRangeInputProps extends GdsDateInputBaseProps {
  value?: GdsDateRangeValue;
  onChange?: (value: GdsDateRangeValue) => void;
}

export function GdsDateRangeInput({ value, onChange, minDate, maxDate, ...rest }: GdsDateRangeInputProps) {
  return (
    <DatePickerInput
      type="range"
      value={value ?? [null, null]}
      onChange={(next) => onChange?.((next ?? [null, null]) as GdsDateRangeValue)}
      minDate={resolveBoundDate(minDate)}
      maxDate={resolveBoundDate(maxDate)}
      clearable
      {...rest}
    />
  );
}
