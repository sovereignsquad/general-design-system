import { describe, expect, it } from 'vitest';
import { GDS_OSM_TILE_SOURCE, GdsTileAttributionError, assertGdsTileSource } from './map-tile-policy';

describe('map tile policy (issue 567)', () => {
  it('ships OpenStreetMap with its ODbL credit already attached', () => {
    expect(GDS_OSM_TILE_SOURCE.url).toContain('tile.openstreetmap.org');
    expect(GDS_OSM_TILE_SOURCE.attributionText).toMatch(/OpenStreetMap contributors/);
    expect(GDS_OSM_TILE_SOURCE.attributionHref).toContain('openstreetmap.org/copyright');
  });

  it('cannot have its attribution stripped off the shared object', () => {
    // A consumer mutating the shared source would remove the credit from every map in the
    // application at once, which is a licence violation rather than a styling change.
    expect(Object.isFrozen(GDS_OSM_TILE_SOURCE)).toBe(true);
  });

  it('refuses a source with no attribution', () => {
    expect(() => assertGdsTileSource({ ...GDS_OSM_TILE_SOURCE, attributionText: '' }))
      .toThrow(GdsTileAttributionError);
    expect(() => assertGdsTileSource({ ...GDS_OSM_TILE_SOURCE, attributionText: '   ' }))
      .toThrow(/licence condition, not a design choice/);
    expect(() => assertGdsTileSource({ ...GDS_OSM_TILE_SOURCE, attributionHref: '' }))
      .toThrow(/must link to the licence or source/);
  });

  it('throws rather than falling back to the default source', () => {
    // Silently substituting a different map than the one a consumer configured would be worse
    // than a loud failure — they would ship someone else's tiles without knowing.
    expect(() => assertGdsTileSource({ ...GDS_OSM_TILE_SOURCE, url: '' })).toThrow(/no URL/);
  });

  it('returns the source unchanged when it is valid', () => {
    expect(assertGdsTileSource(GDS_OSM_TILE_SOURCE)).toBe(GDS_OSM_TILE_SOURCE);
  });
});
