import React from 'react';
import { Box, Group, Stack, Text, Title } from '@mantine/core';

export type PageHeaderEyebrowVariant = 'neutral' | 'ornamental';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  eyebrowVariant?: PageHeaderEyebrowVariant;
}

export function PageHeader({
  title,
  description,
  subtitle,
  eyebrow,
  actions,
  eyebrowVariant = 'neutral',
}: PageHeaderProps) {
  const resolvedDescription = description ?? subtitle;

  const eyebrowProps =
    eyebrowVariant === 'ornamental'
      ? { tt: 'uppercase' as const, style: { letterSpacing: '0.12em' } }
      : {};

  return (
    <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
      <Stack gap="xs">
        {eyebrow && (
          <Text size="xs" fw={700} c="dimmed" {...eyebrowProps}>
            {eyebrow}
          </Text>
        )}
        <Title order={1}>{title}</Title>
        {resolvedDescription && (
          <Text c="dimmed" maw={720}>
            {resolvedDescription}
          </Text>
        )}
      </Stack>
      {actions ? <Box>{actions}</Box> : null}
    </Group>
  );
}
