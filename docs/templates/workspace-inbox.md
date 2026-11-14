# Workspace inbox template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsWorkspaceInboxTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `workspace-inbox`

Inbox with workspace navigation, a thread list and a conversation pane; list then detail on narrow viewports.

## Required data

- threads
- open thread
- messages of the open thread

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

- `SidebarNav`
- `GdsThreadList`
- `GdsMessageThread`
- `StateBlock`

## Task patterns

- `review-submission`

## Accessibility

- labelled navigation, list and conversation regions
- focus moves to the conversation heading when it opens on a narrow viewport
- back action returns to the list
- messages carry sender and time

## Edge cases

- empty inbox
- no conversation selected
- conversation loading
- conversation load error
- long thread
- narrow viewport

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Do

- Set `hasSelection` and `detailTitle` when a conversation opens; on a narrow viewport the conversation replaces the list and its heading takes focus.
- Pass `onBack` to clear the selection; the narrow-viewport back action calls it.
- Give the `GdsThreadList` `stateTitleOrder={2}` so its loading, empty and error titles follow the page `h1`.

## Don't

- Do not pass `detail` without `hasSelection`; the pane asks for a selection until it is set.
- Do not import it from the `/server` entry; it is a client component.

## Minimal example

From [`examples/workspace-inbox.tsx`](examples/workspace-inbox.tsx), which the test suite renders and checks with axe.

```tsx
import { GdsThreadList, GdsWorkspaceInboxTemplate } from '@sovereignsquad/gds-core';

export default function WorkspaceInboxExample() {
  return (
    <GdsWorkspaceInboxTemplate
      title="Inbox"
      state="ready"
      threadList={<GdsThreadList ariaLabel="Conversations" threads={[{ id: 't1', title: 'Venue booking', preview: 'Is Friday still free?' }]} stateTitleOrder={2} />}
      hasSelection={false}
    />
  );
}
```

## Rollback

Adopt per inbox route; the thread list and conversation slots accept existing components.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
