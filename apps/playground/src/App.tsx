import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { GdsProvider } from '@doneisbetter/gds-theme';
import { 
  AppShell, 
} from '@doneisbetter/gds-admin';
import { 
  en, hu, de, fr, it, ru, he, ar,
  SidebarNavItem,
} from '@doneisbetter/gds-core';
import { 
  Stack, 
  Button, 
  Paper, 
  Box, 
  Menu, 
  Group, 
  Skeleton,
} from '@mantine/core';
import { 
  IconLanguage, 
  IconChevronDown, 
} from '@tabler/icons-react';
import {
  getLegacyRedirects,
  getPrimaryRoutes,
  getSecondaryRoutes,
  isRouteActive,
} from './site-routes';

const PatternsIndexPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: module.PatternsIndexPage };
});

const FoundationsPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="foundations" /> };
});

const PublicPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="public" /> };
});

const OperationsPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="operations" /> };
});

const DataPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="data" /> };
});

const AccessPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="access" /> };
});

const FeedbackPatternPage = lazy(async () => {
  const module = await import('./pattern-pages');
  return { default: () => <module.PatternFamilyPage family="feedback" /> };
});

const CardsPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.CardsPage };
});

const LayoutsPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.LayoutsPage };
});

const VocabularyPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.VocabularyPage };
});

const AnalyticsPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.AnalyticsPage };
});

const OverviewPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.OverviewPage };
});

const InstallPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.InstallPage };
});

const RulebookPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.RulebookPage };
});

const TokensPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.TokensPage };
});

function RouteFallback() {
  return (
    <Paper withBorder p="xl" radius="xl">
      <Stack gap="md">
        <Skeleton height={20} width="30%" radius="xl" />
        <Skeleton height={42} radius="md" />
        <Skeleton height={42} radius="md" />
        <Skeleton height={180} radius="lg" />
      </Stack>
    </Paper>
  );
}

const localesMap: Record<string, { label: string, messages: Record<string, string> }> = {
  en: { label: 'English', messages: en },
  de: { label: 'Deutsch', messages: de },
  fr: { label: 'Français', messages: fr },
  it: { label: 'Italiano', messages: it },
  ru: { label: 'Русский', messages: ru },
  he: { label: 'עברית (Hebrew)', messages: he },
  ar: { label: 'العربية (Arabic)', messages: ar },
  hu: { label: 'Magyar', messages: hu },
};

function PlaygroundContent() {
  const [locale, setLocale] = useState<string>('en');
  const location = useLocation();
  const primaryRoutes = getPrimaryRoutes();
  const demoRoutes = getSecondaryRoutes('live-demos');

  const navLinks = primaryRoutes.map((route) => (
    <SidebarNavItem
      key={route.id}
      action={route.action}
      label={route.label}
      component={Link}
      to={route.path}
      active={isRouteActive(location.pathname, route)}
    />
  ));

  const secondaryNavigation = location.pathname.startsWith('/live-demos')
    ? demoRoutes.map((route) => (
        <SidebarNavItem
          key={route.id}
          action={route.action}
          label={route.label}
          component={Link}
          to={route.path}
          active={isRouteActive(location.pathname, route)}
        />
      ))
    : undefined;

  const headerContext = location.pathname.startsWith('/live-demos')
    ? 'Official GDS site and live demo hub'
    : 'Official GDS website, docs, and live runtime reference';

  const headerActions = (
    <Group gap="sm">
      <Menu position="bottom-end" withArrow>
        <Menu.Target>
          <Button 
            variant="light" 
            radius="md"
            leftSection={<IconLanguage size="1.2rem" />}
            rightSection={<IconChevronDown size="1rem" />}
          >
            {localesMap[locale]?.label || 'Language'}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {Object.entries(localesMap).map(([key, config]) => (
            <Menu.Item key={key} onClick={() => setLocale(key)}>
              {config.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  return (
    <GdsProvider locale={locale} messages={localesMap[locale]?.messages || localesMap.en.messages}>
      <AppShell
        logoText="General Design System"
        navLinks={navLinks}
        secondaryNavigation={secondaryNavigation}
        headerContext={headerContext}
        headerActions={headerActions}
      >
        <Box p="md" maw={1200} mx="auto">
          <Routes>
            <Route path="/" element={<Suspense fallback={<RouteFallback />}><OverviewPage /></Suspense>} />

            <Route path="/patterns" element={<Suspense fallback={<RouteFallback />}><PatternsIndexPage /></Suspense>} />
            <Route path="/patterns/foundations" element={<Suspense fallback={<RouteFallback />}><FoundationsPatternPage /></Suspense>} />
            <Route path="/patterns/public" element={<Suspense fallback={<RouteFallback />}><PublicPatternPage /></Suspense>} />
            <Route path="/patterns/operations" element={<Suspense fallback={<RouteFallback />}><OperationsPatternPage /></Suspense>} />
            <Route path="/patterns/data" element={<Suspense fallback={<RouteFallback />}><DataPatternPage /></Suspense>} />
            <Route path="/patterns/access" element={<Suspense fallback={<RouteFallback />}><AccessPatternPage /></Suspense>} />
            <Route path="/patterns/feedback" element={<Suspense fallback={<RouteFallback />}><FeedbackPatternPage /></Suspense>} />

            <Route path="/install" element={<Suspense fallback={<RouteFallback />}><InstallPage /></Suspense>} />

            <Route path="/governance" element={<Suspense fallback={<RouteFallback />}><RulebookPage /></Suspense>} />

            <Route path="/themes" element={<Suspense fallback={<RouteFallback />}><TokensPage /></Suspense>} />

            <Route path="/live-demos" element={<Navigate to="/live-demos/surfaces" replace />} />

            <Route path="/live-demos/surfaces" element={<Suspense fallback={<RouteFallback />}><CardsPage /></Suspense>} />

            <Route path="/live-demos/layouts" element={<Suspense fallback={<RouteFallback />}><LayoutsPage /></Suspense>} />

            <Route path="/live-demos/semantics" element={<Suspense fallback={<RouteFallback />}><VocabularyPage /></Suspense>} />

            <Route path="/live-demos/analytics" element={<Suspense fallback={<RouteFallback />}><AnalyticsPage /></Suspense>} />

            {getLegacyRedirects().map((redirect) => (
              <Route
                key={redirect.legacyPath}
                path={redirect.legacyPath}
                element={<Navigate to={redirect.to} replace />}
              />
            ))}
          </Routes>
        </Box>
      </AppShell>
    </GdsProvider>
  );
}

export default function App() {
  return (
    <Router basename="/general-design-system">
      <PlaygroundContent />
    </Router>
  );
}
