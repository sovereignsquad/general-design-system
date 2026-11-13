# Admin dashboard template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsAdminDashboardTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `admin-dashboard`

Operational overview with metrics, sections, loading, empty, error, and retry states.

## Required data

- metrics
- sections
- operator permission

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
- `MetricCard`
- `SectionPanel`
- `AsyncSurface`

## Task patterns

- `review-submission`
- `bulk-approve`

## Accessibility

- main landmark
- single h1
- status copy
- keyboard reachable actions

## Edge cases

- no metrics
- long localized title
- permission denied
- stale loader

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Keep the previous product route while adopting this additive template export.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
