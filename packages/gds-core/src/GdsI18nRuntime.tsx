'use client';

import { useContext, type ReactNode } from 'react';
import { GdsI18nContext, getGdsLocaleMetadata } from '@sovereignsquad/gds-theme';
import { Text } from '@mantine/core';

import { resolveGdsMessage, type GdsFormatOptions, type GdsLocaleTextProps, formatGdsPlural, type GdsPluralMessage, formatGdsRelativeTime, formatGdsDate, formatGdsCurrency, formatGdsNumber } from './GdsI18nRuntime.shared';

/** Props for {@link GdsFormattedNumber}: the numeric `value` plus any `Intl.NumberFormatOptions`. */
export interface GdsFormattedNumberProps extends GdsFormatOptions, Intl.NumberFormatOptions {
  value: number;
}

/** Props for {@link GdsFormattedCurrency}: the `value`, an ISO 4217 `currency` code, and optional `currencyDisplay`. */
export interface GdsFormattedCurrencyProps extends GdsFormatOptions {
  value: number;
  /** ISO 4217 currency code, e.g. `'EUR'`. */
  currency: string;
  currencyDisplay?: Intl.NumberFormatOptions['currencyDisplay'];
}

/** Props for {@link GdsFormattedDate}: the date `value` plus any `Intl.DateTimeFormatOptions`. */
export interface GdsFormattedDateProps extends GdsFormatOptions, Intl.DateTimeFormatOptions {
  /** Date to format, as a `Date`, epoch ms, or parseable string. */
  value: Date | number | string;
}

/** Props for {@link GdsRelativeTime}: a signed `value`, its `unit`, plus any `Intl.RelativeTimeFormatOptions`. */
export interface GdsRelativeTimeProps extends GdsFormatOptions, Intl.RelativeTimeFormatOptions {
  /** Signed offset (negative = past, positive = future). */
  value: number;
  /** Time unit for the offset, e.g. `'day'`. */
  unit: Intl.RelativeTimeFormatUnit;
}

/** Props for {@link GdsPlural}: the `value` selecting a plural category and the `messages` for each category. */
export interface GdsPluralProps extends GdsFormatOptions {
  value: number;
  messages: GdsPluralMessage;
}

/** Hook resolving the active (or overridden) locale's writing direction; returns `{ locale, direction, isRtl, dir }`. */
export function useGdsDirection(localeOverride?: string) {
  const { locale } = useContext(GdsI18nContext);
  const resolvedLocale = localeOverride ?? locale;
  const metadata = getGdsLocaleMetadata(resolvedLocale);
  return {
    locale: resolvedLocale,
    direction: metadata.direction,
    isRtl: metadata.direction === 'rtl',
    dir: metadata.direction,
  };
}

/** Renders a resolved localized message inside a `<span>` tagged with its message key. */
export function GdsLocaleText({ id, defaultMessage, values, locale, fallbackLocale, onEvent }: GdsLocaleTextProps) {
  return <span data-gds-i18n-key={id}>{resolveGdsMessage({ id, defaultMessage, values, locale, fallbackLocale, onEvent })}</span>;
}

/** Renders a locale-formatted number inside a `<span>`. */
export function GdsFormattedNumber({ value, locale, fallbackLocale, onEvent, ...options }: GdsFormattedNumberProps) {
  return <span data-gds-formatted="number">{formatGdsNumber(value, { ...options, locale, fallbackLocale, onEvent })}</span>;
}

/** Renders a locale-formatted currency amount inside a `<span>`. */
export function GdsFormattedCurrency({ value, currency, currencyDisplay, locale, fallbackLocale, onEvent }: GdsFormattedCurrencyProps) {
  return <span data-gds-formatted="currency">{formatGdsCurrency(value, currency, { currencyDisplay, locale, fallbackLocale, onEvent })}</span>;
}

/** Renders a locale-formatted date inside a `<time>` element carrying the ISO `dateTime`. */
export function GdsFormattedDate({ value, locale, fallbackLocale, onEvent, ...options }: GdsFormattedDateProps) {
  return <time dateTime={new Date(value).toISOString()}>{formatGdsDate(value, { ...options, locale, fallbackLocale, onEvent })}</time>;
}

/** Renders a locale-formatted relative time inside a `<span>`. */
export function GdsRelativeTime({ value, unit, locale, fallbackLocale, onEvent, ...options }: GdsRelativeTimeProps) {
  return <span data-gds-formatted="relative-time">{formatGdsRelativeTime(value, unit, { ...options, locale, fallbackLocale, onEvent })}</span>;
}

/** Renders the plural-selected message for `value` inside a `<span>`. */
export function GdsPlural({ value, messages, locale, fallbackLocale, onEvent }: GdsPluralProps) {
  return <span data-gds-formatted="plural">{formatGdsPlural(value, messages, { locale, fallbackLocale, onEvent })}</span>;
}

/** Wraps children in a direction-aware `<span>` (`dir` set from the locale's metadata) so mixed-direction content renders correctly. */
export function GdsDirectionBoundary({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const metadata = getGdsLocaleMetadata(locale);
  return (
    <Text component="span" dir={metadata.direction} data-gds-locale={locale} data-gds-direction={metadata.direction}>
      {children}
    </Text>
  );
}
