# GDS Docs and i18n Gap Implementation Plan

Status: Delivered implementation record
Owner: GDS
Date: 2026-06-06
Source: package export audit, GitHub Pages/reference-site audit, and locale coverage review

## Executive Summary

The published GDS package surface is materially broader than the public GitHub Pages documentation. The reference site has strong pattern coverage and release/install guidance, but it does not yet give developers and product owners enough direct information about every exported function, component, hook, registry, and governance API.

The i18n story is also uneven. Core semantic vocabulary has locale packs, and a few public routes have localized copy, but many docs/demo routes are intentionally English-only today. Several package components also own user-visible fallback strings without message IDs, which prevents complete product localization.

This implementation fills both gaps by adding a generated API reference, richer product-owner guidance, complete route-level i18n coverage, package-level message IDs, and CI checks that prevent the gap from returning.

## Current Evidence

### Export Surface Size

Current named runtime export counts:

| Package | Runtime named exports | Pattern export coverage | Documentation gap |
|---|---:|---:|---|
| `@doneisbetter/gds-theme` | 23 | covered | many provider/theme/i18n helpers are thinly documented |
| `@doneisbetter/gds-core` | 165 | mostly covered | many exports are not mentioned in README or component docs |
| `@doneisbetter/gds-admin` | 33 | covered | many admin primitives are not listed in README/product-facing docs |

Representative docs gaps:

- Theme helpers: `GdsProvider`, `GdsI18nContext`, `useGdsTranslation`, `showGdsNotification`, `createGdsThemePresetSelection`, `getGdsVibeThemeCssVariables`.
- Core components: `AdvancedDataTable`, `ConfirmDialog`, `GdsConfirmProvider`, `GdsToastProvider`, `GdsIcon`, `MediaPreviewCard`, `PlaybackControls`, `PublicCaptureFlow`, `GdsLayoutTemplatePreview`, `NotificationCenter`, `Telemetry`, and many helper APIs.
- Admin components: `AdminTextInput`, `AdminDataTable`, `AdminModal`, `AdminDetailDrawer`, `AdminResourceManager`, `AdminResourceGrid`, `AdminFormActions`, and legacy admin shell primitives.

### GitHub Pages / Reference Site Gaps

The site has these strengths:

- Install and governance pages are current for `3.3.0`.
- Pattern catalog and live demos exist.
- Pattern export coverage checks exist.
- The site is a strict GDS consumer.

Remaining gaps:

- No full generated API reference page per package.
- No prop/type tables for every exported component.
- No “developer task” navigation such as “I need an admin CRUD form”, “I need a confirmation”, “I need a public capture flow”.
- Product-owner guidance is scattered across pattern docs instead of summarized by business problem and adoption decision.
- Live demos do not cover every export directly; many entries are only `support-api`.
- Export coverage proves every export is acknowledged, but not that every export has enough docs.

### i18n Gaps

Current route full-copy localization coverage:

- `/`
- `/install`
- `/governance`
- `/themes`

Everything else falls back to English-only:

- `/coverage`
- `/patterns`
- `/patterns/*`
- `/live-demos`
- `/live-demos/*`
- `/request-feature`

Package-level hard-coded copy still exists in components and helpers, including:

- `ShareButtonGroup` channel labels.
- `PublicCaptureFlow` stage titles/descriptions.
- `AccessSummary` status labels.
- `ReferenceLocaleNotice` title.
- `LayoutTemplatePreview` labels, buttons, diagnostics, copy status.
- `GdsChart` type labels, summaries, legends, and validation messages.
- `AccessRecoveryPanel` default recovery copy.
- several notification, table, form, and state helper messages.

The package has `GdsProvider`, `GdsI18nContext`, `useGdsTranslation`, and locale packs, but many newer components have not yet been wired into that message contract.

## Goals

1. Make the GitHub Pages site a complete developer and product-owner reference for the full `3.3.0+` package surface.
2. Ensure every exported component/function/hook has an import path, purpose, props/contracts, states, accessibility notes, examples, and migration guidance where applicable.
3. Convert docs/reference-site copy into a route-localized content model for all supported locales.
4. Convert package-owned user-visible strings into message IDs with localized defaults.
5. Add CI checks that fail when exports, docs, pattern coverage, or i18n coverage drift.

## Non-Goals

- No machine translation published without human review.
- No visual redesign of the GitHub Pages site.
- No new local documentation component system outside GDS.
- No arbitrary docs CMS.

## Target Locales

Supported full-copy locales:

- `en`
- `de`
- `fr`
- `it`
- `ru`
- `he`
- `ar`
- `hu`

Locale support must preserve RTL behavior for `ar` and `he`.

## Architecture Plan

### 1. API Inventory and Docs Registry

Create a package-owned or docs-owned API registry generated from source exports.

Required fields:

```ts
interface GdsApiReferenceEntry {
  packageName: '@doneisbetter/gds-theme' | '@doneisbetter/gds-core' | '@doneisbetter/gds-admin' | '@doneisbetter/gds';
  exportName: string;
  exportKind: 'component' | 'hook' | 'function' | 'registry' | 'provider' | 'type-helper';
  importPath: string;
  clientSafe: boolean;
  serverSafe: boolean;
  summary: string;
  audience: Array<'developer' | 'product-owner' | 'designer' | 'operator'>;
  relatedPatternIds: string[];
  examples: Array<{ title: string; code: string }>;
  states?: string[];
  accessibility?: string[];
  migrationNotes?: string[];
}
```

Add verification:

- every exported runtime symbol must have an API reference entry
- every entry must point to an existing package export
- every entry must point to a pattern ID or explicitly mark itself as support-only

### 2. GitHub Pages API Reference

Add new reference routes:

- `/api`
- `/api/theme`
- `/api/core`
- `/api/admin`
- `/api/umbrella`

Each route must include:

- package overview
- install/import guidance
- client/server import boundaries
- component/function table
- detailed cards for each export
- examples
- accessibility and state notes
- migration notes for common local replacements

### 3. Product Owner Guidance

Add a product-owner route:

- `/use-cases`

Group by jobs-to-be-done:

- Admin CRUD and resource management
- Public landing/discovery
- Capture/share/playback flows
- Analytics/reporting/data tables
- Auth/access recovery
- Theme/brand governance
- Compliance/adoption audits

Each use case must answer:

- what problem it solves
- which GDS contracts to use
- what not to build locally
- readiness checklist
- acceptance criteria for product teams

### 4. Live Demo Coverage Upgrade

Current `support-api` entries are acceptable for pure helpers, but user-facing components need visible examples.

Upgrade live demos for:

- `GdsConfirmProvider` / `useGdsConfirm`
- `GdsToastProvider` / `useGdsToasts`
- `GdsIcon`
- `MediaPreviewCard`
- `PublicCaptureFlow`
- `PlaybackControls`
- `CreatorThemeBoundary`
- `GdsLayoutTemplatePreview`
- Admin CRUD primitives
- Admin overlays
- Admin resource manager

### 5. i18n Content Model

Replace route-local nested copy objects with structured route copy modules:

```ts
interface LocalizedRouteCopy<T> {
  en: T;
  de: T;
  fr: T;
  it: T;
  ru: T;
  he: T;
  ar: T;
  hu: T;
}
```

Suggested structure:

- `apps/playground/src/copy/home.ts`
- `apps/playground/src/copy/install.ts`
- `apps/playground/src/copy/governance.ts`
- `apps/playground/src/copy/themes.ts`
- `apps/playground/src/copy/coverage.ts`
- `apps/playground/src/copy/patterns.ts`
- `apps/playground/src/copy/live-demos.ts`
- `apps/playground/src/copy/request-feature.ts`
- `apps/playground/src/copy/api.ts`
- `apps/playground/src/copy/use-cases.ts`

### 6. Package Message IDs

Add message IDs for package-owned user-visible strings.

Examples:

```ts
gds.share.copyLink
gds.share.native
gds.capture.identity.title
gds.capture.consent.description
gds.layoutTemplate.apply
gds.layoutTemplate.copySuccess
gds.chart.validation.empty
gds.access.forbidden.label
gds.notification.dismiss
```

Every component with default text should:

- use `useGdsTranslation()`
- keep overridable props where product copy is domain-specific
- use default English fallback
- add keys to every locale file
- add tests that locale packs remain in parity

### 7. Locale Coverage Expansion

Expand `localizedRouteCoverage` to all public routes only after translations exist:

- `/coverage`
- `/patterns`
- `/patterns/*`
- `/live-demos`
- `/live-demos/*`
- `/request-feature`
- `/api`
- `/api/*`
- `/use-cases`

### 8. CI / Verification Gates

Add or expand scripts:

- `verify:api-docs-coverage`
- `verify:i18n-route-coverage`
- `verify:i18n-message-parity`
- `verify:no-hardcoded-package-copy`
- `verify:reference-doc-depth`

Add to `verify:release` once stable.

## Implementation Phases

### Phase 1: Inventory and Gates

Deliverables:

- API export inventory generator.
- API reference registry schema.
- Baseline generated report of documented/undocumented exports.
- i18n hard-coded string audit report.
- Initial CI scripts in warning/report mode.

Acceptance criteria:

- report lists every exported function/component/hook by package
- report identifies docs gaps by export
- report identifies route i18n coverage by path
- report identifies package-level user-visible strings not using message IDs

### Phase 2: API Reference Foundation

Deliverables:

- `/api` route and package subroutes.
- Registry entries for every `@doneisbetter/gds-theme` export.
- Registry entries for top 50 `@doneisbetter/gds-core` exports.
- Registry entries for every `@doneisbetter/gds-admin` export.

Acceptance criteria:

- developers can find import path and basic usage for all theme/admin exports
- core high-impact components have examples and state/a11y notes
- API reference route uses only GDS primitives

### Phase 3: Product Owner Documentation

Deliverables:

- `/use-cases` route.
- Product-owner decision guides by workflow.
- “Do not build locally” guidance mapped to compliance rules.

Acceptance criteria:

- product owner can identify which GDS contracts apply to a planned feature
- developer can move from use case to API docs and live demo

### Phase 4: Package i18n Hardening

Deliverables:

- Message IDs for user-visible package strings.
- Locale-pack parity updates for all supported locales.
- Tests for translated `ShareButtonGroup`, `PublicCaptureFlow`, `LayoutTemplatePreview`, `GdsChart`, `AccessSummary`, and recovery components.

Acceptance criteria:

- no package-owned user-visible copy is English-only unless explicitly product-provided
- locale packs remain key-complete
- RTL locales render with correct document direction

### Phase 5: Route Translation Completion

Deliverables:

- Localized copy modules for every public route.
- Full translations for `/coverage`, `/patterns`, `/patterns/*`, `/live-demos`, `/live-demos/*`, `/request-feature`, `/api`, and `/use-cases`.
- Expanded `localizedRouteCoverage`.

Acceptance criteria:

- locale selector keeps selected locale on every public route
- no English fallback notice appears on fully localized routes
- route-copy tests cover all supported locales

### Phase 6: Live Demo and Example Completeness

Deliverables:

- Live examples for all user-facing exports that are currently support-only.
- Copyable code snippets for key workflows.
- Migration examples from local Mantine/raw UI to GDS.

Acceptance criteria:

- every user-facing component has at least one live demo or documented composed example
- every support-only helper explains where it appears and when to use it

### Phase 7: Enforce and Release

Deliverables:

- CI scripts moved from report mode to fail mode.
- `verify:release` includes docs and i18n coverage gates.
- Patch release published.
- GitHub issues/project board updated.

Acceptance criteria:

- no undocumented runtime export can be added
- no missing locale key can be added
- no new docs route can claim full-copy localization without all locale entries
- npm package and GitHub release are published and verified

## Proposed Issue Breakdown

1. API Docs: export inventory and coverage gate
2. API Docs: package reference routes and registry schema
3. API Docs: theme package complete reference
4. API Docs: admin package complete reference
5. API Docs: core package high-impact reference batch
6. Product Docs: use-case decision guide route
7. i18n: route copy module architecture
8. i18n: package message ID contract
9. i18n: translate coverage/pattern/live-demo routes
10. i18n: translate API and use-case routes
11. Demos: fill live examples for user-facing support-only exports
12. CI: docs depth and i18n release gates

## Execution Order

1. Inventory and gates first.
2. API reference route shell second.
3. Route copy architecture third.
4. Package message IDs fourth.
5. Translate route batches fifth.
6. Live demo completion sixth.
7. Enforce CI and publish last.

## Risks

- Translation quality can degrade if machine-generated without review.
- API docs may become stale unless generated coverage is enforced.
- Full localization expands maintenance cost; route copy modules must be structured before translation work begins.
- Some support APIs should not become noisy live demos; they need clear “support API” documentation instead.

## Definition of Done

- GitHub Pages explains every exported function/component/hook sufficiently for developers.
- Product owners can map business needs to GDS contracts without reading source.
- Every supported route has complete translations for supported locales or an explicit coverage notice.
- Every package-owned user-visible string has an i18n key or an explicit product-provided prop.
- CI prevents missing API docs, missing locale keys, and undocumented route localization claims.
