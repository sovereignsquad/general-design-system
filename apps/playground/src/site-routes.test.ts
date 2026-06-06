import {
  getLegacyRedirects,
  getPrimaryRoutes,
  getSecondaryRoutes,
  isRouteActive,
  publicSiteRoutes,
} from './site-routes';

describe('public site routes', () => {
  it('keeps route ids and paths unique', () => {
    const ids = publicSiteRoutes.map((route) => route.id);
    const paths = publicSiteRoutes.map((route) => route.path);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('defines a clean primary navigation contract', () => {
    expect(getPrimaryRoutes().map((route) => route.label)).toEqual([
      'What Is GDS',
      'Install',
      'Patterns',
      'API',
      'Maturity',
      'Use Cases',
      'Coverage',
      'Themes',
      'Governance',
      'Live Demos',
      'Request a Feature',
    ]);
  });

  it('groups live-demo routes into secondary navigation', () => {
    expect(getSecondaryRoutes('live-demos').map((route) => `${route.label}:${route.path}`)).toEqual([
      'Discovery & Cards:/live-demos/surfaces',
      'Shells & Layouts:/live-demos/layouts',
      'Actions & Auth:/live-demos/semantics',
      'Food & Menus:/live-demos/food',
      'Playback & Capture:/live-demos/playback',
      'Analytics & Data:/live-demos/analytics',
    ]);
  });

  it('maps legacy showcase routes to explicit replacements', () => {
    expect(getLegacyRedirects()).toEqual([
      { legacyPath: '/tokens', to: '/themes' },
      { legacyPath: '/rulebook', to: '/governance' },
      { legacyPath: '/cards', to: '/live-demos/surfaces' },
      { legacyPath: '/layouts', to: '/live-demos/layouts' },
      { legacyPath: '/vocabulary', to: '/live-demos/semantics' },
      { legacyPath: '/analytics', to: '/live-demos/analytics' },
    ]);
  });

  it('treats nested pattern and demo routes as active under their parent nav item', () => {
    const patternsRoute = publicSiteRoutes.find((route) => route.id === 'patterns');
    const demosRoute = publicSiteRoutes.find((route) => route.id === 'live-demos');

    expect(patternsRoute).toBeTruthy();
    expect(demosRoute).toBeTruthy();

    expect(isRouteActive('/patterns/public', patternsRoute!)).toBe(true);
    expect(isRouteActive('/live-demos/layouts', demosRoute!)).toBe(true);
    expect(isRouteActive('/themes', demosRoute!)).toBe(false);
  });
});
