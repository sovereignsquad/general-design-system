import type { ReactNode } from 'react';
import { Badge, Group, Paper, Text } from '@mantine/core';
import type { ActionBarProps } from '@doneisbetter/gds-core';
import { ActionBar } from '@doneisbetter/gds-core';

export interface ContentOpsActionBarProps {
  dirty?: boolean;
  saving?: boolean;
  status?: ReactNode;
  actions?: ActionBarProps;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  tertiaryAction?: ReactNode;
}

export function ContentOpsActionBar({
  dirty = false,
  saving = false,
  status,
  actions,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: ContentOpsActionBarProps) {
  return (
    <Paper withBorder radius="xl" p="md">
      <Group justify="space-between" align="center" gap="md" wrap="wrap">
        <Group gap="sm" wrap="wrap">
          <Badge color={saving ? 'violet' : dirty ? 'yellow' : 'teal'} variant="light">
            {saving ? 'Saving' : dirty ? 'Unsaved changes' : 'Saved'}
          </Badge>
          {status ? (
            typeof status === 'string' ? (
              <Text size="sm" c="dimmed">
                {status}
              </Text>
            ) : (
              status
            )
          ) : null}
        </Group>
        {actions ? (
          <ActionBar {...actions} />
        ) : (
          <Group gap="sm" wrap="wrap">
            {tertiaryAction}
            {secondaryAction}
            {primaryAction}
          </Group>
        )}
      </Group>
    </Paper>
  );
}
