import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GdsProvider } from './GdsProvider';
import { useOverlayAdapter, mantineOverlayAdapter, type OverlayAdapter } from './overlay-adapter';

function AdapterProbe() {
  const adapter = useOverlayAdapter();
  const surfaceProps = adapter.surfaceProps('menu');
  return (
    <div
      data-testid="probe"
      data-adapter-id={adapter.id}
      data-has-surface-hook={String('data-gds-overlay-surface' in surfaceProps)}
      data-placement={adapter.config.placement}
    />
  );
}

describe('overlay adapter seam (#349)', () => {
  it('defaults to the mantine adapter and emits the GDS overlay-surface hook', () => {
    render(
      <MemoryRouter>
        <GdsProvider>
          <AdapterProbe />
        </GdsProvider>
      </MemoryRouter>,
    );
    const el = screen.getByTestId('probe');
    expect(el.getAttribute('data-adapter-id')).toBe('mantine');
    expect(el.getAttribute('data-has-surface-hook')).toBe('true');
  });

  it('swaps the overlay engine via GdsProvider.overlayAdapter with no consumer change', () => {
    const stub: OverlayAdapter = {
      id: 'stub-engine',
      config: { ...mantineOverlayAdapter.config, placement: 'top-end' },
      surfaceProps: (role) => ({ 'data-stub': role }),
    };
    render(
      <MemoryRouter>
        <GdsProvider overlayAdapter={stub}>
          <AdapterProbe />
        </GdsProvider>
      </MemoryRouter>,
    );
    const el = screen.getByTestId('probe');
    // Same component, same call site — only the injected engine changed.
    expect(el.getAttribute('data-adapter-id')).toBe('stub-engine');
    expect(el.getAttribute('data-placement')).toBe('top-end');
  });
});
