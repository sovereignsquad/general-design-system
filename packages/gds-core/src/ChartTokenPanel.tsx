import type { ReactNode } from 'react';
import { Badge, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { resolveGdsChartTokenColor } from './chart-colors';
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
  /**
   * Series color token, painted as the entry's swatch: a series tone (`primary`), a custom
   * property (`--gds-chart-series-2`), a dotted role id (`chart.series-2`) or a CSS color.
   * Not rendered as text.
   */
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
  /** Legend entries, each rendered as a color swatch and its label. */
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
            <Badge
              variant="filled"
              style={{
                background: `var(--gds-badge-soft-${state === 'permission-limited' ? 'info' : 'warning'})`,
                color: `var(--gds-badge-soft-${state === 'permission-limited' ? 'info' : 'warning'}-fg)`,
              }}
            >
              {state.replace('-', ' ')}
            </Badge>
          ) : null}
        </Group>

        <Text size="sm">{summary}</Text>

        {legend.length ? (
          <Group component="ul" role="list" gap="md" wrap="wrap" aria-label="Chart legend" className="gds-chart-legend">
            {legend.map((item, index) => (
              <Group
                component="li"
                key={`${String(item.label)}-${index}`}
                gap="xs"
                wrap="nowrap"
                data-token={item.token}
                title={typeof item.description === 'string' ? item.description : undefined}
              >
                <Box
                  component="span"
                  aria-hidden
                  className="gds-chart-legend-swatch"
                  style={{ background: resolveGdsChartTokenColor(item.token) }}
                />
                <Text component="span" size="sm">{item.label}</Text>
              </Group>
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
