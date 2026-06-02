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

export type GdsFontLaneSource = 'system' | 'google-fonts-compatible';
export type GdsFontLaneLoadStrategy = 'system-stack' | 'non-blocking-stylesheet';

export interface GdsFontLane {
  id: GdsFontLaneId;
  label: string;
  body: string;
  heading: string;
  mono: string;
  fallbackStack: string;
  localeCoverage: string[];
  source: GdsFontLaneSource;
  fontDisplay: 'swap';
  loadStrategy: GdsFontLaneLoadStrategy;
  cssImportUrl?: string;
}

const sansFallback = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serifFallback = 'Georgia, "Times New Roman", serif';
const monoFallback = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const broadLatinLocales = ['en', 'de', 'fr', 'it', 'hu'];
const broadUiLocales = ['en', 'de', 'fr', 'it', 'hu', 'ru'];

function googleFontUrl(family: string) {
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700;800&display=swap`;
}

function lane(input: Omit<GdsFontLane, 'fontDisplay' | 'loadStrategy' | 'mono'> & { mono?: string }): GdsFontLane {
  return {
    mono: monoFallback,
    fontDisplay: 'swap',
    loadStrategy: input.source === 'system' ? 'system-stack' : 'non-blocking-stylesheet',
    ...input,
  };
}

const lanes: readonly GdsFontLane[] = [
  lane({ id: 'inter', label: 'Inter', body: `Inter, ${sansFallback}`, heading: `Inter, ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Inter') }),
  lane({ id: 'manrope', label: 'Manrope', body: `Manrope, ${sansFallback}`, heading: `Manrope, ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Manrope') }),
  lane({ id: 'space-grotesk', label: 'Space Grotesk', body: `"Space Grotesk", ${sansFallback}`, heading: `"Space Grotesk", ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Space+Grotesk') }),
  lane({ id: 'plus-jakarta', label: 'Plus Jakarta Sans', body: `"Plus Jakarta Sans", ${sansFallback}`, heading: `"Plus Jakarta Sans", ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Plus+Jakarta+Sans') }),
  lane({ id: 'nunito', label: 'Nunito', body: `Nunito, ${sansFallback}`, heading: `Nunito, ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Nunito') }),
  lane({ id: 'work-sans', label: 'Work Sans', body: `"Work Sans", ${sansFallback}`, heading: `"Work Sans", ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Work+Sans') }),
  lane({ id: 'barlow', label: 'Barlow', body: `Barlow, ${sansFallback}`, heading: `Barlow, ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Barlow') }),
  lane({ id: 'dm-sans', label: 'DM Sans', body: `"DM Sans", ${sansFallback}`, heading: `"DM Sans", ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('DM+Sans') }),
  lane({ id: 'instrument-serif', label: 'Instrument Serif', body: sansFallback, heading: `"Instrument Serif", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Instrument+Serif') }),
  lane({ id: 'source-serif', label: 'Source Serif', body: `"Source Serif 4", ${serifFallback}`, heading: `"Source Serif 4", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Source+Serif+4') }),
] as const;

export function getGdsFontLanes() {
  return [...lanes];
}

export function isGdsFontLaneId(id: unknown): id is GdsFontLaneId {
  return typeof id === 'string' && lanes.some((lane) => lane.id === id);
}

export function resolveGdsFontLane(id: GdsFontLaneId | string | null | undefined): GdsFontLane {
  return lanes.find((lane) => lane.id === id) ?? lanes[0];
}

export function getGdsFontLaneStylesheetUrls() {
  return [...new Set(lanes.flatMap((lane) => lane.cssImportUrl ? [lane.cssImportUrl] : []))];
}

export function applyGdsFontLane(theme: MantineThemeOverride, laneId: GdsFontLaneId | string | null | undefined): MantineThemeOverride {
  const lane = resolveGdsFontLane(laneId);
  return mergeThemeOverrides(theme, {
    fontFamily: lane.body,
    fontFamilyMonospace: lane.mono,
    headings: {
      fontFamily: lane.heading,
    },
    other: {
      ...theme.other,
      gdsFontLane: lane.id,
      gdsFontFallbackStack: lane.fallbackStack,
      gdsFontLoadStrategy: lane.loadStrategy,
      gdsFontDisplay: lane.fontDisplay,
    },
  });
}
