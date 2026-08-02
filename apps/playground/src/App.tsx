import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router';
import {
  GdsProvider,
  useGdsTranslation,
  useGdsThemePresetState,
} from '@sovereignsquad/gds-theme';
import {
  DocsHeaderActionSelect,
  DocsShell,
  GdsTourProvider,
  ReferenceLocaleNotice,
  SidebarNavItem,
  StateBlock,
  ThemeToggle,
  type ThemeExplorerSelection,
} from '@sovereignsquad/gds-core';
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

const LiveDemosPage = lazy(async () => {
  const module = await import('./showcase-pages');
  return { default: module.LiveDemosPage };
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
    return requestedLocale && getSiteLocale(requestedLocale) ? requestedLocale : 'en';
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
  const demoRoutes = getSecondaryRoutes('live-demos');

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

  const secondaryNavigation = location.pathname.startsWith('/live-demos')
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

  useEffect(() => {
    if (effectiveLocale === 'en') {
      return undefined;
    }

    const root = document.getElementById('root');
    if (!root) {
      return undefined;
    }

    let cancelled = false;
    let observer: MutationObserver | undefined;

    // Dynamically imported: the generated phrase dictionary behind this module
    // is large and only ever needed once a visitor picks a non-English locale.
    // translateSiteDom is itself async — it loads only the requested locale's
    // phrase chunk (not all of them) before it starts rewriting text.
    import('./site-phrase-translation').then(({ translateSiteDom }) => {
      if (cancelled) {
        return;
      }

      translateSiteDom(root, effectiveLocale).catch(() => {});

      observer = new MutationObserver(() => {
        translateSiteDom(root, effectiveLocale).catch(() => {});
      });
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [effectiveLocale, location.pathname]);

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
          <Route path="/patterns/foundations" element={<Suspense fallback={<RouteFallback />}><FoundationsPatternPage /></Suspense>} />
          <Route path="/patterns/public" element={<Suspense fallback={<RouteFallback />}><PublicPatternPage /></Suspense>} />
          <Route path="/patterns/operations" element={<Suspense fallback={<RouteFallback />}><OperationsPatternPage /></Suspense>} />
          <Route path="/patterns/data" element={<Suspense fallback={<RouteFallback />}><DataPatternPage /></Suspense>} />
          <Route path="/patterns/access" element={<Suspense fallback={<RouteFallback />}><AccessPatternPage /></Suspense>} />
          <Route path="/patterns/feedback" element={<Suspense fallback={<RouteFallback />}><FeedbackPatternPage /></Suspense>} />
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
          <Route path="/live-demos" element={<Suspense fallback={<RouteFallback />}><LiveDemosPage /></Suspense>} />
          <Route path="/live-demos/surfaces" element={<Suspense fallback={<RouteFallback />}><CardsPage /></Suspense>} />
          <Route path="/live-demos/layouts" element={<Suspense fallback={<RouteFallback />}><LayoutsPage /></Suspense>} />
          <Route path="/live-demos/semantics" element={<Suspense fallback={<RouteFallback />}><VocabularyPage /></Suspense>} />
          <Route path="/live-demos/food" element={<Suspense fallback={<RouteFallback />}><FoodMenuPage /></Suspense>} />
          <Route path="/live-demos/playback" element={<Suspense fallback={<RouteFallback />}><PlaybackPage /></Suspense>} />
          <Route path="/live-demos/analytics" element={<Suspense fallback={<RouteFallback />}><AnalyticsPage /></Suspense>} />
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
