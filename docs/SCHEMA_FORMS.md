# Schema Forms

Status: Active SSOT
Version: 3.14.14
Last updated: 2026-07-26

Schema forms turn existing contracts into governed GDS form models. Use them when a product already has JSON Schema, OpenAPI, or Zod contracts and needs predictable labels, required state, validation, i18n keys, and accessibility wiring.

## Runtime API

- `createGdsFormFromSchema(source, options)`: adapter selector for JSON Schema, OpenAPI, or Zod-like object schemas.
- `jsonSchemaToGdsFormSchema(schema, options?)`: normalizes object JSON Schema contracts.
- `openApiToGdsFormSchema(document, options?)`: extracts a request body or component schema before normalization.
- `zodToGdsFormSchema(schema, options?)`: reads consumer-supplied Zod-like object schemas without adding Zod as a hard dependency.
- `GdsSchemaForm`: renders a generated form through `useGdsFormOrchestration`, `GdsFormProvider`, `GdsValidationSummary`, `FormField`, and `ValidatedFieldMessage`.
- `uploadAdapter`: optional `GdsSchemaUploadAdapter` for schema file-upload fields that must upload immediately and submit upload results instead of raw `File[]` values.

## Support Matrix

- Supported: string, email, URL, password, date, number, integer, boolean, enum/select, `checkbox-group` (grouped multi-select), `repeatable` (repeatable row group), textarea by long `maxLength`, hidden fields, conditional-field metadata, and schema file uploads.
- Requires renderer override: nested objects, `$ref`, `oneOf`, and `anyOf`. (Enum arrays can render as a `checkbox-group`; general arrays of objects use a `repeatable` field — see below.)
- Unsupported schema nodes produce advisory adapter issues and blocking generated-form validation until a renderer override is supplied.

## Grouped and repeatable fields (#437)

Two field types cover shapes that previously forced consumers to drop to plain Mantine:

- **`checkbox-group`** — a grouped multi-select rendered as a `fieldset` of checkboxes, distinct from the single `boolean` checkbox and the `select` dropdown. Choices come from the field's `options`; the value is a `string[]`. `required` means at least one selection. From a JSON Schema, an `enum` renders as a `checkbox-group` (instead of a `select`) when the property carries `x-gds-fieldType: 'checkbox-group'`.
- **`repeatable`** — an "add another row of N fields" primitive. The descriptor carries nested `fields: GdsFieldDescriptor[]`; the value is an array of row objects keyed by those sub-fields. Governed add/remove controls, `minRows`/`maxRows` bounds (`minRows` also seeds the initial row count), and per-row required-sub-field validation are built in. Sub-fields render through the same renderer path (override by sub-field name or type, else the governed default control). Add/remove buttons are labeled with row context, focus moves to the new row on add / the add button on remove, and row-count changes are announced via an `aria-live` region. `addRowLabel`/`removeRowLabel` set the button copy. `repeatable` is intended for hand-authored descriptors; the JSON Schema/OpenAPI/Zod adapters do not auto-build nested `fields`.

Both types flow through the `renderers` override map and `onEvent`. Group- and row-level validation messages surface in `GdsValidationSummary` and at field level via `ValidatedFieldMessage`. The `checkbox-group` renders governed Mantine `Checkbox` controls (so they inherit the GDS theme and forced-colors styling like every other control), and the group/row validation messages, the `repeatable` row-count live announcements, and the `(required)` marker are localized through the `gds.schemaForm.*` message keys (present in all 12 locale packs).

## Accessibility Contract

- Every generated field has a label and deterministic field ID.
- Descriptions and errors use deterministic `aria-describedby` IDs.
- Required fields include visible required copy in the label and native `required` semantics where the input supports it.
- Validation failures render in `GdsValidationSummary` and at field level through `ValidatedFieldMessage`.

## I18n

Each field receives an `i18nKey`. Explicit `x-gds-i18nKey` wins; otherwise GDS generates:

```text
gds.form.{formId}.{fieldName}
```

Generated copy is a fallback. Production products should map these keys through their host i18n system.

## Renderer Overrides

Unsafe or product-specific fields must use explicit renderers:

```tsx
<GdsSchemaForm
  schema={schema}
  onSubmit={save}
  renderers={{
    files: ({ field }) => <UploadDropzone aria-label={field.label} />,
  }}
/>
```

Overrides must still use GDS components and tokens. Do not bypass GDS with route-local visual systems.

## Upload Adapter

When `uploadAdapter` is provided, the default `file-upload` field:

- starts upload immediately after file selection
- renders progress, retry, cancel, and remove controls through `UploadDropzone`
- blocks submit while raw `File` values are still pending
- writes `GdsSchemaUploadResult[]` into form values after upload succeeds

```tsx
<GdsSchemaForm
  schema={schema}
  uploadAdapter={{
    upload: async ({ files, signal, onProgress }) => {
      onProgress(25);
      return uploadFiles(files, { signal });
    },
    remove: async ({ value, signal }) => {
      await removeFiles(value, { signal });
    },
  }}
  onSubmit={save}
/>
```

## Cookbook

Generate and render a form directly from a JSON Schema object:

```tsx
const { schema } = jsonSchemaToGdsFormSchema({
  title: 'Profile',
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', title: 'Email address' },
    startDate: { type: 'string', format: 'date', title: 'Start date' },
    role: { type: 'string', enum: ['Admin', 'Editor'] },
  },
}, { id: 'profile' });

<GdsSchemaForm schema={schema!} onSubmit={saveProfile} />
```

Generate a form from an OpenAPI request-body schema:

```tsx
const { schema } = openApiToGdsFormSchema(openApiDocument, { schemaName: 'Venue' });

<GdsSchemaForm schema={schema!} onSubmit={saveVenue} />
```

Override a renderer-required field (arrays, `$ref`, `oneOf`/`anyOf`) rather
than letting it block submission — must still use GDS components, not a
route-local visual system:

```tsx
<GdsSchemaForm
  schema={schema!}
  onSubmit={saveGallery}
  renderers={{
    gallery: ({ field }) => <UploadDropzone aria-label={field.label} />,
  }}
/>
```

## Observability

Schema adapters emit metadata-only events:

- `schema_parse_failed`
- `unsupported_field`
- `generated_submit_failed`
- `upload_started`
- `upload_progress`
- `upload_succeeded`
- `upload_failed`
- `upload_cancelled`
- `upload_removed`
- `upload_retry_requested`

Payloads never include form values.

## Rollback

Schema-form APIs are additive. Existing manual forms and `useGdsFormOrchestration` consumers remain supported.

## Verification

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```
