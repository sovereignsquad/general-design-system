import {
  ar,
  de,
  en,
  fr,
  es,
  he,
  hu,
  it,
  ru,
} from '@sovereignsquad/gds-core';

export const stableGdsVersion = '5.0.0';
export const targetGdsVersion = '5.0.0';

export const siteLocaleRegistry = {
  en: { label: 'English', messages: en },
  de: { label: 'Deutsch', messages: de },
  fr: { label: 'Français', messages: fr },
  it: { label: 'Italiano', messages: it },
  es: { label: 'Español', messages: es },
  ru: { label: 'Русский', messages: ru },
  he: { label: 'עברית', messages: he },
  ar: { label: 'العربية', messages: ar },
  hu: { label: 'Magyar', messages: hu },
} as const;

export type SiteLocaleId = keyof typeof siteLocaleRegistry;
type LocaleCopyMap = Record<SiteLocaleId, unknown>;

export function getSiteCopy<const T extends LocaleCopyMap>(copy: T, locale: string): T[SiteLocaleId] {
  return copy[locale as SiteLocaleId] ?? copy.en;
}

export function getSiteLocale(id: string) {
  return siteLocaleRegistry[id as SiteLocaleId] ?? siteLocaleRegistry.en;
}

export function getSiteLocaleOptions(ids: string[]) {
  return ids
    .map((id) => [id, siteLocaleRegistry[id as SiteLocaleId]] as const)
    .filter((entry): entry is readonly [SiteLocaleId, (typeof siteLocaleRegistry)[SiteLocaleId]] => Boolean(entry[1]));
}

const siteRouteLabels = {
  overview: {
    en: 'What Is GDS',
    de: 'Was ist GDS',
    fr: 'GDS, c’est quoi',
    it: 'Cos’è GDS',
    es: 'Qué es GDS',
    ru: 'Что такое GDS',
    he: 'מה זה GDS',
    ar: 'ما هو GDS',
    hu: 'Mi a GDS',
  },
  install: {
    en: 'Install',
    de: 'Installieren',
    fr: 'Installer',
    it: 'Installa',
    es: 'Instalar',
    ru: 'Установка',
    he: 'התקנה',
    ar: 'التثبيت',
    hu: 'Telepítés',
  },
  patterns: {
    en: 'Patterns',
    de: 'Patterns',
    fr: 'Patterns',
    it: 'Pattern',
    es: 'Patrones',
    ru: 'Паттерны',
    he: 'תבניות',
    ar: 'الأنماط',
    hu: 'Minták',
  },
  api: {
    en: 'API',
    de: 'API',
    fr: 'API',
    it: 'API',
    es: 'API',
    ru: 'API',
    he: 'API',
    ar: 'API',
    hu: 'API',
  },
  maturity: {
    en: 'Maturity',
    de: 'Reifegrad',
    fr: 'Maturité',
    it: 'Maturità',
    es: 'Madurez',
    ru: 'Зрелость',
    he: 'בשלות',
    ar: 'النضج',
    hu: 'Érettség',
  },
  'use-cases': {
    en: 'Use Cases',
    de: 'Use Cases',
    fr: 'Cas d’usage',
    it: 'Casi d’uso',
    es: 'Casos de uso',
    ru: 'Сценарии',
    he: 'שימושים',
    ar: 'حالات الاستخدام',
    hu: 'Use case-ek',
  },
  coverage: {
    en: 'Coverage',
    de: 'Abdeckung',
    fr: 'Couverture',
    it: 'Copertura',
    es: 'Cobertura',
    ru: 'Покрытие',
    he: 'כיסוי',
    ar: 'التغطية',
    hu: 'Lefedettség',
  },
  themes: {
    en: 'Themes',
    de: 'Themes',
    fr: 'Thèmes',
    it: 'Temi',
    es: 'Temas',
    ru: 'Темы',
    he: 'ערכות עיצוב',
    ar: 'الثيمات',
    hu: 'Témák',
  },
  governance: {
    en: 'Governance',
    de: 'Governance',
    fr: 'Gouvernance',
    it: 'Governance',
    es: 'Gobernanza',
    ru: 'Управление',
    he: 'ממשל',
    ar: 'الحوكمة',
    hu: 'Governance',
  },
  'live-demos': {
    en: 'Live Demos',
    de: 'Live-Demos',
    fr: 'Démos live',
    it: 'Demo live',
    es: 'Demos en vivo',
    ru: 'Live-демо',
    he: 'דמואים חיים',
    ar: 'عروض حية',
    hu: 'Élő demók',
  },
  'request-feature': {
    en: 'Request a Feature',
    de: 'Feature anfragen',
    fr: 'Demander une feature',
    it: 'Richiedi feature',
    es: 'Solicitar una característica',
    ru: 'Запросить функцию',
    he: 'בקשת יכולת',
    ar: 'طلب ميزة',
    hu: 'Feature kérése',
  },
  'demo-surfaces': {
    en: 'Discovery & Cards',
    de: 'Entdeckung & Karten',
    fr: 'Découverte et cartes',
    it: 'Scoperta e schede',
    es: 'Descubrimiento y tarjetas',
    ru: 'Поиск и карточки',
    he: 'גילוי וכרטיסים',
    ar: 'الاكتشاف والبطاقات',
    hu: 'Felfedezés és kártyák',
  },
  'demo-layouts': {
    en: 'Shells & Layouts',
    de: 'Shells & Layouts',
    fr: 'Shells et mises en page',
    it: 'Shell e layout',
    es: 'Shells y diseños',
    ru: 'Оболочки и макеты',
    he: 'מעטפות ופריסות',
    ar: 'الأغلفة والتخطيطات',
    hu: 'Shell-ek és elrendezések',
  },
  'demo-semantics': {
    en: 'Actions & Auth',
    de: 'Aktionen & Auth',
    fr: 'Actions et auth',
    it: 'Azioni e auth',
    es: 'Acciones y auth',
    ru: 'Действия и вход',
    he: 'פעולות ואימות',
    ar: 'الإجراءات والمصادقة',
    hu: 'Műveletek és auth',
  },
  'demo-food': {
    en: 'Food & Menus',
    de: 'Food & Menüs',
    fr: 'Restauration et menus',
    it: 'Cibo e menu',
    es: 'Comida y menús',
    ru: 'Еда и меню',
    he: 'אוכל ותפריטים',
    ar: 'الطعام والقوائم',
    hu: 'Ételek és menük',
  },
  'demo-playback': {
    en: 'Playback & Capture',
    de: 'Wiedergabe & Erfassung',
    fr: 'Lecture et capture',
    it: 'Riproduzione e acquisizione',
    es: 'Reproducción y captura',
    ru: 'Воспроизведение и захват',
    he: 'ניגון ולכידה',
    ar: 'التشغيل والالتقاط',
    hu: 'Lejátszás és rögzítés',
  },
  'demo-analytics': {
    en: 'Analytics & Data',
    de: 'Analytics & Daten',
    fr: 'Analytique et données',
    it: 'Analytics e dati',
    es: 'Analítica y datos',
    ru: 'Аналитика и данные',
    he: 'אנליטיקה ונתונים',
    ar: 'التحليلات والبيانات',
    hu: 'Analitika és adatok',
  },
} as const;

export function getSiteRouteLabel(routeId: string, fallbackLabel: string, locale: string) {
  const labels = siteRouteLabels[routeId as keyof typeof siteRouteLabels];
  return labels?.[locale as keyof typeof labels] ?? labels?.en ?? fallbackLabel;
}

const headerContextCopy = {
  default: {
    en: 'Official GDS website, docs, rules, themes, and runtime proof',
    de: 'Offizielle GDS-Website, Dokumentation, Regeln, Themes und Runtime-Nachweis',
    fr: 'Site GDS officiel, documentation, règles, thèmes et preuve runtime',
    it: 'Sito GDS ufficiale, documentazione, regole, temi e prova runtime',
    es: 'Sitio web oficial de GDS, documentación, reglas, temas y prueba runtime',
    ru: 'Официальный сайт GDS, документация, правила, темы и runtime-доказательство',
    he: 'אתר GDS רשמי, תיעוד, כללים, ערכות עיצוב והוכחת runtime',
    ar: 'موقع GDS الرسمي والتوثيق والقواعد والثيمات وإثبات التشغيل',
    hu: 'Hivatalos GDS weboldal, dokumentáció, szabályok, témák és runtime bizonyíték',
  },
  liveDemos: {
    en: 'Official GDS site and live demo hub',
    de: 'Offizielle GDS-Website und Live-Demo-Hub',
    fr: 'Site GDS officiel et hub de démos live',
    it: 'Sito GDS ufficiale e hub demo live',
    es: 'Sitio oficial de GDS y centro de demos en vivo',
    ru: 'Официальный сайт GDS и центр live-демо',
    he: 'אתר GDS רשמי ומרכז דמואים חיים',
    ar: 'موقع GDS الرسمي ومركز العروض الحية',
    hu: 'Hivatalos GDS oldal és élő demó központ',
  },
  featureRequest: {
    en: 'Official GDS feature request intake',
    de: 'Offizieller GDS Feature-Request-Eingang',
    fr: 'Canal officiel de demande de feature GDS',
    it: 'Canale ufficiale per richieste feature GDS',
    es: 'Canal oficial de solicitudes de funcionalidades de GDS',
    ru: 'Официальный прием запросов функций GDS',
    he: 'ערוץ רשמי לבקשות יכולת GDS',
    ar: 'قناة طلب ميزات GDS الرسمية',
    hu: 'Hivatalos GDS feature kérési csatorna',
  },
} as const;

export function getSiteHeaderContext(pathname: string, locale: string) {
  if (pathname.startsWith('/live-demos')) {
    return getSiteCopy(headerContextCopy.liveDemos, locale);
  }

  if (pathname.startsWith('/request-feature')) {
    return getSiteCopy(headerContextCopy.featureRequest, locale);
  }

  return getSiteCopy(headerContextCopy.default, locale);
}

export const appShellCopy = {
  en: {
    localeSelectLabel: 'Select site locale',
    localeFallbackLabel: 'English only',
    localeFallbackDetail: 'Shared GDS vocabulary switches with the selected locale. Only routes listed as fully localized in the official coverage contract ship complete translated copy. {localeLabel} remains available on routes with full-copy coverage.',
    routeFallbackTitle: 'Loading reference route',
    routeFallbackDescription: 'The official GDS website is loading the next live example.',
  },
  de: {
    localeSelectLabel: 'Website-Sprache auswählen',
    localeFallbackLabel: 'Nur Englisch',
    localeFallbackDetail: 'Das gemeinsame GDS-Vokabular wechselt mit der ausgewählten Sprache. Nur Routen im offiziellen Coverage-Contract liefern vollständig übersetzte Inhalte. {localeLabel} bleibt auf Routen mit vollständiger Copy-Abdeckung verfügbar.',
    routeFallbackTitle: 'Referenzroute wird geladen',
    routeFallbackDescription: 'Die offizielle GDS-Website lädt das nächste Live-Beispiel.',
  },
  fr: {
    localeSelectLabel: 'Choisir la langue du site',
    localeFallbackLabel: 'Anglais uniquement',
    localeFallbackDetail: 'Le vocabulaire GDS partagé suit la langue choisie. Seules les routes listées comme entièrement localisées dans le contrat de couverture officiel livrent une copie complète. {localeLabel} reste disponible sur les routes avec couverture complète.',
    routeFallbackTitle: 'Chargement de la route de référence',
    routeFallbackDescription: 'Le site GDS officiel charge le prochain exemple live.',
  },
  it: {
    localeSelectLabel: 'Seleziona lingua del sito',
    localeFallbackLabel: 'Solo inglese',
    localeFallbackDetail: 'Il vocabolario GDS condiviso cambia con la lingua selezionata. Solo le route elencate nel contratto ufficiale di copertura hanno copy tradotta completa. {localeLabel} resta disponibile sulle route con copertura completa.',
    routeFallbackTitle: 'Caricamento route di riferimento',
    routeFallbackDescription: 'Il sito GDS ufficiale sta caricando il prossimo esempio live.',
  },
  es: {
    localeSelectLabel: 'Seleccionar idioma del sitio',
    localeFallbackLabel: 'Solo inglés',
    localeFallbackDetail: 'El vocabulario GDS compartido cambia con el idioma seleccionado. Solo las rutas listadas en el contrato de cobertura oficial ofrecen una copia traducida completa. {localeLabel} sigue disponible en las rutas con cobertura completa.',
    routeFallbackTitle: 'Cargando ruta de referencia',
    routeFallbackDescription: 'El sitio oficial de GDS está cargando el próximo ejemplo en vivo.',
  },
  ru: {
    localeSelectLabel: 'Выберите язык сайта',
    localeFallbackLabel: 'Только английский',
    localeFallbackDetail: 'Общий словарь GDS переключается с выбранным языком. Полный перевод поставляется только для маршрутов, указанных в официальном контракте покрытия. {localeLabel} остается доступным на маршрутах с полным покрытием.',
    routeFallbackTitle: 'Загрузка справочного маршрута',
    routeFallbackDescription: 'Официальный сайт GDS загружает следующий live-пример.',
  },
  he: {
    localeSelectLabel: 'בחירת שפת אתר',
    localeFallbackLabel: 'אנגלית בלבד',
    localeFallbackDetail: 'אוצר המילים המשותף של GDS משתנה עם השפה שנבחרה. רק נתיבים שמופיעים בחוזה הכיסוי הרשמי כוללים תוכן מתורגם מלא. {localeLabel} נשאר זמין בנתיבים עם כיסוי מלא.',
    routeFallbackTitle: 'נתיב הרפרנס נטען',
    routeFallbackDescription: 'אתר GDS הרשמי טוען את הדוגמה החיה הבאה.',
  },
  ar: {
    localeSelectLabel: 'اختيار لغة الموقع',
    localeFallbackLabel: 'الإنجليزية فقط',
    localeFallbackDetail: 'يتغير قاموس GDS المشترك مع اللغة المختارة. لا تقدم النسخة المترجمة الكاملة إلا في المسارات المدرجة في عقد التغطية الرسمي. يبقى {localeLabel} متاحا في المسارات ذات التغطية الكاملة.',
    routeFallbackTitle: 'تحميل مسار المرجع',
    routeFallbackDescription: 'يقوم موقع GDS الرسمي بتحميل المثال الحي التالي.',
  },
  hu: {
    localeSelectLabel: 'Webhely nyelvének kiválasztása',
    localeFallbackLabel: 'Csak angol',
    localeFallbackDetail: 'A közös GDS szókészlet a kiválasztott nyelvvel vált. Teljes fordított szöveg csak a hivatalos coverage contractban felsorolt útvonalakon érhető el. {localeLabel} a teljes copy-lefedettségű útvonalakon marad elérhető.',
    routeFallbackTitle: 'Referencia útvonal betöltése',
    routeFallbackDescription: 'A hivatalos GDS weboldal betölti a következő élő példát.',
  },
} as const;

export function getAppShellCopy(locale: string) {
  return getSiteCopy(appShellCopy, locale);
}

