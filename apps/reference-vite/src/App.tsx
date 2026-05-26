import { Anchor, AspectRatio, Button, Image, Stack, Text } from '@mantine/core';
import {
  AccessRecoveryPanel,
  AccentPanel,
  BrowseSurface,
  ConsumerSection,
  CtaButtonGroup,
  DocsPageShell,
  EditorialCard,
  EditorialHero,
  FeatureBand,
  MediaField,
  PlaceholderPanel,
  PublicBrandFooter,
  PublicProductCard,
  PublicShell,
  SimpleDataTable,
  StatsSection,
  ThemeToggle,
} from '@doneisbetter/gds-core/client';

export function App() {
  const installCode = `npm install @doneisbetter/gds-theme @doneisbetter/gds-core @doneisbetter/gds-admin
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;

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
          title="Public/editorial primitives now live in @doneisbetter/gds-core"
          description="Consumers can adopt the shared package line directly on Mantine 8.3.x or 9.2.x without local CSS authorities or mirror packages."
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
        <Text component="pre" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          {installCode}
        </Text>
        <FeatureBand
          variant="process"
          items={[
            {
              id: 'trust',
              title: 'Trusted runtime path',
              description: 'Registry-first installs remain the target, and release-asset installs stay CI-safe until public npm publication is live.',
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
        <AccentPanel tone="green" title="Migration-safe adoption" badge="2.5.0">
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
        <BrowseSurface
          eyebrow="Shared browse"
          title="Discovery surfaces can stay package-native"
          description="Consumers no longer need product-local filter headers to build browse pages."
          resultCount={9}
          activeFilters={[{ id: 'featured', label: 'Featured' }]}
          scopeOptions={[
            { id: 'all', label: 'All', active: true },
            { id: 'regional', label: 'Regional' },
          ]}
          toolbar={{ searchSlot: <input aria-label="Search browse items" /> }}
          mobileFilters={<Button variant="default">Filters</Button>}
          content={(
            <EditorialCard
              eyebrow="Editorial"
              title="Shared guide card"
              description="Editorial and promo cards now share one canonical contract."
              badge="Guide"
              tone="cool"
              ctaLabel="Read guide"
            />
          )}
        />
        <ConsumerSection
          title="Consumer summary"
          description="Member/account surfaces can use the same reusable section shell."
          action={<Button variant="default">View all</Button>}
        >
          <SimpleDataTable
            columns={[{ key: 'label', header: 'Label' }, { key: 'value', header: 'Value' }]}
            rows={[
              { label: 'Favorites', value: '18' },
              { label: 'Alerts', value: '2' },
            ]}
          />
        </ConsumerSection>
        <MediaField
          label="Shared media field"
          description="Package-native media editing flow with preview and URL entry."
          preview={
            <AspectRatio ratio={16 / 9}>
              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
                alt="Selected menu photography"
              />
            </AspectRatio>
          }
          uploadControl={<Button variant="default">Upload asset</Button>}
          urlInput={<input aria-label="Asset URL" defaultValue="https://example.com/media.jpg" />}
          helpText="Use one reviewed media field instead of separate custom upload and preview widgets."
          policyText="Only licensed and approved public imagery may be published."
          value="https://example.com/media.jpg"
          state="saved"
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
