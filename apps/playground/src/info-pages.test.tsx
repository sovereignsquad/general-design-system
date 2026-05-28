import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { OverviewPage } from './info-pages';

describe('playground overview page', () => {
  it('frames the site as the official reference and live demo', () => {
    renderWithGds(<OverviewPage />);

    expect(screen.getByText('General Design System')).toBeTruthy();
    expect(screen.getByText(/official reference and the live demo/i)).toBeTruthy();
    expect(screen.getByText('One place to understand, install, test, and trust GDS')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse patterns' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore themes' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Open live demos' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Read governance' })).toBeTruthy();
  });
});
