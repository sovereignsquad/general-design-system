import { mixCssColors } from './color-math';

/**
 * The governed neighborhood/area fill recipe, as a pure colour computation.
 *
 * Painting polygons is map-library territory (GeoJSON, paint expressions) that GDS does not
 * own; the colour those polygons take is a governed recipe it does: accent mixed 42% into
 * the canvas colour, painted at 55% opacity, with a canvas-coloured hairline between areas.
 * Categorical always, never a measurement scale — an area fill encoding intensity is a
 * choropleth, with different obligations.
 *
 * Mirrors `color-math.ts`'s conventions: pure functions over CSS colour strings, sRGB mixing
 * identical to `color-mix(in srgb, …)`, translucent inputs composited over a fallback first.
 *
 * The adjacency constraint ("adjacent areas never share an accent family") is the
 * consumer's: it requires the actual adjacency graph, which only the product holds. GDS
 * supplies the palette discipline (10 curated accent families); assigning them so neighbours
 * differ is a graph-colouring decision this function cannot see — see docs/MAP_SYSTEM.md §5.
 */

/** Accent share of the fill mix — the spec's "accent at 42% into cream", theme-generalised. */
export const GDS_MAP_AREA_FILL_ACCENT_WEIGHT = 0.42;

/** Paint opacity for the mixed fill. Keeps street labels readable through the wash beneath. */
export const GDS_MAP_AREA_FILL_OPACITY = 0.55;

/** A computed area fill: what a map layer paints, in map-library-agnostic terms. */
export interface GdsMapAreaFill {
  /** Opaque CSS colour for the polygon fill — accent mixed into the canvas. */
  fill: string;
  /** Opacity the fill layer paints at. */
  fillOpacity: number;
  /** Hairline colour between areas — the canvas itself, so boundaries read as paper. */
  hairline: string;
}

/**
 * Computes the governed area fill for one accent family against the active theme's canvas.
 *
 * @param accentColor  The area's accent family colour (e.g. a resolved `--gds-accent-*-base`).
 * @param canvasColor  The active theme's canvas (resolved `--gds-vibe-canvas` / `--gds-bg-canvas`).
 * @param fallbackBackground  Composite base for translucent inputs, matching `mixCssColors`.
 */
export function getGdsMapAreaFill(
  accentColor: string,
  canvasColor: string,
  fallbackBackground = '#ffffff',
): GdsMapAreaFill {
  return {
    fill: mixCssColors(accentColor, canvasColor, GDS_MAP_AREA_FILL_ACCENT_WEIGHT, fallbackBackground),
    fillOpacity: GDS_MAP_AREA_FILL_OPACITY,
    hairline: canvasColor,
  };
}
