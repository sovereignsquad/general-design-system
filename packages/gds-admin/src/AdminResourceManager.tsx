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

/** Governed lifecycle state for the resource manager; mapped onto `AsyncSurface` states. */
export type AdminResourceState = 'loading' | 'ready' | 'empty' | 'error' | 'filtered' | 'permission-limited';

/** A single media-backed record rendered by the resource manager. */
export interface AdminResourceRecord {
  /** Stable record identity. */
  id: string;
  /** Record title / heading. */
  title: ReactNode;
  /** Supporting caption text. */
  description?: ReactNode;
  /** Thumbnail image source. */
  thumbnailSrc?: string;
  /** Full media source. */
  mediaSrc?: string;
  /** Alt text for the media; falls back to the title string. */
  mediaAlt?: string;
  /** Status indicator content. */
  status?: ReactNode;
  /** Metadata rows shown on the preview card. */
  metadata?: MediaPreviewMetadata[];
}

/** An action offered on a resource record. */
export interface AdminResourceAction<T> {
  /** Stable action identity. */
  id: string;
  /** Action label; also used as the aria-label for icon-only actions. */
  label: string;
  /** Action grouping/prominence; determines how it maps onto the card's action slots. */
  kind?: 'primary' | 'secondary' | 'danger' | 'icon';
  /** Optional icon for the action. */
  icon?: ReactNode;
  /** Invoked with the record when the action is selected. */
  onSelect?: (record: T) => void | Promise<void>;
  /** Predicate disabling the action for a given record. */
  disabled?: (record: T) => boolean;
}

/** Props for {@link AdminResourceToolbar}. */
export interface AdminResourceToolbarProps {
  /** Toolbar heading; strings render as an `h3`. */
  title?: ReactNode;
  /** Supporting description under the title. */
  description?: ReactNode;
  /** Action bar shown at the trailing edge. */
  actionBar?: ActionBarProps;
  /** Filter controls rendered under the description. */
  filters?: ReactNode;
}

/** Header row for the resource manager: title, description, filters, and a trailing action bar. */
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

/** Props for {@link AdminResourceCard}. */
export interface AdminResourceCardProps<T extends AdminResourceRecord> {
  /** The record to render. */
  record: T;
  /** Actions offered on the card, grouped by their `kind`. */
  actions?: AdminResourceAction<T>[];
  /** Preview handler; wired to the card's preview action when no primary action exists. */
  onPreview?: (record: T) => void;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

/**
 * Governed resource card mapping an {@link AdminResourceRecord} and its actions
 * onto the GDS `MediaPreviewCard`, sorting actions into primary/secondary/icon
 * slots by their `kind`.
 */
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

/** Props for {@link AdminResourceGrid}. */
export interface AdminResourceGridProps<T extends AdminResourceRecord> {
  /** Records to render as cards. */
  records: T[];
  /** Actions offered on every card. */
  actions?: AdminResourceAction<T>[];
  /** Preview handler passed through to each card. */
  onPreview?: (record: T) => void;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

/** Responsive 1/2/3-column grid of {@link AdminResourceCard}s. */
export function AdminResourceGrid<T extends AdminResourceRecord>({ records, actions, onPreview, hideWhenNoMedia }: AdminResourceGridProps<T>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {records.map((record) => (
        <AdminResourceCard key={record.id} record={record} actions={actions} onPreview={onPreview} hideWhenNoMedia={hideWhenNoMedia} />
      ))}
    </SimpleGrid>
  );
}

/** Props for {@link AdminResourceEmptyState}. */
export interface AdminResourceEmptyStateProps {
  /** Empty-state heading; defaults to "No resources yet". */
  title?: string;
  /** Supporting description; has a default explaining how to populate the manager. */
  description?: ReactNode;
  /** Call-to-action element (e.g. a create button). */
  action?: ReactNode;
}

/** Centered empty state for the resource manager, with an inbox icon, heading, description, and optional action. */
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

/** Props for {@link AdminResourceManager}. */
export interface AdminResourceManagerProps<T extends AdminResourceRecord> {
  /** Records to display. */
  records: T[];
  /** Governed state; defaults to `ready` when records exist, otherwise `empty`. */
  state?: AdminResourceState;
  /** Default toolbar title, used when `toolbar` is not supplied. */
  title?: ReactNode;
  /** Default toolbar description, used when `toolbar` is not supplied. */
  description?: ReactNode;
  /** Replaces the default {@link AdminResourceToolbar}. */
  toolbar?: ReactNode;
  /** Action bar passed to the default toolbar. */
  actionBar?: ActionBarProps;
  /** Actions offered on every resource card. */
  actions?: AdminResourceAction<T>[];
  /** Preview handler passed through to the grid. */
  onPreview?: (record: T) => void;
  /** Content shown as the surface's retry/empty affordance. */
  emptyState?: ReactNode;
  /** Overrides the error/permission state description. */
  errorDescription?: ReactNode;
  /** Omit the media area entirely for records with no media, instead of a placeholder block. */
  hideWhenNoMedia?: boolean;
}

/**
 * Governed resource manager: a toolbar over an `AsyncSurface` that maps
 * {@link AdminResourceState} onto loading/empty/error views and renders records
 * as an {@link AdminResourceGrid} when ready. Distinguishes `filtered` (no
 * matches) from `empty` (nothing created) and `permission-limited` from `error`.
 */
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
