# GDS API Reference

This repository ships the public API reference from `apps/playground/src/api-reference-registry.ts`.

## Runtime Contract

- `@sovereignsquad/gds` is the umbrella package for default consumers.
- `@sovereignsquad/gds-theme` owns theme lanes, provider setup, font lanes, and i18n context.
- `@sovereignsquad/gds-core` owns public surfaces, docs surfaces, feedback, forms, tables, playback, media, layout, icon, and state primitives.
- `@sovereignsquad/gds-admin` owns operator CRUD, resource manager, admin table, overlay, and admin shell contracts.
- `@sovereignsquad/gds-a11y` owns optional Playwright/axe accessibility CI helpers for consumer repositories.
- `@sovereignsquad/gds-compliance` owns manifest validation, strict drift scanning, exception lifecycle reporting, and adoption scoring.

## Compliance and Adoption API

`@sovereignsquad/gds-compliance` exports the package-native governance/reporting helpers:

- `runComplianceCheck({ manifestPath, currentDate? })`
- `formatReport(report, format?)`
- `createExceptionLifecycleReport(manifest, { currentDate? })`
- `formatExceptionLifecycleReport(report, format?)`
- `createAdoptionReport(report, { currentDate? })`
- `formatAdoptionReport(report, format?)`

CLI entrypoints:

- `gds-compliance check`
- `gds-compliance validate-manifest`
- `gds-compliance adoption-report`
- `gds-compliance exceptions`
- `gds-compliance expire-check`

## Theme Operations API

`@sovereignsquad/gds-theme` exports the package-native theme token operations contract:

- `createGdsTokenGraph()`
- `validateGdsTokenGraph(graph?)`
- `createGdsTokenDiff(beforeGraph, afterGraph?)`
- `createGdsThemeCompatibilityReport(graph?)`

CLI entrypoint:

- `gds-theme-tokens graph`
- `gds-theme-tokens validate`
- `gds-theme-tokens compatibility`
- `gds-theme-tokens diff --compare ./previous-graph.json`

High-contrast and forced-colors release gates:

- `createGdsThemeAccessibilityReport()` includes the forced-color role registry and required runtime checks
- `npm run verify:forced-colors-runtime` validates the live docs/runtime routes under `forced-colors: active`

## Accessibility Evidence API

`@sovereignsquad/gds-core` exports the package-native accessibility evidence helpers:

- `createGdsAccessibilityEvidenceIndex(entries)`
- `getGdsAccessibilityEvidence(entriesOrIndex, id)`
- `getGdsAccessibilityEvidenceSummary(entries)`
- `validateGdsAccessibilityEvidence(entries)`

These helpers back the official evidence registry rendered on the docs site. The registry publishes keyboard behavior, visible focus behavior, screen-reader semantics, WCAG mappings, assistive-technology/browser status, known limitations, owners, and recovery notes for every stable pattern.

## Accessibility CI API

`@sovereignsquad/gds-a11y` exports the reusable consumer test helpers:

- `createGdsA11yTest(page, config)`
- `runGdsAxeScan(page, config)`
- `expectGdsTabOrder(page, selectors, config)`
- `expectGdsFocusTrap(page, containerSelector, config)`
- `runGdsContrastGate(page, config)`
- `createGdsA11yReport(config)`
- `formatGdsA11yReport(report)`
- `applyGdsA11ySuppressions(findings, suppressions)`

The package treats `@playwright/test` and `axe-core` as optional peers. Consumers wire their own authenticated route setup, inject axe where needed, and receive deterministic JSON plus readable CI output with pass, warning, failure, suppressed, and incomplete states.

## Maturity Capability API

`@sovereignsquad/gds-core` now exports the seven recommended maturity capability contracts:

- `getGdsMaturityCapabilities()`
- `getGdsRecommendedMaturityCapabilities()`
- `getGdsMaturityCapability(id)`
- `getGdsMaturitySummary()`

These helpers expose the issue-backed delivery groups for admin delivery, runtime feedback, foundation surfaces, global readiness, adoption governance, theme operations, and product-system delivery. Each entry includes package lanes, primary contracts, runtime flow, UX states, accessibility, observability, retry/timeout behavior, rollback, testing, documentation, edge cases, and operational behavior.

## Operational Telemetry API

`@sovereignsquad/gds-core` exports the package-native telemetry contract for production UX diagnostics:

- `GdsTelemetryProvider`
- `useGdsTelemetry()`
- `emitGdsEvent(options, event)`
- `createGdsTelemetryAdapter(options)`
- `gdsOperationalEventTypes`
- `gdsUxFailureReasons`
- `isGdsOperationalEventType(eventType)`

Required event lanes include submit, submit success, submit error, validation error, retry, timeout, upload failure, destructive action, user cancellation, action complete, adapter error, and payload rejected. Dispatch returns `emitted`, `adapter-unavailable`, `payload-rejected`, `sampled-out`, `sampling-disabled`, or `dropped` so callers can observe delivery state without blocking the UI.

Payload policy is privacy-safe by default. Keys containing email, name, phone, password, token, secret, credential, auth, cookie, session, address, IP, JWT, or SSN are removed before dispatch. Consumers can add redaction keys, reject keys, string-length limits, and hard rejection through `GdsEventPayloadPolicy`.

Telemetry never replaces accessible UI state. Components must still render visible loading, success, error, retry, cancellation, timeout, and destructive-action states, with screen-reader announcements owned by the component or feedback primitive.

## Registry Fields

Every public entry includes:

- `packageName`
- `exportName`
- `exportKind`
- `runtimeLane`
- `importPath`
- `status`
- `registryId`
- `audience`
- `summary`
- `contract`
- `accessibility`
- `states`
- `testing`
- `docsPath`

Each entry's `summary` is the export's `rationale` in `apps/playground/src/pattern-export-coverage.ts` (`summary: entry.rationale` in `apps/playground/src/api-reference-registry.ts`); edit the rationale to change what `/api` shows. For an export listed in the [Component Selection Rules](COMPONENTS_AND_PATTERNS.md#component-selection-rules), the rationale must carry that rule's selection constraint, so the `/api` summary states when the component is the wrong choice.

## Verification

```bash
npm run verify:api-docs-coverage
npm run verify:accessibility-evidence
npm run verify:a11y-package
```

The command fails when runtime exports are not represented by the API reference registry source coverage.

## Release Gate

`npm run verify:references` and `npm run verify:release` include API documentation coverage and accessibility evidence validation.
