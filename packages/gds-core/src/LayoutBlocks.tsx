import type { ReactNode } from 'react';
import { Alert, Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ActionBar } from './ActionBar';
import { DataToolbar } from './DataToolbar';
import { GdsChart } from './GdsChart';
import { ListingCard } from './ListingCard';
import { SectionPanel } from './SectionPanel';
import { SimpleDataTable } from './SimpleDataTable';
import { StateBlock } from './StateBlock';

export type LayoutBlockType = 'hero' | 'stats' | 'cards-grid' | 'table' | 'chart' | 'filter' | 'cta' | 'footer';

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType | string;
  props: Record<string, unknown>;
}

export interface LayoutSchema {
  version: '1';
  blocks: LayoutBlock[];
}

export interface LayoutValidationIssue {
  blockId?: string;
  message: string;
}

export interface LayoutRenderResult {
  issues: LayoutValidationIssue[];
  node: ReactNode;
}

export type GdsBlockRenderer = (block: LayoutBlock) => ReactNode;

export interface GdsLayoutTemplate {
  id: string;
  title: string;
  description: string;
  useCase: string;
  schema: LayoutSchema;
}

const gdsLayoutTemplates: GdsLayoutTemplate[] = [
  {
    id: 'landing-feed',
    title: 'Landing Discovery Feed',
    description: 'Hero-first composition with compact stats, card list, CTA, and footer for quick discovery launches.',
    useCase: 'Public landing pages, campaign pages, and discovery entry points.',
    schema: {
      version: '1',
      blocks: [
        { id: 'hero', type: 'hero', props: { title: 'Discovery landing', description: 'Shipped layout contracts for product surfaces.' } },
        { id: 'stats', type: 'stats', props: { items: [{ label: 'Cards', value: '4' }, { label: 'Regions', value: '4' }, { label: 'Status', value: 'Live' }] } },
        { id: 'cards', type: 'cards-grid', props: { items: [{ title: 'Published listing', description: 'Canonical listing surface block.' }, { title: 'Saved item', description: 'Governed action and metadata placement.' }] } },
        { id: 'cta', type: 'cta', props: {} },
        { id: 'footer', type: 'footer', props: { text: 'Use this pattern for home and collection surfaces.' } },
      ],
    },
  },
  {
    id: 'operations-dashboard',
    title: 'Operations Dashboard',
    description: 'Filter, table, and chart contract for operational and data-heavy admin pages.',
    useCase: 'Operational dashboards, admin review pages, and analytics summary pages.',
    schema: {
      version: '1',
      blocks: [
        { id: 'hero', type: 'hero', props: { title: 'Operations Dashboard', description: 'A layout schema that keeps discovery, filter, and reporting in one rhythm.' } },
        { id: 'filter', type: 'filter', props: { searchLabel: 'Search records', filterLabel: 'Open filters', sortLabel: 'Sort by urgency' } },
        {
          id: 'table',
          type: 'table',
          props: {
            columns: [
              { key: 'name', header: 'Name' },
              { key: 'status', header: 'Status' },
              { key: 'owner', header: 'Owner' },
            ],
            rows: [
              { name: 'Import policy', status: 'Active', owner: 'Ops' },
              { name: 'Theme lane', status: 'Pending', owner: 'Design' },
            ],
          },
        },
        {
          id: 'chart',
          type: 'chart',
          props: {
            chartType: 'bar',
            title: 'Weekly adoption trend',
            summary: 'Governed chart contract for operations dashboards.',
            data: [
              { label: 'Mon', value: 12 },
              { label: 'Tue', value: 8 },
              { label: 'Wed', value: 14 },
              { label: 'Thu', value: 20 },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'detail-listing',
    title: 'Detail Listing Stack',
    description: 'Cards, table fallback, and footer for detail-oriented product and admin page sections.',
    useCase: 'Entity detail screens, resource managers, and admin detail pages.',
    schema: {
      version: '1',
      blocks: [
        { id: 'hero', type: 'hero', props: { title: 'Entity detail surface', description: 'Reusable detail-screen rhythm for product entities.' } },
        { id: 'cards', type: 'cards-grid', props: { items: [{ title: 'Overview', description: 'Governed section card.' }, { title: 'Actions', description: 'CTA and reference actions.' }, { title: 'Status', description: 'Operational status with standard emphasis.' }] } },
        {
          id: 'table',
          type: 'table',
          props: {
            columns: [{ key: 'metric', header: 'Metric' }, { key: 'value', header: 'Value' }],
            rows: [{ metric: 'Response time', value: '120ms' }, { metric: 'Error rate', value: '0.4%' }],
          },
        },
        { id: 'footer', type: 'footer', props: { text: 'Use this for long-form entity and admin detail blocks.' } },
      ],
    },
  },
  {
    id: 'diagnostic-invalid',
    title: 'Validation Failure Example',
    description: 'Intentionally malformed contract used to test diagnostics and invalid-block behavior.',
    useCase: 'Developer validation and diagnostics training.',
    schema: {
      version: '1',
      blocks: [
        {
          id: 'bad-type',
          type: 'ghost',
          props: { message: 'Unsupported block type to validate diagnostics output.' },
        },
      ],
    },
  },
];

function cloneLayoutTemplate(template: GdsLayoutTemplate): GdsLayoutTemplate {
  return JSON.parse(JSON.stringify(template)) as GdsLayoutTemplate;
}

export function getGdsLayoutTemplates(): GdsLayoutTemplate[] {
  return gdsLayoutTemplates.map(cloneLayoutTemplate);
}

export function getGdsLayoutTemplate(id: string): GdsLayoutTemplate | undefined {
  const template = gdsLayoutTemplates.find((entry) => entry.id === id);
  return template ? cloneLayoutTemplate(template) : undefined;
}

const blockRegistry = new Map<string, GdsBlockRenderer>();

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

function hasUnsafeString(value: unknown): boolean {
  if (typeof value === 'string') {
    return /<\s*script|javascript:/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasUnsafeString);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(hasUnsafeString);
  }

  return false;
}

function renderHeroBlock(block: LayoutBlock) {
  return (
    <SectionPanel title={asString(block.props.title, 'Hero')} description={asString(block.props.description, 'Hero block')}>
      <Text>{asString(block.props.body, 'Composable hero content')}</Text>
    </SectionPanel>
  );
}

function renderStatsBlock(block: LayoutBlock) {
  const items = asRecordArray(block.props.items);

  if (!items.length) {
    return <StateBlock variant="empty" title="No stats configured" description="Add stat items to this layout block." compact />;
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }}>
      {items.map((item) => (
        <Card key={`${block.id}-${asString(item.label, 'Metric')}`} withBorder>
          <Stack gap={2}>
            <Text size="sm" c="dimmed">{asString(item.label, 'Metric')}</Text>
            <Title order={4}>{asString(item.value, '-')}</Title>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}

function renderCardsGridBlock(block: LayoutBlock) {
  const items = asRecordArray(block.props.items);

  if (!items.length) {
    return <StateBlock variant="empty" title="No cards configured" description="Add card items to this layout block." compact />;
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      {items.map((item) => (
        <ListingCard
          key={`${block.id}-${asString(item.title, 'Card')}`}
          title={asString(item.title, 'Card')}
          description={typeof item.description === 'string' ? item.description : undefined}
          size="sm"
        />
      ))}
    </SimpleGrid>
  );
}

function renderTableBlock(block: LayoutBlock) {
  const rows = asRecordArray(block.props.rows);
  const columns = asRecordArray(block.props.columns)
    .map((column) => ({ key: asString(column.key, 'name'), header: asString(column.header, 'Name') }));

  return (
    <SimpleDataTable
      columns={columns.length ? columns : [{ key: 'name', header: 'Name' }]}
      rows={rows.length ? rows : [{ name: 'No rows configured' }]}
    />
  );
}

function renderChartBlock(block: LayoutBlock) {
  return (
    <GdsChart
      type={(block.props.chartType as any) ?? 'bar'}
      title={asString(block.props.title, 'Chart block')}
      summary={asString(block.props.summary, 'Block-composed chart summary')}
      data={(asRecordArray(block.props.data).map((item) => ({
        label: asString(item.label, 'Point'),
        value: typeof item.value === 'number' ? item.value : 0,
        secondaryValue: typeof item.secondaryValue === 'number' ? item.secondaryValue : undefined,
        group: typeof item.group === 'string' ? item.group : undefined,
      })))}
    />
  );
}

function renderFilterBlock(block: LayoutBlock) {
  return (
    <DataToolbar
      searchSlot={<Text size="sm">{asString(block.props.searchLabel, 'Search is configured by the consuming app.')}</Text>}
      filterSlot={<Text size="sm">{asString(block.props.filterLabel, 'Filters remain governed by DataToolbar.')}</Text>}
      sortSlot={<Text size="sm">{asString(block.props.sortLabel, 'Sort slot')}</Text>}
    />
  );
}

function renderCtaBlock() {
  return (
    <ActionBar
      primary={{ action: 'save' }}
      secondary={[{ action: 'cancel' }]}
      tertiary={[{ action: 'preview' }]}
    />
  );
}

function renderFooterBlock(block: LayoutBlock) {
  return <Text size="sm" c="dimmed">{asString(block.props.text, 'Footer block')}</Text>;
}

const defaultRenderers: Record<LayoutBlockType, GdsBlockRenderer> = {
  hero: renderHeroBlock,
  stats: renderStatsBlock,
  'cards-grid': renderCardsGridBlock,
  table: renderTableBlock,
  chart: renderChartBlock,
  filter: renderFilterBlock,
  cta: renderCtaBlock,
  footer: renderFooterBlock,
};

for (const [type, renderer] of Object.entries(defaultRenderers)) {
  blockRegistry.set(type, renderer);
}

export function registerGdsBlock(type: string, renderer: GdsBlockRenderer) {
  if (!type.trim()) {
    throw new Error('GDS layout block type must be a non-empty string.');
  }

  blockRegistry.set(type, renderer);
}

export function getGdsBlockTypes() {
  return [...blockRegistry.keys()];
}

export function validateGdsLayout(schema: LayoutSchema): LayoutValidationIssue[] {
  const issues: LayoutValidationIssue[] = [];

  if (schema.version !== '1') {
    issues.push({ message: `Unsupported layout schema version "${String(schema.version)}".` });
  }

  if (!Array.isArray(schema.blocks) || schema.blocks.length === 0) {
    issues.push({ message: 'Layout schema must include at least one block.' });
    return issues;
  }

  for (const block of schema.blocks) {
    if (!block.id || typeof block.id !== 'string') {
      issues.push({ message: 'Every layout block must include a stable string id.' });
    }

    if (!block.type || typeof block.type !== 'string') {
      issues.push({ blockId: block.id, message: 'Every layout block must include a string type.' });
    } else if (!blockRegistry.has(block.type)) {
      issues.push({ blockId: block.id, message: `Unsupported layout block type "${block.type}".` });
    }

    if (!block.props || typeof block.props !== 'object' || Array.isArray(block.props)) {
      issues.push({ blockId: block.id, message: 'Layout block props must be a JSON object.' });
    } else if (hasUnsafeString(block.props)) {
      issues.push({ blockId: block.id, message: 'Layout block props may not include script or javascript URL content.' });
    }
  }

  return issues;
}

function renderBlock(block: LayoutBlock) {
  const renderer = blockRegistry.get(block.type);

  if (!renderer) {
    return <Alert color="red">Unsupported block type: {block.type}</Alert>;
  }

  return renderer(block);
}

export function renderGdsLayout(schema: LayoutSchema) {
  const issues = validateGdsLayout(schema);

  if (issues.length && !schema.blocks.length) {
    return <StateBlock variant="error" title="Invalid layout schema" description={issues.map((issue) => issue.message).join(' ')} compact />;
  }

  return (
    <Stack gap="lg">
      {issues.length ? (
        <Alert color="red" title="Layout diagnostics">
          <Stack gap={4}>
            {issues.map((issue, index) => (
              <Text key={`${issue.blockId ?? 'schema'}-${index}`} size="sm">
                {issue.blockId ? `${issue.blockId}: ` : null}{issue.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      ) : null}
      {schema.blocks.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </Stack>
  );
}

export function renderGdsLayoutWithDiagnostics(schema: LayoutSchema): LayoutRenderResult {
  return {
    issues: validateGdsLayout(schema),
    node: renderGdsLayout(schema),
  };
}
