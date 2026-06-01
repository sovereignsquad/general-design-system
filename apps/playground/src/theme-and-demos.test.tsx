import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { TokensPage } from './info-pages';
import {
  CardsPage,
  FoodMenuPage,
  LayoutsPage,
  LiveDemosPage,
  PlaybackPage,
  VocabularyPage,
} from './showcase-pages';

describe('playground theme explorer and live demos hub', () => {
  it('lets visitors switch theme presets and compare a second shipped lane', () => {
    renderWithGds(<TokensPage />);

    const presetSelect = screen.getByLabelText('Preset');
    const schemeSelect = screen.getByLabelText('Preview color scheme');

    fireEvent.change(presetSelect, { target: { value: 'brand' } });
    fireEvent.change(schemeSelect, { target: { value: 'dark' } });

    expect(screen.getAllByText('Brand theme generator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('createPublicBrandTheme(...)').length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, node) => node?.textContent?.includes('Color scheme: dark') ?? false).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Compare against a second shipped preset'));
    fireEvent.change(screen.getByLabelText('Comparison preset'), { target: { value: 'flat-surface' } });

    expect(screen.getByText('Comparison Preview Surface')).toBeTruthy();
    expect(screen.getAllByText('Flat surface theme').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reset theme lab' }));

    expect(screen.getAllByText('Default runtime theme').length).toBeGreaterThan(0);
    expect((screen.getByLabelText('Preset') as HTMLSelectElement).value).toBe('default');
  });

  it('keeps brand controls disabled unless brand lane is selected', () => {
    renderWithGds(<TokensPage />);

    const presetSelect = screen.getByLabelText('Preset');
    const primaryColorSelect = screen.getByLabelText('Brand primary color');
    const flatSurfacesCheckbox = screen.getByLabelText('Use flat surfaces');
    const editorialCheckbox = screen.getByLabelText('Use editorial serif headings');

    expect((primaryColorSelect as HTMLSelectElement).disabled).toBe(true);
    expect((flatSurfacesCheckbox as HTMLInputElement).disabled).toBe(true);
    expect((editorialCheckbox as HTMLInputElement).disabled).toBe(true);

    fireEvent.change(presetSelect, { target: { value: 'brand' } });

    expect((primaryColorSelect as HTMLSelectElement).disabled).toBe(false);
    expect((flatSurfacesCheckbox as HTMLInputElement).disabled).toBe(false);
    expect((editorialCheckbox as HTMLInputElement).disabled).toBe(false);

    fireEvent.change(presetSelect, { target: { value: 'default' } });

    expect((primaryColorSelect as HTMLSelectElement).disabled).toBe(true);
    expect((flatSurfacesCheckbox as HTMLInputElement).disabled).toBe(true);
    expect((editorialCheckbox as HTMLInputElement).disabled).toBe(true);
  });

  it('shows supported and avoid guidance for each shipped lane', () => {
    renderWithGds(<TokensPage />);

    expect(screen.getAllByText(/Best for:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Avoid for:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unsupported lane boundary').length).toBeGreaterThan(0);
    expect(screen.getByText(/Do not create local branding-layer helpers/i)).toBeTruthy();
  });

  it('forces dark-forward lanes to preview in dark mode even if light is selected', () => {
    renderWithGds(<TokensPage />);

    fireEvent.change(screen.getByLabelText('Preset'), { target: { value: 'dark-public' } });
    fireEvent.change(screen.getByLabelText('Preview color scheme'), { target: { value: 'light' } });

    expect(screen.getAllByText((_, node) => node?.textContent?.includes('Color scheme: dark') ?? false).length).toBeGreaterThan(0);
    expect(screen.getByText(/always previews in dark mode/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Preset'), { target: { value: 'neon-night' } });

    expect(screen.getAllByText((_, node) => node?.textContent?.includes('Color scheme: dark') ?? false).length).toBeGreaterThan(0);
    expect(screen.getByText(/dark-forward preset always renders in dark mode/i)).toBeTruthy();
  });

  it('frames the live demos section as the official runtime showcase', () => {
    renderWithGds(<LiveDemosPage />);

    expect(screen.getByText('Live Demos')).toBeTruthy();
    expect(screen.getByText(/public runtime showcase/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Open section' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Discovery & Cards')).toBeTruthy();
    expect(screen.getByText('Actions & Auth')).toBeTruthy();
    expect(screen.getByText('Food & Menus')).toBeTruthy();
    expect(screen.getByText('Playback & Capture')).toBeTruthy();
  });

  it('renders all dedicated demo families with GDS-owned contracts', () => {
    renderWithGds(<CardsPage />);
    expect(screen.getByText('Discovery & Cards')).toBeTruthy();
    expect(screen.getByText('Governed sharing')).toBeTruthy();

    renderWithGds(<LayoutsPage />);
    expect(screen.getByText('Shells & Layouts')).toBeTruthy();
    expect(screen.getByText('Discovery shell')).toBeTruthy();

    renderWithGds(<VocabularyPage />);
    expect(screen.getByText('Actions & Auth')).toBeTruthy();
    expect(screen.getByText('Canonical social auth')).toBeTruthy();

    renderWithGds(<FoodMenuPage />);
    expect(screen.getByText('Food & Menu')).toBeTruthy();
    expect(screen.getByText('Food cards')).toBeTruthy();

    renderWithGds(<PlaybackPage />);
    expect(screen.getByText('Playback & Capture')).toBeTruthy();
    expect(screen.getByText('Capture/review stage')).toBeTruthy();
  });
});
