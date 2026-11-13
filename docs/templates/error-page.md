# Error page template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsErrorPageTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `error-page`

Semantic error, not-found, and permission-denied page with explicit recovery actions.

## Required data

- error class
- recovery action availability

## States

- `error`
- `permission-denied`
- `not-found`
- `retrying`

## Component contracts

- `StateBlock`
- `AsyncSurface`
- `StatusBadge`

## Task patterns

- `confirm-destructive-action`

## Accessibility

- main landmark
- semantic heading
- recovery action label
- status text

## Edge cases

- retry unavailable
- permission denied
- unknown route

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Replace route error pages one at a time; no routing adapter is required.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
