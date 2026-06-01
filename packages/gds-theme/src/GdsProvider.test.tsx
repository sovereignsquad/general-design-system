import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';
import { openConfirmModal } from '@mantine/modals';
import { Button } from '@mantine/core';
import { renderWithGds } from '../../../test-utils/render';
import { GdsProvider } from './GdsProvider';
import { applyGdsFontLane, getGdsFontLanes } from './font-lanes';
import { showGdsNotification } from './notifications';
import { createPublicBrandTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme, withGdsMotion } from './theme';
import { getGdsThemePresets, resolveGdsThemePreset } from './theme-presets';

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

  it('exposes a shared semantic notification helper', async () => {
    const user = userEvent.setup();

    renderWithGds(<Button onClick={() => showGdsNotification({ message: 'Saved through helper', tone: 'success' })}>Helper notification</Button>);

    await user.click(screen.getByRole('button', { name: 'Helper notification' }));
    expect(await screen.findByText('Saved through helper')).toBeInTheDocument();
  });

  it('sets rtl direction for rtl locales', () => {
    const { container } = renderWithGds(<div>RTL child</div>, { locale: 'ar' });

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it('keeps the canonical base theme motion-safe and exposes opt-in motion overrides', () => {
    expect(gdsTheme.components.Button?.styles).toBeUndefined();
    expect(gdsTheme.components.Card?.styles?.root).toEqual({
      background: 'var(--mantine-color-body)',
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
    const brandedTheme = createPublicBrandTheme({
      editorialSerif: true,
      flatSurfaces: true,
      overrides: {
        primaryColor: 'blue',
      },
    });

    renderWithGds(
      <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
        <div>Dark shell</div>
      </GdsProvider>,
    );

    expect(screen.getByText('Dark shell')).toBeInTheDocument();
    expect(gdsFlatSurfaceTheme.shadows.md).toBe('none');
    expect(gdsEditorialPublicTheme.headings.fontFamily).toContain('Instrument Serif');
    expect(brandedTheme.primaryColor).toBe('blue');
    expect(brandedTheme.shadows.md).toBe('none');
    expect(brandedTheme.headings.fontFamily).toContain('Instrument Serif');
  });

  it('exposes a governed colorful theme registry beyond light and dark', () => {
    const presets = getGdsThemePresets();
    const colorfulPresetIds = [
      'sunset',
      'oceanic',
      'forest',
      'ruby',
      'amber',
      'neon-night',
      'skyline',
      'aurora',
      'coral',
      'mint',
      'orchid',
      'royal',
    ];

    expect(presets.length).toBeGreaterThanOrEqual(17);
    expect(presets.some((item) => item.id === 'default')).toBe(true);
    expect(presets.some((item) => item.id === 'brand')).toBe(true);
    expect(colorfulPresetIds.every((id) => presets.some((item) => item.id === id))).toBe(true);
    expect(presets.find((item) => item.id === 'coral')?.runtimeLane).toBe('resolveGdsThemePreset(coral)');

    const resolved = resolveGdsThemePreset('sunset');
    expect(resolved.primaryColor).toBe('orange');

    const coral = resolveGdsThemePreset('coral');
    expect(coral.primaryColor).toBe('pink');
  });

  it('exposes approved font lanes and applies them to theme contracts', () => {
    const lanes = getGdsFontLanes();
    expect(lanes.length).toBeGreaterThanOrEqual(10);

    const themed = applyGdsFontLane(gdsTheme, 'instrument-serif');
    expect(themed.headings?.fontFamily).toContain('Instrument Serif');
  });
});
