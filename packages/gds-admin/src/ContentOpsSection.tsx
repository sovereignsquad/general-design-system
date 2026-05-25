import type { ReactNode } from 'react';
import { Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';

export interface ContentOpsSectionProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'warning' | 'critical';
}

const toneBackgrounds = {
  default: 'var(--mantine-color-body)',
  warning: 'var(--mantine-color-yellow-0)',
  critical: 'var(--mantine-color-red-0)',
} as const;

export function ContentOpsSection({
  id,
  title,
  description,
  action,
  children,
  tone = 'default',
}: ContentOpsSectionProps) {
  return (
    <Paper id={id} withBorder radius="xl" p="lg" style={{ background: toneBackgrounds[tone] }}>
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
