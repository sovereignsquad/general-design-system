import type { ReactNode } from 'react';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { StateBlock } from './StateBlock';

/** Data/availability state of the chart panel. */
export type ChartTokenPanelState =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'below-threshold'
  | 'partial'
  | 'error'
  | 'permission-limited';

/** One legend entry mapping a label to the design token driving its series color. */
export interface ChartLegendItem {
  label: ReactNode;
  /** Design token (CSS variable or color name) shown alongside the label. */
  token: string;
  description?: ReactNode;
}

/** Props for {@link ChartTokenPanel}. */
export interface ChartTokenPanelProps {
  title: ReactNode;
  description?: ReactNode;
  /** Plain-text summary of the chart, also used as the description in state blocks. */
  summary: ReactNode;
  /** Panel state; drives which state block (if any) replaces the chart. Defaults to "ready". */
  state?: ChartTokenPanelState;
  /** Token-based legend entries rendered as badges. */
  legend?: ChartLegendItem[];
  /** The chart itself, rendered in the ready state. */
  children?: ReactNode;
  /** Optional accessible data table shown beneath the chart. */
  tableFallback?: ReactNode;
  /** Optional retry action surfaced in loading/empty/error state blocks. */
  retryAction?: ReactNode;
}

/**
 * Governed chart container: renders a title, an accessible summary, a token-based
 * legend, the chart, and an optional accessible table fallback, replacing the chart
 * with loading/empty/below-threshold/error state blocks as the state requires.
 */
export function ChartTokenPanel({
  title,
  description,
  summary,
  state = 'ready',
  legend = [],
  children,
  tableFallback,
  retryAction,
}: ChartTokenPanelProps) {
  if (state === 'loading') {
    return <StateBlock variant="loading" title="Loading chart" description={summary} compact action={retryAction} />;
  }

  if (state === 'empty') {
    return <StateBlock variant="empty" title="No chart data" description={summary} compact action={retryAction} />;
  }

  if (state === 'below-threshold') {
    return <StateBlock variant="not-enough-data" title="Not enough data for chart" description={summary} compact action={retryAction} />;
  }

  if (state === 'error') {
    return <StateBlock variant="error" title="Unable to load chart" description={summary} compact action={retryAction} />;
  }

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Stack gap={4}>
            <Title order={4}>{title}</Title>
            {description ? <Text size="sm" c="dimmed">{description}</Text> : null}
          </Stack>
          {state !== 'ready' ? (
            <Badge variant="light" color={state === 'permission-limited' ? 'grape' : 'yellow'}>
              {state.replace('-', ' ')}
            </Badge>
          ) : null}
        </Group>

        <Text size="sm">{summary}</Text>

        {legend.length ? (
          <Group gap="xs" wrap="wrap" aria-label="Chart legend">
            {legend.map((item, index) => (
              <Badge key={`${String(item.label)}-${index}`} variant="outline" color="gray" title={typeof item.description === 'string' ? item.description : undefined}>
                {item.label}: {item.token}
              </Badge>
            ))}
          </Group>
        ) : null}

        {children}
        {tableFallback ? (
          <Stack gap="xs">
            <Text size="sm" fw={600}>Accessible data fallback</Text>
            {tableFallback}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
