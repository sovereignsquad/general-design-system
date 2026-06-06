export type UseCaseRisk = 'low' | 'medium' | 'high';

export interface ProductUseCase {
  id: string;
  title: string;
  audience: string;
  problem: string;
  recommendedPackages: string[];
  primaryContracts: string[];
  decisionRule: string;
  deliveryNotes: string[];
  accessibility: string;
  operationalChecks: string[];
  risk: UseCaseRisk;
}

export const productUseCases: ProductUseCase[] = [
  {
    id: 'public-product-site',
    title: 'Public product or brand site',
    audience: 'Product owner, design lead, frontend lead',
    problem: 'Teams need a high-quality public surface without inventing local shells, cards, hero sections, navigation, or CTA rhythm.',
    recommendedPackages: ['@doneisbetter/gds', '@doneisbetter/gds-core', '@doneisbetter/gds-theme'],
    primaryContracts: ['PublicShell', 'EditorialHero', 'PublicNav', 'PublicBrandFooter', 'FeatureBand', 'CtaButtonGroup'],
    decisionRule: 'Use GDS public primitives when the surface explains, markets, converts, or routes users before authentication.',
    deliveryNotes: [
      'Start from the documented provider bootstrap.',
      'Use the API reference to pick imports before creating local wrappers.',
      'Keep media, empty, loading, and error states visible in acceptance testing.',
    ],
    accessibility: 'Public pages must preserve heading order, visible focus, CTA names, contrast, and reduced-motion behavior.',
    operationalChecks: ['npm run verify:references', 'npm run verify:i18n-route-coverage', 'gds-compliance check'],
    risk: 'medium',
  },
  {
    id: 'admin-resource-manager',
    title: 'Admin resource manager',
    audience: 'Product owner, operations lead, admin engineer',
    problem: 'Admin pages repeatedly need CRUD forms, responsive resource grids, data tables, overlays, and destructive actions.',
    recommendedPackages: ['@doneisbetter/gds-admin', '@doneisbetter/gds-core'],
    primaryContracts: ['AdminCrudForm', 'AdminResourceManager', 'AdminDataTable', 'AdminModal', 'AdminDetailDrawer', 'AdminFormActions'],
    decisionRule: 'Use the admin package when operators create, edit, review, moderate, or delete durable resources.',
    deliveryNotes: [
      'Model state explicitly as loading, empty, error, ready, submitting, and success.',
      'Use GDS confirmation and toast contracts instead of browser dialogs.',
      'Document retry and rollback behavior for destructive operations.',
    ],
    accessibility: 'Admin controls must keep labels, field errors, table headers, focus trap, and return focus intact.',
    operationalChecks: ['npm run test:run --workspace=@doneisbetter/gds-admin', 'npm run verify:api-docs-coverage'],
    risk: 'high',
  },
  {
    id: 'docs-reference-site',
    title: 'Documentation and API reference site',
    audience: 'Developer relations, platform owner, product owner',
    problem: 'Developers need package API details, product owners need adoption guidance, and maintainers need release gates.',
    recommendedPackages: ['@doneisbetter/gds', '@doneisbetter/gds-core'],
    primaryContracts: ['DocsShell', 'DocsPageShell', 'ReferenceSection', 'ReferenceLinkGrid', 'SimpleDataTable', 'DocsCodeBlock'],
    decisionRule: 'Use docs primitives whenever a route explains installation, API contracts, governance, or adoption decisions.',
    deliveryNotes: [
      'Back every API route with typed registry data.',
      'Keep product guidance separate from component demos.',
      'Fail release when docs or i18n coverage drifts.',
    ],
    accessibility: 'Docs routes must expose landmarks, structured headings, keyboard navigation, readable code, and localized copy where declared.',
    operationalChecks: ['npm run verify:api-docs-coverage', 'npm run verify:i18n-route-coverage', 'npm run verify:playground-internal-links'],
    risk: 'low',
  },
  {
    id: 'capture-playback-flow',
    title: 'Capture, playback, or staged public flow',
    audience: 'Product owner, event operator, frontend lead',
    problem: 'Public flows need controlled steps, hardware-adjacent preview boundaries, playback controls, restart states, and share overlays.',
    recommendedPackages: ['@doneisbetter/gds-core', '@doneisbetter/gds-theme'],
    primaryContracts: ['PublicFlowShell', 'PublicCaptureFlow', 'PlaybackSurface', 'PlaybackControls', 'ShareButtonGroup'],
    decisionRule: 'Use public-flow and playback contracts for step-based public experiences and keep hardware preview exceptions explicit.',
    deliveryNotes: [
      'Separate hardware preview from surrounding GDS UI.',
      'Define retry, timeout, permission-denied, and restart behavior.',
      'Provide reduced-motion behavior and keyboard alternatives for playback controls.',
    ],
    accessibility: 'Controls require names, keyboard operation, status announcements, non-color-only state, and mobile-safe layout.',
    operationalChecks: ['npm run verify:references', 'npm run verify:api-docs-coverage'],
    risk: 'high',
  },
];
