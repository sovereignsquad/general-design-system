// Generated from apps/playground/src/pattern-pages.tsx by scripts/generate-pattern-usage.mjs. Do not edit by hand.

/** Pattern entries whose demo has usage code in public/pattern-usage.json. */
export const patternUsageIds: ReadonlySet<string> = new Set(["accent-contrast-matrix","accent-panels","access-gates","access-recovery-panels","access-summaries","accessibility-floor","action-bar","activity-pictograms","admin-app-shell","admin-data-table","admin-editor-flows","ai-search-card","alerts","analytics-template","article-shells","asset-manager-template","auth-shells","badges","bottom-tab-navigation","browse-surface","bulk-action-bar","button-feedback","buttons","checkboxes-radios","choice-chips","color-theming","consumer-dashboard-grid","consumer-sections","content-operations-editor","conversation-surface","cta-button-groups","dashboards","data-toolbars","density-spacing","design-rule-profile-panel","destructive-actions","detail-facts-provider-cta","detail-profile-shell","detail-surfaces","discovery-shell","docs-code-blocks","docs-page-shell","docs-shell","drawers","editor-scaffold","editorial-cards","editorial-hero","embed-surfaces","empty-state","feature-band","filter-drawer","fit-score-chip","food-menu-section","form-field","form-section","forms","game-board-tile","gds-map","generated-imagery","hero-search-panel","icon-buttons","icon-system","info-card","inputs","kanban-board","listing-card","loaders-skeletons","logo-lockup","map-panel","maturity-capabilities","meaning-badge","media-card","media-fields","media-with-fallback","message-thread","metric-cards","mobile-action-density","mobile-navigation","modals","motion-system","notifications","number-stepper","page-headers","partner-discovery-system","pattern-service-reuse","pin-system","placeholder-panels","playback-surface","primary-navigation","product-cards","provider-identity-buttons","public-brand-footer","public-flow-shell","public-food-card","public-nav","public-product-cards","public-shells","public-site-footer","quick-start-card","reference-link-grid","reference-locale-notice","reference-section","reference-site-shell","reference-theme-explorer","release-notes","reporting-contracts","responsive-data-view","search-filters-lists","searchable-select","searchable-selection","section-panels","selects-combobox","semantic-actions","semantic-nav-link","shape-elevation","share-button-group","shell-contracts","sidebar-navigation","simple-data-tables","small-screen-priority","social-auth-buttons","stable-shell","state-blocks","stats-sections","stats-strip","surface-presentation","table-responsive-strategies","theme-toggle","thread-list","tree-view","trust-layer","typography","upload-surfaces","vocabulary-extension-lane","workspace-header","workspace-inbox-template"]);

let usage: Promise<Record<string, string>> | null = null;

/** Usage code for a pattern demo, fetched once for all entries on first request. */
export function loadPatternUsage(id: string): Promise<string> {
  usage ??= fetch(`${import.meta.env.BASE_URL}pattern-usage.json`).then((response) => {
    if (!response.ok) throw new Error(`pattern-usage.json: HTTP ${response.status}`);
    return response.json() as Promise<Record<string, string>>;
  });
  const request = usage;
  return request.then((map) => map[id] ?? Promise.reject(new Error(`No usage code for ${id}`))).catch((error: unknown) => {
    if (usage === request) usage = null;
    throw error;
  });
}
