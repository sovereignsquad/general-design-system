# Overlay System

Status: Active SSOT
Version: 4.1.2
Last updated: 2026-07-26

`OverlayManagerProvider` is the canonical GDS lifecycle contract for modals, drawers, sheets, popovers, command surfaces, and confirmation overlays. Products must not invent route-local overlay stacks, focus-trap behavior, body-scroll policy, or nested-modal rules.

## Architecture

```text
consumer intent
  -> openOverlay/registerOverlay
  -> stack policy and top-most evaluation
  -> focus return target capture
  -> GDS-rendered surface
  -> close/recovery event
  -> route cleanup or preservation
```

The manager owns stack order, close policy, focus-return metadata, route recovery, single-overlay rollback mode, and metadata-only lifecycle events. Mantine remains the implementation substrate behind GDS wrappers.

## Runtime API

- `OverlayManagerProvider`: provides stack state, default policy, route cleanup, single-overlay fallback, and event hooks.
- `useOverlayManager()`: exposes `stack`, `registerOverlay`, `unregisterOverlay`, `openOverlay`, `closeOverlay`, `requestClose`, `isTopMost`, and `getOverlay`.
- `GdsModal`: governed modal wrapper with stack registration, focus return, escape/outside policy, and motion timing.
- `GdsDrawer`: governed drawer wrapper with stack registration, route recovery, focus return, mobile-fullscreen policy, and motion timing.
- `GdsSheet`: bottom-sheet drawer alias with mobile-fullscreen policy.

## Decision Matrix

- Use `GdsModal` for blocking decisions, confirmations, short forms, and focused edits.
- Use `GdsDrawer` for secondary detail/edit panels that preserve page context.
- Use `GdsSheet` for mobile-first bottom surfaces and task panels.
- Use `CommandPalette` for keyboard-first global actions.
- Use inline expansion instead of overlays for simple disclosure content.
- Use a page route instead of an overlay when the task has deep navigation, long forms, or durable URL state.

## Policy

`GdsOverlayPolicy` controls:

- `closeOnEscape`
- `closeOnOutsideClick`
- `allowNested`
- `routeChange`: `close`, `preserve`, or `recover`
- `mobileFullscreen`
- `returnFocus`

Nested overlays are disallowed by default. If a nested confirmation is necessary, set `allowNested: true` on the nested surface and keep the confirmation short, labelled, and reversible where possible.

## UX States

Required states:

- `opening`
- `open`
- `nested`
- `closing`
- `blocked-close`
- `route-recovery`
- `mobile-fullscreen`

Blocked close states must be observable and recoverable. Unsaved work must not disappear because of escape, outside click, or route change without a governed confirmation path.

## Accessibility

- All rendered surfaces must have a labelled title.
- Modal and drawer wrappers use Mantine focus traps through GDS APIs.
- `aria-modal` behavior comes from Mantine-backed surfaces; do not bypass it with raw DOM overlays.
- Focus return is enabled by default and uses `invokerId` when provided.
- Escape behavior must be explicit through policy.
- Reduced-motion timing uses GDS motion presets.
- Route recovery must not leave hidden focus traps or stale body-scroll locks.

## Observability

`onOverlayEvent` receives metadata-only events:

- `overlay_opened`
- `overlay_closed`
- `escape_close`
- `blocked_close`
- `route_recovered`

Events include `id`, `kind`, optional close `reason`, status, timestamp, and `privacy: "metadata-only"`. Do not attach user-entered form content, secrets, credentials, or domain payloads.

## Route Recovery

Pass `routeKey` to `OverlayManagerProvider` when the host router can expose location state:

```tsx
<OverlayManagerProvider routeKey={pathname} onOverlayEvent={recordOverlayEvent}>
  {children}
</OverlayManagerProvider>
```

On route changes:

- `close` clears the overlay from the stack.
- `recover` emits `route_recovered` and clears the overlay from the stack.
- `preserve` keeps the overlay registered.

Controlled consumers remain responsible for changing their own `opened` state in router effects when they need visual closure. The manager provides deterministic recovery evidence and removes stale lifecycle ownership.

## Rollback

Set `singleOverlayMode` to force one registered overlay at a time:

```tsx
<OverlayManagerProvider singleOverlayMode>
  {children}
</OverlayManagerProvider>
```

This is the supported rollback path if an adopter discovers nested overlay behavior during migration. Existing `registerOverlay`, `unregisterOverlay`, `requestClose`, and `isTopMost` APIs remain compatible.

## Testing

Required coverage:

- top-most close policy
- blocked escape/outside close
- focus return to invoking control
- route recovery event
- mobile-fullscreen sheet/drawer policy
- command palette keyboard open/close behavior
- reduced-motion timing through GDS motion presets

Repository verification:

```bash
npm run build
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:release
```
