'use client';

import type { ReactNode } from 'react';
import { Drawer, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ActionBar, AsyncSurface, type ActionBarProps } from '@doneisbetter/gds-core';
import type { OverlayCloseReason } from '@doneisbetter/gds-core';

export type AdminOverlayState = 'idle' | 'loading' | 'error' | 'ready' | 'empty' | 'readonly';

export interface AdminOverlayBaseProps {
  opened: boolean;
  onClose: (reason: OverlayCloseReason) => void;
  title: ReactNode;
  description?: ReactNode;
  state?: AdminOverlayState;
  actions?: ActionBarProps;
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

export interface AdminModalProps extends AdminOverlayBaseProps {
  size?: string | number;
}

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

export interface AdminDetailDrawerProps extends AdminOverlayBaseProps {
  media?: ReactNode;
  metadata?: ReactNode;
  position?: 'right' | 'left';
}

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

export interface AdminReviewLayoutProps {
  media?: ReactNode;
  metadata?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

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
