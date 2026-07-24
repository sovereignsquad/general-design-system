'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { GdsDataTable, createGdsTableAdapter, type GdsTableColumn } from './GdsDataTable.client';
import { StateBlock } from './StateBlock';

export type GdsResourceActionId = 'view' | 'create' | 'edit' | 'delete' | 'activate' | 'archive' | 'copy-preview';
export type GdsResourceWorkflowState = 'loading-list' | 'empty' | 'ready' | 'detail-loading' | 'editing' | 'saving' | 'deleting' | 'activating' | 'permission-denied' | 'stale-data' | 'error';

export interface GdsResourceRecord {
  id: string;
  title: string;
  status?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GdsResourcePermission {
  action: GdsResourceActionId;
  allowed: boolean;
  reason?: string;
}

export interface GdsResourceActionResult<T extends GdsResourceRecord> {
  resource?: T;
  stale?: boolean;
  copiedText?: string;
}

export interface GdsResourceAdapter<T extends GdsResourceRecord> {
  list: (signal?: AbortSignal) => Promise<T[]>;
  detail?: (id: string, signal?: AbortSignal) => Promise<T | null>;
  create?: (values: Partial<T>, idempotencyKey?: string) => Promise<T>;
  update?: (id: string, values: Partial<T>, idempotencyKey?: string) => Promise<T>;
  delete?: (id: string, idempotencyKey?: string) => Promise<void>;
  activate?: (id: string, idempotencyKey?: string) => Promise<T>;
  archive?: (id: string, idempotencyKey?: string) => Promise<T>;
  copyPreview?: (id: string) => Promise<string>;
  getPermissions?: (resource: T | null) => GdsResourcePermission[];
}

export interface GdsResourceManagerEvent {
  type: 'resource_loaded' | 'action_started' | 'action_failed' | 'action_completed' | 'permission_denied';
  action?: GdsResourceActionId;
  timestamp: number;
  privacy: 'metadata-only';
  message?: string;
}

export interface UseGdsResourceManagerConfig<T extends GdsResourceRecord> {
  adapter: GdsResourceAdapter<T>;
  onEvent?: (event: GdsResourceManagerEvent) => void;
  timeoutMs?: number;
  confirmAction?: (action: GdsResourceActionId, resource: T | null) => Promise<boolean> | boolean;
}

export interface GdsResourceManagerController<T extends GdsResourceRecord> {
  resources: T[];
  selectedResource: T | null;
  state: GdsResourceWorkflowState;
  error?: string;
  permissions: GdsResourcePermission[];
  loadList: () => void;
  openDetail: (id: string) => Promise<T | null>;
  closeDetail: () => void;
  canRunAction: (action: GdsResourceActionId, resource?: T | null) => GdsResourcePermission;
  runAction: (action: GdsResourceActionId, resource: T | null, values?: Partial<T>) => Promise<GdsResourceActionResult<T> | null>;
}

export interface GdsResourceManagerProps<T extends GdsResourceRecord> extends UseGdsResourceManagerConfig<T> {
  title: string;
  description?: ReactNode;
  columns?: GdsTableColumn<T>[];
  emptyLabel?: string;
  renderDetail?: (resource: T, controller: GdsResourceManagerController<T>) => ReactNode;
}

function emitResourceEvent(onEvent: UseGdsResourceManagerConfig<any>['onEvent'], event: Omit<GdsResourceManagerEvent, 'timestamp' | 'privacy'>) {
  onEvent?.({ ...event, timestamp: Date.now(), privacy: 'metadata-only' });
}

function createIdempotencyKey(action: GdsResourceActionId, id?: string) {
  return `gds-${action}-${id ?? 'new'}-${Date.now()}`;
}

function defaultPermissions<T extends GdsResourceRecord>(resource: T | null): GdsResourcePermission[] {
  const hasResource = Boolean(resource);
  return [
    { action: 'view', allowed: hasResource },
    { action: 'create', allowed: true },
    { action: 'edit', allowed: hasResource },
    { action: 'delete', allowed: hasResource },
    { action: 'activate', allowed: hasResource },
    { action: 'archive', allowed: hasResource },
    { action: 'copy-preview', allowed: hasResource },
  ];
}

export function createGdsResourceAdapter<T extends GdsResourceRecord>(initialResources: T[]): GdsResourceAdapter<T> {
  let resources = [...initialResources];
  return {
    list: async () => [...resources],
    detail: async (id) => resources.find((resource) => resource.id === id) ?? null,
    create: async (values) => {
      const resource = { ...values, id: String(values.id ?? `resource-${resources.length + 1}`), title: String(values.title ?? 'Untitled resource') } as T;
      resources = [resource, ...resources];
      return resource;
    },
    update: async (id, values) => {
      const current = resources.find((resource) => resource.id === id);
      if (!current) throw new Error('Resource was deleted during edit.');
      const next = { ...current, ...values } as T;
      resources = resources.map((resource) => (resource.id === id ? next : resource));
      return next;
    },
    delete: async (id) => {
      resources = resources.filter((resource) => resource.id !== id);
    },
    activate: async (id) => {
      const current = resources.find((resource) => resource.id === id);
      if (!current) throw new Error('Resource is no longer available.');
      const next = { ...current, status: 'active' } as T;
      resources = resources.map((resource) => (resource.id === id ? next : resource));
      return next;
    },
    archive: async (id) => {
      const current = resources.find((resource) => resource.id === id);
      if (!current) throw new Error('Resource is no longer available.');
      const next = { ...current, status: 'archived' } as T;
      resources = resources.map((resource) => (resource.id === id ? next : resource));
      return next;
    },
    copyPreview: async (id) => `/resources/${encodeURIComponent(id)}`,
  };
}

export function useGdsResourceManager<T extends GdsResourceRecord>({
  adapter,
  onEvent,
  timeoutMs = 8000,
  confirmAction,
}: UseGdsResourceManagerConfig<T>): GdsResourceManagerController<T> {
  const [resources, setResources] = useState<T[]>([]);
  const [selectedResource, setSelectedResource] = useState<T | null>(null);
  const [state, setState] = useState<GdsResourceWorkflowState>('loading-list');
  const [error, setError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    setState('loading-list');
    adapter.list(controller.signal)
      .then((items) => {
        setResources(items);
        setState(items.length ? 'ready' : 'empty');
        setError(undefined);
        emitResourceEvent(onEvent, { type: 'resource_loaded' });
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load resources.');
        setState('error');
        emitResourceEvent(onEvent, { type: 'action_failed', message: reason instanceof Error ? reason.message : undefined });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [adapter, onEvent, reloadKey, timeoutMs]);

  const loadList = useCallback(() => setReloadKey((value) => value + 1), []);

  const permissions = useMemo(() => adapter.getPermissions?.(selectedResource) ?? defaultPermissions(selectedResource), [adapter, selectedResource]);

  const canRunAction = useCallback((action: GdsResourceActionId, resource: T | null = selectedResource) => {
    return (adapter.getPermissions?.(resource) ?? defaultPermissions(resource)).find((permission) => permission.action === action) ?? { action, allowed: false, reason: 'Action is not available.' };
  }, [adapter, selectedResource]);

  const openDetail = useCallback(async (id: string) => {
    setState('detail-loading');
    try {
      const resource = adapter.detail ? await adapter.detail(id) : resources.find((item) => item.id === id) ?? null;
      if (!resource) {
        setState('stale-data');
        setSelectedResource(null);
        setError('Resource is no longer available.');
        return null;
      }
      setSelectedResource(resource);
      setState('ready');
      emitResourceEvent(onEvent, { type: 'resource_loaded', action: 'view' });
      return resource;
    } catch (reason) {
      setState('error');
      setError(reason instanceof Error ? reason.message : 'Unable to load resource detail.');
      emitResourceEvent(onEvent, { type: 'action_failed', action: 'view' });
      return null;
    }
  }, [adapter, onEvent, resources]);

  const runAction = useCallback(async (action: GdsResourceActionId, resource: T | null, values: Partial<T> = {}) => {
    const permission = canRunAction(action, resource);
    if (!permission.allowed) {
      setState('permission-denied');
      setError(permission.reason ?? 'You do not have permission to run this action.');
      emitResourceEvent(onEvent, { type: 'permission_denied', action, message: permission.reason });
      return null;
    }
    if ((action === 'delete' || action === 'archive') && !(await confirmAction?.(action, resource))) {
      setState('permission-denied');
      setError('Destructive action requires confirmation.');
      emitResourceEvent(onEvent, { type: 'permission_denied', action, message: 'Confirmation was not provided.' });
      return null;
    }

    setState(action === 'delete' ? 'deleting' : action === 'activate' ? 'activating' : action === 'edit' || action === 'create' ? 'saving' : 'ready');
    emitResourceEvent(onEvent, { type: 'action_started', action });
    try {
      const idempotencyKey = createIdempotencyKey(action, resource?.id);
      let next: GdsResourceActionResult<T> = {};
      if (action === 'create' && adapter.create) next = { resource: await adapter.create(values, idempotencyKey) };
      if (action === 'edit' && resource && adapter.update) next = { resource: await adapter.update(resource.id, values, idempotencyKey) };
      if (action === 'delete' && resource && adapter.delete) {
        await adapter.delete(resource.id, idempotencyKey);
        setSelectedResource((current) => (current?.id === resource.id ? null : current));
        next = {};
      }
      if (action === 'activate' && resource && adapter.activate) next = { resource: await adapter.activate(resource.id, idempotencyKey) };
      if (action === 'archive' && resource && adapter.archive) next = { resource: await adapter.archive(resource.id, idempotencyKey) };
      if (action === 'copy-preview' && resource && adapter.copyPreview) next = { copiedText: await adapter.copyPreview(resource.id) };
      if (next.resource) setSelectedResource(next.resource);
      await adapter.list().then(setResources);
      setState('ready');
      setError(undefined);
      emitResourceEvent(onEvent, { type: 'action_completed', action });
      return next;
    } catch (reason) {
      setState('error');
      setError(reason instanceof Error ? reason.message : 'Resource action failed.');
      emitResourceEvent(onEvent, { type: 'action_failed', action, message: reason instanceof Error ? reason.message : undefined });
      return null;
    }
  }, [adapter, canRunAction, confirmAction, onEvent]);

  return {
    resources,
    selectedResource,
    state,
    error,
    permissions,
    loadList,
    openDetail,
    closeDetail: () => setSelectedResource(null),
    canRunAction,
    runAction,
  };
}

/**
 * Full CRUD list/detail surface driven entirely by a typed `GdsResourceAdapter`.
 * It renders the resource list, an optional detail pane (`renderDetail`), the
 * governed action set gated by the adapter's `getPermissions`, and every async
 * state (loading/empty/error/permission) from the adapter's responses. Use it as
 * the backbone of an admin resource screen so create/read/update/delete,
 * permissions, and state handling all flow from one adapter contract. See
 * `docs/TUTORIAL_CRUD_ADMIN_SCREEN.md` for a worked example.
 */
export function GdsResourceManager<T extends GdsResourceRecord>({
  title,
  description,
  adapter,
  columns,
  emptyLabel = 'No resources available',
  renderDetail,
  onEvent,
  timeoutMs,
  confirmAction,
}: GdsResourceManagerProps<T>) {
  const manager = useGdsResourceManager({ adapter, onEvent, timeoutMs, confirmAction });
  const tableColumns = useMemo<GdsTableColumn<T>[]>(() => columns ?? [
    { key: 'title' as keyof T & string, label: 'Title', sortable: true, filterable: true, mobilePriority: 1 },
    { key: 'status' as keyof T & string, label: 'Status', sortable: true, filterable: true, mobilePriority: 2 },
    { key: 'updatedAt' as keyof T & string, label: 'Updated', sortable: true, mobilePriority: 3 },
  ], [columns]);
  const tableAdapter = useMemo(() => createGdsTableAdapter(manager.resources, tableColumns), [manager.resources, tableColumns]);

  if (manager.state === 'loading-list') return <StateBlock variant="loading" title="Loading resources" description="Preparing the governed resource list." compact />;
  if (manager.state === 'error') return <StateBlock variant="error" title="Resource workflow failed" description={manager.error ?? 'The resource manager could not recover.'} action={<Button onClick={manager.loadList}>Retry</Button>} compact />;
  if (manager.state === 'empty') return <StateBlock variant="empty" title={emptyLabel} description="Create or import a resource to continue." compact />;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="start">
        <Stack gap={2}>
          <Text fw={700}>{title}</Text>
          {description ? <Text size="sm" c="dimmed">{description}</Text> : null}
          {manager.error ? <Text role="alert" size="sm" c="red.7">{manager.error}</Text> : null}
        </Stack>
        <Button onClick={() => { void manager.runAction('create', null, { title: 'Untitled resource' } as Partial<T>); }}>Create</Button>
      </Group>
      <GdsDataTable
        caption={`${title} resources`}
        columns={[
          ...tableColumns,
          {
            key: 'id' as keyof T & string,
            label: 'Actions',
            render: (row) => (
              <Group gap="xs">
                <Button size="xs" variant="light" onClick={() => { void manager.openDetail(row.id); }}>Details</Button>
                <Button size="xs" variant="light" onClick={() => { void manager.runAction('activate', row); }} disabled={!manager.canRunAction('activate', row).allowed}>Activate</Button>
                <Button size="xs" variant="light" color="red" onClick={() => { void manager.runAction('delete', row); }} disabled={!manager.canRunAction('delete', row).allowed}>Delete</Button>
                <Button size="xs" variant="subtle" onClick={() => { void manager.runAction('copy-preview', row); }} disabled={!manager.canRunAction('copy-preview', row).allowed}>Copy preview</Button>
              </Group>
            ),
          },
        ]}
        rowId={(row) => row.id}
        adapter={tableAdapter}
        onEvent={(event) => onEvent?.({ type: event.type === 'load_failed' ? 'action_failed' : 'resource_loaded', timestamp: event.timestamp, privacy: 'metadata-only', message: event.message })}
      />
      {manager.selectedResource ? (
        <section aria-label={`${manager.selectedResource.title} detail`}>
          {renderDetail ? renderDetail(manager.selectedResource, manager) : (
            <StateBlock
              variant="info"
              title={manager.selectedResource.title}
              description={`Status: ${String(manager.selectedResource.status ?? 'unknown')}`}
              compact
            />
          )}
        </section>
      ) : null}
    </Stack>
  );
}
