import {
  AccessSummary,
  AccessRecoveryPanel,
  ActionBar,
  AccentPanel,
  ArticleShell,
  AuthShell,
  BrowseSurface,
  ChartTokenPanel,
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
  EmptyState,
  EvidencePanel,
  FeatureBand,
  FilterDrawer,
  FoodMenuSection,
  FormField,
  GameBoardTile,
  GdsIcons,
  ListingCard,
  MapPanel,
  MediaCard,
  MediaField,
  MetricCard,
  PlaybackSurface,
  PeriodSelector,
  PlaceholderPanel,
  ProgressCard,
  ProductCard,
  PublicBrandFooter,
  PublicFlowShell,
  PublicFoodCard,
  PublicNav,
  PublicProductCard,
  PublicShell,
  PublicSiteFooter,
  ReferenceLinkGrid,
  ReferenceLocaleNotice,
  ReferenceSection,
  ReferenceThemeExplorer,
  ReportingSection,
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
  ThemeToggle,
} from '@doneisbetter/gds-core';
import {
  AppShell,
  ContentOpsActionBar,
  ContentOpsEditor,
  ContentOpsSection,
  DataTable,
  EditorScaffold,
  FormSection,
  InfoCard,
  PageHeader,
  ReferenceSiteShell,
  ResponsiveDataView,
  SemanticNavLink,
  StatsStrip,
  WorkspaceHeader,
} from '@doneisbetter/gds-admin';
import {
  getFamilyEntries,
  patternRegistry,
  type PatternFamily,
  type PatternRegistryEntry,
} from './pattern-registry';

const catalogEntryCount = patternRegistry.length;

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
    case 'theme-toggle':
      return (
        <SectionPanel title="Theme toggle" description="Use the package-owned color-scheme control instead of local switches.">
          <ThemeToggle />
        </SectionPanel>
      );
    case 'form-field':
      return (
        <FormField label="Canonical field" description="Visible label, helper text, and error placement are owned by GDS." error="Example validation message">
          <input aria-label="Canonical field" defaultValue="Reference value" />
        </FormField>
      );
    case 'game-board-tile':
      return (
        <div style={{ width: 120 }}>
          <GameBoardTile face="GDS" revealed matched={false} disabled={false} onPress={() => {}} />
        </div>
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
          <ProgressCard label="Coverage" value={`${catalogEntryCount} entries`} progress={100} progressLabel="Pattern-site coverage" />
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
    case 'media-card':
      return (
        <MediaCard
          title="Media compatibility card"
          description="Use only where the full PublicProductCard contract is not needed."
          status="Compatibility"
          image={<div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, var(--mantine-color-blue-1), var(--mantine-color-teal-1))' }} />}
          overlay={<StatusBadge status="info">Media</StatusBadge>}
          actions={[{ label: 'Preview' }]}
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
    case 'surface-presentation':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
          <SectionPanel title="Centered presentation" description="Shared presentation helper powers panel and state body alignment." presentation="centered" minHeight={220}>
            <StateBlock variant="empty" title="Centered state" description="No local wrapper needed for body alignment." compact />
          </SectionPanel>
          <SectionPanel title="Fill presentation" description="Fill mode keeps bounded state surfaces stable." presentation="fill" minHeight={180}>
            <p style={{ margin: 0 }}>Content fills the governed panel body without custom layout CSS.</p>
          </SectionPanel>
        </div>
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
          description="Canonical auth placement with provider errors, guest entry, and support fallback."
          intent="sign-in"
          error="The last provider attempt timed out. Choose a provider, retry, or continue as guest if your product allows it."
          socialAuth={<SocialAuthButtons layout="grid" providers={[{ id: 'google', policyNote: 'Approved by identity policy.' }, { id: 'github', tenantDisabledReason: 'Disabled by tenant policy.' }]} />}
          guestAction={<button type="button">Continue as guest</button>}
          supportAction={<button type="button">Contact support</button>}
          helper="Keep provider logic in the app; keep layout in GDS."
        >
          <p style={{ margin: 0 }}>Social auth remains part of the shared auth shell contract.</p>
        </AuthShell>
      );
    case 'social-auth-buttons':
      return <SocialAuthButtons layout="grid" providers={[{ id: 'google' }, { id: 'apple' }, { id: 'github', error: 'Provider returned an error.' }, { id: 'microsoft', tenantDisabledReason: 'Tenant policy disabled Microsoft.' }]} />;
    case 'provider-identity-buttons':
      return (
        <ProviderIdentityButtonGroup
          layout="grid"
          providers={[
            { provider: 'google', href: '/auth/google', policyNote: 'Provider color authority remains governed.' },
            { provider: 'apple', href: '/auth/apple' },
            { provider: 'github', href: '/auth/github', tenantDisabledReason: 'Disabled by tenant policy.' },
            { provider: 'email', href: '/auth/email', description: 'Fallback identity lane.' },
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
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
          <MediaField
            label="Hero image"
            description="Use the media-field contract for upload, URL entry, preview, status, and recovery."
            value="https://cdn.example.com/hero.jpg"
            preview={<img alt="Hero preview" src="https://picsum.photos/id/1015/640/360" />}
            uploadControl={<button type="button">Upload image</button>}
            urlInput={<input aria-label="Image URL" defaultValue="https://cdn.example.com/hero.jpg" />}
            helpText="Prefer authored media with descriptive alt text."
            policyText="Public assets must be licensed for reuse and include alt text before publishing."
            acceptedTypes="JPEG, PNG, WebP"
            maxSize="10 MB max"
            progress={64}
            replaceAction={<button type="button">Replace</button>}
            retryAction={<button type="button">Retry</button>}
            onReset={() => {}}
            onRemove={() => {}}
            state="uploading"
          />
          <MediaField
            label="Locked campaign logo"
            description="Readonly mode keeps preview and policy context visible while suppressing edit controls."
            value="https://cdn.example.com/logo.png"
            preview={<img alt="Campaign logo preview" src="https://picsum.photos/id/1025/640/360" />}
            policyText="This asset is controlled by the brand system owner."
            acceptedTypes="PNG"
            maxSize="2 MB max"
            readonly
          />
        </div>
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
    case 'admin-app-shell':
      return (
        <AppShell
          logoText="Admin GDS"
          primaryNavigation={<SemanticNavLink action="dashboard" href="/general-design-system/patterns/operations" active />}
          secondaryNavigation={<SemanticNavLink action="settings" href="/general-design-system/patterns" />}
          headerContext="Admin compatibility shell"
          showThemeToggle={false}
        >
          <SectionPanel title="Admin shell content" description="AppShell is backed by DiscoveryShell and remains an admin compatibility path.">
            <p style={{ margin: 0 }}>Use DiscoveryShell directly for new sidebar-first apps when possible.</p>
          </SectionPanel>
        </AppShell>
      );
    case 'editor-scaffold':
      return (
        <EditorScaffold
          header={<WorkspaceHeader title="Editor scaffold" description="Header, form, preview, settings, and footer stay in one scaffold." />}
          form={<FormSection title="Form" description="Canonical grouped editor body."><FormField label="Name"><input aria-label="Name" /></FormField></FormSection>}
          preview={<SectionPanel title="Preview" description="Bounded preview rail."><p style={{ margin: 0 }}>Preview content</p></SectionPanel>}
          settings={<SectionPanel title="Settings" description="Bounded settings rail."><p style={{ margin: 0 }}>Settings content</p></SectionPanel>}
          footer={<ContentOpsActionBar actions={{ primary: { action: 'save' }, secondary: [{ action: 'cancel' }] }} />}
          stickyFooter
        />
      );
    case 'form-section':
      return (
        <FormSection title="Publication settings" description="Use FormSection for grouped admin form content.">
          <FormField label="Visibility"><select aria-label="Visibility"><option>Public</option></select></FormField>
        </FormSection>
      );
    case 'workspace-header':
      return (
        <WorkspaceHeader
          breadcrumbs={[<a href="/general-design-system/patterns" key="patterns">Patterns</a>, <span key="operations">Operations</span>]}
          eyebrow="Workspace"
          title="Operations workspace"
          description="Governed workspace context and action placement."
          primaryAction={<SemanticButton action="save" />}
          secondaryActions={<SemanticButton action="preview" />}
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
    case 'public-site-footer':
      return (
        <PublicSiteFooter meta="Versioned public reference surface">
          Lightweight public footer for simple site meta and legal copy.
        </PublicSiteFooter>
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
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
          <UploadDropzone
            title="Upload reference assets"
            description="Use the shared dropzone in upload-first flows. GDS renders state and policy; the product owns storage."
            acceptedTypesLabel="PDF, PNG, JPEG"
            maxSizeLabel="5 MB max"
            selectedFiles={['brief.pdf']}
            policyText="Do not upload private customer data or unsupported file types."
            state="selected"
            retryAction={<button type="button">Retry upload</button>}
            removeAction={<button type="button">Remove asset</button>}
          />
          <UploadDropzone
            title="Logo upload failed"
            description="Error states must keep the next action visible and accessible."
            acceptedTypesLabel="PNG only"
            maxSizeLabel="2 MB max"
            policyText="Replace the file with a compressed PNG before retrying."
            state="too-large"
            error="The selected file is larger than the allowed size."
            retryAction={<button type="button">Choose another file</button>}
            removeAction={<button type="button">Remove file</button>}
          />
          <UploadDropzone
            title="Archived asset"
            description="Readonly upload surfaces preserve asset context without accepting new files."
            selectedFiles={['brand-mark.png']}
            readonly
          />
        </div>
      );
    case 'access-summaries':
      return <AccessSummary title="Shared access summary" roles={['platform-ui', 'maintainers']} scope="Reference site" state="permission-limited" owner="platform-ui" recoveryHint="Request the docs-admin scope to unlock private evidence." description="Access and scope stay explicit." />;
    case 'access-recovery-panels':
      return (
        <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
          <AccessRecoveryPanel state="unauthenticated" onSignIn={() => {}} onBack={() => {}} />
          <AccessRecoveryPanel state="timeout" onRetry={() => {}} onBack={() => {}} supportAction={{ action: 'help', onClick: () => {}, variant: 'subtle' }} />
        </div>
      );
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
    case 'admin-data-table':
      return (
        <DataTable
          data={[
            { id: '1', surface: 'Admin AppShell', status: 'Compatibility' },
            { id: '2', surface: 'ResponsiveDataView', status: 'Canonical' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'status', label: 'Status' },
          ]}
          getRowKey={(row: Record<string, string>) => row.id}
        />
      );
    case 'responsive-data-view':
      return (
        <ResponsiveDataView
          data={[
            { id: '1', surface: 'ListingCard', state: 'Live demo' },
            { id: '2', surface: 'MapPanel', state: 'Live demo' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'state', label: 'State' },
          ]}
          activeFilters={[{ label: 'Live demo', onRemove: () => {} }]}
          renderCard={(item) => (
            <SectionPanel title={String(item.surface)} description={String(item.state)}>
              <p style={{ margin: 0 }}>Card fallback is owned by the consumer slot, not the responsive contract.</p>
            </SectionPanel>
          )}
          getRowKey={(row) => String(row.id)}
        />
      );
    case 'stats-strip':
      return <StatsStrip stats={[{ label: 'Routes', value: 8, diff: 12 }, { label: 'Exports', value: 92, diff: 4 }, { label: 'Mismatches', value: 0, diff: 0 }]} />;
    case 'info-card':
      return <InfoCard title="Coverage" value="Export tracked" description="Admin information card with governed emphasis." icon={<GdsIcons.Info size="1rem" />} />;
    case 'semantic-nav-link':
      return (
        <SidebarNav ariaLabel="Semantic admin navigation">
          <SidebarNavSection label="Semantic">
            <SemanticNavLink action="dashboard" href="/general-design-system/patterns/data" active />
            <SemanticNavLink action="settings" href="/general-design-system/patterns" />
          </SidebarNavSection>
        </SidebarNav>
      );
    case 'empty-state':
      return <EmptyState title="Nothing to show yet" description="Compatibility empty state remains visible in the catalog." action={<SemanticButton action="add" />} />;
    case 'stats-sections':
      return <StatsSection title="Threshold-aware statistics" belowThreshold thresholdMessage="Not enough data yet for this report." />;
    case 'reporting-contracts':
      return (
        <ReportingSection
          title="Operational evidence report"
          description="A governed reporting section keeps period controls, metrics, chart summaries, evidence, and fallback tables in one predictable flow."
          state="partial"
          stateMessage="Two locations are missing from this period. The visible aggregate remains usable but must be disclosed."
          periodControl={(
            <PeriodSelector
              label="Reporting period"
              description="Use a canonical period control before inventing date-range chrome."
              value="last-30"
              timezone="Europe/Budapest"
              scope="All restaurants"
              filtered
              stale
              helperText="The consumer owns fetching and timezone math; GDS owns visible control structure."
              options={[
                { value: 'last-7', label: 'Last 7 days', description: 'Short-term operational view.' },
                { value: 'last-30', label: 'Last 30 days', description: 'Default board reporting view.' },
                { value: 'quarter', label: 'Quarter to date', description: 'Strategic planning view.' },
              ]}
            />
          )}
          metrics={(
            <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <MetricCard label="Orders" value="1,240" description="Visible aggregate." trend={{ label: '+8%', tone: 'positive' }} />
              <ProgressCard label="Evidence coverage" value="18 / 20" progress={90} progressLabel="Reporting sources" />
            </div>
          )}
          chart={(
            <ChartTokenPanel
              title="Orders by channel"
              description="Chart wrappers must provide text summaries, tokenized legends, and table fallback."
              summary="Online orders account for 62 percent of visible orders; in-store orders account for 38 percent."
              state="permission-limited"
              legend={[
                { label: 'Online', token: 'var(--mantine-color-blue-6)' },
                { label: 'In-store', token: 'var(--mantine-color-teal-6)' },
              ]}
              tableFallback={(
                <SimpleDataTable
                  columns={[{ key: 'channel', header: 'Channel' }, { key: 'share', header: 'Share' }]}
                  rows={[{ channel: 'Online', share: '62%' }, { channel: 'In-store', share: '38%' }]}
                />
              )}
            />
          )}
          evidence={(
            <EvidencePanel
              title="Evidence trail"
              description="Evidence panels disclose source, freshness, confidence, count, and access limitations."
              source="Point-of-sale export"
              freshness="Updated 12 minutes ago"
              confidence="High"
              evidenceCount={18}
              state="permission-limited"
              permissionNote="Private customer-level evidence is intentionally hidden from this aggregate."
              retryAction={<button type="button">Refresh evidence</button>}
            />
          )}
        />
      );
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
      <ReferenceSection
        title="How to use this family"
        description="Use docs routes for policy and usage guidance, then validate behavior against live demos where interaction/runtimes are relevant."
      >
        <ReferenceLinkGrid
          columns={3}
          items={[
            {
              id: 'install-path',
              title: 'Install path',
              description: 'Use the canonical package and provider setup before adopting patterns locally.',
              href: '/general-design-system/install',
            },
            {
              id: 'governance-rules',
              title: 'Governance rules',
              description: 'Review strict adoption boundaries, exceptions, and deletion expectations.',
              href: '/general-design-system/governance',
            },
            {
              id: 'live-runtime-proof',
              title: 'Live runtime proof',
              description: 'Use live demo routes to verify runtime behavior, not just static documentation copy.',
              href: '/general-design-system/live-demos',
            },
          ]}
        />
      </ReferenceSection>
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
