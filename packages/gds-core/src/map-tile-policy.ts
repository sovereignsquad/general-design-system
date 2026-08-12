// Issue 567 — the tile source and its attribution, as one inseparable object.
//
// OpenStreetMap data is published under the Open Database Licence. Rendering its tiles without
// the credit is a licence violation, not a styling preference — so the source and the
// attribution are ONE value here. There is deliberately no way to obtain the URL without also
// obtaining the text that must accompany it.
//
// The OSM Foundation's tile usage policy also requires a valid identifying User-Agent/Referer
// and forbids heavy bulk use; a product with real traffic is expected to move to its own tile
// host. That is why the source is configurable rather than hardcoded — but any replacement
// must carry its own attribution, which the type makes unavoidable.

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
 * The default source: OpenStreetMap's standard raster tiles.
 *
 * Frozen so a consumer cannot mutate the attribution off the shared object and silently strip
 * the credit from every map in the application.
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
 * Validates a tile source before it is used.
 *
 * Throws rather than falling back to the default: silently substituting a different map than
 * the one a consumer configured would be a worse outcome than a loud failure, and an empty
 * attribution is the one case where rendering anything at all is the wrong answer.
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
