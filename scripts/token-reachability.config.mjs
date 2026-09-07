// Disposition of every `--gds-*` token with no in-repo consumer. Each entry needs a reason and a reviewBy expiry.
//
// These are published CSS custom properties a consumer app can read directly, so the
// default disposition is `extension-point`, not removal. `remove` is only for tokens no
// consumer can plausibly hold.

/**
 * Tokens deliberately declared without an in-repo consumer.
 *
 * `reason` must state evidence — what was read, and where — not an assumption of use.
 */
export const EXTENSION_POINTS = {
  // ── Badge tone pairs ──
  '--gds-badge-soft-success': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-success-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-warning': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-warning-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-danger': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-danger-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-info': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-info-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-neutral': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-soft-neutral-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-success': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-success-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-warning': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-warning-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-danger': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-danger-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-info': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-info-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-neutral': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },
  '--gds-badge-solid-neutral-fg': { reason: 'Badge tone pair (issue 595). Both halves are emitted for every preset and scheme so the foreground is always derived against the background it lands on; the accessibility floor verifies every pair.', reviewBy: '2027-08-01' },

  // ── Accent axis ──
  '--gds-accent-plum-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-plum-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-plum-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-plum-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-plum-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-indigo-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-indigo-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-indigo-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-indigo-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-indigo-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-ocean-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-ocean-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-ocean-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-ocean-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-ocean-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-teal-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-teal-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-teal-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-teal-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-teal-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-forest-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-forest-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-forest-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-forest-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-forest-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-bronze-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-bronze-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-bronze-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-bronze-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-bronze-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-terracotta-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-terracotta-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-terracotta-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-terracotta-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-terracotta-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-magenta-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-magenta-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-magenta-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-magenta-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-magenta-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-slate-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-slate-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-slate-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-slate-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-slate-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-grape-base': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-grape-deep': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-grape-deeper': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-grape-deepest': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },
  '--gds-accent-grape-on': { reason: 'Accent-axis token (issue 593). Every accent and shade is emitted for every preset so a category surface reads its colour from the theme; verify:accent-contrast proves the filled-mode guarantee.', reviewBy: '2027-08-01' },

  // ── Motion and reaction axes ──
  '--gds-focus-ring-width': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-focus-ring-offset': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-focus-ring-style': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-focus-ring-color': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-transition-scope': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-hover': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-hover-lift': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-hover-scale': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-active': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-active-lift': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-active-scale': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-pressed': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-pressed-lift': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },
  '--gds-reaction-pressed-scale': { reason: 'Reaction-axis token (issue 558). Emitted for every preset so a component reads interaction feedback and focus geometry from the theme rather than deciding it locally.', reviewBy: '2027-08-01' },

  // ── Typography and elevation axes ──
  '--gds-font-size-2xs': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-xs': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-sm': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-md': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-lg': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-xl': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-2xl': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-3xl': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-font-size-4xl': { reason: 'Typography-axis size step (issue 557). Derived from base x ratio unless overridden; published so a consumer can size text on the governed scale.', reviewBy: '2027-08-01' },
  '--gds-line-height-md': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-line-height-lg': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-line-height-xl': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-line-height-2xl': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-line-height-3xl': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-line-height-4xl': { reason: 'Typography-axis line height (issue 557), unitless, published per step a theme declares.', reviewBy: '2027-08-01' },
  '--gds-weight-regular': { reason: 'Typography-axis named weight (issue 557). Published so a consumer names a weight rather than hardcoding a number.', reviewBy: '2027-08-01' },
  '--gds-weight-medium': { reason: 'Typography-axis named weight (issue 557). Published so a consumer names a weight rather than hardcoding a number.', reviewBy: '2027-08-01' },
  '--gds-weight-semibold': { reason: 'Typography-axis named weight (issue 557). Published so a consumer names a weight rather than hardcoding a number.', reviewBy: '2027-08-01' },
  '--gds-weight-bold': { reason: 'Typography-axis named weight (issue 557). Published so a consumer names a weight rather than hardcoding a number.', reviewBy: '2027-08-01' },
  '--gds-font-lane-display': { reason: 'Typography-axis font-lane assignment (issue 557). Names the registered lane for the role.', reviewBy: '2027-08-01' },
  '--gds-font-lane-body': { reason: 'Typography-axis font-lane assignment (issue 557). Names the registered lane for the role.', reviewBy: '2027-08-01' },
  '--gds-font-lane-mono': { reason: 'Typography-axis font-lane assignment (issue 557). Names the registered lane for the role.', reviewBy: '2027-08-01' },
  '--gds-elevation-0': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-1': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-2': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-3': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-4': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-card': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-panel': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-modal': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-drawer': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-sheet': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-menu': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },
  '--gds-elevation-tooltip': { reason: 'Elevation-axis step or role (issue 557). Every step and role is emitted for every preset so a surface can read its elevation by name.', reviewBy: '2027-08-01' },

  // ── Density axis ──
  // Every step and size is emitted for every preset; the axis guarantees presence, not consumption.
  '--gds-space-none': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-3xs': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-2xs': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-xs': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-sm': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-md': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-lg': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-xl': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-2xl': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-space-3xl': {
    reason: 'Density-axis spacing step (issue 556). Published contract a theme overrides; components consume the steps they need.',
    reviewBy: '2027-08-01',
  },
  '--gds-control-height-xs': {
    reason: 'Density-axis control height (issue 556). Emitted so a control can size to the governed hit-target scale; the 44px floor is enforced in resolveGdsDensityTokens.',
    reviewBy: '2027-08-01',
  },
  '--gds-control-height-sm': {
    reason: 'Density-axis control height (issue 556). Emitted so a control can size to the governed hit-target scale; the 44px floor is enforced in resolveGdsDensityTokens.',
    reviewBy: '2027-08-01',
  },
  '--gds-control-height-md': {
    reason: 'Density-axis control height (issue 556). Emitted so a control can size to the governed hit-target scale; the 44px floor is enforced in resolveGdsDensityTokens.',
    reviewBy: '2027-08-01',
  },
  '--gds-control-height-lg': {
    reason: 'Density-axis control height (issue 556). Emitted so a control can size to the governed hit-target scale; the 44px floor is enforced in resolveGdsDensityTokens.',
    reviewBy: '2027-08-01',
  },
  '--gds-control-height-xl': {
    reason: 'Density-axis control height (issue 556). Emitted so a control can size to the governed hit-target scale; the 44px floor is enforced in resolveGdsDensityTokens.',
    reviewBy: '2027-08-01',
  },
  '--gds-density': {
    reason: 'Density-axis mode keyword (issue 556). Exposed so CSS and consumers can branch on the active density without re-deriving it from spacing values.',
    reviewBy: '2027-08-01',
  },

  // ── Shape axis ──
  // A role token is emitted for every role in every preset, so a component reading it never lands on an undefined variable.
  '--gds-radius-card': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-panel': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-surface': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-button': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-input': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-chip': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-badge': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-pin': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-modal': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-drawer': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-sheet': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-avatar': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-thumbnail': {
    reason: 'Shape-axis role token (issue 555). Emitted for every preset so a consumer or a future GDS component can read it; the axis guarantees presence, not consumption.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-none': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-xs': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-sm': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-md': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-lg': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },
  '--gds-radius-xl': {
    reason: 'Shape-axis step token (issue 555). The step scale is the published contract a theme overrides; components read roles, so a step is referenced only where a role is not the right unit.',
    reviewBy: '2027-08-01',
  },

  // ── Surface and colour roles a consumer application builds its own shell on ──
  // --gds-bg-page and --gds-bg-canvas are no longer listed here: issue 710's QuickStartCard
  // reads --gds-bg-page directly (packages/gds-core/src/QuickStartCard.tsx), and
  // --gds-bg-canvas was already read by GdsMapBasemapWash.tsx and pattern-pages.tsx (pre-dating
  // this issue) -- both are real, reachable tokens now, not extension points.
  '--gds-accent': {
    reason:
      'Published accent role. Components consume the scheme-resolved --gds-brand-accent-action '
      + 'and --gds-brand-accent-tint instead; --gds-accent is the un-specialised role a consumer '
      + 'reads when it wants the lane accent without GDS\'s action/tint semantics.',
    reviewBy: '2027-08-01',
  },
  '--gds-brand-primary-pressed': {
    reason:
      'Pressed-state brand colour. GDS\'s own buttons delegate pressed styling to Mantine\'s '
      + 'variant handling, so no GDS rule reads it; it exists for consumer-built controls that '
      + 'need the lane\'s pressed value.',
    reviewBy: '2027-02-01',
  },
  '--gds-nav-inactiveOnInverse': {
    reason:
      'Inactive-item colour for navigation on an inverse surface. GDS\'s BottomTabBar computes '
      + 'its own inactive colour from --gds-text-on-inverse; this role is the published value for '
      + 'a consumer-built inverse nav.',
    reviewBy: '2027-02-01',
  },

  // ── Atmosphere palette, exposed for consumer theming ──
  '--gds-vibe-hero': {
    reason:
      'Part of the --gds-vibe-* atmosphere palette applied to <html> by applyDocumentRuntime for '
      + 'every preset. The hero field is published so a consumer can paint its own hero band in '
      + 'the active lane; no GDS rule paints one.',
    reviewBy: '2027-08-01',
  },
  '--gds-vibe-success': {
    reason: 'Atmosphere-palette state colour, declared in styles.css alongside the rest of the vibe lane. GDS components read the semantic --gds-state-success instead; this is the atmosphere-lane value for consumers.',
    reviewBy: '2027-08-01',
  },
  '--gds-vibe-warning': {
    reason: 'Atmosphere-palette state colour; see --gds-vibe-success.',
    reviewBy: '2027-08-01',
  },

  // ── Motion scale ──
  '--gds-motion-duration-instant': {
    reason:
      'Published motion scale step. styles.css declares the full duration ramp so the scale is '
      + 'complete and addressable; the `instant` step is not used by any current transition. '
      + 'Issue #584 governs motion wiring and will either consume it or retire it.',
    reviewBy: '2026-12-01',
  },
  '--gds-motion-ease-exit': {
    reason: 'Published easing-scale step, unused by current transitions. Same disposition as --gds-motion-duration-instant, tracked by #584.',
    reviewBy: '2026-12-01',
  },

  // ── Badge roles ──
  '--gds-badge-info': {
    reason:
      'The ROLE is live, the name is the consumer-facing spelling: emitCssVariables maps '
      + 'badge.info to --gds-bg-info-tag, which is referenced by 2 files. The canonical '
      + '--gds-badge-info carries the same value for consumers reading by role name.',
    reviewBy: '2027-02-01',
  },
  '--gds-badge-urgencyBg': {
    reason:
      'Same shape as --gds-badge-info: emitCssVariables maps badge.urgencyBg to '
      + '--gds-brand-accent-tint, referenced by 3 files. The value renders; this spelling does not.',
    reviewBy: '2027-02-01',
  },
  '--gds-badge-attention': {
    reason:
      'Weakest case of the fifteen, and recorded as such. Unlike badge.info/badge.urgencyBg it has '
      + 'no alias, so neither the name NOR the value reaches any component. Retained rather than '
      + 'removed because it is a member of the published BrandSemanticRole union returned by '
      + 'createBrandTheme(), so a consumer can be reading it today and removal is a breaking change '
      + 'requiring a deprecation cycle (issue 586 §6). Near-dated deliberately.',
    reviewBy: '2026-11-01',
  },
  '--gds-badge-validation': {
    reason: 'No alias and no consumer, exactly as --gds-badge-attention. Same reasoning, same near date.',
    reviewBy: '2026-11-01',
  },

  // ── Layout axis (issue 698) ──
  '--gds-layout-nav-item-height': {
    reason:
      'Layout axis (issue 698). Sidebar nav-row height token, declared so a brand lane can set it '
      + '(and record the 44px-floor exception it needs) ahead of its real consumer. Issue 698 '
      + 'explicitly scopes SidebarNav adoption out of itself; issue 702 (SidebarNav light-surface '
      + 'variant) wires it up.',
    reviewBy: '2026-12-01',
  },
  '--gds-layout-content-max-width': {
    reason:
      'Layout axis (issue 698). Main-content max-width token; wiring it into DiscoveryShell now '
      + 'would silently constrain every existing consumer\'s content area, an unrequested behavior '
      + 'change outside issue 698\'s scope. Issue 707 (browse canvas) is the real consumer.',
    reviewBy: '2026-12-01',
  },
  '--gds-layout-list-rail-width': {
    reason:
      'Layout axis (issue 698). List-rail width for the list+map browse split; the split view does '
      + 'not exist yet. Issue 707 (browse canvas) wires it up.',
    reviewBy: '2026-12-01',
  },
  '--gds-layout-content-bottom-padding': {
    reason:
      'Layout axis (issue 698). Bottom-clearance padding for content stacked above the fixed bottom '
      + 'tab bar; no scrollable content region owns this concern yet. Consumed by whichever page '
      + 'shell adopts it first (candidate: issue 707\'s browse canvas).',
    reviewBy: '2026-12-01',
  },
  '--gds-layout-sheet-top-radius': {
    reason:
      'Layout axis (issue 698). Bottom-sheet top-corner radius; gds-core has no bottom-sheet/drawer '
      + 'component to consume it yet (verified: zero references to --gds-radius-sheet, the role this '
      + 'token derives from, anywhere in packages/gds-core/src). Untracked pending a sheet component.',
    reviewBy: '2026-12-01',
  },
};

/**
 * Tokens that should be consumed and are not — a defect, not an extension point.
 *
 * Wiring one up changes rendering, so it requires design review, not a governance sweep.
 */
export const PENDING_WIRE_UP = {};
