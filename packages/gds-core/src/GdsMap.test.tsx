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
    // Issue 568 added a second polite region (the announcer), so this targets the state line
    // specifically rather than "the status role" — which is now ambiguous, and ambiguity here
    // would make the test pass on whichever one it happened to find.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const status = container.querySelector('[id$="-state"]') as HTMLElement;
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

describe('GdsMap accessibility surface (issue 568)', () => {
  it('always renders the text-equivalent list — there is no prop that removes it', () => {
    // Presence is not configurable. A prop that hid the list would make conformance a consumer
    // choice, and for a raster map the list IS the conformance path: tile imagery is
    // decorative by nature and cannot be described.
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    expect(screen.getByRole('region', { name: 'Venues — list view' })).toBeInTheDocument();
    for (const marker of MARKERS) {
      expect(screen.getByRole('button', { name: new RegExp(marker.label) })).toBeInTheDocument();
    }
  });

  it('drives the list from the same markers as the map, in a stable meaningful order', () => {
    // Sorted by label, not insertion order. A list sequenced by "whatever the API returned" is
    // not navigable — a keyboard user traversing it cannot tell where they are.
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const items = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    const sorted = [...items].sort((a, b) => a.localeCompare(b));
    expect(items).toEqual(sorted);
  });

  it('makes every marker keyboard-actionable, not pointer-only', () => {
    const onMarkerSelect = vi.fn();
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" onMarkerSelect={onMarkerSelect} />);
    const button = screen.getByRole('button', { name: /Riverside pool/ });
    button.click();
    expect(onMarkerSelect).toHaveBeenCalledWith('a');
  });

  it('exposes selection state to assistive technology, not only visually', () => {
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" selectedMarkerId="b" />);
    expect(screen.getByRole('button', { name: /North gym/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Riverside pool/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks an approximate position as approximate rather than implying precision', () => {
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    expect(screen.getByText(/approximate location/)).toBeInTheDocument();
  });

  it('has a polite live region rather than announcing on every frame', () => {
    // Continuous panning fires moveend repeatedly; an unthrottled region reads coordinates
    // over and over, which is worse than silence because the user cannot escape it.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const announcer = container.querySelector('[data-gds-map-announcer]') as HTMLElement;
    expect(announcer).toBeInTheDocument();
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    // Nothing announced synchronously on mount — the throttle has not elapsed.
    expect(announcer.textContent).toBe('');
  });

  it('says "no places in view" rather than rendering an empty list', () => {
    renderWithGds(<GdsMap markers={[]} label="Venues" />);
    expect(screen.getByText('No places in view.')).toBeInTheDocument();
  });
});
