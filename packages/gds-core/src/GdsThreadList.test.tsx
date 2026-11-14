import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsThreadList, type GdsThreadListItem } from './GdsThreadList';

const threads: GdsThreadListItem[] = [
  { id: 'a', title: 'Ada Lovelace', preview: 'See you at noon', timestamp: '2026-01-02T12:00:00Z', unread: true },
  { id: 'b', title: 'Grace Hopper', preview: 'Thanks!', timestamp: '2026-01-01T12:00:00Z' },
];

describe('GdsThreadList (#957)', () => {
  it('renders a list of thread buttons with the selected thread marked current', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithGds(<GdsThreadList ariaLabel="Conversations" threads={threads} selectedId="b" onSelect={onSelect} />);
    expect(screen.getByRole('list', { name: 'Conversations' })).toBeTruthy();
    const items = screen.getAllByRole('button');
    expect(items[1].getAttribute('aria-current')).toBe('true');
    expect(items[0].getAttribute('aria-current')).toBeNull();
    fireEvent.click(items[0]);
    expect(onSelect).toHaveBeenCalledWith('a');
    await expectNoAxeViolations(container);
  });

  it('states unread with text, not colour alone, and formats timestamps for the locale', () => {
    renderWithGds(<GdsThreadList ariaLabel="Conversations" threads={threads} />);
    const unread = screen.getAllByRole('button')[0];
    expect(unread.textContent).toContain('Unread');
    expect(unread.getAttribute('data-unread')).toBe('true');
    expect(screen.getAllByRole('button')[1].textContent).not.toContain('Unread');
    expect(unread.textContent).toMatch(/2026/);
  });

  it('shows loading, empty, error with retry and load more', () => {
    const onRetry = vi.fn();
    const onLoadMore = vi.fn();
    const { rerender } = renderWithGds(<GdsThreadList ariaLabel="Conversations" threads={[]} loading />);
    expect(screen.getByText('Loading conversations')).toBeTruthy();
    rerender(<GdsThreadList ariaLabel="Conversations" threads={[]} />);
    expect(screen.getByText('No conversations yet')).toBeTruthy();
    rerender(<GdsThreadList ariaLabel="Conversations" threads={[]} error="Offline" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<GdsThreadList ariaLabel="Conversations" threads={threads} hasMore onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalled();
  });
});
