import React from 'react';
import { Drawer, Group, Stack, Text } from '@mantine/core';

export type FilterDrawerMode = 'side' | 'bottom-sheet';

export interface FilterDrawerProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  mode?: FilterDrawerMode;
  applyAction?: React.ReactNode;
  resetAction?: React.ReactNode;
  closeAction?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

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
