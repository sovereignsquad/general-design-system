

/** Maximum footer affordances a `ListingCard` renders; extra `actions` are dropped past this cap. */
export const MAX_LISTING_CARD_ACTIONS = 4;

/**
 * Row-tile (`media-left`/`compact` card contract) media size, in pixels. Reference-derived from
 * Linen v3's `ProgramListCard`, which renders its generated media tile at a fixed
 * `flex: 0 0 96px` square (issue 701).
 */
export const GDS_LISTING_TILE_SIZE_PX = 96;

/**
 * Pick badge inset from the media tile's block-start/inline-start corner, in pixels.
 * Reference-derived from `ProgramListCard`'s pick pill, positioned at `left: 6, top: 6` inside
 * the tile (issue 701).
 */
export const GDS_LISTING_PICK_BADGE_INSET_PX = 6;

/** Pick badge star glyph size, in pixels. Reference-derived from `ProgramListCard`'s `9px` icon (issue 701). */
export const GDS_LISTING_PICK_BADGE_ICON_PX = 9;

/** Pick badge label font size, in pixels. Reference-derived from `ProgramListCard`'s `9px` type (issue 701). */
export const GDS_LISTING_PICK_BADGE_FONT_SIZE_PX = 9;

/** Pick badge label line height, in pixels. Reference-derived from `ProgramListCard`'s `13.5px` line height (issue 701). */
export const GDS_LISTING_PICK_BADGE_LINE_HEIGHT_PX = 13.5;

/** Pick badge block-direction (top/bottom) padding, in pixels. Reference-derived from `ProgramListCard`'s `2px 6px` padding (issue 701). */
export const GDS_LISTING_PICK_BADGE_PADDING_BLOCK_PX = 2;

/** Pick badge inline-direction (left/right) padding, in pixels. Reference-derived from `ProgramListCard`'s `2px 6px` padding (issue 701). */
export const GDS_LISTING_PICK_BADGE_PADDING_INLINE_PX = 6;
