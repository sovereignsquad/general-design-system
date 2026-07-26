import React from 'react';
import { Drawer, Group, Stack, Text } from '@mantine/core';

/** Presentation mode: a right-side drawer or a rounded bottom sheet. */
export type FilterDrawerMode = 'side' | 'bottom-sheet';

/** Props for the `FilterDrawer` component. */
export interface FilterDrawerProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Drawer position/shape. Defaults to `side`. */
  mode?: FilterDrawerMode;
  /** Primary footer action (preferred name); takes precedence over `primaryAction`. */
  applyAction?: React.ReactNode;
  /** Secondary footer action (preferred name); takes precedence over `secondaryAction`. */
  resetAction?: React.ReactNode;
  closeAction?: React.ReactNode;
  /** Fallback primary footer action when `applyAction` is not provided. */
  primaryAction?: React.ReactNode;
  /** Fallback secondary footer action when `resetAction` is not provided. */
  secondaryAction?: React.ReactNode;
}

/** Governed filter panel rendered as a side drawer or bottom sheet, with a title, optional description, filter content, and a footer of apply/reset/close actions. */
export function FilterDrawer({
  opened,
  onClose,
  title,
  description,
  children,
  mode = 'side',
  applyAction,
  resetAction,
  closeAction,
  primaryAction,
  secondaryAction,
}: FilterDrawerProps) {
  const resolvedPrimaryAction = applyAction ?? primaryAction;
  const resolvedSecondaryAction = resetAction ?? secondaryAction;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position={mode === 'bottom-sheet' ? 'bottom' : 'right'}
      size={mode === 'bottom-sheet' ? 'auto' : 'md'}
      radius={mode === 'bottom-sheet' ? 'xl' : undefined}
    >
      <Stack gap="md">
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
        {children}
        {(resolvedPrimaryAction || resolvedSecondaryAction || closeAction) ? (
          <Group justify="space-between" mt="md">
            <Group gap="sm">
              {closeAction}
              {resolvedSecondaryAction}
            </Group>
            {resolvedPrimaryAction}
          </Group>
        ) : null}
      </Stack>
    </Drawer>
  );
}
