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

## Do

- Pass both `table` and `grid` to get the layout toggle; with only one there is no toggle.
- Pass `bulkActions` with the current `selectedCount`; the bar shows only while it is above zero.

## Don't

- Do not import it from the `/server` entry; it is a client component.
- Do not wrap `tree` in your own `nav`; the template already wraps it in a labelled `nav`.

## Minimal example

From [`examples/asset-manager.tsx`](examples/asset-manager.tsx), which the test suite renders and checks with axe.

```tsx
import { BodyText, GdsAssetManagerTemplate, GdsTreeView } from '@sovereignsquad/gds-core';

export default function AssetManagerExample() {
  return (
    <GdsAssetManagerTemplate
      title="Files"
      state="ready"
      tree={<GdsTreeView ariaLabel="Folders" nodes={[{ id: 'brand', label: 'Brand' }, { id: 'press', label: 'Press' }]} />}
      bulkActions={{ selectedCount: 0, actions: [], onClearSelection: () => undefined }}
      table={<BodyText>Items as a table.</BodyText>}
      grid={<BodyText>Items as a grid.</BodyText>}
    />
  );
}
```

## Rollback

Keep the existing resource screen beside this template; the slots accept the current table and upload components.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
