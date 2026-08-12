// Issue 586 — disposition of every `--gds-*` token with no in-repo consumer.
//
// Finding F13 listed 15. Each is classified here from evidence, with a reason and an
// expiry, because an allowlist that cannot expire becomes permanent by neglect — which is
// how a dead token survives long enough to be documented as a feature.
//
// Static reachability cannot prove the absence of a dynamic reference, and these are
// published CSS custom properties that a consumer application can read directly. So the
// default disposition is `extension-point`, not removal: removing a token a consumer may
// already be reading is a breaking change requiring a deprecation cycle (issue §6).
// `remove` is reserved for tokens no consumer can plausibly hold.

/**
 * Tokens deliberately declared without an in-repo consumer.
 *
 * `reason` must be EVIDENCE, not intent — what was read, and where. "Probably used by
 * consumers" is not a reason; "the same value reaches components via `--gds-bg-info-tag`"
 * is.
 */
export const EXTENSION_POINTS = {
  // ── Shape axis (issue 555) ──
  // A role token is emitted for EVERY role in EVERY preset, deliberately: a component
  // reading --gds-radius-pin must never land on an undefined variable because one preset
  // stayed silent. That guarantee means most roles are declared before anything consumes
  // them — they are the axis's published surface, which is what an extension point is.
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
  '--gds-bg-page': {
    reason:
      'Canonical page-surface role, emitted for all 25 presets by getGdsVibeThemeCssVariables. '
      + 'GDS components paint their own surfaces via --gds-bg-card/--gds-bg-surface, so nothing '
      + 'in-repo reads it; a consumer building a page shell around GDS reads exactly this.',
    reviewBy: '2027-08-01',
  },
  '--gds-bg-canvas': {
    reason: 'Canvas-surface counterpart to --gds-bg-page, same rationale and same emitter.',
    reviewBy: '2027-08-01',
  },
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

  // ── Badge roles — investigated against #534, see below ──
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
};

/**
 * Tokens that SHOULD be consumed and are not — a defect, not an extension point.
 *
 * Kept separate from EXTENSION_POINTS so the two are not conflated: an extension point is
 * working as intended, a pending wire-up is broken and waiting on review. Wiring one up
 * changes rendering, so it goes through design review rather than landing inside a
 * governance sweep (issue 586 §13).
 */
export const PENDING_WIRE_UP = {
  '--gds-tour-spotlight-padding': {
    reason:
      'Declared at styles.css:41 immediately beside --gds-tour-spotlight-radius, which IS consumed '
      + 'by .gds-tour-spotlight__hole. GdsTour.client.tsx:411 sets the hole geometry directly from '
      + 'the measured rect with no inflation, so the padding is never applied. This reads as an '
      + 'oversight rather than a deliberate extension point.',
    issue: 591,
    reviewBy: '2026-12-01',
  },
};
