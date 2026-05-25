import type { ReactNode } from 'react';
import { Stack, Title } from '@mantine/core';
import { PlaceholderPanel, type PlaceholderPanelProps } from './PlaceholderPanel';
import { StateBlock } from './StateBlock';

export interface StatsSectionProps {
  title: string;
  loading?: boolean;
  error?: string | null;
  belowThreshold?: boolean;
  thresholdMessage?: ReactNode;
  children?: ReactNode;
  placeholder?: Omit<PlaceholderPanelProps, 'mode'>;
}

export function StatsSection({
  title,
  loading = false,
  error = null,
  belowThreshold = false,
  thresholdMessage,
  children,
  placeholder,
}: StatsSectionProps) {
  let content = children;

  if (error) {
    content = <StateBlock variant="error" title="Unable to load statistics" description={error} compact />;
  } else if (loading) {
    content = <StateBlock variant="loading" title="Loading statistics" description="This shared data surface is still synchronizing." compact />;
  } else if (belowThreshold) {
    content = (
      <StateBlock
        variant="not-enough-data"
        title="Not enough data yet"
        description={thresholdMessage ?? 'This view is hidden until the reporting threshold is met.'}
        compact
      />
    );
  } else if (placeholder) {
    content = <PlaceholderPanel {...placeholder} mode="placeholder" />;
  }

  return (
    <Stack gap="md">
      <Title order={3}>{title}</Title>
      {content}
    </Stack>
  );
}
