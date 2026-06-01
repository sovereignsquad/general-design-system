import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('playground app runtime theme flow', () => {
  it('applies dark -> light -> dark transitions on the live /themes route without resetting preset', async () => {
    window.history.pushState({}, '', '/general-design-system/themes');

    render(<App />);

    const presetSelect = await screen.findByLabelText('Preset');
    const schemeSelect = await screen.findByLabelText('Preview color scheme');

    fireEvent.change(presetSelect, { target: { value: 'brand' } });
    expect((presetSelect as HTMLSelectElement).value).toBe('brand');

    fireEvent.change(schemeSelect, { target: { value: 'dark' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark'),
    );

    fireEvent.change(schemeSelect, { target: { value: 'light' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('light'),
    );

    fireEvent.change(schemeSelect, { target: { value: 'dark' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark'),
    );

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-gds-theme-runtime')).toContain('brand-dark'),
    );

    expect((presetSelect as HTMLSelectElement).value).toBe('brand');
  });

  it('keeps brand-theme-generator selections stable across multiple option changes', async () => {
    window.history.pushState({}, '', '/general-design-system/themes');

    render(<App />);

    const presetSelect = await screen.findByLabelText('Preset');
    const schemeSelect = await screen.findByLabelText('Preview color scheme');
    const brandPrimarySelect = await screen.findByLabelText('Brand primary color');
    const flatSurfacesCheckbox = await screen.findByLabelText('Use flat surfaces');
    const editorialCheckbox = await screen.findByLabelText('Use editorial serif headings');
    const compareCheckbox = await screen.findByLabelText('Compare against a second shipped preset');
    const comparisonPresetSelect = await screen.findByLabelText('Comparison preset');

    fireEvent.change(presetSelect, { target: { value: 'brand' } });
    expect((presetSelect as HTMLSelectElement).value).toBe('brand');

    fireEvent.change(brandPrimarySelect, { target: { value: 'indigo' } });
    fireEvent.click(flatSurfacesCheckbox);
    fireEvent.click(editorialCheckbox);
    fireEvent.click(compareCheckbox);
    fireEvent.change(comparisonPresetSelect, { target: { value: 'dark-public' } });

    fireEvent.change(schemeSelect, { target: { value: 'dark' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark'),
    );

    fireEvent.change(schemeSelect, { target: { value: 'light' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('light'),
    );

    fireEvent.change(schemeSelect, { target: { value: 'dark' } });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark'),
    );

    expect((presetSelect as HTMLSelectElement).value).toBe('brand');
    expect((brandPrimarySelect as HTMLSelectElement).value).toBe('indigo');
    expect((flatSurfacesCheckbox as HTMLInputElement).checked).toBe(false);
    expect((editorialCheckbox as HTMLInputElement).checked).toBe(true);
    expect((compareCheckbox as HTMLInputElement).checked).toBe(true);
    expect((comparisonPresetSelect as HTMLSelectElement).value).toBe('dark-public');
  });

  it('applies a dark-forward preset to the whole app runtime without a manual scheme step', async () => {
    window.history.pushState({}, '', '/general-design-system/themes');

    render(<App />);

    const presetSelect = await screen.findByLabelText('Preset');

    fireEvent.change(presetSelect, { target: { value: 'neon-night' } });

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark'),
    );
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-gds-theme-runtime')).toContain('neon-night-dark'),
    );

    expect((presetSelect as HTMLSelectElement).value).toBe('neon-night');
  });
});
