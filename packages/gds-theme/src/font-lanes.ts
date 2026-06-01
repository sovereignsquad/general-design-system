import type { MantineThemeOverride } from '@mantine/core';
import { mergeThemeOverrides } from '@mantine/core';

export type GdsFontLaneId =
  | 'inter'
  | 'manrope'
  | 'space-grotesk'
  | 'plus-jakarta'
  | 'nunito'
  | 'work-sans'
  | 'barlow'
  | 'dm-sans'
  | 'instrument-serif'
  | 'source-serif';

export interface GdsFontLane {
  id: GdsFontLaneId;
  label: string;
  body: string;
  heading: string;
  mono: string;
}

const lanes: GdsFontLane[] = [
  { id: 'inter', label: 'Inter', body: 'Inter, system-ui, sans-serif', heading: 'Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'manrope', label: 'Manrope', body: 'Manrope, system-ui, sans-serif', heading: 'Manrope, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'space-grotesk', label: 'Space Grotesk', body: '"Space Grotesk", Inter, system-ui, sans-serif', heading: '"Space Grotesk", Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', body: '"Plus Jakarta Sans", Inter, system-ui, sans-serif', heading: '"Plus Jakarta Sans", Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'nunito', label: 'Nunito', body: 'Nunito, Inter, system-ui, sans-serif', heading: 'Nunito, Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'work-sans', label: 'Work Sans', body: '"Work Sans", Inter, system-ui, sans-serif', heading: '"Work Sans", Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'barlow', label: 'Barlow', body: 'Barlow, Inter, system-ui, sans-serif', heading: 'Barlow, Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'dm-sans', label: 'DM Sans', body: '"DM Sans", Inter, system-ui, sans-serif', heading: '"DM Sans", Inter, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'instrument-serif', label: 'Instrument Serif', body: 'Inter, system-ui, sans-serif', heading: '"Instrument Serif", Georgia, serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'source-serif', label: 'Source Serif', body: '"Source Serif 4", Georgia, serif', heading: '"Source Serif 4", Georgia, serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

export function getGdsFontLanes() {
  return lanes;
}

export function resolveGdsFontLane(id: GdsFontLaneId): GdsFontLane {
  return lanes.find((lane) => lane.id === id) ?? lanes[0];
}

export function applyGdsFontLane(theme: MantineThemeOverride, laneId: GdsFontLaneId): MantineThemeOverride {
  const lane = resolveGdsFontLane(laneId);
  return mergeThemeOverrides(theme, {
    fontFamily: lane.body,
    fontFamilyMonospace: lane.mono,
    headings: {
      fontFamily: lane.heading,
    },
  });
}
