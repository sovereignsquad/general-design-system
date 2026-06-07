# GDS API Reference

This repository ships the public API reference from `apps/playground/src/api-reference-registry.ts`.

## Runtime Contract

- `@doneisbetter/gds` is the umbrella package for default consumers.
- `@doneisbetter/gds-theme` owns theme lanes, provider setup, font lanes, and i18n context.
- `@doneisbetter/gds-core` owns public surfaces, docs surfaces, feedback, forms, tables, playback, media, layout, icon, and state primitives.
- `@doneisbetter/gds-admin` owns operator CRUD, resource manager, admin table, overlay, and admin shell contracts.

## Maturity Capability API

`@doneisbetter/gds-core` now exports the seven recommended maturity capability contracts:

- `getGdsMaturityCapabilities()`
- `getGdsRecommendedMaturityCapabilities()`
- `getGdsMaturityCapability(id)`
- `getGdsMaturitySummary()`

These helpers expose the issue-backed delivery groups for admin delivery, runtime feedback, foundation surfaces, global readiness, adoption governance, theme operations, and product-system delivery. Each entry includes package lanes, primary contracts, runtime flow, UX states, accessibility, observability, retry/timeout behavior, rollback, testing, documentation, edge cases, and operational behavior.

## Operational Telemetry API

`@doneisbetter/gds-core` exports the package-native telemetry contract for production UX diagnostics:

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

## Verification

```bash
npm run verify:api-docs-coverage
```

The command fails when runtime exports are not represented by the API reference registry source coverage.

## Release Gate

`npm run verify:references` and `npm run verify:release` include API documentation coverage.
