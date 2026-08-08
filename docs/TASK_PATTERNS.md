# Task Patterns

Status: Active SSOT
Version: 4.1.5
Last updated: 2026-07-26

GDS task patterns describe complete operator workflows, not isolated components. Each pattern defines trigger, required data, states, steps, component contracts, telemetry, copy, accessibility, edge cases, and do-not-build guidance.

## Runtime API

- `getGdsTaskPatterns()`: returns all shipped task patterns.
- `getGdsTaskPattern(id)`: resolves one task pattern by stable ID.
- `validateGdsTaskPatterns(patterns?)`: validates state, telemetry, accessibility, and do-not-build coverage.

## Shipped Patterns

- `create-resource`
- `review-submission`
- `bulk-approve`
- `recover-failed-upload`
- `copy-public-link`
- `publish-toggle`
- `confirm-destructive-action`

## Required States

Every task pattern declares:

- `start`
- `in-progress`
- `success`
- `empty`
- `error`
- `retry`
- `cancelled`

## Implementation Checklist

- Use only package-native GDS contracts listed in `componentContracts`.
- Keep adapter-owned persistence behind the documented resource, table, form, asset, confirmation, or notification boundary.
- Emit only metadata-safe telemetry fields listed by the pattern.
- Render visible loading, empty, error, retry, cancelled, and success copy.
- Preserve keyboard operation, visible focus, and screen-reader state updates.

## Do Not Build

The pattern registry explicitly rejects route-local wrappers, native browser confirmations, icon-only destructive actions, silent bulk mutation, hidden upload controls, color-only state, and publish paths that bypass required metadata.

## Verification

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```
