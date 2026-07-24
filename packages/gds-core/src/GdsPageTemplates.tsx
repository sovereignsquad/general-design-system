import type { Key, ReactNode } from 'react';
import { Badge, Card, Divider, Group, List, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { gdsDevWarnOnce } from '@sovereignsquad/gds-theme';
import { AsyncSurface, type AsyncSurfaceState } from './AsyncSurface';
import { GdsBox, GdsGrid, GdsStack } from './LayoutPrimitives';
import { MetricCard, type MetricCardProps } from './MetricCard';
import { PageHeader } from './PageHeader';
import { SectionPanel } from './SectionPanel';
import { SimpleDataTable, type SimpleTableColumn } from './SimpleDataTable';
import { StateBlock } from './StateBlock';
import { StatusBadge, type StatusVariant } from './StatusBadge';

export type GdsPageTemplateId =
  | 'admin-dashboard'
  | 'settings'
  | 'resource-manager'
  | 'crud-editor'
  | 'analytics'
  | 'public-event'
  | 'error-page'
  | 'empty-state-page';

export type GdsPageTemplateState =
  | 'loading'
  | 'empty'
  | 'ready'
  | 'error'
  | 'retrying'
  | 'saving'
  | 'permission-denied'
  | 'not-found';

export type GdsPageTemplateTelemetryEventName =
  | 'page_view'
  | 'state_visible'
  | 'action_clicked'
  | 'retry_requested';

export interface GdsPageTemplateTelemetryEvent {
  name: GdsPageTemplateTelemetryEventName;
  templateId: GdsPageTemplateId;
  state: GdsPageTemplateState;
  actionId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GdsPageTemplateAction {
  id: string;
  label: string;
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
  destructive?: boolean;
  onClick?: () => void;
}

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
}

export interface GdsPageTemplateBaseProps {
  title: string;
  description?: string;
  eyebrow?: string;
  state?: GdsPageTemplateState;
  actions?: GdsPageTemplateAction[];
  onRetry?: () => void;
  retryLabel?: string;
  statusLabel?: string;
  children?: ReactNode;
  metadata?: ReactNode;
}

export interface GdsAdminDashboardTemplateProps extends GdsPageTemplateBaseProps {
  metrics?: MetricCardProps[];
  sections?: GdsPageTemplateSection[];
}

export interface GdsSettingsTemplateProps extends GdsPageTemplateBaseProps {
  groups?: GdsSettingsGroup[];
}

export interface GdsResourceManagerTemplateProps<T extends Record<string, unknown> = Record<string, unknown>> extends GdsPageTemplateBaseProps {
  rows?: T[];
  columns?: SimpleTableColumn<T>[];
  detail?: ReactNode;
  getRowKey?: (row: T, index: number) => Key;
}

export interface GdsCrudEditorTemplateProps extends GdsPageTemplateBaseProps {
  form: ReactNode;
  summary?: ReactNode;
  destructiveZone?: ReactNode;
}

export interface GdsAnalyticsTemplateProps<T extends Record<string, unknown> = Record<string, unknown>> extends GdsPageTemplateBaseProps {
  metrics?: MetricCardProps[];
  chart?: ReactNode;
  rows?: T[];
  columns?: SimpleTableColumn<T>[];
  insight?: ReactNode;
}

export interface GdsPublicEventTemplateProps extends GdsPageTemplateBaseProps {
  when: string;
  location?: string;
  media?: ReactNode;
  details?: ReactNode;
  registration?: ReactNode;
}

export interface GdsErrorPageTemplateProps extends Omit<GdsPageTemplateBaseProps, 'state'> {
  state?: Extract<GdsPageTemplateState, 'error' | 'not-found' | 'permission-denied'>;
  code?: string | number;
  recovery?: ReactNode;
}

export interface GdsEmptyStateTemplateProps extends Omit<GdsPageTemplateBaseProps, 'state'> {
  state?: Extract<GdsPageTemplateState, 'empty' | 'permission-denied' | 'not-found'>;
  illustration?: ReactNode;
}

export interface GdsPageTemplateSection {
  id: string;
  title: string;
  description?: ReactNode;
  content?: ReactNode;
}

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
  },
  {
    id: 'analytics',
    title: 'Analytics template',
    description: 'Reporting page with metrics, chart slot, table fallback, empty data, and retry states.',
    packageName: '@sovereignsquad/gds-core',
    requiredData: ['period', 'metrics', 'chart or table data'],
    requiredStates: allTemplateStates,
    taskPatterns: ['review-submission'],
    componentContracts: ['MetricCard', 'GdsChart', 'SimpleDataTable', 'StateBlock'],
    telemetryEvents: ['page_view', 'state_visible', 'action_clicked', 'retry_requested'],
    accessibility: ['non-color-only data summary', 'table fallback', 'heading hierarchy', 'empty data copy'],
    edgeCases: ['analytics no data', 'chart adapter unavailable', 'long period labels'],
    rollback: 'Keep vendor-specific analytics behind the chart/table slots.',
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
  };
}

export function getGdsPageTemplates() {
  return templateConfigs.map(cloneTemplateConfig);
}

export function getGdsPageTemplate(id: GdsPageTemplateId | string) {
  const template = templateConfigs.find((item) => item.id === id);
  return template ? cloneTemplateConfig(template) : undefined;
}

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
  }
  return failures;
}

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

function stateToAsyncState(state: GdsPageTemplateState): AsyncSurfaceState {
  if (state === 'ready' || state === 'saving') return 'success';
  if (state === 'retrying') return 'refreshing';
  if (state === 'permission-denied' || state === 'not-found') return 'error';
  return state;
}

function stateTitle(state: GdsPageTemplateState) {
  const titles: Record<GdsPageTemplateState, string> = {
    loading: 'Loading',
    empty: 'Nothing here yet',
    ready: 'Ready',
    error: 'Unable to load',
    retrying: 'Retrying',
    saving: 'Saving',
    'permission-denied': 'Permission denied',
    'not-found': 'Not found',
  };
  return titles[state];
}

function stateDescription(state: GdsPageTemplateState) {
  const descriptions: Record<GdsPageTemplateState, string> = {
    loading: 'The page is preparing the latest governed data.',
    empty: 'There is no data available for this page yet.',
    ready: 'The page is ready.',
    error: 'The page could not be prepared. Retry when the upstream service recovers.',
    retrying: 'The recovery action is running.',
    saving: 'Your changes are being saved.',
    'permission-denied': 'Your current role cannot access this page.',
    'not-found': 'The requested resource could not be found.',
  };
  return descriptions[state];
}

function statusVariantForState(state: GdsPageTemplateState): StatusVariant {
  if (state === 'ready') return 'success';
  if (state === 'saving' || state === 'retrying' || state === 'loading') return 'info';
  if (state === 'error' || state === 'not-found') return 'danger';
  if (state === 'permission-denied') return 'warning';
  return 'neutral';
}

function actionVariant(action: GdsPageTemplateAction) {
  if (action.kind === 'primary') return 'filled';
  if (action.kind === 'danger') return 'light';
  return 'outline';
}

function actionColor(action: GdsPageTemplateAction) {
  if (action.kind === 'danger' || action.destructive) return 'red';
  if (action.kind === 'primary') return 'violet';
  return 'gray';
}

/**
 * Resolves an action's busy state, honoring the deprecated `pending` alias.
 * `loading` takes precedence; if only the legacy `pending` is set, it is used and
 * a one-time dev warning points the caller at `loading`.
 */
function actionIsBusy(action: GdsPageTemplateAction): boolean {
  if (action.pending !== undefined && action.loading === undefined) {
    gdsDevWarnOnce(
      'GdsPageTemplateAction:pending-deprecated',
      'GdsPageTemplateAction.pending is deprecated; rename it to `loading` for consistency with every other GDS action API. `pending` is still honored for now and will be removed in a future major version.',
    );
  }
  return action.loading ?? action.pending ?? false;
}

function renderActions(actions: GdsPageTemplateAction[] = []) {
  if (!actions.length) return null;
  return (
    <Group gap="sm" wrap="wrap">
      {actions.map((action) => {
        const busy = actionIsBusy(action);
        return (
          <button
            key={action.id}
            type="button"
            aria-disabled={action.disabled || busy || undefined}
            disabled={action.disabled || busy}
            onClick={action.onClick}
            data-gds-template-action={action.id}
            data-gds-template-action-kind={action.kind ?? 'secondary'}
            style={{
              minHeight: 40,
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-default-border)',
              padding: '0 var(--mantine-spacing-md)',
              fontWeight: 700,
              color: `var(--mantine-color-${actionColor(action)}-7)`,
              background: actionVariant(action) === 'filled' ? `var(--mantine-color-${actionColor(action)}-1)` : 'var(--mantine-color-body)',
            }}
          >
            {busy ? `${action.label}...` : action.label}
          </button>
        );
      })}
    </Group>
  );
}

function PageTemplateFrame({
  id,
  title,
  description,
  eyebrow,
  state = 'ready',
  actions,
  statusLabel,
  metadata,
  children,
}: GdsPageTemplateBaseProps & { id: GdsPageTemplateId }) {
  return (
    <GdsBox component="main" padding={{ base: 'md', md: 'xl' }} data-gds-page-template={id}>
      <GdsStack gap="lg">
        <PageHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          actions={(
            <Group gap="sm" wrap="wrap">
              <StatusBadge status={statusVariantForState(state)}>{statusLabel ?? stateTitle(state)}</StatusBadge>
              {renderActions(actions)}
            </Group>
          )}
        />
        {metadata ? <Card withBorder radius="lg" padding="md">{metadata}</Card> : null}
        {children}
      </GdsStack>
    </GdsBox>
  );
}

function TemplateStateGate({
  state = 'ready',
  successContent,
  onRetry,
  retryLabel = 'Retry',
}: {
  state?: GdsPageTemplateState;
  successContent: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const retryAction = onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : undefined;
  return (
    <AsyncSurface
      state={stateToAsyncState(state)}
      successContent={successContent}
      loadingTitle={stateTitle('loading')}
      loadingDescription={stateDescription('loading')}
      emptyTitle={stateTitle('empty')}
      emptyDescription={stateDescription('empty')}
      errorTitle={stateTitle(state === 'permission-denied' || state === 'not-found' ? state : 'error')}
      errorDescription={stateDescription(state === 'permission-denied' || state === 'not-found' ? state : 'error')}
      refreshingTitle={stateTitle('retrying')}
      refreshingDescription={stateDescription('retrying')}
      retryAction={retryAction}
      compact={false}
    />
  );
}

function renderSections(sections: GdsPageTemplateSection[] = []) {
  if (!sections.length) {
    return <StateBlock variant="empty" title="No sections configured" description="Add at least one governed section before publishing this page." compact />;
  }
  return (
    <GdsGrid columns={{ base: 1, md: 2 }} gap="md">
      {sections.map((section) => (
        <SectionPanel key={section.id} title={section.title} description={section.description}>
          {section.content}
        </SectionPanel>
      ))}
    </GdsGrid>
  );
}

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
              {metrics.length ? metrics.map((metric) => <MetricCard key={String(metric.label)} {...metric} />) : <StateBlock variant="empty" title="No metrics configured" description="Connect governed metric cards before publishing the dashboard." compact />}
            </SimpleGrid>
            {renderSections(sections)}
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

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
              <SectionPanel key={group.id} title={group.title} description={group.description}>
                {group.fields}
              </SectionPanel>
            ))}
          </GdsStack>
        ) : <StateBlock variant="empty" title="No settings groups" description="Settings pages must publish grouped fields with labels and save behavior." compact />}
      />
    </PageTemplateFrame>
  );
}

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
            <SectionPanel title="Resources" description="Governed resource list with empty, loading, and error states.">
              <SimpleDataTable rows={rows} columns={columns} getRowKey={getRowKey} emptyTitle="No resources" emptyDescription="Create or import a resource to start this workflow." />
            </SectionPanel>
            {detail ? <SectionPanel title="Selected resource">{detail}</SectionPanel> : null}
          </GdsGrid>
        )}
      />
    </PageTemplateFrame>
  );
}

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
            {summary ? <SectionPanel title="Summary">{summary}</SectionPanel> : null}
            <SectionPanel title="Editor">{form}</SectionPanel>
            {destructiveZone ? <SectionPanel title="Destructive actions" description="Risky changes require confirmation and recovery copy.">{destructiveZone}</SectionPanel> : null}
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

export function GdsAnalyticsTemplate<T extends Record<string, unknown> = Record<string, unknown>>({
  state = 'ready',
  metrics = [],
  chart,
  rows = [],
  columns = [],
  insight,
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
            <SectionPanel title="Chart and accessible summary">
              {chart ?? <StateBlock variant="not-enough-data" title="No chart available" description="Provide a governed chart or keep the table fallback visible." compact />}
            </SectionPanel>
            {insight ? <Card withBorder radius="lg" padding="md">{insight}</Card> : null}
            <SimpleDataTable rows={rows} columns={columns} emptyTitle="No analytics data" emptyDescription="The selected period has no reportable data yet." />
          </GdsStack>
        )}
      />
    </PageTemplateFrame>
  );
}

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
            {media ? <Card withBorder radius="lg" padding="md">{media}</Card> : <StateBlock variant="empty" title="No media available" description="This event remains readable without a hero image." compact />}
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

export function GdsErrorPageTemplate({
  state = 'error',
  code,
  title,
  description,
  recovery,
  onRetry,
  retryLabel = 'Retry',
  actions,
  ...props
}: GdsErrorPageTemplateProps) {
  const resolvedTitle = title || stateTitle(state);
  const resolvedDescription = description || stateDescription(state);
  return (
    <PageTemplateFrame id="error-page" state={state} title={resolvedTitle} description={resolvedDescription} actions={actions} {...props}>
      <StateBlock
        variant={state === 'permission-denied' ? 'permission' : 'error'}
        title={code ? `${code}: ${resolvedTitle}` : resolvedTitle}
        description={resolvedDescription}
        action={recovery ?? (onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : undefined)}
      />
    </PageTemplateFrame>
  );
}

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
