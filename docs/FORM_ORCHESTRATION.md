# Form Orchestration

Status: Active SSOT
Version: 3.14.12
Last updated: 2026-07-26

`useGdsFormOrchestration` is the canonical runtime contract for advanced GDS forms. It extends the existing `useGdsForm` field/summary model with autosave, optimistic submit, retry, server error mapping, and draft restore behavior.

## Runtime API

- `useGdsFormOrchestration(config)`: advanced form controller.
- `createGdsDraftAdapter(storageKey, storage?)`: typed persistence adapter boundary.
- `GdsValidationSummary`: canonical blocking validation summary alias.
- `GdsFormProvider`, `ValidatedFieldMessage`, and `FormErrorSummary` continue to render summary and field-level messages from the shared snapshot.

## State Model

Submit states:

- `idle`
- `validating`
- `autosaving`
- `saved`
- `submitting`
- `optimistic`
- `success`
- `error`
- `restored`

Field states continue to expose `value`, `touched`, and `dirty`.

## Flow

```text
initialize defaults
  -> track dirty fields
  -> run sync validation
  -> run async validation when blocking sync errors are absent
  -> autosave draft through adapter
  -> submit optimistically or normally
  -> map server errors to field/summary issues
  -> retry or restore draft
```

## Draft Adapter

Draft persistence is an adapter boundary. GDS provides a local-storage compatible factory, but apps own storage security, retention, and authorization policy.

```ts
const draftAdapter = createGdsDraftAdapter<FormValues>('settings-form-draft');
```

Adapters must avoid secrets and private credentials. Sensitive fields should be excluded by the consumer before saving.

## Accessibility

- `GdsValidationSummary` links blocking errors to field IDs.
- `ValidatedFieldMessage` provides field-level error copy.
- Consumers must set `aria-invalid` and `aria-describedby` on fields when errors are present.
- Status changes such as autosave, failure, and restore must be visible in the form surface.
- Keyboard submit must not duplicate in-flight submits.

## Observability

`onEvent` emits metadata-only events:

- `dirty_changed`
- `validation_failed`
- `autosave_succeeded`
- `submit_failed`
- `retry_succeeded`
- `draft_restored`

Events include status, timestamp, and `privacy: "metadata-only"`. Do not attach form values or secrets.

## Server Errors

Use `mapServerErrors(error)` to convert API failures into field or form-level blocking issues:

```ts
mapServerErrors: () => [
  { field: 'title', message: 'Use a unique title.' },
]
```

Omit `field` for form-level errors.

## Rollback

The orchestration hook is additive. Existing `useGdsForm`, `GdsFormProvider`, `FormErrorSummary`, and `ValidatedFieldMessage` consumers continue to work.

## Testing

Required coverage:

- reducer dirty/touched transitions
- sync and async validation failures
- autosave success
- server error mapping
- retry after failed submit
- draft restore/discard
- validation summary links

Repository verification:

```bash
npm run build
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:release
```
