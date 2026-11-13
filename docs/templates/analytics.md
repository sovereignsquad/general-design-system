# Analytics template

Generated from `getGdsPageTemplates()` (`packages/gds-core/src/GdsPageTemplates.tsx`) by `scripts/generate-page-template-docs.mjs`. Edit the template config, not this file.

- Export: `GdsAnalyticsTemplate` from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`
- Template id: `analytics`

Reporting page with metrics, chart slot, table fallback, empty data, and retry states.

## Required data

- period
- metrics
- chart or table data

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

- `MetricCard`
- `GdsChart`
- `SimpleDataTable`
- `StateBlock`

## Task patterns

- `review-submission`

## Accessibility

- non-color-only data summary
- table fallback
- heading hierarchy
- empty data copy

## Edge cases

- analytics no data
- chart adapter unavailable
- long period labels

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Rollback

Keep vendor-specific analytics behind the chart/table slots.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
