import {
  AccessSummary,
  AccessRecoveryPanel,
  ActionBar,
  AccentPanel,
  ArticleShell,
  AuthShell,
  BrowseSurface,
  CtaButtonGroup,
  ChoiceChip,
  ConfirmDialog,
  ConsumerDashboardGrid,
  ConsumerSection,
  createGdsVocabularyPack,
  DataToolbar,
  DetailProfileShell,
  DiscoveryShell,
  DocsCodeBlock,
  DocsShell,
  DocsPageShell,
  EditorialCard,
  EditorialHero,
  FeatureBand,
  FilterDrawer,
  FoodMenuSection,
  FormField,
  GdsIcons,
  ListingCard,
  MapPanel,
  MediaField,
  MetricCard,
  PlaybackSurface,
  PlaceholderPanel,
  ProgressCard,
  ProductCard,
  PublicBrandFooter,
  PublicFlowShell,
  PublicFoodCard,
  PublicNav,
  PublicProductCard,
  PublicShell,
  ReferenceLinkGrid,
  ReferenceLocaleNotice,
  ReferenceSection,
  ReferenceThemeExplorer,
  SectionPanel,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SocialAuthButtons,
  StateBlock,
  StatusBadge,
  SimpleDataTable,
  UploadDropzone,
  ProviderIdentityButtonGroup,
  StatsSection,
} from '@doneisbetter/gds-core';
import {
  ContentOpsActionBar,
  ContentOpsEditor,
  ContentOpsSection,
  DataTable,
  PageHeader,
  ReferenceSiteShell,
  ResponsiveDataView,
} from '@doneisbetter/gds-admin';
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

function DemoList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0 }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
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
  const vocab = createGdsVocabularyPack('camera', {
    urgent: {
      defaultMessage: 'Urgent',
      icon: GdsIcons.Danger,
    },
  });

  switch (entry.id) {
    case 'stable-shell':
    case 'shell-contracts':
    case 'discovery-shell':
      return (
        <DiscoveryShell
          header={<PageHeader title="Stable discovery surface" description="Canonical sidebar-first shell for authenticated apps." />}
          sidebar={(
            <SidebarNav ariaLabel="Reference navigation">
              <SidebarNavSection label="Primary">
                <SidebarNavItem action="dashboard" href="/general-design-system/live-demos/surfaces" active />
                <SidebarNavItem action="settings" href="/general-design-system/patterns" />
              </SidebarNavSection>
            </SidebarNav>
          )}
        >
          <ActionBar primary={{ action: 'save', size: 'sm' }} secondary={[{ action: 'cancel', size: 'sm' }]} />
        </DiscoveryShell>
      );
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
            {
              id: 'visible',
              title: 'Always-visible destinations',
              description: 'Keep routine destinations reachable without hiding everything in a drawer.',
            },
            {
              id: 'overflow',
              title: 'Overflow secondary controls',
              description: 'Move secondary actions into a compact mobile section.',
            },
          ]}
        />
      );
    case 'page-headers':
      return (
        <PageHeader
          title="Governed header"
          description="Headers answer where the user is and what the surface is for."
          primaryAction={<ActionBar primary={{ action: 'save' }} />}
        />
      );
    case 'sidebar-navigation':
      return (
        <SidebarNav ariaLabel="Pattern reference sidebar">
          <SidebarNavSection label="Primary">
            <SidebarNavItem action="dashboard" href="/general-design-system/patterns/foundations" active />
            <SidebarNavItem action="profile" href="/general-design-system/patterns/operations" />
          </SidebarNavSection>
          <SidebarNavSection label="More">
            <SidebarNavItem action="list" href="/general-design-system/patterns/data" />
            <SidebarNavItem action="notifications" href="/general-design-system/patterns/feedback" />
          </SidebarNavSection>
        </SidebarNav>
      );
    case 'dashboards':
      return (
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Next action" value="Publish docs" description="Prioritize next action first." />
          <ProgressCard label="Coverage" value="73 entries" progress={100} progressLabel="Pattern-site coverage" />
          <MetricCard label="Critical exceptions" value="0" description="Urgent errors should stay visible above broad analytics." />
        </ConsumerDashboardGrid>
      );
    case 'forms':
    case 'inputs':
    case 'selects-combobox':
    case 'checkboxes-radios':
      return (
        <SectionPanel title="Shared form guidance" description="GDS governs labels, descriptions, and state handling.">
          <div style={{ display: 'grid', gap: 'var(--mantine-spacing-sm)' }}>
            <FormField label="Title" description="Use shared form fields for all labels and errors.">
              <input aria-label="Title" />
            </FormField>
            <FormField label="Status" description="Use shared select semantics for branch choices.">
              <select aria-label="Status">
                <option>Draft</option>
                <option>Published</option>
              </select>
            </FormField>
            <FormField label="Featured" description="Binary decisions remain explicit.">
              <input type="checkbox" aria-label="Featured" />
            </FormField>
          </div>
          <ActionBar primary={{ action: 'submit' }} secondary={[{ action: 'cancel' }]} />
          <p style={{ margin: 0 }}>Use controlled helper text and explicit save/discard behavior.</p>
        </SectionPanel>
      );
    case 'admin-editor-flows':
      return (
        <ContentOpsEditor
          header={<PageHeader title="Catalog admin shell" description="Canonical content operations workflow." />}
          status={(
            <ContentOpsActionBar
              dirty
              status="Editing in shared governance mode."
              actions={{
                primary: { action: 'save' },
                secondary: [{ action: 'cancel' }],
                tertiary: [{ action: 'preview' }],
              }}
            />
          )}
          sections={(
            <ContentOpsSection id="visibility" title="Visibility" description="Use shared sections and form contracts.">
              <FormField label="Visibility" description="Governed control and descriptive labels.">
                <select aria-label="Visibility">
                  <option>Public</option>
                  <option>Private</option>
                </select>
              </FormField>
            </ContentOpsSection>
          )}
          preview={
            <SectionPanel title="Live preview" description="Shared preview rail for editor contexts.">
              <p style={{ margin: 0 }}>Keep previews close to the current editing state.</p>
            </SectionPanel>
          }
          settings={
            <SectionPanel title="Settings" description="Operations settings stay in the same contract.">
              <p style={{ margin: 0 }}>Settings remain grouped and stable for team-wide governance.</p>
            </SectionPanel>
          }
          actionBar={<ContentOpsActionBar actions={{ primary: { action: 'save' }, secondary: [{ action: 'refresh' }] }} />}
        />
      );
    case 'search-filters-lists':
      return (
        <ResponsiveDataView
          data={[
            { id: '1', surface: 'DiscoveryShell', status: 'Ready' },
            { id: '2', surface: 'ListingCard', status: 'Ready' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'status', label: 'Status' },
          ]}
          renderCard={(item) => (
            <SectionPanel title={item.surface} description={item.status}>
              <p style={{ margin: 0 }}>Canonical searchable and filterable surface contract.</p>
            </SectionPanel>
          )}
        />
      );
    case 'destructive-actions':
      return (
        <ConfirmDialog opened onClose={() => {}} onConfirm={() => {}} title="Delete this pattern" isDanger>
          Destructive actions must remain explicit and reversible only with confirmation.
        </ConfirmDialog>
      );
    case 'pattern-service-reuse':
      return <PublicBrandFooter brandTitle="Pattern reuse" description="Shared primitives avoid local component drift." />;
    case 'semantic-actions':
      return (
        <ActionBar
          primary={{ action: 'save' }}
          secondary={[{ action: 'cancel' }]}
          tertiary={[{ action: 'preview' }, { action: 'refer' }]}
          iconOnly={[{ action: 'settings' }]}
        />
      );
    case 'detail-surfaces':
    case 'detail-profile-shell':
      return (
        <DetailProfileShell
          hero={<PageHeader title="Universal profile" description="Canonical detail shell example." />}
          actions={<ActionBar primary={{ action: 'edit' }} secondary={[{ action: 'refer' }]} />}
          sections={[
            <SectionPanel key="overview" title="Overview" description="One detail contract for page and drawer modes.">
              <p style={{ margin: 0 }}>Use one reusable composition, not local detail shells.</p>
            </SectionPanel>,
          ]}
        />
      );
    case 'embed-surfaces':
    case 'map-panel':
      return (
        <MapPanel
          title="Map containment"
          description="Shared map/iframe contract keeps embed behavior explicit."
          loading={false}
          empty="No map source configured for this demo."
        />
      );
    case 'buttons':
      return (
        <CtaButtonGroup
          primary={<SemanticButton action="save" />}
          secondary={<SemanticButton action="cancel" />}
          tertiary={<SemanticButton action="preview" />}
        />
      );
    case 'choice-chips':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-sm)' }}>
          <ChoiceChip label="Draft" active />
          <ChoiceChip label="Published" onClick={() => {}} />
          <ChoiceChip label="Archived" />
        </div>
      );
    case 'icon-buttons':
      return <ActionBar primary={{ action: 'save' }} iconOnly={[{ action: 'settings' }, { action: 'search' }, { action: 'help' }]} />;
    case 'product-cards':
      return (
        <ProductCard
          title="Reusable product"
          description="One product contract across products and docs."
          status="Published"
          metadata={[{ label: 'Price', value: '€39' }]}
          primaryAction={<a href="/general-design-system/patterns/public">Open</a>}
          secondaryActions={[
            { label: 'Save', href: '/general-design-system/patterns' },
            { label: 'Share', href: '/general-design-system/patterns' },
          ]}
        />
      );
    case 'public-product-cards':
      return (
        <PublicProductCard
          title="Public product card"
          description="Flat media-first variant for licensed surfaces."
          price="€39"
          state="available"
          metadata={[{ label: 'Scope', value: 'UI primitives' }]}
          primaryAction={<a href="/general-design-system/live-demos/surfaces">Buy</a>}
        />
      );
    case 'accent-panels':
      return (
        <AccentPanel tone="violet" title="Accent band">
          <p style={{ margin: 0 }}>Use accent panel for advisory messaging.</p>
          <p style={{ margin: 0 }}>Shared tonal semantics preserve readability across surfaces.</p>
        </AccentPanel>
      );
    case 'metric-cards':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
          <MetricCard label="Coverage" value="100%" description="Live catalog coverage." trend={{ tone: 'positive', label: '+2%' }} />
          <ProgressCard label="Adoption" value="18 apps" progress={86} progressLabel="Connected teams" />
        </div>
      );
    case 'data-toolbars':
      return (
        <DataToolbar
          searchSlot={<input aria-label="Search dataset" />}
          filterSlot={<button type="button">Filters</button>}
          sortSlot={<select aria-label="Sort by"><option>Newest</option><option>Oldest</option></select>}
          resetAction={<button type="button">Reset</button>}
          createAction={<button type="button">Create</button>}
          activeFilters={[
            { label: 'Published', onRemove: () => {} },
            { label: 'Admin scope', onRemove: () => {} },
          ]}
        />
      );
    case 'state-blocks':
      return (
        <StateBlock
          variant="info"
          title="Shared feedback surface"
          description="State content can now use contract-driven centered presentation directly."
          minHeight={320}
          presentation="centered"
          contentAlign="center"
          contentJustify="center"
          compact
        />
      );
    case 'action-bar':
      return <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} tertiary={[{ action: 'preview' }]} iconOnly={[{ action: 'settings' }]} />;
    case 'listing-card':
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
    case 'share-button-group':
      return <ShareButtonGroup url="https://sovereignsquad.github.io/general-design-system/patterns" title="GDS pattern catalog" text="Inspect the shipped pattern inventory." compact />;
    case 'public-food-card':
      return (
        <PublicFoodCard
          title="Smoked paprika chicken bowl"
          description="Controlled freshness and helper copy contract."
          state="preorder"
          price="€12.50"
          helperText="Pickup window closes at 18:00."
          pickupNote="Today, 17:15-18:00"
          freshnessNote="Prepared in small daily batches"
          markers={[
            { id: 'featured', label: 'Featured', tone: 'positive' },
            { id: 'hot', label: 'Limited batch', tone: 'warning' },
          ]}
          primaryAction={<a href="/general-design-system/live-demos/food">Reserve pickup</a>}
        />
      );
    case 'food-menu-section':
      return (
        <FoodMenuSection
          title="Weekly menu"
          sectionNote="Pickup window: Saturday 09:00-12:00"
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
    case 'playback-surface':
      return (
        <PlaybackSurface
          title="Playback contract"
          state="ready"
          statusMessage="Accessible timed-media containment."
          media={<div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, var(--mantine-color-dark-6), var(--mantine-color-violet-6)' }} />}
        />
      );
    case 'public-shells':
      return (
        <PublicShell
          brand={<strong>General Design System</strong>}
          navItems={[
            { id: 'overview', label: 'Overview', href: '/general-design-system/patterns' },
            { id: 'docs', label: 'Docs', href: '/general-design-system/tokens' },
          ]}
          activeNavId="overview"
          actions={<button type="button">Sign in</button>}
          mobileNavigationMode="inline-collapse"
          mobileNavigation={<a href="/general-design-system/patterns">Patterns</a>}
          footer={<PublicBrandFooter brandTitle="GDS" description="Canonical public shell." />}
          maxContentWidth="lg"
        >
          <SectionPanel title="Public content area" description="Bounded public shell for docs and marketing pages.">
            <p style={{ margin: 0 }}>Public chrome should not be re-implemented locally.</p>
          </SectionPanel>
        </PublicShell>
      );
    case 'public-nav':
      return <PublicNav activeId="patterns" items={[{ id: 'overview', label: 'Overview', href: '#overview' }, { id: 'install', label: 'Install', href: '#install' }]} />;
    case 'auth-shells':
      return (
        <AuthShell
          title="Sign in to GDS"
          description="Canonical auth placement with optional social providers."
          socialAuth={<SocialAuthButtons layout="grid" providers={[{ id: 'google' }, { id: 'github' }]} />}
          helper="Keep provider logic in the app; keep layout in GDS."
        >
          <p style={{ margin: 0 }}>Social auth remains part of the shared auth shell contract.</p>
        </AuthShell>
      );
    case 'social-auth-buttons':
      return <SocialAuthButtons layout="grid" providers={[{ id: 'google' }, { id: 'apple' }, { id: 'github' }, { id: 'microsoft' }]} />;
    case 'provider-identity-buttons':
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
    case 'article-shells':
      return (
        <ArticleShell
          eyebrow="Editorial"
          title="How reference docs stay strict"
          lead="Article content stays in one shared shell."
          sideRail={
            <SectionPanel title="Side rail" description="Related docs and indexes.">
              <p style={{ margin: 0 }}>Surface side rails show indexes and adjacent references.</p>
            </SectionPanel>
          }
          meta={<span>Scope: Pattern catalog</span>}
        >
          <p style={{ margin: 0 }}>Use ArticleShell for docs, legal, and editorial readability.</p>
        </ArticleShell>
      );
    case 'docs-page-shell':
      return (
        <DocsPageShell
          title="Reference docs shell"
          lead="Docs surface with shared breadcrumbs and body layout."
          breadcrumbs={[{ label: 'Docs', href: '/general-design-system' }, { label: 'Patterns' }]}
        >
          <p style={{ margin: 0 }}>The docs shell is now fully controlled by GDS.</p>
        </DocsPageShell>
      );
    case 'docs-shell':
      return (
        <DocsShell
          brand={<strong>General Design System</strong>}
          primaryNavigation={<SidebarNavItem action="home" href="/general-design-system/patterns/public" active />}
          secondaryNavigation={<SidebarNavItem action="theme" href="/general-design-system/themes" />}
          headerContext="Canonical docs/reference shell contract"
          actions={<SemanticButton action="theme" size="sm" />}
          contentWidth="full"
        >
          <SectionPanel title="Docs shell content" description="Reference/docs content belongs in package-owned shell framing.">
            <p style={{ margin: 0 }}>The official site should use this contract instead of page-local shell wrappers.</p>
          </SectionPanel>
        </DocsShell>
      );
    case 'reference-section':
      return (
        <ReferenceSection
          title="Governed section framing"
          description="Reference pages should use one canonical section rhythm for heading, summary, and actionable content."
        >
          <p style={{ margin: 0 }}>This section is the package-owned docs contract used across the official site.</p>
        </ReferenceSection>
      );
    case 'reference-link-grid':
      return (
        <ReferenceLinkGrid
          columns={2}
          items={[
            {
              id: 'install',
              title: 'Install Guide',
              description: 'Open the canonical install path and versioned package guidance.',
              href: '/general-design-system/install',
            },
            {
              id: 'governance',
              title: 'Governance',
              description: 'Read strict adoption and theme-ownership requirements.',
              href: '/general-design-system/governance',
            },
          ]}
        />
      );
    case 'reference-locale-notice':
      return (
        <ReferenceLocaleNotice
          localeLabel="Deutsch"
          detail="The reference-site narrative remains English while semantic vocabulary is already localized."
        />
      );
    case 'reference-theme-explorer':
      return <ReferenceThemeExplorer />;
    case 'reference-site-shell':
      return (
        <ReferenceSiteShell
          logoText="General Design System"
          primaryNavigation={<SidebarNavItem action="home" href="/general-design-system" active />}
          secondaryNavigation={<SidebarNavItem action="grid" href="/general-design-system/patterns" />}
          headerContext="Reference website shell"
          locale="en"
          localeOptions={[{ id: 'en', label: 'English' }]}
          onLocaleChange={() => {}}
        >
          <SectionPanel title="Reference-site composition" description="Legacy reference shell retained for bounded compatibility lanes.">
            <p style={{ margin: 0 }}>Prefer DocsShell for the official site path, keep this contract only where explicitly required.</p>
          </SectionPanel>
        </ReferenceSiteShell>
      );
    case 'editorial-hero':
      return (
        <EditorialHero
          eyebrow="Editorial"
          title="Shipped editorial hero"
          description="Hero surface with media and action controls."
          actions={[{ label: 'Get started', href: '/general-design-system/patterns' }]}
          media={<div style={{ aspectRatio: '16 / 11', background: 'linear-gradient(135deg, var(--mantine-color-violet-1), var(--mantine-color-gray-1))' }} />}
        />
      );
    case 'feature-band':
      return (
        <FeatureBand
          columns={3}
          items={[
            { id: 'one', title: 'Shared contracts', description: 'Use one structure for feature messaging.' },
            { id: 'two', title: 'Fewer wrappers', description: 'Avoid local component duplication.' },
            { id: 'three', title: 'Predictable rhythm', description: 'Keep spacing and typography in one place.' },
          ]}
        />
      );
    case 'browse-surface':
      return (
        <BrowseSurface
          title="Catalog discoverability"
          description="Single browse surface contract for search, filters, and sort."
          resultCount={3}
          scopeOptions={[{ id: 'all', label: 'All', active: true }, { id: 'public', label: 'Public' }]}
          toolbar={{ searchSlot: <input aria-label="Search discoverables" />, createAction: <button type="button">Create</button> }}
          mobileFilters={<button type="button">Filters</button>}
          content={<DemoList items={['Discovery Shell', 'Listing Card', 'Map Panel']} />}
        />
      );
    case 'editorial-cards':
      return (
        <EditorialCard
          title="Neighborhood guide"
          description="Shared editorial card contract for story surfaces."
          badge="Featured"
          ctaLabel="Read more"
          href="/general-design-system/patterns/public"
          tone="cool"
        />
      );
    case 'consumer-sections':
      return (
        <ConsumerSection
          title="Account section"
          description="Shared section container for consumer surfaces."
          action={<ActionBar primary={{ action: 'save' }} />}
        >
          <SectionPanel title="Section content" description="Actions and metadata stay composable.">
            <p style={{ margin: 0 }}>Section children are now explicit to satisfy required layout contract.</p>
          </SectionPanel>
        </ConsumerSection>
      );
    case 'consumer-dashboard-grid':
      return (
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Requests" value="42" description="Operations coverage." />
          <MetricCard label="Errors" value="0" description="Recovery surfaces remain clear." />
          <MetricCard label="Uptime" value="99.9%" description="Monitored states remain visible." />
        </ConsumerDashboardGrid>
      );
    case 'media-fields':
      return (
        <MediaField
          label="Hero image"
          description="Use media field contract for upload and URL handling."
          value="https://cdn.example.com/hero.jpg"
          preview={<img alt="Hero preview" src="https://picsum.photos/id/1015/640/360" />}
          uploadControl={<button type="button">Upload image</button>}
          urlInput={<input aria-label="Image URL" defaultValue="https://cdn.example.com/hero.jpg" />}
          helpText="Prefer authored media with descriptive alt text."
          state="saved"
        />
      );
    case 'content-operations-editor':
      return (
        <ContentOpsEditor
          header={<PageHeader title="Content operations" description="Reusable operations editor composition." />}
          sections={(
            <ContentOpsSection id="general" title="General settings" description="Shared sectioning for ops workflows.">
              <FormField label="Title" description="Use the same pattern for every editor." >
                <input aria-label="Content title" />
              </FormField>
            </ContentOpsSection>
          )}
          actionBar={<ContentOpsActionBar dirty actions={{ primary: { action: 'save' }, secondary: [{ action: 'refresh' }] }} />}
        />
      );
    case 'section-panels':
      return (
        <SectionPanel
          title="Reusable section panel"
          description="Shared bordered section for content chunks, including contract-driven body framing."
          presentation="fill"
          minHeight={280}
          contentAlign="start"
          contentJustify="start"
        >
          <p style={{ margin: 0 }}>
            Use this panel as the canonical bounded composition for grouped content.
          </p>
          <p style={{ margin: 'var(--mantine-spacing-sm) 0 0' }}>Fill-mode examples can keep state surfaces stable without local wrappers.</p>
        </SectionPanel>
      );
    case 'public-brand-footer':
      return (
        <PublicBrandFooter
          brandTitle="General Design System"
          description="Canonical footer for public surfaces."
          actions={<button type="button">Contact</button>}
          legal="© General Design System"
        />
      );
    case 'filter-drawer':
      return (
        <FilterDrawer
          opened
          onClose={() => {}}
          title="Filter set"
          description="One shared drawer contract for filters."
          applyAction={<SemanticButton action="save" />}
          resetAction={<SemanticButton action="reset" />}
        >
          <SectionPanel title="Filter controls" description="Scope, sort, and type remain bounded.">
            <p style={{ margin: 0 }}>Controls should stay compact and auditable.</p>
          </SectionPanel>
        </FilterDrawer>
      );
    case 'docs-code-blocks':
      return <DocsCodeBlock title="Usage" language="tsx" code="import { ListingCard } from '@doneisbetter/gds-core';" />;
    case 'cta-button-groups':
      return (
        <CtaButtonGroup
          primary={<button type="button">Save</button>}
          secondary={<button type="button">Cancel</button>}
          tertiary={<button type="button">Learn more</button>}
        />
      );
    case 'upload-surfaces':
      return <UploadDropzone title="Upload reference assets" description="Use the shared dropzone in upload-first flows." />;
    case 'access-summaries':
      return <AccessSummary title="Shared access summary" roles={['platform-ui', 'maintainers']} scope="Reference site" description="Access and scope stay explicit." />;
    case 'access-recovery-panels':
      return <AccessRecoveryPanel state="unauthenticated" onSignIn={() => {}} onBack={() => {}} />;
    case 'placeholder-panels':
      return (
        <PlaceholderPanel
          mode="placeholder"
          title="Under development section"
          description="This surface is intentionally not live yet."
          badge="Placeholder"
          footer="Use placeholder when governance requires visible placeholder state."
        />
      );
    case 'simple-data-tables':
      return (
        <SimpleDataTable
          columns={[
            { key: 'surface', header: 'Surface' },
            { key: 'coverage', header: 'Coverage' },
          ]}
          rows={[
            { id: '1', surface: 'DiscoveryShell', coverage: 'Live' },
            { id: '2', surface: 'ListingCard', coverage: 'Live' },
          ]}
          getRowKey={(row) => row.id}
        />
      );
    case 'stats-sections':
      return <StatsSection title="Threshold-aware statistics" belowThreshold thresholdMessage="Not enough data yet for this report." />;
    case 'alerts':
      return <StateBlock variant="error" compact title="Error guidance" description="Governed alert surfaces always include action context." />;
    case 'loaders-skeletons':
      return <FeatureBand loading columns={3} items={[]} />;
    case 'public-flow-shell':
      return (
        <PublicFlowShell
          stage={{
            id: 'public-flow',
            title: 'Public flow surface',
            description: 'Canonical stepper-like flow shell for staged experiences.',
            status: 'ready',
            actions: [
              { action: 'save', priority: 'primary' },
              { action: 'cancel', priority: 'secondary' },
            ],
          }}
          eyebrow="Flow Experience"
          exitAction={<a href="/general-design-system/patterns">Close</a>}
        />
      );
    case 'notifications':
      return (
        <SectionPanel title="Notification surface" description="Notifications remain contextual and explicit.">
          <ActionBar primary={{ action: 'notifications' }} />
        </SectionPanel>
      );
    case 'badges':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-sm)' }}>
          <StatusBadge status="success">Published</StatusBadge>
          <StatusBadge status="warning">Needs review</StatusBadge>
          <StatusBadge status="danger">Blocked</StatusBadge>
          <StatusBadge status="info">Info</StatusBadge>
          <StatusBadge status="neutral">Draft</StatusBadge>
        </div>
      );
    case 'modals':
      return (
        <ConfirmDialog
          opened
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete this pattern"
        >
          Use modals only when explicit focus and confirmation are required.
        </ConfirmDialog>
      );
    case 'drawers':
      return (
        <FilterDrawer
          opened
          onClose={() => {}}
          title="Filter drawer"
          description="Shared drawer contract for secondary operations."
        >
          <SectionPanel title="Filter slot" description="Use once across app surfaces.">
            <p style={{ margin: 0 }}>Drawer filters are reusable across local page surfaces.</p>
          </SectionPanel>
        </FilterDrawer>
      );
    case 'small-screen-priority':
      return (
        <ConsumerDashboardGrid columns={1}>
          <SectionPanel title="Small-screen priority" description="Prioritize next action, then secondary actions and helper content.">
            <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} tertiary={[{ action: 'preview' }]} />
          </SectionPanel>
        </ConsumerDashboardGrid>
      );
    case 'table-responsive-strategies':
      return (
        <DataTable
          data={[
            { id: '1', surface: 'DiscoveryShell', approach: 'card-first' },
            { id: '2', surface: 'DataTable', approach: 'grid' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'approach', label: 'Responsive approach' },
          ]}
          getRowKey={(row: Record<string, string>, index: number) => `${row.id}-${index}`}
        />
      );
    case 'mobile-action-density':
      return (
        <SectionPanel title="Mobile action density" description="Keep one primary action plus compact secondary stack on small viewports.">
          <ActionBar
            primary={{ action: 'save' }}
            secondary={[{ action: 'cancel' }, { action: 'export' }]}
            iconOnly={[{ action: 'notifications', ariaLabel: 'More actions' }]}
          />
        </SectionPanel>
      );
    case 'searchable-selection':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-sm)' }}>
          <ActionBar primary={{ action: 'search' }} secondary={[{ action: 'submit' }]} />
          <DataToolbar
            searchSlot={<input aria-label="Search selection" />}
            filterSlot={<input aria-label="Filter selection" />}
            sortSlot={<button type="button">Sort</button>}
            resetAction={<button type="button">Reset</button>}
            createAction={<button type="button">Create</button>}
            activeFilters={[{ label: 'Selected', onRemove: () => {} }]}
          />
          <DemoList items={['Open', 'Selected', 'Filtered']} />
        </div>
      );
    case 'vocabulary-extension-lane':
      return (
        <ActionBar
          vocabularyPacks={[vocab]}
          primary={{ action: 'camera:urgent' }}
          secondary={[{ action: 'refresh' }]}
          tertiary={[{ action: 'save' }]}
          iconOnly={[{ action: 'help' }]}
        />
      );
    default:
      return (
        <SectionPanel title="Live reference note" description="This documented pattern is represented through the shared component family.">
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
            { id: 'live', title: 'Live demonstrations', description: 'Documented patterns should be represented by shipped package surfaces or bounded examples.' },
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
