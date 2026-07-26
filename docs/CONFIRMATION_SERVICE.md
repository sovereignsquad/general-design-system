# Confirmation Service

Status: Active SSOT
Version: 3.14.8
Last updated: 2026-07-26

`GdsConfirmProvider` is the canonical GDS runtime for confirmation and destructive action workflows. Products must use it instead of `window.confirm`, ad hoc modals, route-local destructive buttons, or custom undo toast systems.

## Architecture

```text
invoking control
  -> confirmAction(request)
  -> target/risk validation
  -> governed ConfirmDialog
  -> async executor with timeout
  -> success/failure/retry/undo state
  -> focus return and metadata-only event
```

The provider owns focus return, dialog rendering, risk state, async pending state, retry affordance, undo window display, and metadata-only events. App-owned persistence, permissions, domain deletion logic, and analytics transport stay behind typed callbacks.

## Runtime API

Existing compatibility APIs remain:

- `confirm(request): Promise<boolean>`
- `confirmDestructive(request): Promise<boolean>`

The production action API is:

```tsx
const result = await confirm.confirmAction({
  id: 'delete-project',
  title: 'Delete project',
  message: 'This removes the project from the workspace.',
  targetName: 'Launch plan',
  payload: { id: 'project-1' },
  riskLevel: 'critical',
  retryable: true,
  execute: deleteProject,
  timeoutMs: 10000,
  undo: {
    windowMs: 5000,
    label: 'Undo delete',
    onUndo: restoreProject,
  },
});
```

## Contracts

- `GdsConfirmationRequest<TPayload>`: typed payload, risk copy, validation, executor, timeout, retry, and undo policy.
- `GdsRiskLevel`: `low`, `medium`, `high`, or `critical`.
- `GdsDestructiveActionResult<TPayload>`: `cancelled`, `succeeded`, `failed`, or `undoable` result with payload and undo deadline where relevant.
- `GdsUndoPolicy<TPayload>`: bounded recovery window and caller-owned undo callback.
- `GdsConfirmationEvent`: metadata-only observability event.

## UX States

Required states:

- `idle`
- `open`
- `validating`
- `executing`
- `succeeded`
- `failed`
- `undoable`
- `cancelled`

Users must see the target object, risk copy, consequence, current pending/failure state, and available recovery path before and after committing.

## Risk Copy

Risk copy must include:

- action verb
- target name
- consequence
- recovery path, if any
- non-retryable reason when retry is not available

Do not use vague labels such as "Are you sure?" without target and consequence.

## Accessibility

- The confirmation surface uses a labelled dialog.
- Escape/cancel resolves as `cancelled`.
- Primary action shows loading during validation/execution.
- Failure is announced with an alert inside the dialog.
- Focus returns to the invoking control after cancel, success, or undoable completion.
- Undo is exposed as a labelled button inside a status region.
- Native browser confirmation dialogs are prohibited because they cannot satisfy the GDS copy, focus, retry, undo, and event contract.

## Observability

`onConfirmationEvent` receives metadata-only events:

- `opened`
- `cancelled`
- `confirmed`
- `failed`
- `retry`
- `undo_started`
- `undo_completed`

Events include request `id`, risk level, status, timestamp, and `privacy: "metadata-only"`. Do not attach payload content, secrets, credentials, or private form values.

## Retries And Timeouts

`execute` is wrapped with `timeoutMs` or the provider `defaultTimeoutMs`. Failures keep the dialog open with failure copy. If `retryable` is true, the primary action can be pressed again to retry and emits `retry`.

Validation runs before execution. `validateTarget` may return:

- `true` to continue
- `false` for generic validation failure
- a string for user-facing failure copy

## Undo

Undo is available only when a request supplies `undo`. The provider renders a bounded recovery status region until the window expires. Undo callbacks are caller-owned and must be idempotent where possible.

## Rollback

The old `confirm()` and `confirmDestructive()` APIs remain intact. Consumers can adopt `confirmAction()` incrementally and pin the previous package version if an additive adoption creates release risk.

## Testing

Required coverage:

- focus return
- async success
- async failure
- retry after failure
- undo window and undo callback
- cancellation
- metadata-only event emission
- timeout behavior

Repository verification:

```bash
npm run build
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:release
```
