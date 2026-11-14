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

## Do

- Pass `getRowKey` so each row keeps a stable key when the list changes.
- Pass `detail` for the selected resource; large screens then show the list and the detail side by side.

## Don't

- Do not use it for folders or bulk actions on a selection; use the asset-manager template.
- Do not omit `columns`; the table renders only the columns it is given.

## Minimal example

From [`examples/resource-manager.tsx`](examples/resource-manager.tsx), which the test suite renders and checks with axe.

```tsx
import { GdsResourceManagerTemplate } from '@sovereignsquad/gds-core';

const rows = [
  { id: 'r1', name: 'Main hall', status: 'Available' },
  { id: 'r2', name: 'Studio B', status: 'Booked' },
];

export default function ResourceManagerExample() {
  return (
    <GdsResourceManagerTemplate
      title="Rooms"
      state="ready"
      rows={rows}
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
      ]}
      getRowKey={(row) => row.id}
      detail="Select a room to see its details."
    />
  );
}
```

## Rollback

Adopt per resource type; no persistence contract is hardcoded into the template.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
