import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { DataToolbar, FilterDrawer, MetricCard } from '@doneisbetter/gds-core';
import { renderWithGds } from '../../../test-utils/render';
import { AppShell } from './AppShell';
import { ContentOpsActionBar } from './ContentOpsActionBar';
import { ContentOpsEditor } from './ContentOpsEditor';
import { ContentOpsSection } from './ContentOpsSection';
import { DataTable } from './DataTable';
import { EditorScaffold } from './EditorScaffold';
import { FormSection } from './FormSection';
import { InfoCard } from './InfoCard';
import { PageHeader } from './PageHeader';
import { ResponsiveDataView } from './ResponsiveDataView';
import { SemanticNavLink } from './SemanticNavLink';
import { StatsStrip } from './StatsStrip';
import { WorkspaceHeader } from './WorkspaceHeader';

describe('@doneisbetter/gds-admin', () => {
  it('renders the app shell with navigation, actions, and main content', () => {
    renderWithGds(
      <AppShell
        logoText="Control Center"
        primaryNavigation={<SemanticNavLink action="home" component={Link} to="/" />}
        secondaryNavigation={<SemanticNavLink action="settings" component={Link} to="/settings" />}
        accountPanel={<Button variant="subtle">Logout</Button>}
        headerContext="Operations workspace"
        headerActions={<Button type="button">Header action</Button>}
        mobileNavigation={<Button variant="subtle">Home</Button>}
      >
        <div>Main content</div>
      </AppShell>,
    );

    expect(screen.getByText('Control Center')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Operations workspace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Header action' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Home' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders semantic navigation labels from the shared vocabulary', () => {
    renderWithGds(<SemanticNavLink action="settings" component={Link} to="/settings" />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('renders table rows through column renderers and stable row keys', () => {
    renderWithGds(
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status', render: (item) => <strong>{String(item.status)}</strong> },
        ]}
        data={[
          { slug: 'alpha', name: 'Alpha', status: 'Active' },
          { slug: 'beta', name: 'Beta', status: 'Paused' },
        ]}
        getRowKey={(item) => item.slug}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('renders localized empty-state messaging for empty tables', () => {
    renderWithGds(<DataTable columns={[{ key: 'name', label: 'Name' }]} data={[]} />, {
      messages: { 'gds.state.emptyData': 'Keine Daten verfügbar.' },
    });

    expect(screen.getByText('Keine Daten verfügbar.')).toBeInTheDocument();
  });

  it('shows a loading overlay for pending tables', () => {
    const { container } = renderWithGds(<DataTable columns={[{ key: 'name', label: 'Name' }]} data={[]} loading />);

    expect(container.querySelector('.mantine-LoadingOverlay-root')).toBeInTheDocument();
  });

  it('renders form sections with optional descriptions and dividers', () => {
    const { container } = renderWithGds(
      <FormSection title="Access" description="Manage role-based permissions.">
        <div>Permission fields</div>
      </FormSection>,
    );

    expect(screen.getByText('Access')).toBeInTheDocument();
    expect(screen.getByText('Manage role-based permissions.')).toBeInTheDocument();
    expect(screen.getByText('Permission fields')).toBeInTheDocument();
    expect(container.querySelector('.mantine-Divider-root')).toBeInTheDocument();
  });

  it('renders info cards with values, descriptions, and icon slots', () => {
    renderWithGds(
      <InfoCard
        title="Completion"
        value="87%"
        description="Weekly course completion"
        icon={<span>Icon</span>}
      />,
    );

    expect(screen.getByText('Completion')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('Weekly course completion')).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('renders page headers with primary actions', () => {
    renderWithGds(
      <PageHeader
        title="Projects"
        description="Review active product work."
        subtitle="Operational queue"
        status={<span>Draft</span>}
        primaryAction={<Button type="button">Create project</Button>}
        secondaryActions={<Button variant="default" type="button">Export</Button>}
        overflowActions={[{ label: 'Archive' }]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Operational queue')).toBeInTheDocument();
    expect(screen.getByText('Review active product work.')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('renders KPI strips with positive and negative deltas', () => {
    renderWithGds(
      <StatsStrip
        stats={[
          { label: 'Retention', value: '81%', diff: 5 },
          { label: 'Churn', value: '3%', diff: -2 },
        ]}
      />,
    );

    expect(screen.getByText('Retention')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('-2%')).toBeInTheDocument();
  });

  it('renders responsive data views with toolbar content', () => {
    renderWithGds(
      <ResponsiveDataView
        columns={[{ key: 'name', label: 'Name' }]}
        data={[{ slug: 'alpha', name: 'Alpha' }]}
        toolbar={<DataToolbar searchSlot={<input aria-label="Search" />} />}
        activeFilters={[{ label: 'Published' }]}
        mobileFilters={<Button variant="default">Filters</Button>}
        filterDrawer={<FilterDrawer opened onClose={() => {}} title="Filters" mode="bottom-sheet" />}
        renderCard={(item) => <MetricCard label={String(item.name)} value="1" />}
        getRowKey={(item) => item.slug}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders workspace headers and editor scaffolds', () => {
    renderWithGds(
      <EditorScaffold
        header={
          <WorkspaceHeader
            title="Course editor"
            description="Manage the public course page."
            primaryAction={<Button type="button">Save</Button>}
          />
        }
        context={<div>Setup context</div>}
        form={<div>Form column</div>}
        preview={<div>Preview column</div>}
        settings={<div>Settings column</div>}
        footer={<div>Sticky footer</div>}
        stickyFooter
      />,
    );

    expect(screen.getByRole('heading', { name: 'Course editor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByText('Setup context')).toBeInTheDocument();
    expect(screen.getByText('Form column')).toBeInTheDocument();
    expect(screen.getByText('Preview column')).toBeInTheDocument();
    expect(screen.getByText('Settings column')).toBeInTheDocument();
    expect(screen.getByText('Sticky footer')).toBeInTheDocument();
  });

  it('renders content operations editors with section scaffolds and action states', () => {
    renderWithGds(
      <ContentOpsEditor
        header={<PageHeader title="Site settings" description="Govern shared content operations." />}
        status={<InfoCard title="Publish state" value="Draft" description="Changes are staged." />}
        sections={(
          <>
            <ContentOpsSection id="hero" title="Hero content" description="Manage public hero content.">
              <div>Hero fields</div>
            </ContentOpsSection>
            <ContentOpsSection id="seo" title="SEO" tone="warning">
              <div>SEO fields</div>
            </ContentOpsSection>
          </>
        )}
        actionBar={(
          <ContentOpsActionBar
            dirty
            status="Last saved 5 minutes ago"
            secondaryAction={<Button variant="default">Reset</Button>}
            primaryAction={<Button>Save changes</Button>}
          />
        )}
        preview={<div>Preview panel</div>}
        settings={<div>Settings rail</div>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Site settings' })).toBeInTheDocument();
    expect(screen.getByText('Hero fields')).toBeInTheDocument();
    expect(screen.getByText('SEO fields')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.getByText('Preview panel')).toBeInTheDocument();
  });
});
