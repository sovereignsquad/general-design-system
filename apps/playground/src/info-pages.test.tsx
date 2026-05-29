import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { OverviewPage, RequestFeaturePage } from './info-pages';

describe('playground overview page', () => {
  it('frames the site as the official reference and live demo', () => {
    renderWithGds(<OverviewPage />);

    expect(screen.getAllByRole('heading', { name: 'General Design System' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Official reference and live demo')).toBeTruthy();
    expect(screen.getByText(/One place to understand, install, test, and trust GDS/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Browse patterns' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Explore themes' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Open live demos' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Read governance' }).length).toBeGreaterThan(0);
  });

  it('provides the feature-request intake experience', () => {
    renderWithGds(<RequestFeaturePage />);

    expect(screen.getByRole('heading', { name: 'Request a Feature' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Organization (optional)')).toBeTruthy();
    expect(screen.getByLabelText('What capability is missing?')).toBeTruthy();
    expect(screen.getByLabelText('How will this help your product?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
  });
});
