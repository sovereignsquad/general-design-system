import { useMemo, useState } from 'react';
import {
  type LayoutSchema,
  AccessSummary,
  ActionBar,
  AuthShell,
  ConsumerDashboardGrid,
  DetailProfileShell,
  DiscoveryShell,
  DocsPageShell,
  FeatureBand,
  FoodMenuSection,
  GdsChart,
  ListingCard,
  MapPanel,
  MediaCard,
  MetricCard,
  PlaybackSurface,
  ProgressCard,
  PublicFlowShell,
  PublicFoodCard,
  ReferenceLinkGrid,
  ReferenceSection,
  SectionPanel,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  StateBlock,
  ProviderIdentityButtonGroup,
  StatsSection,
  renderGdsLayoutWithDiagnostics,
} from '@doneisbetter/gds-core';
import { DataTable, PageHeader, ResponsiveDataView } from '@doneisbetter/gds-admin';
import { patternRegistry } from './pattern-registry';

const catalogEntryCount = patternRegistry.length;

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  schema: LayoutSchema;
}

const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'landing-feed',
    name: 'Landing Discovery Feed',
    description: 'Hero-first composition with compact stats, card list, CTA, and footer for quick discovery launches.',
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
    name: 'Operations Dashboard',
    description: 'Filter + table + chart contract for operational and data-heavy admin pages.',
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
    name: 'Detail Listing Stack',
    description: 'Cards + table fallback + footer for detail-oriented detail and admin page sections.',
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
    name: 'Validation Failure Example',
    description: 'Intentionally malformed contract used to test diagnostics and invalid-block behavior.',
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

function layoutTemplateText(template: LayoutTemplate) {
  return JSON.stringify(template.schema, null, 2);
}

function DemoFooter() {
  return (
    <p>
      Need something missing? <a href="mailto:moldovancsaba+general.design.system@gmail.com">Request a feature</a>.
    </p>
  );
}

export function LiveDemosPage() {
  return (
    <DocsPageShell
      title="Live Demos"
      eyebrow="Official runtime proof"
      lead="This section is the public runtime showcase for shipped GDS surfaces. Use it to inspect real compositions and interaction contracts before building locally."
    >
      <ReferenceSection
        title="Open a live demo family"
        description="The demos are separated by purpose so visitors can inspect the exact runtime lane they care about."
      >
        <ReferenceLinkGrid
          items={[
            {
              id: 'surfaces',
              title: 'Discovery & Cards',
              description: 'Listing, media, map, menu, and share surfaces for public and discovery-heavy products.',
              href: '/general-design-system/live-demos/surfaces',
            },
            {
              id: 'layouts',
              title: 'Shells & Layouts',
              description: 'DiscoveryShell, detail shells, and bounded public flows with governed layout rhythm.',
              href: '/general-design-system/live-demos/layouts',
            },
            {
              id: 'semantics',
              title: 'Actions & Auth',
              description: 'Semantic actions, social auth, share buttons, and governed interaction states.',
              href: '/general-design-system/live-demos/semantics',
            },
            {
              id: 'food',
              title: 'Food & Menus',
              description: 'Public food and menu contracts with availability, helper states, and grouped item behavior.',
              href: '/general-design-system/live-demos/food',
            },
            {
              id: 'playback',
              title: 'Playback & Capture',
              description: 'Playback surfaces and controlled capture/review flows without introducing app-local hardware UI.',
              href: '/general-design-system/live-demos/playback',
            },
            {
              id: 'analytics',
              title: 'Analytics & Data',
              description: 'Metrics, data views, and operational summaries for analytics-oriented workflows.',
              href: '/general-design-system/live-demos/analytics',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection
        title="How to read these demos"
        description="These are live examples built from shipped GDS packages. They are not mock marketing art and they are not local component sandboxes."
      >
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'shipped',
              title: 'Shipped contracts only',
              description: 'The live demo routes should show the actual primitives we publish, not custom website-only replacements.',
            },
            {
              id: 'bounded',
              title: 'Bounded previews',
              description: 'Contained examples are preferred over fake nested websites so the docs stay readable and honest.',
            },
            {
              id: 'migration',
              title: 'Migration target',
              description: 'Each demo is also a migration target for teams currently using local wrappers and bespoke UI.',
            },
          ]}
        />
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}

export function CardsPage() {
  return (
    <DocsPageShell
      title="Discovery & Cards"
      eyebrow="Live demo family"
      lead="Public discovery surfaces should converge on shared cards, menus, map containment, and governed share affordances."
    >
      <ReferenceSection
        title="Unified listing card"
        description="Use one configurable listing-card contract instead of proliferating event, venue, and community cards."
      >
        <ListingCard
          title="Danube Sunset Run"
          description="A public discovery card with featured treatment, governed metadata rows, and clear save/share affordances."
          featured
          sponsoredDisclosure="Sponsored placement. Selection criteria belong to the host product."
          price="Free"
          metadata={[
            { id: 'date', label: 'Date', value: 'June 14' },
            { id: 'time', label: 'Time', value: '18:30' },
            { id: 'location', label: 'Location', value: 'Margaret Island' },
          ]}
          saveAction={{ action: 'save' }}
          shareAction={{ action: 'refer' }}
          primaryAction={<a href="/general-design-system/live-demos/surfaces">Open listing</a>}
        />
      </ReferenceSection>

      <ReferenceSection title="Food surfaces" description="Food and menu contracts are first-class public surfaces, not downstream product exceptions.">
        <PublicFoodCard
          title="Smoked paprika chicken bowl"
          description="Canonical public food card with availability state, helper copy, and one clear primary action."
          state="preorder"
          price="€12.50"
          helperText="Pickup window closes at 18:00."
          pickupNote="Today, 17:15-18:00"
          freshnessNote="Prepared in small daily batches"
          markers={[
            { id: 'featured', label: 'Featured', tone: 'positive' },
            { id: 'hot', label: 'Limited batch', tone: 'warning' },
          ]}
          primaryAction={<a href="/general-design-system/live-demos/surfaces">Reserve pickup</a>}
        />
        <FoodMenuSection
          title="Weekly menu"
          description="Grouped menu categories with consistent category rhythm and per-item affordances."
          categories={[
            {
              id: 'lunch',
              title: 'Lunch',
              description: 'Fast pickup dishes for midday orders.',
              items: [
                {
                  id: 'dish-1',
                  title: 'Smoked paprika chicken bowl',
                  state: 'available',
                  price: '€12.50',
                  description: 'Roasted vegetables, herbed rice, and citrus yogurt.',
                  primaryAction: <a href="/general-design-system/live-demos/surfaces">Add to order</a>,
                },
                {
                  id: 'dish-2',
                  title: 'Green falafel plate',
                  state: 'limited',
                  price: '€10.90',
                  description: 'Tahini slaw, pickled onions, and flatbread.',
                  primaryAction: <a href="/general-design-system/live-demos/surfaces">Add to order</a>,
                },
              ],
            },
          ]}
        />
      </ReferenceSection>

        <ReferenceSection title="Map and media containment" description="Embeds and media should render inside the sanctioned GDS containment surfaces.">
        <MapPanel
          title="Meetup route map"
          description="MapPanel keeps third-party embeds inside shared header chrome, loading, and failure behavior."
          empty="No coordinates published yet."
        />
        <MediaCard
          title="Public media card"
          description="Media-led discovery surface for stories, bundles, guides, and catalog promotions."
          status="Published"
          image={<div />}
        />
      </ReferenceSection>

        <ReferenceSection title="Governed sharing" description="Sharing should use the canonical share-button group instead of local icon clusters.">
        <ShareButtonGroup
          url="https://sovereignsquad.github.io/general-design-system/live-demos/surfaces"
          title="General Design System live demos"
          text="Inspect the shipped discovery and card surfaces."
          channels={['copy', 'mail', 'linkedin', 'whatsapp']}
        />
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}

export function FoodMenuPage() {
  return (
    <DocsPageShell
      title="Food & Menu"
      eyebrow="Live demo family"
      lead="Food and menu contracts are first-class discovery surfaces. They should follow the same card, helper, and action rules as any other canonical listing."
    >
      <ReferenceSection
        title="Food cards"
        description="Use the shared PublicFoodCard for menu items with clear availability and helper cues."
      >
        <PublicFoodCard
          title="Smoked paprika chicken bowl"
          description="Balanced, protein-forward dish with transparent prep and pickup expectations."
          state="preorder"
          price="€12.50"
          helperText="Pickup is available today after 17:15."
          pickupNote="17:15-18:00"
          freshnessNote="Made fresh in small batches."
          markers={[
            { id: 'featured', label: 'Featured', tone: 'positive' },
            { id: 'hot', label: 'Limited batch', tone: 'warning' },
          ]}
          primaryAction={<a href="/general-design-system/live-demos/food">Reserve pickup</a>}
        />
      </ReferenceSection>
      <ReferenceSection
        title="Category menus"
        description="FoodMenuSection keeps grouped discovery menus stable in spacing, card rhythm, and CTA placement."
      >
        <FoodMenuSection
          title="Weekly menu"
          description="Grouped menu categories with consistent action and disclosure behavior."
          categories={[
            {
              id: 'lunch',
              title: 'Lunch',
              description: 'Fast pickup dishes for midday orders.',
              items: [
                {
                  id: 'dish-1',
                  title: 'Smoked paprika chicken bowl',
                  state: 'available',
                  price: '€12.50',
                  description: 'Roasted vegetables, herbed rice, and citrus yogurt.',
                  primaryAction: <a href="/general-design-system/live-demos/food">Add to order</a>,
                },
                {
                  id: 'dish-2',
                  title: 'Green falafel plate',
                  state: 'limited',
                  price: '€10.90',
                  description: 'Tahini slaw, pickled onions, and flatbread.',
                  primaryAction: <a href="/general-design-system/live-demos/food">Add to order</a>,
                },
              ],
            },
          ]}
        />
      </ReferenceSection>
      <DemoFooter />
    </DocsPageShell>
  );
}

export function LayoutsPage() {
  const initialTemplate = layoutTemplates[0]!;
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate.id);
  const [schemaText, setSchemaText] = useState(layoutTemplateText(initialTemplate));
  const [appliedSchemaText, setAppliedSchemaText] = useState(layoutTemplateText(initialTemplate));
  const [editorError, setEditorError] = useState('');

  const renderedTemplate = useMemo(() => {
    try {
      const parsed = JSON.parse(appliedSchemaText) as LayoutSchema;
      return renderGdsLayoutWithDiagnostics(parsed);
    } catch {
      return {
        issues: [{ blockId: 'schema', message: 'Unable to parse schema JSON. Make sure the payload is valid JSON.' }],
        node: (
          <StateBlock
            variant="error"
            title="Schema parser error"
            description="The current editor JSON is not valid. Fix the braces, quotes, and commas before applying."
          />
        ),
      };
    }
  }, [appliedSchemaText]);
  const canCopySchema = typeof window !== 'undefined' && Boolean(navigator?.clipboard);
  const issueCount = renderedTemplate.issues.length;

  const applySchema = () => {
    try {
      JSON.parse(schemaText);
      setAppliedSchemaText(schemaText);
      setEditorError('');
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  const handleTemplateChange = (nextTemplateId: string) => {
    setSelectedTemplateId(nextTemplateId);
    const nextTemplate = layoutTemplates.find((template) => template.id === nextTemplateId);

    if (!nextTemplate) {
      return;
    }

    const nextText = layoutTemplateText(nextTemplate);
    setSchemaText(nextText);
    setAppliedSchemaText(nextText);
    setEditorError('');
  };

  const copySchema = async () => {
    if (!canCopySchema) {
      return;
    }

    await navigator.clipboard.writeText(appliedSchemaText);
  };

  const selectedTemplate = layoutTemplates.find((entry) => entry.id === selectedTemplateId);

  return (
    <DocsPageShell
      title="Shells & Layouts"
      eyebrow="Live demo family"
      lead="Application shells, detail shells, and staged public flows should converge on shared structure instead of page-local layout contracts."
    >
      <ReferenceSection
        title="Discovery shell"
        description="Sidebar-first applications should use the canonical shell with governed sidebar IA and semantic actions."
      >
        <DiscoveryShell
          header={(
            <PageHeader
              title="Catalog Operations"
              description="Governed sidebar-first shell"
              primaryAction={<SemanticButton action="save" size="sm" />}
            />
          )}
          sidebar={(
            <SidebarNav ariaLabel="Catalog navigation">
              <SidebarNavSection label="Primary">
                <SidebarNavItem action="dashboard" href="/general-design-system/live-demos/layouts" active />
                <SidebarNavItem action="calendar" href="/general-design-system/patterns/foundations" />
                <SidebarNavItem action="analytics" href="/general-design-system/live-demos/analytics" />
              </SidebarNavSection>
              <SidebarNavSection label="Account" pushToBottom>
                <SidebarNavItem action="settings" href="/general-design-system/governance" />
                <SidebarNavItem action="logout" component="button" />
              </SidebarNavSection>
            </SidebarNav>
          )}
        >
          <SectionPanel
            title="Contained desktop preview"
            description="This is a real DiscoveryShell contract shown inside a bounded preview rather than a fake nested website."
          >
            <ActionBar
              primary={{ action: 'save', size: 'sm' }}
              secondary={[{ action: 'cancel', size: 'sm' }]}
              tertiary={[{ action: 'preview', size: 'sm' }]}
            />
          </SectionPanel>
        </DiscoveryShell>
      </ReferenceSection>

      <ReferenceSection
        title="Detail profile shell"
        description="Drawer and page detail experiences should share one consistent hero, section stack, and related-items rhythm."
      >
        <DetailProfileShell
          hero={<PageHeader title="Universal SSO" description="OAuth/OIDC provider rollout detail surface" />}
          actions={<ActionBar primary={{ action: 'edit', size: 'sm' }} secondary={[{ action: 'refer', size: 'sm' }]} />}
          sections={[
            <SectionPanel key="overview" title="Overview" description="Shared detail-shell content blocks.">
              <p>Use the same detail contract across page and drawer modes instead of growing product-local profile panels.</p>
            </SectionPanel>,
            <AccessSummary
              key="access"
              title="Access summary"
              roles={['platform-ui', 'maintainers']}
              scope="Public adopters"
              description="The detail shell can mix profile sections with access/readiness information without inventing a second layout contract."
            />,
          ]}
        />
      </ReferenceSection>

      <ReferenceSection
        title="Bounded public flows"
        description="Hardware-adjacent or staged public flows should stay inside the sanctioned public-flow shell."
      >
        <PublicFlowShell
          eyebrow="Capture flow"
          stage={{
            id: 'capture-ready',
            title: 'Review your capture setup',
            description: 'The flow contract governs stage status, actions, and bounded hardware surfaces.',
            status: 'ready',
            body: (
              <SectionPanel title="Before you continue" description="This is where a staged flow explains the next irreversible step.">
                <p>Confirm lighting, permissions, and the intended upload destination before opening a hardware-adjacent step.</p>
              </SectionPanel>
            ),
            actions: [
              { action: 'start', priority: 'primary' },
              { action: 'cancel', priority: 'secondary' },
            ],
          }}
        />
      </ReferenceSection>

      <ReferenceSection
        title="Playback surface"
        description="Video and timed-media playback should render through the canonical playback contract."
      >
        <PlaybackSurface
          title="Product walkthrough"
          state="ready"
          statusMessage="Accessible playback surface with bounded description and media containment."
          media={<div />}
        />
      </ReferenceSection>

      <ReferenceSection
        title="Block-based layout schema"
        description="Developers can compose pages from governed blocks using the shared schema renderer."
      >
        <SectionPanel title="Template cookbook" description="Pick a template, edit JSON, then apply to preview live diagnostics and rendered layout.">
          <label htmlFor="layout-template-select">
            Template preset
            <select
              id="layout-template-select"
              aria-label="Template preset"
              value={selectedTemplateId}
              onChange={(event) => handleTemplateChange(event.currentTarget.value)}
            >
              {layoutTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label htmlFor="layout-template-description">
            Current template summary
            <textarea id="layout-template-description" rows={2} value={selectedTemplate?.description ?? ''} readOnly />
          </label>
          <br />
          <label htmlFor="layout-schema-json">
            Layout schema JSON
            <textarea
              id="layout-schema-json"
              aria-label="Layout schema JSON"
              value={schemaText}
              rows={16}
              onChange={(event) => {
                setSchemaText(event.currentTarget.value);
              }}
            />
          </label>
          <div>
            <button type="button" onClick={applySchema}>Apply schema</button>
            <button type="button" onClick={() => handleTemplateChange(selectedTemplateId)}>Reset to template</button>
            <button type="button" onClick={() => void copySchema()} disabled={!canCopySchema}>Copy schema</button>
          </div>
          {editorError ? <StateBlock variant="error" title="Invalid JSON" description={editorError} /> : null}
          <p aria-live="polite">
            Diagnostic result: {issueCount === 0 ? 'no issues' : `${issueCount} issue${issueCount === 1 ? '' : 's'}`}
          </p>
          <SectionPanel
            title={`Schema render preview (${selectedTemplate?.schema.version ?? '1'})`}
            description="Rendered output is produced from the current applied schema."
          >
            {renderedTemplate.node}
          </SectionPanel>
          {issueCount ? (
            <SectionPanel title="Schema issues" description="Fix these payload issues before using the template in production code.">
              <ul>
                {renderedTemplate.issues.map((issue, index) => (
                  <li key={`${issue.blockId ?? 'schema'}-${index}`}>{issue.blockId ? `${issue.blockId}: ` : ''}{issue.message}</li>
                ))}
              </ul>
            </SectionPanel>
          ) : null}
        </SectionPanel>
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}

export function VocabularyPage() {
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const showFeedback = (next: 'success' | 'error') => {
    setFeedback(next);
    setTimeout(() => setFeedback(null), 1600);
  };

  return (
    <DocsPageShell
      title="Actions & Auth"
      eyebrow="Live demo family"
      lead="Semantic actions and canonical auth/share surfaces exist so products do not need local wrappers for buttons, login providers, or social distribution."
    >
      <ReferenceSection title="Semantic action system" description="Use semantic actions instead of free-form button stacks wherever the intent is already known.">
        <ActionBar
          primary={{ action: 'save' }}
          secondary={[{ action: 'cancel' }]}
          tertiary={[{ action: 'preview' }, { action: 'refer' }]}
          iconOnly={[{ action: 'settings' }]}
        />
      </ReferenceSection>

      <ReferenceSection title="Feedback states" description="Interaction states remain visible and consistent without route-local button wrappers.">
        <>
          <SemanticButton action="submit" feedbackState={feedback} onClick={() => showFeedback('success')} />
          <SemanticButton action="delete" feedbackState={feedback === 'success' ? null : feedback} onClick={() => showFeedback('error')} color="red" />
        </>
      </ReferenceSection>

      <ReferenceSection title="Canonical social auth" description="Provider-based login belongs to the shared auth surface, not to custom stacks inside each product.">
        <AuthShell
          title="Sign in to GDS"
          description="Canonical social-auth placement inside the shared auth shell."
          socialAuth={(
            <ProviderIdentityButtonGroup
              layout="grid"
              providers={[
                { provider: 'google', href: '/auth/google' },
                { provider: 'apple', href: '/auth/apple' },
                { provider: 'github', href: '/auth/github' },
                { provider: 'microsoft', href: '/auth/microsoft' },
              ]}
            />
          )}
          helper="You can swap in your product session wiring while preserving the shared auth presentation."
        >
          <SectionPanel title="Email lane" description="Products keep their backend auth implementation. GDS governs the surface contract.">
            <p>This bounded helper block replaces the old pattern of every app inventing a different social-login stack.</p>
          </SectionPanel>
        </AuthShell>
      </ReferenceSection>

      <ReferenceSection title="Share buttons" description="Use the canonical share-button group instead of per-product icon clusters.">
        <ShareButtonGroup
          url="https://sovereignsquad.github.io/general-design-system/live-demos/semantics"
          title="GDS actions and auth live demo"
          text="Inspect semantic actions and canonical social-auth surfaces."
          channels={['native', 'copy', 'mail', 'x']}
          compact
        />
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}

export function PlaybackPage() {
  return (
    <DocsPageShell
      title="Playback & Capture"
      eyebrow="Live demo family"
      lead="Playback and capture flows should use shared shells and staging semantics rather than product-local hardware scaffolding."
    >
      <ReferenceSection
        title="Playback surfaces"
        description="Use PlaybackSurface for bounded rich media experiences with explicit metadata and stable action affordances."
      >
        <PlaybackSurface
          title="Product walkthrough"
          state="ready"
          statusMessage="Accessible playback surface with bounded media and clear next actions."
          media={<div />}
        />
      </ReferenceSection>

      <ReferenceSection
        title="Capture/review stage"
        description="PublicFlowShell keeps capture, review, consent, and submission states predictable."
      >
        <PublicFlowShell
          eyebrow="Capture review"
          stage={{
            id: 'capture-ready',
            title: 'Review your capture setup',
            description: 'The flow contract governs stage status, actions, and blocked/unblocked transitions.',
            status: 'ready',
            body: (
              <SectionPanel
                title="Capture pre-check"
                description="Verify permissions, upload destination, and preview settings before users enter a production step."
              >
                <p>Do not invent local capture UX. Use this contract for every hardware-adjacent staged flow.</p>
              </SectionPanel>
            ),
            actions: [
              { action: 'start', priority: 'primary' },
              { action: 'cancel', priority: 'secondary' },
            ],
          }}
        />
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}

export function AnalyticsPage() {
  const rows = [
    { id: '1', surface: 'DiscoveryShell', coverage: 'Live demo', status: 'Adopted' },
    { id: '2', surface: 'ListingCard', coverage: 'Live demo', status: 'Adopted' },
    { id: '3', surface: 'MapPanel', coverage: 'Live demo', status: 'Adopted' },
  ];

  return (
    <DocsPageShell
      title="Analytics & Data"
      eyebrow="Live demo family"
      lead="Operational metrics, shared data views, and threshold-aware analytics should use the canonical GDS surfaces rather than local reporting wrappers."
    >
      <ReferenceSection title="Metric and progress surfaces" description="Shared metrics should remain readable, threshold-aware, and consistent across products.">
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Catalog coverage" value={`${catalogEntryCount} entries`} description="Pattern inventory shown on the public site." />
          <ProgressCard label="Reference-site conversion" value="Strict consumer" progress={100} progressLabel="Current state" />
          <MetricCard label="npm line" value="3.0.0" description="Public package and docs release line." />
        </ConsumerDashboardGrid>
      </ReferenceSection>

      <ReferenceSection title="Shared data views" description="ResponsiveDataView and DataTable handle desktop/mobile rhythm without inventing local list shells.">
        <ResponsiveDataView
          data={rows}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'coverage', label: 'Coverage' },
            { key: 'status', label: 'Status' },
          ]}
          renderCard={(item) => (
            <SectionPanel title={item.surface} description={item.coverage}>
              <p>{item.status}</p>
            </SectionPanel>
          )}
        />
        <DataTable
          data={rows}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'coverage', label: 'Coverage' },
            { key: 'status', label: 'Status' },
          ]}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>

      <ReferenceSection title="Statistics thresholds" description="StatsSection communicates loading, threshold, and empty states instead of leaving analytics surfaces vague.">
        <StatsSection
          title="Adoption threshold example"
          belowThreshold
          thresholdMessage="This report remains hidden until the consumer has enough live traffic to produce stable numbers."
        />
      </ReferenceSection>

      <ReferenceSection title="Expanded chart catalog" description="GDS now exposes a governed 12-type chart contract with shared state and fallback behavior.">
        <ConsumerDashboardGrid columns={3}>
          <GdsChart type="line" title="Line chart" summary="Trend over time." data={[{ label: 'Mon', value: 12 }, { label: 'Tue', value: 19 }]} />
          <GdsChart type="area" title="Area chart" summary="Filled trend continuity." data={[{ label: 'A', value: 7 }, { label: 'B', value: 16 }]} />
          <GdsChart type="bar" title="Bar chart" summary="Category totals." data={[{ label: 'North', value: 44 }, { label: 'South', value: 30 }]} />
          <GdsChart type="stacked-bar" title="Stacked bar chart" summary="Grouped category totals." data={[{ label: 'Q1', value: 34, group: 'A' }, { label: 'Q1', value: 21, group: 'B' }]} />
          <GdsChart type="pie" title="Pie chart" summary="Part-to-whole split." data={[{ label: 'Organic', value: 62 }, { label: 'Paid', value: 38 }]} />
          <GdsChart type="donut" title="Donut chart" summary="Part-to-whole with center context." data={[{ label: 'Web', value: 75 }, { label: 'Store', value: 25 }]} />
          <GdsChart type="radar" title="Radar chart" summary="Multi-dimension profile." data={[{ label: 'Reach', value: 80 }, { label: 'Retention', value: 63 }]} />
          <GdsChart type="scatter" title="Scatter chart" summary="Correlation map." data={[{ label: 'Point A', value: 21, secondaryValue: 11 }, { label: 'Point B', value: 40, secondaryValue: 24 }]} />
          <GdsChart type="bubble" title="Bubble chart" summary="Weighted scatter profile." data={[{ label: 'Segment A', value: 30, secondaryValue: 14 }, { label: 'Segment B', value: 55, secondaryValue: 22 }]} />
          <GdsChart type="heatmap" title="Heatmap" summary="Intensity by matrix cell." data={[{ label: 'Morning', value: 9, group: 'Mon' }, { label: 'Evening', value: 4, group: 'Tue' }]} />
          <GdsChart type="funnel" title="Funnel chart" summary="Stage conversion progression." data={[{ label: 'Visits', value: 100 }, { label: 'Leads', value: 25 }]} />
          <GdsChart type="treemap" title="Treemap" summary="Hierarchical distribution." data={[{ label: 'Cluster A', value: 54 }, { label: 'Cluster B', value: 31 }]} />
        </ConsumerDashboardGrid>
      </ReferenceSection>

      <DemoFooter />
    </DocsPageShell>
  );
}
