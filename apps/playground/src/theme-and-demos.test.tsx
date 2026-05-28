import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { TokensPage } from './info-pages';
import { LiveDemosPage } from './showcase-pages';

describe('playground theme explorer and live demos hub', () => {
  it('lets visitors switch theme presets and compare a second shipped lane', () => {
    renderWithGds(<TokensPage />);

    const presetSelect = screen.getByLabelText('Preset');
    const schemeSelect = screen.getByLabelText('Preview color scheme');

    fireEvent.change(presetSelect, { target: { value: 'brand' } });
    fireEvent.change(schemeSelect, { target: { value: 'dark' } });

    expect(screen.getAllByText('Brand theme generator').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/controlled brand expression/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, node) => node?.textContent?.includes('Color scheme: dark') ?? false).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Compare against a second shipped preset'));
    fireEvent.change(screen.getByLabelText('Comparison preset'), { target: { value: 'flat-surface' } });

    expect(screen.getByText('Comparison Preview Surface')).toBeTruthy();
    expect(screen.getAllByText('Flat surface theme').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reset theme lab' }));

    expect(screen.getAllByText('Default runtime theme').length).toBeGreaterThan(0);
    expect((screen.getByLabelText('Preset') as HTMLSelectElement).value).toBe('default');
  });

  it('frames the live demos section as the official runtime showcase', () => {
    renderWithGds(<LiveDemosPage />);

    expect(screen.getByText('Live Demos')).toBeTruthy();
    expect(screen.getByText(/public runtime showcase/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Open section' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Discovery & Cards')).toBeTruthy();
    expect(screen.getByText('Actions & Auth')).toBeTruthy();
  });
});
