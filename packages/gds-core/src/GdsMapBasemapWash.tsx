import type { CSSProperties, ReactNode } from 'react';

/**
 * Issue 549 — the governed basemap wash.
 *
 * GDS does not own tile rendering (`MapPanel.renderMap` is always consumer-supplied), but the
 * basemap TREATMENT is a reusable pattern it can own: raster tiles arrive in the tile host's
 * own palette, which reads as a foreign surface inside a themed page. The source observation,
 * preserved because it is the design rationale: **desaturation alone yields a grey map — the
 * canvas-colour composite is what makes it read as ours.** So the wash is two operations in
 * one layer: `backdrop-filter: saturate(…)` pulls the tiles' own palette down, and a
 * translucent tint of the ACTIVE THEME's canvas colour composites over them. The tint reads
 * `--gds-vibe-canvas` (falling back to `--gds-bg-canvas`), so a cream theme washes cream, a
 * dark theme washes dark — nothing here is ClassScout's cream, or any literal colour at all.
 *
 * Composition contract: the component WRAPS the map content and paints the wash above it —
 * `renderMap={() => <GdsMapBasemapWash><GdsMap …/></GdsMapBasemapWash>}`. The first draft of
 * the saved-indicator pushed a positioned wrapper onto every consumer and the GDS-only gate
 * refused it (issue 546); this component ships the wrapper for the same reason. The wash layer
 * is `pointer-events: none` and `aria-hidden`, so panning, zooming, and the screen-reader tree
 * pass through untouched, and with no children it renders nothing — `MapPanel`'s
 * loading/empty/error `StateBlock`s render INSTEAD of `renderMap`, so the wash structurally
 * cannot paint over a state block.
 */

/**
 * How much of the theme canvas colour composites over the tiles. Exported so documentation
 * surfaces it rather than retyping it (Rule 14). `0.28` keeps street labels readable through
 * the tint on both the lightest and darkest shipped tile treatments.
 */
export const GDS_MAP_WASH_TINT = 0.28;

/**
 * How much of the tiles' own saturation survives. `0.35`, not `0`: full desaturation is the
 * grey map the rationale above rejects — enough hue must survive for water/parks/roads to
 * stay distinguishable under the tint.
 */
export const GDS_MAP_WASH_SATURATION = 0.35;

/** Props for {@link GdsMapBasemapWash}. */
export interface GdsMapBasemapWashProps {
  /** The map content the wash composes over — typically `<GdsMap …/>`. */
  children?: ReactNode;
  /**
   * Tint strength override, 0–1. Defaults to {@link GDS_MAP_WASH_TINT}. `0` disables the tint
   * but keeps the desaturation; prefer the default unless a product measured a legibility
   * problem against its own tile host.
   */
  tint?: number;
}

const washStyle = (tint: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  // Percentages, not a pre-resolved colour: the var must stay live so a theme switch
  // re-resolves the wash with everything else (the stale-value class issue 598 detects).
  background: `color-mix(in srgb, var(--gds-vibe-canvas, var(--gds-bg-canvas)) ${Math.round(tint * 100)}%, transparent)`,
  backdropFilter: `saturate(${GDS_MAP_WASH_SATURATION})`,
  // Leaflet panes stack up to zIndex 700 (popups); the wash must sit above tiles but is kept
  // below overlay panes so popups and markers render un-washed at full saturation.
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
