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

/** The categorical chart series colors, slot 1 first. */
export const GDS_CHART_SERIES_COLORS = [
  'var(--gds-chart-series-1)',
  'var(--gds-chart-series-2)',
  'var(--gds-chart-series-3)',
  'var(--gds-chart-series-4)',
  'var(--gds-chart-series-5)',
  'var(--gds-chart-series-6)',
  'var(--gds-chart-series-7)',
  'var(--gds-chart-series-8)',
] as const;

/** Number of categorical chart series slots (`--gds-chart-series-1` to `-8`). */
export const GDS_CHART_SERIES_SLOTS = GDS_CHART_SERIES_COLORS.length;

/**
 * The categorical series color for a 1-based series index. Indexes past the last slot wrap,
 * so series 9 reuses slot 1; label series directly when more than eight are shown.
 */
export function getGdsChartSeriesColor(index: number) {
  const slot = Number.isFinite(index) ? Math.max(1, Math.trunc(index)) : 1;
  return GDS_CHART_SERIES_COLORS[(slot - 1) % GDS_CHART_SERIES_SLOTS];
}

/**
 * Resolves a legend `token` to a CSS color: a {@link GdsSeriesTone}, a custom property
 * (`--gds-chart-series-2`), a dotted role id (`brand.primary` reads `--gds-brand-primary`,
 * `chart.series-3` reads `--gds-chart-series-3`), or a CSS color value, returned unchanged.
 */
export function resolveGdsChartTokenColor(token: string) {
  const value = token.trim();
  if (Object.hasOwn(gdsSeriesPalette, value)) return gdsSeriesPalette[value as GdsSeriesTone];
  if (value.startsWith('--')) return `var(${value})`;
  if (/^[a-z][\w-]*(\.[\w-]+)+$/i.test(value)) {
    return `var(--gds-${value.replace(/\./g, '-')})`;
  }
  return value;
}
