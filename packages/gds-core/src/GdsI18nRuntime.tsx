import { useContext, type ReactNode } from 'react';
import { GdsI18nContext, getGdsLocaleMetadata, gdsLocaleMetadata, isGdsRtlLocale } from '@sovereignsquad/gds-theme';
import { Text } from '@mantine/core';
import { getGdsMessages, type GdsLocale } from './locales';

/** Category of non-fatal i18n runtime event: a missing message key, a fall back to the fallback locale, or an Intl format option the platform rejected. */
export type GdsI18nRuntimeEventType = 'missing_key' | 'fallback_locale_used' | 'unsupported_format_option';

/** A single non-fatal i18n runtime event, emitted so hosts can track missing keys, fallback usage, and unsupported format options. */
export interface GdsI18nRuntimeEvent {
  type: GdsI18nRuntimeEventType;
  /** Locale in effect when the event fired. */
  locale: string;
  /** Message key involved, for `missing_key` events. */
  key?: string;
  /** Locale fallen back to, for `fallback_locale_used` events. */
  fallbackLocale?: string;
  /** Which formatter raised the event, for `unsupported_format_option`. */
  formatter?: 'number' | 'currency' | 'date' | 'relative-time' | 'plural' | 'sort';
  /** Human-readable explanation of the event. */
  reason?: string;
}

/** Shared options for the GDS i18n formatters: which locale to use, the fallback when it is unsupported, and an event sink. */
export interface GdsFormatOptions {
  /** Target locale; defaults to `'en'` when omitted. */
  locale?: string;
  /** Locale used when `locale` is unsupported; defaults to `'en'`. */
  fallbackLocale?: GdsLocale;
  /** Called for each non-fatal i18n event (missing key, fallback, unsupported option). */
  onEvent?: (event: GdsI18nRuntimeEvent) => void;
}

/** Message variants keyed by CLDR plural category; `one`/`other` are required, the rest optional. `zero` is used verbatim for an exact 0. */
export interface GdsPluralMessage {
  zero?: ReactNode;
  one: ReactNode;
  two?: ReactNode;
  few?: ReactNode;
  many?: ReactNode;
  other: ReactNode;
}

/** Pseudo-localization fixture describing how much a sample string is expected to grow (and in which direction) for a locale, for copy-fit checks. */
export interface GdsTextExpansionFixture {
  locale: string;
  /** Writing direction for the locale. */
  direction: 'ltr' | 'rtl';
  /** Original sample string. */
  sample: string;
  /** Sample padded to the expected localized length. */
  expandedSample: string;
  /** Multiplier applied to the sample length to model expansion. */
  expansionRatio: number;
  /** Suggested minimum inline size, in `ch`, to fit the expanded sample. */
  minInlineSizeCh: number;
  /** Reviewer guidance for validating fit. */
  notes: string[];
}

/** Deduplicating sink for i18n events: remembers keys already seen so a given `missing_key` is reported at most once. */
export interface GdsMissingKeyTracker {
  /** Event keys already emitted. */
  seen: Set<string>;
  /** Records an event, suppressing repeat `missing_key` emissions. */
  emit: (event: GdsI18nRuntimeEvent) => void;
}

/** Props for {@link GdsLocaleText}: a message `id`, a `defaultMessage` fallback, and optional interpolation `values`. */
export interface GdsLocaleTextProps extends GdsFormatOptions {
  /** Message key to resolve from the locale pack. */
  id: string;
  /** String used when the key is absent from both locale and fallback packs. */
  defaultMessage: string;
  /** Values interpolated into `{placeholder}` tokens in the message. */
  values?: Record<string, string | number>;
}

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

const numberFormatCache = new Map<string, Intl.NumberFormat>();
const dateFormatCache = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();
const pluralRulesCache = new Map<string, Intl.PluralRules>();
const collatorCache = new Map<string, Intl.Collator>();

function cacheKey(locale: string, options?: Record<string, unknown>) {
  return `${locale}:${JSON.stringify(options ?? {})}`;
}

function emitEvent(options: GdsFormatOptions | undefined, event: GdsI18nRuntimeEvent) {
  options?.onEvent?.(event);
}

function isSupportedLocale(locale: string) {
  return locale in gdsLocaleMetadata;
}

/** Returns `locale` if supported, otherwise emits a `fallback_locale_used` event and returns `fallbackLocale`. */
export function resolveGdsLocale({ locale = 'en', fallbackLocale = 'en', onEvent }: GdsFormatOptions = {}) {
  if (isSupportedLocale(locale)) {
    return locale;
  }
  onEvent?.({
    type: 'fallback_locale_used',
    locale,
    fallbackLocale,
    reason: 'Unsupported locale resolved to fallback locale.',
  });
  return fallbackLocale;
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

/** Formats a number for the resolved locale via a cached `Intl.NumberFormat`; on rejected options it emits `unsupported_format_option` and retries on the fallback locale. */
export function formatGdsNumber(value: number, options: GdsFormatOptions & Intl.NumberFormatOptions = {}) {
  const { locale, fallbackLocale, onEvent, ...formatOptions } = options;
  const resolvedLocale = resolveGdsLocale({ locale, fallbackLocale, onEvent });
  const key = cacheKey(resolvedLocale, formatOptions);
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(resolvedLocale, formatOptions);
    } catch (error) {
      emitEvent(options, {
        type: 'unsupported_format_option',
        locale: resolvedLocale,
        formatter: 'number',
        reason: error instanceof Error ? error.message : 'Intl.NumberFormat rejected the provided options.',
      });
      formatter = new Intl.NumberFormat(resolveGdsLocale({ locale: fallbackLocale ?? 'en' }));
    }
    numberFormatCache.set(key, formatter);
  }
  return formatter.format(value);
}

/** Formats a currency amount by delegating to {@link formatGdsNumber} with `style: 'currency'` and the given code. */
export function formatGdsCurrency(value: number, currency: string, options: GdsFormatOptions & Pick<Intl.NumberFormatOptions, 'currencyDisplay'> = {}) {
  return formatGdsNumber(value, {
    ...options,
    style: 'currency',
    currency,
  });
}

/** Formats a date for the resolved locale via a cached `Intl.DateTimeFormat`, falling back to the fallback locale on unsupported options. */
export function formatGdsDate(value: Date | number | string, options: GdsFormatOptions & Intl.DateTimeFormatOptions = {}) {
  const { locale, fallbackLocale, onEvent, ...formatOptions } = options;
  const resolvedLocale = resolveGdsLocale({ locale, fallbackLocale, onEvent });
  const key = cacheKey(resolvedLocale, formatOptions);
  let formatter = dateFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(resolvedLocale, formatOptions);
    } catch (error) {
      emitEvent(options, {
        type: 'unsupported_format_option',
        locale: resolvedLocale,
        formatter: 'date',
        reason: error instanceof Error ? error.message : 'Intl.DateTimeFormat rejected the provided options.',
      });
      formatter = new Intl.DateTimeFormat(resolveGdsLocale({ locale: fallbackLocale ?? 'en' }));
    }
    dateFormatCache.set(key, formatter);
  }
  return formatter.format(new Date(value));
}

/** Formats a relative time (e.g. "in 3 days") for the resolved locale via a cached `Intl.RelativeTimeFormat`, defaulting `numeric: 'auto'`. */
export function formatGdsRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options: GdsFormatOptions & Intl.RelativeTimeFormatOptions = {}) {
  const { locale, fallbackLocale, onEvent, ...formatOptions } = options;
  const resolvedLocale = resolveGdsLocale({ locale, fallbackLocale, onEvent });
  const key = cacheKey(resolvedLocale, formatOptions);
  let formatter = relativeTimeFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.RelativeTimeFormat(resolvedLocale, { numeric: 'auto', ...formatOptions });
    } catch (error) {
      emitEvent(options, {
        type: 'unsupported_format_option',
        locale: resolvedLocale,
        formatter: 'relative-time',
        reason: error instanceof Error ? error.message : 'Intl.RelativeTimeFormat rejected the provided options.',
      });
      formatter = new Intl.RelativeTimeFormat(resolveGdsLocale({ locale: fallbackLocale ?? 'en' }), { numeric: 'auto' });
    }
    relativeTimeFormatCache.set(key, formatter);
  }
  return formatter.format(value, unit);
}

/** Selects the plural message for `value`: returns `messages.zero` for an exact 0 when present, otherwise the `Intl.PluralRules` category (falling back to `other`). */
export function formatGdsPlural(value: number, messages: GdsPluralMessage, options: GdsFormatOptions = {}) {
  if (value === 0 && messages.zero !== undefined) {
    return messages.zero;
  }
  const resolvedLocale = resolveGdsLocale(options);
  const key = cacheKey(resolvedLocale, { type: 'cardinal' });
  let rules = pluralRulesCache.get(key);
  if (!rules) {
    rules = new Intl.PluralRules(resolvedLocale);
    pluralRulesCache.set(key, rules);
  }
  const category = rules.select(value);
  return messages[category] ?? messages.other;
}

/** Locale-aware string comparison via a cached `Intl.Collator` (base sensitivity, numeric ordering by default); returns a sort-order number. */
export function compareGdsLocaleString(left: string, right: string, options: GdsFormatOptions & Intl.CollatorOptions = {}) {
  const { locale, fallbackLocale, onEvent, ...collatorOptions } = options;
  const resolvedLocale = resolveGdsLocale({ locale, fallbackLocale, onEvent });
  const key = cacheKey(resolvedLocale, collatorOptions);
  let collator = collatorCache.get(key);
  if (!collator) {
    collator = new Intl.Collator(resolvedLocale, { sensitivity: 'base', numeric: true, ...collatorOptions });
    collatorCache.set(key, collator);
  }
  return collator.compare(left, right);
}

/** Returns a new array sorted with {@link compareGdsLocaleString}, leaving the input untouched. */
export function sortGdsLocaleStrings(values: string[], options: GdsFormatOptions & Intl.CollatorOptions = {}) {
  return [...values].sort((left, right) => compareGdsLocaleString(left, right, options));
}

/** Creates a {@link GdsMissingKeyTracker} that forwards events to `onEvent` while suppressing duplicate `missing_key` reports. */
export function createGdsMissingKeyTracker(onEvent?: (event: GdsI18nRuntimeEvent) => void): GdsMissingKeyTracker {
  const seen = new Set<string>();
  return {
    seen,
    emit: (event) => {
      const key = `${event.locale}:${event.key ?? event.reason ?? event.type}`;
      if (event.type === 'missing_key' && seen.has(key)) {
        return;
      }
      seen.add(key);
      onEvent?.(event);
    },
  };
}

function interpolate(message: string, values: Record<string, string | number> = {}) {
  return message.replace(/\{([A-Za-z0-9_.-]+)\}/g, (match, key) => String(values[key] ?? match));
}

/** Resolves a localized message by `id` from the locale pack (then the fallback pack, then `defaultMessage`), emitting `missing_key` when absent, and interpolates `values` into `{placeholder}` tokens. */
export function resolveGdsMessage({ id, defaultMessage, values, locale = 'en', fallbackLocale = 'en', onEvent }: GdsLocaleTextProps) {
  const resolvedLocale = resolveGdsLocale({ locale, fallbackLocale, onEvent });
  const messages = getGdsMessages(resolvedLocale);
  const fallbackMessages = getGdsMessages(fallbackLocale);
  const message = messages[id as keyof typeof messages] ?? fallbackMessages[id as keyof typeof fallbackMessages];
  if (!message) {
    onEvent?.({
      type: 'missing_key',
      locale: resolvedLocale,
      fallbackLocale,
      key: id,
      reason: 'Message key was not present in locale or fallback packs.',
    });
  }
  return interpolate(message ?? defaultMessage, values);
}

/** Builds a {@link GdsTextExpansionFixture} for a locale, estimating expansion from the locale's script (German gets the largest Latin ratio) and returning fit-check guidance. */
export function createGdsTextExpansionFixture(locale: string, sample = 'Save changes') {
  const metadata = getGdsLocaleMetadata(locale);
  const direction = metadata.direction;
  const ratioByScript: Record<string, number> = {
    latin: locale === 'de' ? 1.45 : 1.3,
    cyrillic: 1.35,
    hebrew: 1.25,
    arabic: 1.3,
  };
  const expansionRatio = ratioByScript[metadata.script] ?? 1.3;
  const expandedLength = Math.ceil(sample.length * expansionRatio);
  const expandedSample = sample.padEnd(expandedLength, sample.at(-1) ?? '.');
  return {
    locale,
    direction,
    sample,
    expandedSample,
    expansionRatio,
    minInlineSizeCh: expandedLength,
    notes: [
      'Use this fixture for button, header, tab, card, and toolbar copy fit checks.',
      'Text must wrap or truncate by governed component contract; it must not push sibling controls off screen.',
      isGdsRtlLocale(locale) ? 'Validate mixed LTR data inside RTL layout with dir=\"auto\" where user data is shown.' : 'Validate expansion against responsive containers and long localized labels.',
    ],
  } satisfies GdsTextExpansionFixture;
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
