import { useState } from 'react';
import {
  AccessSummary,
  ActionBar,
  AuthShell,
  ConsumerDashboardGrid,
  DetailProfileShell,
  DiscoveryShell,
  DocsPageShell,
  FeatureBand,
  FoodMenuSection,
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
  SocialAuthButtons,
  StatsSection,
} from '@doneisbetter/gds-core';
import { DataTable, PageHeader, ResponsiveDataView } from '@doneisbetter/gds-admin';

function DemoFooter() {
  return (
    <p style={{ margin: 0 }}>
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
          image={<div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, var(--mantine-color-violet-5), var(--mantine-color-teal-5))' }} />}
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

export function LayoutsPage() {
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
              <p style={{ margin: 0 }}>Use the same detail contract across page and drawer modes instead of growing product-local profile panels.</p>
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
                <p style={{ margin: 0 }}>Confirm lighting, permissions, and the intended upload destination before opening a hardware-adjacent step.</p>
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
          media={<div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, var(--mantine-color-dark-6), var(--mantine-color-violet-6))' }} />}
        />
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
            <SocialAuthButtons
              layout="grid"
              providers={[
                { id: 'google' },
                { id: 'apple' },
                { id: 'github' },
                { id: 'microsoft' },
              ]}
            />
          )}
          helper="You can swap in your product session wiring while preserving the shared auth presentation."
        >
          <SectionPanel title="Email lane" description="Products keep their backend auth implementation. GDS governs the surface contract.">
            <p style={{ margin: 0 }}>This bounded helper block replaces the old pattern of every app inventing a different social-login stack.</p>
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
          <MetricCard label="Catalog coverage" value="73 entries" description="Pattern inventory shown on the public site." />
          <ProgressCard label="Reference-site conversion" value="Strict consumer" progress={100} progressLabel="Current state" />
          <MetricCard label="npm line" value="2.6.6" description="Public package and docs release line." />
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
              <p style={{ margin: 0 }}>{item.status}</p>
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

      <DemoFooter />
    </DocsPageShell>
  );
}
