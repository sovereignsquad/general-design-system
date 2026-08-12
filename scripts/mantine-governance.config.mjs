// Issue 589 — SSOT for Mantine dependency-boundary classification.
//
// FOUNDATION.md §2 makes the GDS theme the authority over "color palettes, typography
// scales, spacing, radii, breakpoints, and component defaults". Measurement showed GDS
// consumes 92 `--mantine-*` custom properties and dictates a small fraction of them, so
// the majority of what the reference site renders comes from Mantine defaults rather than
// governed GDS decisions. Finding F6 is why that matters: those values are theme-INVARIANT
// — they render identically under all 25 presets, so no single-theme review could see them.
//
// Only DELEGATIONS are listed here. "Governed" is measured, never declared: the gate
// compares GDS's theme against Mantine's `DEFAULT_THEME` and treats a variable as governed
// only when GDS actually changes the value. A hand-maintained list of governed variables
// would be a second source of truth that can claim governance GDS does not have — which is
// the F1 dual-source pattern, and the whole reason issue 554 existed.

/**
 * Variables Mantine deliberately owns. Each needs a reason that says why Mantine is the
 * RIGHT owner — not merely that GDS has not got round to it. An unreasoned delegation is
 * indistinguishable from an oversight, which is how 87 accumulated in the first place.
 *
 * `reviewBy` is mandatory: a delegation that cannot expire becomes permanent by neglect.
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
 * Variables whose names are built at runtime and therefore cannot be statically governed.
 *
 * `EditorialCard.tsx:183` renders `var(--mantine-color-${palette.accent}-7)`, so the
 * extractor sees a truncated `--mantine-color-` that resolves to nothing. This is a real
 * governance hole, not a scanner artifact: the set of palettes that expression can reach
 * is not knowable from the call site, so no census can state which ramps the component
 * depends on. Tracked as its own finding rather than silently dropped.
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
