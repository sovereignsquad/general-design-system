import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { GdsChart, type GdsChartDatum, type GdsChartProps, type GdsChartRendererContext } from './GdsChart';

/** Semantic series color tokens for GDS charts, each resolved to a theme variable by {@link gdsSeriesPalette}. */
export type GdsSeriesTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

/** Maps each {@link GdsSeriesTone} to its resolved CSS color variable (brand/state token with Mantine fallbacks). */
export const gdsSeriesPalette: Record<GdsSeriesTone, string> = {
  primary: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
  success: 'var(--gds-state-success, var(--mantine-color-green-6))',
  warning: 'var(--gds-state-warning, var(--mantine-color-yellow-7))',
  danger: 'var(--gds-state-danger, var(--mantine-color-red-6))',
  info: 'var(--gds-state-info, var(--gds-vibe-accent, var(--mantine-primary-color-filled)))',
  neutral: 'var(--gds-text-meta, var(--gds-vibe-muted, var(--mantine-color-gray-6)))',
  accent: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
};

/** Returns the resolved CSS color for a series tone (defaults to `'primary'`). */
export function getGdsSeriesColor(tone: GdsSeriesTone = 'primary') {
  return gdsSeriesPalette[tone];
}

/** Props for {@link SemanticChartFrame}. */
export interface SemanticChartFrameProps {
  title: string;
  summary: string;
  children: ReactNode;
  /** Element id that labels the chart region (wired to `aria-labelledby`). */
  labelledBy: string;
  /** Element id that describes the chart region (wired to `aria-describedby`). */
  describedBy: string;
}

/**
 * Accessible, bordered frame for a semantic chart. Renders the title and summary
 * and exposes the whole panel as a single `role="img"` region labelled and
 * described by the supplied element ids.
 */
export function SemanticChartFrame({ title, summary, children, labelledBy, describedBy }: SemanticChartFrameProps) {
  return (
    <Paper withBorder radius="md" p="md" role="img" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      <Stack gap="sm">
        <Text id={labelledBy} fw={700}>{title}</Text>
        <Text id={describedBy} size="sm" c="dimmed">{summary}</Text>
        {children}
      </Stack>
    </Paper>
  );
}

function getMaxValue(data: GdsChartDatum[]) {
  return Math.max(1, ...data.map((item) => Math.abs(item.value ?? 0)));
}

function Bars({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  return (
    <Stack gap="xs">
      {data.map((item) => (
        <Group key={`${item.group ?? 'series'}-${item.label}`} gap="xs" wrap="nowrap">
          <Text size="xs" miw={96}>{item.label}</Text>
          <Box h={12} bg={getGdsSeriesColor(tone)} style={{ width: `${Math.max(4, Math.abs(item.value ?? 0) / max * 100)}%`, borderRadius: 'var(--mantine-radius-sm)' }} />
          <Text size="xs" c="dimmed">{item.value ?? '-'}</Text>
        </Group>
      ))}
    </Stack>
  );
}

function Line({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  const points = data.map((item, index) => `${(index / Math.max(1, data.length - 1)) * 100},${100 - (Math.abs(item.value ?? 0) / max) * 90}`).join(' ');
  return (
    <Box component="svg" viewBox="0 0 100 100" h={140} w="100%" role="presentation" aria-hidden>
      <polyline points={points} fill="none" stroke={getGdsSeriesColor(tone)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

function Area({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  const points = data.map((item, index) => `${(index / Math.max(1, data.length - 1)) * 100},${100 - (Math.abs(item.value ?? 0) / max) * 90}`).join(' ');
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <Box component="svg" viewBox="0 0 100 100" h={140} w="100%" role="presentation" aria-hidden>
      <polygon points={areaPoints} fill={getGdsSeriesColor(tone)} opacity="0.18" />
      <polyline points={points} fill="none" stroke={getGdsSeriesColor(tone)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

function Sparkline({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  const points = data.map((item, index) => `${(index / Math.max(1, data.length - 1)) * 100},${24 - (Math.abs(item.value ?? 0) / max) * 20}`).join(' ');

  return (
    <Box component="svg" viewBox="0 0 100 28" h={48} w="100%" role="presentation" aria-hidden>
      <polyline points={points} fill="none" stroke={getGdsSeriesColor(tone)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

function Radar({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  const center = 50;
  const radius = 42;
  const points = data.map((item, index) => {
    const angle = ((Math.PI * 2) / data.length) * index - Math.PI / 2;
    const ratio = Math.abs(item.value ?? 0) / max;
    return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
  }).join(' ');

  return (
    <Box component="svg" viewBox="0 0 100 100" h={160} w="100%" role="presentation" aria-hidden>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--gds-border-card, var(--mantine-color-gray-3))" strokeWidth="1" />
      <polygon points={points} fill={getGdsSeriesColor(tone)} opacity="0.2" />
      <polyline points={`${points} ${points.split(' ')[0]}`} fill="none" stroke={getGdsSeriesColor(tone)} strokeWidth="2.5" strokeLinejoin="round" />
    </Box>
  );
}

function Gauge({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);
  const current = Math.max(0, data[0]?.value ?? 0);
  const width = `${Math.min(100, (current / max) * 100)}%`;

  return (
    <Stack gap="xs">
      <Box h={18} bg="var(--gds-bg-info-tag, var(--mantine-color-gray-1))" style={{ borderRadius: 'var(--mantine-radius-xl)', overflow: 'hidden' }}>
        <Box h="100%" bg={getGdsSeriesColor(tone)} style={{ width, borderRadius: 'var(--mantine-radius-xl)' }} />
      </Box>
      <Text size="xs" c="dimmed">{data[0]?.label ?? 'Current'}: {data[0]?.value ?? '-'}</Text>
    </Stack>
  );
}

function Heatmap({ data, tone = 'primary' }: { data: GdsChartDatum[]; tone?: GdsSeriesTone }) {
  const max = getMaxValue(data);

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))',
        gap: 'var(--mantine-spacing-xs)',
      }}
    >
      {data.map((item) => (
        <Box
          key={`${item.group ?? 'row'}-${item.label}`}
          p="xs"
          style={{
            minHeight: 48,
            borderRadius: 'var(--mantine-radius-sm)',
            background: getGdsSeriesColor(tone),
            opacity: Math.max(0.22, Math.abs(item.value ?? 0) / max),
          }}
        >
          <Text size="xs" c="var(--gds-text-on-inverse, var(--mantine-color-white))">{item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

type SemanticRendererKind = 'bar' | 'line' | 'stacked-bar' | 'area' | 'sparkline' | 'radar' | 'gauge' | 'heatmap';

function semanticRenderer(kind: SemanticRendererKind, tone: GdsSeriesTone) {
  return ({ title, summary, data, labelledBy, describedBy }: GdsChartRendererContext) => (
    <SemanticChartFrame title={title} summary={summary} labelledBy={labelledBy} describedBy={describedBy}>
      {kind === 'line' ? <Line data={data} tone={tone} /> : null}
      {kind === 'area' ? <Area data={data} tone={tone} /> : null}
      {kind === 'sparkline' ? <Sparkline data={data} tone={tone} /> : null}
      {kind === 'radar' ? <Radar data={data} tone={tone} /> : null}
      {kind === 'gauge' ? <Gauge data={data} tone={tone} /> : null}
      {kind === 'heatmap' ? <Heatmap data={data} tone={tone} /> : null}
      {kind === 'bar' || kind === 'stacked-bar' ? <Bars data={data} tone={tone} /> : null}
    </SemanticChartFrame>
  );
}

/** Shared props for the semantic chart wrappers — `GdsChartProps` minus the internally-fixed `type`, `legend`, and `renderer`. */
export interface SemanticChartProps extends Omit<GdsChartProps, 'type' | 'legend' | 'renderer'> {
  /** Semantic tone applied to the series color and legend. Defaults to `'primary'` (some presets default to `'accent'`/`'neutral'`/`'info'`). */
  seriesTone?: GdsSeriesTone;
}

/** Governed bar chart with a semantic series tone. */
export function GdsBarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone)} />;
}

/** Governed line chart with a semantic series tone. */
export function GdsLineChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone)} />;
}

/** Governed stacked-bar chart with a semantic series tone. */
export function GdsStackedBarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="stacked-bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('stacked-bar', seriesTone)} />;
}

/** Governed area chart with a semantic series tone. */
export function GdsAreaChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="area" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('area', seriesTone)} />;
}

/** Compact inline line chart (sparkline); decimates large series by default. */
export function GdsSparkline({ seriesTone = 'primary', config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('sparkline', seriesTone)} />;
}

/** Line chart for longitudinal/time-series data; decimates large series by default. */
export function GdsLongitudinalChart({ seriesTone = 'primary', config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone)} />;
}

/** Bar chart whose legend is labelled as a benchmark comparison. */
export function GdsBenchmarkBarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Benchmark', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone)} />;
}

/** Governed radar/profile chart with a semantic series tone. */
export function GdsRadarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="radar" legend={[{ label: 'Profile', token: seriesTone }]} renderer={semanticRenderer('radar', seriesTone)} />;
}

/** Radar chart preset for maturity profiles (accent tone by default). */
export function GdsMaturityRadarChart({ seriesTone = 'accent', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="radar" legend={[{ label: 'Maturity', token: seriesTone }]} renderer={semanticRenderer('radar', seriesTone)} />;
}

/** Single-value gauge rendered from the first datum. */
export function GdsGaugeChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Gauge', token: seriesTone }]} renderer={semanticRenderer('gauge', seriesTone)} />;
}

/** Heatmap chart for calendar-style intensity (accent tone by default). */
export function GdsCalendarHeatmapChart({ seriesTone = 'accent', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="heatmap" legend={[{ label: 'Intensity', token: seriesTone }]} renderer={semanticRenderer('heatmap', seriesTone)} />;
}

/** Bar chart preset for distributions/histograms (neutral tone by default). */
export function GdsHistogramChart({ seriesTone = 'neutral', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Distribution', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone)} />;
}

/** Bar chart that allows negative values, for diverging series (accent tone by default). */
export function GdsDivergingBarChart({ seriesTone = 'accent', config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" config={{ allowNegative: true, ...config }} legend={[{ label: 'Diverging series', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone)} />;
}

/** Two-point slope line chart; decimates large series by default. */
export function GdsSlopeChart({ seriesTone = 'primary', config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" config={{ decimateLargeSeries: true, ...config }} legend={[{ label: 'Slope', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone)} />;
}

/** Scatter-backed chart for symmetry comparisons; secondary value optional (info tone by default). */
export function GdsSymmetryChart({ seriesTone = 'info', config, ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="scatter" config={{ requireSecondaryValue: false, ...config }} legend={[{ label: 'Symmetry', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone)} />;
}

/** Governed chart tooltip surface (aliases Mantine `Paper`). */
export const GdsChartTooltip: typeof Paper = Paper;
/** Governed chart legend container (aliases Mantine `Group`). */
export const GdsChartLegend: typeof Group = Group;
/** Governed chart axis container (aliases Mantine `Box`). */
export const GdsChartAxis: typeof Box = Box;
/** Alias of {@link SemanticChartFrame} for responsive chart layouts. */
export const GdsResponsiveChartFrame = SemanticChartFrame;
