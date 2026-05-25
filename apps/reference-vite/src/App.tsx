import { Button } from '@mantine/core';
import {
  AccessRecoveryPanel,
  CtaButtonGroup,
  DocsPageShell,
  PlaceholderPanel,
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
    >
      <DocsPageShell
        breadcrumbs={[{ label: 'Docs', href: '/' }, { label: 'Install' }]}
        title="Install and adopt GDS"
        lead="This reference app consumes shared packages directly."
      >
        <CtaButtonGroup
          primary={<Button>Install packages</Button>}
          secondary={<Button variant="default">Read compatibility</Button>}
          tertiary={<Button variant="subtle">Review adoption manifest</Button>}
        />
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
        <StatsSection title="Regional summary">
          <SimpleDataTable
            columns={[{ key: 'name', header: 'Region' }, { key: 'value', header: 'Score' }]}
            rows={[{ name: 'North', value: '92' }]}
          />
        </StatsSection>
      </DocsPageShell>
    </PublicShell>
  );
}
