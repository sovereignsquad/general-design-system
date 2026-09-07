// Radius literals that are not yet (or not meaningfully) token-governed.
//
// Keyed by the file plus the declaration's own source text, not `file:line` — a line-number
// key stops matching on any edit above it, not just on the declaration itself changing.

/**
 * Two categories: `circle` entries are 50% radii, a shape rather than a radius step — the
 * step scale would turn them into rounded squares under a small-radius theme.
 * `debt` entries are ordinary hardcoding with a near `reviewBy`.
 */
export const SHAPE_ALLOWLIST = {
  "packages/gds-core/src/GdsGeneratedAvatar.tsx::style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', overflow: 'hidden', ...style }}": {
    category: 'circle',
    reason: 'Identity avatar. 50% is a circle primitive; a radius step would turn every avatar into a rounded square under a small-radius theme — the same reasoning as the typing-indicator dot.',
    reviewBy: '2027-08-01',
  },
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
  "packages/gds-core/src/GdsIconBadge.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Icon-only categorical-accent disc. Same reasoning as GdsGeneratedAvatar/ChatSurface: a circle is a shape, not a step.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-theme/src/VibeThemePicker.client.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Circular colour swatch in the theme picker. A swatch is a colour sample; rounding it by the active theme would make the control restyle itself while being used to choose that theme.',
    reviewBy: '2027-08-01',
  },
  "packages/gds-core/src/GdsNotificationBell.tsx::borderRadius: '50%',": {
    category: 'circle',
    reason: 'Unread-status dot on the bell trigger. Same reasoning as GdsBadge/ChatSurface: a circle is a shape, not a step.',
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
