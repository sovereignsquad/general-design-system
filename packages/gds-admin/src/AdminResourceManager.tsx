import type { ReactNode } from 'react';
import { ActionIcon, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  ActionBar,
  AsyncSurface,
  GdsIcons,
  MediaPreviewCard,
  type ActionBarProps,
  type MediaPreviewMetadata,
} from '@sovereignsquad/gds-core';

export type AdminResourceState = 'loading' | 'ready' | 'empty' | 'error' | 'filtered' | 'permission-limited';

export interface AdminResourceRecord {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  thumbnailSrc?: string;
  mediaSrc?: string;
  mediaAlt?: string;
  status?: ReactNode;
  metadata?: MediaPreviewMetadata[];
}

export interface AdminResourceAction<T> {
  id: string;
  label: string;
  kind?: 'primary' | 'secondary' | 'danger' | 'icon';
  icon?: ReactNode;
  onSelect?: (record: T) => void | Promise<void>;
  disabled?: (record: T) => boolean;
}

export interface AdminResourceToolbarProps {
  title?: ReactNode;
  description?: ReactNode;
  actionBar?: ActionBarProps;
  filters?: ReactNode;
}

export function AdminResourceToolbar({ title, description, actionBar, filters }: AdminResourceToolbarProps) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
      <Stack gap={4}>
        {title ? (typeof title === 'string' ? <Title order={3}>{title}</Title> : title) : null}
        {description ? <Text size="sm" c="dimmed">{description}</Text> : null}
        {filters}
      </Stack>
      {actionBar ? <ActionBar {...actionBar} /> : null}
    </Group>
  );
}

export interface AdminResourceCardProps<T extends AdminResourceRecord> {
  record: T;
  actions?: AdminResourceAction<T>[];
  onPreview?: (record: T) => void;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

export function AdminResourceCard<T extends AdminResourceRecord>({ record, actions = [], onPreview, hideWhenNoMedia }: AdminResourceCardProps<T>) {
  const primary = actions.find((action) => action.kind === 'primary');
  const secondary = actions.filter((action) => action.kind === 'secondary' || action.kind === 'danger');
  const iconOnly = actions.filter((action) => action.kind === 'icon');

  return (
    <MediaPreviewCard
      title={record.title}
      src={record.mediaSrc}
      thumbnailSrc={record.thumbnailSrc}
      alt={record.mediaAlt ?? (typeof record.title === 'string' ? record.title : 'Resource media')}
      caption={record.description}
      status={record.status}
      metadata={record.metadata}
      hideWhenNoMedia={hideWhenNoMedia}
      actions={{
        primary: primary
          ? {
              action: primary.kind === 'danger' ? 'delete' : 'edit',
              onClick: () => primary.onSelect?.(record),
              disabled: primary.disabled?.(record),
            }
          : onPreview
            ? { action: 'preview', onClick: () => onPreview(record) }
            : undefined,
        secondary: secondary.map((action) => ({
          action: action.kind === 'danger' ? 'delete' : 'edit',
          color: action.kind === 'danger' ? 'red' : undefined,
          onClick: () => action.onSelect?.(record),
          disabled: action.disabled?.(record),
        })),
        iconOnly: iconOnly.map((action) => ({
          action: 'settings',
          ariaLabel: action.label,
          onClick: () => action.onSelect?.(record),
          disabled: action.disabled?.(record),
        })),
      }}
    />
  );
}

export interface AdminResourceGridProps<T extends AdminResourceRecord> {
  records: T[];
  actions?: AdminResourceAction<T>[];
  onPreview?: (record: T) => void;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

export function AdminResourceGrid<T extends AdminResourceRecord>({ records, actions, onPreview, hideWhenNoMedia }: AdminResourceGridProps<T>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {records.map((record) => (
        <AdminResourceCard key={record.id} record={record} actions={actions} onPreview={onPreview} hideWhenNoMedia={hideWhenNoMedia} />
      ))}
    </SimpleGrid>
  );
}

export interface AdminResourceEmptyStateProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function AdminResourceEmptyState({
  title = 'No resources yet',
  description = 'Create the first resource to populate this manager.',
  action,
}: AdminResourceEmptyStateProps) {
  return (
    <Paper withBorder radius="lg" p="xl">
      <Stack align="center" gap="md">
        <ActionIcon variant="light" size="xl" radius="xl" aria-hidden>
          <GdsIcons.Inbox size="1.2rem" />
        </ActionIcon>
        <Stack gap={4} align="center" ta="center">
          <Title order={3}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </Stack>
        {action}
      </Stack>
    </Paper>
  );
}

export interface AdminResourceManagerProps<T extends AdminResourceRecord> {
  records: T[];
  state?: AdminResourceState;
  title?: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  actionBar?: ActionBarProps;
  actions?: AdminResourceAction<T>[];
  onPreview?: (record: T) => void;
  emptyState?: ReactNode;
  errorDescription?: ReactNode;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

export function AdminResourceManager<T extends AdminResourceRecord>({
  records,
  state = records.length ? 'ready' : 'empty',
  title,
  description,
  toolbar,
  actionBar,
  actions,
  onPreview,
  emptyState,
  errorDescription,
  hideWhenNoMedia,
}: AdminResourceManagerProps<T>) {
  const asyncState = state === 'ready'
    ? 'success'
    : state === 'filtered' || state === 'empty'
      ? 'empty'
      : state === 'permission-limited' || state === 'error'
        ? 'error'
        : 'loading';

  return (
    <Stack gap="lg">
      {toolbar ?? <AdminResourceToolbar title={title} description={description} actionBar={actionBar} />}
      <AsyncSurface
        state={asyncState}
        loadingTitle="Loading resources"
        emptyTitle={state === 'filtered' ? 'No matching resources' : 'No resources yet'}
        emptyDescription={state === 'filtered' ? 'Reset filters or adjust the current scope.' : 'Create the first resource to continue.'}
        errorTitle={state === 'permission-limited' ? 'Limited access' : 'Unable to load resources'}
        errorDescription={errorDescription ?? (state === 'permission-limited' ? 'You do not have access to every resource in this manager.' : undefined)}
        successContent={<AdminResourceGrid records={records} actions={actions} onPreview={onPreview} hideWhenNoMedia={hideWhenNoMedia} />}
        retryAction={emptyState}
      />
    </Stack>
  );
}
