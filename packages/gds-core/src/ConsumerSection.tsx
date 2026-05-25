import type { ReactNode } from 'react';
import { Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';

export interface ConsumerSectionProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'supporting' | 'warning';
}

const toneBackgrounds = {
  default: 'var(--mantine-color-body)',
  supporting: 'var(--mantine-color-gray-0)',
  warning: 'var(--mantine-color-yellow-0)',
} as const;

export function ConsumerSection({
  title,
  description,
  action,
  children,
  tone = 'default',
}: ConsumerSectionProps) {
  return (
    <Paper withBorder radius="xl" p="lg" style={{ background: toneBackgrounds[tone] }}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Stack gap={4}>
            <Title order={3}>{title}</Title>
            {description ? (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            ) : null}
          </Stack>
          {action}
        </Group>
        <Divider />
        {children}
      </Stack>
    </Paper>
  );
}
