import { Anchor, AspectRatio, Badge, Button, Image, Stack, Text } from '@mantine/core';
import {
  AccentPanel,
  DocsPageShell,
  EditorialHero,
  FeatureBand,
  PlaceholderPanel,
  PublicBrandFooter,
  PublicShell,
  SimpleDataTable,
  StatsSection,
} from '@gds/core/server';
import { ClientPanel } from './client-panel';

export default function Page() {
  return (
    <PublicShell
      brand={<strong>GDS Next Reference</strong>}
      navItems={[
        { id: 'home', label: 'Home', href: '/' },
        { id: 'docs', label: 'Docs', href: '/docs' },
      ]}
      activeNavId="home"
      actions={<Button variant="default">Status</Button>}
      footer="Next.js App Router consumer reference"
      headerVariant="compact"
      mobileNavigationMode="drawer"
      mobileNavigation={
        <>
          <Anchor href="/">Home</Anchor>
          <Anchor href="/docs">Docs</Anchor>
        </>
      }
    >
      <DocsPageShell
        breadcrumbs={[{ label: 'Reference', href: '/' }, { label: 'Overview' }]}
        title="App Router package consumption"
        lead="This route proves the server-safe and client-safe GDS entrypoints."
        sideRail={<ClientPanel />}
      >
        <EditorialHero
          eyebrow="Server-safe public surface"
          title="Build public pages from @gds/core/server"
          description="This hero, feature band, stats section, accent panel, and branded footer all render from the server-safe package surface."
          actions={[
            { label: 'Read compatibility', href: '/docs', variant: 'primary' },
            { label: 'Open migration guide', href: '/migration', variant: 'secondary' },
          ]}
          meta={[
            { id: 'stack', label: 'Next.js App Router' },
            { id: 'mode', label: 'Server component safe' },
          ]}
          media={
            <AspectRatio ratio={16 / 11}>
              <Image
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
                alt="Collaborative product planning wall"
              />
            </AspectRatio>
          }
        />
        <FeatureBand
          items={[
            {
              id: 'bootstrap',
              title: 'One bootstrap path',
              description: 'Use the documented root split for App Router and keep GdsProvider client-only.',
              meta: 'Server layout + client providers',
            },
            {
              id: 'accents',
              title: 'Accent-safe surfaces',
              description: 'Use AccentPanel instead of page-local light/dark background guesses.',
              meta: 'Readable in light, dark, and auto',
            },
            {
              id: 'exports',
              title: 'Hardened exports',
              description: 'The release gate now verifies published server/client entrypoints against source intent.',
              meta: 'Build safety before publish',
            },
          ]}
        />
        <StatsSection title="Adoption summary">
          <SimpleDataTable
            columns={[
              { key: 'surface', header: 'Surface' },
              { key: 'status', header: 'Status' },
            ]}
            rows={[
              { surface: 'Provider', status: 'Shared' },
              { surface: 'Theme', status: 'Preset-based' },
            ]}
          />
        </StatsSection>
        <AccentPanel tone="blue" title="Canonical accent surface" badge="Shared contract">
          <Text>
            This panel uses the canonical GDS accent-surface contract instead of consumer-local `light-dark(...)`
            styling.
          </Text>
        </AccentPanel>
        <PlaceholderPanel
          title="Future rollout"
          description="Additional product surfaces can adopt the same package path without local forks."
          mode="placeholder"
          badge="Roadmap"
        />
        <PublicBrandFooter
          layoutVariant="balanced-quote"
          brandTitle="GDS reference consumer"
          description="Public footer storytelling, legal scaffolding, and utility links now live in shared core primitives."
          actions={
            <Stack gap="xs">
              <Anchor href="/support">Support</Anchor>
              <Anchor href="/status">Status</Anchor>
            </Stack>
          }
          secondary={
            <Stack gap="xs">
              <Badge variant="light" color="violet" w="fit-content">
                Quote
              </Badge>
              <Text size="sm" c="dimmed">
                “Shared contracts are only real when the reference consumer can ship without local layout authority.”
              </Text>
            </Stack>
          }
          legal="© Sovereign Squad. Shared package-consumption reference."
        />
      </DocsPageShell>
    </PublicShell>
  );
}
