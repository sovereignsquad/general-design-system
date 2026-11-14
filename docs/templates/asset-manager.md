# Asset manager template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsAssetManagerTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `asset-manager`

Dense file or asset screen with a folder tree, toolbar, bulk actions, a table/grid of items, upload and item detail.

## Required data

- folder tree
- items in the open folder
- selection

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

- `GdsTreeView`
- `DataToolbar`
- `GdsBulkActionBar`
- `GdsViewToggle`
- `AdvancedDataTable`
- `GdsAssetManager`
- `GdsShapeScope`

## Task patterns

- `create-resource`
- `confirm-destructive-action`

## Accessibility

- folder tree follows the tree pattern
- keyboard path tree, toolbar, bulk actions, layout toggle, items
- selection count announced
- labelled layout toggle

## Edge cases

- empty folder
- nothing selected
- thousands of items
- upload failure
- folder load error
- permission denied

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Keep the existing resource screen beside this template; the slots accept the current table and upload components.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
