# CLI and Low-Level Design

## Commands

```bash
npm run verify:api-docs-coverage
npm run verify:i18n-route-coverage
npm run verify:i18n-message-parity
npm run verify:i18n-package-copy
npm run verify:references
npm run verify:release
```

## API Docs LLD

Source:

- `apps/playground/src/pattern-export-coverage.ts`
- `apps/playground/src/api-reference-registry.ts`
- `apps/playground/src/info-pages.tsx`

Flow:

1. Runtime export coverage defines shipped package symbols.
2. API registry enriches each symbol with import path, runtime lane, state model, accessibility note, and test signal.
3. `/api` renders the registry through GDS docs primitives.
4. `verify:api-docs-coverage` validates registry coverage before release.

## i18n LLD

Source:

- `apps/playground/src/locale-coverage.ts`
- `apps/playground/gds-adoption.json`
- `packages/gds-core/src/locales/*.ts`

Flow:

1. Route coverage declares which public routes are full-copy localized.
2. The playground locale switch only exposes full-copy locales for the active route.
3. Package message parity keeps every locale pack aligned with English baseline keys.
4. Release gates fail on missing route declarations, missing message keys, or native dialog copy in packages.

## Maturity Registry LLD

Source:

- `packages/gds-core/src/MaturityCapabilities.ts`
- `apps/playground/src/info-pages.tsx`
- GitHub issues `#240` through `#246`

Flow:

1. GitHub issues define the production-grade implementation scope.
2. The package maturity registry exposes the same seven capability groups as typed static data.
3. `/maturity` renders benefits, package lanes, contracts, states, observability, rollback, and test evidence in every supported site language.
4. `verify:api-docs-coverage` ensures the registry helpers are represented in public API coverage.

## Operational Telemetry LLD

Source:

- `packages/gds-core/src/Telemetry.client.tsx`
- `packages/gds-core/src/core.test.tsx`
- `apps/playground/src/pattern-export-coverage.ts`

Runtime flow:

1. A GDS primitive, pattern, or consumer calls `useGdsTelemetry().emitGdsEvent(...)` or the exported `emitGdsEvent(...)` helper.
2. GDS normalizes the event into `GdsOperationalEvent` with timestamp, component, event type, correlation ID, optional workflow/action IDs, outcome, failure reason, attempt, and timeout metadata.
3. `GdsEventPayloadPolicy` removes unsafe payload keys by default and can hard-reject unsafe payloads for stricter products.
4. Sampling returns `sampling-disabled` or `sampled-out` before any adapter work.
5. Adapter availability returns `adapter-unavailable` without delaying the user action.
6. `createGdsTelemetryAdapter(...)` wraps vendor analytics clients with bounded retry, timeout, and non-blocking error callbacks.
7. Adapter failure never blocks UI state, accessible announcements, form submission, retry controls, or destructive-action recovery.

Rollback:

- Set `sampleRate` to `0` to disable dispatch.
- Remove the adapter or pass no sink to drop events while preserving call sites.
- Pin the previous package version if an additive telemetry export creates unexpected adoption risk.

## Rollback

If a release gate creates an emergency false positive, remove it from `verify:references` only in the patch branch, keep the script runnable manually, document the exception, and restore strict release gating in the next patch.
