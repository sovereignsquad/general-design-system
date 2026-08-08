import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GdsIconStyleContext, useGdsBadgeIconStyle } from './icon-style';
import { GdsProvider } from './GdsProvider';

function ModeConsumer({ override }: { override?: 'tabler' | 'emoji' }) {
  const mode = useGdsBadgeIconStyle(override);
  return <span>mode:{mode}</span>;
}

describe('useGdsBadgeIconStyle (#525)', () => {
  it('defaults to tabler with no GdsProvider ancestor at all', () => {
    render(<ModeConsumer />);
    expect(screen.getByText('mode:tabler')).toBeInTheDocument();
  });

  it('reads the ambient mode set by GdsIconStyleContext directly', () => {
    render(
      <GdsIconStyleContext.Provider value={{ badgeIconStyle: 'emoji' }}>
        <ModeConsumer />
      </GdsIconStyleContext.Provider>,
    );
    expect(screen.getByText('mode:emoji')).toBeInTheDocument();
  });

  it('reads the ambient mode set by GdsProvider.defaultBadgeIconStyle', () => {
    render(
      <GdsProvider defaultBadgeIconStyle="emoji">
        <ModeConsumer />
      </GdsProvider>,
    );
    expect(screen.getByText('mode:emoji')).toBeInTheDocument();
  });

  it('GdsProvider defaults to tabler when defaultBadgeIconStyle is omitted — every existing consumer unaffected', () => {
    render(
      <GdsProvider>
        <ModeConsumer />
      </GdsProvider>,
    );
    expect(screen.getByText('mode:tabler')).toBeInTheDocument();
  });

  it('a per-call override always wins over the ambient mode, in both directions', () => {
    render(
      <GdsIconStyleContext.Provider value={{ badgeIconStyle: 'emoji' }}>
        <ModeConsumer override="tabler" />
      </GdsIconStyleContext.Provider>,
    );
    expect(screen.getByText('mode:tabler')).toBeInTheDocument();

    render(
      <GdsIconStyleContext.Provider value={{ badgeIconStyle: 'tabler' }}>
        <ModeConsumer override="emoji" />
      </GdsIconStyleContext.Provider>,
    );
    expect(screen.getByText('mode:emoji')).toBeInTheDocument();
  });
});
