import type { ReactNode } from 'react';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { ChartTokenPanel, type ChartTokenPanelState } from './ChartTokenPanel';
import { SimpleDataTable } from './SimpleDataTable';

export type GdsChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked-bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'funnel'
  | 'treemap';

export interface GdsChartDatum {
  label: string;
  value: number;
  group?: string;
}

export interface GdsChartProps {
  type: GdsChartType;
  title: string;
  summary: string;
  data: GdsChartDatum[];
  state?: ChartTokenPanelState;
  retryAction?: ReactNode;
}

export function GdsChart({ type, title, summary, data, state = 'ready', retryAction }: GdsChartProps) {
  const tableRows = data.map((item) => ({ label: item.label, value: String(item.value), group: item.group ?? '-' }));
  return (
    <ChartTokenPanel
      title={title}
      summary={summary}
      state={state}
      retryAction={retryAction}
      legend={[
        { label: 'Primary', token: 'var(--mantine-color-blue-6)' },
        { label: 'Secondary', token: 'var(--mantine-color-teal-6)' },
      ]}
      tableFallback={(
        <SimpleDataTable
          columns={[
            { key: 'label', header: 'Label' },
            { key: 'value', header: 'Value' },
            { key: 'group', header: 'Group' },
          ]}
          rows={tableRows}
        />
      )}
    >
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700}>{title}</Text>
            <Badge variant="light">{type}</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            {summary}
          </Text>
          <Text size="xs" c="dimmed">Type lane: {type}</Text>
        </Stack>
      </Paper>
    </ChartTokenPanel>
  );
}
