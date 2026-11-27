'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { ChartTokenPanel, type ChartTokenPanelState } from './ChartTokenPanel';
import { SimpleDataTable } from './SimpleDataTable';
import { semanticRenderer, type SemanticRendererKind } from './chart-primitives';
import { validateGdsChartData, type GdsChartDatum, type GdsChartTypeDefinition, type GdsChartType, type GdsChartConfig, isGdsChartSetCType, isGdsChartSetBType, isGdsChartSetAType, gdsDefaultChartLegend, type GdsChartLegendItem } from './GdsChart.shared';

/** Everything a renderer adapter receives to draw a chart, including the resolved data and the accessibility `labelledBy`/`describedBy` ids to wire up. */
export interface GdsChartRendererContext {
  type: GdsChartType;
  title: string;
  summary: string;
  data: GdsChartDatum[];
  config: GdsChartConfig;
  definition: GdsChartTypeDefinition;
  labelledBy: string;
  describedBy: string;
}

/** Pluggable renderer that turns a {@link GdsChartRendererContext} into the visual chart node. */
export type GdsChartRendererAdapter = (context: GdsChartRendererContext) => ReactNode;

/** Props for {@link GdsChart}. */
export interface GdsChartProps {
  type: GdsChartType;
  title: string;
  /** Accessible text summary read alongside the visual; validation issues are appended to it. */
  summary: string;
  data: GdsChartDatum[];
  config?: GdsChartConfig;
  /** Legend entries; defaults to {@link gdsDefaultChartLegend}. */
  legend?: GdsChartLegendItem[];
  /** Force the surface state; when omitted it is derived from validation. */
  state?: ChartTokenPanelState;
  /** Recovery action shown in the error/empty state. */
  retryAction?: ReactNode;
  /** Custom visual renderer; defaults to the built-in vendor-neutral surface. */
  renderer?: GdsChartRendererAdapter;
}

function getSetARendererLabel(type: GdsChartType) {
  const labels: Partial<Record<GdsChartType, string>> = {
    line: 'ordered trend path',
    area: 'filled trend surface',
    bar: 'category bars',
    'stacked-bar': 'grouped category stacks',
    pie: 'part-to-whole slices',
    donut: 'part-to-whole ring',
    radar: 'radial dimension profile',
    scatter: 'x/y point field',
  };

  return labels[type] ?? 'vendor-neutral chart surface';
}

function getSetBRendererLabel(type: GdsChartType) {
  const labels: Partial<Record<GdsChartType, string>> = {
    bubble: 'weighted x/y bubble field',
    heatmap: 'row/column intensity matrix',
    funnel: 'stage conversion progression',
    treemap: 'hierarchical area distribution',
  };

  return labels[type] ?? 'advanced chart surface';
}

function getSetCRendererLabel(type: GdsChartType) {
  const labels: Partial<Record<GdsChartType, string>> = {
    candlestick: 'open-high-low-close price series',
    sankey: 'source-to-target flow diagram',
  };

  return labels[type] ?? 'specialized chart surface';
}

// Chart types that have a drawing. Every other type renders its metadata card; the data table
// fallback renders for all types.
const DRAWN_CHART_TYPES: Partial<Record<GdsChartType, SemanticRendererKind>> = {
  line: 'line',
  area: 'area',
  bar: 'bar',
  'stacked-bar': 'stacked-bar',
  radar: 'radar',
  heatmap: 'heatmap',
};

function DefaultChartRenderer(context: GdsChartRendererContext) {
  const { type, title, summary, data, definition, labelledBy, describedBy } = context;
  const drawn = DRAWN_CHART_TYPES[type];
  if (drawn) return semanticRenderer(drawn, 'primary')(context);
  return (
    <Paper withBorder radius="md" p="md" role="img" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text id={labelledBy} fw={700}>{title}</Text>
          <Badge variant="light">{type}</Badge>
        </Group>
        <Text id={describedBy} size="sm" c="dimmed">
          {summary}
        </Text>
        <Text size="xs" c="dimmed">Type lane: {type}</Text>
        <Text size="xs" c="dimmed">Registry family: {definition.family}</Text>
        {isGdsChartSetAType(type) ? (
          <Text size="xs" c="dimmed">Set A primitive: {getSetARendererLabel(type)}</Text>
        ) : null}
        {isGdsChartSetBType(type) ? (
          <Text size="xs" c="dimmed">Set B primitive: {getSetBRendererLabel(type)}</Text>
        ) : null}
        {isGdsChartSetCType(type) ? (
          <Text size="xs" c="dimmed">Set C primitive: {getSetCRendererLabel(type)}</Text>
        ) : null}
        <Text size="xs" c="dimmed">Data points: {data.length}</Text>
      </Stack>
    </Paper>
  );
}

/**
 * Governed chart wrapper: it validates `data` for the requested `type`, resolves
 * the loading/empty/error/ready `state`, and always renders an accessible
 * data-table fallback alongside the visual so the information is never color- or
 * canvas-only. Use this for every in-product chart instead of calling a charting
 * library directly, so validation, state handling, and the accessible fallback
 * come for free.
 */
export function GdsChart({
  type,
  title,
  summary,
  data,
  config = {},
  legend = gdsDefaultChartLegend,
  state,
  retryAction,
  renderer,
}: GdsChartProps) {
  const labelledBy = useId();
  const describedBy = useId();
  const validation = validateGdsChartData(type, data, config);
  const resolvedState = state ?? validation.state;
  const tableRows = validation.visibleData.map((item) => ({
    label: item.label,
    value: config.valueFormatter ? config.valueFormatter(item.value) : String(item.value ?? 'missing'),
    secondaryValue: item.secondaryValue === undefined || item.secondaryValue === null ? '-' : String(item.secondaryValue),
    group: item.group ?? '-',
  }));
  const Renderer = renderer ?? DefaultChartRenderer;
  // Optional columns appear only when some row has a value in them; an all-"-" column only
  // widens the table.
  const hasSecondary = tableRows.some((row) => row.secondaryValue !== '-');
  const hasGroup = tableRows.some((row) => row.group !== '-');

  return (
    <ChartTokenPanel
      title={title}
      description={`${validation.definition.label} chart. ${validation.definition.summaryHint}`}
      summary={validation.issues.length ? `${summary} ${validation.issues.join(' ')}` : summary}
      state={resolvedState}
      retryAction={retryAction}
      legend={legend}
      tableFallback={(
        <SimpleDataTable
          columns={[
            { key: 'label', header: 'Label' },
            { key: 'value', header: config.tableValueHeader ?? 'Value' },
            ...(hasSecondary ? [{ key: 'secondaryValue', header: 'Secondary value' }] : []),
            ...(hasGroup ? [{ key: 'group', header: config.groupLabel ?? 'Group' }] : []),
          ]}
          rows={tableRows}
        />
      )}
    >
      {resolvedState === 'ready' || resolvedState === 'partial' || resolvedState === 'permission-limited' ? (
        <Renderer
          type={type}
          title={title}
          summary={summary}
          data={validation.visibleData}
          config={config}
          definition={validation.definition}
          labelledBy={labelledBy}
          describedBy={describedBy}
        />
      ) : null}
    </ChartTokenPanel>
  );
}
