import { Anchor, AspectRatio, Button, Image, Stack, Text } from '@mantine/core';
import {
  AccessRecoveryPanel,
  AccentPanel,
  CtaButtonGroup,
  DocsPageShell,
  EditorialHero,
  FeatureBand,
  PlaceholderPanel,
  PublicBrandFooter,
  PublicProductCard,
  PublicShell,
  SimpleDataTable,
  StatsSection,
  ThemeToggle,
} from '@gds/core/client';

export function App() {
  return (
    <PublicShell
      brand={<strong>GDS Reference</strong>}
      navItems={[
        { id: 'home', label: 'Home', href: '/' },
        { id: 'docs', label: 'Docs', href: '/docs' },
      ]}
      activeNavId="docs"
      actions={<ThemeToggle />}
      footer="Vite public consumer reference"
      headerVariant="branded-quiet"
      mobileNavigationMode="inline-collapse"
      mobileNavigation={
        <>
          <Anchor href="/">Home</Anchor>
          <Anchor href="/docs">Docs</Anchor>
        </>
      }
    >
      <DocsPageShell
        breadcrumbs={[{ label: 'Docs', href: '/' }, { label: 'Install' }]}
        title="Install and adopt GDS"
        lead="This reference app consumes shared packages directly."
      >
        <EditorialHero
          eyebrow="Shared public storytelling"
          title="Public/editorial primitives now live in @gds/core"
          description="Consumers can build split hero, feature-band, accent, and branded footer sections without local CSS authorities."
          actions={[
            { label: 'Install packages', variant: 'primary' },
            { label: 'Read compatibility', variant: 'secondary' },
          ]}
          meta={[
            { id: 'runtime', label: 'Vite reference app' },
            { id: 'theme', label: 'Theme toggle enabled' },
          ]}
          media={
            <AspectRatio ratio={16 / 11}>
              <Image
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
                alt="Restaurant interior with warm lighting"
              />
            </AspectRatio>
          }
        />
        <CtaButtonGroup
          primary={<Button>Install packages</Button>}
          secondary={<Button variant="default">Read compatibility</Button>}
          tertiary={<Button variant="subtle">Review adoption manifest</Button>}
        />
        <FeatureBand
          items={[
            {
              id: 'trust',
              title: 'Trusted runtime path',
              description: 'Registry-first installs and reference consumers reduce private bootstrap invention.',
              meta: 'CI + Vercel safe',
            },
            {
              id: 'public',
              title: 'Public primitives',
              description: 'Editorial hero, feature band, product card, and branded footer now share one contract.',
              meta: 'No raw layout CSS required',
            },
            {
              id: 'governed',
              title: 'Governed accents',
              description: 'Accent panels stay readable across light and dark without consumer-local token patches.',
              meta: 'Accessibility-first defaults',
            },
          ]}
        />
        <AccentPanel tone="green" title="Migration-safe adoption" badge="2.4.3">
          Public and operator-facing accent surfaces now ship through GDS instead of product-local `bg=&quot;*.0&quot;`
          assumptions.
        </AccentPanel>
        <PlaceholderPanel
          title="Live reporting"
          description="This surface remains a governed placeholder until data is connected."
          badge="Coming soon"
          mode="placeholder"
        />
        <AccessRecoveryPanel
          state="expired-session"
          onSignIn={() => undefined}
          onBack={() => undefined}
        />
        <PublicProductCard
          title="Signature tasting"
          description="A media-first public card using the shared catalog contract."
          price="EUR 79"
          helperText="Ready for pickup after 18:30"
          helperKind="pickup"
          inventoryNote="12 tasting slots left"
          state="preorder"
          stateLabels={{ preorder: 'Reserve ahead' }}
          primaryAction={<Button>Reserve</Button>}
        />
        <StatsSection title="Regional summary">
          <SimpleDataTable
            columns={[{ key: 'name', header: 'Region' }, { key: 'value', header: 'Score' }]}
            rows={[{ name: 'North', value: '92' }]}
          />
        </StatsSection>
        <PublicBrandFooter
          layoutVariant="immersive-media"
          media={
            <AspectRatio ratio={4 / 3}>
              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
                alt="Chef plating a shared tasting menu"
              />
            </AspectRatio>
          }
          brandTitle="GDS public footer"
          description="Use the shared footer contract for narrative copy, utility links, and supporting content."
          actions={
            <Stack gap={4}>
              <Anchor href="/support">Support</Anchor>
              <Anchor href="/privacy">Privacy</Anchor>
            </Stack>
          }
          secondary={
            <Stack gap={4}>
              <Text fw={700}>Shared note</Text>
              <Text size="sm" c="dimmed">
                Quote-led or media-led closing surfaces no longer require local footer layout forks.
              </Text>
            </Stack>
          }
          legal="© Sovereign Squad. Vite reference consumer."
        />
      </DocsPageShell>
    </PublicShell>
  );
}
