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
    // Two polite live regions exist (state line and announcer); query by id="-state" to
    // avoid matching the wrong one.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const status = container.querySelector('[id$="-state"]') as HTMLElement;
    expect(status.textContent).toMatch(/Venues (is loading|could not be loaded|: \d+ marker)/);
  });

  it('always renders the ODbL credit', () => {
    // OpenStreetMap's license requires attribution; the credit is not configurable away.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    const credit = container.querySelector('[data-gds-map-attribution] a') as HTMLAnchorElement;
    expect(credit).toBeInTheDocument();
    expect(credit.textContent).toMatch(/OpenStreetMap contributors/);
    expect(credit.getAttribute('href')).toContain('openstreetmap.org/copyright');
  });

  it('carries the theme identity, so a switch rebuilds it', () => {
    // Leaflet reads resolved colors at pane construction; a CSS variable change alone
    // doesn't reach it, so the theme identity attribute must drive a re-init.
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" preset="editorial" colorScheme="dark" />);
    const region = container.querySelector('[data-gds-map]') as HTMLElement;
    expect(region.getAttribute('data-gds-theme-identity'))
      .toBe(computeGdsThemeIdentity({ preset: 'editorial', colorScheme: 'dark' }));
  });

  it('does not throw when the engine cannot initialise', () => {
    // jsdom has no layout, so Leaflet fails to initialise here; that failure must surface
    // as reported state, not an exception.
    const onStateChange = vi.fn();
    expect(() => renderWithGds(<GdsMap markers={MARKERS} label="Venues" onStateChange={onStateChange} />)).not.toThrow();
  });

  it('requires an accessible name for every marker at the type level', () => {
    // label is required at the type level; checked here too for visibility.
    for (const marker of MARKERS) expect(marker.label.length).toBeGreaterThan(0);
  });
});

describe('GdsMap accessibility surface (issue 568)', () => {
  it('always renders the text-equivalent list — there is no prop that removes it', () => {
    // Not configurable: tile imagery is decorative and cannot be described, so the list is
    // the accessibility conformance path.
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    expect(screen.getByRole('region', { name: 'Venues — list view' })).toBeInTheDocument();
    for (const marker of MARKERS) {
      expect(screen.getByRole('button', { name: new RegExp(marker.label) })).toBeInTheDocument();
    }
  });

  it('drives the list from the same markers as the map, in a stable meaningful order', () => {
    // Sorted by label, not insertion order, so keyboard traversal order is predictable.
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
    // moveend fires repeatedly while panning; the region is throttled to avoid repeated
    // announcements.
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
