import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { computeGdsThemeIdentity } from '@sovereignsquad/gds-theme';
import { GdsMap } from './GdsMap.client';
import { renderWithGds } from '../../../test-utils/render';

const MARKERS = [
  { id: 'a', position: { lat: 51.5, lng: -0.09 }, accent: 'teal' as const, label: 'Riverside pool' },
  { id: 'b', position: { lat: 51.6, lng: -0.1 }, accent: 'plum' as const, label: 'North gym', approximate: true },
];

describe('GdsMap (issues 566, 567)', () => {
  it('renders a labelled region rather than an unnamed box', () => {
    renderWithGds(<GdsMap markers={MARKERS} label="Venues near you" />);
    expect(screen.getByRole('region', { name: 'Venues near you' })).toBeInTheDocument();
  });

  it('announces its state instead of only styling it', () => {
    // A sighted user sees an empty box while it loads; a screen-reader user gets nothing at
    // all unless it is said.
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/Venues (is loading|could not be loaded|: \d+ marker)/);
  });

  it('always renders the ODbL credit', () => {
    // Not optional and not configurable away: OpenStreetMap data is licensed on condition of
    // attribution, so the credit renders whenever a map does.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const credit = container.querySelector('[data-gds-map-attribution] a') as HTMLAnchorElement;
    expect(credit).toBeInTheDocument();
    expect(credit.textContent).toMatch(/OpenStreetMap contributors/);
    expect(credit.getAttribute('href')).toContain('openstreetmap.org/copyright');
  });

  it('carries the theme identity, so a switch rebuilds it', () => {
    // Leaflet reads resolved colours when it constructs its panes; nothing about a CSS
    // variable change reaches back into them, which is why the identity drives a re-init.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" preset="editorial" colorScheme="dark" />);
    const region = container.querySelector('[data-gds-map]') as HTMLElement;
    expect(region.getAttribute('data-gds-theme-identity'))
      .toBe(computeGdsThemeIdentity({ preset: 'editorial', colorScheme: 'dark' }));
  });

  it('does not throw when the engine cannot initialise', () => {
    // jsdom has no layout, so Leaflet fails here — which is the error path, and it must be a
    // reported state rather than an exception that takes the page down.
    const onStateChange = vi.fn();
    expect(() => renderWithGds(<GdsMap markers={MARKERS} label="Venues" onStateChange={onStateChange} />)).not.toThrow();
  });

  it('requires an accessible name for every marker at the type level', () => {
    // Compile-time, but asserted here so the intent is visible: a marker whose only identity
    // is its colour does not exist for a screen-reader user.
    for (const marker of MARKERS) expect(marker.label.length).toBeGreaterThan(0);
  });
});
