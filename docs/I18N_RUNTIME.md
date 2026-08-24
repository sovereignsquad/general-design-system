# I18n Runtime

Status: package-native runtime contract  
Packages: `@sovereignsquad/gds-core`, `@sovereignsquad/gds-theme`  
Issue: `#264`

The i18n runtime closes the gap between translated strings and localized product behavior. It provides SSR-safe helpers and small React components for formatting, pluralization, locale-aware sorting, RTL direction, text expansion fixtures, and missing-key telemetry.

## Exports

```ts
import {
  GdsLocaleText,
  GdsFormattedNumber,
  GdsFormattedCurrency,
  GdsFormattedDate,
  GdsRelativeTime,
  GdsPlural,
  GdsDirectionBoundary,
  resolveGdsLocale,
  resolveGdsMessage,
  formatGdsNumber,
  formatGdsCurrency,
  formatGdsDate,
  formatGdsRelativeTime,
  formatGdsPlural,
  compareGdsLocaleString,
  sortGdsLocaleStrings,
  createGdsMissingKeyTracker,
  createGdsTextExpansionFixture,
  useGdsDirection,
} from '@sovereignsquad/gds-core';
```

`@sovereignsquad/gds-theme` remains the locale metadata authority through:

- `gdsLocaleMetadata`
- `getGdsLocaleMetadata(...)`
- `isGdsRtlLocale(...)`
- `getGdsLocaleIdsByScript(...)`
- `GdsI18nContext`

## Runtime Flow

```text
consumer locale / GdsProvider context
  -> resolveGdsLocale(...)
  -> Intl formatter or message resolver
  -> visible localized text
  -> optional metadata-only event
  -> consumer-owned telemetry adapter
```

Formatters memoize `Intl` constructors by locale and options. Unsupported locales fall back deterministically to `en` unless a different `fallbackLocale` is supplied.

## Formatters

```ts
formatGdsNumber(1234.5, { locale: 'de', maximumFractionDigits: 1 });
formatGdsCurrency(20, 'EUR', { locale: 'de' });
formatGdsDate('2026-06-14T12:00:00Z', {
  locale: 'en',
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
formatGdsRelativeTime(-1, 'day', { locale: 'en' });
formatGdsPlural(0, { zero: 'No files', one: 'One file', other: 'Files' }, { locale: 'en' });
```

React components render the same contract:

```tsx
<GdsFormattedCurrency value={20} currency="USD" locale="en" />
<GdsRelativeTime value={1} unit="day" locale="en" />
<GdsPlural value={count} messages={{ one: 'One alert', other: 'Many alerts' }} />
```

## Messages

`resolveGdsMessage(...)` and `GdsLocaleText` use the package locale packs and fall back to the provided default message:

```tsx
<GdsLocaleText
  id="gds.action.save"
  defaultMessage="Save"
  locale="de"
/>
```

Missing keys emit `missing_key` events when `onEvent` is supplied. Use `createGdsMissingKeyTracker(...)` to dedupe repeated events per locale/key before sending them to an analytics adapter.

### Opt-in lazy locale registry (issue 662)

The default path above (`getGdsMessages`, and everything `GdsProvider`/`GdsI18nRuntime` build on
it) bundles all twelve locale dictionaries — zero setup, but every consumer pays for every
locale whether or not they ship it. Measured directly (esbuild, minified, isolated from the
rest of the client bundle): the eager path is **202.7KB**; registering a single non-English
locale through the lazy registry is **11.3KB**.

`@sovereignsquad/gds-core/locales/lazy` is the opt-in alternative for a consumer that wants to
register only the locales it ships:

```ts
import { getGdsMessagesLazy } from '@sovereignsquad/gds-core/locales/lazy';
import '@sovereignsquad/gds-core/locales/lazy/de';
import '@sovereignsquad/gds-core/locales/lazy/fr';

const messages = getGdsMessagesLazy('de');
```

`getGdsMessagesLazy` is synchronous with the same fallback-to-English behavior as
`getGdsMessages` — no async, no Suspense boundary, drop-in anywhere `getGdsMessages` is called.
The difference is *what* triggers the fallback: importing a locale's subpath is what makes it
available, and a lookup for a locale nothing registered falls back to English with a dev-only
console warning naming the missing subpath import, rather than the silent "just works" every
locale gets under the default eager path.

`@sovereignsquad/gds-core/locales/lazy/all` registers all eleven non-English locales in one
import — the lazy-registry equivalent of today's default coverage, for a consumer that wants
the registry's dev-warning behavior without yet trimming which locales it ships.

This is purely additive. `getGdsMessages`, `gdsLocales`, and the individual `en`/`de`/...
exports are unaffected by this subpath existing or not being imported — no existing consumer's
behavior changes by this shipping.

## Sorting

Use locale-aware sorting for labels, menus, filters, and exported rows:

```ts
sortGdsLocaleStrings(['item 10', 'item 2'], { locale: 'en' });
compareGdsLocaleString('á', 'a', { locale: 'hu', sensitivity: 'base' });
```

The default collator is numeric and base-sensitive so common UI lists sort predictably.

## RTL

Use `useGdsDirection(locale?)` for runtime direction checks and `GdsDirectionBoundary` for mixed-direction inline content:

```tsx
const { dir, isRtl } = useGdsDirection();

<GdsDirectionBoundary locale="ar">
  {publicArabicCopy}
</GdsDirectionBoundary>
```

Rules:

- use logical layout terms such as start/end
- use `dir="auto"` for user-generated mixed LTR/RTL data where appropriate
- do not hardcode left/right spacing as a layout authority
- validate Arabic and Hebrew routes in narrow viewports

## Text Expansion

`createGdsTextExpansionFixture(locale, sample)` returns an expansion sample and minimum inline-size guidance for headers, tabs, cards, controls, and toolbars:

```ts
const fixture = createGdsTextExpansionFixture('de', 'Save changes');
```

Use it to prove localized copy wraps, truncates, or reflows through governed components instead of pushing sibling actions off screen.

## Telemetry

Supported event types:

- `missing_key`
- `fallback_locale_used`
- `unsupported_format_option`

Events are metadata-only. Do not include secrets, user-entered content, raw form values, or private resource bodies.

## Accessibility

- formatted values render readable text
- dates render with a semantic `time` element
- direction boundaries set `dir`
- missing keys keep user-facing fallback copy visible
- text expansion fixtures are required for narrow responsive surfaces with translated copy

## Rollback

The runtime is additive. Existing `GdsProvider` and locale packs remain compatible. Consumers can pin the previous package version or continue using host i18n libraries while migrating individual formatters to GDS.
