import { useState } from 'react';
import {
  AccessSummary,
  ActionBar,
  AuthShell,
  ConfirmDialog,
  createGdsVocabularyPack,
  DetailProfileShell,
  DiscoveryShell,
  FoodMenuSection,
  GdsVocabulary,
  ListingCard,
  MapPanel,
  MediaCard,
  MetricCard,
  PlaybackSurface,
  ProgressCard,
  ProductCard,
  PublicFlowShell,
  PublicFoodCard,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SocialAuthButtons,
  StateBlock,
  UploadDropzone,
  type SemanticAction,
} from '@doneisbetter/gds-core';
import {
  DataTable,
  FormSection,
  PageHeader,
  ResponsiveDataView,
  WorkspaceHeader,
} from '@doneisbetter/gds-admin';
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconActivity,
  IconShieldCheck,
} from '@tabler/icons-react';

const cameraVocabularyPack = createGdsVocabularyPack('camera', {
  moderate: {
    defaultMessage: 'Moderate',
    icon: GdsVocabulary.verify.icon,
  },
});

function SvgLineChart() {
  return (
    <Box style={{ width: '100%', height: 240, position: 'relative' }}>
      <svg viewBox="0 0 500 200" width="100%" height="100%">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mantine-color-teal-5)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--mantine-color-teal-9)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1="40" y1="20" x2="480" y2="20" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="120" x2="480" y2="120" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="170" x2="480" y2="170" stroke="var(--mantine-color-gray-3)" />
        <path d="M 40 170 Q 150 130 250 80 T 480 30" fill="none" stroke="var(--mantine-color-teal-6)" strokeWidth="3.5" />
        <path d="M 40 170 Q 150 130 250 80 T 480 30 L 480 170 L 40 170 Z" fill="url(#chartGradient)" />
        <circle cx="40" cy="170" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" />
        <circle cx="150" cy="143" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" />
        <circle cx="250" cy="80" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" />
        <circle cx="365" cy="45" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" />
        <circle cx="480" cy="30" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" />
        <text x="40" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q1</text>
        <text x="150" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q2</text>
        <text x="250" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q3</text>
        <text x="365" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q4</text>
        <text x="480" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Deploy</text>
      </svg>
    </Box>
  );
}

function SvgDoughnutChart() {
  return (
    <Box style={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <svg viewBox="0 0 200 200" width="160" height="160">
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-gray-1)" strokeWidth="20" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-teal-6)" strokeWidth="20" strokeDasharray="188 471" strokeDashoffset="0" transform="rotate(-90 100 100)" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-indigo-6)" strokeWidth="20" strokeDasharray="141 471" strokeDashoffset="-188" transform="rotate(-90 100 100)" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-violet-6)" strokeWidth="20" strokeDasharray="71 471" strokeDashoffset="-329" transform="rotate(-90 100 100)" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-orange-6)" strokeWidth="20" strokeDasharray="71 471" strokeDashoffset="-400" transform="rotate(-90 100 100)" />
      </svg>
      <Box style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Text fz="10px" fw={700} c="dimmed" tt="uppercase" lh={1} mb="2px">Ecosystem</Text>
        <Text fz="md" fw={800} lh={1.2}>6 Adopters</Text>
      </Box>
    </Box>
  );
}

function InteractiveDemoButton({ action }: { action: SemanticAction }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const isDestructive = ['delete', 'clear', 'uncheck'].includes(action);
      setFeedback(isDestructive ? 'error' : 'success');
      setTimeout(() => setFeedback(null), 2000);
    }, 1000);
  };

  return (
    <SemanticButton
      action={action}
      fullWidth
      loading={loading}
      feedbackState={feedback}
      onClick={handleClick}
    />
  );
}

export function CardsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoLoad, setDemoLoad] = useState(false);

  const handleConfirmAction = () => {
    setDemoLoad(true);
    setTimeout(() => {
      setDemoLoad(false);
      setConfirmOpen(false);
      notifications.show({
        title: 'Legacy CSS Purged',
        message: 'All custom CSS modules have been eradicated successfully.',
        color: 'teal',
      });
    }, 1200);
  };

  return (
    <Stack gap="xl">
      <PageHeader
        title="Card Primitives & Interactive States"
        description="Our standard card structures display structured data, progress widgets, and empty/error system layouts consistently."
      />

      <FormSection title="Metric & Progress Cards" description="Use MetricCard and ProgressCard to structure KPI metrics and milestones.">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <MetricCard
            label="Adoption Frequency"
            value="4,821 Builds"
            description="Deploy count since the GDS 2.6 package-consumption hardening pass"
            trend={{ label: '+24.5%', tone: 'positive' }}
            icon={<IconActivity size="1.2rem" />}
          />
          <ProgressCard
            label="Migration Progress"
            value="28 / 28 Pages"
            progress={100}
            progressLabel="SSO Documentation Pages"
            description="Migration of doc files to package-native Mantine contracts with Mantine 9-ready peer support"
            action={<Badge color="teal" variant="light">Completed</Badge>}
          />
          <MetricCard
            label="Platform Health"
            value="0 Failures"
            description="CI smoketests build success rate"
            trend={{ label: 'Stable', tone: 'neutral' }}
            icon={<IconShieldCheck size="1.2rem" />}
          />
        </SimpleGrid>
      </FormSection>

      <FormSection title="Product & Media Cards" description="High-fidelity representations of adopter products.">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <ProductCard
            title="KIDEX Conductor Portal"
            description="Conductor-facing child assessment and development-intelligence platform. Custom assessment widgets and operational-first sequencing."
            status={<Badge color="teal">Active</Badge>}
            metadata={[
              { label: 'Role Scopes', value: 'Conductor, Caregiver, Coach' },
              { label: 'Theme Tones', value: 'Teal, Amber, Blue' },
            ]}
            secondaryActions={[
              { label: 'Open Workspace' },
              { label: 'Audit Records' },
            ]}
          />

          <MediaCard
            title="ClassScout Catalog Cataloging"
            description={(
              <Stack gap="xs">
                <Text size="sm">Catalog operations for birthday parties, camps, classes, and activities across NYC. Curated machine-ingest pipeline and ImgBB media integration.</Text>
                <Group gap="xs">
                  <Badge variant="light" size="xs">Ingest Key: Configured</Badge>
                  <Badge variant="light" size="xs">5 Boroughs</Badge>
                </Group>
              </Stack>
            )}
            image={(
              <img
                src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop"
                alt="ClassScout"
                style={{ width: '100%', height: 180, objectFit: 'cover' }}
              />
            )}
            status="Catalog"
          />
        </SimpleGrid>
      </FormSection>

      <FormSection title="Catalog & Discovery Contracts" description="These showcase the released discovery-oriented GDS primitives that consumers can use today.">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <ListingCard
            title="Danube Evening Run Club"
            description="Unified public listing contract with governed promo disclosure, metadata rows, and affordance placement."
            featured
            sponsoredDisclosure="Sponsored placement. Selection criteria are disclosed in the host app."
            price="Free"
            metadata={[
              { id: 'date', label: 'Date', value: 'June 14' },
              { id: 'time', label: 'Time', value: '18:30' },
              { id: 'location', label: 'Location', value: 'Budapest, Margaret Bridge' },
            ]}
            primaryAction={<SemanticButton action="preview" size="sm" />}
            saveAction={{ action: 'save' }}
            shareAction={{ action: 'forward' }}
          />

          <MapPanel
            title="Discovery map panel"
            description="Sanctioned third-party embeds live inside governed chrome with explicit titles, actions, and fallback-state behavior."
            actions={{
              primary: { action: 'preview', size: 'sm' },
              tertiary: [{ action: 'refresh', size: 'sm' }],
            }}
            iframeSrc="https://www.openstreetmap.org/export/embed.html?bbox=19.03%2C47.49%2C19.08%2C47.52&layer=mapnik"
            embedTitle="Budapest sample discovery map"
          />
        </SimpleGrid>
        <Paper withBorder p="lg" radius="xl">
          <ShareButtonGroup
            url="https://sovereignsquad.github.io/general-design-system/"
            title="General Design System"
            text="Explore the public GDS runtime and adoption docs."
            channels={['native', 'copy', 'mail', 'linkedin', 'x']}
            description="Governed share buttons replace product-local copy-link and social-share wrappers."
          />
        </Paper>
      </FormSection>

      <FormSection title="Food & Menu Contracts" description="Food-oriented products now have canonical card and grouped-section contracts instead of generic product cards plus local CSS.">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <PublicFoodCard
              title="Roasted Tomato Soup"
              description="Slow-roasted tomatoes, basil oil, and house bread."
              price="EUR 7.50"
              priceNote="Per portion"
              state="preorder"
              helperText="Order cutoff: Friday 18:00"
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
              primaryAction={<SemanticButton action="submit" />}
              secondaryAction={<Button variant="default">Details</Button>}
            />

            <PublicFoodCard
              title="Summer Picnic Box"
              description="Seasonal FMCG tasting pack with pastries, dips, and chef specials."
              price="EUR 29.00"
              state="limited"
              helperText="Limited seasonal bundle"
              freshnessNote="Prepared the same morning"
              markers={[
                { id: 'bundle', label: 'Bundle' },
                { id: 'seasonal', label: 'Seasonal', tone: 'warning' },
              ]}
              metadata={[
                { id: 'serves', label: 'Serves 2-3' },
                { id: 'pickup', label: 'Pickup or courier' },
              ]}
              primaryAction={<SemanticButton action="save" />}
            />
          </SimpleGrid>

          <FoodMenuSection
            eyebrow="Weekly menu"
            title="Laura Organic Saturday Menu"
            description="A governed grouped menu built from the canonical food card contract."
            sectionNote="Pickup only this week. All dishes are prepared fresh on Saturday morning."
            categories={[
              {
                id: 'soups',
                title: 'Soups',
                helperNote: 'Prepared in small weekly batches.',
                items: [
                  {
                    id: 'tomato-soup',
                    title: 'Roasted Tomato Soup',
                    description: 'Basil oil, sour cream, and crusty bread.',
                    price: 'EUR 7.50',
                    state: 'preorder',
                    helperText: 'Reserve before Friday 18:00',
                    pickupNote: 'Saturday 09:00-12:00',
                    primaryAction: <Button>Reserve</Button>,
                  },
                  {
                    id: 'thai-carrot',
                    title: 'Thai Carrot Soup',
                    description: 'Coconut, ginger, and lime.',
                    price: 'EUR 7.20',
                    state: 'available',
                    freshnessNote: 'Best enjoyed within 24 hours',
                    primaryAction: <Button>Order</Button>,
                  },
                ],
              },
              {
                id: 'desserts',
                title: 'Desserts',
                helperNote: 'Small-batch bakery drop.',
                items: [
                  {
                    id: 'pistachio-bun',
                    title: 'Pistachio Morning Bun',
                    description: 'Buttery laminated pastry with pistachio cream.',
                    price: 'EUR 4.80',
                    state: 'limited',
                    quantityHint: '18 left',
                    primaryAction: <Button>Reserve</Button>,
                  },
                ],
              },
            ]}
          />
        </Stack>
      </FormSection>

      <FormSection title="System State Blocks" description="Provides clean feedback blocks during loading, empty data, or unauthorized actions.">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Paper withBorder p="md" radius="xl">
            <StateBlock variant="empty" title="Empty Catalog" description="Load items into your catalog to begin configuring structured metadata." compact />
          </Paper>
          <Paper withBorder p="md" radius="xl">
            <StateBlock variant="loading" title="Synchronizing Database..." description="Fetching the latest semantic changes from the Mongo server." compact />
          </Paper>
          <Paper withBorder p="md" radius="xl" style={{ position: 'relative' }}>
            <StateBlock
              variant="permission"
              title="Access Scoped"
              description="This workspace requires admin privileges to manage recurring programs."
              compact
              action={<Button variant="light" size="xs" onClick={() => setConfirmOpen(true)}>Authorize Workspace</Button>}
            />
          </Paper>
        </SimpleGrid>
      </FormSection>

      <ConfirmDialog
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title="Purge Legacy CSS Stylesheets?"
        loading={demoLoad}
      >
        This action will permanently delete `styles/docs.module.css` and `styles/docs-layout.module.css` across the SSO repository. Downstream pages will be strictly governed by the GDS 2.6.4 package and theme contract.
      </ConfirmDialog>
    </Stack>
  );
}

export function LayoutsPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Layout Primitives & Scaffolding"
        description="These examples exercise the new governed shell, navigation, action, and detail-profile primitives directly."
      />

      <FormSection title="DiscoveryShell + SidebarNav" description="Use this contract instead of local AppShell wrappers for sidebar-first applications.">
        <Paper withBorder p="md" radius="xl">
          <Box style={{ minHeight: 520, overflow: 'hidden', borderRadius: 16 }}>
            <DiscoveryShell
              header={<WorkspaceHeader title="Catalog Operations" description="Governed sidebar-first shell" />}
              sidebar={(
                <SidebarNav ariaLabel="Catalog navigation">
                  <SidebarNavSection label="Primary">
                    <SidebarNavItem action="dashboard" href="#dashboard" active />
                    <SidebarNavItem action="calendar" href="#schedule" />
                    <SidebarNavItem action="analytics" href="#analytics" />
                  </SidebarNavSection>
                  <SidebarNavSection label="Account" pushToBottom>
                    <SidebarNavItem action="settings" href="#settings" />
                    <SidebarNavItem action="logout" component="button" />
                  </SidebarNavSection>
                </SidebarNav>
              )}
              footer={<SemanticButton action="home" variant="subtle" />}
            >
              <Stack gap="lg">
                <ActionBar
                  primary={{ action: 'save', size: 'sm' }}
                  secondary={[{ action: 'cancel', size: 'sm' }]}
                  tertiary={[{ action: 'preview', size: 'sm' }]}
                  iconOnly={[{ action: 'settings' }]}
                />
                <ResponsiveDataView
                  data={[
                    { id: '1', name: 'Universal SSO', type: 'OAuth/OIDC Provider', adoption: '100%' },
                    { id: '2', name: 'KIDEX Platform', type: 'Conductor Intel App', adoption: '100%' },
                    { id: '3', name: 'ClassScout NYC', type: 'Class Catalog App', adoption: '100%' },
                  ]}
                  columns={[
                    { key: 'name', label: 'Adopter Repository' },
                    { key: 'type', label: 'Archetype' },
                    { key: 'adoption', label: 'Migration Status' },
                  ]}
                  renderCard={(item) => (
                    <Paper withBorder p="md" radius="lg">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={700} size="sm">{item.name}</Text>
                          <Badge color="teal" variant="light">{item.adoption}</Badge>
                        </Group>
                        <Text size="xs" c="dimmed">{item.type}</Text>
                      </Stack>
                    </Paper>
                  )}
                />
              </Stack>
            </DiscoveryShell>
          </Box>
        </Paper>
      </FormSection>

      <FormSection title="Asset Attachment dropzone" description="Standard GDS UploadDropzone component built on top of Mantine and ImgBB validation constraints.">
        <UploadDropzone
          title="Drag and drop or choose GDS assets to upload"
          description="Supports high-fidelity image mockups up to 5MB."
          onFilesSelected={(files: File[]) => {
            notifications.show({
              title: 'Asset Selected',
              message: `Successfully loaded ${files[0].name} to playground client memory.`,
              color: 'teal',
            });
          }}
          accept="image/*"
        />
      </FormSection>

      <FormSection title="Auth + Sharing Contracts" description="Provider-based entry and public sharing should use canonical primitives rather than per-product button stacks.">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <AuthShell
            title="Welcome back"
            description="Use the same governed auth-entry surface across login, signup, and linking journeys."
            socialAuth={(
              <SocialAuthButtons
                providers={[
                  { id: 'google', href: '#google' },
                  { id: 'apple', href: '#apple' },
                  { id: 'github', href: '#github', description: 'For developer workspaces' },
                ]}
                layout="grid"
              />
            )}
            helper="If your organization requires SSO, continue with the approved identity provider above."
          >
            <Stack gap="sm">
              <TextInput label="Email" placeholder="name@company.com" />
              <TextInput label="Password" type="password" placeholder="Enter your password" />
              <Button>Continue</Button>
            </Stack>
          </AuthShell>

          <Paper withBorder p="lg" radius="xl">
            <ShareButtonGroup
              url="https://sovereignsquad.github.io/general-design-system/"
              title="General Design System"
              text="Adopt the canonical GDS runtime and governance stack."
              channels={['copy', 'mail', 'message', 'whatsapp', 'telegram']}
              compact
              label="Compact share lane"
              description="Use compact mode when a card, detail drawer, or footer needs governed icon-only sharing."
            />
          </Paper>
        </SimpleGrid>
      </FormSection>

      <FormSection title="DetailProfileShell" description="Use the same detail composition in drawer and full-page modes instead of maintaining divergent local profile panels.">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <DetailProfileShell
            mode="page"
            hero={(
              <Stack gap={4}>
                <Badge color="teal" variant="light">Page mode</Badge>
                <Title order={3}>Budapest Run Collective</Title>
                <Text size="sm" c="dimmed">Community profile with governed hero, actions, sections, and related content.</Text>
              </Stack>
            )}
            actions={<ActionBar primary={{ action: 'message', size: 'sm' }} secondary={[{ action: 'save', size: 'sm' }]} />}
            sections={[
              <Paper key="overview" withBorder p="md" radius="lg">Weekly meetups, coach rotation, and beginner-friendly pacing.</Paper>,
              <Paper key="schedule" withBorder p="md" radius="lg">Tuesday and Thursday at 18:30, Saturday long run at 08:00.</Paper>,
            ]}
            related={<Paper withBorder p="md" radius="lg">Related groups: Danube Sprinters, City Tempo, Margaret Bridge Runners.</Paper>}
          />
          <DetailProfileShell
            mode="drawer"
            hero={(
              <Stack gap={4}>
                <Badge color="violet" variant="light">Drawer mode</Badge>
                <Title order={4}>Operator detail rail</Title>
                <Text size="sm" c="dimmed">Same contract, denser presentation.</Text>
              </Stack>
            )}
            actions={<ActionBar primary={{ action: 'edit', size: 'sm' }} tertiary={[{ action: 'preview', size: 'sm' }]} />}
            sections={[
              <Paper key="status" withBorder p="md" radius="lg">Status: featured listing, review scheduled, sponsor disclosure active.</Paper>,
              <Paper key="owner" withBorder p="md" radius="lg">Owner: Camera discovery operations.</Paper>,
            ]}
          />
        </SimpleGrid>
      </FormSection>

      <FormSection title="Capture & Playback Contracts" description="Hardware-adjacent and timed-media experiences now have governed shells. Only the actual runtime media region remains an explicit boundary.">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <PublicFlowShell
            eyebrow="Public flow"
            stage={{
              id: 'review',
              title: 'Review your capture',
              description: 'Consent, review, share, and recovery stages follow the same public-flow contract.',
              status: 'ready',
              body: (
                <Paper withBorder p="md" radius="lg">
                  <Text size="sm">Captured image preview, captions, and confirmation copy render inside the governed flow shell.</Text>
                </Paper>
              ),
              notice: 'The live camera preview remains a bounded runtime slot and must still meet the documented accessibility rules.',
              actions: [
                { action: 'cancel', priority: 'secondary' },
                { action: 'send', priority: 'primary' },
                { action: 'preview', priority: 'tertiary' },
              ],
            }}
            hardwareSurface={(
              <Paper withBorder p="xl" radius="lg" style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text size="sm" c="dimmed">Runtime hardware preview slot</Text>
              </Paper>
            )}
            exitAction={<Button variant="default">Safe Exit</Button>}
          />

          <PlaybackSurface
            title="Storefront playback"
            state="playing"
            mode="kiosk"
            statusMessage="Looping seasonal menu highlights on a public kiosk display."
            media={(
              <Paper withBorder p="xl" radius="lg" style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text size="sm" c="dimmed">Timed media presenter slot</Text>
              </Paper>
            )}
            controls={<Button variant="default" size="xs">Pause</Button>}
            overlays={<Badge color="teal" variant="light">Kiosk mode</Badge>}
          />
        </SimpleGrid>
      </FormSection>

      <FormSection title="Access Summary Scoping" description="Standard scoping summaries displaying active owner, roles, and allowed client accesses.">
        <AccessSummary
          title="moldovancsaba"
          roles={['System Owner', 'Global Admin']}
          scope="All Ecosystem Repositories (sso, kidex, classscout, messmass, narimato)"
          description="Last verified active just now using keychain key authorization."
        />
      </FormSection>
    </Stack>
  );
}

export function VocabularyPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Semantic Dictionary & Testing Matrix"
        description="Test the canonical semantic vocabulary and the governed product-extension lane. Every action resolves to one icon, one meaning, and one localized label contract."
      />

      <FormSection title="Product vocabulary packs" description="Missing product actions extend the governed vocabulary through a namespace instead of raw labels and icons.">
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              This example uses a `camera` vocabulary pack to add a product-specific moderation action while still flowing through `ActionBar`, `SidebarNavItem`, and `SemanticButton`.
            </Text>
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
          </Stack>
        </Paper>
      </FormSection>

      <Stack gap="md">
        {(Object.keys(GdsVocabulary) as SemanticAction[]).map((action) => (
          <Paper key={action} withBorder p="lg" radius="lg">
            <Stack gap="sm">
              <Group justify="space-between">
                <Box fw={700} fz="xs" tt="uppercase" c="dimmed">gds.action.{action}</Box>
                <Badge color="gray" variant="outline">Icon: {GdsVocabulary[action].icon.name}</Badge>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="sm">
                <Box>
                  <Box fz="xs" c="dimmed" mb={4}>Default</Box>
                  <SemanticButton action={action} fullWidth />
                </Box>
                <Box>
                  <Box fz="xs" c="dimmed" mb={4}>Light Variant</Box>
                  <SemanticButton action={action} fullWidth variant="light" />
                </Box>
                <Box>
                  <Box fz="xs" c="dimmed" mb={4}>Disabled</Box>
                  <SemanticButton action={action} fullWidth disabled />
                </Box>
                <Box>
                  <Box fz="xs" c="dimmed" mb={4}>Loading</Box>
                  <SemanticButton action={action} fullWidth loading />
                </Box>
                <Box>
                  <Box fz="xs" c="dimmed" mb={4}>Micro-Feedback Demo</Box>
                  <InteractiveDemoButton action={action} />
                </Box>
              </SimpleGrid>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

export function AnalyticsPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Themed Analytics & Custom SVG Charts"
        description="Clean dashboards built natively on top of GDS design tokens, featuring interactive spline curves, doughnut shares, and period toolbars."
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder p="xl" radius="xl">
          <Stack gap="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Title order={3}>Ecosystem Adoption Spline</Title>
                <Text size="xs" c="dimmed">Quarterly GDS integration growth rate across adopter repositories</Text>
              </Stack>
              <Badge color="teal" variant="light">Adoption Rate</Badge>
            </Group>
            <SvgLineChart />
          </Stack>
        </Paper>

        <Paper withBorder p="xl" radius="xl">
          <Stack gap="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Title order={3}>Product Registry Distribution</Title>
                <Text size="xs" c="dimmed">Share of managed variables inside active downstreams</Text>
              </Stack>
              <Badge color="indigo" variant="light">Product Shares</Badge>
            </Group>
            <SvgDoughnutChart />
          </Stack>
        </Paper>
      </SimpleGrid>

      <Stack gap="md">
        <Title order={3}>Adoption Metadata Ledger</Title>
        <DataTable
          columns={[
            { key: 'repo', label: 'Repository' },
            { key: 'category', label: 'Archetype' },
            { key: 'coverage', label: 'Token Coverage' },
            { key: 'status', label: 'Governance Grade' },
          ]}
          data={[
            { repo: 'Universal SSO', category: 'OAuth / Documentation Portal', coverage: '100% Core Primitives', status: 'A+' },
            { repo: 'KIDEX Intel Platform', category: 'Conductor Assessment Tool', coverage: '98% Theme & Layouts', status: 'A' },
            { repo: 'ClassScout NYC', category: 'Public Classes & Camp Directory', coverage: '100% Grid & Details', status: 'A+' },
            { repo: 'Messmass Analytics', category: 'Executive Visualization Console', coverage: '96% Form Fields', status: 'A' },
          ]}
        />
      </Stack>
    </Stack>
  );
}
