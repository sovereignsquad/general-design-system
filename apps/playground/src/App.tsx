import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  GdsProvider,
  applyGdsFontLane,
  resolveGdsThemePreset,
  type GdsFontLaneId,
  type GdsThemePresetId,
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
  getSecondaryRoutes,
  isRouteActive,
} from './site-routes';
import { hasFullRouteLocalization } from './locale-coverage';

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

const themeSelectionStorageKey = 'gds-reference-theme-selection';

type StoredThemeSelection = Pick<
  ThemeExplorerSelection,
  'preset' | 'colorScheme' | 'fontLane' | 'runtimeKey' | 'brandPrimary' | 'brandFlatSurfaces' | 'brandEditorialSerif'
>;

function createThemeSelection(stored: Partial<StoredThemeSelection> = {}): ThemeExplorerSelection {
  const preset = (stored.preset ?? 'default') as GdsThemePresetId;
  const colorScheme = stored.colorScheme ?? 'light';
  const fontLane = (stored.fontLane ?? 'inter') as GdsFontLaneId;
  const brandPrimary = stored.brandPrimary ?? 'blue';
  const brandFlatSurfaces = stored.brandFlatSurfaces ?? true;
  const brandEditorialSerif = stored.brandEditorialSerif ?? false;
  const effectiveColorScheme = preset === 'dark-public' || preset === 'neon-night' ? 'dark' : colorScheme;
  const runtimeKey = stored.runtimeKey ?? `${preset}-${effectiveColorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;

  return {
    preset,
    colorScheme: effectiveColorScheme,
    theme: applyGdsFontLane(resolveGdsThemePreset(preset, {
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    }), fontLane),
    fontLane,
    runtimeKey,
    brandPrimary,
    brandFlatSurfaces,
    brandEditorialSerif,
  };
}

function loadThemeSelection(): ThemeExplorerSelection {
  if (typeof window === 'undefined') {
    return createThemeSelection();
  }

  try {
    const stored = window.localStorage.getItem(themeSelectionStorageKey);
    return createThemeSelection(stored ? JSON.parse(stored) as Partial<StoredThemeSelection> : undefined);
  } catch {
    return createThemeSelection();
  }
}

function persistThemeSelection(selection: ThemeExplorerSelection) {
  if (typeof window === 'undefined') {
    return;
  }

  const stored: StoredThemeSelection = {
    preset: selection.preset,
    colorScheme: selection.colorScheme,
    fontLane: selection.fontLane,
    runtimeKey: selection.runtimeKey,
    brandPrimary: selection.brandPrimary,
    brandFlatSurfaces: selection.brandFlatSurfaces,
    brandEditorialSerif: selection.brandEditorialSerif,
  };

  try {
    window.localStorage.setItem(themeSelectionStorageKey, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable in hardened/private browser contexts. Runtime
    // theme application should continue even if persistence is blocked.
  }
}

function PlaygroundContent() {
  const [locale, setLocale] = useState<string>('en');
  const [siteThemeSelection, setSiteThemeSelection] = useState<ThemeExplorerSelection>(() => loadThemeSelection());
  const location = useLocation();
  const handleSiteThemeSelectionChange = useCallback((selection: ThemeExplorerSelection) => {
    persistThemeSelection(selection);
    setSiteThemeSelection(selection);
  }, []);
  useEffect(() => {
    const resolveScheme = () =>
      siteThemeSelection.colorScheme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : siteThemeSelection.colorScheme;

    const applyScheme = () => {
      document.documentElement.setAttribute('data-mantine-color-scheme', resolveScheme());
      document.documentElement.setAttribute('data-gds-theme-runtime', siteThemeSelection.runtimeKey ?? `${siteThemeSelection.preset}-${siteThemeSelection.colorScheme}`);
      if (siteThemeSelection.fontLane) {
        document.documentElement.setAttribute('data-gds-font-lane', siteThemeSelection.fontLane);
      }
    };

    applyScheme();
    persistThemeSelection(siteThemeSelection);

    if (siteThemeSelection.colorScheme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyScheme();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [siteThemeSelection]);

  const primaryRoutes = getPrimaryRoutes();
  const demoRoutes = getSecondaryRoutes('live-demos');

  const primaryNavigation = primaryRoutes.map((route) => (
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
    : location.pathname.startsWith('/request-feature')
      ? 'Official GDS feature request intake'
      : 'Official GDS website, docs, rules, themes, and runtime proof';

  const headerActions = (
    <>
      <select
        aria-label="Select site locale"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
      >
        {Object.entries(localesMap).map(([id, localeValue]) => (
          <option key={id} value={id}>
            {localeValue.label}
          </option>
        ))}
      </select>
      <ThemeToggle
        onColorSchemeChange={(nextScheme) =>
          setSiteThemeSelection((previous) => createThemeSelection({
            ...previous,
            colorScheme: nextScheme,
            runtimeKey: undefined,
          }))
        }
      />
    </>
  );

  return (
    <GdsProvider
      locale={locale}
      messages={localesMap[locale]?.messages ?? localesMap.en.messages}
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
        {!hasFullRouteLocalization(location.pathname, locale) ? (
          <ReferenceLocaleNotice
            localeLabel={localesMap[locale]?.label ?? locale}
            detail="Shared GDS vocabulary switches with the selected locale. Only routes listed as fully localized in the official coverage contract ship complete translated copy."
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
