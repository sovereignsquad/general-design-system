import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsBulkActionBar } from './GdsBulkActionBar';

describe('GdsBulkActionBar (#956)', () => {
  it('renders only with a selection, states the count and runs actions', async () => {
    const onDelete = vi.fn();
    const onClear = vi.fn();
    const { container, rerender } = renderWithGds(<GdsBulkActionBar selectedCount={0} actions={[{ action: 'delete', onClick: onDelete }]} onClearSelection={onClear} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
    rerender(<GdsBulkActionBar selectedCount={3} actions={[{ action: 'delete', onClick: onDelete }]} onClearSelection={onClear} />);
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(bar.textContent).toContain('3 selected');
    expect((bar.getAttribute('style') ?? '')).toContain('var(--gds-bg-raised)');
    const buttons = bar.querySelectorAll('button');
    fireEvent.click(buttons[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    await expectNoAxeViolations(container);
  });

  it('announces count changes, including the change to zero, in a mounted live region', () => {
    const { rerender } = renderWithGds(<GdsBulkActionBar selectedCount={2} actions={[]} onClearSelection={() => {}} />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('2 selected');
    rerender(<GdsBulkActionBar selectedCount={0} actions={[]} onClearSelection={() => {}} />);
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('Selection cleared');
  });
});
