import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';
import { openConfirmModal } from '@mantine/modals';
import { Button } from '@mantine/core';
import { renderWithGds } from '../../../test-utils/render';
import { GdsProvider } from './GdsProvider';
import { gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme, withGdsMotion } from './theme';

function ProviderConsumer() {
  return (
    <>
      <Button onClick={() => notifications.show({ message: 'Shared notification' })}>
        Show notification
      </Button>
      <Button onClick={() => openConfirmModal({ title: 'Shared modal', labels: { confirm: 'Yes', cancel: 'No' } })}>
        Show modal
      </Button>
    </>
  );
}

describe('GdsProvider', () => {
  it('provides notifications and modals as part of the shared root composition', async () => {
    const user = userEvent.setup();

    renderWithGds(<ProviderConsumer />);

    await user.click(screen.getByRole('button', { name: 'Show notification' }));
    expect(await screen.findByText('Shared notification')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show modal' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Shared modal')).toBeInTheDocument();
  });

  it('sets rtl direction for rtl locales', () => {
    const { container } = renderWithGds(<div>RTL child</div>, { locale: 'ar' });

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it('keeps the canonical base theme motion-safe and exposes opt-in motion overrides', () => {
    expect(gdsTheme.components.Button?.styles).toBeUndefined();
    expect(gdsTheme.components.Card?.styles?.root).toEqual({
      backgroundColor: 'var(--mantine-color-body)',
    });

    const motionTheme = withGdsMotion();
    expect(motionTheme.components.Button?.styles?.root).toMatchObject({
      transition: 'transform 150ms ease, filter 120ms ease',
    });
    expect(motionTheme.components.Card?.styles?.root).toMatchObject({
      transition: 'transform 150ms ease, box-shadow 150ms ease',
    });
  });

  it('accepts theme and defaultColorScheme overrides for direct package consumers', () => {
    renderWithGds(
      <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
        <div>Dark shell</div>
      </GdsProvider>,
    );

    expect(screen.getByText('Dark shell')).toBeInTheDocument();
    expect(gdsFlatSurfaceTheme.shadows.md).toBe('none');
    expect(gdsEditorialPublicTheme.headings.fontFamily).toContain('Instrument Serif');
  });
});
