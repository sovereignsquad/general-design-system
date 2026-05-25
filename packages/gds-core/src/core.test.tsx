import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { AccessSummary } from './AccessSummary';
import { ArticleShell } from './ArticleShell';
import { AuthShell } from './AuthShell';
import { CtaButtonGroup } from './CtaButtonGroup';
import { ConfirmDialog } from './ConfirmDialog';
import { DataToolbar } from './DataToolbar';
import { DocsCodeBlock } from './DocsCodeBlock';
import { DocsPageShell } from './DocsPageShell';
import { EmptyState } from './EmptyState';
import { GameBoardTile } from './GameBoardTile';
import { MetricCard } from './MetricCard';
import { PageHeader } from './PageHeader';
import { PlaceholderPanel } from './PlaceholderPanel';
import { PublicNav } from './PublicNav';
import { PublicShell } from './PublicShell';
import { SemanticButton } from './SemanticButton';
import { SimpleDataTable } from './SimpleDataTable';
import { StateBlock } from './StateBlock';
import { StatsSection } from './StatsSection';
import { StatusBadge } from './StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { UploadDropzone } from './UploadDropzone';

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

  it('renders the public shell and toolbar contracts', () => {
    renderWithGds(
      <PublicShell
        brand={<span>Camera</span>}
        navItems={[{ id: 'gallery', label: 'Gallery', href: '/gallery' }]}
        activeNavId="gallery"
        actions={<button type="button">Sign in</button>}
        footer="Shared public chrome"
      >
        <DataToolbar
          searchSlot={<input aria-label="Search" />}
          createAction={<button type="button">Create</button>}
          activeFilters={[{ label: 'Published' }]}
        />
      </PublicShell>,
    );

    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
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
});
