import type { ReactNode } from 'react';
import { useId } from 'react';
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

export type GdsChartSetAType =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked-bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'scatter';

export interface GdsChartDatum {
  label: string;
  value: number | null;
  group?: string;
  secondaryValue?: number | null;
}

export interface GdsChartTypeDefinition {
  type: GdsChartType;
  label: string;
  family: 'cartesian' | 'part-to-whole' | 'radial' | 'matrix' | 'hierarchy' | 'process';
  minDataPoints: number;
  maxDataPoints: number;
  requiresGroup?: boolean;
  supportsSecondaryValue?: boolean;
  summaryHint: string;
}

export interface GdsChartLegendItem {
  label: string;
  token: string;
  description?: string;
}

export interface GdsChartBaseConfig {
  minDataPoints?: number;
  maxDataPoints?: number;
  valueFormatter?: (value: number | null) => ReactNode;
  groupLabel?: string;
  tableValueHeader?: string;
}

export interface GdsCartesianChartConfig extends GdsChartBaseConfig {
  allowNegative?: boolean;
  connectNulls?: boolean;
  showValueMarkers?: boolean;
}

export interface GdsPartToWholeChartConfig extends GdsChartBaseConfig {
  showPercentages?: boolean;
  minSliceValue?: number;
}

export interface GdsRadarChartConfig extends GdsChartBaseConfig {
  maxAxisValue?: number;
}

export interface GdsScatterChartConfig extends GdsChartBaseConfig {
  xAxisLabel?: string;
  yAxisLabel?: string;
  requireSecondaryValue?: boolean;
}

export type GdsChartConfig =
  | GdsCartesianChartConfig
  | GdsPartToWholeChartConfig
  | GdsRadarChartConfig
  | GdsScatterChartConfig;

export interface GdsChartValidationResult {
  state: ChartTokenPanelState;
  issues: string[];
  visibleData: GdsChartDatum[];
  definition: GdsChartTypeDefinition;
}

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

export type GdsChartRendererAdapter = (context: GdsChartRendererContext) => ReactNode;

export interface GdsChartProps {
  type: GdsChartType;
  title: string;
  summary: string;
  data: GdsChartDatum[];
  config?: GdsChartConfig;
  legend?: GdsChartLegendItem[];
  state?: ChartTokenPanelState;
  retryAction?: ReactNode;
  renderer?: GdsChartRendererAdapter;
}

export const gdsChartTypeRegistry: Record<GdsChartType, GdsChartTypeDefinition> = {
  line: { type: 'line', label: 'Line', family: 'cartesian', minDataPoints: 2, maxDataPoints: 500, summaryHint: 'Trend over an ordered series.' },
  area: { type: 'area', label: 'Area', family: 'cartesian', minDataPoints: 2, maxDataPoints: 500, summaryHint: 'Filled trend over an ordered series.' },
  bar: { type: 'bar', label: 'Bar', family: 'cartesian', minDataPoints: 1, maxDataPoints: 200, summaryHint: 'Category comparison.' },
  'stacked-bar': { type: 'stacked-bar', label: 'Stacked bar', family: 'cartesian', minDataPoints: 2, maxDataPoints: 300, requiresGroup: true, summaryHint: 'Grouped category contribution.' },
  pie: { type: 'pie', label: 'Pie', family: 'part-to-whole', minDataPoints: 2, maxDataPoints: 12, summaryHint: 'Part-to-whole split.' },
  donut: { type: 'donut', label: 'Donut', family: 'part-to-whole', minDataPoints: 2, maxDataPoints: 12, summaryHint: 'Part-to-whole split with center context.' },
  radar: { type: 'radar', label: 'Radar', family: 'radial', minDataPoints: 3, maxDataPoints: 24, summaryHint: 'Multi-dimension profile.' },
  scatter: { type: 'scatter', label: 'Scatter', family: 'cartesian', minDataPoints: 2, maxDataPoints: 500, supportsSecondaryValue: true, summaryHint: 'Correlation or distribution map.' },
  bubble: { type: 'bubble', label: 'Bubble', family: 'cartesian', minDataPoints: 2, maxDataPoints: 300, supportsSecondaryValue: true, summaryHint: 'Weighted distribution map.' },
  heatmap: { type: 'heatmap', label: 'Heatmap', family: 'matrix', minDataPoints: 2, maxDataPoints: 400, summaryHint: 'Intensity matrix.' },
  funnel: { type: 'funnel', label: 'Funnel', family: 'process', minDataPoints: 2, maxDataPoints: 12, summaryHint: 'Stage conversion progression.' },
  treemap: { type: 'treemap', label: 'Treemap', family: 'hierarchy', minDataPoints: 2, maxDataPoints: 200, summaryHint: 'Hierarchical distribution.' },
};

export const gdsDefaultChartLegend: GdsChartLegendItem[] = [
  { label: 'Primary series', token: 'blue.6', description: 'Primary measured value' },
  { label: 'Secondary series', token: 'teal.6', description: 'Grouped or comparative value' },
];

export const gdsChartSetATypeRegistry: Record<GdsChartSetAType, GdsChartTypeDefinition> = {
  line: gdsChartTypeRegistry.line,
  area: gdsChartTypeRegistry.area,
  bar: gdsChartTypeRegistry.bar,
  'stacked-bar': gdsChartTypeRegistry['stacked-bar'],
  pie: gdsChartTypeRegistry.pie,
  donut: gdsChartTypeRegistry.donut,
  radar: gdsChartTypeRegistry.radar,
  scatter: gdsChartTypeRegistry.scatter,
};

export function isGdsChartSetAType(type: GdsChartType): type is GdsChartSetAType {
  return type in gdsChartSetATypeRegistry;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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

export function validateGdsChartData(
  type: GdsChartType,
  data: GdsChartDatum[],
  config: GdsChartConfig = {},
): GdsChartValidationResult {
  const definition = gdsChartTypeRegistry[type];
  const minDataPoints = config.minDataPoints ?? definition.minDataPoints;
  const maxDataPoints = config.maxDataPoints ?? definition.maxDataPoints;
  const issues: string[] = [];

  if (!data.length) {
    return { state: 'empty', issues: ['Dataset is empty.'], visibleData: [], definition };
  }

  if (data.length < minDataPoints) {
    return {
      state: 'below-threshold',
      issues: [`${definition.label} charts require at least ${minDataPoints} data points.`],
      visibleData: data,
      definition,
    };
  }

  if (data.length > maxDataPoints) {
    return {
      state: 'error',
      issues: [`Dataset has ${data.length} points, above the ${maxDataPoints} point rendering budget.`],
      visibleData: data.slice(0, maxDataPoints),
      definition,
    };
  }

  data.forEach((item, index) => {
    if (!item.label.trim()) {
      issues.push(`Point ${index + 1} is missing a visible label.`);
    }

    if (item.value === null && (type === 'line' || type === 'area') && 'connectNulls' in config && config.connectNulls) {
      return;
    }

    if (!isFiniteNumber(item.value)) {
      issues.push(`Point ${index + 1} has an invalid numeric value.`);
    }
  });

  if (definition.requiresGroup && data.some((item) => !item.group)) {
    issues.push(`${definition.label} charts require a group value for every data point.`);
  }

  if (type === 'pie' || type === 'donut') {
    const numericValues = data.map((item) => item.value).filter(isFiniteNumber);
    const total = numericValues.reduce((sum, value) => sum + value, 0);

    if (numericValues.some((value) => value < 0)) {
      issues.push(`${definition.label} charts cannot render negative slice values.`);
    }

    if (total <= 0) {
      issues.push(`${definition.label} charts require a positive total.`);
    }
  }

  if (type === 'radar') {
    const numericValues = data.map((item) => item.value).filter(isFiniteNumber);
    if (numericValues.some((value) => value < 0)) {
      issues.push('Radar charts cannot render negative axis values.');
    }
  }

  if (type === 'scatter' && (!('requireSecondaryValue' in config) || config.requireSecondaryValue !== false)) {
    data.forEach((item, index) => {
      if (!isFiniteNumber(item.secondaryValue)) {
        issues.push(`Scatter point ${index + 1} requires a numeric secondaryValue.`);
      }
    });
  }

  return {
    state: issues.length ? 'error' : 'ready',
    issues,
    visibleData: data,
    definition,
  };
}

function DefaultChartRenderer({ type, title, summary, data, definition, labelledBy, describedBy }: GdsChartRendererContext) {
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
        <Text size="xs" c="dimmed">Data points: {data.length}</Text>
      </Stack>
    </Paper>
  );
}

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
            { key: 'secondaryValue', header: 'Secondary value' },
            { key: 'group', header: config.groupLabel ?? 'Group' },
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
