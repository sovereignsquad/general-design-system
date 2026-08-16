// Tile source and its attribution as one object: OpenStreetMap data is ODbL-licensed and
// requires credit, so the URL cannot be obtained without the attribution text.
//
// OSM's tile usage policy also requires an identifying User-Agent/Referer and forbids heavy
// bulk use; configurable so a consumer can move to their own tile host.

/** A tile source and the credit that must be displayed wherever it renders. */
export interface GdsMapTileSource {
  /** Tile URL template. */
  url: string;
  /** Plain-text credit. Required — a source without one cannot be constructed. */
  attributionText: string;
  /** Link the credit points at. */
  attributionHref: string;
  /** Maximum zoom the source serves. */
  maxZoom: number;
}

/**
 * Default source: OpenStreetMap's standard raster tiles. Frozen so the attribution cannot be
 * mutated off the shared object.
 */
export const GDS_OSM_TILE_SOURCE: GdsMapTileSource = Object.freeze({
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attributionText: '© OpenStreetMap contributors',
  attributionHref: 'https://www.openstreetmap.org/copyright',
  maxZoom: 19,
});

/** Thrown when a tile source is missing the credit its licence requires. */
export class GdsTileAttributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdsTileAttributionError';
  }
}

/**
 * Validates a tile source before use. Throws rather than falling back to the default.
 */
export function assertGdsTileSource(source: GdsMapTileSource): GdsMapTileSource {
  if (!source?.url?.trim()) throw new GdsTileAttributionError('Tile source has no URL.');
  if (!source.attributionText?.trim()) {
    throw new GdsTileAttributionError(
      'Tile source has no attributionText. OpenStreetMap data is ODbL-licensed and its credit is a licence '
      + 'condition, not a design choice — a source cannot be used without one.',
    );
  }
  if (!source.attributionHref?.trim()) {
    throw new GdsTileAttributionError('Tile source has no attributionHref; the credit must link to the licence or source.');
  }
  return source;
}
