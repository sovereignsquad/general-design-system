# Settings template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsSettingsTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `settings`

Grouped settings surface with save, disabled, saving, and permission states.

## Required data

- setting groups
- save permission
- dirty state

## States

- `loading`
- `empty`
- `ready`
- `error`
- `retrying`
- `saving`
- `permission-denied`
- `not-found`

## Component contracts

- `PageHeader`
- `SectionPanel`
- `StatusBadge`
- `AsyncSurface`

## Task patterns

- `confirm-destructive-action`

## Accessibility

- labelled groups
- save state copy
- error recovery
- keyboard submit path

## Edge cases

- missing group
- disabled save
- server validation failure

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Consumers can keep route-local settings pages until migration is complete.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
