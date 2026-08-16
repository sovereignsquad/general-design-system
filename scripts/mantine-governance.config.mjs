// SSOT for Mantine dependency-boundary classification.
//
// Only delegations are listed here. "Governed" is measured, not declared: the gate compares
// GDS's theme against Mantine's `DEFAULT_THEME` and treats a variable as governed only when
// GDS actually changes the value.

/**
 * Variables Mantine deliberately owns. Each reason must justify Mantine as the right owner,
 * not just that GDS hasn't gotten to it yet.
 *
 * `reviewBy` is mandatory.
 */
export const DELEGATED = {
  '--mantine-z-index-app': {
    reason:
      'GDS publishes stacking tiers by name (`gdsZIndexToken`) that resolve to Mantine\'s own '
      + 'z-index scale, deliberately, so there is one stacking authority rather than two. A GDS '
      + 'scale would have to be kept numerically consistent with Mantine\'s portals, and any drift '
      + 'renders a GDS overlay behind a Mantine modal. Documented at packages/gds-theme/src/z-index.ts.',
    reviewBy: '2027-08-01',
  },
  '--mantine-z-index-modal': { reason: 'See --mantine-z-index-app: one stacking authority, not two.', reviewBy: '2027-08-01' },
  '--mantine-z-index-popover': { reason: 'See --mantine-z-index-app: one stacking authority, not two.', reviewBy: '2027-08-01' },
  '--mantine-z-index-overlay': { reason: 'See --mantine-z-index-app: one stacking authority, not two.', reviewBy: '2027-08-01' },
  '--mantine-z-index-max': { reason: 'See --mantine-z-index-app: one stacking authority, not two.', reviewBy: '2027-08-01' },

  '--mantine-scale': {
    reason:
      'Mantine\'s global scale factor, which every one of its own size calculations multiplies '
      + 'through. Issue 555 made GDS consume it deliberately: the shape axis captures Mantine\'s '
      + 'radius values VERBATIM as `calc(0.125rem * var(--mantine-scale))` rather than flattening '
      + 'them to plain rem, because flattening would silently drop the factor and change what '
      + 'renders at non-default scales. GDS declaring its own value would fight Mantine\'s sizing '
      + 'system across every component, not just the ones GDS styles.',
    reviewBy: '2027-08-01',
  },

  '--mantine-color-body': {
    reason:
      'Mantine\'s light-dark page-surface primitive, which its own components read to composite '
      + 'against. GDS declares it in packages/gds-theme/styles.css so the value is GDS\'s, but the '
      + 'VARIABLE stays Mantine\'s because redefining the contract would desynchronise Mantine\'s '
      + 'internal light-dark switching from the GDS surface.',
    reviewBy: '2027-02-01',
  },
};

/**
 * Variable names built at runtime (e.g. `var(--mantine-color-${palette.accent}-7)` in
 * `EditorialCard.tsx:183`), so the reachable set cannot be statically determined or governed.
 */
export const DYNAMIC_REFERENCES = {
  '--mantine-radius-': {
    reason: 'Constructed at runtime in GdsGeneratedThumbnail.tsx from a radius prop; the reachable step set is not statically knowable, exactly as the --mantine-color- case below.',
    issue: 589,
  },
  '--mantine-color-': {
    reason: 'Constructed at runtime from `palette.accent` in EditorialCard.tsx:183; the reachable palette set is not statically knowable.',
    issue: 589,
  },
};
