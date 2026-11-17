import { Box, Group, Paper } from '@mantine/core';
import type { GdsSeriesTone } from './chart-colors';
import { SemanticChartFrame, semanticRenderer } from './chart-primitives';
import { GdsChart, type GdsChartProps } from './GdsChart';

export { SemanticChartFrame, type SemanticChartFrameProps } from './chart-primitives';

export { gdsSeriesPalette, getGdsSeriesColor, getGdsChartSeriesColor, resolveGdsChartTokenColor, GDS_CHART_SERIES_SLOTS, GDS_CHART_SERIES_COLORS } from './chart-colors';
export type { GdsSeriesTone } from './chart-colors';

/** Shared props for the semantic chart wrappers — `GdsChartProps` minus the internally-fixed `type`, `legend`, and `renderer`. */
export interface SemanticChartProps extends Omit<GdsChartProps, 'type' | 'legend' | 'renderer'> {
  /** Semantic tone applied to the series color and legend. Defaults to `'primary'` (some presets default to `'accent'`/`'neutral'`/`'info'`). */
  seriesTone?: GdsSeriesTone;
  /** Line and area renderers: label the first, middle and last data points under the plot. Defaults to `false`. */
  axisLabels?: boolean;
}

/** Governed bar chart with a semantic series tone. */
export function GdsBarChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone, axisLabels)} />;
}

/** Governed line chart with a semantic series tone. */
export function GdsLineChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone, axisLabels)} />;
}

/** Governed stacked-bar chart with a semantic series tone. */
export function GdsStackedBarChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="stacked-bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('stacked-bar', seriesTone, axisLabels)} />;
}

/** Governed area chart with a semantic series tone. */
export function GdsAreaChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="area" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('area', seriesTone, axisLabels)} />;
}

/** Compact inline line chart (sparkline); decimates large series by default. */
export function GdsSparkline({ seriesTone = 'primary', axisLabels, config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('sparkline', seriesTone, axisLabels)} />;
}

/** Line chart for longitudinal/time-series data; decimates large series by default. */
export function GdsLongitudinalChart({ seriesTone = 'primary', axisLabels, config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone, axisLabels)} />;
}

/** Bar chart whose legend is labelled as a benchmark comparison. */
export function GdsBenchmarkBarChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Benchmark', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone, axisLabels)} />;
}

/** Governed radar/profile chart with a semantic series tone. */
export function GdsRadarChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="radar" legend={[{ label: 'Profile', token: seriesTone }]} renderer={semanticRenderer('radar', seriesTone, axisLabels)} />;
}

/** Radar chart preset for maturity profiles (accent tone by default). */
export function GdsMaturityRadarChart({ seriesTone = 'accent', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="radar" legend={[{ label: 'Maturity', token: seriesTone }]} renderer={semanticRenderer('radar', seriesTone, axisLabels)} />;
}

/** Single-value gauge rendered from the first datum. */
export function GdsGaugeChart({ seriesTone = 'primary', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Gauge', token: seriesTone }]} renderer={semanticRenderer('gauge', seriesTone, axisLabels)} />;
}

/** Heatmap chart for calendar-style intensity (accent tone by default). */
export function GdsCalendarHeatmapChart({ seriesTone = 'accent', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="heatmap" legend={[{ label: 'Intensity', token: seriesTone }]} renderer={semanticRenderer('heatmap', seriesTone, axisLabels)} />;
}

/** Bar chart preset for distributions/histograms (neutral tone by default). */
export function GdsHistogramChart({ seriesTone = 'neutral', axisLabels, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Distribution', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone, axisLabels)} />;
}

/** Bar chart that allows negative values, for diverging series (accent tone by default). */
export function GdsDivergingBarChart({ seriesTone = 'accent', axisLabels, config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" config={{ allowNegative: true, ...config }} legend={[{ label: 'Diverging series', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone, axisLabels)} />;
}

/** Two-point slope line chart; decimates large series by default. */
export function GdsSlopeChart({ seriesTone = 'primary', axisLabels, config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Slope', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone, axisLabels)} />;
}

/** Scatter-backed chart for symmetry comparisons; secondary value optional (info tone by default). */
export function GdsSymmetryChart({ seriesTone = 'info', axisLabels, config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="scatter" config={{ requireSecondaryValue: false, ...config }} legend={[{ label: 'Symmetry', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone, axisLabels)} />;
}

/** Governed chart tooltip surface (aliases Mantine `Paper`). */
export const GdsChartTooltip: typeof Paper = Paper;
/** Governed chart legend container (aliases Mantine `Group`). */
export const GdsChartLegend: typeof Group = Group;
/** Governed chart axis container (aliases Mantine `Box`). */
export const GdsChartAxis: typeof Box = Box;
/** Alias of {@link SemanticChartFrame} for responsive chart layouts. */
export const GdsResponsiveChartFrame = SemanticChartFrame;
