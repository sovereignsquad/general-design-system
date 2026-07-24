import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsBreadcrumbs } from './GdsBreadcrumbs';

describe('GdsBreadcrumbs', () => {
  it('renders nothing when there are no items', () => {
    const { container } = renderWithGds(<GdsBreadcrumbs items={[]} />);
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('renders a labeled nav landmark with links for non-current items', () => {
    renderWithGds(
      <GdsBreadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Patterns', href: '/docs/patterns' },
          { label: 'Kanban Board' },
        ]}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'Patterns' })).toHaveAttribute('href', '/docs/patterns');
    expect(screen.queryByRole('link', { name: 'Kanban Board' })).not.toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toHaveAttribute('aria-current', 'page');
  });

  it('forces the last item to render as the non-link current page even if it carries an href', () => {
    renderWithGds(<GdsBreadcrumbs items={[{ label: 'Docs', href: '/docs' }, { label: 'Current', href: '/docs/current' }]} />);
    expect(screen.queryByRole('link', { name: 'Current' })).not.toBeInTheDocument();
    expect(screen.getByText('Current')).toHaveAttribute('aria-current', 'page');
  });
});
