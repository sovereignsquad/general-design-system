// What the coverage matrix tracks, and how its cells are chosen.
//
// Properties are the rendered consequences of the six axes: a component "honors the theme"
// when these resolve from governed tokens, not by looking right under one preset.

/**
 * Tracked properties, one per axis where possible. Not every CSS property — only the ones
 * each axis actually sets.
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
 * Values that are governed without being a token — the absence of a value (e.g. resolved 0px).
 */
export const NON_TOKEN_VALUES = new Set([
  '0px', '0', 'none', 'auto', 'normal', 'transparent', 'currentcolor',
  'rgba(0, 0, 0, 0)', '0s', 'medium', 'initial', 'inherit',
]);

/**
 * Cell selection: a covering design over (route x preset). Every route appears at least once
 * and every preset appears at least once, in both schemes — 2 x max(routes, presets) cells
 * rather than the full route x preset matrix.
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
