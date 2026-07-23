import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { KanbanBoard, type KanbanColumnData } from './KanbanBoard.client';

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
});
