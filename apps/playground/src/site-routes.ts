import type { SemanticAction } from '@doneisbetter/gds-core';

export type PublicAudienceIntent =
  | 'overview'
  | 'install'
  | 'coverage'
  | 'api'
  | 'maturity'
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
  localizedLabels?: Partial<Record<string, string>>;
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
    localizedLabels: {
      de: 'Was ist GDS',
      fr: 'GDS, c’est quoi',
      it: 'Cos’è GDS',
      ru: 'Что такое GDS',
      he: 'מה זה GDS',
      ar: 'ما هو GDS',
      hu: 'Mi a GDS',
    },
    action: 'home',
    audienceIntent: 'overview',
    navGroup: 'primary',
    activePrefixes: ['/'],
  },
  {
    id: 'install',
    path: '/install',
    label: 'Install',
    localizedLabels: {
      de: 'Installieren',
      fr: 'Installer',
      it: 'Installa',
      ru: 'Установка',
      he: 'התקנה',
      ar: 'التثبيت',
      hu: 'Telepítés',
    },
    action: 'download',
    audienceIntent: 'install',
    navGroup: 'primary',
    activePrefixes: ['/install'],
  },
  {
    id: 'patterns',
    path: '/patterns',
    label: 'Patterns',
    localizedLabels: {
      de: 'Patterns',
      fr: 'Patterns',
      it: 'Pattern',
      ru: 'Паттерны',
      he: 'תבניות',
      ar: 'الأنماط',
      hu: 'Minták',
    },
    action: 'grid',
    audienceIntent: 'patterns',
    navGroup: 'primary',
    activePrefixes: ['/patterns'],
  },
  {
    id: 'api',
    path: '/api',
    label: 'API',
    localizedLabels: {
      de: 'API',
      fr: 'API',
      it: 'API',
      ru: 'API',
      he: 'API',
      ar: 'API',
      hu: 'API',
    },
    action: 'copy',
    audienceIntent: 'api',
    navGroup: 'primary',
    activePrefixes: ['/api'],
  },
  {
    id: 'maturity',
    path: '/maturity',
    label: 'Maturity',
    localizedLabels: {
      de: 'Reifegrad',
      fr: 'Maturité',
      it: 'Maturità',
      ru: 'Зрелость',
      he: 'בשלות',
      ar: 'النضج',
      hu: 'Érettség',
    },
    action: 'verify',
    audienceIntent: 'maturity',
    navGroup: 'primary',
    activePrefixes: ['/maturity'],
  },
  {
    id: 'use-cases',
    path: '/use-cases',
    label: 'Use Cases',
    localizedLabels: {
      de: 'Use Cases',
      fr: 'Cas d’usage',
      it: 'Casi d’uso',
      ru: 'Сценарии',
      he: 'שימושים',
      ar: 'حالات الاستخدام',
      hu: 'Use case-ek',
    },
    action: 'list',
    audienceIntent: 'use-cases',
    navGroup: 'primary',
    activePrefixes: ['/use-cases'],
  },
  {
    id: 'coverage',
    path: '/coverage',
    label: 'Coverage',
    localizedLabels: {
      de: 'Abdeckung',
      fr: 'Couverture',
      it: 'Copertura',
      ru: 'Покрытие',
      he: 'כיסוי',
      ar: 'التغطية',
      hu: 'Lefedettség',
    },
    action: 'analytics',
    audienceIntent: 'coverage',
    navGroup: 'primary',
    activePrefixes: ['/coverage'],
  },
  {
    id: 'themes',
    path: '/themes',
    label: 'Themes',
    localizedLabels: {
      de: 'Themes',
      fr: 'Thèmes',
      it: 'Temi',
      ru: 'Темы',
      he: 'ערכות עיצוב',
      ar: 'الثيمات',
      hu: 'Témák',
    },
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
    localizedLabels: {
      de: 'Governance',
      fr: 'Gouvernance',
      it: 'Governance',
      ru: 'Управление',
      he: 'ממשל',
      ar: 'الحوكمة',
      hu: 'Governance',
    },
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
    localizedLabels: {
      de: 'Live-Demos',
      fr: 'Démos live',
      it: 'Demo live',
      ru: 'Live-демо',
      he: 'דמואים חיים',
      ar: 'عروض حية',
      hu: 'Élő demók',
    },
    action: 'preview',
    audienceIntent: 'live-demos',
    navGroup: 'primary',
    activePrefixes: ['/live-demos'],
  },
  {
    id: 'request-feature',
    path: '/request-feature',
    label: 'Request a Feature',
    localizedLabels: {
      de: 'Feature anfragen',
      fr: 'Demander une feature',
      it: 'Richiedi feature',
      ru: 'Запросить функцию',
      he: 'בקשת יכולת',
      ar: 'طلب ميزة',
      hu: 'Feature kérése',
    },
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

export function getRouteLabel(route: PublicSiteRoute, locale = 'en') {
  return route.localizedLabels?.[locale] ?? route.label;
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
