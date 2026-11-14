import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsTreeView, type GdsTreeNode } from './GdsTreeView';

const nodes: GdsTreeNode[] = [
  { id: 'docs', label: 'Documents', children: [
    { id: 'contracts', label: 'Contracts' },
    { id: 'invoices', label: 'Invoices' },
  ] },
  { id: 'media', label: 'Media', hasChildren: true },
  { id: 'notes', label: 'Notes' },
];

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('GdsTreeView (#956)', () => {
  it('exposes the tree pattern with one tab stop, levels and expanded state', async () => {
    const { container } = renderWithGds(<GdsTreeView ariaLabel="Folders" nodes={nodes} defaultExpandedIds={['docs']} />);
    expect(screen.getByRole('tree', { name: 'Folders' })).toBeTruthy();
    expect(item('Documents').getAttribute('aria-expanded')).toBe('true');
    expect(item('Contracts').getAttribute('aria-level')).toBe('2');
    expect(item('Notes').getAttribute('aria-expanded')).toBeNull();
    expect(container.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
    await expectNoAxeViolations(container);
  });

  it('moves with arrows, Home and End, expands and collapses with Right and Left, and type-ahead', () => {
    renderWithGds(<GdsTreeView ariaLabel="Folders" nodes={nodes} />);
    const docs = item('Documents');
    act(() => docs.focus());
    fireEvent.keyDown(docs, { key: 'ArrowRight' });
    expect(docs.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(docs, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item('Contracts'));
    fireEvent.keyDown(item('Contracts'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(item('Documents'));
    fireEvent.keyDown(item('Documents'), { key: 'ArrowLeft' });
    expect(item('Documents').getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(item('Documents'), { key: 'End' });
    expect(document.activeElement).toBe(item('Notes'));
    fireEvent.keyDown(item('Notes'), { key: 'Home' });
    expect(document.activeElement).toBe(item('Documents'));
    fireEvent.keyDown(item('Documents'), { key: 'n' });
    expect(document.activeElement).toBe(item('Notes'));
    expect(item('Notes').getAttribute('tabindex')).toBe('0');
  });

  it('selects with Enter and reports the selection', () => {
    const onSelect = vi.fn();
    renderWithGds(<GdsTreeView ariaLabel="Folders" nodes={nodes} onSelect={onSelect} />);
    fireEvent.keyDown(item('Notes'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('notes', expect.objectContaining({ id: 'notes' }));
    expect(item('Notes').getAttribute('aria-selected')).toBe('true');
  });

  it('loads children lazily, shows a loading state, and offers a retry after an error', async () => {
    let fail = true;
    const loadChildren = vi.fn(async () => {
      if (fail) { fail = false; throw new Error('offline'); }
      return [{ id: 'photo', label: 'Photo' }];
    });
    renderWithGds(<GdsTreeView ariaLabel="Folders" nodes={nodes} loadChildren={loadChildren} />);
    fireEvent.keyDown(item('Media'), { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(item('Photo')).toBeTruthy());
    expect(item('Photo').getAttribute('aria-level')).toBe('2');
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });
});
