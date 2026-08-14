import { describe, expect, it, vi } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { fireEvent } from '@testing-library/react';
import { GdsMapFilterRail } from './GdsMapFilterRail';

const OPTIONS = [
  { id: 'soccer', label: 'Soccer', count: 12 },
  { id: 'swim', label: 'Swimming', count: 4 },
];

describe('GdsMapFilterRail (#547)', () => {
  it('renders "All" first, always, with the total when every option carries a count', () => {
    const { container } = renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={OPTIONS} value={null} onChange={() => {}} />,
    );
    const radios = [...container.querySelectorAll('[role="radio"]')];
    expect(radios.length).toBe(3);
    expect(radios[0].textContent).toContain('All');
    expect(radios[0].textContent).toContain('16');
    expect(radios[1].textContent).toContain('Soccer');
    expect(radios[1].textContent).toContain('12');
  });

  it('renders correctly with zero filters — just "All", and no invented total', () => {
    const { container } = renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={[]} value={null} onChange={() => {}} />,
    );
    const radios = [...container.querySelectorAll('[role="radio"]')];
    expect(radios.length).toBe(1);
    expect(radios[0].textContent).toContain('All');
    expect(radios[0].textContent).not.toMatch(/\d/);
  });

  it('omits the "All" total when any option is missing a count — a partial sum lies', () => {
    const { container } = renderWithGds(
      <GdsMapFilterRail
        ariaLabel="Filter"
        options={[{ id: 'a', label: 'A', count: 5 }, { id: 'b', label: 'B' }]}
        value={null}
        onChange={() => {}}
      />,
    );
    const all = container.querySelector('[role="radio"]') as HTMLElement;
    expect(all.textContent).not.toContain('5');
  });

  it('speaks null for "All" and ids for filters', () => {
    const onChange = vi.fn();
    const { container } = renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={OPTIONS} value={null} onChange={onChange} />,
    );
    const radios = [...container.querySelectorAll('[role="radio"]')];
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith('soccer');
    const selected = renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={OPTIONS} value="soccer" onChange={onChange} />,
    );
    fireEvent.click(selected.container.querySelector('[role="radio"]') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('marks the selected pill with aria-checked and a check glyph', () => {
    const { container } = renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={OPTIONS} value="soccer" onChange={() => {}} />,
    );
    const selected = container.querySelector('[role="radio"][aria-checked="true"]') as HTMLElement;
    expect(selected.textContent).toContain('Soccer');
    expect(selected.querySelector('[data-gds-icon="Success"]')).not.toBeNull();
    const unselected = container.querySelector('[role="radio"][aria-checked="false"]') as HTMLElement;
    expect(unselected.querySelector('[data-gds-icon]')).toBeNull();
  });

  it('reports its rendered height so the map can inset its viewport', () => {
    const heights: number[] = [];
    renderWithGds(
      <GdsMapFilterRail ariaLabel="Filter" options={OPTIONS} value={null} onChange={() => {}} onHeightChange={(h) => heights.push(h)} />,
    );
    expect(heights.length).toBeGreaterThan(0);
  });
});
