import {
  ActionBar,
  AccessSummary,
  AuthShell,
  ConsumerDashboardGrid,
  DetailProfileShell,
  DiscoveryShell,
  DocsPageShell,
  FeatureBand,
  FoodMenuSection,
  ListingCard,
  MapPanel,
  MetricCard,
  PlaybackSurface,
  ProgressCard,
  PublicFlowShell,
  PublicNav,
  ReferenceLinkGrid,
  ReferenceSection,
  SectionPanel,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SocialAuthButtons,
  ProviderIdentityButtonGroup,
  StateBlock,
  StatsSection,
} from '@doneisbetter/gds-core';
import { DataTable, PageHeader, ResponsiveDataView } from '@doneisbetter/gds-admin';
import {
  getFamilyEntries,
  type PatternFamily,
  type PatternRegistryEntry,
} from './pattern-registry';

const familyMeta: Record<PatternFamily, { title: string; description: string }> = {
  foundations: {
    title: 'Foundations',
    description: 'Shells, controls, cards, and baseline workflow rules used across every adopting product.',
  },
  public: {
    title: 'Public, Editorial, & Docs',
    description: 'Public navigation, discovery, storytelling, docs, and branded outward-facing composition.',
  },
  operations: {
    title: 'Operations',
    description: 'Dashboard, editing, section, and operational workflow patterns for day-to-day platform work.',
  },
  data: {
    title: 'Data & Search',
    description: 'Search, filters, tables, analytics rhythm, and responsive data views.',
  },
  access: {
    title: 'Access & Recovery',
    description: 'Auth, access summaries, recovery, sharing, and bounded hardware-adjacent flows.',
  },
  feedback: {
    title: 'Feedback & Messaging',
    description: 'State communication, confirmations, placeholders, and threshold-aware response patterns.',
  },
};

function groupEntries(entries: PatternRegistryEntry[]) {
  return entries.reduce<Record<string, PatternRegistryEntry[]>>((acc, entry) => {
    acc[entry.section] ??= [];
    acc[entry.section].push(entry);
    return acc;
  }, {});
}

function CoverageText({ entry }: { entry: PatternRegistryEntry }) {
  return (
    <p style={{ margin: 0, color: 'var(--mantine-color-dimmed)' }}>
      {entry.docSection}
      {entry.sourceComponent ? ` • ${entry.sourceComponent}` : ''}
      {entry.importPath ? ` • ${entry.importPath}` : ''}
    </p>
  );
}

function renderEntryDemo(entry: PatternRegistryEntry) {
  switch (entry.sourceComponent) {
    case 'DiscoveryShell':
    case 'SidebarNav':
      return (
        <DiscoveryShell
          header={<PageHeader title="Reference shell preview" description="Canonical sidebar-first shell." />}
          sidebar={(
            <SidebarNav ariaLabel="Reference navigation">
              <SidebarNavSection label="Primary">
                <SidebarNavItem action="dashboard" href="/general-design-system/patterns/foundations" active />
                <SidebarNavItem action="grid" href="/general-design-system/patterns" />
              </SidebarNavSection>
            </SidebarNav>
          )}
        >
          <ActionBar primary={{ action: 'save', size: 'sm' }} tertiary={[{ action: 'preview', size: 'sm' }]} />
        </DiscoveryShell>
      );
    case 'ActionBar':
      return <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} tertiary={[{ action: 'preview' }, { action: 'refer' }]} />;
    case 'DetailProfileShell':
      return (
        <DetailProfileShell
          hero={<PageHeader title="Universal SSO" description="Canonical detail shell example." />}
          sections={[
            <SectionPanel key="overview" title="Overview" description="Governed detail content stack.">
              <p style={{ margin: 0 }}>One detail contract should cover both page and drawer modes.</p>
            </SectionPanel>,
          ]}
        />
      );
    case 'MapPanel':
      return <MapPanel title="Map containment" description="Shared panel chrome for embeds and maps." empty="No map source configured for this demo." />;
    case 'ListingCard':
      return (
        <ListingCard
          title="Shared listing card"
          description="Governed metadata rows and consistent affordance placement."
          metadata={[
            { id: 'date', label: 'Date', value: 'June 14' },
            { id: 'location', label: 'Location', value: 'Budapest' },
          ]}
          primaryAction={<a href="/general-design-system/patterns">Open</a>}
          saveAction={{ action: 'save' }}
          shareAction={{ action: 'refer' }}
        />
      );
    case 'SocialAuthButtons':
      return <SocialAuthButtons layout="grid" providers={[{ id: 'google' }, { id: 'apple' }, { id: 'github' }, { id: 'microsoft' }]} />;
    case 'ProviderIdentityButtonGroup':
      return (
        <ProviderIdentityButtonGroup
          layout="grid"
          providers={[
            { provider: 'google', href: '/auth/google' },
            { provider: 'apple', href: '/auth/apple' },
            { provider: 'github', href: '/auth/github' },
          ]}
        />
      );
    case 'ShareButtonGroup':
      return <ShareButtonGroup url="https://sovereignsquad.github.io/general-design-system/patterns" title="GDS pattern catalog" text="Inspect the shipped pattern inventory." compact />;
    case 'PublicFlowShell':
      return (
        <PublicFlowShell
          stage={{
            id: 'capture',
            title: 'Capture flow',
            description: 'Bounded public flow stage.',
            status: 'ready',
            actions: [{ action: 'start', priority: 'primary' }],
            body: <p style={{ margin: 0 }}>Use a staged shell instead of assembling camera or capture routes ad hoc.</p>,
          }}
        />
      );
    case 'PlaybackSurface':
      return (
        <PlaybackSurface
          title="Playback contract"
          state="ready"
          statusMessage="Accessible timed-media containment."
          media={<div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, var(--mantine-color-dark-6), var(--mantine-color-violet-6))' }} />}
        />
      );
    case 'StatsSection':
      return <StatsSection title="Threshold-aware statistics" belowThreshold thresholdMessage="Not enough data yet for this report." />;
    default:
      break;
  }

  switch (entry.id) {
    case 'primary-navigation':
      return (
        <PublicNav
          activeId="patterns"
          items={[
            { id: 'overview', label: 'Overview', href: '#overview' },
            { id: 'patterns', label: 'Patterns', href: '#patterns' },
            { id: 'install', label: 'Install', href: '#install' },
          ]}
        />
      );
    case 'mobile-navigation':
      return (
        <FeatureBand
          columns={2}
          variant="compact"
          items={[
            { id: 'visible', title: 'Always-visible destinations', description: 'Keep routine destinations reachable without forcing a hidden drawer for every action.' },
            { id: 'overflow', title: 'Overflow for secondary controls', description: 'Collapse filters, account controls, and less-frequent actions into secondary lanes.' },
          ]}
        />
      );
    case 'page-headers':
      return <PageHeader title="Governed header" description="Headers answer where the user is, what the surface is for, and what comes next." />;
    case 'forms':
    case 'inputs':
    case 'selects-combobox':
    case 'checkboxes-radios':
      return (
        <SectionPanel title="Shared form guidance" description="GDS governs the layout, state handling, and surrounding contracts for form workflows.">
          <p style={{ margin: 0 }}>Use shared field rhythm, inline validation, and clear action hierarchy. Do not create route-local form systems.</p>
        </SectionPanel>
      );
    case 'search-filters-lists':
      return (
        <ResponsiveDataView
          data={[
            { id: '1', name: 'DiscoveryShell', family: 'Foundations', coverage: 'Live demo' },
            { id: '2', name: 'ListingCard', family: 'Public', coverage: 'Live demo' },
          ]}
          columns={[
            { key: 'name', label: 'Pattern' },
            { key: 'family', label: 'Family' },
            { key: 'coverage', label: 'Coverage' },
          ]}
          renderCard={(item) => (
            <SectionPanel title={item.name} description={item.family}>
              <p style={{ margin: 0 }}>{item.coverage}</p>
            </SectionPanel>
          )}
        />
      );
    case 'dashboards':
      return (
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Next action" value="Publish docs" description="Dashboards should surface the next concrete action first." />
          <ProgressCard label="Coverage" value="73 entries" progress={100} progressLabel="Pattern-site coverage" />
          <MetricCard label="Urgent exception" value="0" description="Critical issues should stay visible above broad analytics." />
        </ConsumerDashboardGrid>
      );
    case 'destructive-actions':
      return (
        <SectionPanel title="Explicit destructive path" description="High-impact actions remain distinct and require confirmation.">
          <SemanticButton action="delete" color="red" />
        </SectionPanel>
      );
    case 'product-cards':
    case 'public-product-cards':
    case 'media-cards':
      return (
        <ListingCard
          title="Media-forward catalog entry"
          description="Shared card rhythm for discovery and promotional surfaces."
          metadata={[{ id: 'status', label: 'Status', value: 'Published' }]}
          primaryAction={<a href="/general-design-system/patterns/public">Inspect</a>}
        />
      );
    case 'food-cards':
    case 'food-menu-sections':
      return (
        <FoodMenuSection
          title="Menu surface"
          categories={[
            {
              id: 'featured',
              title: 'Featured dishes',
              items: [
                {
                  id: 'dish',
                  title: 'Citrus chicken bowl',
                  description: 'Shared food-card contract.',
                  state: 'available',
                  price: '€12.50',
                  primaryAction: <a href="/general-design-system/live-demos/surfaces">Reserve</a>,
                },
              ],
            },
          ]}
        />
      );
    case 'access-summary':
    case 'access-recovery':
      return <AccessSummary title="Shared access summary" roles={['platform-ui', 'maintainers']} scope="Reference site" description="Access and recovery surfaces stay explicit and reviewable." />;
    case 'auth-shell':
      return (
        <AuthShell
          title="Shared auth shell"
          description="Canonical auth placement with optional social providers."
          socialAuth={<SocialAuthButtons providers={[{ id: 'google' }, { id: 'github' }]} />}
        >
          <p style={{ margin: 0 }}>Products keep their actual auth backend. GDS governs the visible contract.</p>
        </AuthShell>
      );
    case 'state-blocks':
    case 'alerts':
    case 'drawers':
    case 'notifications':
    case 'modals':
    case 'empty-states':
    case 'placeholders':
      return <StateBlock variant="info" title="Shared feedback surface" description="Feedback patterns are governed so teams do not invent a separate status language." compact />;
    case 'simple-data-table':
    case 'tables':
      return (
        <DataTable
          data={[
            { id: '1', surface: 'DiscoveryShell', status: 'Ready' },
            { id: '2', surface: 'ActionBar', status: 'Ready' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'status', label: 'Status' },
          ]}
          getRowKey={(row) => row.id}
        />
      );
    default:
      return (
        <SectionPanel title="Live reference note" description="This documented pattern is represented through the live site and its shared component family.">
          <p style={{ margin: 0 }}>{entry.summary}</p>
        </SectionPanel>
      );
  }
}

function PatternEntryCard({ entry }: { entry: PatternRegistryEntry }) {
  return (
    <SectionPanel title={entry.title} description={entry.summary}>
      <CoverageText entry={entry} />
      {renderEntryDemo(entry)}
    </SectionPanel>
  );
}

export function PatternsIndexPage() {
  const counts = Object.entries(familyMeta).map(([family, meta]) => ({
    id: family,
    title: meta.title,
    description: meta.description,
    href: `/general-design-system/patterns/${family}`,
    badge: `${getFamilyEntries(family as PatternFamily).length} entries`,
  }));

  return (
    <DocsPageShell
      title="Pattern Catalog"
      eyebrow="SSOT-aligned live catalog"
      lead="This catalog maps the documented pattern inventory to live runtime proof. The markdown SSOT remains normative, and this site is the visual reference."
    >
      <ReferenceSection title="Browse pattern families" description="Every documented pattern is grouped into a public route so visitors can inspect the live contract.">
        <ReferenceLinkGrid items={counts} />
      </ReferenceSection>
      <ReferenceSection title="Coverage promise" description="The official site is expected to remain a strict consumer of the primitives it documents.">
        <FeatureBand
          columns={3}
          items={[
            { id: 'live', title: 'Live demonstrations', description: 'Documented patterns should be represented by shipped package surfaces or bounded live examples.' },
            { id: 'traceable', title: 'Traceable to SSOT', description: 'Each entry keeps its section, family, route, and summary aligned with the canonical markdown inventory.' },
            { id: 'governed', title: 'No local authority', description: 'When the site needs a reusable surface, it belongs in GDS rather than in the app layer.' },
          ]}
        />
      </ReferenceSection>
    </DocsPageShell>
  );
}

export function PatternFamilyPage({ family }: { family: PatternFamily }) {
  const meta = familyMeta[family];
  const entries = getFamilyEntries(family);
  const groupedEntries = groupEntries(entries);

  return (
    <DocsPageShell
      title={meta.title}
      eyebrow="Pattern family"
      lead={meta.description}
      breadcrumbs={[
        { label: 'Patterns', href: '/general-design-system/patterns' },
        { label: meta.title },
      ]}
    >
      {Object.entries(groupedEntries).map(([section, sectionEntries]) => (
        <ReferenceSection
          key={section}
          title={section}
          description={`${sectionEntries.length} documented pattern${sectionEntries.length === 1 ? '' : 's'} in this section.`}
        >
          {sectionEntries.map((entry) => (
            <PatternEntryCard key={entry.id} entry={entry} />
          ))}
        </ReferenceSection>
      ))}
    </DocsPageShell>
  );
}
