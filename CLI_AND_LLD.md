# CLI and Low-Level Design

## Commands

```bash
npm run verify:api-docs-coverage
npm run verify:i18n-route-coverage
npm run verify:i18n-message-parity
npm run verify:i18n-package-copy
npm run verify:pattern-coverage
npm run verify:i18n-leakage
npm run verify:font-lane-coverage
npm run verify:references
npm run verify:release
npm run verify:accessibility-evidence
npm run verify:a11y-package
npm run verify:theme-tokens
npm run verify:forced-colors-runtime
gds-compliance adoption-report --manifest ./gds-adoption.json --format md
gds-compliance expire-check --manifest ./gds-adoption.json
gds-theme-tokens validate --format text
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
3. Package message parity keeps every locale pack aligned with English baseline keys, **and keeps
   the packs aligned with the components**: every `t('id', 'English')` call site in
   `packages/gds-core/src` must have its id defined in the packs, with matching English. An id
   absent from all twelve packs renders its English fallback in every locale and is invisible to a
   pack-vs-pack comparison, so the source direction is checked separately (issue 617).
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

## Accessibility Evidence LLD

Source:

- `packages/gds-core/src/AccessibilityEvidence.ts`
- `apps/playground/src/accessibility-evidence-registry.ts`
- `scripts/verify-accessibility-evidence.mjs`
- `ACCESSIBILITY_EVIDENCE.md`

Flow:

1. The playground evidence registry derives one structured accessibility record for every stable pattern in the canonical pattern registry.
2. `@sovereignsquad/gds-core` exposes helper APIs to index, resolve, summarize, and validate those records.
3. `/coverage`, `/api`, and `/governance` render the live evidence summary through shipped GDS docs primitives.
4. `verify:accessibility-evidence` fails when records are missing, stale, missing required WCAG mappings, missing AT/browser rows, or missing limitation recovery metadata.

## Accessibility CI Package LLD

Source:

- `packages/gds-a11y/src/index.ts`
- `packages/gds-a11y/src/index.test.ts`
- `scripts/verify-a11y-package.mjs`
- `A11Y_CI_PACKAGE.md`

Flow:

1. Consumer Playwright fixtures own auth, data setup, and route selection.
2. `createGdsA11yTest(...)` opens the route when requested, runs axe findings, optional tab-order assertions, focus-trap checks, and GDS contrast gates.
3. Suppressions require owner, reason, expiry, and replacement path; expired suppressions return as active findings.
4. Reports emit deterministic JSON and `formatGdsA11yReport(...)` emits readable CI output.
5. `verify:a11y-package` builds the package, runs self-tests, and verifies required exports and documentation before release.

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

## Adoption Governance LLD

Source:

- `packages/gds-compliance/index.js`
- `packages/gds-compliance/bin/gds-compliance.js`
- `schemas/gds-adoption.schema.json`
- `TEMPLATES/gds-adoption.json.template`

Flow:

1. `runComplianceCheck(...)` loads the manifest, scans repo drift, and validates exception metadata.
2. `createExceptionLifecycleReport(...)` summarizes dependency-boundary ownership, risk, enforcement mode, and expiry buckets.
3. `createAdoptionReport(...)` combines compliance findings and exception debt into a governed adoption score.
4. `gds-compliance adoption-report` emits text, JSON, Markdown, or HTML evidence for product-owner review.
5. `gds-compliance expire-check` fails CI when dependency-boundary exceptions are past `removeBy` with `enforcementMode: "error"`.

## Theme Token Operations LLD

Source:

- `packages/gds-theme/src/token-operations.ts`
- `packages/gds-theme/bin/gds-theme-tokens.js`
- `scripts/verify-theme-token-contract.mjs`

Flow:

1. `createGdsTokenGraph()` normalizes the shipped vibe-theme lanes into a deterministic token graph.
2. `validateGdsTokenGraph(...)` enforces token-id uniqueness, static color values, and light/dark pair ownership.
3. `createGdsTokenDiff(...)` compares a prior graph snapshot with the current shipped graph for release review.
4. `createGdsThemeCompatibilityReport(...)` summarizes page, shell, card, border, primary-action, and muted-copy compatibility per theme lane.
5. `gds-theme-tokens` exposes graph, validate, compatibility, and diff commands for local and CI review.
6. `verify:theme-tokens` blocks release promotion if the shipped token graph is internally inconsistent.

## Forced-Colors Runtime LLD

Source:

- `packages/gds-theme/styles.css`
- `packages/gds-theme/src/accessibility-report.ts`
- `scripts/verify-forced-colors-runtime.mjs`

Flow:

1. The browser verifier launches a real headless Chrome session.
2. CDP emulates `forced-colors: active` and the selected color scheme.
3. Real docs/demo routes load with shipped theme presets. Coverage includes the pattern-catalog family routes that mount the newest components — `/patterns/operations` (Kanban) and `/patterns/foundations` (Forms) — and sweeps those two routes across **8** theme presets (neutral, dark, flat-surface, editorial, brand-discovery, the high-saturation vibe lanes `cosmic`/`neon-night`, and warm), not just the 3-preset smoke set used for the broader shell routes.
4. The verifier checks that governed surfaces lose decorative backgrounds, controls keep platform-backed colors, and focus outlines remain visible. It additionally runs targeted per-component checks on the Kanban collapse toggle + column footer and the schema form's checkbox-group + repeatable rows, so those specific controls are provably inside the gate rather than escaping it.
5. `verify:forced-colors-runtime` blocks release promotion if those runtime checks fail. The widened preset sweep is what surfaced (and now guards against) the vibe/brand lanes leaking `!important` gradient backgrounds past the forced-colors reset — fixed by the specificity backstop at the end of `styles.css`.

## Rollback

If a release gate creates an emergency false positive, remove it from `verify:references` only in the patch branch, keep the script runnable manually, document the exception, and restore strict release gating in the next patch.
