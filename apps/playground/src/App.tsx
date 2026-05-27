import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GdsProvider } from '@doneisbetter/gds-theme';
import { 
  AppShell, 
  DataTable, 
  FormSection, 
  PageHeader, 
  SemanticNavLink,
  WorkspaceHeader,
  ResponsiveDataView,
} from '@doneisbetter/gds-admin';
import { 
  SemanticButton, 
  GdsVocabulary, 
  type SemanticAction, 
  en, hu, de, fr, it, ru, he, ar,
  MetricCard,
  ProgressCard,
  ProductCard,
  MediaCard,
  StateBlock,
  AccessSummary,
  UploadDropzone,
  ConfirmDialog
} from '@doneisbetter/gds-core';
import { 
  Stack, 
  Button, 
  SimpleGrid, 
  Paper, 
  Box, 
  Menu, 
  Text, 
  Title, 
  Group, 
  Divider, 
  Badge, 
  Code,
  ThemeIcon
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  IconLanguage, 
  IconChevronDown, 
  IconActivity, 
  IconShieldCheck, 
  IconPalette, 
  IconCheck
} from '@tabler/icons-react';

const localesMap: Record<string, { label: string, messages: Record<string, string> }> = {
  en: { label: 'English', messages: en },
  de: { label: 'Deutsch', messages: de },
  fr: { label: 'Français', messages: fr },
  it: { label: 'Italiano', messages: it },
  ru: { label: 'Русский', messages: ru },
  he: { label: 'עברית (Hebrew)', messages: he },
  ar: { label: 'العربية (Arabic)', messages: ar },
  hu: { label: 'Magyar', messages: hu },
};

// 1. Custom High-Fidelity SVG spline Line Chart with glowing gradients
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
        {/* Grid lines */}
        <line x1="40" y1="20" x2="480" y2="20" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="120" x2="480" y2="120" stroke="var(--mantine-color-gray-2)" strokeDasharray="4 4" />
        <line x1="40" y1="170" x2="480" y2="170" stroke="var(--mantine-color-gray-3)" />

        {/* Spline Path */}
        <path 
          d="M 40 170 Q 150 130 250 80 T 480 30" 
          fill="none" 
          stroke="var(--mantine-color-teal-6)" 
          strokeWidth="3.5" 
        />
        {/* Gradient fill */}
        <path 
          d="M 40 170 Q 150 130 250 80 T 480 30 L 480 170 L 40 170 Z" 
          fill="url(#chartGradient)" 
        />

        {/* Data points */}
        <circle cx="40" cy="170" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" style={{ cursor: 'pointer' }} />
        <circle cx="150" cy="143" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" style={{ cursor: 'pointer' }} />
        <circle cx="250" cy="80" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" style={{ cursor: 'pointer' }} />
        <circle cx="365" cy="45" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" style={{ cursor: 'pointer' }} />
        <circle cx="480" cy="30" r="6" fill="var(--mantine-color-teal-6)" stroke="white" strokeWidth="2.5" style={{ cursor: 'pointer' }} />

        {/* Text labels */}
        <text x="40" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q1</text>
        <text x="150" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q2</text>
        <text x="250" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q3</text>
        <text x="365" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Q4</text>
        <text x="480" y="190" fontSize="10" fontWeight="600" fill="var(--mantine-color-gray-6)" textAnchor="middle">Deploy</text>
      </svg>
    </Box>
  );
}

// 2. Custom High-Fidelity SVG Doughnut Chart
function SvgDoughnutChart() {
  return (
    <Box style={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <svg viewBox="0 0 200 200" width="160" height="160">
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--mantine-color-gray-1)" strokeWidth="20" />
        {/* Segment 1: KIDEX 40% (188px circumference / total 471) */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="none" 
          stroke="var(--mantine-color-teal-6)" 
          strokeWidth="20" 
          strokeDasharray="188 471" 
          strokeDashoffset="0" 
          transform="rotate(-90 100 100)" 
        />
        {/* Segment 2: SSO 30% (141px) */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="none" 
          stroke="var(--mantine-color-indigo-6)" 
          strokeWidth="20" 
          strokeDasharray="141 471" 
          strokeDashoffset="-188" 
          transform="rotate(-90 100 100)" 
        />
        {/* Segment 3: ClassScout 15% (70.6px) */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="none" 
          stroke="var(--mantine-color-violet-6)" 
          strokeWidth="20" 
          strokeDasharray="71 471" 
          strokeDashoffset="-329" 
          transform="rotate(-90 100 100)" 
        />
        {/* Segment 4: Messmass + Others 15% (71.4px) */}
        <circle 
          cx="100" 
          cy="100" 
          r="75" 
          fill="none" 
          stroke="var(--mantine-color-orange-6)" 
          strokeWidth="20" 
          strokeDasharray="71 471" 
          strokeDashoffset="-400" 
          transform="rotate(-90 100 100)" 
        />
      </svg>
      {/* Absolute center text overlay */}
      <Box style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Text fz="10px" fw={700} c="dimmed" tt="uppercase" lh={1} mb="2px">Ecosystem</Text>
        <Text fz="md" fw={800} lh={1.2}>6 Adopters</Text>
      </Box>
    </Box>
  );
}

function PlaygroundContent() {
  const [locale, setLocale] = useState<string>('en');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoLoad, setDemoLoad] = useState(false);
  const location = useLocation();

  const handleConfirmAction = () => {
    setDemoLoad(true);
    setTimeout(() => {
      setDemoLoad(false);
      setConfirmOpen(false);
      notifications.show({
        title: 'Legacy CSS Purged',
        message: 'All custom CSS modules have been eradicated successfully.',
        color: 'teal',
        icon: <IconCheck size="1.2rem" />,
        radius: 'md'
      });
    }, 1200);
  };

  const navLinks = [
    <SemanticNavLink 
      key="overview" 
      action="home" 
      component={Link}
      to="/"
      active={location.pathname === '/'} 
    />,
    <SemanticNavLink 
      key="tokens" 
      action="theme" 
      component={Link}
      to="/tokens"
      active={location.pathname === '/tokens'} 
    />,
    <SemanticNavLink 
      key="cards" 
      action="grid" 
      component={Link}
      to="/cards"
      active={location.pathname === '/cards'} 
    />,
    <SemanticNavLink 
      key="layouts" 
      action="copy" 
      component={Link}
      to="/layouts"
      active={location.pathname === '/layouts'} 
    />,
    <SemanticNavLink 
      key="vocabulary" 
      action="list" 
      component={Link}
      to="/vocabulary"
      active={location.pathname === '/vocabulary'} 
    />,
    <SemanticNavLink 
      key="analytics" 
      action="analytics" 
      component={Link}
      to="/analytics"
      active={location.pathname === '/analytics'} 
    />,
  ];

  const headerActions = (
    <Group gap="sm">
      <Menu position="bottom-end" withArrow>
        <Menu.Target>
          <Button 
            variant="light" 
            radius="md"
            leftSection={<IconLanguage size="1.2rem" />}
            rightSection={<IconChevronDown size="1rem" />}
          >
            {localesMap[locale]?.label || 'Language'}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {Object.entries(localesMap).map(([key, config]) => (
            <Menu.Item key={key} onClick={() => setLocale(key)}>
              {config.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  return (
    <GdsProvider locale={locale} messages={localesMap[locale]?.messages || localesMap.en.messages}>
      <AppShell
        logoText="GDS Rulebook"
        navLinks={navLinks}
        headerActions={headerActions}
      >
        <Box p="md" maw={1200} mx="auto">
          <Routes>
            {/* TAB 1: OVERVIEW */}
            <Route path="/" element={
              <Stack gap="xl">
                <PageHeader 
                  title="GDS Principles & Core Guidelines" 
                  description="The General Design System (GDS) is built on strict ubiquitous language, semantic consistency, and a zero-legacy CSS module policy."
                  primaryAction={
                    <Link to="/tokens" style={{ textDecoration: 'none' }}>
                      <SemanticButton action="start" size="md" />
                    </Link>
                  }
                />
                
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <Paper withBorder p="xl" radius="xl">
                    <Stack gap="md" align="center" ta="center">
                      <ThemeIcon size={48} radius="xl" color="teal.6" variant="light">
                        <IconShieldCheck size="1.8rem" />
                      </ThemeIcon>
                      <Title order={3}>1:1 Semantic Action Mapping</Title>
                      <Text size="sm" c="dimmed">
                        Every action (e.g. Save, Add, Delete) has exactly one designated icon and semantic tone across all apps. No overlapping checks or duplicate verbs.
                      </Text>
                    </Stack>
                  </Paper>

                  <Paper withBorder p="xl" radius="xl">
                    <Stack gap="md" align="center" ta="center">
                      <ThemeIcon size={48} radius="xl" color="violet.6" variant="light">
                        <IconActivity size="1.8rem" />
                      </ThemeIcon>
                      <Title order={3}>Component Contract Parity</Title>
                      <Text size="sm" c="dimmed">
                        Downstream products like KIDEX, SSO, and ClassScout consume shared packages directly under a unified schema, eradicating local drift and redundant adapters.
                      </Text>
                    </Stack>
                  </Paper>

                  <Paper withBorder p="xl" radius="xl">
                    <Stack gap="md" align="center" ta="center">
                      <ThemeIcon size={48} radius="xl" color="orange.6" variant="light">
                        <IconPalette size="1.8rem" />
                      </ThemeIcon>
                      <Title order={3}>Zero CSS-Module Baseline</Title>
                      <Text size="sm" c="dimmed">
                        Product layouts are built exclusively using GDS tokenized primitives (Mantine Core and GDS wrappers), completely removing scattered class hierarchies.
                      </Text>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Divider />

                <Stack gap="sm">
                  <Title order={2}>Platform Adoption Progress</Title>
                  <Text size="sm" c="dimmed">Our current standard is adopted fully across six live repositories:</Text>
                  <Paper withBorder p="md" radius="lg">
                    <Stack gap={6}>
                      <Text fw={700} size="sm">Current supported consumer line</Text>
                      <Text size="sm" c="dimmed">
                        Direct package adoption is verified for React 19 with Mantine 8.3.x and 9.2.x. Public GitHub release assets remain the temporary supported install path until npm publication is live.
                      </Text>
                    </Stack>
                  </Paper>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
                    {['sso', 'kidex', 'classscout', 'messmass', 'narimato', 'general-design-system'].map((app) => (
                      <Paper key={app} withBorder p="md" radius="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Badge color="teal" variant="light">GDS 2.6.2</Badge>
                        <Text fw={700} size="sm" tt="uppercase">{app.replace('-',' ')}</Text>
                        <Text size="xs" c="dimmed">Release-aligned</Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Stack>
            } />

            {/* TAB 2: COLOR SYSTEMS & THEME TOKENS */}
            <Route path="/tokens" element={
              <Stack gap="xl">
                <PageHeader 
                  title="Color Systems & Theme Tokens" 
                  description="Explore GDS's strict primary, secondary, and semantic feedback palettes. Click on any color to inspect its CSS variables."
                />

                <FormSection title="Brand Primaries" description="Our central core tones drive semantic hierarchy and layout surfaces.">
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
                    {[
                      { name: 'Teal (Brand Primary)', hex: '#0ca678', var: 'var(--mantine-color-teal-6)' },
                      { name: 'Teal Hover', hex: '#099268', var: 'var(--mantine-color-teal-7)' },
                      { name: 'Indigo (Brand Secondary)', hex: '#4c6ef5', var: 'var(--mantine-color-indigo-6)' },
                      { name: 'Violet (Admin Accents)', hex: '#7950f2', var: 'var(--mantine-color-violet-6)' },
                      { name: 'Orange (Warning/Focus)', hex: '#fd7e14', var: 'var(--mantine-color-orange-6)' },
                      { name: 'Charcoal (Text/Dark)', hex: '#212529', var: 'var(--mantine-color-dark-8)' },
                    ].map((color) => (
                      <Paper key={color.name} withBorder p="sm" radius="lg">
                        <Box style={{ height: 60, backgroundColor: color.hex, borderRadius: 8, marginBottom: 8 }} />
                        <Text fw={700} size="xs">{color.name}</Text>
                        <Code block fz="9px" mt={4}>{color.var}</Code>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </FormSection>

                <FormSection title="Semantic Feedback Shades" description="Used explicitly for action mapping and system alert layouts.">
                  <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                    {[
                      { status: 'Success / Completed', color: 'teal', desc: 'Positive operations', tone: 'gds.status.success' },
                      { status: 'Info / Scoped Views', color: 'blue', desc: 'Informational panels', tone: 'gds.status.info' },
                      { status: 'Warning / Suspended', color: 'orange', desc: 'Caution blocks', tone: 'gds.status.warning' },
                      { status: 'Error / Danger', color: 'red', desc: 'Destructive flows', tone: 'gds.status.error' },
                    ].map((item) => (
                      <Paper key={item.status} withBorder p="md" radius="lg" style={{ borderLeft: `5px solid var(--mantine-color-${item.color}-6)` }}>
                        <Group justify="space-between">
                          <Text fw={700} size="sm">{item.status}</Text>
                          <Badge color={item.color} variant="light">{item.tone}</Badge>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>{item.desc}</Text>
                        <Code block fz="9px" mt="xs">{`var(--mantine-color-${item.color}-6)`}</Code>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </FormSection>

                <FormSection title="Typography Guidelines" description="Built with responsive scaling, explicit line heights, and Outfit / Inter family metrics.">
                  <Paper withBorder p="xl" radius="xl">
                    <Stack gap="md">
                      <Title order={1}>Title Order 1 (2.2rem)</Title>
                      <Title order={2}>Title Order 2 (1.6rem)</Title>
                      <Title order={3}>Title Order 3 (1.3rem)</Title>
                      <Text size="lg">Text Size LG: Used for descriptions, subtitles, and lead paragraphs.</Text>
                      <Text size="md">Text Size MD: Standard body text for tables, form prompts, and documentation.</Text>
                      <Text size="sm" c="dimmed">Text Size SM (Dimmed): Subtitles, helper text, and secondary details.</Text>
                    </Stack>
                  </Paper>
                </FormSection>
              </Stack>
            } />

            {/* TAB 3: CARDS & STATES */}
            <Route path="/cards" element={
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
                        { label: 'Theme Tones', value: 'Teal, Amber, Blue' }
                      ]}
                      secondaryActions={[
                        { label: 'Open Workspace' },
                        { label: 'Audit Records' }
                      ]}
                    />

                    <MediaCard 
                      title="ClassScout Catalog Cataloging" 
                      description={
                        <Stack gap="xs">
                          <Text size="sm">Catalog operations for birthday parties, camps, classes, and activities across NYC. Curated machine-ingest pipeline and ImgBB media integration.</Text>
                          <Group gap="xs">
                            <Badge variant="light" size="xs">Ingest Key: Configured</Badge>
                            <Badge variant="light" size="xs">5 Boroughs</Badge>
                          </Group>
                        </Stack>
                      }
                      image={
                        <img 
                          src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop" 
                          alt="ClassScout" 
                          style={{ width: '100%', height: 180, objectFit: 'cover' }} 
                        />
                      }
                      status="Catalog"
                    />
                  </SimpleGrid>
                </FormSection>

                <FormSection title="System State Blocks" description="Provides clean feedback blocks during loading, empty data, or unauthorized actions.">
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <Paper withBorder p="md" radius="xl">
                      <StateBlock 
                        variant="empty" 
                        title="Empty Catalog" 
                        description="Load items into your catalog to begin configuring structured metadata."
                        compact
                      />
                    </Paper>
                    <Paper withBorder p="md" radius="xl">
                      <StateBlock 
                        variant="loading" 
                        title="Synchronizing Database..." 
                        description="Fetching the latest semantic changes from the Mongo server."
                        compact
                      />
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
                  This action will permanently delete `styles/docs.module.css` and `styles/docs-layout.module.css` across the SSO repository. Downstream pages will be strictly governed by the GDS 2.6.2 package and theme contract.
                </ConfirmDialog>
              </Stack>
            } />

            {/* TAB 4: LAYOUT SANDBOXES */}
            <Route path="/layouts" element={
              <Stack gap="xl">
                <PageHeader 
                  title="Layout Primitives & Scaffolding" 
                  description="Test complex administrative screens using standard scaffolding wrappers: WorkspaceHeader, FormSection, and ResponsiveDataView."
                />

                <WorkspaceHeader 
                  title="Catalog Operations"
                  breadcrumbs={[
                    <Link key="1" to="/" style={{ textDecoration: 'none', color: 'var(--mantine-color-teal-6)' }}>Rulebook</Link>,
                    <Text key="2" size="sm">Admin Workspace</Text>
                  ]}
                  secondaryActions={<Button variant="default" size="xs">Cancel</Button>}
                  primaryAction={<Button color="teal" size="xs">Save Changes</Button>}
                />

                <FormSection title="Asset Attachment dropzone" description="Standard GDS UploadDropzone component built on top of Mantine and ImgBB validation constraints.">
                  <UploadDropzone 
                    title="Drag and drop or choose GDS assets to upload"
                    description="Supports high-fidelity image mockups up to 5MB."
                    onFilesSelected={(files: File[]) => {
                      notifications.show({
                        title: 'Asset Selected',
                        message: `Successfully loaded ${files[0].name} to playground client memory.`,
                        color: 'teal'
                      });
                    }}
                    accept="image/*"
                  />
                </FormSection>

                <FormSection title="Responsive Data View Component" description="Automatically toggle between rich cards (on mobile screens) and tabular lists (on desktop screens) cleanly.">
                  <ResponsiveDataView 
                    data={[
                      { id: '1', name: 'Universal SSO', type: 'OAuth/OIDC Provider', adoption: '100%' },
                      { id: '2', name: 'KIDEX Platform', type: 'Conductor Intel App', adoption: '100%' },
                      { id: '3', name: 'ClassScout NYC', type: 'Class Catalog App', adoption: '100%' }
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
            } />

            {/* TAB 5: VOCABULARY DICTIONARY */}
            <Route path="/vocabulary" element={
              <Stack gap="xl">
                <PageHeader 
                  title="Semantic Dictionary & Testing Matrix" 
                  description="Test all GDS semantic actions across interactive feedback loops. Every action resolves 1:1 to a specific Tabler icon, tone, and localized phrase."
                />
                
                <Stack gap="md">
                  {(Object.keys(GdsVocabulary) as SemanticAction[]).map(action => (
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
            } />

            {/* TAB 6: THEMED ANALYTICS & CHARTS */}
            <Route path="/analytics" element={
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

                <Divider />

                <Stack gap="md">
                  <Title order={3}>Adoption Metadata Ledger</Title>
                  <DataTable 
                    columns={[
                      { key: 'repo', label: 'Repository' },
                      { key: 'category', label: 'Archetype' },
                      { key: 'coverage', label: 'Token Coverage' },
                      { key: 'status', label: 'Governance Grade' }
                    ]}
                    data={[
                      { repo: 'Universal SSO', category: 'OAuth / Documentation Portal', coverage: '100% Core Primitives', status: 'A+' },
                      { repo: 'KIDEX Intel Platform', category: 'Conductor Assessment Tool', coverage: '98% Theme & Layouts', status: 'A' },
                      { repo: 'ClassScout NYC', category: 'Public Classes & Camp Directory', coverage: '100% Grid & Details', status: 'A+' },
                      { repo: 'Messmass Analytics', category: 'Executive Visualization Console', coverage: '96% Form Fields', status: 'A' }
                    ]}
                  />
                </Stack>
              </Stack>
            } />
          </Routes>
        </Box>
      </AppShell>
    </GdsProvider>
  );
}

export default function App() {
  return (
    <Router basename="/general-design-system">
      <PlaygroundContent />
    </Router>
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
