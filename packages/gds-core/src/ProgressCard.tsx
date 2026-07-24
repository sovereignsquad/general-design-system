import type { ReactNode } from 'react';
import { Card, Group, Progress, Stack, Text, Title } from '@mantine/core';

export interface ProgressCardProps {
  label: string;
  value: ReactNode;
  progress: number;
  progressLabel?: string;
  description?: ReactNode;
  action?: ReactNode;
}

/**
 * Card that pairs a labelled `value` with a progress bar (`progress`, plus an
 * optional `progressLabel`) and optional description/action. Use it to show
 * movement toward a goal — quota usage, onboarding completion, task progress — as
 * a single governed, accessible tile.
 */
export function ProgressCard({
  label,
  value,
  progress,
  progressLabel,
  description,
  action,
}: ProgressCardProps) {
  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text size="sm" c="dimmed" fw={600}>
              {label}
            </Text>
            <Title order={3}>{value}</Title>
          </Stack>
          {action}
        </Group>

        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}

        <Stack gap={6}>
          <Group justify="space-between" gap="sm">
            <Text size="sm" fw={500}>
              {progressLabel ?? 'Progress'}
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round(progress)}%
            </Text>
          </Group>
          <Progress value={progress} radius="xl" size="md" />
        </Stack>
      </Stack>
    </Card>
  );
}
