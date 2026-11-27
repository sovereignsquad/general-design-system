

/**
 * Fixed, mobile-only bottom tab navigation rendered from `PublicNavItem[]`.
 * Theme-tokened (active = brand accent, inactive = secondary text, surface =
 * white), safe-area aware, with an optional raised center action. Used by
 * `PublicShell`/`DiscoveryShell` when `mobileNavigationMode="bottom-tab"`.
 */

/** Maximum number of tabs the bottom tab bar renders. */
export const BOTTOM_TAB_MAX_ITEMS = 5;

/** Bar height in pixels, excluding the safe-area inset — the fallback behind `--gds-layout-bottom-bar-height`. */
export const BOTTOM_TAB_HEIGHT = 64;
