# Tutorial: Build a CRUD Admin Screen with GDS Primitives

Status: Active
Last updated: 2026-07-24

Every other GDS doc is a **reference** (Runtime API / Contract / States /
Accessibility). This one is a **tutorial**: it walks, in order, through building
one realistic CRUD admin screen — a "Listings" manager — by assembling the
governed resource, form, table, and shell primitives that ship in the packages.

By the end you will have a screen that lists records, opens a detail/edit form,
creates and updates through a typed adapter, and lives inside a governed admin
shell — with loading, empty, error, and permission states handled for you.

> The code in this tutorial is typechecked against the current GDS API surface
> (`@sovereignsquad/gds-core` + `@sovereignsquad/gds-admin`). Each snippet builds
> on the previous one; the final `ListingsAdminScreen` is the whole screen.

The building blocks, and where they come from:

| Piece | Import | Role |
| --- | --- | --- |
| `GdsResourceManager` | `@sovereignsquad/gds-core` | List + detail surface driven by a typed adapter |
| `GdsResourceAdapter` | `@sovereignsquad/gds-core` | Your CRUD contract (`list`/`detail`/`create`/`update`/`delete`/`getPermissions`) |
| `GdsSchemaForm` | `@sovereignsquad/gds-core` | Schema-driven create/edit form |
| `GdsTableColumn` | `@sovereignsquad/gds-core` | Column contract for the manager's list |
| `AppShell` | `@sovereignsquad/gds-admin` | Admin page frame (header + navigation + main) |

You can also import every one of these from the umbrella `@sovereignsquad/gds`
package; this tutorial uses the per-package paths to make each piece's home
obvious.

---

## Step 1 — Define the record and its resource adapter

`GdsResourceManager` never talks to your backend directly. It talks to a
`GdsResourceAdapter<T>` — a plain object of async methods you implement. Your
record type must extend `GdsResourceRecord` (which requires `id` and `title`).

```tsx
import type { GdsResourceAdapter, GdsResourceRecord } from '@sovereignsquad/gds-core';

interface Listing extends GdsResourceRecord {
  id: string;
  title: string;
  region: string;
  status: 'draft' | 'published' | 'archived';
  updatedAt?: string;
}

const listingsAdapter: GdsResourceAdapter<Listing> = {
  list: async (signal) => {
    const res = await fetch('/api/listings', { signal });
    return (await res.json()) as Listing[];
  },
  detail: async (id, signal) => {
    const res = await fetch(`/api/listings/${id}`, { signal });
    return res.ok ? ((await res.json()) as Listing) : null;
  },
  create: async (values) => {
    const res = await fetch('/api/listings', { method: 'POST', body: JSON.stringify(values) });
    return (await res.json()) as Listing;
  },
  update: async (id, values) => {
    const res = await fetch(`/api/listings/${id}`, { method: 'PATCH', body: JSON.stringify(values) });
    return (await res.json()) as Listing;
  },
  delete: async (id) => {
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
  },
  // Permissions are computed per record; the manager hides/disables the actions
  // it is told the current user cannot take.
  getPermissions: (resource) => [
    { action: 'edit', allowed: resource?.status !== 'archived' },
    { action: 'delete', allowed: resource?.status === 'draft', reason: 'Only drafts can be deleted' },
  ],
};
```

Only `list` is required; `detail`, `create`, `update`, `delete`, `activate`,
`archive`, `copyPreview`, and `getPermissions` are all optional — implement only
the operations your resource supports, and the manager adapts.

> **Prototyping shortcut:** `createGdsResourceAdapter<Listing>(seedRows)` (also
> from `@sovereignsquad/gds-core`) returns a complete in-memory adapter so you
> can build the screen before the backend exists, then swap in the real one.

---

## Step 2 — Wire the create/edit form with `GdsSchemaForm`

Describe the form as data — a `GdsFormSchema` — rather than hand-writing inputs.
Every field needs a `name`, `type`, `label`, and `i18nKey` (see the i18n note at
the end); `options` are required for `select` fields.

```tsx
import { GdsSchemaForm, type GdsFormSchema } from '@sovereignsquad/gds-core';

const listingSchema: GdsFormSchema = {
  id: 'listing',
  title: 'Listing',
  fields: [
    { name: 'title', type: 'text', label: 'Title', i18nKey: 'listing.title', required: true },
    {
      name: 'region', type: 'select', label: 'Region', i18nKey: 'listing.region', required: true,
      options: [{ label: 'Europe', value: 'eu' }, { label: 'United States', value: 'us' }],
    },
    {
      name: 'status', type: 'select', label: 'Status', i18nKey: 'listing.status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
};

function ListingForm({ onSave }: { onSave: (values: Partial<Listing>) => Promise<void> }) {
  return (
    <GdsSchemaForm
      schema={listingSchema}
      submitLabel="Save listing"
      onSubmit={(values) => onSave(values as Partial<Listing>)}
    />
  );
}
```

`GdsSchemaForm` validates required fields, renders the governed control per field
`type`, and surfaces its own submitting/error states — you supply the schema and
the `onSubmit` handler.

> Already have a JSON Schema, OpenAPI doc, or Zod object? Use
> `createGdsFormFromSchema(source, { adapter: 'json-schema' | 'openapi' | 'zod' })`
> to generate the `GdsFormSchema` instead of writing `fields` by hand.

---

## Step 3 — Wire the list/detail surface with `GdsResourceManager`

`GdsResourceManager` composes the adapter, a list, the detail pane, the governed
action set, and all async states. Give it typed `columns` and a `renderDetail`
that mounts the form from Step 2.

```tsx
import { GdsResourceManager, type GdsTableColumn } from '@sovereignsquad/gds-core';

const columns: GdsTableColumn<Listing>[] = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'region', label: 'Region', filterable: true },
  { key: 'status', label: 'Status' },
];

function ListingsManager() {
  return (
    <GdsResourceManager<Listing>
      title="Listings"
      description="Create, edit, publish, and archive partner listings."
      adapter={listingsAdapter}
      columns={columns}
      renderDetail={(listing) => (
        <ListingForm onSave={async (values) => { await listingsAdapter.update?.(listing.id, values); }} />
      )}
    />
  );
}
```

The manager renders loading, empty, error, and permission states from the
adapter's responses and `getPermissions` — you do not wire spinners or empty
placeholders yourself.

> **List-only alternative:** if you only need a responsive table (no adapter-driven
> detail pane), use `ResponsiveDataView` from `@sovereignsquad/gds-admin` with
> `data`, `columns` (`{ key, label, render? }`), and a `renderCard` for the mobile
> layout, or `AdminDataTable` for a sortable admin table with a required
> `getRowKey`.

---

## Step 4 — Frame the page in an admin shell

Wrap the manager in `AppShell` (from `@sovereignsquad/gds-admin`) for the governed
header + navigation + main-landmark chrome. `children` is the only required prop.

```tsx
import { AppShell } from '@sovereignsquad/gds-admin';

export function ListingsAdminScreen() {
  return (
    <AppShell logoText="Admin" headerContext="Listings">
      <ListingsManager />
    </AppShell>
  );
}
```

That is the whole screen. `AppShell` is the admin compatibility shell; for new
sidebar-first apps you can use `DiscoveryShell` directly. If you want a
metrics-led dashboard framing instead of the shell, the
`GdsAdminDashboardTemplate` / `GdsResourceManagerTemplate` page templates (from
`@sovereignsquad/gds-core`, see [`PAGE_TEMPLATES.md`](PAGE_TEMPLATES.md)) accept
the same `title`/`description`/`state`/`actions` contract.

---

## Step 5 — The obligations that come with it

Building on governed primitives is not a free pass on the cross-cutting contracts:

- **Internationalization.** Every field carries an `i18nKey`, and any string you
  render yourself must go through `useGdsTranslation().t(key, englishDefault)` —
  never a bare literal. New keys must be added to **all 12 locale packs** in
  `packages/gds-core/src/locales/` with full parity, or `verify:i18n-message-parity`
  fails. See [`CONTRIBUTING.md`](../CONTRIBUTING.md)'s "Adding a Component or
  Pattern" section.
- **Accessibility.** The manager, form, and shell carry their own landmark,
  heading, and state semantics — but you still own meaningful `title`/`label`
  copy and a single `<h1>` per route (`PageTitle`). Don't bypass the governed
  states with ad-hoc spinners; the empty/error/permission surfaces are the
  accessible path.
- **Testing.** Cover the screen with `renderWithGds` (from `test-utils/render`,
  which wires the provider and router) and assert the states your adapter can
  return — at least the empty list and one create/update round-trip. See
  `GdsResourceManager`'s coverage in `packages/gds-core/src/core.test.tsx` for
  the pattern.
- **Definition of Done.** Per the [Standing Operating Rules](../CONTRIBUTING.md),
  the screen ships with tests, updated docs, and a clean `verify:release`.

---

## Where to go next

- [`PATTERN_SERVICE_MODEL.md`](../PATTERN_SERVICE_MODEL.md) — how patterns like
  these are promoted and governed across projects.
- [`docs/RESOURCE_MANAGER.md`](RESOURCE_MANAGER.md),
  [`docs/SCHEMA_FORMS.md`](SCHEMA_FORMS.md),
  [`docs/PAGE_TEMPLATES.md`](PAGE_TEMPLATES.md) — the deep reference contracts for
  each primitive used above.
- [`COMPONENTS_AND_PATTERNS.md`](../COMPONENTS_AND_PATTERNS.md) — the canonical
  behavior contracts for every component.
