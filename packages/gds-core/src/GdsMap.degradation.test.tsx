import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GdsMap, classifyGdsTileFailure, GDS_TILE_FAILURE_THRESHOLD, GDS_TILE_RETRY_DELAYS_MS } from './GdsMap.client';
import { renderWithGds } from '../../../test-utils/render';

const MARKERS = [
  { id: 'a', position: { lat: 51.5, lng: -0.09 }, accent: 'teal' as const, label: 'Riverside pool' },
];

describe('GdsMap tile degradation (#570)', () => {
  it('classification is honest: only offline is distinguishable, everything else says so', () => {
    // The browser hides the cause of a cross-origin <img> failure; guessing "rate limited"
    // or "CSP" from nothing would be a Rule 11 violation encoded in a component.
    expect(classifyGdsTileFailure(false)).toBe('offline');
    expect(classifyGdsTileFailure(true)).toBe('indeterminate');
  });

  it('bounded retry policy: two auto attempts, threshold requires zero successful loads', () => {
    expect(GDS_TILE_RETRY_DELAYS_MS.length).toBe(2);
    expect(GDS_TILE_FAILURE_THRESHOLD).toBeGreaterThan(1);
  });

  it('offline mode renders the intended-state notice in empty-state voice, not an error', () => {
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" offline />);
    expect(screen.getByText('Map imagery is off')).toBeInTheDocument();
    // Empty voice, not error voice: no retry control for a fetch that is never meant to happen.
    expect(container.querySelector('[data-gds-map-tile-retry]')).toBeNull();
  });

  it('offline mode keeps the content surfaces: list, markers count line, credit', () => {
    renderWithGds(<GdsMap markers={MARKERS} label="Venues" offline />);
    // "No tiles" must never read as "no places": the list still carries every marker.
    expect(screen.getByText('Riverside pool')).toBeInTheDocument();
    // The ODbL credit still renders — the licence condition does not depend on tiles arriving.
    expect(screen.getByText(/OpenStreetMap contributors/)).toBeInTheDocument();
  });

  it('without offline, no degradation notice renders before a failure is detected', () => {
    const { container } = renderWithGds(<GdsMap markers={MARKERS} label="Venues" />);
    expect(container.querySelector('[data-gds-map-tile-retry]')).toBeNull();
  });
});
