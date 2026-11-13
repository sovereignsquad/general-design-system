# Public event template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsPublicEventTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `public-event`

Public event page with hero media slot, event metadata, registration, and no-media recovery.

## Required data

- event title
- date/time
- registration state

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

- `PublicShell`
- `MediaCard`
- `ShareButtonGroup`
- `StateBlock`

## Task patterns

- `copy-public-link`

## Accessibility

- public main landmark
- event time text
- media alternative slot
- named CTA

## Edge cases

- public event no media
- registration closed
- not found
- timezone copy

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Adopt per public route without changing event storage or registration adapters.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
