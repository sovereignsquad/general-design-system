'use client';

import type { Key, ReactNode } from 'react';
import { Badge, Box, Button, Card, Divider, Group, List, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsGrid, GdsStack } from './LayoutPrimitives';
import { MetricCard, type MetricCardProps } from './MetricCard';
import { SectionPanel } from './SectionPanel';
import { SimpleDataTable, type SimpleTableColumn } from './SimpleDataTable';
import { StateBlock } from './StateBlock';
import { stateTitle, stateDescription, renderActions, PageTemplateFrame, TemplateStateGate, type GdsTemplateTranslate } from './GdsPageTemplateFrame';
import { type GdsPageTemplateState, templateConfigs } from './GdsPageTemplates.shared';

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

function renderSections(t: GdsTemplateTranslate, sections: GdsPageTemplateSection[] = []) {
  if (!sections.length) {
    return <StateBlock variant="empty" title={t('gds.gdsPageTemplates.noSections.title', "Nothing to show yet")} description={t('gds.gdsPageTemplates.noSections.description', "Sections appear here once they are available.")} compact titleOrder={2} />;
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
  const { t } = useGdsTranslation();
  return (
    <PageTemplateFrame id="admin-dashboard" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsStack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {metrics.length ? metrics.map((metric) => <MetricCard key={String(metric.label)} {...metric} />) : <StateBlock variant="empty" title={t('gds.gdsPageTemplates.noMetrics.title', "No metrics yet")} description={t('gds.gdsPageTemplates.noMetrics.description', "Metrics appear here once they are available.")} compact titleOrder={2} />}
            </SimpleGrid>
            {renderSections(t, sections)}
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
  const { t } = useGdsTranslation();
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
        ) : <StateBlock variant="empty" title={t('gds.gdsPageTemplates.noSettings.title', "No settings available")} description={t('gds.gdsPageTemplates.noSettings.description', "There are no settings to change here.")} compact titleOrder={2} />}
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
  const { t } = useGdsTranslation();
  return (
    <PageTemplateFrame id="resource-manager" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsGrid columns={{ base: 1, lg: detail ? 2 : 1 }} gap="lg">
            <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.resources.title', "Resources")}>
              <SimpleDataTable rows={rows} columns={columns} getRowKey={getRowKey} emptyTitle={t('gds.gdsPageTemplates.resources.emptyTitle', "No resources yet")} emptyDescription={t('gds.gdsPageTemplates.resources.emptyDescription', "Create or import a resource to get started.")} stateTitleOrder={3} />
            </SectionPanel>
            {detail ? <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.resources.selectedTitle', "Selected resource")}>{detail}</SectionPanel> : null}
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
  const { t } = useGdsTranslation();
  return (
    <PageTemplateFrame id="crud-editor" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsStack gap="lg">
            {summary ? <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.crud.summaryTitle', "Summary")}>{summary}</SectionPanel> : null}
            <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.crud.editorTitle', "Editor")}>{form}</SectionPanel>
            {destructiveZone ? <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.crud.destructiveTitle', "Destructive actions")} description={t('gds.gdsPageTemplates.crud.destructiveDescription', "These changes cannot be undone.")}>{destructiveZone}</SectionPanel> : null}
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
  const { t } = useGdsTranslation();
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
            <SectionPanel titleOrder={2} title={t('gds.gdsPageTemplates.analytics.chartsTitle', "Charts")}>
              <GdsStack gap="md">
                {periodControl}
                {charts?.length ? (
                  <SimpleGrid cols={{ base: 1, lg: charts.length > 1 ? 2 : 1 }} spacing="md">
                    {charts.map((item, index) => <Box key={index}>{item}</Box>)}
                  </SimpleGrid>
                ) : (chart ?? <StateBlock variant="not-enough-data" title={t('gds.gdsPageTemplates.analytics.noChartTitle', "No chart available")} description={t('gds.gdsPageTemplates.analytics.noChartDescription', "The data is in the table below.")} compact titleOrder={3} />)}
              </GdsStack>
            </SectionPanel>
            {insight ? <Card withBorder radius="lg" padding="md">{insight}</Card> : null}
            {table ?? <SimpleDataTable rows={rows} columns={columns} emptyTitle={t('gds.gdsPageTemplates.analytics.emptyTitle', "No data for this period")} emptyDescription={t('gds.gdsPageTemplates.analytics.emptyDescription', "Choose another period or check back later.")} stateTitleOrder={3} />}
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
  const { t } = useGdsTranslation();
  return (
    <PageTemplateFrame id="public-event" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={(
          <GdsGrid columns={{ base: 1, md: media ? 2 : 1 }} gap="lg">
            {media ? <Card withBorder radius="lg" padding="md">{media}</Card> : <StateBlock variant="empty" title={t('gds.gdsPageTemplates.event.noMediaTitle', "No image")} description={t('gds.gdsPageTemplates.event.noMediaDescription', "This event has no image.")} compact titleOrder={2} />}
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="md">
                <Group gap="sm" wrap="wrap">
                  <Badge variant="light">{t('gds.gdsPageTemplates.event.badge', "Event")}</Badge>
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

  const resolvedTitle = title || stateTitle(state, t);
  const resolvedDescription = description || stateDescription(state, t);
  return (
    <PageTemplateFrame id="error-page" state={state} title={resolvedTitle} description={resolvedDescription} actions={actions} {...props}>
      <StateBlock
        variant={state === 'permission-denied' ? 'permission' : 'error'}
        title={code ? `${code}: ${resolvedTitle}` : resolvedTitle}
        description={resolvedDescription}
        titleOrder={2}
        action={recovery ?? (onRetry ? <Button variant="light" onClick={onRetry}>{retryLabel}</Button> : undefined)}
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
