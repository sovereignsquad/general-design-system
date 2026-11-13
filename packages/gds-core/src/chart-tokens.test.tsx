import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { getGdsChartSeriesColor, resolveGdsChartTokenColor } from './chart-colors';
import { ChartTokenPanel } from './ChartTokenPanel';
import { GdsAreaChart, GdsLineChart, GdsSparkline } from './SemanticCharts';

const data = [
  { label: 'Jan', value: 4 },
  { label: 'Feb', value: 9 },
  { label: 'Mar', value: 6 },
  { label: 'Apr', value: 12 },
];

describe('chart tokens in the renderers (#954)', () => {
  it('area fills with a vertical gradient whose id is unique per chart', () => {
    const { container } = renderWithGds(
      <>
        <GdsAreaChart title="First" summary="First area" data={data} />
        <GdsAreaChart title="Second" summary="Second area" data={data} />
      </>,
    );
    const gradients = [...container.querySelectorAll('linearGradient')];
    expect(gradients).toHaveLength(2);
    const ids = gradients.map((gradient) => gradient.id);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      expect(id).toMatch(/^[\w-]+$/);
      expect(container.querySelector(`polygon[fill="url(#${id})"]`)).not.toBeNull();
    }
    const [top, bottom] = [...gradients[0].querySelectorAll('stop')].map((stop) => stop.getAttribute('style') ?? '');
    expect(top).toContain('var(--gds-chart-area-opacity-start)');
    expect(bottom).toContain('var(--gds-chart-area-opacity-end)');
    expect(gradients[0].getAttribute('x1')).toBe(gradients[0].getAttribute('x2'));
  });

  it('line and area draw four gridlines in the grid role; the sparkline draws none', () => {
    const { container } = renderWithGds(
      <>
        <GdsLineChart title="Line" summary="Line summary" data={data} />
        <GdsAreaChart title="Area" summary="Area summary" data={data} />
        <GdsSparkline title="Spark" summary="Spark summary" data={data} />
      </>,
    );
    const charts = container.querySelectorAll('[role="img"]');
    const grids = [...charts].map((chart) => chart.querySelectorAll('line.gds-chart-grid').length);
    expect(grids).toEqual([4, 4, 0]);
    expect(container.querySelector('line.gds-chart-grid')?.getAttribute('style')).toContain('var(--gds-chart-grid)');
  });

  it('axis labels are opt-in and read the axis text role', () => {
    const { container, rerender } = renderWithGds(<GdsLineChart title="Line" summary="Line summary" data={data} />);
    expect(container.querySelector('.gds-chart-axis')).toBeNull();
    rerender(<GdsLineChart title="Line" summary="Line summary" data={data} axisLabels />);
    const labels = [...container.querySelectorAll<HTMLElement>('.gds-chart-axis-label')];
    expect(labels.map((label) => label.textContent)).toEqual(['Jan', 'Feb', 'Apr']);
    expect(labels[0].getAttribute('style')).toContain('var(--gds-chart-axis-text)');
  });

  it('the legend paints a swatch per entry and never prints the token', () => {
    const { container, getByText, queryByText } = renderWithGds(
      <ChartTokenPanel
        title="Orders"
        summary="Orders by channel."
        legend={[
          { label: 'Online', token: 'chart.series-1' },
          { label: 'In-store', token: '--gds-chart-series-2' },
          { label: 'Partner', token: 'success' },
        ]}
      />,
    );
    expect(getByText('Online')).toBeTruthy();
    expect(queryByText(/series-1|series-2|success/)).toBeNull();
    const swatches = [...container.querySelectorAll<HTMLElement>('.gds-chart-legend-swatch')];
    expect(swatches.map((swatch) => swatch.style.background)).toEqual([
      'var(--gds-chart-series-1)',
      'var(--gds-chart-series-2)',
      'var(--gds-state-success, var(--mantine-color-green-6))',
    ]);
    expect(swatches.every((swatch) => swatch.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(container.querySelector('ul[aria-label="Chart legend"]')?.querySelectorAll('li')).toHaveLength(3);
  });
});

describe('chart color helpers (#954)', () => {
  it('resolves tones, custom properties, dotted role ids and literal colors', () => {
    expect(resolveGdsChartTokenColor('primary')).toContain('--gds-brand-primary');
    expect(resolveGdsChartTokenColor('--gds-chart-series-3')).toBe('var(--gds-chart-series-3)');
    expect(resolveGdsChartTokenColor('brand.primary')).toBe('var(--gds-brand-primary)');
    expect(resolveGdsChartTokenColor('var(--x)')).toBe('var(--x)');
    expect(resolveGdsChartTokenColor('#123456')).toBe('#123456');
    expect(resolveGdsChartTokenColor('teal')).toBe('teal');
    expect(resolveGdsChartTokenColor('toString')).toBe('toString');
  });

  it('wraps series indexes past the eighth slot', () => {
    expect(getGdsChartSeriesColor(1)).toBe('var(--gds-chart-series-1)');
    expect(getGdsChartSeriesColor(8)).toBe('var(--gds-chart-series-8)');
    expect(getGdsChartSeriesColor(9)).toBe('var(--gds-chart-series-1)');
    expect(getGdsChartSeriesColor(0)).toBe('var(--gds-chart-series-1)');
  });
});
