

/** Stroke weight for hovered/selected states. Idle keeps 1.75. Exported for the map's marker renderer, which can't compose this component. */
export const GDS_PIN_EMPHASIS_STROKE = 2.25;

/** Selected-state scale step. Applied around the tail tip so the anchored map point holds still. */
export const GDS_PIN_SELECTED_SCALE = 1.15;

/** Dash pattern for the approximate-location stroke, in the pin's 24-unit path space. Exported for the map's marker renderer. */
export const GDS_PIN_APPROXIMATE_DASH = '3 2.5';

/** Solved pin-head centring offset. Exported so documentation reads it directly, not retyped. */
export const GDS_PIN_HEAD_CENTER_OFFSET = 'translateY(-4.1667%)';

/** Icon scale bound: widest shipped glyphs (e.g. IconMasksTheater, IconBike) overflow the pin's circle above ~0.48. */
export const GDS_PIN_ICON_SCALE = 0.46;

/**
 * Emoji scale, derived from `GDS_PIN_ICON_SCALE` rather than set independently, so both move
 * together. 0.9 factor: a Tabler glyph paints ~0.83 of its box, an emoji paints nearly its
 * whole em, so equal scale would render the emoji visibly larger.
 */
export const GDS_PIN_EMOJI_SCALE = GDS_PIN_ICON_SCALE * 0.9;
