import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsAnalyticsTemplate } from './GdsPageTemplates';
import { getGdsPageTemplate, validateGdsPageTemplates } from './GdsPageTemplates.shared';
import { GdsAssetManagerTemplate, GdsWorkspaceInboxTemplate } from './GdsPageTemplates.client';
import { GdsTreeView } from './GdsTreeView';

const originalMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = originalMatchMedia; });
function narrowViewport() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'), media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

describe('page template archetypes (#958, #959, #960)', () => {
  it('registers asset-manager and workspace-inbox with valid configs', () => {
    expect(validateGdsPageTemplates()).toEqual([]);
    expect(getGdsPageTemplate('asset-manager')?.componentContracts).toContain('GdsTreeView');
    expect(getGdsPageTemplate('workspace-inbox')?.componentContracts).toContain('GdsThreadList');
    expect(getGdsPageTemplate('analytics')?.edgeCases).toEqual(expect.arrayContaining(['single data point', 'right-to-left locale']));
  });

  it('analytics renders the period control, every chart and a structured table slot', async () => {
    const { container } = renderWithGds(
      <GdsAnalyticsTemplate
        title="Revenue"
        metrics={[{ label: 'Orders', value: '42' }]}
        periodControl={<div data-testid="period">period</div>}
        charts={[<div key="a" data-testid="chart">A</div>, <div key="b" data-testid="chart">B</div>]}
        table={<table data-testid="table"><tbody><tr><td>row</td></tr></tbody></table>}
      />,
    );
    expect(screen.getByTestId('period')).toBeTruthy();
    expect(screen.getAllByTestId('chart')).toHaveLength(2);
    expect(screen.getByTestId('table')).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('asset manager orders tree, toolbar, bulk actions, layout toggle and items, on the operations profile', async () => {
    const onViewChange = vi.fn();
    const { container } = renderWithGds(
      <GdsAssetManagerTemplate
        title="Assets"
        tree={<GdsTreeView ariaLabel="Folders" nodes={[{ id: 'root', label: 'Root' }]} />}
        toolbar={<button type="button">Search</button>}
        bulkActions={{ selectedCount: 2, actions: [{ action: 'delete', onClick: () => {} }], onClearSelection: () => {} }}
        table={<div data-testid="items-table">table</div>}
        grid={<div data-testid="items-grid">grid</div>}
        onViewChange={onViewChange}
      />,
    );
    expect(container.querySelector('[data-gds-shape-profile="operations"]')).not.toBeNull();
    const order = [...container.querySelectorAll('[role="treeitem"], button, [data-gds-view-toggle]')].map((el) => el.getAttribute('role') ?? el.textContent);
    expect(order.indexOf('treeitem')).toBeLessThan(order.indexOf('Search'));
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toBeTruthy();
    expect(screen.getByTestId('items-table')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(onViewChange).toHaveBeenCalledWith('grid');
    expect(screen.getByTestId('items-grid')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Folders' })).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('workspace inbox labels its regions and asks for a selection when none is open', async () => {
    const { container } = renderWithGds(
      <GdsWorkspaceInboxTemplate title="Inbox" navigation={<a href="/">Home</a>} threadList={<ul><li>Thread</li></ul>} />,
    );
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Conversations' })).toBeTruthy();
    expect(screen.getByText('Select a conversation')).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('on a narrow viewport shows the open conversation with a back action and focuses its heading', () => {
    narrowViewport();
    const onBack = vi.fn();
    renderWithGds(
      <GdsWorkspaceInboxTemplate title="Inbox" threadList={<ul><li>Thread</li></ul>} hasSelection detailTitle="Design lead" detail={<p>Hello</p>} onBack={onBack} />,
    );
    expect(screen.queryByRole('region', { name: 'Conversations' })).toBeNull();
    const heading = screen.getByRole('heading', { name: 'Design lead' });
    expect(document.activeElement).toBe(heading);
    fireEvent.click(screen.getByRole('button', { name: 'Back to conversations' }));
    expect(onBack).toHaveBeenCalled();
  });
});
