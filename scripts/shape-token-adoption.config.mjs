// Issue 555 — radius literals that are not yet (or not meaningfully) token-governed.
//
// Keyed by the file plus the declaration's own source text (issue 614).
//
// `file:line` was tried first, to make an entry stop matching when the line moved. Every observed
// instance of that firing — seven of them — was an edit that inserted lines ABOVE an untouched
// declaration, resolved by retyping the number. It never once caught a changed declaration.
//
// The text key keeps the property the line number was for: a DIFFERENT declaration landing in the
// same place reads differently and is not excused. Only the identical declaration, moved, stays
// covered. An entry matching no declaration now fails the gate, which the line key could not
// check — a stale entry and a moved line were indistinguishable.

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
  "packages/gds-core/src/ChatSurface.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Typing-indicator dot. 50% is a circle primitive; a radius step would make it a rounded square under any theme with a small scale.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-core/src/GdsGeneratedThumbnail.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular badge on a generated thumbnail. Same reasoning as ChatSurface: a circle is a shape, not a step.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-core/src/BottomTabBar.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular active/notification indicator in the tab bar.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-core/src/GdsBadge.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular count disc inside a badge; the surrounding badge itself is token-governed.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-core/src/GdsGeneratedHero.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular decorative element in generated hero imagery.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-theme/src/VibeThemePicker.client.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular colour swatch in the theme picker. A swatch is a colour sample; rounding it by the active theme would make the control restyle itself while being used to choose that theme.',
    reviewBy: '2027-08-01',
  },

  "packages/gds-core/src/ReferenceThemeExplorer.tsx::borderRadius: 18,": {
    category: 'debt',
    reason:
      'Theme Lab preview chrome at 18px, which is not on the scale (nearest step lg = 16px). '
      + 'Migrating it changes the rendered geometry of the Theme Lab by 2px, so it is a design '
      + 'review rather than a mechanical substitution — issue 555 §5 requires zero visual '
      + 'regression, and quietly reshaping the page that demonstrates theming is the worst '
      + 'place to take one.',
    reviewBy: '2026-12-01',
  },
  "packages/gds-core/src/ReferenceThemeExplorer.tsx::borderRadius: 12,": {
    category: 'debt',
    reason: 'Theme Lab colour-swatch chrome at 12px, between md (8px) and lg (16px). Same reasoning as the 18px entry above: a visible change, so a decision rather than a sweep.',
    reviewBy: '2026-12-01',
  },
};
