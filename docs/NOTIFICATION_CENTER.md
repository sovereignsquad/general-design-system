# Notification Center

Status: Active SSOT
Version: 5.0.2
Last updated: 2026-08-08

`GdsNotificationProvider` is the canonical GDS runtime for cross-surface feedback. Products must use it instead of route-local toast stacks, local live regions, custom retry buttons, or analytics-specific notification wrappers.

## Architecture

```text
Consumer intent
  -> notify(message, policy)
  -> provider normalization
  -> queue dedupe and timeout policy
  -> GdsNotificationCenter visual output
  -> aria-live announcement behavior
  -> metadata-only audit event
```

The provider owns queue state, deterministic replacement by `id` or `key`, persistence rules, screen-reader announcements, retry execution, dismissal, and audit events. App-owned storage, authorization, analytics transport, and domain recovery logic stay behind callbacks.

## Runtime API

- `GdsNotificationProvider` wraps the app or route surface and accepts `defaultPolicy`, `disabled`, and `onAuditEvent`.
- `useGdsNotifications()` exposes `notify`, `updateNotification`, `dismissNotification`, `runRetry`, `runAction`, `dismiss`, `clear`, and the current queue.
- `GdsNotificationCenter` and `NotificationCenter` render the governed visual queue.
- `NotificationCenterView` is the server-safe rendering contract for package-owned composition.
- `createGdsNotificationId(prefix)` creates stable-enough runtime IDs for transient notifications.
- `getGdsNotificationLivePolicy(message)` resolves polite/assertive/off announcement policy.
- `createGdsNotificationAuditEvent(type, notification, metadata)` emits metadata-only evidence.

## Contracts

Primary contracts:

- `GdsNotificationMessage`: `id`, optional `key`, `title`, `message`, `severity`, `status`, `persistence`, `live`, `autoCloseMs`, `actions`, `retry`, and timestamps.
- `GdsNotificationAction`: labelled action with `id`, `label`, `onClick`, and optional `disabled`.
- `GdsNotificationRetryPolicy`: caller-owned async retry callback with `maxAttempts`, `timeoutMs`, and label.
- `GdsNotificationPolicy`: queue-level `dedupe`, `autoCloseMs`, `persistence`, and live-region defaults.
- `GdsNotificationAuditEvent`: metadata-only event. It must not contain user-entered content, secrets, credentials, or domain payloads.

## Severity And State Policy

- `info`: neutral user-visible status; polite announcement.
- `success`: completed action; transient by default when `autoCloseMs` is set.
- `warning`: recoverable concern; assertive announcement.
- `error`: failed operation; persistent by default unless the caller explicitly resolves it.
- `loading`: pending work; never auto-closes while loading.
- `neutral`: secondary operational notice.

Required statuses are `shown`, `loading`, `retrying`, `failed`, `succeeded`, and `dismissed`.

Persistence rules:

- `transient` can auto-close when `autoCloseMs` is a positive number and severity/status are not critical.
- `persistent` remains visible until dismissed or updated.
- `critical` must remain visible and must not auto-close.
- `announcement-only` is delivered through the live region and is not rendered in the visible center.

## UX States

Every notification must make the current state and next action explicit:

- success: confirm what completed
- error: explain recovery, not only failure
- warning: explain user impact
- loading/retrying: use visible pending status
- persistent/critical: keep dismissal under user control
- announcement-only: use only for non-blocking state changes that should not interrupt layout

Buttons must use GDS actions and labels. Long messages must remain readable inside `GdsNotificationCenter`; do not inject route-local CSS to force width, color, radius, or layout.

## Accessibility

- Error and warning notifications resolve to assertive live behavior.
- Info, success, neutral, and announcement-only messages resolve to polite live behavior unless overridden.
- Visual notifications render semantic alert/status regions with atomic announcements.
- Announcement-only messages use the provider live region without adding duplicate visible text.
- Dismiss, action, and retry controls are keyboard reachable and labelled.
- Critical content must not disappear on a timer.
- Focus stays on the activating control unless a consumer-owned action opens a separate governed surface.
- Forced-colors and high-contrast behavior must come from GDS/Mantine tokens, not raw local color styles.

## Observability

`onAuditEvent` receives metadata-only events:

- `shown`
- `updated`
- `dismissed`
- `cleared`
- `action_clicked`
- `retry_started`
- `retry_failed`
- `retry_succeeded`

Audit payloads identify notification `id`, optional `key`, severity, status, timestamp, optional `actionId`, optional `retryAttempt`, and `privacy: "metadata-only"`. Analytics adapters may forward these events, but they must not enrich them with secrets or private user content.

## Retries And Timeouts

Retry behavior is caller-owned but provider-governed:

```tsx
notify({
  id: 'publish-failed',
  key: 'publish-current-document',
  title: 'Publish failed',
  message: 'Retry publishing when the connection returns.',
  severity: 'error',
  autoCloseMs: false,
  retry: {
    label: 'Retry publish',
    maxAttempts: 3,
    timeoutMs: 10000,
    onRetry: publishAgain,
  },
});
```

The provider sets `retrying`, emits `retry_started`, calls the async retry, then updates to `succeeded` or `failed`. Failed retries remain persistent. Reaching `maxAttempts` emits terminal failure.

## Rollback And Recovery

Set `disabled` on `GdsNotificationProvider` to preserve the typed API and audit/live-region behavior while suppressing visual queue output:

```tsx
<GdsNotificationProvider disabled onAuditEvent={recordNotificationEvent}>
  {children}
</GdsNotificationProvider>
```

This is the supported rollback path for a host app that needs to temporarily disable visual notifications during an incident or adoption migration. Consumers can also pin the previous package version if an additive API adoption causes release risk.

## Testing

Required coverage:

- queue dedupe by `id` and `key`
- `updateNotification` state transitions
- timeout policy for transient versus persistent/critical messages
- announcement-only screen-reader fixture
- retry success, retry failure, and retry limit behavior
- `action_clicked` and retry audit event emission
- disabled provider no-op visual output

Repository verification:

```bash
npm run build
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:release
```

## Edge Cases

- Duplicate notifications must resolve by documented `dedupe` behavior.
- Route changes should keep provider placement stable at the app shell when feedback must survive navigation.
- Offline retry belongs in caller retry logic; the provider controls attempts, timeout, and user-visible status.
- Concurrent actions must use distinct action IDs.
- Long localized copy must be allowed to wrap inside the governed center.
