# Production Page Templates

Status: package-native runtime contract
Package: `@sovereignsquad/gds-core`  
Issue: `#263`

Production page templates give teams approved full-page starting points instead of route-local layouts. They are additive APIs and do not own persistence, authorization, analytics vendors, or domain business rules.

## Exports

```ts
import {
  GdsAdminDashboardTemplate,
  GdsSettingsTemplate,
  GdsResourceManagerTemplate,
  GdsCrudEditorTemplate,
  GdsAnalyticsTemplate,
  GdsPublicEventTemplate,
  GdsErrorPageTemplate,
  GdsEmptyStateTemplate,
  getGdsPageTemplates,
  getGdsPageTemplate,
  validateGdsPageTemplates,
  createGdsPageTemplateEvent,
} from '@sovereignsquad/gds-core';
```

## Architecture

```text
consumer route intent
  -> GdsPageTemplateConfig registry
  -> typed template props
  -> GDS page frame, header, state gate, slots
  -> GDS primitives only
  -> metadata-only telemetry event contract
  -> app-owned adapter retry/save/recovery
```

The templates compose existing GDS primitives:

- `PageHeader`
- `AsyncSurface`
- `StateBlock`
- `SectionPanel`
- `MetricCard`
- `SimpleDataTable`
- governed action/status contracts

## Template Set

- `GdsAdminDashboardTemplate`
- `GdsSettingsTemplate`
- `GdsResourceManagerTemplate`
- `GdsCrudEditorTemplate`
- `GdsAnalyticsTemplate`
- `GdsPublicEventTemplate`
- `GdsErrorPageTemplate`
- `GdsEmptyStateTemplate`

The registry helpers expose the same eight stable ids:

- `admin-dashboard`
- `settings`
- `resource-manager`
- `crud-editor`
- `analytics`
- `public-event`
- `error-page`
- `empty-state-page`

## Runtime States

Templates accept the shared `GdsPageTemplateState` contract:

- `loading`
- `empty`
- `ready`
- `error`
- `retrying`
- `saving`
- `permission-denied`
- `not-found`

Each state resolves to visible status copy and an accessible fallback surface. Recovery is callback-based through `onRetry` or action slots, so application-owned adapters keep control of retries, timeouts, authorization, and rollback.

## Actions

Actions use `GdsPageTemplateAction`:

```ts
{
  id: 'save',
  label: 'Save changes',
  kind: 'primary',
  disabled: false,
  loading: false,
  onClick: saveSettings,
}
```

> `loading` is the busy-state flag (renders the action disabled with a `…`
> suffix), named for consistency with every other GDS action/button API. The
> older `pending` prop is **deprecated**: it is still honored as an alias for
> `loading` (with a dev-only console warning) and will be removed in a future
> major version — migrate to `loading`. If both are set, `loading` wins.

Action requirements:

- provide a stable `id`
- provide a visible `label`
- expose loading/disabled state through the template props
- route destructive behavior through the confirmation service before execution
- emit metadata-only telemetry from the host, not private resource payloads

## Telemetry

`createGdsPageTemplateEvent(...)` creates privacy-safe event objects:

```ts
createGdsPageTemplateEvent('analytics', 'empty', 'retry_requested', {
  actionId: 'reload-report',
  metadata: { period: '30d', rowCount: 0 },
});
```

Supported event names:

- `page_view`
- `state_visible`
- `action_clicked`
- `retry_requested`

Do not include secrets, user content, raw form values, or private resource bodies.

## Accessibility

Each template renders a `main` landmark, one page `h1`, visible state labels, keyboard reachable actions, and screen-reader-readable recovery copy.

Required consumer checks:

- long localized titles must wrap without pushing actions off screen
- retry and destructive actions must have specific labels
- charts must keep table or text fallback visible
- public event media must not be required for page comprehension
- permission and not-found states must be semantic pages, not blank redirects

## Edge Cases

- Missing metrics or sections show an explicit empty configuration state.
- Resource lists with no rows show an actionable empty state.
- Public events without media stay readable.
- Analytics without chart data keeps the table fallback visible.
- Error pages support retry unavailable by omitting `onRetry`.
- Permission-denied and not-found use the same state contract as data pages.

## Testing

Package tests cover:

- stable registry ids
- required state, telemetry, accessibility, edge-case, rollback fields
- defensive registry cloning
- metadata-only telemetry event creation
- landmarks, headings, actions, state copy, retry behavior, tables, and public-event fallbacks

Run:

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```

## Rollback

These exports are additive. Consumers can pin the previous package version, keep bespoke routes while migrating, or adopt one template per route family without changing storage, authorization, analytics, or business adapters.
