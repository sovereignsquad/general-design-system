import { render, screen } from '@testing-library/react';
import { GdsViewportFrame, useGdsViewportFrame } from './GdsViewportFrame';
import { BottomTabBar } from './BottomTabBar';
import { renderWithGds } from '../../../test-utils/render';

function FrameProbe() {
  const frame = useGdsViewportFrame();
  return <span data-testid="probe">{frame ? frame.width : 'no-frame'}</span>;
}

const items = [
  { id: 'browse', label: 'Browse', href: '#browse' },
  { id: 'saved', label: 'Saved', href: '#saved' },
];

describe('GdsViewportFrame (issue 609)', () => {
  it('publishes its width class to descendants', () => {
    renderWithGds(
      <GdsViewportFrame width="medium">
        <FrameProbe />
      </GdsViewportFrame>,
    );

    expect(screen.getByTestId('probe').textContent).toBe('medium');
  });

  // The hook must be null outside a frame, or wrapping something in a frame would change how
  // every other consumer renders it. Opt-in is the whole safety property.
  it('reports no frame when there is none', () => {
    render(<FrameProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('no-frame');
  });

  it('renders a viewport-fixed surface inside a compact frame', () => {
    renderWithGds(
      <GdsViewportFrame width="compact">
        <BottomTabBar items={items} activeId="browse" ariaLabel="Framed navigation" />
      </GdsViewportFrame>,
    );

    expect(screen.getByLabelText('Framed navigation')).toBeTruthy();
  });

  // A frame wider than the surface's breakpoint is the same answer the viewport query gives:
  // the surface is mobile-only, so it does not belong at that width.
  it('hides a mobile-only surface when the frame is not compact', () => {
    renderWithGds(
      <GdsViewportFrame width="expanded">
        <BottomTabBar items={items} activeId="browse" ariaLabel="Framed navigation" />
      </GdsViewportFrame>,
    );

    expect(screen.queryByLabelText('Framed navigation')).toBeNull();
  });
});
