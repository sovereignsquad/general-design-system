import type { CSSProperties, ReactNode } from 'react';

/**
 * Basemap wash: `backdrop-filter: saturate(…)` desaturates tiles, composited with a translucent
 * tint of `--gds-vibe-canvas` (falling back to `--gds-bg-canvas`).
 *
 * Wraps the map content: `renderMap={() => <GdsMapBasemapWash><GdsMap …/></GdsMapBasemapWash>}`.
 * The wash layer is `pointer-events: none` and `aria-hidden`; with no children it renders
 * nothing, so it never paints over `MapPanel`'s state blocks.
 */

/** Canvas-colour tint strength over the tiles. Exported so documentation reads it directly. */
export const GDS_MAP_WASH_TINT = 0.28;

/** Tile saturation retained. Not 0 — full desaturation makes water/parks/roads indistinguishable. */
export const GDS_MAP_WASH_SATURATION = 0.35;

/** Props for {@link GdsMapBasemapWash}. */
export interface GdsMapBasemapWashProps {
  /** The map content the wash composes over — typically `<GdsMap …/>`. */
  children?: ReactNode;
  /** Tint strength override, 0–1. Defaults to {@link GDS_MAP_WASH_TINT}. `0` disables the tint but keeps the desaturation. */
  tint?: number;
}

const washStyle = (tint: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  // Uses the live var(), not a pre-resolved colour, so a theme switch re-resolves it.
  background: `color-mix(in srgb, var(--gds-vibe-canvas, var(--gds-bg-canvas)) ${Math.round(tint * 100)}%, transparent)`,
  backdropFilter: `saturate(${GDS_MAP_WASH_SATURATION})`,
  // Below Leaflet's overlay panes (zIndex 700) so popups/markers stay un-washed.
  zIndex: 450,
});

/**
 * Theme-driven wash over consumer-rendered map tiles — see the module docs for the recipe and
 * the composition contract.
 *
 * @example
 * ```tsx
 * <MapPanel
 *   title="Nearby clubs"
 *   renderMap={() => (
 *     <GdsMapBasemapWash>
 *       <GdsMap center={[47.4979, 19.0402]} zoom={13} height={320} label="Map of nearby clubs" />
 *     </GdsMapBasemapWash>
 *   )}
 * />
 * ```
 */
export function GdsMapBasemapWash({ children, tint = GDS_MAP_WASH_TINT }: GdsMapBasemapWashProps) {
  if (children === undefined || children === null || children === false) return null;
  return (
    <div data-gds-map-basemap-wash-host style={{ position: 'relative' }}>
      {children}
      <div data-gds-map-basemap-wash aria-hidden style={washStyle(tint)} />
    </div>
  );
}
