import { Anchor, AspectRatio, Badge, Button, Image, Stack, Text } from '@mantine/core';
import {
  AccentPanel,
  BrowseSurface,
  ConsumerSection,
  DocsPageShell,
  EditorialCard,
  EditorialHero,
  FeatureBand,
  MediaField,
  PlaceholderPanel,
  PublicBrandFooter,
  PublicShell,
  SimpleDataTable,
  StatsSection,
} from '@doneisbetter/gds-core/server';
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
          title="Build public pages from @doneisbetter/gds-core/server"
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
          variant="process"
          columns={3}
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
        <BrowseSurface
          eyebrow="Browse contract"
          title="Canonical discovery chrome"
          description="Result headers, scope chips, filters, and mobile filter controls now live in one governed contract."
          resultCount={24}
          activeFilters={[{ id: 'server', label: 'Server-safe' }, { id: 'published', label: 'Published' }]}
          scopeOptions={[
            { id: 'all', label: 'All surfaces', active: true },
            { id: 'public', label: 'Public only' },
          ]}
          toolbar={{ searchSlot: <input aria-label="Search contracts" /> }}
          sortControl={<Button variant="default">Newest first</Button>}
          mobileFilters={<Button variant="default">Open filters</Button>}
          content={(
            <EditorialCard
              eyebrow="Example"
              title="Reference browse card"
              description="Browse surfaces can render any governed content region beneath the shared toolbar."
              badge="Shared"
              ctaLabel="Inspect"
              variant="featured"
            />
          )}
        />
        <ConsumerSection
          title="Consumer dashboard shell"
          description="Account and member dashboards can group reusable summaries inside the shared section contract."
          action={<Button variant="default">Manage</Button>}
        >
          <SimpleDataTable
            columns={[
              { key: 'metric', header: 'Metric' },
              { key: 'value', header: 'Value' },
            ]}
            rows={[
              { metric: 'Saved views', value: '12' },
              { metric: 'Pending actions', value: '3' },
            ]}
          />
        </ConsumerSection>
        <AccentPanel tone="blue" title="Canonical accent surface" badge="Shared contract">
          <Text>
            This panel uses the canonical GDS accent-surface contract instead of consumer-local `light-dark(...)`
            styling.
          </Text>
        </AccentPanel>
        <MediaField
          label="Media field contract"
          description="Upload, URL entry, preview, and policy guidance live in a single governed surface."
          preview={
            <AspectRatio ratio={16 / 9}>
              <Image
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
                alt="Media field preview"
              />
            </AspectRatio>
          }
          uploadControl={<Button variant="default">Upload image</Button>}
          urlInput={<input aria-label="Media URL" defaultValue="https://example.com/hero.jpg" />}
          helpText="Keep alt text and rights metadata with the selected asset."
          policyText="Use approved public media only."
          value="https://example.com/hero.jpg"
          state="saved"
        />
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
