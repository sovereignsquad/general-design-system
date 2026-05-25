import type { ReactNode } from 'react';
import { Badge, Group, Paper, Text } from '@mantine/core';

export interface ContentOpsActionBarProps {
  dirty?: boolean;
  saving?: boolean;
  status?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  tertiaryAction?: ReactNode;
}

export function ContentOpsActionBar({
  dirty = false,
  saving = false,
  status,
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
        <Group gap="sm" wrap="wrap">
          {tertiaryAction}
          {secondaryAction}
          {primaryAction}
        </Group>
      </Group>
    </Paper>
  );
}
