# Empty state page template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsEmptyStateTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `empty-state-page`

First-run or no-results page with actionable copy, status, and optional illustration slot.

## Required data

- empty reason
- primary recovery action

## States

- `empty`
- `permission-denied`
- `not-found`

## Component contracts

- `EmptyState`
- `StateBlock`
- `PageHeader`

## Task patterns

- `create-resource`

## Accessibility

- single h1
- specific empty reason
- keyboard reachable recovery
- no color-only meaning

## Edge cases

- empty no action
- permission denied
- not found

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`

## Rollback

Replace blank pages and static placeholders route by route when recovery actions are ready.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
