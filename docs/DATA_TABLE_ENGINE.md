# Data Table Engine

Status: Active SSOT
Version: 3.15.0
Last updated: 2026-07-26

The GDS data table engine provides a headless state contract and a governed visual table for operational products. It covers local and remote data adapters, sorting, filtering, pagination, selection, export requests, mobile cards, loading/error/empty states, and virtualized row windows.

## Runtime API

- `createGdsTableAdapter(rows, columns)`: local in-memory adapter with deterministic filtering, sorting, and pagination.
- `useGdsDataTable(config)`: headless controller for query state, loading, selection, retry, and export.
- `GdsDataTable`: package-owned visual table using semantic headers, captions, row selection, search, pagination, export, state blocks, and mobile row cards.
- `serializeGdsTableQuery(query)`: stable query serialization for remote adapters and logs.

## Adapter Contract

```ts
const adapter = {
  mode: 'remote',
  load: async (query, signal) => fetchRows(query, { signal }),
}
```

Remote adapters must honor `AbortSignal` when possible. GDS aborts stale requests on query changes and uses the visible retry action after terminal load failures.

## UX States

- `loading`
- `refreshing`
- `empty`
- `filtered-empty`
- `error`
- `partial`
- `ready`
- `exporting`

Existing table components remain supported. New products should prefer the engine when they need shared query, selection, export, and recovery behavior.

## Accessibility

- Tables include a caption.
- Sortable headers expose `aria-sort`.
- Row and visible-bulk selection controls have accessible names.
- Columns with `interactive: true` mark grid cells that contain nested controls. Cell focus stays roving with arrow keys; `Enter` or `F2` enters the first button/link/input in the cell; `Escape` returns focus to the grid cell.
- Mobile cards keep row names and key fields visible without horizontal traps.
- Virtualized windows announce the rendered row count.

## Observability

`onEvent` emits metadata-only events:

- `load_started`
- `load_failed`
- `filter_changed`
- `sort_changed`
- `selection_changed`
- `export_requested`

Events never include row values, private records, or secrets.

## Rollback

The table engine is additive. `SimpleDataTable`, `AdvancedDataTable`, `ListingProvider`, and listing primitives remain available while consumers migrate gradually.

## Verification

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```
