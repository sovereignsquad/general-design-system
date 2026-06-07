import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { GdsChart, type GdsChartDatum, type GdsChartProps, type GdsChartRendererContext } from './GdsChart';

export type GdsSeriesTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export const gdsSeriesPalette: Record<GdsSeriesTone, string> = {
  primary: 'var(--mantine-primary-color-filled)',
  success: 'var(--mantine-color-green-6)',
  warning: 'var(--mantine-color-yellow-7)',
  danger: 'var(--mantine-color-red-6)',
  info: 'var(--mantine-color-blue-6)',
  neutral: 'var(--mantine-color-gray-6)',
  accent: 'var(--mantine-color-violet-6)',
};

export function getGdsSeriesColor(tone: GdsSeriesTone = 'primary') {
  return gdsSeriesPalette[tone];
}

export interface SemanticChartFrameProps {
  title: string;
  summary: string;
  children: ReactNode;
  labelledBy: string;
  describedBy: string;
}

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
          <Box h={12} bg={getGdsSeriesColor(tone)} style={{ width: `${Math.max(4, Math.abs(item.value ?? 0) / max * 100)}%`, borderRadius: 4 }} />
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

function semanticRenderer(kind: 'bar' | 'line' | 'stacked-bar', tone: GdsSeriesTone) {
  return ({ title, summary, data, labelledBy, describedBy }: GdsChartRendererContext) => (
    <SemanticChartFrame title={title} summary={summary} labelledBy={labelledBy} describedBy={describedBy}>
      {kind === 'line' ? <Line data={data} tone={tone} /> : <Bars data={data} tone={tone} />}
    </SemanticChartFrame>
  );
}

export interface SemanticChartProps extends Omit<GdsChartProps, 'type' | 'legend' | 'renderer'> {
  seriesTone?: GdsSeriesTone;
}

export function GdsBarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('bar', seriesTone)} />;
}

export function GdsLineChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="line" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('line', seriesTone)} />;
}

export function GdsStackedBarChart({ seriesTone = 'primary', ...props }: SemanticChartProps) {
  return <GdsChart {...props} type="stacked-bar" legend={[{ label: 'Series', token: seriesTone }]} renderer={semanticRenderer('stacked-bar', seriesTone)} />;
}

export const GdsChartTooltip = Paper;
export const GdsChartLegend = Group;
export const GdsChartAxis = Box;
export const GdsResponsiveChartFrame = SemanticChartFrame;

