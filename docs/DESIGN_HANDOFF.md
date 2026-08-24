# Design-To-Code Handoff

Status: package-native handoff contract
Package: `@sovereignsquad/gds-core`  
Issue: `#253`

The design-to-code handoff contract records which GDS exports are approved for design use, how they map to Figma components and variables, which props designers may annotate, and what accessibility/state behavior must be present in handoff notes.

This contract is repository-versioned and does not require private Figma API access. External sync can be layered on top later, but code package contracts remain authoritative.

## Exports

```ts
import {
  getGdsDesignComponentMappings,
  getGdsDesignTokenMappings,
  validateGdsDesignHandoffMappings,
  generateGdsDesignHandoffReport,
  GdsDesignHandoffCatalog,
} from '@sovereignsquad/gds-core';
```

## Statuses

- `approved`
- `experimental`
- `deprecated`
- `missing-mapping`
- `stale-mapping`

Designs should only use `approved` mappings by default. `experimental` mappings require engineering review. `deprecated`, `missing-mapping`, and `stale-mapping` entries must not be used for new production work.

## Component Mapping

Each component mapping includes:

- package and export name
- Figma component path
- handoff status
- related component contracts
- prop annotations
- required label behavior
- focus behavior
- state semantics
- accessibility annotations
- token links
- recovery guidance

## Token Mapping

Token mappings connect code tokens to Figma variables:

- code token id
- Figma variable path
- mode coverage
- status
- usage guidance

Deprecated variables must explain replacement usage. If external Figma sync is unavailable, keep code tokens authoritative and mark the affected mapping stale rather than inventing local colors.

## Report

```ts
const report = generateGdsDesignHandoffReport(new Date().toISOString());
```

The report contains status counts, approved component exports, stale mappings, missing mappings, component mappings, and token mappings.

## Validation

Run:

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```

Validation checks that every mapped component defines a Figma path, props, component contracts, label requirements, focus behavior, state semantics, accessibility notes, and recovery guidance.

## Accessibility

Handoff annotations must include:

- required labels
- focus behavior
- state semantics
- keyboard expectations where relevant
- screen-reader implications
- token links for contrast and focus behavior

## Rollback

The mapping is additive static metadata. If external sync fails or a Figma file is unavailable, keep code authoritative, mark affected mappings stale, and continue release verification without private API dependency.
