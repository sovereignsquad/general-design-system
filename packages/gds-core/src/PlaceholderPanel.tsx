import type { ReactNode } from 'react';
import { Badge, Card, Stack, Text, Title } from '@mantine/core';
import { StateBlock } from './StateBlock';

export interface PlaceholderPanelProps {
  title: string;
  description: ReactNode;
  badge?: string;
  footer?: ReactNode;
  children?: ReactNode;
  mode: 'placeholder' | 'live';
}

export function PlaceholderPanel({
  title,
  description,
  badge,
  footer,
  children,
  mode,
}: PlaceholderPanelProps) {
  if (mode === 'live' && children) {
    return <>{children}</>;
  }

  return (
    <Card>
      <Stack gap="md">
        {badge ? (
          <Badge variant="light" color="blue" w="fit-content">
            {badge}
          </Badge>
        ) : null}
        <Stack gap="xs">
          <Title order={4}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </Stack>
        {footer ? <Text size="sm">{footer}</Text> : null}
        <StateBlock
          variant="not-enough-data"
          title="Content is not live yet"
          description="This surface is intentionally showing a governed placeholder until live data is available."
          compact
        />
      </Stack>
    </Card>
  );
}
