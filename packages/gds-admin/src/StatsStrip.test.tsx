import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { StatsStrip } from './StatsStrip';

describe('StatsStrip change badge (#952)', () => {
  it('paints a contrast-checked soft badge pair: success for a rise, danger for a fall', () => {
    const { container } = renderWithGds(<StatsStrip stats={[{ label: 'Up', value: '1', diff: 4 }, { label: 'Down', value: '2', diff: -3 }]} />);
    const style = (text: string) => [...container.querySelectorAll<HTMLElement>('.mantine-Badge-root')].find((el) => el.textContent === text)?.getAttribute('style') ?? '';
    expect(style('+4%')).toContain('var(--gds-badge-soft-success)');
    expect(style('+4%')).toContain('var(--gds-badge-soft-success-fg)');
    expect(style('-3%')).toContain('var(--gds-badge-soft-danger)');
    expect(style('-3%')).toContain('var(--gds-badge-soft-danger-fg)');
  });
});
