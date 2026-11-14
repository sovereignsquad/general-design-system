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

## Do

- Pass `when` already formatted for the reader's locale; the template renders it as given.
- Pass the sign-up control as `registration`; a divider separates it from `details`.

## Don't

- Do not repeat the date and place in `details`; `when` and `location` render in the event header row.
- Do not treat `media` as required; without it the page shows a "No image" block and stays readable.

## Minimal example

From [`examples/public-event.tsx`](examples/public-event.tsx), which the test suite renders and checks with axe.

```tsx
import { BodyText, Button, GdsPublicEventTemplate } from '@sovereignsquad/gds-core';

export default function PublicEventExample() {
  return (
    <GdsPublicEventTemplate
      title="Spring meetup"
      state="ready"
      when="12 April, 18:00"
      location="Main hall"
      details={<BodyText>Talks and open discussion.</BodyText>}
      registration={<Button>Register</Button>}
    />
  );
}
```

## Rollback

Adopt per public route without changing event storage or registration adapters.

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
