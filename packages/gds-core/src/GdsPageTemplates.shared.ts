

/** Identifier for one of the governed page-template blueprints. */
export type GdsPageTemplateId =
  | 'admin-dashboard'
  | 'settings'
  | 'resource-manager'
  | 'crud-editor'
  | 'analytics'
  | 'public-event'
  | 'error-page'
  | 'empty-state-page'
  | 'asset-manager'
  | 'workspace-inbox';

/** Lifecycle / UX state a page template can render, driving its status badge and async state gate. */
export type GdsPageTemplateState =
  | 'loading'
  | 'empty'
  | 'ready'
  | 'error'
  | 'retrying'
  | 'saving'
  | 'permission-denied'
  | 'not-found';

/** Telemetry event names emitted by page templates. */
export type GdsPageTemplateTelemetryEventName =
  | 'page_view'
  | 'state_visible'
  | 'action_clicked'
  | 'retry_requested';

/** Metadata-only telemetry event describing a template render or interaction. */
export interface GdsPageTemplateTelemetryEvent {
  name: GdsPageTemplateTelemetryEventName;
  templateId: GdsPageTemplateId;
  state: GdsPageTemplateState;
  actionId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/** Static blueprint describing a page template's data, states, contracts, telemetry, accessibility, and rollback guidance. */
export interface GdsPageTemplateConfig {
  id: GdsPageTemplateId;
  title: string;
  description: string;
  packageName: '@sovereignsquad/gds-core';
  requiredData: string[];
  requiredStates: GdsPageTemplateState[];
  taskPatterns: string[];
  componentContracts: string[];
  telemetryEvents: GdsPageTemplateTelemetryEventName[];
  accessibility: string[];
  edgeCases: string[];
  rollback: string;
  /** Usage guidance rendered in the template's spec: what to do and what to avoid, from the template's behaviour. */
  guidance?: GdsPageTemplateGuidance;
}

/** Do and don't guidance for one page template. */
export interface GdsPageTemplateGuidance {
  /** Recommended uses, one sentence each. */
  do: string[];
  /** Uses to avoid, one sentence each. */
  dont: string[];
}

const allTemplateStates: GdsPageTemplateState[] = [
  'loading',
  'empty',
  'ready',
  'error',
  'retrying',
  'saving',
  'permission-denied',
  'not-found',
];

export const templateConfigs: GdsPageTemplateConfig[] = [
  {
    id: 'admin-dashboard',
    title: 'Admin dashboard template',
    description: 'Operational overview with metrics, sections, loading, empty, error, and retry states.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['metrics', 'sections', 'operator permission'],
    requiredStates: allTemplateStates,
    taskPatterns: ['review-submission', 'bulk-approve'],
    componentContracts: ['PageHeader', 'MetricCard', 'SectionPanel', 'AsyncSurface'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['main landmark', 'single h1', 'status copy', 'keyboard reachable actions'],
    edgeCases: ['no metrics', 'long localized title', 'permission denied', 'stale loader'],
    rollback: 'Keep the previous product route while adopting this additive template export.',
    guidance: {
      do: [
        'Pass `metrics` as `MetricCard` props, one numeric KPI each.',
        'Pass `onRetry` so the error and retrying states offer a retry action.',
      ],
      dont: [
        'Do not publish the page without metrics; it shows a "No metrics yet" block instead.',
        'Do not put identifiers, categories or placeholders in a metric `value`.',
      ],
    },
  },
  {
    id: 'settings',
    title: 'Settings template',
    description: 'Grouped settings surface with save, disabled, saving, and permission states.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['setting groups', 'save permission', 'dirty state'],
    requiredStates: allTemplateStates,
    taskPatterns: ['confirm-destructive-action'],
    componentContracts: ['PageHeader', 'SectionPanel', 'StatusBadge', 'AsyncSurface'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['labelled groups', 'save state copy', 'error recovery', 'keyboard submit path'],
    edgeCases: ['missing group', 'disabled save', 'server validation failure'],
    rollback: 'Consumers can keep route-local settings pages until migration is complete.',
    guidance: {
      do: [
        'Give each group an `id`, a `title` and its `fields`; each group is its own panel with an `h2`.',
        'Put the save action in `actions` and set its `loading` while saving.',
      ],
      dont: [
        'Do not pass an empty `groups` list for a page that has settings; it shows a "No settings available" block.',
        'Do not put a destructive action among the settings fields; use the crud-editor template\'s destructive zone.',
      ],
    },
  },
  {
    id: 'resource-manager',
    title: 'Resource manager template',
    description: 'List/detail resource surface for CRUD, preview, delete, and recovery workflows.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['rows', 'columns', 'resource actions', 'permission result'],
    requiredStates: allTemplateStates,
    taskPatterns: ['create-resource', 'copy-public-link', 'publish-toggle', 'confirm-destructive-action'],
    componentContracts: ['GdsDataTable', 'SimpleDataTable', 'DetailProfileShell', 'SectionPanel'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['table headers', 'named row actions', 'detail heading', 'retry action'],
    edgeCases: ['empty resources', 'not found detail', 'permission denied', 'stale rows'],
    rollback: 'Adopt per resource type; no persistence contract is hardcoded into the template.',
    guidance: {
      do: [
        'Pass `getRowKey` so each row keeps a stable key when the list changes.',
        'Pass `detail` for the selected resource; large screens then show the list and the detail side by side.',
      ],
      dont: [
        'Do not use it for folders or bulk actions on a selection; use the asset-manager template.',
        'Do not omit `columns`; the table renders only the columns it is given.',
      ],
    },
  },
  {
    id: 'crud-editor',
    title: 'CRUD editor template',
    description: 'Edit surface that composes governed forms, summaries, saving states, and destructive zones.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['form contract', 'submit action', 'validation state'],
    requiredStates: allTemplateStates,
    taskPatterns: ['create-resource', 'confirm-destructive-action'],
    componentContracts: ['GdsSchemaForm', 'GdsValidationSummary', 'SectionPanel', 'AsyncSurface'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['form labels', 'validation summary', 'status announcements', 'destructive confirmation boundary'],
    edgeCases: ['server validation', 'dirty draft restore', 'permission denied', 'save timeout'],
    rollback: 'Keep existing editor routes beside this template until schema/form adapters are ready.',
    guidance: {
      do: [
        'Pass the form as `form`; it renders in the "Editor" panel.',
        'Put delete and other irreversible actions in `destructiveZone`, a separate "Destructive actions" panel.',
      ],
      dont: [
        'Do not put irreversible actions in the page `actions` next to save.',
        'Do not use it for a list of records; use the resource-manager template.',
      ],
    },
  },
  {
    id: 'analytics',
    title: 'Analytics template',
    description: 'Reporting page with metrics, chart slot, table fallback, empty data, and retry states.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['period', 'metrics', 'chart or table data'],
    requiredStates: allTemplateStates,
    taskPatterns: ['review-submission'],
    componentContracts: ['MetricCard', 'PeriodSelector', 'GdsAreaChart', 'GdsLineChart', 'GdsDataTable', 'SimpleDataTable', 'StateBlock'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['non-color-only data summary', 'table fallback', 'heading hierarchy', 'empty data copy', 'chart summaries and data tables for every chart'],
    edgeCases: ['analytics no data', 'partial data', 'single data point', 'large values', 'right-to-left locale', 'chart adapter unavailable', 'long period labels'],
    rollback: 'Keep vendor-specific analytics behind the chart/table slots.',
    guidance: {
      do: [
        'Pass `rows` and `columns`, or `table`: the table is the accessible alternative to the chart and renders without one.',
        'Pass several charts as `charts`; two or more share two columns on large screens.',
      ],
      dont: [
        'Do not pass `chart` and `charts` together; when `charts` has items, `chart` is not rendered.',
        'Do not leave the data only in the chart.',
      ],
    },
  },
  {
    id: 'public-event',
    title: 'Public event template',
    description: 'Public event page with hero media slot, event metadata, registration, and no-media recovery.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['event title', 'date/time', 'registration state'],
    requiredStates: allTemplateStates,
    taskPatterns: ['copy-public-link'],
    componentContracts: ['PublicShell', 'MediaCard', 'ShareButtonGroup', 'StateBlock'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['public main landmark', 'event time text', 'media alternative slot', 'named CTA'],
    edgeCases: ['public event no media', 'registration closed', 'not found', 'timezone copy'],
    rollback: 'Adopt per public route without changing event storage or registration adapters.',
    guidance: {
      do: [
        'Pass `when` already formatted for the reader\'s locale; the template renders it as given.',
        'Pass the sign-up control as `registration`; a divider separates it from `details`.',
      ],
      dont: [
        'Do not repeat the date and place in `details`; `when` and `location` render in the event header row.',
        'Do not treat `media` as required; without it the page shows a "No image" block and stays readable.',
      ],
    },
  },
  {
    id: 'error-page',
    title: 'Error page template',
    description: 'Semantic error, not-found, and permission-denied page with explicit recovery actions.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['error class', 'recovery action availability'],
    requiredStates: ['error', 'permission-denied', 'not-found', 'retrying'],
    taskPatterns: ['confirm-destructive-action'],
    componentContracts: ['StateBlock', 'AsyncSurface', 'StatusBadge'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['main landmark', 'semantic heading', 'recovery action label', 'status text'],
    edgeCases: ['retry unavailable', 'permission denied', 'unknown route'],
    rollback: 'Replace route error pages one at a time; no routing adapter is required.',
    guidance: {
      do: [
        'Set `state` to `not-found`, `permission-denied` or `error`; `permission-denied` uses the permission state block.',
        'Pass `recovery` or `onRetry` so the page offers a way forward.',
      ],
      dont: [
        'Do not use it for an error inside one section; set that page template\'s `state` or use `StateBlock`.',
        'Do not leave `title` empty unless the state\'s default title fits; the state supplies it when `title` is empty.',
      ],
    },
  },
  {
    id: 'empty-state-page',
    title: 'Empty state page template',
    description: 'First-run or no-results page with actionable copy, status, and optional illustration slot.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['empty reason', 'primary recovery action'],
    requiredStates: ['empty', 'permission-denied', 'not-found'],
    taskPatterns: ['create-resource'],
    componentContracts: ['EmptyState', 'StateBlock', 'PageHeader'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked'],
    accessibility: ['single h1', 'specific empty reason', 'keyboard reachable recovery', 'no color-only meaning'],
    edgeCases: ['empty no action', 'permission denied', 'not found'],
    rollback: 'Replace blank pages and static placeholders route by route when recovery actions are ready.',
    guidance: {
      do: [
        'Put the first step, such as creating the first item, in `actions`.',
        'Pass an `illustration` only when it adds meaning; it renders above the heading.',
      ],
      dont: [
        'Do not use it for one empty section inside a page; use `StateBlock`.',
        'Do not omit `description` when the next step is not obvious from the title.',
      ],
    },
  },
  {
    id: 'asset-manager',
    title: 'Asset manager template',
    description: 'Dense file or asset screen with a folder tree, toolbar, bulk actions, a table/grid of items, upload and item detail.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['folder tree', 'items in the open folder', 'selection'],
    requiredStates: allTemplateStates,
    taskPatterns: ['create-resource', 'confirm-destructive-action'],
    componentContracts: ['GdsTreeView', 'DataToolbar', 'GdsBulkActionBar', 'GdsViewToggle', 'AdvancedDataTable', 'GdsAssetManager', 'GdsShapeScope'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['folder tree follows the tree pattern', 'keyboard path tree, toolbar, bulk actions, layout toggle, items', 'selection count announced', 'labelled layout toggle'],
    edgeCases: ['empty folder', 'nothing selected', 'thousands of items', 'upload failure', 'folder load error', 'permission denied'],
    rollback: 'Keep the existing resource screen beside this template; the slots accept the current table and upload components.',
    guidance: {
      do: [
        'Pass both `table` and `grid` to get the layout toggle; with only one there is no toggle.',
        'Pass `bulkActions` with the current `selectedCount`; the bar shows only while it is above zero.',
      ],
      dont: [
        'Do not import it from the `/server` entry; it is a client component.',
        'Do not wrap `tree` in your own `nav`; the template already wraps it in a labelled `nav`.',
      ],
    },
  },
  {
    id: 'workspace-inbox',
    title: 'Workspace inbox template',
    description: 'Inbox with workspace navigation, a thread list and a conversation pane; list then detail on narrow viewports.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['threads', 'open thread', 'messages of the open thread'],
    requiredStates: allTemplateStates,
    taskPatterns: ['review-submission'],
    componentContracts: ['SidebarNav', 'GdsThreadList', 'GdsMessageThread', 'StateBlock'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['labelled navigation, list and conversation regions', 'focus moves to the conversation heading when it opens on a narrow viewport', 'back action returns to the list', 'messages carry sender and time'],
    edgeCases: ['empty inbox', 'no conversation selected', 'conversation loading', 'conversation load error', 'long thread', 'narrow viewport'],
    rollback: 'Adopt per inbox route; the thread list and conversation slots accept existing components.',
    guidance: {
      do: [
        'Set `hasSelection` and `detailTitle` when a conversation opens; on a narrow viewport the conversation replaces the list and its heading takes focus.',
        'Pass `onBack` to clear the selection; the narrow-viewport back action calls it.',
        'Give the `GdsThreadList` `stateTitleOrder={2}` so its loading, empty and error titles follow the page `h1`.',
      ],
      dont: [
        'Do not pass `detail` without `hasSelection`; the pane asks for a selection until it is set.',
        'Do not import it from the `/server` entry; it is a client component.',
      ],
    },
  },
];

function cloneTemplateConfig(config: GdsPageTemplateConfig): GdsPageTemplateConfig {
  return {
    ...config,
    requiredData: [...config.requiredData],
    requiredStates: [...config.requiredStates],
    taskPatterns: [...config.taskPatterns],
    componentContracts: [...config.componentContracts],
    telemetryEvents: [...config.telemetryEvents],
    accessibility: [...config.accessibility],
    edgeCases: [...config.edgeCases],
    ...(config.guidance ? { guidance: { do: [...config.guidance.do], dont: [...config.guidance.dont] } } : {}),
  };
}

/** Returns deep clones of every governed page-template config. */
export function getGdsPageTemplates() {
  return templateConfigs.map(cloneTemplateConfig);
}

/** Returns a deep clone of the page-template config with the given id, or `undefined` if none matches. */
export function getGdsPageTemplate(id: GdsPageTemplateId | string) {
  const template = templateConfigs.find((item) => item.id === id);
  return template ? cloneTemplateConfig(template) : undefined;
}

/**
 * Validates page-template configs, returning human-readable failure messages
 * (empty when all pass): unique ids plus required telemetry, accessibility,
 * edge-case, and component-contract coverage.
 */
export function validateGdsPageTemplates(templates: GdsPageTemplateConfig[] = templateConfigs) {
  const failures: string[] = [];
  const ids = new Set<string>();
  for (const template of templates) {
    if (ids.has(template.id)) failures.push(`Duplicate page template id: ${template.id}`);
    ids.add(template.id);
    if (!template.telemetryEvents.includes('page_view')) failures.push(`${template.id} must expose page_view telemetry.`);
    if (!template.telemetryEvents.includes('state_visible')) failures.push(`${template.id} must expose state_visible telemetry.`);
    if (!template.accessibility.length) failures.push(`${template.id} must define accessibility guidance.`);
    if (!template.edgeCases.length) failures.push(`${template.id} must define edge-case guidance.`);
    if (!template.componentContracts.length) failures.push(`${template.id} must define component contracts.`);
    if (template.guidance && (!template.guidance.do.length || !template.guidance.dont.length)) failures.push(`${template.id} guidance must list at least one do and one don't.`);
  }
  return failures;
}

/** Builds a page-template telemetry event; the event name defaults to `state_visible`. */
export function createGdsPageTemplateEvent(
  templateId: GdsPageTemplateId,
  state: GdsPageTemplateState,
  name: GdsPageTemplateTelemetryEventName = 'state_visible',
  options: Pick<GdsPageTemplateTelemetryEvent, 'actionId' | 'metadata'> = {},
): GdsPageTemplateTelemetryEvent {
  return {
    name,
    templateId,
    state,
    ...options,
  };
}
