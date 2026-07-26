import type { ReactNode } from 'react';
import { Stack, Title } from '@mantine/core';
import { PlaceholderPanel, type PlaceholderPanelProps } from './PlaceholderPanel';
import { StateBlock } from './StateBlock';

/** Props for {@link StatsSection}. */
export interface StatsSectionProps {
  title: string;
  loading?: boolean;
  /** Error message; when set, replaces content with an error state block. */
  error?: string | null;
  /** When true, hides content behind a "not enough data" state block. */
  belowThreshold?: boolean;
  /** Overrides the default copy for the below-threshold state. */
  thresholdMessage?: ReactNode;
  /** The statistics content shown in the ready state. */
  children?: ReactNode;
  /** Placeholder panel shown when no other state applies and no children are given. */
  placeholder?: Omit<PlaceholderPanelProps, 'mode'>;
}

/**
 * Titled container for a shared statistics surface that resolves, in priority
 * order, to an error, loading, below-threshold, placeholder, or the provided
 * `children`, keeping data-availability states consistent across dashboards.
 */
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
