import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { ReferenceLinkGrid } from './ReferenceLinkGrid';

describe('ReferenceLinkGrid touch-target floor (issue 659)', () => {
  it('gives the title link and the "Open section" link an invisible 44px hit area, without growing the visible control', () => {
    renderWithGds(
      <ReferenceLinkGrid
        items={[{ id: 'patterns', title: 'Browse patterns', description: 'See it.', href: '/patterns' }]}
      />,
    );

    const titleLink = screen.getByRole('link', { name: 'Browse patterns' });
    expect(titleLink).toHaveClass('gds-touch-target-pad-link');
    expect(titleLink).toHaveAttribute('data-gds-target-exception', 'reference-link-grid-card');

    const openSectionLink = screen.getByRole('link', { name: 'Open section' });
    expect(openSectionLink).toHaveClass('gds-touch-target-pad-link');
    expect(openSectionLink).toHaveAttribute('data-gds-target-exception', 'reference-link-grid-card');
  });
});
