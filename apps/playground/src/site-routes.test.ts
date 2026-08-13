import {
  getLegacyRedirects,
  getPrimaryRoutes,
  getRouteLabel,
  getSecondaryRoutes,
  isRouteActive,
  publicSiteRoutes,
} from './site-routes';
import { getSiteRouteLabel } from './site-copy';

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
      'Live Proofs',
      'Request a Feature',
      'Use with AI',
    ]);
  });

  it('keeps localized route labels in the site copy contract', () => {
    const overview = publicSiteRoutes.find((route) => route.id === 'overview');
    const maturity = publicSiteRoutes.find((route) => route.id === 'maturity');

    expect(getSiteRouteLabel(overview!.id, getRouteLabel(overview!), 'en')).toBe('What Is GDS');
    expect(getSiteRouteLabel(overview!.id, getRouteLabel(overview!), 'es')).toBe('Qué es GDS');
    expect(getSiteRouteLabel(overview!.id, getRouteLabel(overview!), 'ru')).toBe('Что такое GDS');
    expect(getSiteRouteLabel(maturity!.id, getRouteLabel(maturity!), 'ar')).toBe('النضج');
  });

  it('groups live-proof routes into secondary navigation', () => {
    expect(getSecondaryRoutes('live-proofs').map((route) => `${route.label}:${route.path}`)).toEqual([
      'Discovery & Cards:/live-proofs/surfaces',
      'Shells & Layouts:/live-proofs/layouts',
      'Actions & Auth:/live-proofs/semantics',
      'Food & Menus:/live-proofs/food',
      'Playback & Capture:/live-proofs/playback',
      'Analytics & Data:/live-proofs/analytics',
    ]);
  });

  it('maps legacy showcase routes to explicit replacements', () => {
    expect(getLegacyRedirects()).toEqual([
      { legacyPath: '/tokens', to: '/themes' },
      { legacyPath: '/rulebook', to: '/governance' },
      { legacyPath: '/cards', to: '/live-proofs/surfaces' },
      { legacyPath: '/layouts', to: '/live-proofs/layouts' },
      { legacyPath: '/vocabulary', to: '/live-proofs/semantics' },
      { legacyPath: '/analytics', to: '/live-proofs/analytics' },
    ]);
  });

  it('treats nested pattern and demo routes as active under their parent nav item', () => {
    const patternsRoute = publicSiteRoutes.find((route) => route.id === 'patterns');
    const demosRoute = publicSiteRoutes.find((route) => route.id === 'live-proofs');

    expect(patternsRoute).toBeTruthy();
    expect(demosRoute).toBeTruthy();

    expect(isRouteActive('/patterns/public', patternsRoute!)).toBe(true);
    expect(isRouteActive('/live-proofs/layouts', demosRoute!)).toBe(true);
    expect(isRouteActive('/themes', demosRoute!)).toBe(false);
  });
});
