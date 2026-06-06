import { lazy, Suspense, useCallback, useState } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  GdsProvider,
  useGdsThemePresetState,
} from '@doneisbetter/gds-theme';
import {
  ar,
  de,
  DocsShell,
  en,
  fr,
  he,
  hu,
  it,
  ReferenceLocaleNotice,
  ru,
  SidebarNavItem,
  StateBlock,
  ThemeToggle,
  type ThemeExplorerSelection,
} from '@doneisbetter/gds-core';
import {
  getLegacyRedirects,
  getPrimaryRoutes,
  getRouteLabel,
  getSecondaryRoutes,
  isRouteActive,
} from './site-routes';
import { getFullCopyLocalesForRoute, hasFullRouteLocalization } from './locale-coverage';

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

function RouteFallback() {
  return (
    <StateBlock
      variant="loading"
      title="Loading reference route"
      description="The official GDS website is loading the next live example."
    />
  );
}

const localesMap: Record<string, { label: string; messages: Record<string, string> }> = {
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
  const {
    selection: siteThemeSelection,
    setSelection: setSiteThemeSelection,
    setScheme: setSiteThemeScheme,
  } = useGdsThemePresetState({ storageKey: 'gds-reference-theme-selection' });
  const location = useLocation();
  const routeLocaleIds = getFullCopyLocalesForRoute(location.pathname);
  const routeLocaleOptions = routeLocaleIds
    .map((id) => [id, localesMap[id]] as const)
    .filter((entry): entry is readonly [string, { label: string; messages: Record<string, string> }] => Boolean(entry[1]));
  const effectiveLocale = hasFullRouteLocalization(location.pathname, locale) ? locale : 'en';
  const handleSiteThemeSelectionChange = useCallback((selection: ThemeExplorerSelection) => {
    setSiteThemeSelection(selection);
  }, [setSiteThemeSelection]);

  const primaryRoutes = getPrimaryRoutes();
  const demoRoutes = getSecondaryRoutes('live-demos');

  const primaryNavigation = primaryRoutes.map((route) => (
    <SidebarNavItem
      key={route.id}
      action={route.action}
      label={getRouteLabel(route, effectiveLocale)}
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
    ? ({
        de: 'Offizielle GDS-Website und Live-Demo-Hub',
        fr: 'Site GDS officiel et hub de démos live',
        it: 'Sito GDS ufficiale e hub demo live',
        ru: 'Официальный сайт GDS и центр live-демо',
        he: 'אתר GDS רשמי ומרכז דמואים חיים',
        ar: 'موقع GDS الرسمي ومركز العروض الحية',
        hu: 'Hivatalos GDS oldal és élő demó központ',
      }[effectiveLocale] ?? 'Official GDS site and live demo hub')
    : location.pathname.startsWith('/request-feature')
      ? ({
          de: 'Offizieller GDS Feature-Request-Eingang',
          fr: 'Canal officiel de demande de feature GDS',
          it: 'Canale ufficiale per richieste feature GDS',
          ru: 'Официальный прием запросов функций GDS',
          he: 'ערוץ רשמי לבקשות יכולת GDS',
          ar: 'قناة طلب ميزات GDS الرسمية',
          hu: 'Hivatalos GDS feature kérési csatorna',
        }[effectiveLocale] ?? 'Official GDS feature request intake')
      : ({
          de: 'Offizielle GDS-Website, Dokumentation, Regeln, Themes und Runtime-Nachweis',
          fr: 'Site GDS officiel, documentation, règles, thèmes et preuve runtime',
          it: 'Sito GDS ufficiale, documentazione, regole, temi e prova runtime',
          ru: 'Официальный сайт GDS, документация, правила, темы и runtime-доказательство',
          he: 'אתר GDS רשמי, תיעוד, כללים, ערכות עיצוב והוכחת runtime',
          ar: 'موقع GDS الرسمي والتوثيق والقواعد والثيمات وإثبات التشغيل',
          hu: 'Hivatalos GDS weboldal, dokumentáció, szabályok, témák és runtime bizonyíték',
        }[effectiveLocale] ?? 'Official GDS website, docs, rules, themes, and runtime proof');

  const headerActions = (
    <>
      <select
        aria-label="Select site locale"
        value={effectiveLocale}
        onChange={(event) => setLocale(event.target.value)}
      >
        {routeLocaleOptions.map(([id, localeValue]) => (
          <option key={id} value={id}>
            {localeValue.label}
          </option>
        ))}
      </select>
      <ThemeToggle
        onColorSchemeChange={setSiteThemeScheme}
      />
    </>
  );

  return (
    <GdsProvider
      locale={effectiveLocale}
      messages={localesMap[effectiveLocale]?.messages ?? localesMap.en.messages}
      theme={siteThemeSelection.theme}
      defaultColorScheme={siteThemeSelection.colorScheme}
      forceColorScheme={siteThemeSelection.colorScheme === 'auto' ? undefined : siteThemeSelection.colorScheme}
    >
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
            localeLabel="English only"
            detail={`Shared GDS vocabulary switches with the selected locale. Only routes listed as fully localized in the official coverage contract ship complete translated copy. ${localesMap[locale]?.label ?? locale} remains available on routes with full-copy coverage.`}
          />
        ) : null}
        <Routes>
          <Route path="/" element={<Suspense fallback={<RouteFallback />}><OverviewPage /></Suspense>} />
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
          {getLegacyRedirects().map((redirect) => (
            <Route
              key={redirect.legacyPath}
              path={redirect.legacyPath}
              element={<Navigate to={redirect.to} replace />}
            />
          ))}
        </Routes>
      </DocsShell>
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
