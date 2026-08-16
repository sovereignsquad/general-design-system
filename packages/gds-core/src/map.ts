// Dedicated subpath, not in the main barrel: Leaflet is browser-only (~40KB) and window-
// dependent, so bundling it in the main entry would cost every consumer and break server bundles.
export { GdsMap } from './GdsMap.client';
export { GDS_OSM_TILE_SOURCE, assertGdsTileSource, GdsTileAttributionError } from './map-tile-policy';
export type { GdsMapTileSource } from './map-tile-policy';
export type {
  GdsMapProps, GdsMapMarker, GdsMapViewport, GdsMapState, GdsLatLng, GdsLatLngBounds,
} from './GdsMap.client';
