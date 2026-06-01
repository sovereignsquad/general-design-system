import React from 'react';
import { Text, Title } from '@mantine/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { AccessSummary } from './AccessSummary';
import { AccessRecoveryPanel } from './AccessRecoveryPanel';
import { AccentPanel, resolveAccentPanelStyles } from './AccentPanel';
import { ActionBar } from './ActionBar';
import { ArticleShell } from './ArticleShell';
import { AuthShell } from './AuthShell';
import { BrowseSurface } from './BrowseSurface';
import { ConsumerDashboardGrid } from './ConsumerDashboardGrid';
import { ConsumerSection } from './ConsumerSection';
import { CtaButtonGroup } from './CtaButtonGroup';
import { ConfirmDialog } from './ConfirmDialog';
import { ChoiceChip } from './ChoiceChip';
import { DataToolbar } from './DataToolbar';
import { DetailProfileShell } from './DetailProfileShell';
import { DocsCodeBlock } from './DocsCodeBlock';
import { DocsShell } from './DocsShell';
import { DocsPageShell } from './DocsPageShell';
import { EmptyState } from './EmptyState';
import { EditorialCard } from './EditorialCard';
import { EditorialHero } from './EditorialHero';
import { FeatureBand } from './FeatureBand';
import { FoodMenuSection } from './FoodMenuSection';
import { GameBoardTile } from './GameBoardTile';
import { ChartTokenPanel } from './ChartTokenPanel';
import { EvidencePanel } from './EvidencePanel';
import { ListingCard } from './ListingCard';
import { MapPanel } from './MapPanel';
import { MediaField } from './MediaField';
import { MetricCard } from './MetricCard';
import { PageHeader } from './PageHeader';
import { PeriodSelector } from './PeriodSelector';
import { PlaceholderPanel } from './PlaceholderPanel';
import { PlaybackSurface } from './PlaybackSurface';
import { PublicFlowShell } from './PublicFlowShell';
import { PublicFoodCard } from './PublicFoodCard';
import { PublicBrandFooter } from './PublicBrandFooter';
import { PublicProductCard } from './PublicProductCard';
import { PublicNav } from './PublicNav';
import { PublicShell } from './PublicShell';
import { ShareButtonGroup } from './ShareButtonGroup';
import { DiscoveryShell } from './DiscoveryShell';
import { SemanticButton } from './SemanticButton';
import { SectionPanel } from './SectionPanel';
import { SidebarNav, SidebarNavItem, SidebarNavSection } from './SidebarNav';
import { SimpleDataTable } from './SimpleDataTable';
import { SocialAuthButtons } from './SocialAuthButtons';
import { ProviderIdentityButton, ProviderIdentityButtonGroup, getProviderIdentityLabel, getProviderIdentityPolicy, getSupportedProviderIdentityIds } from './ProviderIdentityButtons';
import { StateBlock } from './StateBlock';
import { StatsSection } from './StatsSection';
import { StatusBadge } from './StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { ReferenceThemeExplorer } from './ReferenceThemeExplorer';
import { ReportingSection } from './ReportingSection';
import { UploadDropzone } from './UploadDropzone';
import { resolveSurfacePresentationStyles } from './SurfacePresentation';
import { ar, de, en, es, fr, getGdsMessages, he, hu, it as itLocale, ru } from './locales';
import { GdsIcons } from './icons';
import { createGdsVocabularyPack, getSemanticActionLabel } from './vocabulary';

describe('@doneisbetter/gds-core', () => {
  it('renders semantic button labels from translation messages', () => {
    renderWithGds(<SemanticButton action="save" />, {
      messages: { 'gds.action.save': 'Speichern' },
    });

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  });

  it('exposes a server-safe semantic action label helper', () => {
    expect(getSemanticActionLabel('save')).toBe('Save');
    expect(getSemanticActionLabel('save', (id, fallback) => (id === 'gds.action.save' ? 'Guardar' : fallback))).toBe('Guardar');
  });

  it('shows success and error feedback states for semantic buttons', () => {
    const { rerender } = renderWithGds(<SemanticButton action="save" />);

    rerender(<SemanticButton action="save" feedbackState="success" />);
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();

    rerender(<SemanticButton action="save" feedbackState="error" />);
    expect(screen.getByRole('button', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('renders loading and disabled button states safely', () => {
    renderWithGds(<SemanticButton action="save" loading disabled />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('supports prerender label-only semantic buttons for static pages', () => {
    renderWithGds(<SemanticButton action="save" prerenderLabelOnly />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders choice chips as neutral links and toggle buttons', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithGds(
      <>
        <ChoiceChip label="Active link" href="/active" active />
        <ChoiceChip label="Toggle me" active onClick={onSelect} />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Active link' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Toggle me' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Toggle me' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders destructive confirm dialogs with the expected actions', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithGds(
      <ConfirmDialog opened onClose={onClose} onConfirm={onConfirm} title="Delete record">
        This action cannot be undone.
      </ConfirmDialog>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders empty states with optional action content', () => {
    renderWithGds(
      <EmptyState
        title="No projects yet"
        description="Create your first project to get started."
        action={<button type="button">Create project</button>}
      />,
    );

    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create project' })).toBeInTheDocument();
  });

  it('renders metric cards with trends and descriptions', () => {
    renderWithGds(
      <MetricCard
        label="Completion"
        value="87%"
        description="Weekly completion rate"
        trend={{ label: '+4%', tone: 'positive' }}
      />,
    );

    expect(screen.getByText('Completion')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('Weekly completion rate')).toBeInTheDocument();
    expect(screen.getByText('+4%')).toBeInTheDocument();
  });

  it('renders a canonical browse surface with scope controls and active filters', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onSelect = vi.fn();

    renderWithGds(
      <BrowseSurface
        eyebrow="Discover"
        title="Browse shared content"
        description="Use shared browse chrome instead of page-local filter stacks."
        resultCount={12}
        activeFilters={[{ id: 'published', label: 'Published', onRemove }]}
        scopeOptions={[
          { id: 'all', label: 'All regions', active: true, onSelect },
          { id: 'east', label: 'East', onSelect },
        ]}
        locationControls={<button type="button">Budapest</button>}
        toolbar={{ searchSlot: <input aria-label="Search records" /> }}
        sortControl={<button type="button">Newest first</button>}
        mobileFilters={<button type="button">Filters</button>}
        content={<div>Browse results</div>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Browse shared content' })).toBeInTheDocument();
    expect(screen.getByText('12 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Search records')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All regions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Budapest' })).toBeInTheDocument();
    expect(screen.getByText('Browse results')).toBeInTheDocument();

    await user.click(screen.getAllByText('Published')[0]);
    await user.click(screen.getByRole('button', { name: 'East' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders the discovery shell with grouped sidebar navigation', () => {
    renderWithGds(
      <DiscoveryShell
        header={<Text fw={700}>Operations shell</Text>}
        sidebar={(
          <SidebarNav>
            <SidebarNavSection label="Primary">
              <SidebarNavItem action="home" href="/" active />
              <SidebarNavItem action="settings" href="/settings" />
            </SidebarNavSection>
            <SidebarNavSection label="Account" pushToBottom>
              <SidebarNavItem action="logout" component="button" />
            </SidebarNavSection>
          </SidebarNav>
        )}
        footer={<button type="button">Home</button>}
      >
        <div>Discovery content</div>
      </DiscoveryShell>,
    );

    expect(screen.getByText('Operations shell')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByText('Discovery content')).toBeInTheDocument();
  });

  it('renders docs shell with governed header, sidebar sections, and docs content', () => {
    renderWithGds(
      <DocsShell
        brand={<Text fw={700}>General Design System</Text>}
        primaryNavigation={<SidebarNavItem href="/patterns" active label="Patterns" />}
        secondaryNavigation={<SidebarNavItem href="/themes" label="Themes" />}
        headerContext="Official docs shell"
        actions={<button type="button">Theme toggle</button>}
        contentWidth="full"
      >
        <Text>Docs shell content area</Text>
      </DocsShell>,
    );

    expect(screen.getByText('General Design System')).toBeInTheDocument();
    expect(screen.getByText('Official docs shell')).toBeInTheDocument();
    expect(screen.getByText('Docs shell content area')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Patterns' })).toHaveAttribute('href', '/patterns');
    expect(screen.getByRole('link', { name: 'Themes' })).toHaveAttribute('href', '/themes');
    expect(screen.getByRole('button', { name: 'Theme toggle' })).toBeInTheDocument();
  });

  it('renders a semantic action bar with governed action priority and icon-only actions', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onReset = vi.fn();
    const onSettings = vi.fn();

    renderWithGds(
      <ActionBar
        primary={{ action: 'save', onClick: onSave }}
        secondary={[{ action: 'cancel', onClick: onReset }]}
        tertiary={[{ action: 'preview', onClick: () => {} }]}
        iconOnly={[{ action: 'settings', onClick: onSettings }]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it('supports governed semantic vocabulary packs without raw-label escape hatches', () => {
    const cameraPack = createGdsVocabularyPack('camera', {
      moderate: {
        defaultMessage: 'Moderate',
        icon: GdsIcons.Verify,
      },
    });

    renderWithGds(
      <ActionBar
        primary={{ action: 'camera:moderate' }}
        vocabularyPacks={[cameraPack]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Moderate' })).toBeInTheDocument();
    expect(getSemanticActionLabel('camera:moderate', undefined, [cameraPack])).toBe('Moderate');
  });

  it('renders the unified listing-card contract with featured disclosure and governed affordances', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onShare = vi.fn();

    renderWithGds(
      <ListingCard
        title="Budapest Community Meetup"
        description="A shared listing contract for events, venues, and communities."
        price="Free"
        featured
        sponsoredDisclosure="Sponsored listing"
        metadata={[
          { id: 'date', label: 'Date', value: 'June 7' },
          { id: 'location', label: 'Location', value: 'District V' },
        ]}
        primaryAction={<button type="button">View details</button>}
        saveAction={{ action: 'save', onClick: onSave }}
        shareAction={{ action: 'refer', ariaLabel: 'Share listing', onClick: onShare }}
      />,
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Sponsored listing')).toBeInTheDocument();
    expect(screen.getByText('June 7')).toBeInTheDocument();
    expect(screen.getByText('District V')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Share listing' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('renders the public food card contract with food-specific helper and availability states', () => {
    renderWithGds(
      <>
        <PublicFoodCard
          title="Roasted tomato soup"
          description="Fresh basil, sour cream, and house bread."
          price="EUR 7.50"
          priceNote="Per portion"
          state="limited"
          helperText="Preorder by Friday 18:00"
          pickupNote="Saturday 09:00-12:00"
          freshnessNote="Best served warm"
          quantityHint="12 portions left"
          markers={[
            { id: 'vegetarian', label: 'Vegetarian', tone: 'positive' },
            { id: 'limited', label: 'Weekly batch', tone: 'warning' },
          ]}
          metadata={[
            { id: 'allergens', label: 'Contains dairy' },
            { id: 'portion', label: '500 ml' },
          ]}
          primaryAction={<button type="button">Preorder</button>}
        />
        <PublicFoodCard
          title="Pistachio morning bun"
          state="sold-out"
          primaryAction={<button type="button">Add to order</button>}
        />
      </>,
    );

    expect(screen.getByText('Roasted tomato soup')).toBeInTheDocument();
    expect(screen.getByText('EUR 7.50')).toBeInTheDocument();
    expect(screen.getByText('Preorder by Friday 18:00')).toBeInTheDocument();
    expect(screen.getByText('Saturday 09:00-12:00')).toBeInTheDocument();
    expect(screen.getByText('Best served warm')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Contains dairy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to order' })).toBeDisabled();
  });

  it('renders grouped food menu sections on top of the canonical food card', () => {
    renderWithGds(
      <FoodMenuSection
        title="Saturday preorder menu"
        sectionNote="Pickup window: Saturday 09:00-12:00"
        categories={[
          {
            id: 'soups',
            title: 'Soups',
            helperNote: 'Freshly prepared every Friday evening.',
            items: [
              {
                id: 'tomato',
                title: 'Roasted tomato soup',
                state: 'preorder',
                price: 'EUR 7.50',
                primaryAction: <button type="button">Reserve</button>,
              },
            ],
          },
          {
            id: 'desserts',
            title: 'Desserts',
            items: [],
          },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Saturday preorder menu' })).toBeInTheDocument();
    expect(screen.getByText('Pickup window: Saturday 09:00-12:00')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Soups' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Desserts' })).not.toBeInTheDocument();
    expect(screen.getByText('Roasted tomato soup')).toBeInTheDocument();
  });

  it('renders the sanctioned map panel states and iframe contract', () => {
    const { rerender } = renderWithGds(
      <MapPanel
        title="Venue map"
        description="Shared embed containment."
        loading
      />,
    );

    expect(screen.getByText('Loading map')).toBeInTheDocument();

    rerender(
      <MapPanel
        title="Venue map"
        description="Shared embed containment."
        error="The map provider is unavailable."
      />,
    );
    expect(screen.getByText('Map unavailable')).toBeInTheDocument();
    expect(screen.getByText('The map provider is unavailable.')).toBeInTheDocument();

    rerender(
      <MapPanel
        title="Venue map"
        description="Shared embed containment."
        iframeSrc="https://example.com/embed"
        embedTitle="Budapest venue map"
      />,
    );

    expect(screen.getByTitle('Budapest venue map')).toBeInTheDocument();
  });

  it('renders staged public flow shells with deterministic action priority and runtime boundary slots', () => {
    renderWithGds(
      <PublicFlowShell
        eyebrow="Capture flow"
        stage={{
          id: 'review',
          title: 'Review your capture',
          description: 'Approve the image before sharing it.',
          status: 'ready',
          body: <Text>Captured frame preview</Text>,
          notice: 'Only publish content you have the right to share.',
          actions: [
            { action: 'cancel', priority: 'secondary' },
            { action: 'send', priority: 'primary' },
            { action: 'preview', priority: 'tertiary' },
          ],
        }}
        hardwareSurface={<Text>Runtime preview slot</Text>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Review your capture' })).toBeInTheDocument();
    expect(screen.getByText('Captured frame preview')).toBeInTheDocument();
    expect(screen.getByText('Runtime preview slot')).toBeInTheDocument();
    expect(screen.getByText('Only publish content you have the right to share.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });

  it('renders playback surfaces across degraded and empty states', () => {
    const { rerender } = renderWithGds(
      <PlaybackSurface
        title="Storefront loop"
        state="playing"
        statusMessage="Looping chef specials on the kiosk screen."
        media={<Text>Playback media slot</Text>}
        controls={<button type="button">Pause</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Storefront loop' })).toBeInTheDocument();
    expect(screen.getByText('Playback media slot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByText('Playing')).toBeInTheDocument();

    rerender(
      <PlaybackSurface
        title="Storefront loop"
        state="degraded"
        statusMessage="One media asset failed, continuing with the next slide."
        media={<Text>Fallback loop</Text>}
      />,
    );

    expect(screen.getByText('Playback degraded')).toBeInTheDocument();
    expect(screen.getAllByText('One media asset failed, continuing with the next slide.')).toHaveLength(2);

    rerender(<PlaybackSurface title="Storefront loop" state="empty" />);
    expect(screen.getByText('No playback content available')).toBeInTheDocument();
  });

  it('renders the detail profile shell in page and drawer modes', () => {
    const { rerender } = renderWithGds(
      <DetailProfileShell
        mode="page"
        hero={<Title order={2}>Venue profile</Title>}
        actions={<ActionBar primary={{ action: 'preview' }} />}
        sections={[
          <SectionPanel key="overview" title="Overview"><Text>Profile summary</Text></SectionPanel>,
          <SectionPanel key="schedule" title="Schedule"><Text>Weekdays</Text></SectionPanel>,
        ]}
        related={<Text>Related listings</Text>}
      />,
    );

    expect(screen.getByText('Venue profile')).toBeInTheDocument();
    expect(screen.getByText('Profile summary')).toBeInTheDocument();
    expect(screen.getByText('Related listings')).toBeInTheDocument();

    rerender(
      <DetailProfileShell
        mode="drawer"
        hero={<Title order={2}>Venue profile</Title>}
        sections={[<SectionPanel key="overview" title="Overview"><Text>Drawer summary</Text></SectionPanel>]}
      />,
    );

    expect(screen.getByText('Drawer summary')).toBeInTheDocument();
  });

  it('renders editorial cards and consumer sections as reusable public/consumer contracts', () => {
    renderWithGds(
      <>
        <EditorialCard
          eyebrow="Guide"
          title="Neighborhood picks"
          description="Shared editorial card contract."
          badge="Featured"
          ctaLabel="Read guide"
          href="/guide"
          variant="featured"
          tone="warm"
        />
        <ConsumerSection
          title="Account summary"
          description="Use the shared section shell for account and dashboard clusters."
          action={<button type="button">Manage</button>}
        >
          <ConsumerDashboardGrid columns={2}>
            <MetricCard label="Saved items" value="18" />
            <SectionPanel title="Alerts" description="Shared operational panel rhythm.">
              <span>2 pending</span>
            </SectionPanel>
          </ConsumerDashboardGrid>
        </ConsumerSection>
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Neighborhood picks' })).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
    expect(screen.getByText('Saved items')).toBeInTheDocument();
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('renders media fields with upload, URL, preview, and recovery actions', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onReset = vi.fn();

    renderWithGds(
      <MediaField
        label="Hero image"
        description="Choose a shared media asset."
        value="https://cdn.example.com/hero.jpg"
        preview={<img alt="Hero preview" src="https://cdn.example.com/hero.jpg" />}
        uploadControl={<button type="button">Upload image</button>}
        urlInput={<input aria-label="Image URL" defaultValue="https://cdn.example.com/hero.jpg" />}
        helpText="Prefer authored media with descriptive alt text."
        policyText="Public media must meet shared licensing policy."
        retryAction={<button type="button">Retry</button>}
        replaceAction={<button type="button">Replace</button>}
        acceptedTypes="JPEG, PNG, WebP"
        maxSize="10 MB max"
        progress={64}
        state="saved"
        onRemove={onRemove}
        onReset={onReset}
        mode="split"
      />,
    );

    expect(screen.getByText('Hero image')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByAltText('Hero preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload progress')).toBeInTheDocument();
    expect(screen.getByText('64% complete')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG, WebP')).toBeInTheDocument();
    expect(screen.getByText('10 MB max')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('keeps locale packs in parity and resolves locale messages with fallback', () => {
    const locales = { en, es, hu, de, fr, it: itLocale, ru, he, ar };
    const expectedKeys = Object.keys(en).sort();

    for (const locale of Object.values(locales)) {
      expect(Object.keys(locale).sort()).toEqual(expectedKeys);
    }

    expect(getGdsMessages('es')['gds.action.save']).toBe('Guardar');
    expect(getGdsMessages('unknown-locale')['gds.action.save']).toBe('Save');
  });

  it('renders shared state blocks for empty and permission messaging', () => {
    renderWithGds(
      <>
        <StateBlock variant="empty" title="No reports yet" description="Create the first report to populate this view." compact />
        <AccessSummary title="Partner access" roles={['Admin', 'Partner']} scope="Northern region" />
      </>,
    );

    expect(screen.getByText('No reports yet')).toBeInTheDocument();
    expect(screen.getByText('Partner access')).toBeInTheDocument();
    expect(screen.getByText('Scope: Northern region')).toBeInTheDocument();
  });

  it('resolves surface presentation styles for inline, centered, and fill modes', () => {
    expect(resolveSurfacePresentationStyles({ presentation: 'inline', minHeight: 240 })).toEqual({ minHeight: '240px' });
    expect(resolveSurfacePresentationStyles({
      presentation: 'fill',
      minHeight: 360,
      contentAlign: 'start',
      contentJustify: 'center',
    })).toEqual({
      minHeight: '360px',
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
    });
    expect(resolveSurfacePresentationStyles({
      presentation: 'centered',
      minHeight: 180,
      contentAlign: 'center',
      contentJustify: 'center',
    })).toEqual({
      minHeight: '180px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('renders a centered StateBlock with min-height presentation', () => {
    const { container } = renderWithGds(
      <StateBlock
        variant="loading"
        title="Loading operations"
        description="The panel should stay centered and stable."
        minHeight={280}
        presentation="centered"
        contentAlign="center"
        contentJustify="center"
      />,
    );

    const hasPresentationStyles = Array.from(container.querySelectorAll('div[style]')).some(
      (element) => element.getAttribute('style')?.includes('min-height: 280px') || element.getAttribute('style')?.includes('display: flex;'),
    );

    expect(hasPresentationStyles).toBe(true);
    expect(screen.getByText('Loading operations')).toBeInTheDocument();
  });

  it('renders a fill-mode SectionPanel body with centered presentation', () => {
    const { container } = renderWithGds(
      <SectionPanel title="Panel with centered state" presentation="fill" minHeight={360} contentAlign="center" contentJustify="center">
        <StateBlock variant="empty" title="No rows" description="Fill-mode state is now on the contract." compact />
      </SectionPanel>,
    );

    const hasPresentationStyles = Array.from(container.querySelectorAll('div[style]')).some(
      (element) => element.getAttribute('style')?.includes('min-height: 360px') && element.getAttribute('style')?.includes('display: flex;'),
    );

    expect(hasPresentationStyles).toBe(true);
    expect(screen.getByText('Panel with centered state')).toBeInTheDocument();
    expect(screen.getByText('No rows')).toBeInTheDocument();
  });

  it('renders canonical access-recovery defaults and invokes recovery actions', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onBack = vi.fn();

    renderWithGds(
      <AccessRecoveryPanel state="unauthenticated" onSignIn={onSignIn} onBack={onBack} />,
    );

    expect(screen.getByText('Sign in required')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('supports retry-first unavailable states and explicit support actions', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onHelp = vi.fn();

    renderWithGds(
      <AccessRecoveryPanel
        state="unavailable"
        onRetry={onRetry}
        supportAction={{ action: 'help', onClick: onHelp, variant: 'subtle' }}
      />,
    );

    expect(screen.getByText('Content is temporarily unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Help' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('renders timeout recovery and permission-limited access summaries without color-only state', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onBack = vi.fn();

    renderWithGds(
      <>
        <AccessRecoveryPanel state="timeout" onRetry={onRetry} onBack={onBack} />
        <AccessSummary
          title="Tenant access"
          roles={['Manager']}
          scope="Budapest"
          state="permission-limited"
          owner="platform-ui"
          recoveryHint="Ask an owner for the finance evidence scope."
        />
      </>,
    );

    expect(screen.getByText('Request timed out')).toBeInTheDocument();
    expect(screen.getByText('Permission limited')).toBeInTheDocument();
    expect(screen.getByText('Owner: platform-ui')).toBeInTheDocument();
    expect(screen.getByText('Ask an owner for the finance evidence scope.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders the public shell and toolbar contracts', () => {
    renderWithGds(
      <PublicShell
        brand={<span>Camera</span>}
        navItems={[{ id: 'gallery', label: 'Gallery', href: '/gallery' }]}
        activeNavId="gallery"
        actions={<button type="button">Sign in</button>}
        footer="Shared public chrome"
        mobileNavigationMode="inline-collapse"
        mobileNavigation={<a href="/gallery">Gallery</a>}
        headerVariant="branded-quiet"
      >
        <DataToolbar
          searchSlot={<input aria-label="Search" />}
          createAction={<button type="button">Create</button>}
          activeFilters={[{ label: 'Published' }]}
        />
      </PublicShell>,
    );

    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Gallery' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('supports enhanced editorial-hero media fades and flat public surfaces', () => {
    const { container } = renderWithGds(
      <EditorialHero
        eyebrow="Editorial"
        title="Shared public storytelling"
        description="Enhanced hero surface."
        media={<div>Media slot</div>}
        mediaFade="background-match"
        surfaceVariant="flat-public"
      />,
    );

    expect(screen.getByText('Shared public storytelling')).toBeInTheDocument();
    expect(screen.getByText('Media slot')).toBeInTheDocument();
    expect(container.querySelector('figure[aria-label]') ?? container.querySelector('figure')).toBeInTheDocument();
  });

  it('supports compact and process feature-band variants', () => {
    renderWithGds(
      <>
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'one', title: 'One' },
            { id: 'two', title: 'Two' },
            { id: 'three', title: 'Three' },
            { id: 'four', title: 'Four' },
          ]}
        />
        <FeatureBand
          variant="process"
          items={[
            { id: 'step-1', title: 'Plan' },
            { id: 'step-2', title: 'Ship', stepLabel: 'Step B' },
          ]}
        />
      </>,
    );

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Four')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step B')).toBeInTheDocument();
  });

  it('renders public navigation and footer primitives with accessible active state', () => {
    renderWithGds(
      <PublicNav
        items={[
          { id: 'home', label: 'Home', href: '/' },
          { id: 'docs', label: 'Docs', href: '/docs' },
        ]}
        activeId="docs"
      />,
    );

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders provider-identity buttons with stable fallback labels and states', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithGds(
      <ProviderIdentityButtonGroup
        providers={[
          { provider: 'google', onClick },
          { provider: 'custom-id', label: 'Continue with Custom provider', disabled: true, error: 'Provider failed. Try another method.' },
          { provider: 'github', variant: 'outline' },
          { provider: 'email', description: 'Email identity lane', policyNote: 'Allowed by tenant policy.', size: 'sm' },
        ]}
        layout="grid"
      />,
    );

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Custom provider' })).toBeInTheDocument();
    expect(screen.getByText('Email identity lane')).toBeInTheDocument();
    expect(screen.getByText('Allowed by tenant policy.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Provider failed. Try another method.');
    expect(screen.getByRole('button', { name: 'Continue with Custom provider' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getProviderIdentityLabel('google')).toBe('Continue with Google');
    expect(getSupportedProviderIdentityIds()).toContain('google');
    expect(getProviderIdentityPolicy('google')).toMatchObject({ colorAuthority: 'provider', minTouchTargetPx: 44 });
  });

  it('renders auth and article shells as shared content contracts', () => {
    renderWithGds(
      <>
        <AuthShell
          title="Sign in"
          description="Access governed workspaces with a supported provider."
          intent="account-linking"
          error="GitHub could not finish account linking."
          guestAction={<button type="button">Continue as guest</button>}
          supportAction={<button type="button">Contact support</button>}
          socialAuth={
            <SocialAuthButtons
              providers={[
                { id: 'google', href: '/auth/google' },
                { id: 'github', href: '/auth/github', description: 'For engineering workspaces', tenantDisabledReason: 'Disabled by tenant policy.' },
              ]}
            />
          }
          helper="Contact support if you cannot access your account."
        >
          <button type="button">Continue</button>
        </AuthShell>
        <ArticleShell
          eyebrow="Docs"
          title="Install the design system"
          lead="Follow the package and provider setup flow."
          meta={<span>5 min read</span>}
        >
          <p>Install packages, wire the provider, and verify release alignment.</p>
        </ArticleShell>
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByText('account linking')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('GitHub could not finish account linking.');
    expect(screen.getByText('Disabled by tenant policy.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue as guest' })).toBeInTheDocument();
    expect(screen.getByText('Or continue with your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Install the design system' })).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('renders governed share buttons with copy and native share behavior', async () => {
    const user = userEvent.setup();
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    const nativeShare = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: nativeShare,
    });

    renderWithGds(
      <ShareButtonGroup
        url="https://example.com/listing"
        title="Harvest Dinner"
        text="Join this community dinner."
        channels={['native', 'copy', 'mail', 'x']}
      />,
    );

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute('href', expect.stringContaining('mailto:'));
    expect(screen.getByRole('link', { name: 'Share on X' })).toHaveAttribute('href', expect.stringContaining('x.com/intent/tweet'));

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(clipboardWriteText).toHaveBeenCalledWith('https://example.com/listing');
    expect(screen.getByText('Link copied.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(nativeShare).toHaveBeenCalledWith({
      url: 'https://example.com/listing',
      title: 'Harvest Dinner',
      text: 'Join this community dinner.',
    });
    expect(screen.getByText('Share sheet opened.')).toBeInTheDocument();
  });

  it('renders docs shells, code blocks, and CTA groups', () => {
    const clipboardWriteText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });

    renderWithGds(
      <>
        <DocsPageShell
          breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Install' }]}
          title="Install packages"
          lead="Use the published packages and root provider."
          footerNext={{ label: 'Next: Providers', href: '/providers' }}
        >
          <DocsCodeBlock
            code={`npm install @doneisbetter/gds
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`}
            language="bash"
            title="Install"
          />
        </DocsPageShell>
        <CtaButtonGroup
          primary={<button type="button">Start</button>}
          secondary={<button type="button">Learn more</button>}
          tertiary={<button type="button">View docs</button>}
        />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Install packages' })).toBeInTheDocument();
    expect(screen.getByText(/npm install @doneisbetter\/gds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy code block' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
  });

  it('renders neutral page-header eyebrows by default and supports opt-in ornamental styling', () => {
    const { rerender } = renderWithGds(
      <PageHeader title="Release notes" eyebrow="Docs" />,
    );

    const neutralEyebrow = screen.getByText('Docs');
    expect(neutralEyebrow).toBeInTheDocument();
    expect(neutralEyebrow.getAttribute('style') ?? '').not.toContain('letter-spacing');

    rerender(
      <PageHeader title="Release notes" eyebrow="Docs" eyebrowVariant="ornamental" />,
    );

    const ornamentalEyebrow = screen.getByText('Docs');
    expect(ornamentalEyebrow.getAttribute('style') ?? '').toContain('letter-spacing');
  });

  it('renders status badges with a light semantic variant', () => {
    renderWithGds(<StatusBadge status="warning">Needs review</StatusBadge>);

    const badge = screen.getByText('Needs review');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('[data-variant="light"]')).toBeInTheDocument();
  });

  it('exposes an accessible theme toggle and switches the color scheme', async () => {
    const user = userEvent.setup();
    const changes: Array<'light' | 'dark'> = [];

    renderWithGds(<ThemeToggle onColorSchemeChange={(next) => changes.push(next)} />);

    const toggle = screen.getByRole('button', { name: 'Toggle color scheme' });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark');
    expect(changes.at(-1)).toBe('dark');

    await user.click(toggle);
    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('light');
    expect(changes.at(-1)).toBe('light');
  });

  it('renders the reference theme explorer with all official lanes and recovery guidance', async () => {
    const user = userEvent.setup();

    renderWithGds(<ReferenceThemeExplorer />);

    expect(screen.getByText('Theme Lab')).toBeInTheDocument();
    expect(screen.getAllByText('gdsTheme').length).toBeGreaterThan(0);
    expect(screen.getAllByText('gdsDarkPublicTheme').length).toBeGreaterThan(0);
    expect(screen.getAllByText('gdsFlatSurfaceTheme').length).toBeGreaterThan(0);
    expect(screen.getAllByText('gdsEditorialPublicTheme').length).toBeGreaterThan(0);
    expect(screen.getAllByText('createPublicBrandTheme(...)').length).toBeGreaterThan(0);
    expect(screen.getByText('Light, dark, and auto proof')).toBeInTheDocument();
    expect(screen.getByText('Unsupported lane boundary')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Preset'), 'brand');
    await user.selectOptions(screen.getByLabelText('Brand primary color'), 'teal');
    expect(screen.getAllByText('Brand theme generator').length).toBeGreaterThan(0);

    await user.click(screen.getByLabelText('Compare against a second shipped preset'));
    expect(screen.getByText('Comparison Preview Surface')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset theme lab' }));
    expect(screen.getAllByText('Default runtime theme').length).toBeGreaterThan(0);
  });

  it('forwards chosen files from the shared upload dropzone', async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();

    renderWithGds(
      <UploadDropzone
        title="Upload evidence"
        description="Attach one or more files."
        acceptedTypesLabel="PDF or image"
        maxSizeLabel="5 MB max"
        selectedFiles={['first.txt']}
        policyText="Do not upload private customer data."
        onFilesSelected={onFilesSelected}
      />,
    );

    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('PDF or image')).toBeInTheDocument();
    expect(screen.getByText('5 MB max')).toBeInTheDocument();
    expect(screen.getByText('Selected: first.txt')).toBeInTheDocument();
    expect(screen.getByText('Do not upload private customer data.')).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [new File(['a'], 'first.txt', { type: 'text/plain' })]);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0][0][0].name).toBe('first.txt');
  });

  it('renders upload dropzone error and readonly states without hidden network behavior', () => {
    const onFilesSelected = vi.fn();

    const { rerender } = renderWithGds(
      <>
        <UploadDropzone
          title="Upload logo"
          state="unsupported-type"
          error="SVG files are not allowed for this surface."
          retryAction={<button type="button">Try again</button>}
          removeAction={<button type="button">Remove asset</button>}
          onFilesSelected={onFilesSelected}
        />
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('SVG files are not allowed for this surface.');
    expect(screen.getByText('unsupported type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove asset' })).toBeInTheDocument();

    rerender(
      <UploadDropzone title="Locked asset" readonly onFilesSelected={onFilesSelected} />,
    );

    expect(screen.getByText('readonly')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose files' })).toBeDisabled();
  });

  it('renders game board tile face and handles press', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    renderWithGds(
      <GameBoardTile face="A" revealed={false} matched={false} disabled={false} onPress={onPress} />,
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders placeholder and simple data primitives with deterministic state handling', () => {
    renderWithGds(
      <>
        <PlaceholderPanel
          title="Impact dashboard"
          description="Data will appear after the first reporting window closes."
          badge="Coming soon"
          mode="placeholder"
        />
        <StatsSection title="Category summary" belowThreshold thresholdMessage="Need at least 5 submissions." />
        <SimpleDataTable
          columns={[{ key: 'name', header: 'Name' }]}
          rows={[{ name: 'Northern Region' }]}
        />
      </>,
    );

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Need at least 5 submissions.')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByText('Northern Region')).toBeInTheDocument();
  });

  it('renders reporting controls, evidence, and chart-token panels with governed states', async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();

    renderWithGds(
      <ReportingSection
        title="Revenue report"
        description="Canonical reporting composition with period, evidence, metrics, chart summary, and table fallback."
        state="partial"
        stateMessage="Two locations have not reported yet."
        periodControl={(
          <PeriodSelector
            label="Reporting period"
            value="last-30"
            timezone="Europe/Budapest"
            scope="All locations"
            filtered
            stale
            helperText="Periods are evaluated in the selected timezone."
            onChange={onPeriodChange}
            options={[
              { value: 'last-7', label: 'Last 7 days', description: 'Short-term operating window.' },
              { value: 'last-30', label: 'Last 30 days', description: 'Default reporting window.' },
            ]}
          />
        )}
        metrics={(
          <div>
            <MetricCard label="Orders" value="1,240" description="Permission-safe aggregate." />
          </div>
        )}
        chart={(
          <ChartTokenPanel
            title="Orders by channel"
            summary="Online orders account for 62 percent of visible orders; in-store accounts for 38 percent."
            state="permission-limited"
            legend={[
              { label: 'Online', token: 'var(--mantine-color-blue-6)' },
              { label: 'In-store', token: 'var(--mantine-color-teal-6)' },
            ]}
            tableFallback={<SimpleDataTable columns={[{ key: 'channel', header: 'Channel' }, { key: 'share', header: 'Share' }]} rows={[{ channel: 'Online', share: '62%' }]} />}
          />
        )}
        evidence={(
          <EvidencePanel
            title="Evidence trail"
            source="Point-of-sale export"
            freshness="Updated 12 minutes ago"
            confidence="High"
            evidenceCount={18}
            state="permission-limited"
            permissionNote="Private customer-level rows are hidden from this aggregate."
          />
        )}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Revenue report' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reporting period')).toBeInTheDocument();
    expect(screen.getByText('Timezone: Europe/Budapest')).toBeInTheDocument();
    expect(screen.getByText('Stale data')).toBeInTheDocument();
    expect(screen.getByText('Partial report')).toBeInTheDocument();
    expect(screen.getByText('Evidence: 18')).toBeInTheDocument();
    expect(screen.getByText('Accessible data fallback')).toBeInTheDocument();
    expect(screen.getByText('Online: var(--mantine-color-blue-6)')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Reporting period'), 'last-7');
    expect(onPeriodChange).toHaveBeenCalledWith('last-7');
  });

  it('resolves accent surface styles and renders the shared accent panel contract', () => {
    const subtle = resolveAccentPanelStyles('violet', 'subtle');
    const outline = resolveAccentPanelStyles('green', 'soft-outline');

    expect(subtle.backgroundColor).toContain('light-dark');
    expect(outline.border).toContain('var(--mantine-color-green-4)');

    renderWithGds(
      <AccentPanel tone="blue" title="Shared accent" badge="Contract">
        Accent-safe copy
      </AccentPanel>,
    );

    expect(screen.getByRole('heading', { name: 'Shared accent' })).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Accent-safe copy')).toBeInTheDocument();
  });

  it('renders editorial heroes with one primary CTA and deterministic error fallback', () => {
    const { rerender } = renderWithGds(
      <EditorialHero
        eyebrow="Editorial"
        title="Shared public hero"
        description="Split media and text layouts are now GDS-governed."
        actions={[
          { label: 'Primary path', variant: 'primary' },
          { label: 'Second primary', variant: 'primary' },
        ]}
        meta={[{ id: 'stack', label: 'Server safe' }]}
        media={<div>Media slot</div>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Shared public hero' })).toBeInTheDocument();
    expect(screen.getByText('Server safe')).toBeInTheDocument();
    expect(screen.getByText('Primary path')).toBeInTheDocument();
    expect(screen.getByText('Second primary')).toBeInTheDocument();

    rerender(
      <EditorialHero
        title="Shared public hero"
        actions={[{ label: 'Primary path', variant: 'primary' }]}
        error="Unable to load hero media."
      />,
    );

    expect(screen.getByText('Media unavailable')).toBeInTheDocument();
    expect(screen.getByText('Unable to load hero media.')).toBeInTheDocument();
  });

  it('renders feature bands and branded footers as shared public composition primitives', () => {
    renderWithGds(
      <>
        <FeatureBand
          columns={2}
          items={[
            { id: 'one', title: 'Fast pickup', description: 'Ready in 15 minutes.' },
            { id: 'two', title: 'Local delivery', description: 'Live in selected districts.' },
          ]}
        />
        <PublicBrandFooter
          layoutVariant="balanced-quote"
          brandTitle="Shared footer"
          description="Narrative, actions, and secondary content now share one footer contract."
          actions={<a href="/support">Support</a>}
          secondary={<blockquote>Quote-led supporting content.</blockquote>}
          legal="© Shared footer contract"
        />
      </>,
    );

    expect(screen.getByText('Fast pickup')).toBeInTheDocument();
    expect(screen.getByText('Local delivery')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Support' })).toBeInTheDocument();
  });

  it('renders public product cards with visible price, helper regions, and sold-out action disabling', () => {
    renderWithGds(
      <>
        <PublicProductCard
          title="Chef tasting menu"
          description="Five courses with seasonal ingredients."
          price="EUR 89"
          helperText="Reserve before 18:00"
          helperKind="pickup"
          inventoryNote="Only 8 left tonight"
          stateLabels={{ preorder: 'Pre-order', limited: 'Low stock' }}
          state="limited"
          metadata={[{ label: 'Availability', value: 'Evenings only' }]}
          primaryAction={<button type="button">Reserve</button>}
        />
        <PublicProductCard
          title="House special"
          state="sold-out"
          primaryAction={<button type="button">Order now</button>}
        />
      </>,
    );

    expect(screen.getByText('EUR 89')).toBeInTheDocument();
    expect(screen.getByText('Reserve before 18:00')).toBeInTheDocument();
    expect(screen.getByText('Only 8 left tonight')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
    expect(screen.getByText('Sold out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Order now' })).toBeDisabled();
  });

  it('renders public product card loading and missing-image fallback states', () => {
    const { rerender } = renderWithGds(
      <PublicProductCard title="Seasonal plate" loading />,
    );

    expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0);

    rerender(<PublicProductCard title="Seasonal plate" />);
    expect(screen.getByLabelText('No product image available')).toBeInTheDocument();
  });
});
