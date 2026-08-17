import {
  ar,
  de,
  en,
  fr,
  es,
  he,
  hu,
  it,
  ja,
  ko,
  ru,
  zh,
} from '@sovereignsquad/gds-core';

export const stableGdsVersion = '6.2.0';
export const targetGdsVersion = '6.2.0';

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
  ja: { label: '日本語', messages: ja },
  ko: { label: '한국어', messages: ko },
  zh: { label: '简体中文', messages: zh },
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
    zh: '什么是GDS',
    ko: 'GDS란?',
    ja: 'GDSとは',
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
    zh: '安装',
    ko: '설치하다',
    ja: 'インストール',
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
    zh: '图案',
    ko: '패턴',
    ja: 'パターン',
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
    zh: '应用程序编程接口',
    ko: 'API',
    ja: 'API',
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
    zh: '到期',
    ko: '성숙함',
    ja: '成熟',
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
    zh: '使用案例',
    ko: '사용 사례',
    ja: '使用例',
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
    zh: '覆盖范围',
    ko: '적용 범위',
    ja: 'カバレッジ',
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
    zh: '主题',
    ko: '테마',
    ja: 'テーマ',
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
    zh: '治理',
    ko: '통치',
    ja: 'ガバナンス',
  },
  'live-proofs': {
    en: 'Live Proofs',
    de: 'Live-Beweise',
    fr: 'Preuves en direct',
    it: 'Prove dal vivo',
    es: 'Pruebas en vivo',
    ru: 'Живые доказательства',
    he: 'הוכחות חיות',
    ar: 'البراهين الحية',
    hu: 'Élő bizonyítékok',
    zh: '现场校样',
    ko: '실시간 증명',
    ja: 'ライブプルーフ',
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
    zh: '请求功能',
    ko: '기능 요청',
    ja: '機能をリクエストする',
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
    zh: '探索与卡片',
    ko: '발견 및 카드',
    ja: 'ディスカバリーとカード',
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
    zh: '外壳和布局',
    ko: '쉘 및 레이아웃',
    ja: 'シェルとレイアウト',
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
    zh: '操作和授权',
    ko: '작업 및 인증',
    ja: 'アクションと認証',
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
    zh: '食物和菜单',
    ko: '음식 및 메뉴',
    ja: '食事とメニュー',
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
    zh: '回放和捕捉',
    ko: '재생 및 캡처',
    ja: '再生とキャプチャ',
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
    zh: '分析与数据',
    ko: '분석 및 데이터',
    ja: '分析とデータ',
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
    zh: 'GDS 官方网站、文档、规则、主题和运行时证明',
    ko: '공식 GDS 웹사이트, 문서, 규칙, 테마 및 런타임 증명',
    ja: '公式 GDS Web サイト、ドキュメント、ルール、テーマ、および実行時の証明',
  },
  liveProofs: {
    en: 'Official GDS site and live proof hub',
    de: 'Offizielle GDS-Website und Live-Proof-Hub',
    fr: 'Site officiel GDS et hub de preuve en direct',
    it: 'Sito GDS ufficiale e hub di prova dal vivo',
    es: 'Sitio oficial de GDS y centro de prueba en vivo',
    ru: 'Официальный сайт GDS и центр живых доказательств',
    he: 'אתר GDS רשמי ומרכז הוכחה חי',
    ar: 'موقع GDS الرسمي ومركز إثبات حي',
    hu: 'Hivatalos GDS webhely és élőbiztos központ',
    zh: '官方 GDS 网站和现场验证中心',
    ko: '공식 GDS 사이트 및 라이브 증명 허브',
    ja: '公式 GDS サイトとライブプルーフハブ',
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
    zh: '官方 GDS 功能请求受理',
    ko: '공식 GDS 기능 요청 접수',
    ja: '公式 GDS 機能リクエストの受付',
  },
} as const;

export function getSiteHeaderContext(pathname: string, locale: string) {
  if (pathname.startsWith('/live-proofs')) {
    return getSiteCopy(headerContextCopy.liveProofs, locale);
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
    zh: {
    localeSelectLabel: '选择站点区域设置',
    localeFallbackLabel: '仅英语',
    localeFallbackDetail: '与所选区域设置共享的 GDS 词汇切换。仅在官方报道合同中列为完全本地化的航线才会提供完整的翻译副本。 {localeLabel} 在具有完整副本覆盖的路线上仍然可用。',
    routeFallbackTitle: '加载参考路线',
    routeFallbackDescription: 'GDS 官方网站正在加载下一个实例。',
  },
    ko: {
    localeSelectLabel: '사이트 로케일 선택',
    localeFallbackLabel: '영어로만 제공',
    localeFallbackDetail: '선택한 로케일과 공유 GDS 어휘 스위치. 공식 적용 범위 계약에 완전히 현지화된 것으로 나열된 노선만 완전한 번역본을 배송합니다. 전체 사본이 적용되는 경로에서는 {localeLabel}을 계속 사용할 수 있습니다.',
    routeFallbackTitle: '참조 경로 로드 중',
    routeFallbackDescription: '공식 GDS 웹사이트에서 다음 라이브 예제를 로드 중입니다.',
  },
    ja: {
    localeSelectLabel: 'サイトロケールの選択',
    localeFallbackLabel: '英語のみ',
    localeFallbackDetail: '共有 GDS 語彙は、選択したロケールに応じて切り替わります。公式補償契約に完全にローカライズされていると記載されているルートのみが、完全な翻訳版を出荷します。 {localeLabel} は、フルコピー カバレッジのルートで引き続き使用できます。',
    routeFallbackTitle: '参照ルートの読み込み',
    routeFallbackDescription: 'GDS の公式 Web サイトには、次のライブ サンプルがロードされています。',
  },
} as const;

export function getAppShellCopy(locale: string) {
  return getSiteCopy(appShellCopy, locale);
}

