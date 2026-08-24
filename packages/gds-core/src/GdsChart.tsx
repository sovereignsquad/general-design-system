import type { ReactNode } from 'react';
import { useId } from 'react';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { ChartTokenPanel, type ChartTokenPanelState } from './ChartTokenPanel';
import { SimpleDataTable } from './SimpleDataTable';

/** Every chart type GDS governs, across the cartesian, part-to-whole, radial, matrix, hierarchy, process, financial, and flow families. */
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
  | 'treemap'
  | 'candlestick'
  | 'sankey';

/** Set A: the core chart types (line, area, bar, stacked-bar, pie, donut, radar, scatter) every consumer surface supports. */
export type GdsChartSetAType =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked-bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'scatter';

/** Set B: advanced distribution and hierarchy chart types (bubble, heatmap, funnel, treemap). */
export type GdsChartSetBType =
  | 'bubble'
  | 'heatmap'
  | 'funnel'
  | 'treemap';

/** Specialized chart types (issue 398): financial (candlestick) and network-flow (sankey), the data-heavy chart families most peer design systems (Carbon, Spectrum) include that GDS didn't. */
export type GdsChartSetCType =
  | 'candlestick'
  | 'sankey';

/** A single chart data point; which fields carry meaning depends on the chart type. */
export interface GdsChartDatum {
  label: string;
  /** Primary numeric value; `null` marks a missing point (gapped or skipped depending on type/config). */
  value: number | null;
  /** Series or matrix-row grouping key; required by grouped types like stacked-bar and heatmap. */
  group?: string;
  /** Second measure — scatter y-value, bubble size, and similar. */
  secondaryValue?: number | null;
  /** Candlestick (OHLC) fields — open/high/low/close for the period this point represents. */
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  /** Sankey (flow) fields — the node this point flows from/to; `value` carries the flow magnitude. */
  source?: string;
  target?: string;
}

/** Registry entry for a chart type: its display label, family, data-point bounds, and validation flags. */
export interface GdsChartTypeDefinition {
  type: GdsChartType;
  label: string;
  family: 'cartesian' | 'part-to-whole' | 'radial' | 'matrix' | 'hierarchy' | 'process';
  minDataPoints: number;
  maxDataPoints: number;
  /** Type requires a `group` on every datum (e.g. stacked-bar). */
  requiresGroup?: boolean;
  /** Type reads each datum's `secondaryValue` (e.g. scatter, bubble). */
  supportsSecondaryValue?: boolean;
  /** Short hint describing what the chart communicates. */
  summaryHint: string;
}

/** One legend entry mapping a series `label` to its design `token`. */
export interface GdsChartLegendItem {
  label: string;
  token: string;
  description?: string;
}

/** Options shared by every chart config: data-point bounds, large-series decimation, value formatting, and table-fallback headers. */
export interface GdsChartBaseConfig {
  minDataPoints?: number;
  maxDataPoints?: number;
  /** Down-sample series above `maxDataPoints` instead of erroring. */
  decimateLargeSeries?: boolean;
  /** Formats each numeric value for both the visual and the table fallback. */
  valueFormatter?: (value: number | null) => ReactNode;
  /** Header for the `group` column in the table fallback. */
  groupLabel?: string;
  /** Header for the value column in the table fallback. */
  tableValueHeader?: string;
}

/** Config for cartesian types (line, area, bar, scatter, and similar). */
export interface GdsCartesianChartConfig extends GdsChartBaseConfig {
  allowNegative?: boolean;
  /** Bridge across `null` points instead of breaking the line/area. */
  connectNulls?: boolean;
  showValueMarkers?: boolean;
}

/** Config for part-to-whole types (pie, donut). */
export interface GdsPartToWholeChartConfig extends GdsChartBaseConfig {
  showPercentages?: boolean;
  /** Slices below this value are treated as too small to render. */
  minSliceValue?: number;
}

/** Config for radar charts. */
export interface GdsRadarChartConfig extends GdsChartBaseConfig {
  /** Fixed maximum applied to every radial axis. */
  maxAxisValue?: number;
}

/** Config for scatter charts. */
export interface GdsScatterChartConfig extends GdsChartBaseConfig {
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** Require a numeric `secondaryValue` (y) on every point; defaults to on. */
  requireSecondaryValue?: boolean;
}

/** Config for bubble charts, where each datum's `secondaryValue` drives bubble size. */
export interface GdsBubbleChartConfig extends GdsChartBaseConfig {
  xAxisLabel?: string;
  yAxisLabel?: string;
  sizeLabel?: string;
}

/** Config for heatmap charts; each datum's `group` supplies the matrix row. */
export interface GdsHeatmapChartConfig extends GdsChartBaseConfig {
  rowLabel?: string;
  columnLabel?: string;
}

/** Config for funnel charts. */
export interface GdsFunnelChartConfig extends GdsChartBaseConfig {
  /** Enforce that each stage is no larger than the previous one; defaults to on. */
  enforceDescending?: boolean;
}

/** Config for treemap charts. */
export interface GdsTreemapChartConfig extends GdsChartBaseConfig {
  parentLabel?: string;
}

/** Config for candlestick charts, which read each datum's open/high/low/close. */
export interface GdsCandlestickChartConfig extends GdsChartBaseConfig {
  priceAxisLabel?: string;
}

/** Config for sankey charts, which read each datum's `source`, `target`, and `value`. */
export interface GdsSankeyChartConfig extends GdsChartBaseConfig {
  nodeLabel?: string;
}

/** Union of every chart config; the applicable member is chosen by the chart `type`. */
export type GdsChartConfig =
  | GdsCartesianChartConfig
  | GdsPartToWholeChartConfig
  | GdsRadarChartConfig
  | GdsScatterChartConfig
  | GdsBubbleChartConfig
  | GdsHeatmapChartConfig
  | GdsFunnelChartConfig
  | GdsTreemapChartConfig
  | GdsCandlestickChartConfig
  | GdsSankeyChartConfig;

/** Result of {@link validateGdsChartData}: the resolved surface state, any issue messages, the data actually rendered, and the type definition. */
export interface GdsChartValidationResult {
  state: ChartTokenPanelState;
  issues: string[];
  /** The data that will actually render (decimated when oversized and allowed). */
  visibleData: GdsChartDatum[];
  definition: GdsChartTypeDefinition;
}

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

/** Canonical registry of every {@link GdsChartType} keyed to its {@link GdsChartTypeDefinition}. */
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
  candlestick: { type: 'candlestick', label: 'Candlestick', family: 'cartesian', minDataPoints: 1, maxDataPoints: 500, summaryHint: 'Open-high-low-close price movement over time.' },
  sankey: { type: 'sankey', label: 'Sankey', family: 'process', minDataPoints: 1, maxDataPoints: 200, requiresGroup: false, summaryHint: 'Flow volume between source and target stages.' },
};

/** Default two-entry legend (primary and secondary series) used when no `legend` is supplied. */
export const gdsDefaultChartLegend: GdsChartLegendItem[] = [
  { label: 'Primary series', token: 'brand.primary', description: 'Primary measured value' },
  { label: 'Secondary series', token: 'support', description: 'Grouped or comparative value' },
];

/** Registry subset covering only the Set A chart types. */
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

/** Registry subset covering only the Set B chart types. */
export const gdsChartSetBTypeRegistry: Record<GdsChartSetBType, GdsChartTypeDefinition> = {
  bubble: gdsChartTypeRegistry.bubble,
  heatmap: gdsChartTypeRegistry.heatmap,
  funnel: gdsChartTypeRegistry.funnel,
  treemap: gdsChartTypeRegistry.treemap,
};

/** Registry subset covering only the Set C (specialized) chart types. */
export const gdsChartSetCTypeRegistry: Record<GdsChartSetCType, GdsChartTypeDefinition> = {
  candlestick: gdsChartTypeRegistry.candlestick,
  sankey: gdsChartTypeRegistry.sankey,
};

/** Type guard: whether `type` belongs to the Set A chart types. */
export function isGdsChartSetAType(type: GdsChartType): type is GdsChartSetAType {
  return type in gdsChartSetATypeRegistry;
}

/** Type guard: whether `type` belongs to the Set B chart types. */
export function isGdsChartSetBType(type: GdsChartType): type is GdsChartSetBType {
  return type in gdsChartSetBTypeRegistry;
}

/** Type guard: whether `type` belongs to the Set C chart types. */
export function isGdsChartSetCType(type: GdsChartType): type is GdsChartSetCType {
  return type in gdsChartSetCTypeRegistry;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function decimateGdsChartData(data: GdsChartDatum[], maxDataPoints: number) {
  if (data.length <= maxDataPoints) {
    return data;
  }

  if (maxDataPoints <= 1) {
    return data.slice(0, 1);
  }

  const lastIndex = data.length - 1;
  const selectedIndexes = new Set<number>();

  for (let index = 0; index < maxDataPoints; index += 1) {
    selectedIndexes.add(Math.round((index * lastIndex) / (maxDataPoints - 1)));
  }

  return Array.from(selectedIndexes)
    .sort((a, b) => a - b)
    .map((index) => data[index]);
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

/**
 * Validates `data` against the rules for `type` — min/max point bounds, required
 * groups, and per-type numeric constraints — and resolves the surface state, the
 * issue messages, and the data to actually render (decimated when oversized and
 * allowed). Powers {@link GdsChart}; call it directly to pre-check a dataset.
 */
export function validateGdsChartData(
  type: GdsChartType,
  data: GdsChartDatum[],
  config: GdsChartConfig = {},
): GdsChartValidationResult {
  const definition = gdsChartTypeRegistry[type];
  const minDataPoints = config.minDataPoints ?? definition.minDataPoints;
  const maxDataPoints = config.maxDataPoints ?? definition.maxDataPoints;
  const issues: string[] = [];
  let visibleData = data;
  let decimated = false;

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
    if (!config.decimateLargeSeries) {
      return {
        state: 'error',
        issues: [`Dataset has ${data.length} points, above the ${maxDataPoints} point rendering budget.`],
        visibleData: data.slice(0, maxDataPoints),
        definition,
      };
    }

    visibleData = decimateGdsChartData(data, maxDataPoints);
    decimated = true;
    issues.push(`Dataset has ${data.length} points and was decimated to ${visibleData.length} points for rendering.`);
  }

  visibleData.forEach((item, index) => {
    if (!item.label.trim()) {
      issues.push(`Point ${index + 1} is missing a visible label.`);
    }

    if (item.value === null && (type === 'line' || type === 'area') && 'connectNulls' in config && config.connectNulls) {
      return;
    }

    // Candlestick points carry their real data in open/high/low/close, not `value`
    // (checked separately below) — skip the generic numeric-value requirement here.
    if (type === 'candlestick') {
      return;
    }

    if (!isFiniteNumber(item.value)) {
      issues.push(`Point ${index + 1} has an invalid numeric value.`);
    }
  });

  if (definition.requiresGroup && visibleData.some((item) => !item.group)) {
    issues.push(`${definition.label} charts require a group value for every data point.`);
  }

  if (type === 'pie' || type === 'donut') {
    const numericValues = visibleData.map((item) => item.value).filter(isFiniteNumber);
    const total = numericValues.reduce((sum, value) => sum + value, 0);

    if (numericValues.some((value) => value < 0)) {
      issues.push(`${definition.label} charts cannot render negative slice values.`);
    }

    if (total <= 0) {
      issues.push(`${definition.label} charts require a positive total.`);
    }
  }

  if (type === 'radar') {
    const numericValues = visibleData.map((item) => item.value).filter(isFiniteNumber);
    if (numericValues.some((value) => value < 0)) {
      issues.push('Radar charts cannot render negative axis values.');
    }
  }

  if (type === 'scatter' && (!('requireSecondaryValue' in config) || config.requireSecondaryValue !== false)) {
    visibleData.forEach((item, index) => {
      if (!isFiniteNumber(item.secondaryValue)) {
        issues.push(`Scatter point ${index + 1} requires a numeric secondaryValue.`);
      }
    });
  }

  if (type === 'bubble') {
    visibleData.forEach((item, index) => {
      if (!isFiniteNumber(item.secondaryValue)) {
        issues.push(`Bubble point ${index + 1} requires a numeric secondaryValue for bubble size.`);
      } else if (item.secondaryValue <= 0) {
        issues.push(`Bubble point ${index + 1} requires a positive secondaryValue for bubble size.`);
      }
    });
  }

  if (type === 'heatmap') {
    visibleData.forEach((item, index) => {
      if (!item.group) {
        issues.push(`Heatmap cell ${index + 1} requires a group value for the matrix row.`);
      }
    });
  }

  if (type === 'funnel') {
    const numericValues = visibleData.map((item) => item.value).filter(isFiniteNumber);
    if (numericValues.some((value) => value < 0)) {
      issues.push('Funnel charts cannot render negative stage values.');
    }

    const shouldEnforceDescending = !('enforceDescending' in config) || config.enforceDescending !== false;
    if (shouldEnforceDescending) {
      numericValues.forEach((value, index) => {
        const previousValue = numericValues[index - 1];
        if (index > 0 && value > previousValue) {
          issues.push(`Funnel stage ${index + 1} cannot be greater than the previous stage.`);
        }
      });
    }
  }

  if (type === 'treemap') {
    visibleData.forEach((item, index) => {
      if (isFiniteNumber(item.value) && item.value <= 0) {
        issues.push(`Treemap node ${index + 1} requires a positive area value.`);
      }
    });
  }

  if (type === 'candlestick') {
    visibleData.forEach((item, index) => {
      const { open, high, low, close } = item;
      if (![open, high, low, close].every(isFiniteNumber)) {
        issues.push(`Candlestick point ${index + 1} requires numeric open, high, low, and close values.`);
        return;
      }
      if (high! < Math.max(open!, close!) || low! > Math.min(open!, close!)) {
        issues.push(`Candlestick point ${index + 1} has a high/low range that doesn't contain its open/close values.`);
      }
    });
  }

  if (type === 'sankey') {
    visibleData.forEach((item, index) => {
      if (!item.source || !item.target) {
        issues.push(`Sankey flow ${index + 1} requires both a source and a target node.`);
      }
      if (isFiniteNumber(item.value) && item.value < 0) {
        issues.push(`Sankey flow ${index + 1} cannot render a negative flow value.`);
      }
    });
  }

  return {
    state: issues.length ? (decimated && issues.length === 1 ? 'partial' : 'error') : 'ready',
    issues,
    visibleData,
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
