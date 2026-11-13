# Resource manager template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsResourceManagerTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `resource-manager`

List/detail resource surface for CRUD, preview, delete, and recovery workflows.

## Required data

- rows
- columns
- resource actions
- permission result

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

- `GdsDataTable`
- `SimpleDataTable`
- `DetailProfileShell`
- `SectionPanel`

## Task patterns

- `create-resource`
- `copy-public-link`
- `publish-toggle`
- `confirm-destructive-action`

## Accessibility

- table headers
- named row actions
- detail heading
- retry action

## Edge cases

- empty resources
- not found detail
- permission denied
- stale rows

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Adopt per resource type; no persistence contract is hardcoded into the template.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
