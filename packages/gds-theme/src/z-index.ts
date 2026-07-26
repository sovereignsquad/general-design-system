/**
 * GDS's published stacking-layer authority (previously undocumented — see
 * DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md P0 item 3). GDS defers to
 * Mantine's own `--mantine-z-index-*` CSS variable scale (already shipped in
 * `@mantine/core/styles.css`, part of the mandatory GDS stylesheet import)
 * rather than publishing a second, competing numeric scale — one authority,
 * not two to keep in sync. `gdsZIndexToken` exists so consumers and GDS's
 * own components reference this scale by documented, typed tier name
 * instead of needing to know Mantine's internal variable names.
 */
export const gdsZIndexToken = {
  /** Persistent page-level fixed chrome: bottom tab bars, floating action buttons. */
  app: 'var(--mantine-z-index-app)',
  /** Modals and drawers. */
  modal: 'var(--mantine-z-index-modal)',
  /** Popovers, dropdowns, menus, comboboxes. */
  popover: 'var(--mantine-z-index-popover)',
  /** Overlays (backdrop layers behind modals/drawers). */
  overlay: 'var(--mantine-z-index-overlay)',
  /** Reserved for content that must always render above everything else. */
  max: 'var(--mantine-z-index-max)',
} as const;

/** A stacking-layer tier name (a key of `gdsZIndexToken`). */
export type GdsZIndexTier = keyof typeof gdsZIndexToken;
