import type { Key, ReactNode } from 'react';
import { Badge, Box, Card, Divider, Group, List, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsGrid, GdsStack } from './LayoutPrimitives';
import { MetricCard, type MetricCardProps } from './MetricCard';
import { SectionPanel } from './SectionPanel';
import { SimpleDataTable, type SimpleTableColumn } from './SimpleDataTable';
import { StateBlock } from './StateBlock';
import { stateTitle, stateDescription, renderActions, PageTemplateFrame, TemplateStateGate } from './GdsPageTemplateFrame';

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

/** A button/action rendered in a page template's header or state region. */
export interface GdsPageTemplateAction {
  id: string;
  label: string;
  /** Visual/semantic role controlling the action's color and variant. Defaults to secondary. */
  kind?: 'primary' | 'secondary' | 'danger' | 'link';
  disabled?: boolean;
  /**
   * Busy/loading state: renders the action disabled with a `…` suffix. Named
   * `loading` to match every other GDS action/button API (`SemanticButton`,
   * `ConfirmDialog`, `GdsAccessGateAction`, table row actions).
   */
  loading?: boolean;
  /**
   * @deprecated Use {@link GdsPageTemplateAction.loading} instead — renamed for
   * consistency with every other GDS action/button API. `pending` is still
   * honored as an alias (mapped to `loading`, with a dev-only warning) and will
   * be removed in a future major version. If both are set, `loading` wins.
   */
  pending?: boolean;
  /** Marks the action as destructive, rendering it in the danger (red) color. */
  destructive?: boolean;
  onClick?: () => void;
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

/** Shared props for every GDS page template: header content, current state, actions, and retry wiring. */
export interface GdsPageTemplateBaseProps {
  /** Page title, rendered as the page `h1`. */
  title: string;
  /** Supporting text under the title. */
  description?: string;
  /** Small uppercase label rendered above the title. */
  eyebrow?: string;
  /** Current page state; drives the status badge and the async state gate. Defaults to `ready`. */
  state?: GdsPageTemplateState;
  /** Page-level actions rendered in the header beside the status badge. */
  actions?: GdsPageTemplateAction[];
  /** Invoked when the user triggers the retry action shown in error/retrying states. */
  onRetry?: () => void;
  /** Label of the retry action; defaults to the `gds.gdsPageTemplates.retryLabel` message. */
  retryLabel?: string;
  /** Overrides the status-badge text; defaults to a label derived from `state`. */
  statusLabel?: string;
  children?: ReactNode;
  /** Optional content rendered in a bordered card between the header and the body. */
  metadata?: ReactNode;
  /**
   * `main` (default) renders the template as the page's `<main>` landmark. `none` renders a
   * plain container, for a template embedded in a page that already has a `<main>`.
   */
  landmark?: 'main' | 'none';
}

/** Props for the admin dashboard template: a metric grid plus governed sections. */
export interface GdsAdminDashboardTemplateProps extends GdsPageTemplateBaseProps {
  /** Metric cards shown in the summary grid. */
  metrics?: MetricCardProps[];
  /** Governed content sections rendered below the metrics. */
  sections?: GdsPageTemplateSection[];
}

/** Props for the settings template: grouped setting sections. */
export interface GdsSettingsTemplateProps extends GdsPageTemplateBaseProps {
  /** Labelled groups of settings fields rendered as sections. */
  groups?: GdsSettingsGroup[];
}

/** Props for the resource-manager template: a governed resource list with an optional detail pane. */
export interface GdsResourceManagerTemplateProps<T extends Record<string, unknown> = Record<string, unknown>> extends GdsPageTemplateBaseProps {
  /** Resource rows for the list table. */
  rows?: T[];
  /** Column definitions for the list table. */
  columns?: SimpleTableColumn<T>[];
  /** Optional detail content shown alongside the list when a resource is selected. */
  detail?: ReactNode;
  /** Derives a stable React key for each row; defaults to the row index. */
  getRowKey?: (row: T, index: number) => Key;
}

/** Props for the CRUD editor template: form plus optional summary and destructive-actions zone. */
export interface GdsCrudEditorTemplateProps extends GdsPageTemplateBaseProps {
  /** The governed form rendered in the editor section. */
  form: ReactNode;
  /** Optional read-only summary shown above the form. */
  summary?: ReactNode;
  /** Optional destructive-actions section requiring confirmation/recovery copy. */
  destructiveZone?: ReactNode;
}

/** Props for the analytics template: metric grid, chart slot with table fallback, and optional insight card. */
export interface GdsAnalyticsTemplateProps<T extends Record<string, unknown> = Record<string, unknown>> extends GdsPageTemplateBaseProps {
  /** Metric cards shown in the summary grid. */
  metrics?: MetricCardProps[];
  /** Governed chart slot; a not-enough-data block is shown when omitted. */
  chart?: ReactNode;
  /** Rows for the accessible table fallback beneath the chart. */
  rows?: T[];
  /** Column definitions for the table fallback. */
  columns?: SimpleTableColumn<T>[];
  /** Optional insight/commentary card rendered between the chart and table. */
  insight?: ReactNode;
  /** Period control shown above the charts, e.g. `PeriodSelector`. */
  periodControl?: ReactNode;
  /** Charts on the chart tokens (`GdsAreaChart`, `GdsLineChart`); one or two per row. Takes precedence over `chart`. */
  charts?: ReactNode[];
  /** Structured data table, e.g. `GdsDataTable` through `createGdsTableAdapter`; replaces the `rows`/`columns` fallback. */
  table?: ReactNode;
}

/** Props for the public event template: hero media, event metadata, details, and registration. */
export interface GdsPublicEventTemplateProps extends GdsPageTemplateBaseProps {
  /** Human-readable event date/time text. */
  when: string;
  /** Optional event location text. */
  location?: string;
  /** Optional hero media slot; a no-media recovery block is shown when omitted. */
  media?: ReactNode;
  /** Optional event body/details content. */
  details?: ReactNode;
  /** Optional registration content shown after a divider. */
  registration?: ReactNode;
}

/** Props for the error page template, restricted to error/not-found/permission-denied states. */
export interface GdsErrorPageTemplateProps extends Omit<GdsPageTemplateBaseProps, 'state'> {
  /** Error state to render. Defaults to `error`. */
  state?: Extract<GdsPageTemplateState, 'error' | 'not-found' | 'permission-denied'>;
  /** Optional status/error code prefixed to the title (e.g. `404`). */
  code?: string | number;
  /** Optional recovery action; falls back to a retry button when `onRetry` is set. */
  recovery?: ReactNode;
}

/** Props for the empty-state page template, restricted to empty/permission-denied/not-found states. */
export interface GdsEmptyStateTemplateProps extends Omit<GdsPageTemplateBaseProps, 'state'> {
  /** Empty state to render. Defaults to `empty`. */
  state?: Extract<GdsPageTemplateState, 'empty' | 'permission-denied' | 'not-found'>;
  /** Optional illustration rendered above the title. */
  illustration?: ReactNode;
}

/** A titled content section rendered inside dashboard-style templates. */
export interface GdsPageTemplateSection {
  id: string;
  title: string;
  description?: ReactNode;
  content?: ReactNode;
}

/** A labelled group of settings fields rendered as a section in the settings template. */
export interface GdsSettingsGroup {
  id: string;
  title: string;
  description?: ReactNode;
  fields: ReactNode;
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

const templateConfigs: GdsPageTemplateConfig[] = [
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
        'Do not publish the page without metrics; it shows a "No metrics configured" block instead.',
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
        'Do not pass an empty `groups` list for a page that has settings; it shows a "No settings groups" block.',
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
        'Do not treat `media` as required; without it the page shows a "No media available" block and stays readable.',
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

function renderSections(sections: GdsPageTemplateSection[] = []) {
  if (!sections.length) {
    return <StateBlock variant="empty" title="No sections configured" description="Add at least one governed section before publishing this page." compact titleOrder={2} />;
  }
  return (
    <GdsGrid columns={{ base: 1, md: 2 }} gap="md">
      {sections.map((section) => (
        <SectionPanel titleOrder={2} key={section.id} title={section.title} description={section.description}>
          {section.content}
        </SectionPanel>
      ))}
    </GdsGrid>
  );
}

/** Admin dashboard page template: a metric grid plus governed sections, wrapped in the shared async state gate. */
export function GdsAdminDashboardTemplate({
  state = 'ready',
  metrics = [],
  sections = [],
  onRetry,
  retryLabel,
  ...props
}: GdsAdminDashboardTemplateProps) {
  return (
    <PageTemplateFrame id="admin-dashboard" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsStack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {metrics.length ? metrics.map((metric) => <MetricCard key={String(metric.label)} {...metric} />) : <StateBlock variant="empty" title="No metrics configured" description="Connect governed metric cards before publishing the dashboard." compact titleOrder={2} />}
            </SimpleGrid>
            {renderSections(sections)}
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

/** Settings page template rendering grouped setting sections, with empty and state handling. */
export function GdsSettingsTemplate({
  state = 'ready',
  groups = [],
  onRetry,
  retryLabel,
  ...props
}: GdsSettingsTemplateProps) {
  return (
    <PageTemplateFrame id="settings" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={groups.length ? (
          <GdsStack gap="md">
            {groups.map((group) => (
              <SectionPanel titleOrder={2} key={group.id} title={group.title} description={group.description}>
                {group.fields}
              </SectionPanel>
            ))}
          </GdsStack>
        ) : <StateBlock variant="empty" title="No settings groups" description="Settings pages must publish grouped fields with labels and save behavior." compact titleOrder={2} />}
      />
    </PageTemplateFrame>
  );
}

/** Resource-manager page template: a governed resource list with an optional detail pane. */
export function GdsResourceManagerTemplate<T extends Record<string, unknown> = Record<string, unknown>>({
  state = 'ready',
  rows = [],
  columns = [],
  detail,
  getRowKey,
  onRetry,
  retryLabel,
  ...props
}: GdsResourceManagerTemplateProps<T>) {
  return (
    <PageTemplateFrame id="resource-manager" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsGrid columns={{ base: 1, lg: detail ? 2 : 1 }} gap="lg">
            <SectionPanel titleOrder={2} title="Resources" description="Governed resource list with empty, loading, and error states.">
              <SimpleDataTable rows={rows} columns={columns} getRowKey={getRowKey} emptyTitle="No resources" emptyDescription="Create or import a resource to start this workflow." stateTitleOrder={3} />
            </SectionPanel>
            {detail ? <SectionPanel titleOrder={2} title="Selected resource">{detail}</SectionPanel> : null}
          </GdsGrid>
        )}
      />
    </PageTemplateFrame>
  );
}

/** CRUD editor page template composing an optional summary, the form, and an optional destructive-actions zone. */
export function GdsCrudEditorTemplate({
  state = 'ready',
  form,
  summary,
  destructiveZone,
  onRetry,
  retryLabel,
  ...props
}: GdsCrudEditorTemplateProps) {
  return (
    <PageTemplateFrame id="crud-editor" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsStack gap="lg">
            {summary ? <SectionPanel titleOrder={2} title="Summary">{summary}</SectionPanel> : null}
            <SectionPanel titleOrder={2} title="Editor">{form}</SectionPanel>
            {destructiveZone ? <SectionPanel titleOrder={2} title="Destructive actions" description="Risky changes require confirmation and recovery copy.">{destructiveZone}</SectionPanel> : null}
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

/** Analytics page template: metric grid, chart slot with accessible table fallback, and optional insight card. */
export function GdsAnalyticsTemplate<T extends Record<string, unknown> = Record<string, unknown>>({
  state = 'ready',
  metrics = [],
  chart,
  rows = [],
  columns = [],
  insight,
  periodControl,
  charts,
  table,
  onRetry,
  retryLabel,
  ...props
}: GdsAnalyticsTemplateProps<T>) {
  return (
    <PageTemplateFrame id="analytics" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsStack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {metrics.map((metric) => <MetricCard key={String(metric.label)} {...metric} />)}
            </SimpleGrid>
            <SectionPanel titleOrder={2} title="Chart and accessible summary">
              <GdsStack gap="md">
                {periodControl}
                {charts?.length ? (
                  <SimpleGrid cols={{ base: 1, lg: charts.length > 1 ? 2 : 1 }} spacing="md">
                    {charts.map((item, index) => <Box key={index}>{item}</Box>)}
                  </SimpleGrid>
                ) : (chart ?? <StateBlock variant="not-enough-data" title="No chart available" description="Provide a governed chart or keep the table fallback visible." compact titleOrder={3} />)}
              </GdsStack>
            </SectionPanel>
            {insight ? <Card withBorder radius="lg" padding="md">{insight}</Card> : null}
            {table ?? <SimpleDataTable rows={rows} columns={columns} emptyTitle="No analytics data" emptyDescription="The selected period has no reportable data yet." stateTitleOrder={3} />}
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

/** Public event page template with hero media slot, event metadata, details, and registration, plus no-media recovery. */
export function GdsPublicEventTemplate({
  state = 'ready',
  when,
  location,
  media,
  details,
  registration,
  onRetry,
  retryLabel,
  ...props
}: GdsPublicEventTemplateProps) {
  return (
    <PageTemplateFrame id="public-event" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsGrid columns={{ base: 1, md: media ? 2 : 1 }} gap="lg">
            {media ? <Card withBorder radius="lg" padding="md">{media}</Card> : <StateBlock variant="empty" title="No media available" description="This event remains readable without a hero image." compact titleOrder={2} />}
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="md">
                <Group gap="sm" wrap="wrap">
                  <Badge variant="light">Event</Badge>
                  <Text fw={700}>{when}</Text>
                  {location ? <Text c="dimmed">{location}</Text> : null}
                </Group>
                {details}
                {registration ? <Divider /> : null}
                {registration}
              </Stack>
            </Card>
          </GdsGrid>
        )}
      />
    </PageTemplateFrame>
  );
}

/** Error / not-found / permission-denied page template with explicit recovery actions. */
export function GdsErrorPageTemplate({
  state = 'error',
  code,
  title,
  description,
  recovery,
  onRetry,
  retryLabel: retryLabelProp,
  actions,
  ...props
}: GdsErrorPageTemplateProps) {
  const { t } = useGdsTranslation();
  const retryLabel = retryLabelProp ?? t('gds.gdsPageTemplates.retryLabel', "Retry");

  const resolvedTitle = title || stateTitle(state);
  const resolvedDescription = description || stateDescription(state);
  return (
    <PageTemplateFrame id="error-page" state={state} title={resolvedTitle} description={resolvedDescription} actions={actions} {...props}>
      <StateBlock
        variant={state === 'permission-denied' ? 'permission' : 'error'}
        title={code ? `${code}: ${resolvedTitle}` : resolvedTitle}
        description={resolvedDescription}
        titleOrder={2}
        action={recovery ?? (onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : undefined)}
      />
    </PageTemplateFrame>
  );
}

/** First-run / no-results page template with an optional illustration and recovery actions. */
export function GdsEmptyStateTemplate({
  state = 'empty',
  title,
  description,
  illustration,
  actions,
  ...props
}: GdsEmptyStateTemplateProps) {
  return (
    <PageTemplateFrame id="empty-state-page" state={state} title={title} description={description} {...props}>
      <Card withBorder radius="lg" padding="xl">
        <Stack align="center" gap="lg" ta="center">
          {illustration}
          <Title order={2}>{title}</Title>
          {description ? <Text c="dimmed" maw={560}>{description}</Text> : null}
          {renderActions(actions)}
        </Stack>
      </Card>
    </PageTemplateFrame>
  );
}

/** Renders a catalog of every page template as cards summarizing their contracts, states, and telemetry. */
export function GdsPageTemplateCatalog() {
  return (
    <GdsStack gap="md">
      {templateConfigs.map((template) => (
        <Card key={template.id} withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Group justify="space-between" gap="sm" wrap="wrap">
              <Title order={3}>{template.title}</Title>
              <Badge variant="light">{template.id}</Badge>
            </Group>
            <Text c="dimmed">{template.description}</Text>
            <List size="sm">
              <List.Item>Contracts: {template.componentContracts.join(', ')}</List.Item>
              <List.Item>States: {template.requiredStates.join(', ')}</List.Item>
              <List.Item>Telemetry: {template.telemetryEvents.join(', ')}</List.Item>
            </List>
          </Stack>
        </Card>
      ))}
    </GdsStack>
  );
}
