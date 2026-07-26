'use client';

import type { ReactNode } from 'react';
import { Drawer, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ActionBar, AsyncSurface, type ActionBarProps } from '@sovereignsquad/gds-core';
import type { OverlayCloseReason } from '@sovereignsquad/gds-core';

/** Governed lifecycle state for admin overlays; mapped onto `AsyncSurface` states. */
export type AdminOverlayState = 'idle' | 'loading' | 'error' | 'ready' | 'empty' | 'readonly';

/** Shared props for the governed admin overlay surfaces ({@link AdminModal}, {@link AdminDetailDrawer}). */
export interface AdminOverlayBaseProps {
  /** Whether the overlay is open. */
  opened: boolean;
  /** Close handler, receiving the reason the overlay was dismissed. */
  onClose: (reason: OverlayCloseReason) => void;
  /** Overlay title; strings render as an `h3`. */
  title: ReactNode;
  /** Supporting description under the title. */
  description?: ReactNode;
  /** Governed content state, driving the inner `AsyncSurface`. */
  state?: AdminOverlayState;
  /** Action bar rendered at the foot of the overlay. */
  actions?: ActionBarProps;
  /** Overlay body content. */
  children?: ReactNode;
}

function toAsyncState(state: AdminOverlayState) {
  if (state === 'loading') return 'loading';
  if (state === 'error') return 'error';
  if (state === 'empty') return 'empty';
  if (state === 'idle') return 'idle';
  return 'success';
}

function AdminOverlayContent({
  title,
  description,
  state = 'ready',
  actions,
  children,
}: Omit<AdminOverlayBaseProps, 'opened' | 'onClose'>) {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        {typeof title === 'string' ? <Title order={3}>{title}</Title> : title}
        {description ? (
          typeof description === 'string' ? <Text size="sm" c="dimmed">{description}</Text> : description
        ) : null}
      </Stack>
      <AsyncSurface
        state={toAsyncState(state)}
        successContent={children}
        idleContent={children}
        loadingTitle="Loading details"
        errorTitle="Unable to load details"
        emptyTitle="No detail available"
        compact
      />
      {actions ? (
        <Group justify="flex-end">
          <ActionBar {...actions} />
        </Group>
      ) : null}
    </Stack>
  );
}

/** Props for {@link AdminModal}. */
export interface AdminModalProps extends AdminOverlayBaseProps {
  /** Modal width; defaults to `lg`. */
  size?: string | number;
}

/**
 * Governed centered modal: a focus-trapping, focus-returning Mantine `Modal`
 * whose header/body/actions and async states are rendered through the shared
 * admin overlay content. Always closes with the `programmatic` reason.
 */
export function AdminModal({
  opened,
  onClose,
  title,
  description,
  state = 'ready',
  actions,
  children,
  size = 'lg',
}: AdminModalProps) {
  return (
    <Modal opened={opened} onClose={() => onClose('programmatic')} size={size} centered trapFocus returnFocus title={null}>
      <AdminOverlayContent title={title} description={description} state={state} actions={actions}>
        {children}
      </AdminOverlayContent>
    </Modal>
  );
}

/** Props for {@link AdminDetailDrawer}. */
export interface AdminDetailDrawerProps extends AdminOverlayBaseProps {
  /** Media block rendered above the body. */
  media?: ReactNode;
  /** Metadata block rendered above the body. */
  metadata?: ReactNode;
  /** Side the drawer slides in from; defaults to `right`. */
  position?: 'right' | 'left';
}

/**
 * Governed detail drawer: a focus-trapping Mantine `Drawer` that stacks
 * media/metadata above the body via the shared admin overlay content, and
 * expands to full width on narrow viewports. Always closes with the
 * `programmatic` reason.
 */
export function AdminDetailDrawer({
  opened,
  onClose,
  title,
  description,
  state = 'ready',
  actions,
  children,
  media,
  metadata,
  position = 'right',
}: AdminDetailDrawerProps) {
  const mobile = useMediaQuery('(max-width: 48em)');
  return (
    <Drawer
      opened={opened}
      onClose={() => onClose('programmatic')}
      position={position}
      size={mobile ? '100%' : 'xl'}
      trapFocus
      returnFocus
      title={null}
    >
      <AdminOverlayContent title={title} description={description} state={state} actions={actions}>
        <Stack gap="md">
          {media}
          {metadata}
          {children}
        </Stack>
      </AdminOverlayContent>
    </Drawer>
  );
}

/** Props for {@link AdminReviewLayout}. */
export interface AdminReviewLayoutProps {
  /** Media block rendered first. */
  media?: ReactNode;
  /** Metadata block rendered after the media. */
  metadata?: ReactNode;
  /** Main review content. */
  children: ReactNode;
  /** Action block rendered last. */
  actions?: ReactNode;
}

/** Simple vertical review layout stacking media, metadata, content, and actions in order. */
export function AdminReviewLayout({ media, metadata, children, actions }: AdminReviewLayoutProps) {
  return (
    <Stack gap="md">
      {media}
      {metadata}
      {children}
      {actions}
    </Stack>
  );
}
