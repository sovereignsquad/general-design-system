# Resource Manager

Status: Active SSOT
Version: 3.14.17
Last updated: 2026-07-26

The GDS resource manager is the package-native workflow framework for admin CRUD resources. It composes list, detail, create, edit, delete, activate, archive, and copy-preview behavior through an adapter boundary while using GDS table, state, action, and accessibility primitives.

## Runtime API

- `createGdsResourceAdapter(resources)`: local in-memory adapter for fixtures, demos, tests, and simple admin resources.
- `useGdsResourceManager(config)`: headless workflow controller for list/detail/action state.
- `GdsResourceManager`: governed visual resource workflow using `GdsDataTable`, state blocks, action buttons, and detail sections.

## Adapter Contract

Adapters isolate app-owned persistence and authorization:

```ts
const adapter = {
  list: async (signal) => fetchResources({ signal }),
  detail: async (id, signal) => fetchResource(id, { signal }),
  update: async (id, values, idempotencyKey) => saveResource(id, values, idempotencyKey),
  delete: async (id, idempotencyKey) => deleteResource(id, idempotencyKey),
  getPermissions: (resource) => permissionsFor(resource),
}
```

Mutation methods receive idempotency keys where relevant. Remote adapters should honor `AbortSignal` for list/detail loading.

## Workflow States

- `loading-list`
- `empty`
- `ready`
- `detail-loading`
- `editing`
- `saving`
- `deleting`
- `activating`
- `permission-denied`
- `stale-data`
- `error`

## Permissions And Confirmation

`getPermissions(resource)` controls action availability. Destructive actions (`delete`, `archive`) require `confirmAction`; without confirmation the manager emits `permission_denied` and leaves the resource unchanged.

## Observability

`onEvent` emits metadata-only events:

- `resource_loaded`
- `action_started`
- `action_failed`
- `action_completed`
- `permission_denied`

Events never include resource payloads, private data, credentials, or secrets.

## Accessibility

- List/detail navigation is keyboard reachable through standard buttons and table controls.
- Action buttons have visible labels.
- Detail sections receive an accessible label from the resource title.
- Permission-denied and workflow errors render visible status copy.

## Rollback

The framework is additive. Existing `AdminResourceManager`, resource-specific pages, and custom admin routes can migrate one resource type at a time.

## Verification

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```
