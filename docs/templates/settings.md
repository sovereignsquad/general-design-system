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

## Do

- Give each group an `id`, a `title` and its `fields`; each group is its own panel with an `h2`.
- Put the save action in `actions` and set its `loading` while saving.

## Don't

- Do not pass an empty `groups` list for a page that has settings; it shows a "No settings available" block.
- Do not put a destructive action among the settings fields; use the crud-editor template's destructive zone.

## Minimal example

From [`examples/settings.tsx`](examples/settings.tsx), which the test suite renders and checks with axe.

```tsx
import { GdsSettingsTemplate, TextInput } from '@sovereignsquad/gds-core';

export default function SettingsExample() {
  return (
    <GdsSettingsTemplate
      title="Settings"
      state="ready"
      actions={[{ id: 'save', label: 'Save changes', kind: 'primary', onClick: () => undefined }]}
      groups={[
        { id: 'profile', title: 'Profile', description: 'Shown to other members.', fields: <TextInput label="Display name" defaultValue="Ada" /> },
      ]}
    />
  );
}
```

## Rollback

Consumers can keep route-local settings pages until migration is complete.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
