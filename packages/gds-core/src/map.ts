// Issue 566 — dedicated subpath for the map surface.
//
// Deliberately NOT in the main barrel. Leaflet is browser-only and ~40KB; putting it in the
// main entry would make every consumer pay for it whether or not they render a map, and would
// pull a `window`-dependent module into server bundles that never show one.
export { GdsMap } from './GdsMap.client';
export { GDS_OSM_TILE_SOURCE, assertGdsTileSource, GdsTileAttributionError } from './map-tile-policy';
export type { GdsMapTileSource } from './map-tile-policy';
export type {
  GdsMapProps, GdsMapMarker, GdsMapViewport, GdsMapState, GdsLatLng, GdsLatLngBounds,
} from './GdsMap.client';
