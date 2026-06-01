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

    expect((presetSelect as HTMLSelectElement).value).toBe('brand');
  });
});
