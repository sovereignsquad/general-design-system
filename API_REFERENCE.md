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
