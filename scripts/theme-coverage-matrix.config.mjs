// Issue 562 — what the coverage matrix tracks, and how its cells are chosen.
//
// The properties below are the rendered consequences of the six axes. A component that
// "honors the theme" means precisely that these resolve from governed tokens rather than
// happening to look right under the one preset somebody checked.

/**
 * Tracked properties, one per axis where possible.
 *
 * Deliberately not "every CSS property": a matrix that reports on 300 properties per element
 * is a matrix nobody reads, and most of them are layout consequences rather than theme
 * decisions. These are the ones an axis actually sets.
 */
export const TRACKED_PROPERTIES = [
  { property: 'color', axis: 'color' },
  { property: 'background-color', axis: 'color' },
  { property: 'border-color', axis: 'color' },
  { property: 'border-radius', axis: 'shape' },
  { property: 'padding', axis: 'density' },
  { property: 'font-size', axis: 'type' },
  { property: 'font-weight', axis: 'type' },
  { property: 'box-shadow', axis: 'elevation' },
  { property: 'transition-duration', axis: 'motion' },
  { property: 'outline-width', axis: 'reaction' },
];

/**
 * Values that are governed without being a token.
 *
 * A resolved `0px` did not come from a token and does not need to: it is the absence of a
 * value. Treating these as violations would bury the real findings under thousands of zeros —
 * the failure mode that makes a gate unreadable and therefore ignored.
 */
export const NON_TOKEN_VALUES = new Set([
  '0px', '0', 'none', 'auto', 'normal', 'transparent', 'currentcolor',
  'rgba(0, 0, 0, 0)', '0s', 'medium', 'initial', 'inherit',
]);

/**
 * Cell selection.
 *
 * The audit's Phase 1 executed 4 of 24 routes at 5 of 25 presets — which means every Phase 1
 * *non*-finding was worthless, because "no problem found on route X under preset Y" says
 * nothing when X and Y were never visited.
 *
 * This sweep is a covering design over (route x preset): every route appears at least once and
 * every preset appears at least once, in both schemes. That is 2 x max(routes, presets) cells
 * rather than the 1,200 of an exhaustive matrix, and unlike a hand-picked slice it leaves no
 * route and no preset unvisited.
 *
 * Exhaustive t-way coverage over the full factor space is issue #583's covering array. This
 * gate reports its ACHIEVED coverage as a number so the difference is visible rather than
 * implied.
 */
export function buildCoveringCells(routes, presets) {
  const cells = [];
  const span = Math.max(routes.length, presets.length);
  for (let i = 0; i < span; i += 1) {
    // Offsetting the preset index against the route index pairs a different preset with each
    // route on every cycle, so the two factors are not locked in step.
    const route = routes[i % routes.length];
    const preset = presets[(i + Math.floor(i / presets.length)) % presets.length];
    for (const scheme of ['light', 'dark']) cells.push({ route, preset, scheme });
  }
  return cells;
}
