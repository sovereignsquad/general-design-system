// Issue 556 — spacing literals not governed by the density axis.
//
// Keyed by `file:line` so an entry stops matching when the line moves.
export const DENSITY_ALLOWLIST = {
  'packages/gds-core/src/GdsGeneratedThumbnail.tsx:240': {
    reason:
      'Pixel geometry inside a GENERATED image, not page layout. The thumbnail composes a '
      + 'fixed-dimension raster whose internal padding is part of the image design; scaling it '
      + 'with the page density would change the picture, not the layout around it. Imagery '
      + 'geometry belongs to #563/#564.',
    reviewBy: '2027-02-01',
  },
  'packages/gds-core/src/PublicShell.tsx:83': {
    reason:
      '0.5rem gap, which is genuinely off the scale: the density ramp runs 2xs 0.25rem -> xs '
      + '0.625rem, both captured from Mantine. Migrating to xs adds 2px to a shell gap, a '
      + 'visible change, so it is a design decision rather than a mechanical substitution.',
    reviewBy: '2026-12-01',
  },
  'packages/gds-theme/src/VibeThemePicker.client.tsx:32': {
    reason: '0.5rem gap in the theme picker; off the scale for the same reason as PublicShell:83.',
    reviewBy: '2026-12-01',
  },
  'packages/gds-theme/src/VibeThemePicker.client.tsx:41': {
    reason: '0.5rem gap in the theme picker; off the scale for the same reason as PublicShell:83.',
    reviewBy: '2026-12-01',
  },
  'packages/gds-core/src/ReferenceThemeExplorer.tsx:324': {
    reason:
      'Theme Lab preview chrome at 12px, between 2xs and xs. Same category as the two shape '
      + 'debt entries in shape-token-adoption.config.mjs: migrating visibly reshapes the page '
      + 'that demonstrates theming, so it is a review rather than a sweep.',
    reviewBy: '2026-12-01',
  },
};
