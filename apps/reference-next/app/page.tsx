'use client';

import { Button } from '@mantine/core';
import { DocsPageShell, PlaceholderPanel, PublicShell, SimpleDataTable, StatsSection } from '@gds/core/client';
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
    >
      <DocsPageShell
        breadcrumbs={[{ label: 'Reference', href: '/' }, { label: 'Overview' }]}
        title="App Router package consumption"
        lead="This route proves the server-safe and client-safe GDS entrypoints."
        sideRail={<ClientPanel />}
      >
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
        <PlaceholderPanel
          title="Future rollout"
          description="Additional product surfaces can adopt the same package path without local forks."
          mode="placeholder"
          badge="Roadmap"
        />
      </DocsPageShell>
    </PublicShell>
  );
}
