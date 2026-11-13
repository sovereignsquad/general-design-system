import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { ChartTokenPanel } from './ChartTokenPanel';
import { GdsRemovableTag } from './GdsRemovableTag';
import { MetricCard } from './MetricCard';
import { CountBadge } from './StatusBadge';

// Each status surface paints a contrast-checked badge pair (#952), never a Mantine tint.
function badgeStyle(container: HTMLElement, text: string) {
  const badge = [...container.querySelectorAll<HTMLElement>('.mantine-Badge-root')].find((el) => el.textContent?.includes(text));
  expect(badge, `badge "${text}"`).toBeTruthy();
  return badge!.getAttribute('style') ?? '';
}

describe('status surfaces read badge token pairs (#952)', () => {
  it('GdsRemovableTag paints the soft pair of its tone', () => {
    const { container } = renderWithGds(<GdsRemovableTag label="Music" removeLabel="Remove Music" onRemove={() => {}} tone="success" />);
    const style = badgeStyle(container, 'Music');
    expect(style).toContain('var(--gds-badge-soft-success)');
    expect(style).toContain('var(--gds-badge-soft-success-fg)');
  });

  it('MetricCard trend maps positive, negative and neutral to success, danger and neutral', () => {
    for (const [tone, lane] of [['positive', 'success'], ['negative', 'danger'], ['neutral', 'neutral']] as const) {
      const { container, unmount } = renderWithGds(<MetricCard label="Revenue" value="12" trend={{ tone, label: `trend-${tone}` }} />);
      const style = badgeStyle(container, `trend-${tone}`);
      expect(style).toContain(`var(--gds-badge-soft-${lane})`);
      expect(style).toContain(`var(--gds-badge-soft-${lane}-fg)`);
      unmount();
    }
  });

  it('CountBadge paints the solid info pair', () => {
    const { container } = renderWithGds(<CountBadge value={7} srLabel="7 items" />);
    const style = badgeStyle(container, '7');
    expect(style).toContain('var(--gds-badge-solid-info)');
    expect(style).toContain('var(--gds-badge-solid-info-fg)');
  });

  it('ChartTokenPanel state badge paints a soft pair', () => {
    const { container } = renderWithGds(<ChartTokenPanel title="Visits" summary="Weekly visits" state="permission-limited" />);
    expect(badgeStyle(container, 'permission limited')).toContain('var(--gds-badge-soft-info)');
  });
});
