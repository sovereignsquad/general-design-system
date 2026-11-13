import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateGdsAccessibilityFloor } from './accessibility-floor';
import { createBrandTheme } from './brand-tokens';
import {
  emitChartCssVariables,
  evaluateGdsChartContrast,
  GDS_CHART_AREA_OPACITY,
  GDS_CHART_SERIES_COUNT,
} from './chart-tokens';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

const series = (tokens: Record<string, string>) =>
  Array.from({ length: GDS_CHART_SERIES_COUNT }, (_, i) => tokens[`--gds-chart-series-${i + 1}`]);

describe('chart tokens (#954)', () => {
  it('every preset and scheme emits eight distinct series, a grid and axis text that clear contrast on the card', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const tokens = getGdsVibeThemeCssVariables(id, scheme);
        const values = series(tokens);
        expect(values.every(Boolean), `${id} ${scheme}`).toBe(true);
        expect(new Set(values).size, `${id} ${scheme}`).toBe(GDS_CHART_SERIES_COUNT);
        expect(tokens['--gds-chart-grid'], `${id} ${scheme}`).toBeTruthy();
        const failing = evaluateGdsChartContrast(tokens).filter((result) => !result.passes);
        expect(failing, `${id} ${scheme}`).toEqual([]);
      }
    }
  });

  it('series 1 follows the lane brand accent, including hand-authored lanes', () => {
    const tokens = getGdsVibeThemeCssVariables('class-usa', 'light');
    const recomputed = emitChartCssVariables({ ...tokens, '--gds-bg-card-dark': tokens['--gds-bg-card'] });
    expect(tokens['--gds-chart-series-1']).toBe(recomputed['--gds-chart-series-1']);
  });

  it('pushes a low-contrast seed until it clears 3:1 on the card', () => {
    const vars = emitChartCssVariables({ '--gds-bg-card': '#ffffff', '--gds-bg-card-dark': '#111111', '--gds-brand-accent': '#f5f5f5', '--gds-brand-accent-dark': '#1a1a1a' });
    for (const scheme of ['', '-dark']) {
      const tokens = Object.fromEntries(Object.entries(vars).filter(([k]) => (scheme ? k.endsWith('-dark') : !k.endsWith('-dark'))).map(([k, v]) => [k.replace(/-dark$/, ''), v]));
      tokens['--gds-bg-card'] = scheme ? '#111111' : '#ffffff';
      expect(evaluateGdsChartContrast(tokens).filter((result) => !result.passes)).toEqual([]);
    }
  });

  it('the generic brand lane carries chart roles', () => {
    const vars = createBrandTheme({ brandColors: { navy: '#0b223e', terracotta: '#ca8570', sage: '#90a287', cream: '#faf7f1', slate: '#434c59' }, fonts: { display: 'Bogart', body: 'Garet' } }).mantineTheme.other.gdsCssVariables as Record<string, string>;
    expect(series(vars).every(Boolean)).toBe(true);
    expect(vars['--gds-chart-axis-text']).toBeTruthy();
    expect(vars['--gds-chart-axis-text-dark']).toBeTruthy();
  });

  it('styles.css declares the area opacity stops once, from GDS_CHART_AREA_OPACITY', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf8');
    expect(css).toContain(`--gds-chart-area-opacity-start: ${GDS_CHART_AREA_OPACITY.start};`);
    expect(css).toContain(`--gds-chart-area-opacity-end: ${GDS_CHART_AREA_OPACITY.end};`);
  });

  it('the accessibility floor fails a series below 3:1, missing roles and duplicate series', () => {
    const tokens = getGdsVibeThemeCssVariables('default', 'light');
    const rule = (overrides: Record<string, string | undefined>) =>
      validateGdsAccessibilityFloor({ presetId: 'default', scheme: 'light', tokens: { ...tokens, ...overrides } as Record<string, string> })
        .filter((violation) => violation.ruleId === 'chart-roles-legible');

    expect(rule({})).toEqual([]);
    expect(rule({ '--gds-chart-series-3': '#f4f4f4' })).toHaveLength(1);
    expect(rule({ '--gds-chart-axis-text': '#bbbbbb' })).toHaveLength(1);
    expect(rule({ '--gds-chart-series-4': tokens['--gds-chart-series-2'] })).toHaveLength(1);
    const missing = { ...tokens };
    delete missing['--gds-chart-series-8'];
    expect(validateGdsAccessibilityFloor({ presetId: 'default', scheme: 'light', tokens: missing }).filter((v) => v.ruleId === 'chart-roles-legible')).toHaveLength(1);
  });
});
