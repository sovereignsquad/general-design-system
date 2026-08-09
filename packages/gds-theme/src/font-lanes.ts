import type { MantineThemeOverride } from '@mantine/core';
import { mergeThemeOverrides } from '@mantine/core';
import { getGdsLocaleIdsByScript } from './i18n';

/** Identifier of a built-in GDS font lane (a paired body/heading font stack). */
export type GdsFontLaneId =
  | 'inter'
  | 'manrope'
  | 'space-grotesk'
  | 'plus-jakarta'
  | 'nunito'
  | 'work-sans'
  | 'barlow'
  | 'dm-sans'
  | 'partner-discovery'
  | 'instrument-serif'
  | 'source-serif'
  | 'playfair-display';

/** Where a lane's fonts come from: a native system stack or a Google-Fonts-compatible web font. */
export type GdsFontLaneSource = 'system' | 'google-fonts-compatible';
/** How a lane's fonts are loaded: from the system stack, or via a non-blocking stylesheet link. */
export type GdsFontLaneLoadStrategy = 'system-stack' | 'non-blocking-stylesheet';

/** A resolved font lane: paired body/heading/mono stacks plus loading and coverage metadata. */
export interface GdsFontLane {
  id: GdsFontLaneId;
  /** Human-readable lane name (e.g. `'Plus Jakarta Sans'`). */
  label: string;
  /** CSS `font-family` stack for body copy. */
  body: string;
  /** CSS `font-family` stack for headings. */
  heading: string;
  /** CSS `font-family` stack for monospace text. */
  mono: string;
  /** Fallback family stack rendered until the web font loads. */
  fallbackStack: string;
  /** Locale ids this lane's fonts adequately cover. */
  localeCoverage: string[];
  /** System stack vs Google-Fonts-compatible web font. */
  source: GdsFontLaneSource;
  /** Always `'swap'` so text renders immediately in the fallback. */
  fontDisplay: 'swap';
  /** Loading strategy derived from `source`. */
  loadStrategy: GdsFontLaneLoadStrategy;
  /** Stylesheet URL that loads the web font, when one is required. */
  cssImportUrl?: string;
}

const sansFallback = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serifFallback = 'Georgia, "Times New Roman", serif';
const monoFallback = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const broadLatinLocales = getGdsLocaleIdsByScript(['latin']);
const broadUiLocales = getGdsLocaleIdsByScript(['latin', 'cyrillic']);

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
  lane({ id: 'partner-discovery', label: 'Partner Discovery', body: `Inter, ${sansFallback}`, heading: `Jost, ${sansFallback}`, fallbackStack: sansFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap' }),
  lane({ id: 'instrument-serif', label: 'Instrument Serif', body: sansFallback, heading: `"Instrument Serif", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Instrument+Serif') }),
  lane({ id: 'source-serif', label: 'Source Serif', body: `"Source Serif 4", ${serifFallback}`, heading: `"Source Serif 4", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadUiLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Source+Serif+4') }),
  // Class USA v2 re-base (issue 536): display Playfair Display, body Inter.
  lane({ id: 'playfair-display', label: 'Playfair Display', body: sansFallback, heading: `"Playfair Display", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Playfair+Display') }),
] as const;

/** Returns a copy of all built-in font lanes. */
export function getGdsFontLanes() {
  return [...lanes];
}

/** Type guard: `true` when `id` is a known `GdsFontLaneId`. */
export function isGdsFontLaneId(id: unknown): id is GdsFontLaneId {
  return typeof id === 'string' && lanes.some((lane) => lane.id === id);
}

/** Resolves a lane by id, falling back to the first lane (`inter`) for unknown/nullish ids. */
export function resolveGdsFontLane(id: GdsFontLaneId | string | null | undefined): GdsFontLane {
  return lanes.find((lane) => lane.id === id) ?? lanes[0];
}

/** Returns the de-duplicated set of web-font stylesheet URLs across all lanes. */
export function getGdsFontLaneStylesheetUrls() {
  return [...new Set(lanes.flatMap((lane) => lane.cssImportUrl ? [lane.cssImportUrl] : []))];
}

/** Merges a lane's body/heading/mono fonts and lane metadata into a Mantine theme override. */
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
