import type { SemanticAction } from '@doneisbetter/gds-core';

export type PublicAudienceIntent =
  | 'overview'
  | 'install'
  | 'coverage'
  | 'api'
  | 'use-cases'
  | 'patterns'
  | 'themes'
  | 'governance'
  | 'live-demos'
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
    id: 'patterns',
    path: '/patterns',
    label: 'Patterns',
    action: 'grid',
    audienceIntent: 'patterns',
    navGroup: 'primary',
    activePrefixes: ['/patterns'],
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
    id: 'use-cases',
    path: '/use-cases',
    label: 'Use Cases',
    action: 'list',
    audienceIntent: 'use-cases',
    navGroup: 'primary',
    activePrefixes: ['/use-cases'],
  },
  {
    id: 'coverage',
    path: '/coverage',
    label: 'Coverage',
    action: 'analytics',
    audienceIntent: 'coverage',
    navGroup: 'primary',
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
    id: 'live-demos',
    path: '/live-demos',
    label: 'Live Demos',
    action: 'preview',
    audienceIntent: 'live-demos',
    navGroup: 'primary',
    activePrefixes: ['/live-demos'],
  },
  {
    id: 'request-feature',
    path: '/request-feature',
    label: 'Request a Feature',
    action: 'submit',
    audienceIntent: 'feature-request',
    navGroup: 'primary',
    activePrefixes: ['/request-feature'],
  },
  {
    id: 'demo-surfaces',
    path: '/live-demos/surfaces',
    label: 'Discovery & Cards',
    action: 'grid',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/surfaces'],
    legacyPaths: ['/cards'],
  },
  {
    id: 'demo-layouts',
    path: '/live-demos/layouts',
    label: 'Shells & Layouts',
    action: 'copy',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/layouts'],
    legacyPaths: ['/layouts'],
  },
  {
    id: 'demo-semantics',
    path: '/live-demos/semantics',
    label: 'Actions & Auth',
    action: 'list',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/semantics'],
    legacyPaths: ['/vocabulary'],
  },
  {
    id: 'demo-food',
    path: '/live-demos/food',
    label: 'Food & Menus',
    action: 'gallery',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/food'],
  },
  {
    id: 'demo-playback',
    path: '/live-demos/playback',
    label: 'Playback & Capture',
    action: 'capture',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/playback'],
  },
  {
    id: 'demo-analytics',
    path: '/live-demos/analytics',
    label: 'Analytics & Data',
    action: 'analytics',
    audienceIntent: 'live-demos',
    navGroup: 'secondary',
    activePrefixes: ['/live-demos/analytics'],
    legacyPaths: ['/analytics'],
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
