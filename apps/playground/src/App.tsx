import { lazy, Suspense, useCallback, useState } from 'react';
import { loadSitePhraseIndex } from './site-phrase-translation';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router';
import {
  GdsProvider,
  useGdsTranslation,
  useGdsThemePresetState,
} from '@sovereignsquad/gds-theme';
import { useGdsDomPhraseTranslation,
  DocsHeaderActionSelect,
  DocsShell,
  GdsTourProvider,
  ReferenceLocaleNotice,
  SidebarNavItem,
  StateBlock,
  ThemeToggle,
} from '@sovereignsquad/gds-core';
// ThemeExplorerSelection ships from the reference-theme-explorer subpath, not the main barrel.
import type { ThemeExplorerSelection } from '@sovereignsquad/gds-core/reference-theme-explorer';
import {
  getLegacyRedirects,
  getPrimaryRoutes,
  getRouteLabel,
  getSecondaryRoutes,
  isRouteActive,
} from './site-routes';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';
import {
  getAppShellCopy,
  getSiteHeaderContext,
  getSiteLocale,
  getSiteLocaleOptions,
  getSiteRouteLabel,
  siteLocaleRegistry,
} from './site-copy';

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

const FoodMenuPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.FoodMenuPage };
});

const PlaybackPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.PlaybackPage };
});

const LiveProofsPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.LiveProofsPage };
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

const SystemsPage = lazy(async () => {
  const module = await import('./systems-page');
  return { default: module.SystemsPage };
});
const ComponentsIndexPage = lazy(async () => {
  const module = await import('./components-index-page');
  return { default: module.ComponentsIndexPage };
});
const CoveragePage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.CoveragePage };
});

const ApiReferencePage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.ApiReferencePage };
});

const MaturityPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.MaturityPage };
});

const UseCasesPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.UseCasesPage };
});

const RulebookPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.RulebookPage };
});

const TokensPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.TokensPage };
});

const RequestFeaturePage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.RequestFeaturePage };
});

const AiPage = lazy(async () => {
  const module = await import('./info-pages');
  return { default: module.AiPage };
});

function RouteFallback() {
  const { locale } = useGdsTranslation();
  const copy = getAppShellCopy(locale);

  return (
    <StateBlock
      variant="loading"
      title={copy.routeFallbackTitle}
      description={copy.routeFallbackDescription}
    />
  );
}

function PlaygroundContent() {
  const [locale, setLocale] = useState<string>(() => {
    const requestedLocale = new URLSearchParams(window.location.search).get('locale');
    // Must check registry membership, not truthiness: getSiteLocale always falls back
    // internally, so a truthy but invalid locale would never be caught here.
    return requestedLocale && requestedLocale in siteLocaleRegistry ? requestedLocale : 'en';
  });
  const {
    selection: siteThemeSelection,
    setSelection: setSiteThemeSelection,
    setScheme: setSiteThemeScheme,
  } = useGdsThemePresetState({ storageKey: 'gds-reference-theme-selection' });
  const location = useLocation();
  const routeLocaleIds = getFullCopyLocalesForRoute(location.pathname);
  const routeLocaleOptions = getSiteLocaleOptions(routeLocaleIds);
  const effectiveLocale = hasFullRouteLocalization(location.pathname, locale) ? locale : 'en';
  const effectiveSiteLocale = getSiteLocale(effectiveLocale);
  const appShell = getAppShellCopy(effectiveLocale);
  const handleSiteThemeSelectionChange = useCallback((selection: ThemeExplorerSelection) => {
    setSiteThemeSelection(selection);
  }, [setSiteThemeSelection]);

  const primaryRoutes = getPrimaryRoutes();
  const demoRoutes = getSecondaryRoutes('live-proofs');

  const primaryNavigation = primaryRoutes.map((route) => (
    <SidebarNavItem
      key={route.id}
      action={route.action}
      label={getSiteRouteLabel(route.id, getRouteLabel(route), effectiveLocale)}
      component={Link}
      to={route.path}
      active={isRouteActive(location.pathname, route)}
    />
  ));

  const secondaryNavigation = location.pathname.startsWith('/live-proofs')
    ? demoRoutes.map((route) => (
        <SidebarNavItem
          key={route.id}
          action={route.action}
          label={getSiteRouteLabel(route.id, getRouteLabel(route), effectiveLocale)}
          component={Link}
          to={route.path}
          active={isRouteActive(location.pathname, route)}
        />
      ))
    : undefined;

  const headerContext = getSiteHeaderContext(location.pathname, effectiveLocale);

  // Engine and observer lifecycle live in gds-core; this site supplies only the phrase-pack loader.
  useGdsDomPhraseTranslation({
    root: typeof document === 'undefined' ? null : document.getElementById('root'),
    locale: effectiveLocale,
    loadIndex: loadSitePhraseIndex,
    routeKey: location.pathname,
  });

  const headerActions = (
    <>
      <DocsHeaderActionSelect
        label={appShell.localeSelectLabel}
        value={effectiveLocale}
        options={routeLocaleOptions.map(([id, localeValue]) => ({
          value: id,
          label: localeValue.label,
        }))}
        onChange={(value) => {
          setLocale(value);
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('locale', value);
          window.history.replaceState(null, '', nextUrl);
        }}
      />
      <ThemeToggle
        onColorSchemeChange={setSiteThemeScheme}
      />
    </>
  );

  return (
    <GdsProvider
      locale={effectiveLocale}
      messages={effectiveSiteLocale.messages}
      theme={siteThemeSelection.theme}
      defaultColorScheme={siteThemeSelection.colorScheme}
      forceColorScheme={siteThemeSelection.colorScheme === 'auto' ? undefined : siteThemeSelection.colorScheme}
    >
      <GdsTourProvider>
      <DocsShell
        brand={<strong>General Design System</strong>}
        primaryNavigation={primaryNavigation}
        secondaryNavigation={secondaryNavigation}
        headerContext={headerContext}
        actions={headerActions}
        mobileNavigationMode="drawer"
        contentWidth="full"
      >
        {locale !== effectiveLocale ? (
          <ReferenceLocaleNotice
            localeLabel={appShell.localeFallbackLabel}
            detail={appShell.localeFallbackDetail.replace('{localeLabel}', getSiteLocale(locale).label)}
          />
        ) : null}
        <Routes>
          <Route
            path="/"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <OverviewPage
                  initialThemeSelection={siteThemeSelection}
                  onSiteThemeSelectionChange={handleSiteThemeSelectionChange}
                />
              </Suspense>
            )}
          />
          <Route path="/patterns" element={<Suspense fallback={<RouteFallback />}><PatternsIndexPage /></Suspense>} />
          {/* Old catalog URL for foundations redirects via getLegacyRedirects. */}
          <Route path="/foundations" element={<Suspense fallback={<RouteFallback />}><FoundationsPatternPage /></Suspense>} />
          <Route path="/patterns/public" element={<Suspense fallback={<RouteFallback />}><PublicPatternPage /></Suspense>} />
          <Route path="/patterns/operations" element={<Suspense fallback={<RouteFallback />}><OperationsPatternPage /></Suspense>} />
          <Route path="/patterns/data" element={<Suspense fallback={<RouteFallback />}><DataPatternPage /></Suspense>} />
          <Route path="/patterns/access" element={<Suspense fallback={<RouteFallback />}><AccessPatternPage /></Suspense>} />
          <Route path="/patterns/feedback" element={<Suspense fallback={<RouteFallback />}><FeedbackPatternPage /></Suspense>} />
          <Route path="/components" element={<Suspense fallback={<RouteFallback />}><ComponentsIndexPage /></Suspense>} />
          <Route path="/systems" element={<Suspense fallback={<RouteFallback />}><SystemsPage /></Suspense>} />
          <Route path="/coverage" element={<Suspense fallback={<RouteFallback />}><CoveragePage /></Suspense>} />
          <Route path="/api" element={<Suspense fallback={<RouteFallback />}><ApiReferencePage /></Suspense>} />
          <Route path="/maturity" element={<Suspense fallback={<RouteFallback />}><MaturityPage /></Suspense>} />
          <Route path="/use-cases" element={<Suspense fallback={<RouteFallback />}><UseCasesPage /></Suspense>} />
          <Route path="/install" element={<Suspense fallback={<RouteFallback />}><InstallPage /></Suspense>} />
          <Route path="/governance" element={<Suspense fallback={<RouteFallback />}><RulebookPage /></Suspense>} />
          <Route
            path="/themes"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <TokensPage
                  initialThemeSelection={siteThemeSelection}
                  onSiteThemeSelectionChange={handleSiteThemeSelectionChange}
                />
              </Suspense>
            )}
          />
          <Route path="/live-proofs" element={<Suspense fallback={<RouteFallback />}><LiveProofsPage /></Suspense>} />
          <Route path="/live-proofs/surfaces" element={<Suspense fallback={<RouteFallback />}><CardsPage /></Suspense>} />
          <Route path="/live-proofs/layouts" element={<Suspense fallback={<RouteFallback />}><LayoutsPage /></Suspense>} />
          <Route path="/live-proofs/semantics" element={<Suspense fallback={<RouteFallback />}><VocabularyPage /></Suspense>} />
          <Route path="/live-proofs/food" element={<Suspense fallback={<RouteFallback />}><FoodMenuPage /></Suspense>} />
          <Route path="/live-proofs/playback" element={<Suspense fallback={<RouteFallback />}><PlaybackPage /></Suspense>} />
          <Route path="/live-proofs/analytics" element={<Suspense fallback={<RouteFallback />}><AnalyticsPage /></Suspense>} />
          <Route path="/request-feature" element={<Suspense fallback={<RouteFallback />}><RequestFeaturePage /></Suspense>} />
          <Route path="/ai" element={<Suspense fallback={<RouteFallback />}><AiPage /></Suspense>} />
          {getLegacyRedirects().map((redirect) => (
            <Route
              key={redirect.legacyPath}
              path={redirect.legacyPath}
              element={<Navigate to={redirect.to} replace />}
            />
          ))}
        </Routes>
      </DocsShell>
      </GdsTourProvider>
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
