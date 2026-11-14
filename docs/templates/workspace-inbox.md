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

## Rollback

Adopt per inbox route; the thread list and conversation slots accept existing components.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
