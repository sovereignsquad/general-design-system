import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AccessRecoveryPanel,
  AccessSummary,
  AccentPanel,
  ActionBar,
  ArticleShell,
  AuthShell,
  BrowseSurface,
  ConsumerDashboardGrid,
  ConsumerSection,
  createGdsVocabularyPack,
  CtaButtonGroup,
  DetailProfileShell,
  DiscoveryShell,
  DocsCodeBlock,
  DocsPageShell,
  EditorialCard,
  EditorialHero,
  FeatureBand,
  FilterDrawer,
  FoodMenuSection,
  GdsVocabulary,
  ListingCard,
  MapPanel,
  MediaCard,
  MediaField,
  MetricCard,
  PlaceholderPanel,
  PlaybackSurface,
  ProductCard,
  ProgressCard,
  PublicBrandFooter,
  PublicFlowShell,
  PublicFoodCard,
  PublicNav,
  PublicShell,
  SectionPanel,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SimpleDataTable,
  SocialAuthButtons,
  StateBlock,
  StatsSection,
  UploadDropzone,
  DataToolbar,
  ConfirmDialog,
} from '@doneisbetter/gds-core';
import {
  ContentOpsEditor,
  FormSection,
  PageHeader,
  WorkspaceHeader,
} from '@doneisbetter/gds-admin';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Drawer,
  Group,
  Modal,
  Notification,
  Paper,
  PasswordInput,
  Radio,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconBell,
  IconFilter,
  IconLayoutSidebarRightCollapse,
  IconPhoto,
  IconSearch,
  IconShare3,
} from '@tabler/icons-react';
import {
  getFamilyEntries,
  patternRegistry,
  type PatternCoverageStatus,
  type PatternFamily,
  type PatternRegistryEntry,
} from './pattern-registry';

const cameraVocabularyPack = createGdsVocabularyPack('camera', {
  moderate: {
    defaultMessage: 'Moderate',
    icon: GdsVocabulary.verify.icon,
  },
});

const familyMeta: Record<
  PatternFamily,
  { title: string; description: string; badgeColor: string }
> = {
  foundations: {
    title: 'Foundations',
    description:
      'Shells, controls, cards, workflow rules, and the baseline interaction grammar that every adopting product inherits.',
    badgeColor: 'teal',
  },
  public: {
    title: 'Public, Editorial, & Docs',
    description:
      'Public-shell, discovery, editorial, article, docs, and branded storytelling patterns for outward-facing experiences.',
    badgeColor: 'violet',
  },
  operations: {
    title: 'Operations',
    description:
      'Dashboard, section, editing, and operator-facing composition patterns for day-to-day platform workflows.',
    badgeColor: 'orange',
  },
  data: {
    title: 'Data & Search',
    description:
      'Search, filters, toolbars, tables, browse rhythm, reporting, and responsive data-view guidance.',
    badgeColor: 'blue',
  },
  access: {
    title: 'Access & Recovery',
    description:
      'Auth, social login, sharing, upload, recovery, blocked-state, and controlled hardware-adjacent flow patterns.',
    badgeColor: 'grape',
  },
  feedback: {
    title: 'Feedback & Messaging',
    description:
      'State communication, confirmations, alerts, notifications, placeholders, and responsive ergonomics.',
    badgeColor: 'red',
  },
};

function coverageTone(status: PatternCoverageStatus) {
  switch (status) {
    case 'live-demo':
      return { color: 'teal', label: 'Live demo' };
    case 'static-reference':
      return { color: 'blue', label: 'Reference guidance' };
    case 'pending-primitive':
      return { color: 'yellow', label: 'Pending primitive' };
    case 'blocked':
      return { color: 'red', label: 'Blocked' };
  }
}

function groupEntries(entries: PatternRegistryEntry[]) {
  return entries.reduce<Record<string, PatternRegistryEntry[]>>((acc, entry) => {
    acc[entry.section] ??= [];
    acc[entry.section].push(entry);
    return acc;
  }, {});
}

function PatternReferenceCard({ entry }: { entry: PatternRegistryEntry }) {
  const tone = coverageTone(entry.coverageStatus);

  return (
    <Paper id={entry.id} withBorder p="lg" radius="xl">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
          <Stack gap={4} maw={700}>
            <Title order={4}>{entry.title}</Title>
            <Text size="sm" c="dimmed">
              {entry.summary}
            </Text>
          </Stack>
          <Badge color={tone.color} variant="light">
            {tone.label}
          </Badge>
        </Group>
        <Group gap="xs" wrap="wrap">
          <Badge variant="outline">{entry.docSection}</Badge>
          {entry.importPath ? <Badge variant="outline">{entry.importPath}</Badge> : null}
          {entry.sourceComponent ? <Badge variant="outline">{entry.sourceComponent}</Badge> : null}
        </Group>
        {entry.coverageStatus === 'live-demo' ? (
          <PatternDemo entryId={entry.id} />
        ) : (
          <AccentPanel tone={entry.coverageStatus === 'blocked' ? 'red' : 'blue'} variant="soft-outline" title="Reference contract" badge={tone.label}>
            <Text size="sm">
              This entry is intentionally represented as a governed reference note rather than a dedicated interactive demo.
              The contract still belongs to the public website inventory and remains traceable from the SSOT.
            </Text>
          </AccentPanel>
        )}
      </Stack>
    </Paper>
  );
}

function CoverageLegend() {
  return (
    <Group gap="sm" wrap="wrap">
      {(['live-demo', 'static-reference', 'pending-primitive', 'blocked'] as PatternCoverageStatus[]).map((status) => {
        const tone = coverageTone(status);
        return (
          <Badge key={status} color={tone.color} variant="light">
            {tone.label}
          </Badge>
        );
      })}
    </Group>
  );
}

function PatternDemo({ entryId }: { entryId: string }) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const closeConfirm = () => setConfirmOpen(false);

  switch (entryId) {
    case 'page-headers':
      return (
        <PageHeader
          title="Operations release notes"
          eyebrow="Governed Header"
          description="Page headers expose location, purpose, and next actions without inventing page-local chrome."
          primaryAction={<SemanticButton action="preview" size="sm" />}
        />
      );
    case 'discovery-shell':
    case 'sidebar-navigation':
    case 'action-bar':
      return (
        <Box style={{ minHeight: 420, overflow: 'hidden', borderRadius: 20, border: '1px solid var(--mantine-color-default-border)' }}>
          <DiscoveryShell
            header={<WorkspaceHeader title="Pattern Registry" description="Governed discovery shell with sidebar information architecture." />}
            sidebar={(
              <SidebarNav ariaLabel="Pattern navigation">
                <SidebarNavSection label="Foundations">
                  <SidebarNavItem action="dashboard" href="#layout" active />
                  <SidebarNavItem action="grid" href="#cards" />
                  <SidebarNavItem action="settings" href="#actions" />
                </SidebarNavSection>
                <SidebarNavSection label="Account" pushToBottom>
                  <SidebarNavItem action="notifications" href="#updates" />
                  <SidebarNavItem action="logout" component="button" />
                </SidebarNavSection>
              </SidebarNav>
            )}
          >
            <Stack gap="lg">
              <ActionBar
                primary={{ action: 'save', size: 'sm' }}
                secondary={[{ action: 'cancel', size: 'sm' }]}
                tertiary={[{ action: 'preview', size: 'sm' }]}
                iconOnly={[{ action: 'settings' }]}
              />
              <Text size="sm" c="dimmed">
                The same shell owns desktop persistence, mobile collapse, semantic actions, and governed spacing.
              </Text>
            </Stack>
          </DiscoveryShell>
        </Box>
      );
    case 'buttons':
      return (
        <Group gap="sm" wrap="wrap">
          <SemanticButton action="save" />
          <SemanticButton action="cancel" variant="light" />
          <SemanticButton action="preview" variant="subtle" />
          <SemanticButton action="delete" color="red" />
        </Group>
      );
    case 'choice-chips':
      return (
        <Chip.Group multiple defaultValue={['public', 'mobile']}>
          <Group gap="xs">
            <Chip value="public">Public</Chip>
            <Chip value="admin">Admin</Chip>
            <Chip value="mobile">Mobile-safe</Chip>
            <Chip value="strict">Strict mode ready</Chip>
          </Group>
        </Chip.Group>
      );
    case 'icon-buttons':
      return (
        <Group gap="sm">
          <ActionIcon variant="light" radius="xl" size="lg" aria-label="Open search">
            <IconSearch size="1rem" />
          </ActionIcon>
          <ActionIcon variant="default" radius="xl" size="lg" aria-label="Open filters">
            <IconFilter size="1rem" />
          </ActionIcon>
          <ActionIcon variant="subtle" radius="xl" size="lg" aria-label="Share page">
            <IconShare3 size="1rem" />
          </ActionIcon>
        </Group>
      );
    case 'inputs':
      return (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <TextInput label="Name" placeholder="Runtime owner" />
          <TextInput label="Search" placeholder="Search patterns" leftSection={<IconSearch size="1rem" />} />
          <PasswordInput label="Password" placeholder="Enter secure password" />
        </SimpleGrid>
      );
    case 'selects-combobox':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Select
            label="Route family"
            defaultValue="public"
            data={[
              { value: 'foundations', label: 'Foundations' },
              { value: 'public', label: 'Public' },
              { value: 'operations', label: 'Operations' },
            ]}
          />
          <Select
            searchable
            label="Searchable selection"
            placeholder="Choose a governed surface"
            data={[
              'DiscoveryShell',
              'ActionBar',
              'ListingCard',
              'MapPanel',
              'DetailProfileShell',
            ]}
          />
        </SimpleGrid>
      );
    case 'checkboxes-radios':
      return (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Checkbox defaultChecked label="Enable shared compliance checks" />
          <Radio.Group label="Deployment track" defaultValue="npm">
            <Stack gap={6} mt="xs">
              <Radio value="npm" label="npm registry" />
              <Radio value="release" label="GitHub release bundle fallback" />
            </Stack>
          </Radio.Group>
          <Switch label="Immediate rollout" defaultChecked />
        </SimpleGrid>
      );
    case 'product-cards':
      return (
        <ProductCard
          title="Consumer migration package"
          description="Shared package adoption and semantic surface replacement for a downstream product."
          status={<Badge color="teal">Ready</Badge>}
          metadata={[
            { label: 'Runtime', value: 'React 19' },
            { label: 'Mantine', value: '8.3.x / 9.2.x' },
          ]}
          secondaryActions={[{ label: 'Open plan' }, { label: 'Review details' }]}
        />
      );
    case 'public-product-cards':
      return (
        <MediaCard
          title="Weekend Discovery Bundle"
          description="Media-first public card with pricing hierarchy, helper copy, and one governed mobile action."
          status="Published"
          image={(
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop"
              alt="Weekend discovery bundle"
              style={{ width: '100%', height: 180, objectFit: 'cover' }}
            />
          )}
        />
      );
    case 'accent-panels':
      return (
        <AccentPanel tone="violet" title="Shared accent surface" badge="Readability preserved">
          <Text size="sm">
            Accent panels keep emphasis readable in light and dark modes without raw custom background layers.
          </Text>
        </AccentPanel>
      );
    case 'metric-cards':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <MetricCard
            label="Catalog coverage"
            value="64 entries"
            description="Tracked directly from the pattern registry."
            trend={{ label: 'Live growth', tone: 'positive' }}
          />
          <ProgressCard
            label="Website alignment"
            value="Registry-backed"
            progress={86}
            progressLabel="Coverage milestone"
            description="Family pages are moving toward one-to-one documented visibility."
          />
        </SimpleGrid>
      );
    case 'data-toolbars':
      return (
        <DataToolbar
          searchSlot={<TextInput placeholder="Search adopters" leftSection={<IconSearch size="1rem" />} />}
          filterSlot={<Button variant="default" leftSection={<IconFilter size="1rem" />}>Filters</Button>}
          sortSlot={<Select placeholder="Sort" data={['Newest', 'Coverage', 'Name']} />}
          resetAction={<Button variant="subtle">Reset</Button>}
          createAction={<SemanticButton action="add" size="sm" />}
          activeFilters={[
            { label: 'Mantine 9' },
            { label: 'Public route' },
          ]}
        />
      );
    case 'state-blocks':
      return (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <StateBlock variant="loading" title="Loading pattern coverage" description="The registry is synchronizing route metadata." compact />
          <StateBlock variant="empty" title="No active filters" description="Adjust scope or broaden the route family." compact />
          <StateBlock variant="permission" title="Restricted surface" description="This demo requires privileged access in a consumer product." compact />
        </SimpleGrid>
      );
    case 'listing-card':
      return (
        <ListingCard
          title="Danube Evening Run Club"
          description="Unified listing contract with metadata rows, disclosure, and governed share/save affordances."
          featured
          sponsoredDisclosure="Sponsored placement. Selection criteria belong to the host product."
          price="Free"
          metadata={[
            { id: 'date', label: 'Date', value: 'June 14' },
            { id: 'time', label: 'Time', value: '18:30' },
            { id: 'location', label: 'Location', value: 'Budapest' },
          ]}
          primaryAction={<SemanticButton action="preview" size="sm" />}
          saveAction={{ action: 'save' }}
          shareAction={{ action: 'forward' }}
        />
      );
    case 'share-button-group':
      return (
        <ShareButtonGroup
          url="https://sovereignsquad.github.io/general-design-system/"
          title="General Design System"
          text="Explore the pattern catalog and install contract."
          channels={['native', 'copy', 'mail', 'linkedin', 'x']}
        />
      );
    case 'public-food-card':
      return (
        <PublicFoodCard
          title="Roasted Tomato Soup"
          description="Basil oil, sour cream, and crusty bread."
          price="EUR 7.50"
          state="preorder"
          helperText="Reserve before Friday 18:00"
          pickupNote="Saturday 09:00-12:00"
          freshnessNote="Best served warm"
          quantityHint="12 portions left"
          markers={[
            { id: 'vegetarian', label: 'Vegetarian', tone: 'positive' },
            { id: 'weekly', label: 'Weekly batch', tone: 'warning' },
          ]}
          metadata={[
            { id: 'allergens', label: 'Contains dairy' },
            { id: 'portion', label: '500 ml' },
          ]}
          primaryAction={<Button>Reserve</Button>}
        />
      );
    case 'food-menu-section':
      return (
        <FoodMenuSection
          eyebrow="Weekly menu"
          title="Saturday Kitchen Drop"
          description="Grouped menu composition built on the canonical food-card contract."
          sectionNote="Pickup only this week. All dishes are prepared the same morning."
          categories={[
            {
              id: 'soups',
              title: 'Soups',
              helperNote: 'Prepared in small weekly batches.',
              items: [
                {
                  id: 'tomato-soup',
                  title: 'Roasted Tomato Soup',
                  description: 'Basil oil and crusty bread.',
                  price: 'EUR 7.50',
                  state: 'preorder',
                  helperText: 'Reserve before Friday 18:00',
                  primaryAction: <Button>Reserve</Button>,
                },
              ],
            },
            {
              id: 'desserts',
              title: 'Desserts',
              items: [
                {
                  id: 'pistachio-bun',
                  title: 'Pistachio Morning Bun',
                  description: 'Laminated pastry with pistachio cream.',
                  price: 'EUR 4.80',
                  state: 'limited',
                  quantityHint: '18 left',
                  primaryAction: <Button>Order</Button>,
                },
              ],
            },
          ]}
        />
      );
    case 'map-panel':
      return (
        <MapPanel
          title="Discovery map panel"
          description="Sanctioned embed framing with semantic actions and explicit fallback states."
          actions={{
            primary: { action: 'preview', size: 'sm' },
            tertiary: [{ action: 'refresh', size: 'sm' }],
          }}
          iframeSrc="https://www.openstreetmap.org/export/embed.html?bbox=19.03%2C47.49%2C19.08%2C47.52&layer=mapnik"
          embedTitle="Budapest discovery map"
        />
      );
    case 'detail-profile-shell':
      return (
        <DetailProfileShell
          mode="drawer"
          hero={(
            <Stack gap={4}>
              <Badge color="violet" variant="light">Drawer mode</Badge>
              <Title order={4}>Operator detail rail</Title>
              <Text size="sm" c="dimmed">Shared detail shell with hero, sections, actions, and related content.</Text>
            </Stack>
          )}
          actions={<ActionBar primary={{ action: 'edit', size: 'sm' }} tertiary={[{ action: 'preview', size: 'sm' }]} />}
          sections={[
            <SectionPanel key="status" title="Status" description="Current operational state.">Featured listing, review scheduled, sponsor disclosure active.</SectionPanel>,
            <SectionPanel key="owner" title="Owner" description="Surface authority.">Camera discovery operations.</SectionPanel>,
          ]}
        />
      );
    case 'public-flow-shell':
      return (
        <PublicFlowShell
          eyebrow="Public flow"
          stage={{
            id: 'review',
            title: 'Review your capture',
            description: 'Consent, review, share, and recovery states follow one flow-shell contract.',
            status: 'ready',
            body: (
              <Paper withBorder p="md" radius="lg">
                <Text size="sm">Captured image preview, captions, and confirmation copy render inside the governed stage body.</Text>
              </Paper>
            ),
            notice: 'The live hardware preview remains a bounded runtime slot.',
            actions: [
              { action: 'cancel', priority: 'secondary' },
              { action: 'send', priority: 'primary' },
            ],
          }}
          hardwareSurface={(
            <Paper withBorder p="xl" radius="lg" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text size="sm" c="dimmed">Runtime hardware preview slot</Text>
            </Paper>
          )}
        />
      );
    case 'playback-surface':
      return (
        <PlaybackSurface
          title="Storefront playback"
          state="playing"
          mode="kiosk"
          statusMessage="Looping seasonal menu highlights on a public kiosk display."
          media={(
            <Paper withBorder p="xl" radius="lg" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text size="sm" c="dimmed">Timed media presenter slot</Text>
            </Paper>
          )}
          controls={<Button variant="default" size="xs">Pause</Button>}
          overlays={<Badge color="teal" variant="light">Kiosk mode</Badge>}
        />
      );
    case 'public-shells':
      return (
        <Box style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 20, overflow: 'hidden' }}>
          <PublicShell
            brand={<Text fw={800}>GDS Public</Text>}
            navItems={[
              { id: 'overview', label: 'Overview', href: '#overview' },
              { id: 'patterns', label: 'Patterns', href: '#patterns' },
              { id: 'install', label: 'Install', href: '#install' },
            ]}
            activeNavId="patterns"
            actions={<Button variant="light">Start</Button>}
            mobileNavigationMode="inline-collapse"
            mobileNavigation={(
              <>
                <Anchor href="#overview">Overview</Anchor>
                <Anchor href="#patterns">Patterns</Anchor>
                <Anchor href="#install">Install</Anchor>
              </>
            )}
            footer="Governed public shell with readable content width and explicit mobile navigation behavior."
          >
            <AccentPanel tone="blue" title="Public shell contract" badge="Live demo">
              Public pages inherit one brand slot, one navigation rhythm, and one governed content width policy.
            </AccentPanel>
          </PublicShell>
        </Box>
      );
    case 'public-nav':
      return (
        <PublicNav
          activeId="patterns"
          items={[
            { id: 'overview', label: 'Overview', href: '#overview' },
            { id: 'patterns', label: 'Patterns', href: '#patterns' },
            { id: 'docs', label: 'Docs', href: '#docs' },
          ]}
        />
      );
    case 'auth-shells':
      return (
        <AuthShell
          title="Welcome back"
          description="Canonical auth shell with consistent helper and provider placement."
          helper="If your organization requires SSO, continue with the approved identity provider below."
        >
          <Stack gap="sm">
            <TextInput label="Email" placeholder="name@company.com" />
            <PasswordInput label="Password" placeholder="Enter your password" />
            <Button>Continue</Button>
          </Stack>
        </AuthShell>
      );
    case 'social-auth-buttons':
      return (
        <SocialAuthButtons
          providers={[
            { id: 'google', href: '#google' },
            { id: 'apple', href: '#apple' },
            { id: 'github', href: '#github', description: 'For developer workspaces' },
          ]}
          layout="grid"
        />
      );
    case 'article-shells':
      return (
        <ArticleShell
          eyebrow="Governed article"
          title="Release hardening notes"
          lead="Article shells preserve readable width, metadata, and optional side rail behavior."
          meta={<Badge variant="light">May 2026</Badge>}
          sideRail={<AccentPanel tone="gray" title="Side rail">Link sets, notes, or summary cards live here.</AccentPanel>}
        >
          <Text>The article body stays focused, while the side rail remains optional and never owns the main narrative.</Text>
        </ArticleShell>
      );
    case 'docs-page-shell':
      return (
        <DocsPageShell
          breadcrumbs={[
            { label: 'Docs', href: '#docs' },
            { label: 'Patterns' },
          ]}
          eyebrow="Reference"
          title="Pattern installation"
          lead="Docs shells add breadcrumbs, next-step links, and side-rail support without redefining article readability."
          footerNext={{ label: 'Next: Governance', href: '#next' }}
          sideRail={<DocsCodeBlock title="Install" language="bash" code="npm install @doneisbetter/gds" />}
        >
          <Text>Use the docs page shell when the surface is reference-heavy and benefits from breadcrumbs plus stepwise continuation.</Text>
        </DocsPageShell>
      );
    case 'editorial-hero':
      return (
        <EditorialHero
          eyebrow="Public launch"
          title="Pattern catalog with governed public composition"
          description="Editorial hero sections unify text/media hierarchy, CTA emphasis, and deterministic mobile collapse."
          actions={[
            { label: 'Explore patterns', href: '#patterns', variant: 'primary' },
            { label: 'Read install guide', href: '#install', variant: 'secondary' },
          ]}
          meta={[
            { id: 'ssot', label: 'Aligned to COMPONENTS_AND_PATTERNS.md' },
            { id: 'runtime', label: 'GitHub Pages demo' },
          ]}
          media={(
            <Box style={{ height: 280, background: 'linear-gradient(135deg, var(--mantine-color-violet-2), var(--mantine-color-teal-2))', borderRadius: 'var(--mantine-radius-xl)' }} />
          )}
          mediaFade="background-match"
        />
      );
    case 'feature-band':
      return (
        <FeatureBand
          items={[
            { id: 'trust', title: 'Package-first adoption', description: 'Install directly from npm and keep one UI authority.' },
            { id: 'governance', title: 'Compliance-ready', description: 'Shared lint and manifest enforcement stay part of the contract.' },
            { id: 'runtime', title: 'Server/client safe', description: 'Use the right entrypoints for Next.js, Vite, and static consumers.' },
          ]}
        />
      );
    case 'browse-surface':
      return (
        <BrowseSurface
          eyebrow="Discovery"
          title="Weekend activities"
          description="Browse surfaces own result summary, filters, scope, and mobile filter entry rhythm."
          resultCount={24}
          scopeOptions={[
            { id: 'all', label: 'All', active: true },
            { id: 'kids', label: 'Kids' },
            { id: 'teens', label: 'Teens' },
          ]}
          toolbar={{
            searchSlot: <TextInput placeholder="Search by title" leftSection={<IconSearch size="1rem" />} />,
            filterSlot: <Button variant="default" leftSection={<IconFilter size="1rem" />}>Discipline</Button>,
          }}
          activeFilters={[{ id: 'borough', label: 'Budapest' }, { id: 'free', label: 'Free' }]}
          filterDrawer={
            <Button variant="default" onClick={() => setFilterDrawerOpen(true)} leftSection={<IconLayoutSidebarRightCollapse size="1rem" />}>
              Open filters
            </Button>
          }
          content={
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <EditorialCard title="Danube Run Club" description="Community-paced city running and beginner-friendly intervals." />
              <EditorialCard title="Saturday Art Camp" description="Hands-on illustration workshop with guided portfolio review." tone="cool" />
            </SimpleGrid>
          }
        />
      );
    case 'editorial-cards':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <EditorialCard title="Migration playbook" description="Reference guidance for moving to direct package consumption." badge="Docs" />
          <EditorialCard title="Pattern launch" description="Public announcement card for new reference-site coverage." tone="warm" variant="featured" />
        </SimpleGrid>
      );
    case 'consumer-sections':
      return (
        <ConsumerSection
          title="Account summary"
          description="Shared section shell for member or consumer-facing surfaces."
          action={<Button variant="default" size="xs">Manage</Button>}
        >
          <Text size="sm">Keep title, description, action, and content area rhythm consistent across consumer dashboards.</Text>
        </ConsumerSection>
      );
    case 'consumer-dashboard-grid':
      return (
        <ConsumerDashboardGrid columns={2}>
          <MetricCard label="Membership" value="Active" description="Global access remains in good standing." />
          <SectionPanel title="Alerts" description="Shared panel rhythm for account notices.">
            <Text size="sm">No action required today.</Text>
          </SectionPanel>
        </ConsumerDashboardGrid>
      );
    case 'media-fields':
      return (
        <MediaField
          label="Feature image"
          description="Use one contract for upload, URL, preview, and remove/reset behavior."
          state="selected"
          preview={(
            <Box style={{ height: 160, borderRadius: 12, background: 'linear-gradient(135deg, var(--mantine-color-blue-2), var(--mantine-color-violet-2))' }} />
          )}
          uploadControl={<Button variant="light" leftSection={<IconPhoto size="1rem" />}>Upload replacement</Button>}
          urlInput={<TextInput label="Remote image URL" placeholder="https://..." />}
          helpText="Accepted formats: JPG, PNG, WebP."
          policyText="Media must remain safe for public browsing."
          onReset={() => {}}
          onRemove={() => {}}
        />
      );
    case 'content-operations-editor':
      return (
        <ContentOpsEditor
          header={<PageHeader title="Site settings" description="Shared content-operations editor scaffold." />}
          context={<AccentPanel tone="gray" title="Context">Changes apply to the public docs site immediately after publish.</AccentPanel>}
          sections={
            <>
              <SectionPanel title="SEO" description="Metadata and summary controls.">
                <TextInput label="Meta title" placeholder="General Design System" />
              </SectionPanel>
              <SectionPanel title="Feature flags" description="Govern rollout behavior.">
                <Switch label="Enable strict pattern coverage mode" defaultChecked />
              </SectionPanel>
            </>
          }
          preview={<Paper withBorder p="md" radius="lg">Preview rail</Paper>}
          settings={<Paper withBorder p="md" radius="lg">Settings rail</Paper>}
          actionBar={<ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} />}
        />
      );
    case 'section-panels':
      return (
        <SectionPanel
          title="Governed panel framing"
          description="Section panels unify title, description, action placement, and optional divider rhythm."
          action={<Button variant="default" size="xs">Open</Button>}
        >
          <Text size="sm">Use this instead of local `SectionCard` wrappers on settings, detail, and dashboard surfaces.</Text>
        </SectionPanel>
      );
    case 'public-brand-footer':
      return (
        <PublicBrandFooter
          layoutVariant="balanced-quote"
          brandTitle={<Text fw={800}>Sovereign Squad</Text>}
          description="The public footer can carry narrative, actions, and a secondary reflective slot without diverging from GDS."
          secondary={<Text size="sm">“Design systems earn trust through operational clarity.”</Text>}
          actions={<CtaButtonGroup primary={<Button>Adopt GDS</Button>} secondary={<Button variant="default">Read docs</Button>} />}
          legal={<Text size="xs" c="dimmed">Open source, package-first, governance-backed.</Text>}
        />
      );
    case 'filter-drawer':
      return (
        <>
          <Button variant="default" onClick={() => setFilterDrawerOpen(true)} leftSection={<IconFilter size="1rem" />}>
            Open mobile filters
          </Button>
          <FilterDrawer
            opened={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filters"
            description="Mobile and operational filters use the same governed drawer contract."
            mode="bottom-sheet"
            primaryAction={<Button onClick={() => setFilterDrawerOpen(false)}>Apply</Button>}
            secondaryAction={<Button variant="default">Reset</Button>}
            closeAction={<Button variant="subtle" onClick={() => setFilterDrawerOpen(false)}>Close</Button>}
          >
            <Checkbox label="Only public-ready patterns" defaultChecked />
            <Checkbox label="Strict-mode compatible" />
          </FilterDrawer>
        </>
      );
    case 'docs-code-blocks':
      return (
        <DocsCodeBlock
          title="Install command"
          language="bash"
          code={`npm install @doneisbetter/gds\nnpm install -D @doneisbetter/gds-compliance @doneisbetter/gds-eslint-config`}
        />
      );
    case 'cta-button-groups':
      return (
        <CtaButtonGroup
          primary={<Button>Install now</Button>}
          secondary={<Button variant="default">Read docs</Button>}
          tertiary={<Button variant="subtle">View release assets</Button>}
        />
      );
    case 'upload-surfaces':
      return (
        <UploadDropzone
          title="Drag and drop pattern assets"
          description="Upload surfaces define drag state, validation, replace, and remove behavior."
          accept="image/*"
          onFilesSelected={(files: File[]) =>
            notifications.show({
              title: 'Demo upload selected',
              message: `Loaded ${files[0]?.name ?? 'one file'} into the local demo state.`,
              color: 'teal',
            })
          }
        />
      );
    case 'access-summaries':
      return (
        <AccessSummary
          title="moldovancsaba"
          roles={['System Owner', 'Global Admin']}
          scope="All ecosystem repositories"
          description="Role, scope, and ownership cues stay explicit and non-color dependent."
        />
      );
    case 'access-recovery-panels':
      return (
        <AccessRecoveryPanel
          state="expired-session"
          onSignIn={() => {}}
          onRetry={() => {}}
          onBack={() => {}}
        />
      );
    case 'placeholder-panels':
      return (
        <PlaceholderPanel
          title="Pattern still maturing"
          description="This surface is represented honestly while the live scenario library catches up."
          badge="Reference only"
          mode="placeholder"
        />
      );
    case 'simple-data-tables':
      return (
        <SimpleDataTable
          columns={[
            { key: 'repo', header: 'Repository' },
            { key: 'status', header: 'Status' },
            { key: 'line', header: 'Version line' },
          ]}
          rows={[
            { repo: 'sso', status: 'Release-aligned', line: '2.6.4' },
            { repo: 'kidex', status: 'Release-aligned', line: '2.6.4' },
          ]}
        />
      );
    case 'stats-sections':
      return (
        <StatsSection title="Adoption confidence">
          <ConsumerDashboardGrid columns={2}>
            <MetricCard label="Patterns represented" value={`${patternRegistry.length}`} description="All documented entries are visible in the registry." />
            <MetricCard label="Live demos" value={`${patternRegistry.filter((entry) => entry.coverageStatus === 'live-demo').length}`} description="Governed live references already available in the site." />
          </ConsumerDashboardGrid>
        </StatsSection>
      );
    case 'alerts':
      return (
        <Alert color="yellow" title="Governed warning" icon={<IconAlertTriangle size="1rem" />}>
          This alert explains the state and the next action instead of acting as ornamental decoration.
        </Alert>
      );
    case 'loaders-skeletons':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap="sm">
            <Skeleton height={16} width={120} radius="xl" />
            <Skeleton height={44} radius="md" />
            <Skeleton height={44} radius="md" />
          </Stack>
          <StateBlock variant="loading" title="Action in progress" description="Longer operations still need text status, not only a spinner." compact />
        </SimpleGrid>
      );
    case 'notifications':
      return (
        <Stack gap="md">
          <Notification color="teal" title="Shared notification" icon={<IconBell size="1rem" />}>
            Use notifications for transient cross-surface feedback, not as the only place a critical error appears.
          </Notification>
          <Button
            variant="light"
            onClick={() =>
              notifications.show({
                title: 'Pattern demo notification',
                message: 'Transient feedback can be triggered without leaving the current surface.',
                color: 'teal',
              })
            }
          >
            Trigger notification
          </Button>
        </Stack>
      );
    case 'badges':
      return (
        <Group gap="sm" wrap="wrap">
          <Badge color="teal" variant="light">Live demo</Badge>
          <Badge color="blue" variant="light">Reference guidance</Badge>
          <Badge color="yellow" variant="light">Pending primitive</Badge>
          <Badge color="red" variant="light">Blocked</Badge>
        </Group>
      );
    case 'modals':
      return (
        <>
          <Button variant="default" onClick={() => setModalOpen(true)}>Open governed modal</Button>
          <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Modal contract" centered>
            <Stack gap="md">
              <Text size="sm">Modals support focused edits and confirmations, trap focus, and avoid stacking.</Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setModalOpen(false)}>Close</Button>
              </Group>
            </Stack>
          </Modal>
        </>
      );
    case 'drawers':
      return (
        <>
          <Button variant="default" onClick={() => setFilterDrawerOpen(true)}>Open reference drawer</Button>
          <Drawer opened={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} title="Secondary panel">
            <Text size="sm">Drawers support filters and secondary panels with explicit desktop/mobile width behavior.</Text>
          </Drawer>
        </>
      );
    case 'vocabulary-extension-lane':
      return (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <SemanticButton action="camera:moderate" vocabularyPacks={[cameraVocabularyPack]} />
          <ActionBar primary={{ action: 'camera:moderate' }} vocabularyPacks={[cameraVocabularyPack]} />
          <Paper withBorder p="sm" radius="lg">
            <SidebarNav ariaLabel="Vocabulary extension preview">
              <SidebarNavSection label="Product actions">
                <SidebarNavItem action="camera:moderate" href="#moderate" vocabularyPacks={[cameraVocabularyPack]} />
              </SidebarNavSection>
            </SidebarNav>
          </Paper>
        </SimpleGrid>
      );
    case 'destructive-actions':
      return (
        <>
          <Button color="red" onClick={() => setConfirmOpen(true)}>Delete legacy CSS</Button>
          <ConfirmDialog
            opened={confirmOpen}
            onClose={closeConfirm}
            onConfirm={() => {
              setConfirmLoading(true);
              setTimeout(() => {
                setConfirmLoading(false);
                closeConfirm();
              }, 900);
            }}
            title="Purge legacy stylesheets?"
            loading={confirmLoading}
          >
            High-impact destructive actions must restate their scope and require explicit confirmation.
          </ConfirmDialog>
        </>
      );
    default:
      return null;
  }
}

export function PatternsIndexPage() {
  const catalog = useMemo(() => {
    return (Object.keys(familyMeta) as PatternFamily[]).map((family) => {
      const entries = getFamilyEntries(family);
      return {
        family,
        ...familyMeta[family],
        total: entries.length,
        live: entries.filter((entry) => entry.coverageStatus === 'live-demo').length,
      };
    });
  }, []);

  return (
    <Stack gap="xl">
      <PageHeader
        title="Pattern Catalog"
        description="A registry-backed public reference for every component and interaction contract documented in COMPONENTS_AND_PATTERNS.md."
        primaryAction={
          <Button component={Link} to="/install" variant="light">
            Install GDS
          </Button>
        }
      />

      <AccentPanel tone="green" title="Coverage model" badge={`${patternRegistry.length} documented entries`}>
        <Stack gap="sm">
          <Text size="sm">
            The catalog is grouped by family, linked back to the SSOT, and explicit about whether each entry is a live demo,
            governed reference, pending primitive, or blocked surface.
          </Text>
          <CoverageLegend />
        </Stack>
      </AccentPanel>

      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
        {catalog.map((item) => (
          <Paper key={item.family} withBorder p="xl" radius="xl">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Title order={3}>{item.title}</Title>
                  <Text size="sm" c="dimmed">
                    {item.description}
                  </Text>
                </Stack>
                <Badge color={item.badgeColor} variant="light">
                  {item.total} entries
                </Badge>
              </Group>
              <Group gap="sm" wrap="wrap">
                <Badge color="teal" variant="light">{item.live} live demos</Badge>
                <Badge variant="outline">{item.total - item.live} guided references</Badge>
              </Group>
              <Button component={Link} to={`/patterns/${item.family}`} variant="default">
                Open {item.title}
              </Button>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export function PatternFamilyPage({ family }: { family: PatternFamily }) {
  const entries = getFamilyEntries(family);
  const grouped = groupEntries(entries);
  const meta = familyMeta[family];

  return (
    <Stack gap="xl">
      <PageHeader
        title={meta.title}
        description={meta.description}
        primaryAction={
          <Button component={Link} to="/patterns" variant="light">
            Back to catalog
          </Button>
        }
      />

      <CoverageLegend />

      {Object.entries(grouped).map(([section, sectionEntries]) => (
        <FormSection
          key={section}
          title={section}
          description={`Coverage for ${sectionEntries.length} documented ${sectionEntries.length === 1 ? 'entry' : 'entries'} in the ${meta.title.toLowerCase()} family.`}
        >
          <Stack gap="lg">
            {sectionEntries.map((entry) => (
              <PatternReferenceCard key={entry.id} entry={entry} />
            ))}
          </Stack>
        </FormSection>
      ))}
    </Stack>
  );
}
