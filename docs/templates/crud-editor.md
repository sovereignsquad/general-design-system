# CRUD editor template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsCrudEditorTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `crud-editor`

Edit surface that composes governed forms, summaries, saving states, and destructive zones.

## Required data

- form contract
- submit action
- validation state

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

- `GdsSchemaForm`
- `GdsValidationSummary`
- `SectionPanel`
- `AsyncSurface`

## Task patterns

- `create-resource`
- `confirm-destructive-action`

## Accessibility

- form labels
- validation summary
- status announcements
- destructive confirmation boundary

## Edge cases

- server validation
- dirty draft restore
- permission denied
- save timeout

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Do

- Pass the form as `form`; it renders in the "Editor" panel.
- Put delete and other irreversible actions in `destructiveZone`, a separate "Destructive actions" panel.

## Don't

- Do not put irreversible actions in the page `actions` next to save.
- Do not use it for a list of records; use the resource-manager template.

## Minimal example

From [`examples/crud-editor.tsx`](examples/crud-editor.tsx), which the test suite renders and checks with axe.

```tsx
import { Button, GdsCrudEditorTemplate, TextInput } from '@sovereignsquad/gds-core';

export default function CrudEditorExample() {
  return (
    <GdsCrudEditorTemplate
      title="Edit room"
      state="ready"
      summary="Main hall, capacity 120."
      form={<TextInput label="Room name" defaultValue="Main hall" />}
      destructiveZone={<Button color="red" variant="light">Delete room</Button>}
      actions={[{ id: 'save', label: 'Save', kind: 'primary', onClick: () => undefined }]}
    />
  );
}
```

## Rollback

Keep existing editor routes beside this template until schema/form adapters are ready.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
