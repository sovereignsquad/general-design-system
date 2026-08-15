import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useGdsAmbientTheme } from './theme-runtime';
import { renderWithGds } from '../../../test-utils/render';

function Probe() {
  const ambient = useGdsAmbientTheme();
  return <span data-testid="ambient">{ambient.preset}/{ambient.colorScheme}</span>;
}

describe('useGdsAmbientTheme (#621)', () => {
  it('reads the attributes the runtime writes, and defaults to default/light without them', async () => {
    document.documentElement.removeAttribute('data-gds-theme-preset');
    document.documentElement.removeAttribute('data-mantine-color-scheme');
    renderWithGds(<Probe />);
    expect(screen.getByTestId('ambient').textContent).toBe('default/light');
  });

  it('follows a live theme switch — the point of the hook: baked-value components re-bake', async () => {
    renderWithGds(<Probe />);
    await act(async () => {
      document.documentElement.setAttribute('data-gds-theme-preset', 'dark-public');
      document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
      // MutationObserver callbacks are microtask-scheduled; let them run.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId('ambient').textContent).toBe('dark-public/dark');
    // REMOVE, never set: leaving an attribute behind pollutes every later test that reads
    // the document's theme state (caught as two unrelated suites failing only in the full run).
    document.documentElement.removeAttribute('data-gds-theme-preset');
    document.documentElement.removeAttribute('data-mantine-color-scheme');
  });
});
