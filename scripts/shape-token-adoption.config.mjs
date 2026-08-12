// Issue 555 — radius literals that are not yet (or not meaningfully) token-governed.
//
// Keyed by `file:line`, so an entry stops matching when the line moves and the gate fails
// until it is re-examined. Deliberate churn: the alternative is an allowlist that quietly
// excuses whatever lands on that line later.

/**
 * Two distinct categories live here and they must not be conflated.
 *
 * `circle` entries are a principled exception: `50%` is a SHAPE, not a radius step. Feeding
 * it through the step scale would turn every avatar and status dot into a rounded square the
 * moment a theme set a small radius, which is not "theme control" — it is the theme breaking
 * a primitive it does not know it owns. A future `circle` treatment could govern these; the
 * step scale cannot.
 *
 * `debt` entries are ordinary hardcoding with no principle behind them. They carry a near
 * review date because they are debt, not design, and pretending otherwise is how an
 * allowlist becomes permanent.
 */
export const SHAPE_ALLOWLIST = {
  'packages/gds-core/src/ChatSurface.tsx:135': {
    category: 'circle',
    reason: 'Typing-indicator dot. 50% is a circle primitive; a radius step would make it a rounded square under any theme with a small scale.',
    reviewBy: '2027-08-01',
  },
  'packages/gds-core/src/GdsGeneratedThumbnail.tsx:281': {
    category: 'circle',
    reason: 'Circular badge on a generated thumbnail. Same reasoning as ChatSurface: a circle is a shape, not a step.',
    reviewBy: '2027-08-01',
  },
  'packages/gds-core/src/BottomTabBar.tsx:130': {
    category: 'circle',
    reason: 'Circular active/notification indicator in the tab bar.',
    reviewBy: '2027-08-01',
  },
  'packages/gds-core/src/GdsBadge.tsx:181': {
    category: 'circle',
    reason: 'Circular count disc inside a badge; the surrounding badge itself is token-governed.',
    reviewBy: '2027-08-01',
  },
  'packages/gds-core/src/GdsGeneratedHero.tsx:403': {
    category: 'circle',
    reason: 'Circular decorative element in generated hero imagery.',
    reviewBy: '2027-08-01',
  },
  'packages/gds-theme/src/VibeThemePicker.client.tsx:58': {
    category: 'circle',
    reason: 'Circular colour swatch in the theme picker. A swatch is a colour sample; rounding it by the active theme would make the control restyle itself while being used to choose that theme.',
    reviewBy: '2027-08-01',
  },

  'packages/gds-core/src/ReferenceThemeExplorer.tsx:334': {
    category: 'debt',
    reason:
      'Theme Lab preview chrome at 18px, which is not on the scale (nearest step lg = 16px). '
      + 'Migrating it changes the rendered geometry of the Theme Lab by 2px, so it is a design '
      + 'review rather than a mechanical substitution — issue 555 §5 requires zero visual '
      + 'regression, and quietly reshaping the page that demonstrates theming is the worst '
      + 'place to take one.',
    reviewBy: '2026-12-01',
  },
  'packages/gds-core/src/ReferenceThemeExplorer.tsx:768': {
    category: 'debt',
    reason: 'Theme Lab colour-swatch chrome at 12px, between md (8px) and lg (16px). Same reasoning as line 334: a visible change, so a decision rather than a sweep.',
    reviewBy: '2026-12-01',
  },
};
