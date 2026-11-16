import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { BottomTabBar } from './BottomTabBar';
import { PillBar } from './ChoiceChip';
import { GdsDesignRuleProfilePanel } from './GdsDesignRuleProfilePanel';
import { GdsPictogramSystemReference } from './GdsPictogramSystemReference';
import { MediaWithFallback } from './MediaWithFallback';
import { SectionPanel } from './SectionPanel';

const items = [
  { id: 'browse', label: 'Browse', href: '/browse' },
  { id: 'saved', label: 'Saved', href: '/saved' },
];

describe('components in narrow containers (#982)', () => {
  it('BottomTabBar gives a custom item the same equal-width cell as a built-in one', () => {
    renderWithGds(<BottomTabBar items={items} activeId="browse" renderItem={(item) => <span>{item.label}</span>} />);
    const cell = screen.getByText('Saved').parentElement as HTMLElement;
    expect(cell.style.flex).toMatch(/^1/);
    expect(cell.style.justifyContent).toBe('center');
  });

  it('PillBar leaves room for the selection and focus ring inside its scroller', () => {
    renderWithGds(<PillBar ariaLabel="Filter" options={[{ value: 'a', label: 'A' }]} value="a" onChange={() => undefined} />);
    expect(screen.getByRole('radiogroup').style.padding).toContain('--gds-focus-ring-width');
  });

  it('MediaWithFallback fills its container width instead of shrinking to its content in a row', () => {
    const { container } = renderWithGds(<MediaWithFallback alt="x" ratio={16 / 9} fallbackLabel="No image" />);
    const root = container.querySelector('.mantine-AspectRatio-root') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.style.width).toBe('100%');
  });

  it('SectionPanel marks itself so a nested panel can flatten on compact screens', () => {
    const { container } = renderWithGds(<SectionPanel title="Outer">x</SectionPanel>);
    expect(container.querySelector('[data-gds-section-panel]')).toBeTruthy();
  });

  it('system reference tables scroll inside their card', () => {
    const { container } = renderWithGds(<GdsPictogramSystemReference />);
    const tables = [...container.querySelectorAll('table')];
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) expect(table.closest('.mantine-Table-scrollContainer, [class*="ScrollContainer"]')).toBeTruthy();
  });

  it('the design-rule donut pair packs into an auto-fit grid, one column when narrow', () => {
    const { container } = renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    const css = [...container.querySelectorAll('style[data-gds-layout]')].map((s) => s.textContent ?? '').join('') + [...container.querySelectorAll('[style]')].map((el) => el.getAttribute('style')).join('');
    expect(css).toMatch(/repeat\(auto-fit, minmax\(min\(100%, 18rem\), 1fr\)\)/);
  });
});
