'use client';

import type { CSSProperties, ReactNode } from 'react';
import { DateInput, DatePickerInput, DateTimePicker } from '@mantine/dates';
import { gdsDevWarnOnce } from '@sovereignsquad/gds-theme';

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

function isoDay(date: Date): string {
  return Number.isNaN(date.getTime()) ? String(date) : date.toISOString().slice(0, 10);
}

/**
 * Dev-only guard for the date family's bound props. Warns (once per distinct
 * problem) when `minDate`/`maxDate` are transposed — which makes no date
 * selectable — or when a supplied value falls outside `[minDate, maxDate]`, so
 * the misuse surfaces as a GDS-authored message pointing at the real cause rather
 * than as whatever the underlying date engine does with impossible bounds.
 * No-op in production.
 */
function warnOnDateBounds(
  component: string,
  minDate: Date | string | undefined,
  maxDate: Date | string | undefined,
  values: Array<Date | null>,
): void {
  const min = resolveBoundDate(minDate);
  const max = resolveBoundDate(maxDate);

  if (min && max && !Number.isNaN(min.getTime()) && !Number.isNaN(max.getTime()) && min.getTime() > max.getTime()) {
    gdsDevWarnOnce(
      `${component}:min-after-max`,
      `${component}: minDate (${isoDay(min)}) is after maxDate (${isoDay(max)}), so no date is selectable. Swap the two bounds.`,
    );
  }

  for (const value of values) {
    if (!value || Number.isNaN(value.getTime())) continue;
    if (min && !Number.isNaN(min.getTime()) && value.getTime() < min.getTime()) {
      gdsDevWarnOnce(
        `${component}:value-before-min`,
        `${component}: value (${isoDay(value)}) is before minDate (${isoDay(min)}); it will not be selectable through the calendar.`,
      );
    }
    if (max && !Number.isNaN(max.getTime()) && value.getTime() > max.getTime()) {
      gdsDevWarnOnce(
        `${component}:value-after-max`,
        `${component}: value (${isoDay(value)}) is after maxDate (${isoDay(max)}); it will not be selectable through the calendar.`,
      );
    }
  }
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
  warnOnDateBounds('GdsDateInput', minDate, maxDate, [resolveDateValue(value)]);
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
  warnOnDateBounds('GdsDateTimeInput', minDate, maxDate, [resolveDateValue(value)]);
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
  warnOnDateBounds('GdsDateRangeInput', minDate, maxDate, value ?? [null, null]);
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
