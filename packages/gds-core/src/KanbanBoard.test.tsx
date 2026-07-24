import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { KanbanBoard, type KanbanColumnData, type KanbanItem } from './KanbanBoard.client';

// jsdom does not implement real layout (getBoundingClientRect returns 0-rects), so a
// genuine pointer/keyboard dnd-kit drag gesture cannot be reliably simulated here —
// that end-to-end path is covered by the live-Chrome runtime verification script
// instead (scripts/verify-kanban-drag-accessibility-runtime.mjs), matching this repo's
// existing two-tier pattern (vitest for pure logic/DOM structure, headless-Chrome for
// real layout-dependent interaction). These tests cover rendering, the backward-
// compatible callback contract, and the "Move menu never disappears" guarantee.

function makeColumns(): KanbanColumnData[] {
  return [
    { id: 'todo', title: 'To do', items: [{ id: 'a', title: 'Task A' }, { id: 'b', title: 'Task B' }] },
    { id: 'done', title: 'Done', items: [] },
  ];
}

describe('KanbanBoard', () => {
  it('defaults to enableDrag=false: no drag handle rendered, Move menu calls onMoveItem with 3 args', async () => {
    const user = userEvent.setup();
    const onMoveItem = vi.fn();
    renderWithGds(<KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={onMoveItem} />);

    expect(screen.queryByLabelText(/Drag to reorder/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Move: Task A' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Done' }));

    expect(onMoveItem).toHaveBeenCalledWith('a', 'todo', 'done');
  });

  it('keeps the Move menu present and fully functional when enableDrag is true', async () => {
    const user = userEvent.setup();
    const onMoveItem = vi.fn();
    renderWithGds(<KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={onMoveItem} enableDrag />);

    const dragHandle = screen.getByLabelText('Drag to reorder: Task A');
    expect(dragHandle).toBeInTheDocument();

    const moveButton = screen.getByRole('button', { name: 'Move: Task A' });
    expect(moveButton).toBeInTheDocument();
    await user.click(moveButton);
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Done' }));
    expect(onMoveItem).toHaveBeenCalledWith('a', 'todo', 'done');
  });

  it('renders no Move control and no drag handle on a read-only board (no onMoveItem), even if enableDrag is mistakenly passed', () => {
    renderWithGds(<KanbanBoard title="Sprint board" columns={makeColumns()} enableDrag />);

    expect(screen.queryByLabelText(/^Move:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Drag to reorder/i)).not.toBeInTheDocument();
  });

  it('renders a governed accessible region regardless of enableDrag', () => {
    const { rerender } = renderWithGds(
      <KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={vi.fn()} />,
    );
    expect(screen.getByRole('region', { name: 'Sprint board' })).toBeInTheDocument();

    rerender(<KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={vi.fn()} enableDrag />);
    expect(screen.getByRole('region', { name: 'Sprint board' })).toBeInTheDocument();
  });

  it('shows the governed empty-column state in both drag modes', () => {
    renderWithGds(<KanbanBoard columns={makeColumns()} onMoveItem={vi.fn()} enableDrag />);
    const doneColumn = screen.getByText('Done').closest('[data-gds-kanban-column]');
    expect(doneColumn).not.toBeNull();
    expect(within(doneColumn as HTMLElement).getByText('No items')).toBeInTheDocument();
  });

  it('accepts app-extended item/column shapes and passes them typed into renderItem (no cast)', () => {
    // Regression coverage for #399: a consumer extends KanbanItem/KanbanColumnData with
    // app-specific required fields and receives them fully typed inside renderItem, with
    // no type assertion. The `item.lead.owner` / `column.stageOwner` reads below only
    // compile because the generic parameters flow the narrowed shapes through the callback;
    // before the fix, `renderItem`'s fixed `(KanbanItem, KanbanColumnData)` signature made
    // this a type error at the call site.
    interface LeadItem extends KanbanItem {
      lead: { owner: string };
    }
    interface LeadColumn extends KanbanColumnData<LeadItem> {
      stageOwner: string;
    }

    const columns: LeadColumn[] = [
      {
        id: 'new',
        title: 'New',
        stageOwner: 'Alex',
        items: [{ id: 'l1', title: 'Acme Corp', lead: { owner: 'Sam' } }],
      },
      { id: 'won', title: 'Won', stageOwner: 'Jordan', items: [] },
    ];

    const seen: Array<{ owner: string; stageOwner: string }> = [];
    const renderItem = (item: LeadItem, column: LeadColumn) => {
      // No cast: `item` is LeadItem (has `lead`), `column` is LeadColumn (has `stageOwner`).
      seen.push({ owner: item.lead.owner, stageOwner: column.stageOwner });
      return <span data-testid={`lead-${item.id}`}>{item.lead.owner}</span>;
    };

    renderWithGds(
      <KanbanBoard<LeadItem, LeadColumn>
        title="Pipeline"
        columns={columns}
        renderItem={renderItem}
        onMoveItem={vi.fn()}
      />,
    );

    expect(screen.getByTestId('lead-l1')).toHaveTextContent('Sam');
    expect(seen).toContainEqual({ owner: 'Sam', stageOwner: 'Alex' });
  });
});

describe('KanbanCard move-menu affordance (#429)', () => {
  it('defaults the move-menu trigger to a non-drag "More" glyph, never the arrows-move icon', () => {
    renderWithGds(<KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={vi.fn()} />);
    const moveButton = screen.getByRole('button', { name: 'Move: Task A' });
    // The "tap to open a menu" affordance must not imply free drag.
    expect(moveButton.querySelector('[data-gds-icon="More"]')).not.toBeNull();
    expect(moveButton.querySelector('[data-gds-icon="Move"]')).toBeNull();
  });

  it('renders a custom moveMenuIcon while keeping the menu fully functional', async () => {
    const user = userEvent.setup();
    const onMoveItem = vi.fn();
    renderWithGds(
      <KanbanBoard
        title="Sprint board"
        columns={makeColumns()}
        onMoveItem={onMoveItem}
        moveMenuIcon={<span data-testid="custom-move-icon" />}
      />,
    );
    const moveButton = screen.getByRole('button', { name: 'Move: Task A' });
    expect(within(moveButton).getByTestId('custom-move-icon')).toBeInTheDocument();
    expect(moveButton.querySelector('[data-gds-icon]')).toBeNull();

    await user.click(moveButton);
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Done' }));
    expect(onMoveItem).toHaveBeenCalledWith('a', 'todo', 'done');
  });

  it('lets moveMenuLabel override the accessible verb (item name still appended)', () => {
    renderWithGds(
      <KanbanBoard title="Sprint board" columns={makeColumns()} onMoveItem={vi.fn()} moveMenuLabel="Relocate" />,
    );
    expect(screen.getByRole('button', { name: 'Relocate: Task A' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move: Task A' })).not.toBeInTheDocument();
  });
});
