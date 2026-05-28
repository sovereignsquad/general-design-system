import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ActionBar, DocsCodeBlock, ListingCard, SemanticButton, ThemeToggle } from '@doneisbetter/gds-core';
import { FormSection, PageHeader } from '@doneisbetter/gds-admin';
import {
  GdsProvider,
  createPublicBrandTheme,
  gdsDarkPublicTheme,
  gdsEditorialPublicTheme,
  gdsFlatSurfaceTheme,
  gdsTheme,
} from '@doneisbetter/gds-theme';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Divider,
  Group,
  List,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconPalette,
  IconShieldCheck,
} from '@tabler/icons-react';

const installCode = `npm install @doneisbetter/gds
npm install -D @doneisbetter/gds-eslint-config @doneisbetter/gds-compliance`;

const peerCode = `npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;

const appRouterCode = `// app/layout.tsx
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/providers.tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}`;

const strictModeCode = `{
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"]
  }
}`;

const codemodCode = `node scripts/codemods/run-codemod.mjs discovery-shell ./src
node scripts/codemods/run-codemod.mjs action-bar ./src
node scripts/codemods/run-codemod.mjs listing-card ./src`;

const consumerUsageCode = `import { DiscoveryShell, ActionBar, ListingCard, GdsProvider } from '@doneisbetter/gds/client';

export function App() {
  return (
    <GdsProvider>
      <DiscoveryShell
        header={<div>Catalog</div>}
        sidebar={<div>Sidebar navigation</div>}
      >
        <ActionBar primary={{ action: 'save' }} />
        <ListingCard
          title="Sample listing"
          metadata={[{ id: 'date', label: 'Date', value: 'June 14' }]}
          primaryAction={<button type="button">Open</button>}
        />
      </DiscoveryShell>
    </GdsProvider>
  );
}`;

const verificationCode = `npm install
npm run build
npm run test:run
npm run verify:mantine
gds-compliance check --manifest ./gds-adoption.json`;

const featureRequestRecipient = 'moldovancsaba+general.design.system@gmail.com';
const themeGovernanceUrl = 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md';
const exceptionSurfacesUrl = 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md';

type ThemePresetId = 'default' | 'dark-public' | 'flat-surface' | 'editorial' | 'brand';
type ThemeSchemeId = 'light' | 'dark' | 'auto';

function TokensThemeLab() {
  const [preset, setPreset] = useState<ThemePresetId>('default');
  const [colorScheme, setColorScheme] = useState<ThemeSchemeId>('light');
  const [brandPrimary, setBrandPrimary] = useState('blue');
  const [brandFlatSurfaces, setBrandFlatSurfaces] = useState(true);
  const [brandEditorialSerif, setBrandEditorialSerif] = useState(false);

  const selectedTheme = useMemo(() => {
    switch (preset) {
      case 'dark-public':
        return gdsDarkPublicTheme;
      case 'flat-surface':
        return gdsFlatSurfaceTheme;
      case 'editorial':
        return gdsEditorialPublicTheme;
      case 'brand':
        return createPublicBrandTheme({
          flatSurfaces: brandFlatSurfaces,
          editorialSerif: brandEditorialSerif,
          overrides: {
            primaryColor: brandPrimary,
          },
        });
      default:
        return gdsTheme;
    }
  }, [brandEditorialSerif, brandFlatSurfaces, brandPrimary, preset]);

  const previewKey = `${preset}-${colorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}`;

  const tokenSwatches = [
    { name: 'Primary 6', variable: '--mantine-color-violet-6', color: 'var(--mantine-color-violet-6)' },
    { name: 'Body', variable: '--mantine-color-body', color: 'var(--mantine-color-body)' },
    { name: 'Text', variable: '--mantine-color-text', color: 'var(--mantine-color-text)' },
    { name: 'Border', variable: '--mantine-color-default-border', color: 'var(--mantine-color-default-border)' },
    { name: 'Success 6', variable: '--mantine-color-teal-6', color: 'var(--mantine-color-teal-6)' },
    { name: 'Warning 6', variable: '--mantine-color-orange-6', color: 'var(--mantine-color-orange-6)' },
  ];

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="md">
            <Title order={4}>Theme Preset</Title>
            <Select
              label="Preset"
              value={preset}
              onChange={(value) => setPreset((value as ThemePresetId) || 'default')}
              data={[
                { value: 'default', label: 'Default runtime theme' },
                { value: 'dark-public', label: 'Dark public theme' },
                { value: 'flat-surface', label: 'Flat surface theme' },
                { value: 'editorial', label: 'Editorial serif theme' },
                { value: 'brand', label: 'Brand theme generator' },
              ]}
            />
            <Select
              label="Preview color scheme"
              value={colorScheme}
              onChange={(value) => setColorScheme((value as ThemeSchemeId) || 'light')}
              data={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto' },
              ]}
            />
            <Text size="sm" c="dimmed">
              This remounts an isolated preview provider so you can test presets without changing the whole docs site.
            </Text>
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="xl">
          <Stack gap="md">
            <Title order={4}>Brand Builder Options</Title>
            <Select
              label="Brand primary color"
              value={brandPrimary}
              onChange={(value) => setBrandPrimary(value || 'blue')}
              disabled={preset !== 'brand'}
              data={['blue', 'violet', 'teal', 'grape', 'indigo', 'orange']}
            />
            <Checkbox
              label="Use flat surfaces"
              checked={brandFlatSurfaces}
              onChange={(event) => setBrandFlatSurfaces(event.currentTarget.checked)}
              disabled={preset !== 'brand'}
            />
            <Checkbox
              label="Use editorial serif headings"
              checked={brandEditorialSerif}
              onChange={(event) => setBrandEditorialSerif(event.currentTarget.checked)}
              disabled={preset !== 'brand'}
            />
            <Text size="sm" c="dimmed">
              The brand builder composes the shipped theme helpers instead of inventing a site-only styling system.
            </Text>
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="xl">
          <Stack gap="md">
            <Title order={4}>Shipped Theme Lanes</Title>
            <List spacing="xs" size="sm">
              <List.Item>`gdsTheme`</List.Item>
              <List.Item>`gdsDarkPublicTheme`</List.Item>
              <List.Item>`gdsFlatSurfaceTheme`</List.Item>
              <List.Item>`gdsEditorialPublicTheme`</List.Item>
              <List.Item>`createPublicBrandTheme(...)`</List.Item>
            </List>
            <Code block>{preset === 'brand'
              ? `createPublicBrandTheme({ flatSurfaces: ${brandFlatSurfaces}, editorialSerif: ${brandEditorialSerif}, overrides: { primaryColor: '${brandPrimary}' } })`
              : preset === 'dark-public'
                ? 'gdsDarkPublicTheme'
                : preset === 'flat-surface'
                  ? 'gdsFlatSurfaceTheme'
                  : preset === 'editorial'
                    ? 'gdsEditorialPublicTheme'
                    : 'gdsTheme'}</Code>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg" radius="xl">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={4}>
              <Title order={4}>Live Theme Preview</Title>
              <Text size="sm" c="dimmed">
                Test preset composition, color scheme behavior, typography, actions, cards, and token usage in a real isolated GDS provider.
              </Text>
            </Stack>
            <ThemeToggle />
          </Group>

          <GdsProvider key={previewKey} theme={selectedTheme} defaultColorScheme={colorScheme}>
            <Paper withBorder p="lg" radius="xl">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Stack gap={4}>
                    <Title order={3}>Theme Preview Surface</Title>
                    <Text size="sm" c="dimmed">
                      Preset: {preset} · Color scheme: {colorScheme}
                    </Text>
                  </Stack>
                  <ThemeToggle />
                </Group>

                <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                  <Stack gap="md">
                    <ActionBar
                      primary={{ action: 'save', size: 'sm' }}
                      secondary={[{ action: 'cancel', size: 'sm' }]}
                      tertiary={[{ action: 'preview', size: 'sm' }]}
                      iconOnly={[{ action: 'settings' }]}
                    />
                    <TextInput label="Theme-aware input" placeholder="Preview form field treatment" />
                    <Group gap="sm" wrap="wrap">
                      <Badge variant="light">Runtime</Badge>
                      <Badge color="teal" variant="light">Success</Badge>
                      <Badge color="orange" variant="light">Warning</Badge>
                      <Badge color="red" variant="light">Danger</Badge>
                    </Group>
                  </Stack>

                  <ListingCard
                    title="Theme Lab Reference Card"
                    description="Use this preview to evaluate spacing, type hierarchy, borders, elevation, and primary-accent behavior."
                    metadata={[
                      { id: 'preset', label: 'Preset', value: preset },
                      { id: 'scheme', label: 'Color scheme', value: colorScheme },
                    ]}
                    primaryAction={<SemanticButton action="preview" size="sm" />}
                    saveAction={{ action: 'save' }}
                    shareAction={{ action: 'forward' }}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 2, md: 3, xl: 6 }} spacing="md">
                  {tokenSwatches.map((swatch) => (
                    <Paper key={swatch.variable} withBorder p="sm" radius="lg">
                      <Box style={{ height: 56, borderRadius: 10, background: swatch.color, marginBottom: 8 }} />
                      <Text fw={700} size="xs">{swatch.name}</Text>
                      <Code block fz="9px" mt={4}>{swatch.variable}</Code>
                    </Paper>
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          </GdsProvider>
        </Stack>
      </Paper>
    </Stack>
  );
}

export function OverviewPage() {
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestFeature, setRequestFeature] = useState('');
  const [requestUseCase, setRequestUseCase] = useState('');

  const handleFeatureRequestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = requestFeature.trim()
      ? `GDS Feature Request: ${requestFeature.trim()}`
      : 'GDS Feature Request';

    const body = [
      'Feature request for the General Design System',
      '',
      `Name: ${requestName.trim() || 'Not provided'}`,
      `Email: ${requestEmail.trim() || 'Not provided'}`,
      '',
      'Requested feature:',
      requestFeature.trim() || 'Not provided',
      '',
      'Use case / missing capability:',
      requestUseCase.trim() || 'Not provided',
    ].join('\n');

    window.location.href = `mailto:${featureRequestRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
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
              Every action has exactly one designated icon and semantic tone across all apps. No overlapping checks or duplicate verbs.
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
              Downstream products consume shared packages directly under a unified schema, eliminating local drift and redundant adapters.
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
              Product layouts are built exclusively with GDS tokenized primitives, eliminating scattered class hierarchies.
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
              Direct npm package adoption is live and verified for React 19 with Mantine 8.3.x and 9.2.x. GitHub release bundles remain an operational fallback path only.
            </Text>
          </Stack>
        </Paper>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
          {['sso', 'kidex', 'classscout', 'messmass', 'narimato', 'general-design-system'].map((app) => (
            <Paper key={app} withBorder p="md" radius="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Badge color="teal" variant="light">GDS 2.6.4</Badge>
              <Text fw={700} size="sm" tt="uppercase">{app.replace('-', ' ')}</Text>
              <Text size="xs" c="dimmed">Release-aligned</Text>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>

      <Paper withBorder p="xl" radius="xl">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Stack gap={4}>
              <Title order={2}>Foundation Slice: Shell, Navigation, and Actions</Title>
              <Text size="sm" c="dimmed" maw={720}>
                The current implementation ships governed shells, semantic navigation, and standardized CTA hierarchy across both public and admin experiences.
              </Text>
            </Stack>
            <Badge color="teal" variant="light">Implemented in GDS core/admin</Badge>
          </Group>
          <Group gap="sm" wrap="wrap">
            <SemanticButton action="save" />
            <SemanticButton action="cancel" variant="light" />
            <SemanticButton action="preview" variant="subtle" />
            <SemanticButton action="settings" variant="default" />
          </Group>
        </Stack>
      </Paper>

      <FormSection title="Request a Feature" description="If something useful is missing from GDS, send it directly to the maintainers. This first version uses your local mail client.">
        <Paper withBorder p="xl" radius="xl">
          <Stack gap="lg">
            <Text size="sm" c="dimmed" maw={760}>
              Keep it simple: describe the missing function, what product surface needs it, and why the existing primitives are not enough. The request opens an email draft to <Anchor href={`mailto:${featureRequestRecipient}`}>{featureRequestRecipient}</Anchor>.
            </Text>

            <Box component="form" onSubmit={handleFeatureRequestSubmit}>
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Name"
                    placeholder="Optional"
                    value={requestName}
                    onChange={(event) => setRequestName(event.currentTarget.value)}
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    placeholder="Optional"
                    value={requestEmail}
                    onChange={(event) => setRequestEmail(event.currentTarget.value)}
                  />
                </SimpleGrid>

                <TextInput
                  label="Requested feature"
                  placeholder="Example: DiscoveryShell support for pinned secondary filters"
                  required
                  value={requestFeature}
                  onChange={(event) => setRequestFeature(event.currentTarget.value)}
                />

                <Textarea
                  label="Use case"
                  placeholder="What workflow is blocked or awkward today? Which product or screen needs this?"
                  minRows={5}
                  value={requestUseCase}
                  onChange={(event) => setRequestUseCase(event.currentTarget.value)}
                />

                <Group justify="space-between" align="center" gap="md" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    If the form does not open your mail app, send the request manually to {featureRequestRecipient}.
                  </Text>
                  <Button type="submit">Open Email Draft</Button>
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </FormSection>
    </Stack>
  );
}

export function InstallPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Installation Manual"
        description="This is the production install path for consumer teams. Install from npm, mount one provider, adopt canonical primitives, then enforce compliance in CI."
      />

      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
        {[
          { step: '1', title: 'Install packages', detail: 'Use npm for the runtime and governance packages.' },
          { step: '2', title: 'Mount one provider', detail: 'Root ownership belongs to one GdsProvider only.' },
          { step: '3', title: 'Use canonical surfaces', detail: 'Adopt DiscoveryShell, ActionBar, ListingCard, MapPanel, and DetailProfileShell where applicable.' },
          { step: '4', title: 'Enforce in CI', detail: 'Run build, tests, verify:mantine, and gds-compliance before merge.' },
        ].map((item) => (
          <Paper key={item.step} withBorder p="lg" radius="xl">
            <Stack gap="sm">
              <Badge variant="light" color="teal">Step {item.step}</Badge>
              <Title order={4}>{item.title}</Title>
              <Text size="sm" c="dimmed">{item.detail}</Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <FormSection title="Canonical Install Commands" description="This is the supported production install path for all consumer repos.">
        <DocsCodeBlock title="Runtime + governance packages" language="bash" code={installCode} />
      </FormSection>

      <FormSection title="Required Peer Packages" description="Consumers must provide the Mantine runtime explicitly.">
        <DocsCodeBlock title="Peer installation" language="bash" code={peerCode} />
      </FormSection>

      <FormSection title="Canonical Next.js Bootstrap" description="Mount GDS once at the root and separate client/server usage correctly.">
        <DocsCodeBlock title="App Router root contract" language="tsx" code={appRouterCode} />
      </FormSection>

      <FormSection title="Canonical Usage Shape" description="Install is only the first step. Consumers are expected to compose around the shared primitives rather than creating a parallel UI authority.">
        <DocsCodeBlock title="Shared package usage" language="tsx" code={consumerUsageCode} />
      </FormSection>

      <FormSection title="Required Verification Before Adoption" description="A consumer is not considered ready until the install, build, type, and governance checks are passing together.">
        <DocsCodeBlock title="Verification contract" language="bash" code={verificationCode} />
      </FormSection>

      <FormSection title="Strict GDS-only Compliance" description="Enable strict mode after the canonical shell, action, listing, and detail primitives are in place.">
        <DocsCodeBlock title="gds-adoption.json compliance block" language="json" code={strictModeCode} />
      </FormSection>

      <FormSection title="Reference Migration Codemods" description="Use the repo codemods in dry-run mode first to safely identify mechanical migrations before enabling strict mode.">
        <DocsCodeBlock title="Codemod dry-run commands" language="bash" code={codemodCode} />
      </FormSection>

      <FormSection title="What To Read First" description="These rulebooks and proof documents are the required onboarding sequence.">
        <Paper withBorder p="lg" radius="xl">
          <List spacing="sm" size="sm">
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/README.md" target="_blank" rel="noreferrer">README.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md" target="_blank" rel="noreferrer">INSTALLATION_GUIDE.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/COMPATIBILITY_AND_RELEASES.md" target="_blank" rel="noreferrer">COMPATIBILITY_AND_RELEASES.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/FOUNDATION.md" target="_blank" rel="noreferrer">FOUNDATION.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/COMPONENTS_AND_PATTERNS.md" target="_blank" rel="noreferrer">COMPONENTS_AND_PATTERNS.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/GOVERNANCE_AND_ADOPTION.md" target="_blank" rel="noreferrer">GOVERNANCE_AND_ADOPTION.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/ADOPTION_AND_MIGRATION_PLAYBOOK.md" target="_blank" rel="noreferrer">ADOPTION_AND_MIGRATION_PLAYBOOK.md</Anchor></List.Item>
            <List.Item><Anchor href="https://github.com/sovereignsquad/general-design-system/blob/main/VERIFIED_CONSUMER_INSTALL_PROOF.md" target="_blank" rel="noreferrer">VERIFIED_CONSUMER_INSTALL_PROOF.md</Anchor></List.Item>
          </List>
        </Paper>
      </FormSection>
    </Stack>
  );
}

export function RulebookPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Rulebook & Operating Contract"
        description="Consumer repos may compose around GDS, but they may not create a second design-system authority. These are the rules that define a compliant adoption."
      />

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="sm">
            <Title order={3}>Authority</Title>
            <Text size="sm" c="dimmed">Use `@doneisbetter/gds` as the default public install path. Keep the granular `@doneisbetter/gds-*` packages for advanced consumers only. Do not use the old `@gds/*` names, vendored mirrors, or sibling `file:` links in CI or hosted builds.</Text>
          </Stack>
        </Paper>
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="sm">
            <Title order={3}>Runtime</Title>
            <Text size="sm" c="dimmed">Mount one `GdsProvider`, keep `client` and `server` imports separated, and extend the theme instead of forking it.</Text>
          </Stack>
        </Paper>
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="sm">
            <Title order={3}>Governance</Title>
            <Text size="sm" c="dimmed">Every consumer must carry a `gds-adoption.json` manifest and run the shared lint/compliance tooling in CI.</Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <FormSection title="Required Rules" description="These are the non-negotiables for teams consuming the system.">
        <Paper withBorder p="lg" radius="xl">
          <List spacing="sm" size="sm">
            <List.Item>Use GDS tokens, spacing, typography, and state patterns instead of page-local equivalents.</List.Item>
            <List.Item>Use `@doneisbetter/gds` as the default runtime package, or split into `@doneisbetter/gds-core` and `@doneisbetter/gds-admin` only when package-level separation is intentional.</List.Item>
            <List.Item>Use canonical primitives when the surface exists: `DiscoveryShell`, `ActionBar`, `ListingCard`, `MapPanel`, `DetailProfileShell`.</List.Item>
            <List.Item>Document all exceptions explicitly in the adoption manifest with owner and review date.</List.Item>
            <List.Item>Run `gds-compliance` and the shared ESLint config in CI before merging.</List.Item>
            <List.Item>Prefer upstreaming repeated gaps into GDS rather than creating product-local temporary primitives.</List.Item>
          </List>
        </Paper>
      </FormSection>

      <FormSection title="What Good Adoption Looks Like" description="This is the expected operational sequence for a team moving toward true GDS-only delivery.">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="sm">
              <Title order={4}>Do</Title>
              <List spacing="xs" size="sm">
                <List.Item>Install the packages directly from npm.</List.Item>
                <List.Item>Mount one `GdsProvider` at the root.</List.Item>
                <List.Item>Keep `server` and `client` imports separated intentionally.</List.Item>
                <List.Item>Replace local shells, card wrappers, and button stacks with the canonical primitives.</List.Item>
                <List.Item>Enable strict mode after migration, not before it.</List.Item>
              </List>
            </Stack>
          </Paper>
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="sm">
              <Title order={4}>Do Not</Title>
              <List spacing="xs" size="sm">
                <List.Item>Keep a second token or component authority active.</List.Item>
                <List.Item>Use sibling `file:` links in CI or hosted builds.</List.Item>
                <List.Item>Create local `AppShell`, `ButtonGroup`, or listing-card wrappers once GDS owns that surface.</List.Item>
                <List.Item>Treat the manifest as optional after adoption begins.</List.Item>
                <List.Item>Use GitHub release bundles as the default install path when npm is healthy.</List.Item>
              </List>
            </Stack>
          </Paper>
        </SimpleGrid>
      </FormSection>

      <FormSection title="Escalation Path For Teams" description="When a product gap exists, the correct response is governance, not silent divergence.">
        <Paper withBorder p="lg" radius="xl">
          <List spacing="sm" size="sm">
            <List.Item>If the primitive exists in GDS, adopt it directly.</List.Item>
            <List.Item>If a product-specific semantic action is missing, extend through a governed vocabulary pack.</List.Item>
            <List.Item>If a surface is genuinely missing, open a GDS issue and add only a narrow temporary exception in `gds-adoption.json`.</List.Item>
            <List.Item>If the repo is ready for hard enforcement, enable `strictMode` and keep exceptions explicit and reviewed.</List.Item>
          </List>
        </Paper>
      </FormSection>

      <FormSection title="Verification Commands" description="These checks are the minimum operator and consumer contract.">
        <DocsCodeBlock
          title="Verification"
          language="bash"
          code={`npm run verify:release
npm run verify:published
npm run verify:mantine
npm run verify:references`}
        />
      </FormSection>
    </Stack>
  );
}

export function TokensPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Color Systems & Theme Tokens"
        description="Inspect the shipped token lanes, test the available theme presets, and evaluate light/dark behavior in a live isolated preview instead of a static swatch wall."
      />

      <Paper withBorder p="lg" radius="xl">
        <Stack gap="sm">
          <Title order={4}>What this page is for</Title>
          <Text size="sm" c="dimmed">
            Use this route to test the shipped theme lanes, compare light and dark behavior, and understand the creator-theme boundary before inventing product-local token logic.
          </Text>
          <Group gap="sm" wrap="wrap">
            <Anchor href={themeGovernanceUrl} target="_blank" rel="noreferrer">Open theme governance</Anchor>
            <Anchor href={exceptionSurfacesUrl} target="_blank" rel="noreferrer">Open exception-surface rules</Anchor>
          </Group>
        </Stack>
      </Paper>

      <FormSection title="Theme Lab" description="Test the actual shipped GDS theme presets and color-scheme behavior. This is the fastest way to understand what is already available without reading source files.">
        <TokensThemeLab />
      </FormSection>

      <FormSection title="Brand Primaries" description="Our central core tones drive semantic hierarchy and layout surfaces.">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
          {[
            { name: 'Teal (Brand Primary)', hex: '#0ca678', variable: 'var(--mantine-color-teal-6)' },
            { name: 'Teal Hover', hex: '#099268', variable: 'var(--mantine-color-teal-7)' },
            { name: 'Indigo (Brand Secondary)', hex: '#4c6ef5', variable: 'var(--mantine-color-indigo-6)' },
            { name: 'Violet (Admin Accents)', hex: '#7950f2', variable: 'var(--mantine-color-violet-6)' },
            { name: 'Orange (Warning/Focus)', hex: '#fd7e14', variable: 'var(--mantine-color-orange-6)' },
            { name: 'Charcoal (Text/Dark)', hex: '#212529', variable: 'var(--mantine-color-dark-8)' },
          ].map((color) => (
            <Paper key={color.name} withBorder p="sm" radius="lg">
              <Box style={{ height: 60, backgroundColor: color.hex, borderRadius: 8, marginBottom: 8 }} />
              <Text fw={700} size="xs">{color.name}</Text>
              <Code block fz="9px" mt={4}>{color.variable}</Code>
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

      <FormSection title="How To Use These Theme Lanes" description="The token and preset layer is already shipped in the runtime packages. Consumers should select or extend these lanes instead of forking a second theme authority.">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <DocsCodeBlock
            title="Direct preset usage"
            language="tsx"
            code={`import { GdsProvider, gdsDarkPublicTheme } from '@doneisbetter/gds-theme/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
      {children}
    </GdsProvider>
  );
}`}
          />
          <DocsCodeBlock
            title="Brand theme composition"
            language="tsx"
            code={`import { GdsProvider, createPublicBrandTheme } from '@doneisbetter/gds-theme/client';

const brandTheme = createPublicBrandTheme({
  flatSurfaces: true,
  editorialSerif: false,
  overrides: {
    primaryColor: 'blue',
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider theme={brandTheme}>{children}</GdsProvider>;
}`}
          />
        </SimpleGrid>
      </FormSection>

      <FormSection title="Creator-Authored Experience Boundary" description="Some products need a branded or creator-owned canvas. That is allowed only as a bounded experience override lane, never as a second application theme authority.">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="sm">
              <Title order={4}>What stays GDS-owned</Title>
              <List spacing="xs" size="sm">
                <List.Item>Public shell and navigation</List.Item>
                <List.Item>Shared controls and semantic actions</List.Item>
                <List.Item>Consent, legal, recovery, and system messaging</List.Item>
                <List.Item>Accessibility baseline and state semantics</List.Item>
              </List>
            </Stack>
          </Paper>
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="sm">
              <Title order={4}>What may be creator-owned</Title>
              <List spacing="xs" size="sm">
                <List.Item>A bounded experience canvas only</List.Item>
                <List.Item>Scoped presentation overrides after base experience styles</List.Item>
                <List.Item>Decorative media, color, and typography inside that canvas</List.Item>
                <List.Item>Product-managed storage and moderation of the override payload</List.Item>
              </List>
            </Stack>
          </Paper>
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="xs">
              <Title order={5}>Allowed override modes</Title>
              <List spacing="xs" size="sm">
                <List.Item>Scoped class hooks on the approved canvas root</List.Item>
                <List.Item>Scoped CSS applied after base experience styles</List.Item>
                <List.Item>Creator-owned decorative media and bounded typography choices</List.Item>
              </List>
            </Stack>
          </Paper>
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="xs">
              <Title order={5}>Operational requirements</Title>
              <List spacing="xs" size="sm">
                <List.Item>Malformed overrides must fail back to base GDS presentation</List.Item>
                <List.Item>Products still own moderation and payload sanitization</List.Item>
                <List.Item>Broken override loads must be visible to operators</List.Item>
              </List>
            </Stack>
          </Paper>
          <Paper withBorder p="lg" radius="xl">
            <Stack gap="xs">
              <Title order={5}>Never allowed</Title>
              <List spacing="xs" size="sm">
                <List.Item>Replacing `PublicShell`, `PublicNav`, or shared app chrome</List.Item>
                <List.Item>Hiding consent, legal, recovery, or other required system controls</List.Item>
                <List.Item>Using creator CSS as a second app-wide theme authority</List.Item>
              </List>
            </Stack>
          </Paper>
        </SimpleGrid>
        <Paper withBorder p="lg" radius="xl">
          <Stack gap="xs">
            <Title order={4}>Required render order</Title>
            <List spacing="xs" size="sm">
              <List.Item>Render GDS shell and system-owned controls first.</List.Item>
              <List.Item>Render the approved creator canvas second.</List.Item>
              <List.Item>Apply creator-scoped overrides only after base experience styles and only inside that canvas.</List.Item>
              <List.Item>Fall back safely to the base GDS presentation when override data is missing or invalid.</List.Item>
            </List>
          </Stack>
        </Paper>
        <DocsCodeBlock
          title="Creator-authored manifest shape"
          language="json"
          code={`{
  "surface": "Creator-authored campaign canvas",
  "category": "product-authored-experience",
  "scope": ["src/features/campaigns/creator-canvas/*.tsx"],
  "allowedImplementation": ["Scoped CSS inside the approved canvas root only"],
  "mustStillUse": ["GDS public shell", "GDS shared consent controls"],
  "mustNotDo": ["Replace app chrome", "Hide required legal controls"],
  "a11yRequirements": ["Shared controls stay keyboard accessible"],
  "testingRequirements": ["Fallback presentation covered in route verification"],
  "observabilityRequirements": ["Broken override payloads are visible to operators"]
}`}
        />
        <Text size="sm" c="dimmed">
          The normative rule text lives in <Anchor href={themeGovernanceUrl} target="_blank" rel="noreferrer">THEME_GOVERNANCE.md</Anchor> and <Anchor href={exceptionSurfacesUrl} target="_blank" rel="noreferrer">EXCEPTION_SURFACES.md</Anchor>. This route exists so teams can test the shipped theme lanes and understand the allowed boundary before they build local overrides.
        </Text>
      </FormSection>
    </Stack>
  );
}
