# GDS API Reference

This repository ships the public API reference from `apps/playground/src/api-reference-registry.ts`.

## Runtime Contract

- `@doneisbetter/gds` is the umbrella package for default consumers.
- `@doneisbetter/gds-theme` owns theme lanes, provider setup, font lanes, and i18n context.
- `@doneisbetter/gds-core` owns public surfaces, docs surfaces, feedback, forms, tables, playback, media, layout, icon, and state primitives.
- `@doneisbetter/gds-admin` owns operator CRUD, resource manager, admin table, overlay, and admin shell contracts.

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
