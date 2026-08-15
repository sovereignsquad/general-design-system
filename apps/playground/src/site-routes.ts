import type { SemanticAction } from '@sovereignsquad/gds-core';

export type PublicAudienceIntent =
  | 'overview'
  | 'install'
  | 'coverage'
  | 'components'
  | 'foundations'
  | 'systems'
  | 'resources'
  | 'api'
  | 'maturity'
  | 'use-cases'
  | 'patterns'
  | 'themes'
  | 'governance'
  | 'live-proofs'
  | 'feature-request';

export interface PublicSiteRoute {
  id: string;
  path: string;
  label: string;
  action: SemanticAction;
  audienceIntent: PublicAudienceIntent;
  navGroup: 'primary' | 'secondary';
  activePrefixes?: string[];
  legacyPaths?: string[];
}

export const publicSiteRoutes: PublicSiteRoute[] = [
  {
    id: 'overview',
    path: '/',
    label: 'What Is GDS',
    action: 'home',
    audienceIntent: 'overview',
    navGroup: 'primary',
    activePrefixes: ['/'],
  },
  {
    id: 'install',
    path: '/install',
    label: 'Install',
    action: 'download',
    audienceIntent: 'install',
    navGroup: 'primary',
    activePrefixes: ['/install'],
  },
  {
    id: 'foundations',
    path: '/foundations',
    label: 'Foundations',
    action: 'start',
    audienceIntent: 'foundations',
    navGroup: 'primary',
    activePrefixes: ['/foundations'],
    // Issue 626 Phase 3: the foundations family is a top-level area; its catalog URL keeps
    // working forever via the redirect mechanism.
    legacyPaths: ['/patterns/foundations'],
  },
  {
    id: 'components',
    path: '/components',
    label: 'Components',
    action: 'grid',
    audienceIntent: 'components',
    navGroup: 'primary',
    activePrefixes: ['/components'],
  },
  {
    id: 'patterns',
    path: '/patterns',
    label: 'Patterns',
    action: 'grid',
    audienceIntent: 'patterns',
    navGroup: 'primary',
    activePrefixes: ['/patterns'],
  },
  {
    id: 'systems',
    path: '/systems',
    label: 'Systems',
    action: 'preview',
    audienceIntent: 'systems',
    navGroup: 'primary',
    activePrefixes: ['/systems'],
  },
  {
    id: 'api',
    path: '/api',
    label: 'API',
    action: 'copy',
    audienceIntent: 'api',
    navGroup: 'primary',
    activePrefixes: ['/api'],
  },
  {
    id: 'maturity',
    path: '/maturity',
    label: 'Maturity',
    action: 'verify',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/maturity'],
  },
  {
    id: 'use-cases',
    path: '/use-cases',
    label: 'Use Cases',
    action: 'list',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/use-cases'],
  },
  {
    id: 'coverage',
    path: '/coverage',
    label: 'Coverage',
    action: 'analytics',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/coverage'],
  },
  {
    id: 'themes',
    path: '/themes',
    label: 'Themes',
    action: 'theme',
    audienceIntent: 'themes',
    navGroup: 'primary',
    activePrefixes: ['/themes'],
    legacyPaths: ['/tokens'],
  },
  {
    id: 'governance',
    path: '/governance',
    label: 'Governance',
    action: 'verify',
    audienceIntent: 'governance',
    navGroup: 'primary',
    activePrefixes: ['/governance'],
    legacyPaths: ['/rulebook'],
  },
  {
    id: 'live-proofs',
    path: '/live-proofs',
    label: 'Live Proofs',
    action: 'preview',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs'],
    // Issue 606 renamed the public /live-demos URL family; these keep every pre-rename link
    // working. The rename shipped without them, which broke exactly what the issue said must
    // not break — found while closing it.
    legacyPaths: ['/live-demos'],
  },
  {
    id: 'request-feature',
    path: '/request-feature',
    label: 'Request a Feature',
    action: 'submit',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/request-feature'],
  },
  {
    id: 'ai',
    path: '/ai',
    label: 'Use with AI',
    action: 'settings',
    audienceIntent: 'resources',
    navGroup: 'secondary',
    activePrefixes: ['/ai'],
  },
  {
    id: 'demo-surfaces',
    path: '/live-proofs/surfaces',
    label: 'Discovery & Cards',
    action: 'grid',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/surfaces'],
    legacyPaths: ['/cards', '/live-demos/surfaces'],
  },
  {
    id: 'demo-layouts',
    path: '/live-proofs/layouts',
    label: 'Shells & Layouts',
    action: 'copy',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/layouts'],
    legacyPaths: ['/layouts', '/live-demos/layouts'],
  },
  {
    id: 'demo-semantics',
    path: '/live-proofs/semantics',
    label: 'Actions & Auth',
    action: 'list',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/semantics'],
    legacyPaths: ['/vocabulary', '/live-demos/semantics'],
  },
  {
    id: 'demo-food',
    path: '/live-proofs/food',
    label: 'Food & Menus',
    action: 'gallery',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/food'],
    legacyPaths: ['/live-demos/food'],
  },
  {
    id: 'demo-playback',
    path: '/live-proofs/playback',
    label: 'Playback & Capture',
    action: 'capture',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/playback'],
    legacyPaths: ['/live-demos/playback'],
  },
  {
    id: 'demo-analytics',
    path: '/live-proofs/analytics',
    label: 'Analytics & Data',
    action: 'analytics',
    audienceIntent: 'live-proofs',
    navGroup: 'secondary',
    activePrefixes: ['/live-proofs/analytics'],
    legacyPaths: ['/analytics', '/live-demos/analytics'],
  },
];

export function isRouteActive(pathname: string, route: PublicSiteRoute) {
  if (route.path === '/') {
    return pathname === '/';
  }

  return (route.activePrefixes ?? [route.path]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getPrimaryRoutes() {
  return publicSiteRoutes.filter((route) => route.navGroup === 'primary');
}

export function getRouteLabel(route: PublicSiteRoute) {
  return route.label;
}

export function getSecondaryRoutes(intent: PublicAudienceIntent) {
  return publicSiteRoutes.filter((route) => route.navGroup === 'secondary' && route.audienceIntent === intent);
}

export function getLegacyRedirects() {
  return publicSiteRoutes.flatMap((route) =>
    (route.legacyPaths ?? []).map((legacyPath) => ({
      legacyPath,
      to: route.path,
    })),
  );
}
