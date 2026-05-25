import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { AccessSummary } from './AccessSummary';
import { AccessRecoveryPanel } from './AccessRecoveryPanel';
import { AccentPanel, resolveAccentPanelStyles } from './AccentPanel';
import { ArticleShell } from './ArticleShell';
import { AuthShell } from './AuthShell';
import { BrowseSurface } from './BrowseSurface';
import { ConsumerSection } from './ConsumerSection';
import { CtaButtonGroup } from './CtaButtonGroup';
import { ConfirmDialog } from './ConfirmDialog';
import { DataToolbar } from './DataToolbar';
import { DocsCodeBlock } from './DocsCodeBlock';
import { DocsPageShell } from './DocsPageShell';
import { EmptyState } from './EmptyState';
import { EditorialCard } from './EditorialCard';
import { EditorialHero } from './EditorialHero';
import { FeatureBand } from './FeatureBand';
import { GameBoardTile } from './GameBoardTile';
import { MediaField } from './MediaField';
import { MetricCard } from './MetricCard';
import { PageHeader } from './PageHeader';
import { PlaceholderPanel } from './PlaceholderPanel';
import { PublicBrandFooter } from './PublicBrandFooter';
import { PublicProductCard } from './PublicProductCard';
import { PublicNav } from './PublicNav';
import { PublicShell } from './PublicShell';
import { SemanticButton } from './SemanticButton';
import { SimpleDataTable } from './SimpleDataTable';
import { StateBlock } from './StateBlock';
import { StatsSection } from './StatsSection';
import { StatusBadge } from './StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { UploadDropzone } from './UploadDropzone';
import { ar, de, en, es, fr, getGdsMessages, he, hu, it as itLocale, ru } from './locales';

describe('@gds/core', () => {
  it('renders semantic button labels from translation messages', () => {
    renderWithGds(<SemanticButton action="save" />, {
      messages: { 'gds.action.save': 'Speichern' },
    });

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
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
    expect(screen.getByText('Browse results')).toBeInTheDocument();

    await user.click(screen.getAllByText('Published')[0]);
    await user.click(screen.getByRole('button', { name: 'East' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
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
          <MetricCard label="Saved items" value="18" />
        </ConsumerSection>
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Neighborhood picks' })).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
    expect(screen.getByText('Saved items')).toBeInTheDocument();
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
        state="saved"
        onRemove={onRemove}
        onReset={onReset}
      />,
    );

    expect(screen.getByText('Hero image')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByAltText('Hero preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();

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

  it('renders auth and article shells as shared content contracts', () => {
    renderWithGds(
      <>
        <AuthShell
          title="Sign in"
          description="Use your workspace account."
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
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Install the design system' })).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
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
          <DocsCodeBlock code="npm install @gds/theme @gds/core" language="bash" title="Install" />
        </DocsPageShell>
        <CtaButtonGroup
          primary={<button type="button">Start</button>}
          secondary={<button type="button">Learn more</button>}
          tertiary={<button type="button">View docs</button>}
        />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Install packages' })).toBeInTheDocument();
    expect(screen.getByText('npm install @gds/theme @gds.core'.replace('.core', '/core'))).toBeInTheDocument();
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

    renderWithGds(<ThemeToggle />);

    const toggle = screen.getByRole('button', { name: 'Toggle color scheme' });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark');

    await user.click(toggle);
    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('light');
  });

  it('forwards chosen files from the shared upload dropzone', async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();

    renderWithGds(
      <UploadDropzone
        title="Upload evidence"
        description="Attach one or more files."
        onFilesSelected={onFilesSelected}
      />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [new File(['a'], 'first.txt', { type: 'text/plain' })]);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0][0][0].name).toBe('first.txt');
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
