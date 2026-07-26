import { Badge, Card, Group, List, Stack, Text, Title } from '@mantine/core';

/** Lifecycle status of a design-to-code mapping. */
export type GdsHandoffStatus = 'approved' | 'experimental' | 'deprecated' | 'missing-mapping' | 'stale-mapping';

/** One documented prop in a design-handoff component map, including its matching Figma control. */
export interface GdsPropAnnotation {
  prop: string;
  type: string;
  description: string;
  required: boolean;
  figmaControl?: string;
}

/** Maps a code component to its Figma component, with props, annotations, token links, and handoff/recovery notes. */
export interface GdsDesignComponentMap {
  id: string;
  packageName: '@sovereignsquad/gds-core' | '@sovereignsquad/gds-theme' | '@sovereignsquad/gds-admin';
  exportName: string;
  figmaComponent: string;
  status: GdsHandoffStatus;
  componentContracts: string[];
  props: GdsPropAnnotation[];
  annotations: {
    labels: string[];
    focusBehavior: string;
    stateSemantics: string[];
    accessibility: string[];
  };
  tokenLinks: string[];
  handoffNotes: string[];
  recovery: string;
}

/** Maps a code design token to its Figma variable, the mode it applies to, and its usage. */
export interface GdsDesignTokenMap {
  id: string;
  token: string;
  figmaVariable: string;
  status: GdsHandoffStatus;
  mode: 'light' | 'dark' | 'forced-colors' | 'all';
  usage: string;
}

/** Generated report pairing component and token mappings with status counts and stale/missing/approved rollups. */
export interface GdsDesignHandoffReport {
  generatedAt: string;
  components: GdsDesignComponentMap[];
  tokens: GdsDesignTokenMap[];
  counts: Record<GdsHandoffStatus, number>;
  staleMappings: string[];
  missingMappings: string[];
  approvedComponents: string[];
}

const componentMappings: GdsDesignComponentMap[] = [
  {
    id: 'semantic-button',
    packageName: '@sovereignsquad/gds-core',
    exportName: 'SemanticButton',
    figmaComponent: 'GDS / Actions / Semantic Button',
    status: 'approved',
    componentContracts: ['SemanticButton', 'ActionBar', 'GdsIcon'],
    props: [
      { prop: 'action', type: 'GdsSemanticAction', description: 'Semantic action key that controls label and intent.', required: true, figmaControl: 'Action variant' },
      { prop: 'children', type: 'ReactNode', description: 'Optional override for visible label.', required: false, figmaControl: 'Label override' },
    ],
    annotations: {
      labels: ['Visible label required', 'Icon-only mode requires accessible label'],
      focusBehavior: 'Visible focus ring must remain on the actionable button element.',
      stateSemantics: ['disabled', 'loading', 'pressed when applicable'],
      accessibility: ['Name, role, value exposed', 'Activation works with Enter and Space'],
    },
    tokenLinks: ['radius.md', 'spacing.md', 'color.action.primary'],
    handoffNotes: ['Use for known semantic actions instead of free-form button styling.'],
    recovery: 'If Figma variants drift, use package props as the source of truth and mark the Figma component stale.',
  },
  {
    id: 'page-header',
    packageName: '@sovereignsquad/gds-core',
    exportName: 'PageHeader',
    figmaComponent: 'GDS / Layout / Page Header',
    status: 'approved',
    componentContracts: ['PageHeader', 'GdsStack', 'GdsInline'],
    props: [
      { prop: 'title', type: 'string', description: 'Single page heading.', required: true, figmaControl: 'Title text' },
      { prop: 'description', type: 'string', description: 'Optional supporting copy.', required: false, figmaControl: 'Description text' },
      { prop: 'actions', type: 'ReactNode', description: 'Governed action slot.', required: false, figmaControl: 'Action slot' },
    ],
    annotations: {
      labels: ['One h1 per page', 'Actions keep visible labels'],
      focusBehavior: 'Header actions follow DOM order after title and description.',
      stateSemantics: ['long localized titles wrap before actions overflow'],
      accessibility: ['Heading hierarchy is preserved', 'Actions are keyboard reachable'],
    },
    tokenLinks: ['spacing.lg', 'font.heading', 'color.text'],
    handoffNotes: ['Use this for docs, admin, and public page headers before inventing route-local headers.'],
    recovery: 'If action placement cannot fit, migrate to GDS responsive action layout instead of local CSS.',
  },
  {
    id: 'data-table',
    packageName: '@sovereignsquad/gds-core',
    exportName: 'GdsDataTable',
    figmaComponent: 'GDS / Data / Governed Data Table',
    status: 'approved',
    componentContracts: ['GdsDataTable', 'useGdsDataTable', 'DataToolbar'],
    props: [
      { prop: 'columns', type: 'GdsDataTableColumn[]', description: 'Typed column contracts with headers and rendering.', required: true, figmaControl: 'Column set' },
      { prop: 'adapter', type: 'GdsDataTableAdapter', description: 'Consumer-owned data adapter.', required: true, figmaControl: 'Data source annotation' },
      { prop: 'state', type: 'loading | empty | error | ready', description: 'Visible data state.', required: false, figmaControl: 'State variant' },
    ],
    annotations: {
      labels: ['Column headers are visible', 'Bulk actions name selected count'],
      focusBehavior: 'Sortable headers and row controls are reachable in table order.',
      stateSemantics: ['loading', 'empty', 'error', 'retrying', 'selected'],
      accessibility: ['aria-sort on sortable columns', 'Selection checkboxes have names'],
    },
    tokenLinks: ['spacing.sm', 'color.border', 'color.surface'],
    handoffNotes: ['Designs must include mobile/card fallback and empty/error states.'],
    recovery: 'If a design omits data states, mark mapping stale until states are annotated.',
  },
  {
    id: 'resource-manager',
    packageName: '@sovereignsquad/gds-core',
    exportName: 'GdsResourceManager',
    figmaComponent: 'GDS / Workflows / Resource Manager',
    status: 'experimental',
    componentContracts: ['GdsResourceManager', 'GdsDataTable', 'GdsConfirmProvider'],
    props: [
      { prop: 'adapter', type: 'GdsResourceAdapter', description: 'Consumer-owned resource actions.', required: true, figmaControl: 'Adapter annotation' },
      { prop: 'permissions', type: 'GdsResourcePermissionMap', description: 'Permission boundaries for actions.', required: false, figmaControl: 'Permission variant' },
    ],
    annotations: {
      labels: ['Create, edit, delete, archive, and preview actions must be named'],
      focusBehavior: 'Detail surfaces return focus to the invoking row/action.',
      stateSemantics: ['permission denied', 'not found', 'stale detail', 'destructive pending'],
      accessibility: ['Destructive flows require confirmation', 'Permission state is text-visible'],
    },
    tokenLinks: ['spacing.lg', 'color.surface', 'radius.lg'],
    handoffNotes: ['Use when a Figma flow shows list/detail/action behavior, not for static cards.'],
    recovery: 'Keep consumer routes on bespoke manager until adapter state annotations are complete.',
  },
  {
    id: 'theme-preset',
    packageName: '@sovereignsquad/gds-theme',
    exportName: 'gdsTheme',
    figmaComponent: 'GDS / Tokens / Theme Preset',
    status: 'approved',
    componentContracts: ['GdsProvider', 'gdsTheme', 'createGdsThemeCompatibilityReport'],
    props: [
      { prop: 'defaultColorScheme', type: 'light | dark | auto', description: 'Color-scheme runtime policy.', required: false, figmaControl: 'Mode' },
    ],
    annotations: {
      labels: ['Mode-specific token names must map to code tokens'],
      focusBehavior: 'Focus token remains visible in light, dark, and forced-colors modes.',
      stateSemantics: ['light', 'dark', 'forced-colors'],
      accessibility: ['Contrast pairs must pass theme accessibility report'],
    },
    tokenLinks: ['color.body', 'color.text', 'color.focus', 'color.border'],
    handoffNotes: ['Figma variables must reference GDS token names, not route-local colors.'],
    recovery: 'If token sync is unavailable, keep code tokens authoritative and mark variable sync stale.',
  },
];

const tokenMappings: GdsDesignTokenMap[] = [
  { id: 'body-background', token: 'color.body', figmaVariable: 'GDS/color/body', status: 'approved', mode: 'all', usage: 'Page and surface background.' },
  { id: 'text-primary', token: 'color.text', figmaVariable: 'GDS/color/text', status: 'approved', mode: 'all', usage: 'Primary readable text.' },
  { id: 'focus-ring', token: 'color.focus', figmaVariable: 'GDS/color/focus', status: 'approved', mode: 'forced-colors', usage: 'Visible focus indication.' },
  { id: 'surface-border', token: 'color.border', figmaVariable: 'GDS/color/border', status: 'approved', mode: 'all', usage: 'Card, table, and input borders.' },
  { id: 'legacy-purple-gradient', token: 'legacy.gradient.purple', figmaVariable: 'Legacy/gradient/purple', status: 'deprecated', mode: 'all', usage: 'Deprecated decorative gradient; replace with approved theme lanes.' },
];

function cloneComponent(component: GdsDesignComponentMap): GdsDesignComponentMap {
  return {
    ...component,
    componentContracts: [...component.componentContracts],
    props: component.props.map((prop) => ({ ...prop })),
    annotations: {
      labels: [...component.annotations.labels],
      focusBehavior: component.annotations.focusBehavior,
      stateSemantics: [...component.annotations.stateSemantics],
      accessibility: [...component.annotations.accessibility],
    },
    tokenLinks: [...component.tokenLinks],
    handoffNotes: [...component.handoffNotes],
  };
}

/** Returns deep clones of every design-handoff component mapping. */
export function getGdsDesignComponentMappings() {
  return componentMappings.map(cloneComponent);
}

/** Returns copies of every design-handoff token mapping. */
export function getGdsDesignTokenMappings() {
  return tokenMappings.map((token) => ({ ...token }));
}

/** Validates the component and token mappings for duplicate ids and missing required annotations, returning failure messages. */
export function validateGdsDesignHandoffMappings(components: GdsDesignComponentMap[] = componentMappings, tokens: GdsDesignTokenMap[] = tokenMappings) {
  const failures: string[] = [];
  const componentIds = new Set<string>();
  const tokenIds = new Set<string>();
  for (const component of components) {
    if (componentIds.has(component.id)) failures.push(`Duplicate design component mapping id: ${component.id}`);
    componentIds.add(component.id);
    if (!component.figmaComponent) failures.push(`${component.id} must define a Figma component path.`);
    if (!component.componentContracts.length) failures.push(`${component.id} must map code component contracts.`);
    if (!component.props.length) failures.push(`${component.id} must document props.`);
    if (!component.annotations.labels.length) failures.push(`${component.id} must document label requirements.`);
    if (!component.annotations.focusBehavior) failures.push(`${component.id} must document focus behavior.`);
    if (!component.annotations.stateSemantics.length) failures.push(`${component.id} must document state semantics.`);
    if (!component.annotations.accessibility.length) failures.push(`${component.id} must document accessibility annotations.`);
    if (!component.recovery) failures.push(`${component.id} must document recovery behavior.`);
  }
  for (const token of tokens) {
    if (tokenIds.has(token.id)) failures.push(`Duplicate design token mapping id: ${token.id}`);
    tokenIds.add(token.id);
    if (!token.token || !token.figmaVariable) failures.push(`${token.id} must map a code token and Figma variable.`);
    if (token.status === 'deprecated' && !token.usage.toLowerCase().includes('deprecated')) {
      failures.push(`${token.id} deprecated token mapping must explain replacement usage.`);
    }
  }
  return failures;
}

/** Builds a {@link GdsDesignHandoffReport} from the current mappings, tallying status counts and stale/missing/approved lists. */
export function generateGdsDesignHandoffReport(generatedAt = 'static') {
  const components = getGdsDesignComponentMappings();
  const tokens = getGdsDesignTokenMappings();
  const counts: Record<GdsHandoffStatus, number> = {
    approved: 0,
    experimental: 0,
    deprecated: 0,
    'missing-mapping': 0,
    'stale-mapping': 0,
  };
  for (const item of [...components, ...tokens]) {
    counts[item.status] += 1;
  }
  return {
    generatedAt,
    components,
    tokens,
    counts,
    staleMappings: components.filter((item) => item.status === 'stale-mapping').map((item) => item.id),
    missingMappings: components.filter((item) => item.status === 'missing-mapping').map((item) => item.id),
    approvedComponents: components.filter((item) => item.status === 'approved').map((item) => item.exportName),
  } satisfies GdsDesignHandoffReport;
}

/** Renders the design-handoff report as cards, one per component mapping with its contracts, props, focus behavior, and recovery notes. */
export function GdsDesignHandoffCatalog() {
  const report = generateGdsDesignHandoffReport();
  return (
    <Stack gap="md">
      {report.components.map((component) => (
        <Card key={component.id} withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Group justify="space-between" gap="sm" wrap="wrap">
              <Title order={3}>{component.exportName}</Title>
              <Badge variant="light">{component.status}</Badge>
            </Group>
            <Text c="dimmed">{component.figmaComponent}</Text>
            <List size="sm">
              <List.Item>Contracts: {component.componentContracts.join(', ')}</List.Item>
              <List.Item>Props: {component.props.map((prop) => prop.prop).join(', ')}</List.Item>
              <List.Item>Focus: {component.annotations.focusBehavior}</List.Item>
              <List.Item>Recovery: {component.recovery}</List.Item>
            </List>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
