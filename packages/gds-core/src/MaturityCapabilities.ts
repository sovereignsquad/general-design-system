/** Delivery status of a maturity capability. */
export type GdsMaturityCapabilityStatus = 'production-ready' | 'adoption-tooling' | 'operational-contract';

/** Identifier for one of the recommended maturity capability areas. */
export type GdsMaturityCapabilityArea =
  | 'admin-delivery'
  | 'runtime-feedback'
  | 'foundation-surfaces'
  | 'global-readiness'
  | 'adoption-governance'
  | 'theme-operations'
  | 'product-system';

/**
 * Static registry entry describing one recommended GDS maturity capability: its
 * issue, benefit, package lanes, contracts, runtime flow, UX states, accessibility,
 * observability, testing, documentation, edge cases, and operational behavior.
 */
export interface GdsMaturityCapability {
  id: GdsMaturityCapabilityArea;
  issueNumber: number;
  title: string;
  status: GdsMaturityCapabilityStatus;
  priorityOrder: number;
  benefit: string;
  packageLanes: string[];
  primaryContracts: string[];
  runtimeFlow: string[];
  uxStates: string[];
  accessibility: string[];
  observability: string[];
  retriesAndTimeouts: string;
  rollback: string;
  testing: string[];
  documentation: string[];
  edgeCases: string[];
  operationalBehavior: string;
}

const maturityCapabilities: GdsMaturityCapability[] = [
  {
    id: 'admin-delivery',
    issueNumber: 240,
    title: 'Admin delivery contracts',
    status: 'production-ready',
    priorityOrder: 1,
    benefit: 'Product teams can build CRUD, analytics, and resource-management surfaces without page-local form/table assembly.',
    packageLanes: ['@sovereignsquad/gds-admin', '@sovereignsquad/gds-core'],
    primaryContracts: ['AdminCrudForm', 'AdminDataTable', 'AdminAnalyticsTable', 'AdminResourceManager', 'DataToolbar', 'StateBlock'],
    runtimeFlow: ['route loads records', 'GDS renders loading/empty/error/ready state', 'operator edits or sorts', 'consumer action executes', 'GDS exposes completion/retry state'],
    uxStates: ['loading', 'empty', 'error', 'ready', 'refreshing', 'dirty', 'readonly', 'permission-limited'],
    accessibility: ['scoped table headers', 'aria-sort for sortable columns', 'labeled controls', 'aria-invalid on field errors', 'keyboard reachable action rows'],
    observability: ['submit', 'submit_success', 'submit_error', 'sort_change', 'retry', 'destructive_confirmed'],
    retriesAndTimeouts: 'Retry callbacks remain explicit and app-owned; GDS keeps failed state visible and preserves recovery actions.',
    rollback: 'Adopt one admin route at a time; exports are additive and previous local screens can stay pinned while migrating.',
    testing: ['admin component render states', 'field validation labels', 'sortable header semantics', 'resource empty/error recovery'],
    documentation: ['API_REFERENCE.md', 'USER_GUIDE.md', 'GitHub Pages /maturity'],
    edgeCases: ['no rows', 'permission-limited rows', 'failed delete after confirmation', 'readonly form with dirty data', 'localized long labels'],
    operationalBehavior: 'Consumers own persistence and authorization; GDS owns consistent presentation, states, actions, and accessibility expectations.',
  },
  {
    id: 'runtime-feedback',
    issueNumber: 241,
    title: 'Runtime feedback API',
    status: 'production-ready',
    priorityOrder: 2,
    benefit: 'Native alerts, browser confirms, and ad hoc overlays can be replaced with one accessible feedback runtime.',
    packageLanes: ['@sovereignsquad/gds-core', '@sovereignsquad/gds-admin'],
    primaryContracts: ['GdsConfirmProvider', 'useGdsConfirm', 'GdsToastProvider', 'useGdsToasts', 'AdminModal', 'AdminDetailDrawer', 'CommandPalette'],
    runtimeFlow: ['request feedback surface', 'trap or announce state', 'operator confirms/cancels/retries', 'consumer action resolves', 'GDS closes or persists recovery state'],
    uxStates: ['closed', 'open', 'submitting', 'success', 'error', 'retryable', 'cancelled'],
    accessibility: ['focus trap', 'return focus', 'escape behavior', 'screen-reader status announcement', 'non-auto-dismissed errors'],
    observability: ['open', 'confirm', 'cancel', 'close', 'timeout', 'retry', 'action_complete'],
    retriesAndTimeouts: 'Recoverable failures keep retry actions visible; long-running actions should set consumer timeouts and report timeout state through the feedback API.',
    rollback: 'Consumers can keep old wrappers route-by-route while replacing native dialogs with GDS providers.',
    testing: ['provider hook behavior', 'retry action rendering', 'modal/drawer focus behavior', 'confirmation cancellation'],
    documentation: ['feedback runtime guide', 'alert/confirm replacement guidance', 'API_REFERENCE.md'],
    edgeCases: ['nested overlay attempt', 'missing provider', 'action throws', 'operator cancels', 'timeout after confirmation'],
    operationalBehavior: 'Feedback surfaces make irreversible decisions and async failures visible instead of silently failing or relying on browser-native dialogs.',
  },
  {
    id: 'foundation-surfaces',
    issueNumber: 242,
    title: 'Foundation surface governance',
    status: 'production-ready',
    priorityOrder: 3,
    benefit: 'Teams can compose governed layouts, token-safe surfaces, and semantic icons without raw inline styles or direct icon imports.',
    packageLanes: ['@sovereignsquad/gds-core', '@sovereignsquad/gds-theme'],
    primaryContracts: ['LayoutBlocks', 'getGdsLayoutTemplates', 'renderGdsLayout', 'validateGdsLayout', 'GdsIcons', 'GdsIcon'],
    runtimeFlow: ['load schema or JSX composition', 'validate known block types', 'render token-backed primitives', 'surface diagnostics for invalid configuration'],
    uxStates: ['valid', 'invalid configuration', 'fallback', 'responsive', 'reduced-motion'],
    accessibility: ['icon-only controls require labels', 'reading order follows DOM order', 'focus remains visible', 'responsive layout preserves hierarchy'],
    observability: ['layout_validation_error', 'unsupported_block', 'icon_missing'],
    retriesAndTimeouts: 'No network retry is required by the primitive; consumers retry schema fetches and then re-run validation.',
    rollback: 'Static JSX and local layouts can be migrated to block templates incrementally because block APIs are additive.',
    testing: ['layout validation', 'unsafe string rejection', 'template rendering', 'icon registry coverage'],
    documentation: ['layout primitive guide', 'no-inline-style replacement path', 'icon registry guide'],
    edgeCases: ['unsupported blocks', 'unsafe script strings', 'missing props', 'RTL layout', 'long localized text'],
    operationalBehavior: 'Invalid layout configuration produces diagnostics rather than unsafe rendering.',
  },
  {
    id: 'global-readiness',
    issueNumber: 243,
    title: 'Global readiness and accessibility evidence',
    status: 'operational-contract',
    priorityOrder: 4,
    benefit: 'Developers and product owners can verify localization, RTL behavior, text expansion, and accessibility evidence for shared GDS surfaces.',
    packageLanes: ['@sovereignsquad/gds-theme', '@sovereignsquad/gds-core'],
    primaryContracts: ['GdsProvider', 'getGdsMessages', 'ReferenceLocaleNotice', 'EvidencePanel', 'locale coverage verification'],
    runtimeFlow: ['resolve locale', 'set provider messages and direction', 'render localized route copy', 'show evidence or fallback status', 'fail release checks on missing coverage'],
    uxStates: ['localized', 'fallback', 'RTL', 'missing key', 'evidence available'],
    accessibility: ['WCAG 2.2 AA target', 'keyboard operation', 'screen-reader compatible state copy', 'visible focus', 'non-color-only state'],
    observability: ['missing_locale_key', 'unsupported_locale_route', 'accessibility_evidence_missing'],
    retriesAndTimeouts: 'Runtime translation fetches are app-owned; GDS provides deterministic fallback copy and verification scripts.',
    rollback: 'Locale additions are additive; consumers can pin older versions if a translation regression ships.',
    testing: ['message parity', 'route coverage', 'RTL provider behavior', 'evidence registry coverage'],
    documentation: ['supported locale guide', 'accessibility evidence guide', 'localized GitHub Pages benefits'],
    edgeCases: ['German text expansion', 'Arabic/Hebrew RTL', 'mixed LTR data in RTL shell', 'missing translation key'],
    operationalBehavior: 'Release gates prevent docs and package copy from drifting across supported locales.',
  },
  {
    id: 'adoption-governance',
    issueNumber: 244,
    title: 'Adoption governance tooling',
    status: 'adoption-tooling',
    priorityOrder: 5,
    benefit: 'Consumer teams can score adoption quality, track exceptions, and migrate away from banned UI paths with CI evidence.',
    packageLanes: ['@sovereignsquad/gds-compliance', '@sovereignsquad/gds-eslint-config'],
    primaryContracts: ['gds-compliance', 'gds-adoption.json', 'board audit', 'codemod recipes', 'exception registry'],
    runtimeFlow: ['scan consumer repo', 'classify findings', 'match approved exceptions', 'compute release risk', 'fail or warn according to mode'],
    uxStates: ['pass', 'warn', 'fail', 'approved exception', 'expired exception'],
    accessibility: ['reports readable as plain text', 'findings not dependent on color alone', 'replacement paths name accessible GDS contracts'],
    observability: ['adoption_score', 'violation_count', 'expired_exception', 'release_blocker'],
    retriesAndTimeouts: 'File scanning is local; GitHub board audits use bounded API retries for transient rate limits.',
    rollback: 'Consumers can run warn mode before strict enforcement and pin prior package versions during migration.',
    testing: ['scanner fixtures', 'exception matching', 'codemod verification', 'strict board audit'],
    documentation: ['COMPLIANCE_TOOLKIT.md', 'ADOPTION_AND_MIGRATION_PLAYBOOK.md', 'exception lifecycle guide'],
    edgeCases: ['generated files', 'approved runtime exception', 'nested workspaces', 'raw HTML in documentation examples'],
    operationalBehavior: 'The tooling distinguishes approved temporary exceptions from true violations and makes release blockers visible.',
  },
  {
    id: 'theme-operations',
    issueNumber: 245,
    title: 'Theme operations contracts',
    status: 'operational-contract',
    priorityOrder: 6,
    benefit: 'Token authoring, high-contrast readiness, motion, and design handoff become release-managed contracts rather than informal style decisions.',
    packageLanes: ['@sovereignsquad/gds-theme', '@sovereignsquad/gds-core'],
    primaryContracts: ['resolveGdsThemePreset', 'getGdsVibeThemes', 'withGdsMotion', 'getGdsFontLanes', 'ReferenceThemeExplorer'],
    runtimeFlow: ['resolve theme lane', 'apply token/font metadata', 'respect color scheme and reduced motion', 'validate docs and release gates'],
    uxStates: ['light', 'dark', 'high contrast ready', 'reduced motion', 'invalid brand contrast'],
    accessibility: ['contrast validation policy', 'forced-colors guidance', 'prefers-reduced-motion support', 'locale-safe font fallback'],
    observability: ['theme_invalid', 'contrast_warning', 'motion_disabled', 'font_lane_fallback'],
    retriesAndTimeouts: 'Theme validation is rerun after token edits; no render-time retry loop is required.',
    rollback: 'Invalid themes should fail before publication; consumers can pin prior theme packages.',
    testing: ['theme preset coverage', 'font lane coverage', 'motion helper regression', 'theme governance verification'],
    documentation: ['THEME_GOVERNANCE.md', 'CLI_AND_LLD.md', 'GitHub Pages /themes'],
    edgeCases: ['low-contrast brand color', 'missing glyph coverage', 'dark/high-contrast mismatch', 'OS reduced-motion preference'],
    operationalBehavior: 'Theme changes are treated as governed release artifacts with validation and documented handoff metadata.',
  },
  {
    id: 'product-system',
    issueNumber: 246,
    title: 'Product system delivery contract',
    status: 'production-ready',
    priorityOrder: 7,
    benefit: 'Product owners can evaluate shipped GDS value by capability, benefit, DoD, observability, docs, and adoption path in every supported language.',
    packageLanes: ['@sovereignsquad/gds', '@sovereignsquad/gds-core'],
    primaryContracts: ['getGdsRecommendedMaturityCapabilities', 'getGdsMaturityCapabilities', 'DocsPageShell', 'SimpleDataTable', 'FeatureBand'],
    runtimeFlow: ['read static capability registry', 'render localized benefits', 'link issues and API contracts', 'verify docs coverage', 'publish npm release'],
    uxStates: ['documented', 'localized', 'verified', 'published', 'closed'],
    accessibility: ['semantic docs headings', 'accessible tables', 'RTL-safe localized copy', 'keyboard reachable links'],
    observability: ['capability_viewed', 'docs_gap_found', 'release_verified'],
    retriesAndTimeouts: 'Publication verification uses bounded registry polling; docs routes are static and do not require runtime retries.',
    rollback: 'Docs and registry are additive; package consumers can pin the previous npm version.',
    testing: ['route locale coverage', 'API docs coverage', 'reference build', 'release verification'],
    documentation: ['README.md', 'API_REFERENCE.md', 'USER_GUIDE.md', 'GitHub Pages /maturity'],
    edgeCases: ['unsupported locale fallback', 'API listed but not exported', 'out-of-date issue status', 'registry publication delay'],
    operationalBehavior: 'The capability registry is the shared product/developer contract for the seven recommended maturity investments.',
  },
];

function cloneCapability(capability: GdsMaturityCapability): GdsMaturityCapability {
  return {
    ...capability,
    packageLanes: [...capability.packageLanes],
    primaryContracts: [...capability.primaryContracts],
    runtimeFlow: [...capability.runtimeFlow],
    uxStates: [...capability.uxStates],
    accessibility: [...capability.accessibility],
    observability: [...capability.observability],
    testing: [...capability.testing],
    documentation: [...capability.documentation],
    edgeCases: [...capability.edgeCases],
  };
}

/** Returns deep clones of every maturity capability in registry order. */
export function getGdsMaturityCapabilities(): GdsMaturityCapability[] {
  return maturityCapabilities.map(cloneCapability);
}

/** Returns the maturity capabilities sorted by their recommended priority order. */
export function getGdsRecommendedMaturityCapabilities(): GdsMaturityCapability[] {
  return getGdsMaturityCapabilities().sort((a, b) => a.priorityOrder - b.priorityOrder);
}

/** Returns a deep clone of the maturity capability for the given area, or `undefined` if none matches. */
export function getGdsMaturityCapability(id: GdsMaturityCapabilityArea): GdsMaturityCapability | undefined {
  const capability = maturityCapabilities.find((entry) => entry.id === id);
  return capability ? cloneCapability(capability) : undefined;
}

/** Counts capabilities by status, returning per-status tallies plus an overall `total`. */
export function getGdsMaturitySummary() {
  return maturityCapabilities.reduce<Record<GdsMaturityCapabilityStatus | 'total', number>>((summary, capability) => {
    summary.total += 1;
    summary[capability.status] += 1;
    return summary;
  }, {
    total: 0,
    'production-ready': 0,
    'adoption-tooling': 0,
    'operational-contract': 0,
  });
}
