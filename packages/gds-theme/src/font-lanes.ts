import type { MantineThemeOverride } from '@mantine/core';
import { mergeThemeOverrides } from '@mantine/core';
import { getGdsLocaleIds, getGdsLocaleScripts, type GdsLocaleScript } from './i18n';

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
  | 'playfair-display'
  | 'noto-sans-universal';

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

/**
 * Every font lane must render every language GDS supports; there is no partial lane.
 *
 * Every lane ends in `universalScriptFallback`, which names a Noto family for each script in
 * the catalog. A lane's own display face still leads the stack, so Latin text keeps its
 * character; the browser only reaches the Noto entries for glyphs the display face lacks.
 *
 * The script list comes from `getGdsLocaleScripts()`, so adding a locale in a new script
 * makes `SCRIPT_FONTS` incomplete and fails the build. `verify:font-lane-coverage` enforces
 * this against the same catalog.
 */
const SCRIPT_FONTS: Record<GdsLocaleScript, string> = {
  latin: 'Noto Sans',
  cyrillic: 'Noto Sans',
  hebrew: 'Noto Sans Hebrew',
  arabic: 'Noto Sans Arabic',
  // Han is drawn differently in Japanese and Simplified Chinese, so one family cannot serve
  // both. Listing JP before SC matches the catalog order and keeps each locale's own face.
  han: 'Noto Sans SC',
  kana: 'Noto Sans JP',
  hangul: 'Noto Sans KR',
};

/** Distinct Noto families needed to cover every supported script, in catalog order. */
const universalFamilies = [...new Set(getGdsLocaleScripts().map((script) => {
  const family = SCRIPT_FONTS[script];
  if (!family) {
    throw new Error(`No font family declared for script "${script}" — a lane cannot cover every supported locale.`);
  }
  return family;
}))];

/** Appended to every lane so no supported language can fall through to tofu. */
const universalScriptFallback = universalFamilies.map((family) => `"${family}"`).join(', ');

const systemSans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const sansFallback = `Inter, ${universalScriptFallback}, ${systemSans}`;
const serifFallback = `Georgia, "Times New Roman", ${universalScriptFallback}, serif`;
const monoFallback = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, ${universalScriptFallback}, monospace`;

// Every lane covers every locale, so both sets resolve to the full catalog. Kept as named
// bindings so the lane table reads by intent; derived rather than written so they cannot
// drift from the catalog.
const broadLatinLocales = getGdsLocaleIds();
const broadUiLocales = getGdsLocaleIds();

/** The Noto families every lane depends on, requested alongside the lane's own face. */
const universalFamilyParams = universalFamilies
  .map((family) => `family=${family.replace(/ /g, '+')}:wght@400;500;600;700`)
  .join('&');

function googleFontUrl(family: string) {
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700;800&${universalFamilyParams}&display=swap`;
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
  // Class USA v2 re-base: display Playfair Display, body Inter.
  lane({ id: 'playfair-display', label: 'Playfair Display', body: sansFallback, heading: `"Playfair Display", ${serifFallback}`, fallbackStack: serifFallback, localeCoverage: broadLatinLocales, source: 'google-fonts-compatible', cssImportUrl: googleFontUrl('Playfair+Display') }),
  // A lane that leads with the universal families themselves, for products whose primary
  // audience reads a non-Latin script and want that face to set the tone rather than sit in
  // the fallback position. Every other lane also covers these languages; this one puts them
  // first.
  lane({
    id: 'noto-sans-universal',
    label: 'Noto Sans Universal',
    body: `${universalScriptFallback}, ${systemSans}`,
    heading: `${universalScriptFallback}, ${systemSans}`,
    fallbackStack: systemSans,
    localeCoverage: getGdsLocaleIds(),
    source: 'google-fonts-compatible',
    cssImportUrl: `https://fonts.googleapis.com/css2?${universalFamilyParams}&display=swap`,
  }),
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
