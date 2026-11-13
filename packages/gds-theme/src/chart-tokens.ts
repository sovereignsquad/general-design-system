// Chart colour roles: an ordered categorical series ramp, a gridline colour and axis-label text. Derived from a lane's own semantic roles, so every preset and
// scheme gets values measured against the card surface the chart is drawn on.

import { GDS_DEFAULT_ACCENT_AXIS, type GdsAccentName } from './accent-axis';
import { contrastRatio, ensureContrast, hueAngleDistance, mixCssColors, parseCssColor, rgbToHsl } from './color-math';

/** Number of categorical series slots: `--gds-chart-series-1` to `--gds-chart-series-8`. */
export const GDS_CHART_SERIES_COUNT = 8;

/** Series against the card surface: WCAG 1.4.11 non-text contrast. */
export const GDS_CHART_SERIES_MIN_CONTRAST = 3;

/** Axis labels are text: WCAG 1.4.3. */
export const GDS_CHART_AXIS_TEXT_MIN_CONTRAST = 4.5;

/**
 * Area fill opacity at the top (`start`) and the baseline (`end`) of the vertical gradient.
 * The same in every preset and scheme, so it is declared once in styles.css
 * (`--gds-chart-area-opacity-start`/`-end`) rather than emitted with the colour roles.
 */
export const GDS_CHART_AREA_OPACITY = { start: '0.28', end: '0.02' } as const;

/**
 * Candidate order for series 2-8. Neighbours alternate warm and cool so adjacent series stay
 * apart; `slate` is excluded because a grey series reads as disabled.
 */
const SERIES_CANDIDATES: GdsAccentName[] = ['ocean', 'terracotta', 'forest', 'plum', 'bronze', 'indigo', 'magenta', 'teal', 'grape'];

/** Minimum hue distance from every earlier series before a candidate is used out of order. */
const MIN_SERIES_HUE_SEPARATION = 24;

/** Below this HSL saturation a colour has no usable hue, so hue separation is not measured. */
const ACHROMATIC_SATURATION = 15;

function hueOf(color: string): number | null {
  const rgb = parseCssColor(color);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb);
  return hsl.s < ACHROMATIC_SATURATION ? null : hsl.h;
}

function fitToSurface(color: string, surface: string, dark: boolean): string {
  // Accent bases are dark; in the dark scheme they are lifted before the contrast push so
  // the result keeps its hue instead of converging on white.
  const start = dark ? mixCssColors(color, '#ffffff', 0.6, surface) : color;
  return ensureContrast(start, surface, GDS_CHART_SERIES_MIN_CONTRAST, dark, surface);
}

function seriesFor(first: string, surface: string, dark: boolean): string[] {
  const ramps = GDS_DEFAULT_ACCENT_AXIS.ramps!;
  const series = [fitToSurface(first, surface, dark)];
  const hues = [hueOf(series[0])];
  const fitted = SERIES_CANDIDATES.map((name) => fitToSurface(ramps[name]!.base, surface, dark));
  const used = new Set<number>();

  const separated = (color: string) => {
    const hue = hueOf(color);
    if (hue === null) return true;
    return hues.every((other) => other === null || hueAngleDistance(hue, other) >= MIN_SERIES_HUE_SEPARATION);
  };

  for (let i = 0; i < fitted.length && series.length < GDS_CHART_SERIES_COUNT; i += 1) {
    if (!separated(fitted[i])) continue;
    series.push(fitted[i]);
    hues.push(hueOf(fitted[i]));
    used.add(i);
  }
  for (let i = 0; i < fitted.length && series.length < GDS_CHART_SERIES_COUNT; i += 1) {
    if (used.has(i)) continue;
    series.push(fitted[i]);
    used.add(i);
  }
  return series;
}

/**
 * Emits the `--gds-chart-*` roles for both schemes from a lane's semantic variables
 * (`-dark` suffix for the dark scheme, as every other role).
 *
 * Series 1 is the lane's brand accent; series 2-8 come from the default accent axis, in
 * {@link SERIES_CANDIDATES} order, skipping hues within {@link MIN_SERIES_HUE_SEPARATION}
 * degrees of an earlier series. Each series is pushed to 3:1 against the card surface; the
 * axis text is pushed to 4.5:1 against it.
 */
export function emitChartCssVariables(base: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = {};
  const card = base['--gds-bg-card'] ?? base['--gds-bg-page'] ?? '#ffffff';
  const cardDark = base['--gds-bg-card-dark'] ?? base['--gds-bg-page-dark'] ?? '#000000';

  for (const [suffix, surface, dark] of [['', card, false], ['-dark', cardDark, true]] as const) {
    const first = base[`--gds-brand-accent${suffix}`] ?? base['--gds-brand-accent'] ?? base[`--gds-brand-primary${suffix}`] ?? base['--gds-brand-primary'] ?? (dark ? '#ffffff' : '#000000');
    seriesFor(first, surface, dark).forEach((color, index) => {
      vars[`--gds-chart-series-${index + 1}${suffix}`] = color;
    });

    const meta = base[`--gds-text-meta${suffix}`] ?? base['--gds-text-meta'] ?? (dark ? '#ffffff' : '#000000');
    vars[`--gds-chart-axis-text${suffix}`] = ensureContrast(meta, surface, GDS_CHART_AXIS_TEXT_MIN_CONTRAST, dark, surface);
    vars[`--gds-chart-grid${suffix}`] = base[`--gds-border-card${suffix}`] ?? base['--gds-border-card'] ?? mixCssColors(meta, surface, 0.25, surface);
  }
  return vars;
}

/** One measured chart contrast pair. */
export interface GdsChartContrastResult {
  role: string;
  value: string;
  surface: string;
  ratio: number;
  required: number;
  passes: boolean;
}

/** Measures every series and the axis text against the card surface of one resolved scheme. */
export function evaluateGdsChartContrast(tokens: Record<string, string>): GdsChartContrastResult[] {
  const surface = tokens['--gds-bg-card'] ?? tokens['--gds-bg-page'] ?? '#ffffff';
  const roles: Array<[string, number]> = [
    ...Array.from({ length: GDS_CHART_SERIES_COUNT }, (_, i) => [`--gds-chart-series-${i + 1}`, GDS_CHART_SERIES_MIN_CONTRAST] as [string, number]),
    ['--gds-chart-axis-text', GDS_CHART_AXIS_TEXT_MIN_CONTRAST],
  ];
  return roles.map(([role, required]) => {
    const value = tokens[role] ?? '';
    const ratio = value ? contrastRatio(value, surface, surface) ?? 0 : 0;
    return { role, value, surface, ratio: Number(ratio.toFixed(2)), required, passes: ratio >= required };
  });
}
