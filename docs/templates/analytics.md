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
- `PeriodSelector`
- `GdsAreaChart`
- `GdsLineChart`
- `GdsDataTable`
- `SimpleDataTable`
- `StateBlock`

## Task patterns

- `review-submission`

## Accessibility

- non-color-only data summary
- table fallback
- heading hierarchy
- empty data copy
- chart summaries and data tables for every chart

## Edge cases

- analytics no data
- partial data
- single data point
- large values
- right-to-left locale
- chart adapter unavailable
- long period labels

## Telemetry events

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

## Do

- Pass `rows` and `columns`, or `table`: the table is the accessible alternative to the chart and renders without one.
- Pass several charts as `charts`; two or more share two columns on large screens.

## Don't

- Do not pass `chart` and `charts` together; when `charts` has items, `chart` is not rendered.
- Do not leave the data only in the chart.

## Minimal example

From [`examples/analytics.tsx`](examples/analytics.tsx), which the test suite renders and checks with axe.

```tsx
import { GdsAnalyticsTemplate } from '@sovereignsquad/gds-core';

const rows = [
  { month: 'January', visits: 1200 },
  { month: 'February', visits: 1350 },
];

export default function AnalyticsExample() {
  return (
    <GdsAnalyticsTemplate
      title="Traffic"
      state="ready"
      metrics={[{ label: 'Visits', value: 2550 }]}
      rows={rows}
      columns={[
        { key: 'month', header: 'Month' },
        { key: 'visits', header: 'Visits' },
      ]}
    />
  );
}
```

## Rollback

Keep vendor-specific analytics behind the chart/table slots.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
