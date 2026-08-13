import { screen } from '@testing-library/react';
import { GdsViewportFrame } from './GdsViewportFrame';
import { BottomTabBar } from './BottomTabBar';
import { renderWithGds } from '../../../test-utils/render';

const items = [
  { id: 'browse', label: 'Browse', href: '#browse' },
  { id: 'saved', label: 'Saved', href: '#saved' },
];

describe('GdsViewportFrame (issue 609)', () => {
  // The frame publishes its width as data so the cascade can resolve a gate against it. A
  // React context would read cleaner here and was the first design; it would also have made
  // every gated component a client component, and BottomTabBar is exported from the server
  // entrypoint. These attributes ARE the contract, so they are what the test asserts.
  it('publishes its width class as data', () => {
    const { container } = renderWithGds(
      <GdsViewportFrame width="medium">
        <span>content</span>
      </GdsViewportFrame>,
    );

    expect(container.querySelector('[data-gds-viewport-frame="medium"]')).toBeTruthy();
  });

  it('establishes a containing block for position: fixed descendants', () => {
    const { container } = renderWithGds(
      <GdsViewportFrame width="compact">
        <span>content</span>
      </GdsViewportFrame>,
    );

    // `contain: layout paint` is the mechanism; `overflow: hidden` alone does not create a
    // containing block, so a fixed child would still escape to the window.
    const frame = container.querySelector('[data-gds-viewport-frame="compact"]');
    expect((frame as HTMLElement).style.contain).toBe('layout paint');
  });

  it('renders a gated surface inside the frame and marks its gate', () => {
    renderWithGds(
      <GdsViewportFrame width="compact">
        <BottomTabBar items={items} activeId="browse" ariaLabel="Framed navigation" />
      </GdsViewportFrame>,
    );

    const nav = screen.getByLabelText('Framed navigation');
    expect(nav.getAttribute('data-gds-viewport-gated')).toBe('sm');
  });
});
