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

## Do

- Put the first step, such as creating the first item, in `actions`.
- Pass an `illustration` only when it adds meaning; it renders above the heading.

## Don't

- Do not use it for one empty section inside a page; use `StateBlock`.
- Do not omit `description` when the next step is not obvious from the title.

## Minimal example

From [`examples/empty-state-page.tsx`](examples/empty-state-page.tsx), which the test suite renders and checks with axe.

```tsx
import { GdsEmptyStateTemplate } from '@sovereignsquad/gds-core';

export default function EmptyStatePageExample() {
  return (
    <GdsEmptyStateTemplate
      title="No projects yet"
      description="Create a project to start tracking work."
      actions={[{ id: 'create', label: 'Create project', kind: 'primary', onClick: () => undefined }]}
    />
  );
}
```

## Rollback

Replace blank pages and static placeholders route by route when recovery actions are ready.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
