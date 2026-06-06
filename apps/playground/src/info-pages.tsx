import { useMemo, useState } from 'react';
import {
  ActionBar,
  DocsCodeBlock,
  DocsPageShell,
  FeatureBand,
  FormField,
  getGdsMaturitySummary,
  getGdsRecommendedMaturityCapabilities,
  PublicBrandFooter,
  ReferenceLinkGrid,
  ReferenceSection,
  ReferenceThemeExplorer,
  SimpleDataTable,
  StateBlock,
  type ThemeExplorerSelection,
} from '@doneisbetter/gds-core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { apiReferenceEntries, apiReferencePackages, getApiReferenceEntries, getApiReferenceSummary } from './api-reference-registry';
import { patternRegistry } from './pattern-registry';
import { productUseCases } from './product-use-cases';

const stableGdsVersion = '3.4.1';
const targetGdsVersion = '3.4.1';

const installCode = `npm install @doneisbetter/gds@${targetGdsVersion}
npm install -D @doneisbetter/gds-eslint-config@${targetGdsVersion} @doneisbetter/gds-compliance@${targetGdsVersion}`;

const granularInstallCode = `npm install @doneisbetter/gds-theme@${targetGdsVersion} @doneisbetter/gds-core@${targetGdsVersion} @doneisbetter/gds-admin@${targetGdsVersion}
npm install -D @doneisbetter/gds-eslint-config@${targetGdsVersion} @doneisbetter/gds-compliance@${targetGdsVersion}`;

const peerCode = `npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;
const mantineCorePackage = '@mantine/' + 'core';

const nextLayoutCode = `// app/layout.tsx
import { ColorSchemeScript } from '${mantineCorePackage}';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`;

const providerCode = `// app/providers.tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}`;

const viteBootstrapCode = `// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GdsProvider } from '@doneisbetter/gds/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GdsProvider>
    <App />
  </GdsProvider>,
);`;

const updateCode = `npm install @doneisbetter/gds@${targetGdsVersion}

# or granular runtime packages
npm install @doneisbetter/gds-theme@${targetGdsVersion} @doneisbetter/gds-core@${targetGdsVersion} @doneisbetter/gds-admin@${targetGdsVersion}

# governance tooling
npm install -D @doneisbetter/gds-eslint-config@${targetGdsVersion} @doneisbetter/gds-compliance@${targetGdsVersion}`;

const complianceCode = `{
  "schemaVersion": 1,
  "gdsVersion": "${targetGdsVersion}",
  "productArchetype": "hybrid",
  "requiredContracts": [
    "DiscoveryShell",
    "ActionBar",
    "ListingCard",
    "DetailProfileShell"
  ],
  "localAdapters": [],
  "approvedExceptions": [],
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"]
  }
}`;

const themeGovernanceCode = `{
  "compliance": {
    "approvedThemeLanes": [
      "gdsTheme",
      "gdsDarkPublicTheme",
      "gdsFlatSurfaceTheme",
      "gdsEditorialPublicTheme",
      "createPublicBrandTheme"
    ],
    "themeOwnershipPaths": [
      "src/providers.tsx",
      "src/theme.ts"
    ]
  }
}`;

const verificationCode = `npm run build
npm run test:run
npm run verify:mantine
gds-compliance check --manifest ./gds-adoption.json`;

const failureRecoveryCode = `# Peer conflict
npm ls @mantine/core @mantine/hooks @mantine/modals @mantine/notifications react react-dom
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react

# Registry propagation after publish
GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published

# Consumer verification failure
gds-compliance check --manifest ./gds-adoption.json --format text`;

const fallbackInstallCode = `# Fallback only when npm is temporarily unavailable
npm run pack:release
gh release create gds-v${targetGdsVersion} dist/release-bundles/${targetGdsVersion}/* --title "GDS ${targetGdsVersion} release bundles"`;

const clientUpdateTemplate = `# Copy this to every client migration thread

Team, we completed the GDS update to the ${targetGdsVersion} adoption platform release.

What to do now:
- Update all production dependencies to:
  - @doneisbetter/gds@${targetGdsVersion}
  - @doneisbetter/gds-eslint-config@${targetGdsVersion} (dev)
  - @doneisbetter/gds-compliance@${targetGdsVersion} (dev)
- Remove local branding-layer theme extension code based on extendGdsTheme(...).
- Route theme ownership through one approved lane:
  - gdsTheme
  - gdsDarkPublicTheme
  - gdsFlatSurfaceTheme
  - gdsEditorialPublicTheme
  - createPublicBrandTheme(...)
- If using adapters, declare:
  - compliance.approvedThemeLanes
  - compliance.themeOwnershipPaths
- Replace local shell/navigation/action/card wrappers with:
  - DiscoveryShell, SidebarNav, ActionBar, ListingCard, DetailProfileShell
- Run in CI:
  - npm run build
  - npm run test:run
  - npm run verify:mantine
  - gds-compliance check --manifest ./gds-adoption.json

Reference checks:
- https://sovereignsquad.github.io/general-design-system/patterns
- https://sovereignsquad.github.io/general-design-system/install
- https://sovereignsquad.github.io/general-design-system/governance

If any contract is missing locally, use:
- gds-compliance findings
- local exception with approved exception contract (temporary only).`;

const featureRequestRecipient = 'moldovancsaba+general.design.system@gmail.com';

function SiteFooter() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      description: `The official GDS website and live demo. Every public route on this site exists to help teams understand what is shipped, how to install it, and which contracts they should adopt instead of building locally. Live version: ${stableGdsVersion}.`,
      install: 'Install GDS',
      legal: `Open source. Public npm packages. Governed adoption path. Live version ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Browse patterns', description: 'See component and pattern contracts grouped by family.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Explore themes', description: 'Test every official theme lane in light and dark.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Read governance', description: 'Follow the canonical adoption and compliance rules.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Request a feature', description: 'Submit reusable capability requests for GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    de: {
      description: `Die offizielle GDS-Website und Live-Demo. Jede öffentliche Route hilft Teams zu verstehen, was ausgeliefert ist, wie es installiert wird und welche Contracts statt lokaler Lösungen übernommen werden sollen. Live-Version: ${stableGdsVersion}.`,
      install: 'GDS installieren',
      legal: `Open Source. Öffentliche npm-Pakete. Gesteuerter Adoptionspfad. Live-Version ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Patterns durchsuchen', description: 'Komponenten- und Pattern-Contracts nach Familie ansehen.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Themes erkunden', description: 'Jede offizielle Theme-Lane in hell und dunkel testen.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Governance lesen', description: 'Den kanonischen Adoptions- und Compliance-Regeln folgen.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Feature anfragen', description: 'Wiederverwendbare Capability-Anfragen für GDS einreichen.', href: '/general-design-system/request-feature' },
      ],
    },
    fr: {
      description: `Le site GDS officiel et sa démo live. Chaque route publique aide les équipes à comprendre ce qui est livré, comment l’installer et quels contrats adopter plutôt que construire localement. Version live : ${stableGdsVersion}.`,
      install: 'Installer GDS',
      legal: `Open source. Packages npm publics. Parcours d’adoption gouverné. Version live ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Parcourir les patterns', description: 'Voir les contrats composants et patterns par famille.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Explorer les thèmes', description: 'Tester chaque lane de thème officielle en clair et sombre.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Lire la gouvernance', description: 'Suivre les règles canoniques d’adoption et de conformité.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Demander une feature', description: 'Soumettre des demandes de capacités réutilisables pour GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    it: {
      description: `Il sito GDS ufficiale e la demo live. Ogni route pubblica aiuta i team a capire cosa è rilasciato, come installarlo e quali contratti adottare invece di costruire localmente. Versione live: ${stableGdsVersion}.`,
      install: 'Installa GDS',
      legal: `Open source. Pacchetti npm pubblici. Percorso di adozione governato. Versione live ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Sfoglia i pattern', description: 'Vedi contratti di componenti e pattern raggruppati per famiglia.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Esplora i temi', description: 'Testa ogni theme lane ufficiale in chiaro e scuro.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Leggi governance', description: 'Segui le regole canoniche di adozione e compliance.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Richiedi feature', description: 'Invia richieste di capability riutilizzabili per GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    ru: {
      description: `Официальный сайт GDS и live-демо. Каждая публичная route помогает понять, что поставлено, как установить систему и какие контракты внедрять вместо локальной разработки. Live-версия: ${stableGdsVersion}.`,
      install: 'Установить GDS',
      legal: `Open source. Публичные npm-пакеты. Управляемый путь внедрения. Live-версия ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Открыть паттерны', description: 'Смотрите component и pattern contracts по семействам.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Открыть темы', description: 'Тестируйте каждую официальную theme lane в светлом и темном режиме.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Читать governance', description: 'Следуйте каноническим правилам adoption и compliance.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Запросить функцию', description: 'Отправляйте запросы на переиспользуемые возможности для GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    he: {
      description: `אתר GDS הרשמי והדמו החי. כל route ציבורית עוזרת לצוותים להבין מה נמסר, איך להתקין ומה לאמץ במקום לבנות מקומית. גרסת live: ${stableGdsVersion}.`,
      install: 'התקנת GDS',
      legal: `קוד פתוח. חבילות npm ציבוריות. מסלול אימוץ מנוהל. גרסת live ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'עיון בתבניות', description: 'ראו חוזי רכיבים ותבניות לפי משפחה.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'חקר ערכות עיצוב', description: 'בדקו כל theme lane רשמית במצב בהיר וכהה.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'קריאת governance', description: 'עקבו אחרי כללי האימוץ וה-compliance הקנוניים.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'בקשת יכולת', description: 'שלחו בקשות capability לשימוש חוזר עבור GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    ar: {
      description: `موقع GDS الرسمي والعرض الحي. كل route عامة تساعد الفرق على فهم ما تم تسليمه وكيفية تثبيته وأي عقود يجب اعتمادها بدلا من البناء محليا. الإصدار الحي: ${stableGdsVersion}.`,
      install: 'تثبيت GDS',
      legal: `مفتوح المصدر. حزم npm عامة. مسار اعتماد محكوم. الإصدار الحي ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'تصفح الأنماط', description: 'شاهد عقود المكونات والأنماط مجمعة حسب العائلة.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'استكشاف الثيمات', description: 'اختبر كل theme lane رسمية في الوضعين الفاتح والداكن.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'قراءة الحوكمة', description: 'اتبع قواعد الاعتماد والامتثال الكانونية.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'طلب ميزة', description: 'أرسل طلبات capability قابلة لإعادة الاستخدام لـ GDS.', href: '/general-design-system/request-feature' },
      ],
    },
    hu: {
      description: `A hivatalos GDS weboldal és élő demó. Minden publikus route segít megérteni, mi van kiadva, hogyan kell telepíteni és mely contractokat kell adoptálni lokális építés helyett. Élő verzió: ${stableGdsVersion}.`,
      install: 'GDS telepítése',
      legal: `Nyílt forráskód. Publikus npm csomagok. Governed adoptálási út. Élő verzió ${stableGdsVersion}.`,
      links: [
        { id: 'patterns', title: 'Patternök böngészése', description: 'Komponens és pattern contractok családok szerint csoportosítva.', href: '/general-design-system/patterns' },
        { id: 'themes', title: 'Témák felfedezése', description: 'Minden hivatalos theme lane tesztelése világos és sötét módban.', href: '/general-design-system/themes' },
        { id: 'governance', title: 'Governance olvasása', description: 'Kövesd a kanonikus adoption és compliance szabályokat.', href: '/general-design-system/governance' },
        { id: 'feature-request', title: 'Feature kérése', description: 'Újrahasználható GDS capability kérések beküldése.', href: '/general-design-system/request-feature' },
      ],
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;
  return (
    <PublicBrandFooter
      brandTitle="General Design System"
      description={i18n.description}
      actions={(
        <a href="/general-design-system/install">{i18n.install}</a>
      )}
      secondary={(
        <ReferenceLinkGrid
          columns={2}
          items={[...i18n.links]}
        />
      )}
      legal={i18n.legal}
    />
  );
}

export function RequestFeaturePage() {
  const [name, setName] = useState('Your name');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [requestType, setRequestType] = useState('missing-component');
  const [useCase, setUseCase] = useState('');
  const [benefit, setBenefit] = useState('');
  const [urgency, setUrgency] = useState('');

  const mailSubject = useMemo(
    () => `GDS Feature Request: ${useCase || 'New capability request'}`,
    [useCase],
  );

  const mailBody = useMemo(() => {
    const parts = [
      `Requestor: ${name}`,
      `Email: ${email}`,
      `Organization: ${organization}`,
      `Request type: ${requestType}`,
      `Use case: ${useCase}`,
      `Desired benefit: ${benefit}`,
      `Priority/urgency: ${urgency}`,
      '',
      'Triage contract:',
      '- missing-component and missing-pattern requests can become scoped GDS issues',
      '- docs-question and compliance-question requests may become docs/tooling tasks',
      '- unsupported-product-specific requests should stay in the product repository',
      '',
      'Please keep this request focused to one capability.',
    ];

    return parts.join('\n');
  }, [name, email, organization, requestType, useCase, benefit, urgency]);

  const mailtoUrl = useMemo(
    () => `mailto:${featureRequestRecipient}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`,
    [mailSubject, mailBody],
  );

  return (
    <DocsPageShell
      title="Request a Feature"
      eyebrow="Official intake path"
      lead="Every feature request from teams should start with this simple mailto lane. Maintainers triage it into a GDS issue only when the need is reusable, accessible, and not product-specific."
    >
      <ReferenceSection title="Official feature request form" description="Use the shared mail path while we build the full API-backed tracker.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            window.location.href = mailtoUrl;
          }}
        >
          <StateBlock
            variant="info"
            title="Why this form is simple"
            description="It keeps onboarding friction low and records consistent evidence fields before we move to a structured portal."
          />
          <div>
            <FormField label="Name">
              <input
                id="gds-feature-name"
                aria-label="Name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Your name"
              />
            </FormField>
            <FormField label="Email">
              <input
                id="gds-feature-email"
                aria-label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="you@company.com"
              />
            </FormField>
            <FormField label="Organization (optional)">
              <input
                id="gds-feature-org"
                aria-label="Organization"
                value={organization}
                onChange={(event) => setOrganization(event.currentTarget.value)}
                placeholder="Company or project name"
              />
            </FormField>
            <FormField label="Request type">
              <select
                id="gds-feature-type"
                aria-label="Request type"
                value={requestType}
                onChange={(event) => setRequestType(event.currentTarget.value)}
              >
                <option value="missing-component">Missing component</option>
                <option value="missing-pattern">Missing pattern</option>
                <option value="docs-question">Documentation question</option>
                <option value="compliance-question">Compliance question</option>
                <option value="unsupported-product-specific">Unsupported product-specific request</option>
              </select>
            </FormField>
            <FormField label="What capability is missing?">
              <textarea
                id="gds-feature-what"
                aria-label="What capability is missing?"
                value={useCase}
                onChange={(event) => setUseCase(event.currentTarget.value)}
                placeholder="Describe the missing primitive or behavior."
                rows={3}
              />
            </FormField>
            <FormField label="How will this help your product?">
              <textarea
                id="gds-feature-benefit"
                aria-label="How will this help your product?"
                value={benefit}
                onChange={(event) => setBenefit(event.currentTarget.value)}
                placeholder="Add expected outcomes, impact, and urgency."
                rows={3}
              />
            </FormField>
            <FormField label="Urgency">
              <input
                id="gds-feature-urgency"
                aria-label="Urgency"
                value={urgency}
                onChange={(event) => setUrgency(event.currentTarget.value)}
                placeholder="High, Medium, Low"
              />
            </FormField>
          </div>
          <ActionBar
            primary={{ action: 'submit', onClick: () => { window.location.href = mailtoUrl; } }}
            secondary={[{ action: 'reset', onClick: () => {
              setName('Your name');
              setEmail('');
              setOrganization('');
              setRequestType('missing-component');
              setUseCase('');
              setBenefit('');
              setUrgency('');
            } }]}
          />
        </form>
      </ReferenceSection>

      <ReferenceSection title="What we prioritize" description="If your request is aligned with the next-wave adoption surface, it gets a clear path to production sooner.">
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'auth',
              title: 'Auth and social login',
              description: 'Provider policy, login semantics, and social-brand contracts for reusable identity surfaces.',
            },
            {
              id: 'playback',
              title: 'Playback and capture',
              description: 'Kiosk, staging, upload, and review flows should be represented by one governed contract.',
            },
            {
              id: 'governance',
              title: 'Governance automation',
              description: 'If a component becomes reusable, we prioritize a strict contract and migration path.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title="Triage and repository hygiene" description="Only reusable GDS capability requests belong in this repository and project board. Product-specific work must stay with the owning product.">
        <FeatureBand
          columns={3}
          variant="compact"
          items={[
            {
              id: 'promote',
              title: 'Promote to GDS issue',
              description: 'Repeated reusable need, clear accessibility contract, package API, docs, tests, and migration value.',
            },
            {
              id: 'docs',
              title: 'Route to docs or compliance',
              description: 'Questions about installation, rule enforcement, manifests, or canonical usage become docs/tooling work.',
            },
            {
              id: 'reject',
              title: 'Reject or transfer',
              description: 'One-off product screens, business logic, private integrations, or sensitive requests are not tracked on the GDS board.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title="Mail-client fallback" description="If your mail client does not open, copy the address and send the same fields manually.">
        <StateBlock
          variant="info"
          title={featureRequestRecipient}
          description="Include request type, reusable use case, accessibility needs, affected product, urgency, and whether an existing GDS primitive nearly covers it."
          compact
        />
      </ReferenceSection>

      <ReferenceSection title="Need to send directly" description={`Send urgent requests to ${featureRequestRecipient}.`}>
        <a href={mailtoUrl} aria-label={`Open prefilled feature request email to ${featureRequestRecipient}`}>Open prefilled email</a>
      </ReferenceSection>
    </DocsPageShell>
  );
}

export function OverviewPage() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'General Design System',
      eyebrow: 'Official reference and live demo',
      lead: 'One place to understand, install, test, and trust GDS. This website is both the public product site and the live runtime proof of the shipped design system.',
      meta: ['Open source', 'npm-ready', 'Live demos', `Live version ${stableGdsVersion}`],
      whatTitle: 'What GDS is',
      whatDescription: 'GDS is a governed design-system platform for products that want predictable UI contracts, shared runtime behavior, and a clear path away from local wrappers and UI drift.',
      whyTitle: 'Why GDS is useful',
      whyDescription: 'GDS works best for teams that want fewer local decisions, stronger accessibility defaults, clearer migration targets, and measurable compliance.',
      startTitle: 'Start here',
      startDescription: 'The fastest route depends on what you need right now.',
      whatItems: [
        { id: 'what', title: 'Reusable runtime contracts', description: 'Shells, cards, action systems, auth, embeds, feedback, and detail surfaces ship as canonical primitives.' },
        { id: 'why', title: 'A faster path to consistency', description: 'Teams adopt shipped contracts instead of recreating layout, button, and card patterns from scratch.' },
        { id: 'proof', title: 'This site is the live demo', description: 'Visitors can inspect the actual shipped theme lanes, public patterns, and application surfaces directly on this website.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Predictable delivery', description: 'Stable contracts reduce clarification overhead and keep implementation decisions reviewable.' },
        { id: 'shared-quality', title: 'Shared quality bar', description: 'Accessibility, empty/loading/error states, and semantic actions are handled through reusable surfaces.' },
        { id: 'ops-clarity', title: 'Operational clarity', description: 'Consumers can verify adoption with manifests, compliance tooling, and published migration guidance.' },
        { id: 'public-trust', title: 'Public trust', description: 'The official site is built on the same system it promotes, so visitors can inspect real shipped behavior.' },
      ],
      links: [
        { id: 'patterns', title: 'Browse patterns', description: 'See the documented pattern inventory grouped by foundations, public, operations, data, access, and feedback.', href: '/general-design-system/patterns', badge: 'Pattern catalog' },
        { id: 'coverage', title: 'Open coverage matrix', description: 'Track component and pattern parity between documentation and live runtime routes.', href: '/general-design-system/coverage', badge: 'Parity matrix' },
        { id: 'themes', title: 'Explore themes', description: 'Test the shipped presets and the governed brand-theme generator in the live theme lab.', href: '/general-design-system/themes', badge: 'Theme explorer' },
        { id: 'install', title: 'Install GDS', description: 'Copy the npm commands, provider setup, and verification contract used by real adopters.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Open live demos', description: 'Inspect runtime surfaces for shells, cards, auth, actions, food, playback, and analytics.', href: '/general-design-system/live-demos', badge: 'Live demos' },
        { id: 'governance', title: 'Read governance', description: 'Understand strict mode, approved exceptions, and the rule that reusable needs belong in GDS rather than local app code.', href: '/general-design-system/governance', badge: 'Rulebook' },
      ],
    },
    de: {
      title: 'General Design System',
      eyebrow: 'Offizielle Referenz und Live-Demo',
      lead: 'Ein zentraler Ort, um GDS zu verstehen, zu installieren, zu testen und zu vertrauen. Diese Website ist sowohl die öffentliche Produktseite als auch der Live-Runtime-Beweis des ausgelieferten Design-Systems.',
      meta: ['Open Source', 'npm-bereit', 'Live-Demos', `Live-Version ${stableGdsVersion}`],
      whatTitle: 'Was GDS ist',
      whatDescription: 'GDS ist eine gesteuerte Design-System-Plattform für Produkte, die vorhersagbare UI-Verträge, gemeinsames Runtime-Verhalten und einen klaren Weg weg von lokalen Wrappern und UI-Drift benötigen.',
      whyTitle: 'Warum GDS nützlich ist',
      whyDescription: 'GDS ist ideal für Teams, die weniger lokale Einzelentscheidungen, stärkere Accessibility-Standards, klarere Migrationsziele und messbare Compliance wollen.',
      startTitle: 'Hier starten',
      startDescription: 'Der schnellste Einstieg hängt davon ab, was du jetzt brauchst.',
      whatItems: [
        { id: 'what', title: 'Wiederverwendbare Runtime-Contracts', description: 'Shells, Karten, Aktionssysteme, Auth, Embeds, Feedback und Detailflächen werden als kanonische Primitives ausgeliefert.' },
        { id: 'why', title: 'Schneller zu Konsistenz', description: 'Teams übernehmen ausgelieferte Contracts statt Layout-, Button- und Kartenmuster lokal neu zu bauen.' },
        { id: 'proof', title: 'Diese Seite ist die Live-Demo', description: 'Besucher können die real ausgelieferten Theme-Lanes, öffentlichen Patterns und App-Flächen direkt hier prüfen.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Planbare Lieferung', description: 'Stabile Contracts senken Abstimmungsaufwand und halten Entscheidungen überprüfbar.' },
        { id: 'shared-quality', title: 'Gemeinsamer Qualitätsmaßstab', description: 'Accessibility, Empty/Loading/Error-Zustände und semantische Aktionen werden über wiederverwendbare Flächen geliefert.' },
        { id: 'ops-clarity', title: 'Operative Klarheit', description: 'Consumer können Adoption über Manifeste, Compliance-Tooling und veröffentlichte Migrationsleitfäden verifizieren.' },
        { id: 'public-trust', title: 'Öffentliches Vertrauen', description: 'Die offizielle Seite nutzt dasselbe System, das sie empfiehlt, und zeigt dadurch reales Laufzeitverhalten.' },
      ],
      links: [
        { id: 'patterns', title: 'Patterns durchsuchen', description: 'Sieh das dokumentierte Pattern-Inventar nach Foundations, Public, Operations, Data, Access und Feedback.', href: '/general-design-system/patterns', badge: 'Pattern-Katalog' },
        { id: 'coverage', title: 'Coverage-Matrix öffnen', description: 'Verfolge die Parität von Komponenten und Patterns zwischen Doku und Live-Routen.', href: '/general-design-system/coverage', badge: 'Paritätsmatrix' },
        { id: 'themes', title: 'Themes erkunden', description: 'Teste ausgelieferte Presets und den gesteuerten Brand-Theme-Generator im Live-Lab.', href: '/general-design-system/themes', badge: 'Theme-Explorer' },
        { id: 'install', title: 'GDS installieren', description: 'Übernimm npm-Befehle, Provider-Setup und Verifikationsvertrag aus realen Adopter-Pfaden.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Live-Demos öffnen', description: 'Prüfe Runtime-Flächen für Shells, Karten, Auth, Aktionen, Food, Playback und Analytics.', href: '/general-design-system/live-demos', badge: 'Live-Demos' },
        { id: 'governance', title: 'Governance lesen', description: 'Verstehe Strict Mode, freigegebene Ausnahmen und die Regel, dass Wiederverwendbares in GDS gehört.', href: '/general-design-system/governance', badge: 'Regelwerk' },
      ],
    },
    fr: {
      title: 'General Design System',
      eyebrow: 'Référence officielle et démo live',
      lead: 'Un seul endroit pour comprendre, installer, tester et fiabiliser GDS. Ce site est à la fois la vitrine publique et la preuve runtime du design system livré.',
      meta: ['Open source', 'prêt pour npm', 'Démos live', `Version live ${stableGdsVersion}`],
      whatTitle: 'Ce qu’est GDS',
      whatDescription: 'GDS est une plateforme de design system gouvernée pour les produits qui veulent des contrats UI prévisibles, un comportement runtime partagé et une sortie claire des wrappers locaux.',
      whyTitle: 'Pourquoi GDS est utile',
      whyDescription: 'GDS convient aux équipes qui veulent moins de décisions locales, de meilleurs standards d’accessibilité, des migrations plus claires et une conformité mesurable.',
      startTitle: 'Commencer ici',
      startDescription: 'Le chemin le plus rapide dépend de votre besoin immédiat.',
      whatItems: [
        { id: 'what', title: 'Contrats runtime réutilisables', description: 'Shells, cartes, systèmes d’action, auth, embeds, feedback et surfaces détail sont livrés comme primitives canoniques.' },
        { id: 'why', title: 'Un chemin plus rapide vers la cohérence', description: 'Les équipes adoptent les contrats livrés au lieu de recréer localement layouts, boutons et cartes.' },
        { id: 'proof', title: 'Ce site est la démo live', description: 'Les visiteurs peuvent inspecter ici les lanes de thème, patterns publics et surfaces applicatives réellement livrés.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Livraison prévisible', description: 'Des contrats stables réduisent le coût de clarification et gardent les décisions auditables.' },
        { id: 'shared-quality', title: 'Barre qualité partagée', description: 'Accessibilité, états vide/chargement/erreur et actions sémantiques sont fournis via des surfaces réutilisables.' },
        { id: 'ops-clarity', title: 'Clarté opérationnelle', description: 'Les équipes vérifient l’adoption avec manifestes, outillage conformité et guides de migration publiés.' },
        { id: 'public-trust', title: 'Confiance publique', description: 'Le site officiel est construit avec le système qu’il promeut, ce qui expose le comportement réellement livré.' },
      ],
      links: [
        { id: 'patterns', title: 'Parcourir les patterns', description: 'Consultez l’inventaire documenté par familles foundations, public, operations, data, access et feedback.', href: '/general-design-system/patterns', badge: 'Catalogue patterns' },
        { id: 'coverage', title: 'Ouvrir la matrice de couverture', description: 'Suivez la parité composants/patterns entre documentation et routes runtime.', href: '/general-design-system/coverage', badge: 'Matrice de parité' },
        { id: 'themes', title: 'Explorer les thèmes', description: 'Testez les presets livrés et le générateur de thème de marque gouverné dans le labo live.', href: '/general-design-system/themes', badge: 'Explorateur de thèmes' },
        { id: 'install', title: 'Installer GDS', description: 'Copiez les commandes npm, le setup provider et le contrat de vérification utilisés par les adopteurs réels.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Ouvrir les démos live', description: 'Inspectez les surfaces runtime pour shells, cartes, auth, actions, food, playback et analytics.', href: '/general-design-system/live-demos', badge: 'Démos live' },
        { id: 'governance', title: 'Lire la gouvernance', description: 'Comprenez le mode strict, les exceptions approuvées et la règle qui impose les besoins réutilisables dans GDS.', href: '/general-design-system/governance', badge: 'Règles' },
      ],
    },
    it: {
      title: 'General Design System',
      eyebrow: 'Riferimento ufficiale e demo live',
      lead: 'Un unico posto per capire, installare, testare e fidarsi di GDS. Questo sito è sia prodotto pubblico sia prova runtime del design system rilasciato.',
      meta: ['Codice aperto', 'pronto per npm', 'Demo live', `Versione live ${stableGdsVersion}`],
      whatTitle: 'Cos’è GDS',
      whatDescription: 'GDS è una piattaforma di design system governata per prodotti che vogliono contratti UI prevedibili e comportamento runtime condiviso.',
      whyTitle: 'Perché GDS è utile',
      whyDescription: 'GDS è ideale per team che vogliono meno decisioni locali, migliore accessibilità e adozione verificabile.',
      startTitle: 'Inizia qui',
      startDescription: 'Il percorso più rapido dipende da cosa ti serve adesso.',
      whatItems: [
        { id: 'what', title: 'Contratti runtime riutilizzabili', description: 'Shell, card, sistemi di azione, auth, embed, feedback e superfici di dettaglio vengono rilasciati come primitive canoniche.' },
        { id: 'why', title: 'Coerenza più veloce', description: 'I team adottano contratti già rilasciati invece di ricreare localmente layout, pulsanti e card.' },
        { id: 'proof', title: 'Questo sito è la demo live', description: 'I visitatori possono ispezionare qui theme lane, pattern pubblici e superfici applicative realmente rilasciate.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Delivery prevedibile', description: 'Contratti stabili riducono il lavoro di chiarimento e rendono verificabili le decisioni implementative.' },
        { id: 'shared-quality', title: 'Standard qualità condiviso', description: 'Accessibilità, stati vuoto/caricamento/errore e azioni semantiche passano da superfici riutilizzabili.' },
        { id: 'ops-clarity', title: 'Chiarezza operativa', description: 'I consumer verificano l’adozione con manifest, tooling di compliance e guide di migrazione pubblicate.' },
        { id: 'public-trust', title: 'Fiducia pubblica', description: 'Il sito ufficiale usa lo stesso sistema che promuove, così mostra comportamento reale già rilasciato.' },
      ],
      links: [
        { id: 'patterns', title: 'Sfoglia i pattern', description: 'Consulta l’inventario documentato per foundations, public, operations, data, access e feedback.', href: '/general-design-system/patterns', badge: 'Catalogo pattern' },
        { id: 'coverage', title: 'Apri matrice copertura', description: 'Controlla la parità tra documentazione e route runtime live.', href: '/general-design-system/coverage', badge: 'Matrice parità' },
        { id: 'themes', title: 'Esplora i temi', description: 'Testa preset rilasciati e generatore brand-theme governato nel laboratorio live.', href: '/general-design-system/themes', badge: 'Theme explorer' },
        { id: 'install', title: 'Installa GDS', description: 'Copia comandi npm, setup provider e contratto di verifica usati da adopter reali.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Apri demo live', description: 'Ispeziona superfici runtime per shell, card, auth, azioni, food, playback e analytics.', href: '/general-design-system/live-demos', badge: 'Demo live' },
        { id: 'governance', title: 'Leggi governance', description: 'Comprendi strict mode, eccezioni approvate e la regola che i bisogni riutilizzabili appartengono a GDS.', href: '/general-design-system/governance', badge: 'Regole' },
      ],
    },
    ru: {
      title: 'General Design System',
      eyebrow: 'Официальный референс и live-демо',
      lead: 'Единая точка, чтобы понять, установить, протестировать и доверять GDS. Этот сайт одновременно публичный продукт и runtime-доказательство поставляемой системы.',
      meta: ['Открытый код', 'готово для npm', 'Live-демо', `Live-версия ${stableGdsVersion}`],
      whatTitle: 'Что такое GDS',
      whatDescription: 'GDS — управляемая дизайн-системная платформа для предсказуемых UI-контрактов и общего runtime-поведения.',
      whyTitle: 'Почему GDS полезен',
      whyDescription: 'GDS подходит командам, которым нужны меньше локальных решений, сильнее доступность и проверяемое внедрение.',
      startTitle: 'Начните здесь',
      startDescription: 'Самый быстрый путь зависит от вашей текущей задачи.',
      whatItems: [
        { id: 'what', title: 'Переиспользуемые runtime-контракты', description: 'Shell, карточки, системы действий, auth, embed, feedback и detail-поверхности поставляются как канонические примитивы.' },
        { id: 'why', title: 'Быстрый путь к согласованности', description: 'Команды внедряют готовые контракты вместо локального пересоздания layout, кнопок и карточек.' },
        { id: 'proof', title: 'Этот сайт — live-демо', description: 'Посетители могут проверить реальные theme lanes, публичные паттерны и application surfaces прямо на этом сайте.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Предсказуемая поставка', description: 'Стабильные контракты уменьшают уточнения и делают технические решения проверяемыми.' },
        { id: 'shared-quality', title: 'Единый стандарт качества', description: 'Доступность, состояния пусто/загрузка/ошибка и семантические действия проходят через переиспользуемые поверхности.' },
        { id: 'ops-clarity', title: 'Операционная ясность', description: 'Команды проверяют внедрение через манифесты, compliance-инструменты и опубликованные migration guides.' },
        { id: 'public-trust', title: 'Публичное доверие', description: 'Официальный сайт построен на той же системе, которую продвигает, поэтому показывает реально поставленное поведение.' },
      ],
      links: [
        { id: 'patterns', title: 'Открыть паттерны', description: 'Смотрите документированный каталог по foundations, public, operations, data, access и feedback.', href: '/general-design-system/patterns', badge: 'Каталог паттернов' },
        { id: 'coverage', title: 'Открыть матрицу покрытия', description: 'Проверяйте паритет компонентов и паттернов между документацией и live runtime route.', href: '/general-design-system/coverage', badge: 'Матрица паритета' },
        { id: 'themes', title: 'Открыть темы', description: 'Тестируйте поставленные presets и управляемый brand-theme generator в live theme lab.', href: '/general-design-system/themes', badge: 'Theme explorer' },
        { id: 'install', title: 'Установить GDS', description: 'Скопируйте npm-команды, provider setup и verification contract из реальных adoption paths.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Открыть live-демо', description: 'Проверяйте runtime-поверхности для shell, карточек, auth, действий, food, playback и analytics.', href: '/general-design-system/live-demos', badge: 'Live-демо' },
        { id: 'governance', title: 'Читать governance', description: 'Изучите strict mode, утвержденные исключения и правило: переиспользуемые потребности принадлежат GDS.', href: '/general-design-system/governance', badge: 'Правила' },
      ],
    },
    he: {
      title: 'General Design System',
      eyebrow: 'אתר ייחוס ודמו חי רשמי',
      lead: 'מקום אחד להבין, להתקין, לבדוק ולסמוך על GDS. האתר הזה הוא גם אתר המוצר הציבורי וגם הוכחת runtime חיה של המערכת.',
      meta: ['קוד פתוח', 'מוכן ל-npm', 'דמואים חיים', `${stableGdsVersion} גרסת לייב`],
      whatTitle: 'מה זה GDS',
      whatDescription: 'GDS היא פלטפורמת Design System מנוהלת למוצרים שרוצים חוזי UI צפויים והתנהגות runtime משותפת.',
      whyTitle: 'למה GDS מועיל',
      whyDescription: 'GDS מתאים לצוותים שרוצים פחות החלטות מקומיות, נגישות טובה יותר ואימוץ מדיד.',
      startTitle: 'מתחילים כאן',
      startDescription: 'המסלול המהיר תלוי במה שצריך עכשיו.',
      whatItems: [
        { id: 'what', title: 'חוזי runtime לשימוש חוזר', description: 'Shells, כרטיסים, מערכות פעולה, auth, embeds, feedback ומשטחי detail נמסרים כפרימיטיבים קנוניים.' },
        { id: 'why', title: 'דרך מהירה יותר לעקביות', description: 'צוותים מאמצים חוזים קיימים במקום לבנות מקומית layout, כפתורים וכרטיסים.' },
        { id: 'proof', title: 'האתר הזה הוא הדמו החי', description: 'מבקרים יכולים לבדוק כאן theme lanes, patterns ציבוריים ומשטחי אפליקציה שנמסרו בפועל.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'מסירה צפויה', description: 'חוזים יציבים מפחיתים הבהרות ומשאירים החלטות יישום ניתנות לביקורת.' },
        { id: 'shared-quality', title: 'רף איכות משותף', description: 'נגישות, מצבי ריק/טעינה/שגיאה ופעולות סמנטיות עוברים דרך משטחים לשימוש חוזר.' },
        { id: 'ops-clarity', title: 'בהירות תפעולית', description: 'צרכנים מאמתים אימוץ בעזרת manifests, כלי compliance והנחיות migration שפורסמו.' },
        { id: 'public-trust', title: 'אמון ציבורי', description: 'האתר הרשמי בנוי על אותה מערכת שהוא מקדם, ולכן מציג התנהגות אמיתית שנמסרה.' },
      ],
      links: [
        { id: 'patterns', title: 'עיון בתבניות', description: 'ראו את מלאי התבניות המתועד לפי foundations, public, operations, data, access ו-feedback.', href: '/general-design-system/patterns', badge: 'קטלוג תבניות' },
        { id: 'coverage', title: 'פתיחת מטריצת כיסוי', description: 'עקבו אחרי תאימות רכיבים ותבניות בין התיעוד למסלולי runtime חיים.', href: '/general-design-system/coverage', badge: 'מטריצת תאימות' },
        { id: 'themes', title: 'חקר ערכות עיצוב', description: 'בדקו presets שפורסמו ואת מחולל ה-brand-theme המנוהל במעבדה החיה.', href: '/general-design-system/themes', badge: 'Theme explorer' },
        { id: 'install', title: 'התקנת GDS', description: 'העתיקו פקודות npm, provider setup וחוזה אימות שמשמשים מאמצים אמיתיים.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'פתיחת דמואים חיים', description: 'בדקו משטחי runtime עבור shells, כרטיסים, auth, פעולות, food, playback ו-analytics.', href: '/general-design-system/live-demos', badge: 'דמואים חיים' },
        { id: 'governance', title: 'קריאת governance', description: 'הבינו strict mode, חריגות מאושרות והכלל שצרכים לשימוש חוזר שייכים ל-GDS.', href: '/general-design-system/governance', badge: 'כללים' },
      ],
    },
    ar: {
      title: 'General Design System',
      eyebrow: 'مرجع رسمي وعرض حي',
      lead: 'مكان واحد لفهم GDS وتثبيته واختباره وبناء الثقة به. هذا الموقع هو موقع المنتج العام وإثبات التشغيل الحي للنظام.',
      meta: ['مفتوح المصدر', 'جاهز لـ npm', 'عروض حية', `الإصدار الحي ${stableGdsVersion}`],
      whatTitle: 'ما هو GDS',
      whatDescription: 'GDS منصة تصميم محكومة للمنتجات التي تريد عقود واجهات متوقعة وسلوك تشغيل مشترك.',
      whyTitle: 'لماذا GDS مفيد',
      whyDescription: 'GDS مناسب للفرق التي تريد قرارات محلية أقل، وصولية أقوى، واعتمادًا قابلًا للقياس.',
      startTitle: 'ابدأ من هنا',
      startDescription: 'أسرع مسار يعتمد على ما تحتاجه الآن.',
      whatItems: [
        { id: 'what', title: 'عقود تشغيل قابلة لإعادة الاستخدام', description: 'تصل shells والبطاقات وأنظمة الإجراءات وauth وembeds وfeedback وأسطح detail كبدائيات Canonical.' },
        { id: 'why', title: 'طريق أسرع إلى الاتساق', description: 'تعتمد الفرق العقود المنشورة بدلا من إعادة بناء layouts والأزرار والبطاقات محليا.' },
        { id: 'proof', title: 'هذا الموقع هو العرض الحي', description: 'يمكن للزوار فحص theme lanes والأنماط العامة وأسطح التطبيق المنشورة فعليا داخل هذا الموقع.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'تسليم قابل للتوقع', description: 'العقود المستقرة تقلل الحاجة للتوضيح وتجعل قرارات التنفيذ قابلة للمراجعة.' },
        { id: 'shared-quality', title: 'معيار جودة مشترك', description: 'الوصولية وحالات الفراغ/التحميل/الخطأ والإجراءات الدلالية تمر عبر أسطح قابلة لإعادة الاستخدام.' },
        { id: 'ops-clarity', title: 'وضوح تشغيلي', description: 'تتحقق الفرق من الاعتماد عبر manifests وأدوات compliance وإرشادات migration المنشورة.' },
        { id: 'public-trust', title: 'ثقة عامة', description: 'الموقع الرسمي مبني بنفس النظام الذي يوصي به، لذلك يعرض سلوكا حقيقيا منشورا.' },
      ],
      links: [
        { id: 'patterns', title: 'تصفح الأنماط', description: 'اطلع على مخزون الأنماط الموثق حسب foundations وpublic وoperations وdata وaccess وfeedback.', href: '/general-design-system/patterns', badge: 'كتالوج الأنماط' },
        { id: 'coverage', title: 'فتح مصفوفة التغطية', description: 'تتبع توافق المكونات والأنماط بين التوثيق ومسارات runtime الحية.', href: '/general-design-system/coverage', badge: 'مصفوفة التوافق' },
        { id: 'themes', title: 'استكشاف الثيمات', description: 'اختبر presets المنشورة ومولد brand-theme المحكوم داخل المختبر الحي.', href: '/general-design-system/themes', badge: 'مستكشف الثيمات' },
        { id: 'install', title: 'تثبيت GDS', description: 'انسخ أوامر npm وإعداد provider وعقد التحقق المستخدم في مسارات اعتماد حقيقية.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'فتح العروض الحية', description: 'افحص أسطح runtime للـ shells والبطاقات وauth والإجراءات وfood وplayback وanalytics.', href: '/general-design-system/live-demos', badge: 'عروض حية' },
        { id: 'governance', title: 'قراءة الحوكمة', description: 'افهم strict mode والاستثناءات المعتمدة والقاعدة التي تجعل الاحتياجات القابلة لإعادة الاستخدام جزءا من GDS.', href: '/general-design-system/governance', badge: 'القواعد' },
      ],
    },
    hu: {
      title: 'General Design System',
      eyebrow: 'Hivatalos referencia és élő demó',
      lead: 'Egy hely, ahol megértheted, telepítheted, tesztelheted és megbízhatóan használhatod a GDS-t. Ez az oldal egyszerre nyilvános termékoldal és élő runtime bizonyíték.',
      meta: ['Nyílt forráskód', 'npm-kész', 'Élő demók', `Élő verzió ${stableGdsVersion}`],
      whatTitle: 'Mi a GDS',
      whatDescription: 'A GDS egy irányított design system platform kiszámítható UI-szerződésekkel és közös runtime viselkedéssel.',
      whyTitle: 'Miért hasznos a GDS',
      whyDescription: 'A GDS azoknak a csapatoknak jó, akik kevesebb lokális döntést és erősebb hozzáférhetőséget szeretnének.',
      startTitle: 'Kezdés itt',
      startDescription: 'A leggyorsabb út attól függ, mire van most szükséged.',
      whatItems: [
        { id: 'what', title: 'Újrahasználható runtime contractok', description: 'Shellek, kártyák, action rendszerek, auth, embedek, feedback és detail felületek kanonikus primitive-ként érkeznek.' },
        { id: 'why', title: 'Gyorsabb út a következetességhez', description: 'A csapatok kész contractokat adoptálnak lokális layout, gomb és kártya újraépítés helyett.' },
        { id: 'proof', title: 'Ez az oldal az élő demó', description: 'A látogatók itt ellenőrizhetik a ténylegesen kiadott theme lane-eket, public patterneket és alkalmazásfelületeket.' },
      ],
      whyItems: [
        { id: 'predictable', title: 'Kiszámítható delivery', description: 'A stabil contractok csökkentik az egyeztetési terhet és auditálhatóvá teszik az implementációs döntéseket.' },
        { id: 'shared-quality', title: 'Közös minőségi mérce', description: 'Az akadálymentesség, üres/töltő/hiba állapotok és szemantikus műveletek újrahasználható felületeken keresztül működnek.' },
        { id: 'ops-clarity', title: 'Operatív tisztaság', description: 'A consumer csapatok manifestekkel, compliance toolinggal és publikált migration guidance-szal ellenőrzik az adoptálást.' },
        { id: 'public-trust', title: 'Nyilvános bizalom', description: 'A hivatalos oldal ugyanarra a rendszerre épül, amit ajánl, ezért valódi kiadott viselkedést mutat.' },
      ],
      links: [
        { id: 'patterns', title: 'Patternök böngészése', description: 'Nézd meg a dokumentált pattern inventoryt foundations, public, operations, data, access és feedback csoportok szerint.', href: '/general-design-system/patterns', badge: 'Pattern katalógus' },
        { id: 'coverage', title: 'Coverage matrix megnyitása', description: 'Kövesd a komponens és pattern paritást a dokumentáció és live runtime route-ok között.', href: '/general-design-system/coverage', badge: 'Paritás matrix' },
        { id: 'themes', title: 'Témák felfedezése', description: 'Teszteld a kiadott preseteket és a governed brand-theme generátort az élő theme laborban.', href: '/general-design-system/themes', badge: 'Theme explorer' },
        { id: 'install', title: 'GDS telepítése', description: 'Másold a valódi adoptáló útvonalak npm parancsait, provider setupját és verification contractját.', href: '/general-design-system/install', badge: 'npm' },
        { id: 'demos', title: 'Élő demók megnyitása', description: 'Ellenőrizd a shell, card, auth, action, food, playback és analytics runtime felületeket.', href: '/general-design-system/live-demos', badge: 'Élő demók' },
        { id: 'governance', title: 'Governance olvasása', description: 'Értsd meg a strict mode-ot, approved exceptionöket és a szabályt, hogy az újrahasználható igények a GDS-be tartoznak.', href: '/general-design-system/governance', badge: 'Szabályzat' },
      ],
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;
  return (
    <DocsPageShell
      title={i18n.title}
      eyebrow={i18n.eyebrow}
      lead={i18n.lead}
      meta={(
        <>
          {i18n.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </>
      )}
    >
      <ReferenceSection
        title={i18n.whatTitle}
        description={i18n.whatDescription}
      >
        <FeatureBand
          columns={3}
          items={[...i18n.whatItems]}
        />
      </ReferenceSection>

      <ReferenceSection
        title={i18n.whyTitle}
        description={i18n.whyDescription}
      >
        <FeatureBand
          columns={4}
          variant="compact"
          items={[...i18n.whyItems]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.startTitle} description={i18n.startDescription}>
        <ReferenceLinkGrid
          items={[...i18n.links]}
        />
      </ReferenceSection>

      <SiteFooter />
    </DocsPageShell>
  );
}

export function CoveragePage() {
  const statusCounts = patternRegistry.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.coverageStatus] = (acc[entry.coverageStatus] ?? 0) + 1;
    return acc;
  }, {});

  const rows = patternRegistry.map((entry) => ({
    id: entry.id,
    pattern: entry.title,
    family: entry.family,
    route: entry.route,
    status: entry.coverageStatus,
  }));

  return (
    <DocsPageShell
      title="Coverage Matrix"
      eyebrow="Pattern parity status"
      lead="This page is the runtime parity matrix between COMPONENTS_AND_PATTERNS.md and the official demo routes. Use it to see what is shipped, where it is shown, and what remains blocked."
    >
      <ReferenceSection title="Coverage summary" description="Status counts are generated from the shared pattern registry used by the docs routes.">
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'live-demo', title: 'Live demo', description: `${statusCounts['live-demo'] ?? 0} patterns are rendered in interactive routes.` },
            { id: 'static-reference', title: 'Static reference', description: `${statusCounts['static-reference'] ?? 0} patterns are documented without live runtime demos.` },
            { id: 'pending-primitive', title: 'Pending primitive', description: `${statusCounts['pending-primitive'] ?? 0} patterns still need package-level primitives.` },
            { id: 'blocked', title: 'Blocked', description: `${statusCounts.blocked ?? 0} patterns are blocked by known constraints or dependencies.` },
          ]}
        />
      </ReferenceSection>
      <ReferenceSection title="Pattern matrix" description="Every row points to the canonical family route where the pattern is represented.">
        <SimpleDataTable
          columns={[
            { key: 'pattern', header: 'Pattern' },
            { key: 'family', header: 'Family' },
            { key: 'status', header: 'Status' },
            { key: 'route', header: 'Route' },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}

export function ApiReferencePage() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'API Reference',
      eyebrow: 'Published package contracts',
      lead: 'Browse the shipped GDS API surface by package, runtime lane, export kind, accessibility notes, states, and verification contract.',
      summaryTitle: 'API coverage summary',
      summaryDescription: 'Counts are generated from the same registry that powers release verification.',
      tableTitle: 'Documented exports',
      tableDescription: 'Every row is a public contract. Use the import path shown here before building a product-local wrapper.',
      packageTitle: 'Package lanes',
      packageDescription: 'Choose the smallest package lane that matches your product surface and runtime needs.',
    },
    de: {
      title: 'API-Referenz',
      eyebrow: 'Veröffentlichte Package-Contracts',
      lead: 'Durchsuche die ausgelieferte GDS-API nach Package, Runtime-Lane, Export-Art, Accessibility-Hinweisen, Zuständen und Verifikationsvertrag.',
      summaryTitle: 'Zusammenfassung der API-Abdeckung',
      summaryDescription: 'Die Zählungen kommen aus derselben Registry, die die Release-Verifikation steuert.',
      tableTitle: 'Dokumentierte Exporte',
      tableDescription: 'Jede Zeile ist ein öffentlicher Contract. Nutze den Importpfad hier, bevor du einen lokalen Wrapper baust.',
      packageTitle: 'Package-Lanes',
      packageDescription: 'Wähle die kleinste Package-Lane, die zu Oberfläche und Runtime passt.',
    },
    fr: {
      title: 'Référence API',
      eyebrow: 'Contrats de packages publiés',
      lead: 'Parcourez l’API GDS livrée par package, lane runtime, type d’export, notes accessibilité, états et contrat de vérification.',
      summaryTitle: 'Résumé de couverture API',
      summaryDescription: 'Les compteurs viennent du même registre que celui utilisé par la vérification de release.',
      tableTitle: 'Exports documentés',
      tableDescription: 'Chaque ligne est un contrat public. Utilisez ce chemin d’import avant de créer un wrapper local.',
      packageTitle: 'Lanes de packages',
      packageDescription: 'Choisissez la plus petite lane package qui correspond à votre surface produit et runtime.',
    },
    it: {
      title: 'Riferimento API',
      eyebrow: 'Contratti package pubblicati',
      lead: 'Consulta la superficie API GDS per package, runtime lane, tipo di export, accessibilità, stati e verifiche.',
      summaryTitle: 'Riepilogo copertura API',
      summaryDescription: 'I conteggi derivano dal registro usato anche dalla verifica di release.',
      tableTitle: 'Export documentati',
      tableDescription: 'Ogni riga è un contratto pubblico. Usa questo import path prima di creare wrapper locali.',
      packageTitle: 'Lane dei package',
      packageDescription: 'Scegli la lane più piccola che corrisponde alla superficie prodotto e al runtime.',
    },
    ru: {
      title: 'Справочник API',
      eyebrow: 'Опубликованные контракты пакетов',
      lead: 'Просматривайте API GDS по пакету, runtime-lane, типу экспорта, доступности, состояниям и проверкам.',
      summaryTitle: 'Сводка покрытия API',
      summaryDescription: 'Счетчики берутся из того же реестра, который используется в release-проверке.',
      tableTitle: 'Документированные экспорты',
      tableDescription: 'Каждая строка — публичный контракт. Используйте этот import path до создания локального wrapper.',
      packageTitle: 'Линии пакетов',
      packageDescription: 'Выберите минимальный пакет, подходящий поверхности продукта и runtime.',
    },
    he: {
      title: 'רפרנס API',
      eyebrow: 'חוזי חבילות שפורסמו',
      lead: 'עיינו במשטח ה-API של GDS לפי חבילה, runtime lane, סוג export, נגישות, מצבים וחוזה אימות.',
      summaryTitle: 'סיכום כיסוי API',
      summaryDescription: 'הספירות מגיעות מאותה registry שמפעילה את אימות ה-release.',
      tableTitle: 'Exports מתועדים',
      tableDescription: 'כל שורה היא חוזה ציבורי. השתמשו ב-import path לפני יצירת wrapper מקומי.',
      packageTitle: 'מסלולי חבילות',
      packageDescription: 'בחרו את מסלול החבילה הקטן ביותר שמתאים למשטח ול-runtime.',
    },
    ar: {
      title: 'مرجع API',
      eyebrow: 'عقود الحزم المنشورة',
      lead: 'تصفح سطح API الخاص بـ GDS حسب الحزمة ومسار التشغيل ونوع التصدير وإرشادات الوصولية والحالات والتحقق.',
      summaryTitle: 'ملخص تغطية API',
      summaryDescription: 'تأتي الأرقام من السجل نفسه المستخدم في تحقق الإصدار.',
      tableTitle: 'التصديرات الموثقة',
      tableDescription: 'كل صف عقد عام. استخدم مسار الاستيراد هنا قبل بناء wrapper محلي.',
      packageTitle: 'مسارات الحزم',
      packageDescription: 'اختر أصغر مسار حزمة يناسب سطح المنتج واحتياج التشغيل.',
    },
    hu: {
      title: 'API referencia',
      eyebrow: 'Publikált csomagszerződések',
      lead: 'Böngészd a kiadott GDS API-felületet csomag, runtime lane, export típus, akadálymentesség, állapotok és verifikáció szerint.',
      summaryTitle: 'API lefedettségi összefoglaló',
      summaryDescription: 'A számok ugyanabból a registryből jönnek, amely a release ellenőrzést is hajtja.',
      tableTitle: 'Dokumentált exportok',
      tableDescription: 'Minden sor publikus contract. Ezt az import útvonalat használd lokális wrapper előtt.',
      packageTitle: 'Csomag lane-ek',
      packageDescription: 'Válaszd a legkisebb csomag lane-t, amely illik a termékfelülethez és runtime-hoz.',
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;
  const summary = getApiReferenceSummary();
  const rows = getApiReferenceEntries().map((entry) => ({
    id: `${entry.packageName}:${entry.exportName}`,
    exportName: entry.exportName,
    packageName: entry.packageName,
    kind: entry.exportKind,
    runtime: entry.runtimeLane,
    status: entry.status,
    importPath: entry.importPath,
  }));

  return (
    <DocsPageShell title={i18n.title} eyebrow={i18n.eyebrow} lead={i18n.lead}>
      <ReferenceSection title={i18n.summaryTitle} description={i18n.summaryDescription}>
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'exports', title: 'Exports', description: `${apiReferenceEntries.length} public API entries are documented.` },
            { id: 'live', title: 'Live demo', description: `${summary['live-demo'] ?? 0} entries have live route evidence.` },
            { id: 'support', title: 'Support API', description: `${summary['support-api'] ?? 0} entries are documented support contracts.` },
            { id: 'client', title: 'Client lane', description: `${summary.client ?? 0} entries require or allow client runtime.` },
          ]}
        />
      </ReferenceSection>
      <ReferenceSection title={i18n.packageTitle} description={i18n.packageDescription}>
        <ReferenceLinkGrid
          columns={2}
          items={apiReferencePackages.map((packageName) => ({
            id: packageName,
            title: packageName,
            description: `${summary[packageName] ?? 0} documented exports. Install this lane only when the package matches the product surface.`,
            href: '/general-design-system/api',
            badge: packageName.includes('admin') ? 'operator' : packageName.includes('theme') ? 'theme' : 'runtime',
          }))}
        />
      </ReferenceSection>
      <ReferenceSection title={i18n.tableTitle} description={i18n.tableDescription}>
        <SimpleDataTable
          columns={[
            { key: 'exportName', header: 'Export' },
            { key: 'packageName', header: 'Package' },
            { key: 'kind', header: 'Kind' },
            { key: 'runtime', header: 'Runtime' },
            { key: 'status', header: 'Docs' },
            { key: 'importPath', header: 'Import path' },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}

export function MaturityPage() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'Maturity Roadmap Delivered',
      eyebrow: 'Seven recommended capability groups',
      lead: 'The highest-value GDS maturity work is now organized as issue-backed, package-native delivery contracts with benefits, APIs, accessibility, observability, rollback, testing, and documentation evidence.',
      summaryTitle: 'Delivery summary',
      summaryDescription: 'This page is generated from the exported GDS maturity capability registry.',
      benefitsTitle: 'Product benefits',
      benefitsDescription: 'Use these rows to decide which package lane and contract should replace local UI work.',
      operationsTitle: 'Operational readiness',
      operationsDescription: 'Every capability defines runtime flow, UX states, accessibility, telemetry, retry, rollback, and test evidence.',
    },
    de: {
      title: 'Maturity-Roadmap geliefert',
      eyebrow: 'Sieben empfohlene Capability-Gruppen',
      lead: 'Die wertvollste GDS-Maturity-Arbeit ist jetzt als issue-gestützte, package-native Delivery-Contracts mit Nutzen, APIs, Accessibility, Observability, Rollback, Tests und Dokumentation organisiert.',
      summaryTitle: 'Delivery-Zusammenfassung',
      summaryDescription: 'Diese Seite kommt aus der exportierten GDS-Maturity-Capability-Registry.',
      benefitsTitle: 'Produktnutzen',
      benefitsDescription: 'Nutze diese Zeilen, um Package-Lane und Contract statt lokaler UI-Arbeit zu wählen.',
      operationsTitle: 'Operative Bereitschaft',
      operationsDescription: 'Jede Capability definiert Runtime Flow, UX-Zustände, Accessibility, Telemetrie, Retry, Rollback und Testnachweis.',
    },
    fr: {
      title: 'Feuille de route maturité livrée',
      eyebrow: 'Sept groupes de capacités recommandés',
      lead: 'Le travail de maturité GDS le plus utile est maintenant structuré en contrats package-native liés à des issues, avec bénéfices, APIs, accessibilité, observabilité, rollback, tests et documentation.',
      summaryTitle: 'Résumé de livraison',
      summaryDescription: 'Cette page est générée depuis le registre exporté des capacités de maturité GDS.',
      benefitsTitle: 'Bénéfices produit',
      benefitsDescription: 'Utilisez ces lignes pour choisir la lane package et le contrat qui remplacent le travail UI local.',
      operationsTitle: 'Préparation opérationnelle',
      operationsDescription: 'Chaque capacité définit flow runtime, états UX, accessibilité, télémétrie, retry, rollback et preuves de test.',
    },
    it: {
      title: 'Roadmap di maturità consegnata',
      eyebrow: 'Sette gruppi di capability consigliati',
      lead: 'Il lavoro GDS a valore più alto è ora organizzato come contratti package-native collegati a issue, con benefici, API, accessibilità, osservabilità, rollback, test e documentazione.',
      summaryTitle: 'Riepilogo delivery',
      summaryDescription: 'Questa pagina è generata dal registro esportato delle capability di maturità GDS.',
      benefitsTitle: 'Benefici prodotto',
      benefitsDescription: 'Usa queste righe per scegliere package lane e contratto al posto di UI locale.',
      operationsTitle: 'Prontezza operativa',
      operationsDescription: 'Ogni capability definisce runtime flow, stati UX, accessibilità, telemetria, retry, rollback e prove di test.',
    },
    ru: {
      title: 'Дорожная карта зрелости доставлена',
      eyebrow: 'Семь рекомендуемых групп возможностей',
      lead: 'Самая ценная работа по зрелости GDS теперь оформлена как package-native контракты с issue, пользой, API, доступностью, observability, rollback, тестами и документацией.',
      summaryTitle: 'Сводка поставки',
      summaryDescription: 'Эта страница генерируется из экспортированного реестра maturity capabilities GDS.',
      benefitsTitle: 'Польза для продукта',
      benefitsDescription: 'Используйте строки, чтобы выбрать package lane и контракт вместо локальной UI-разработки.',
      operationsTitle: 'Операционная готовность',
      operationsDescription: 'Каждая capability определяет runtime flow, UX-состояния, доступность, телеметрию, retry, rollback и тестовые доказательства.',
    },
    he: {
      title: 'מפת בשלות נמסרה',
      eyebrow: 'שבע קבוצות capability מומלצות',
      lead: 'עבודת הבשלות החשובה ביותר של GDS מאורגנת עכשיו כחוזים package-native עם issues, תועלת, APIs, נגישות, observability, rollback, בדיקות ותיעוד.',
      summaryTitle: 'סיכום מסירה',
      summaryDescription: 'העמוד נוצר מתוך registry מיוצא של יכולות בשלות GDS.',
      benefitsTitle: 'תועלת מוצרית',
      benefitsDescription: 'השתמשו בשורות כדי לבחור package lane וחוזה במקום UI מקומי.',
      operationsTitle: 'מוכנות תפעולית',
      operationsDescription: 'כל capability מגדירה runtime flow, מצבי UX, נגישות, telemetry, retry, rollback והוכחות בדיקה.',
    },
    ar: {
      title: 'تم تسليم خارطة النضج',
      eyebrow: 'سبع مجموعات قدرات موصى بها',
      lead: 'أصبح عمل نضج GDS الأعلى قيمة منظما كعقود package-native مرتبطة بقضايا، مع فوائد وواجهات API ووصولية ومراقبة واسترجاع واختبارات وتوثيق.',
      summaryTitle: 'ملخص التسليم',
      summaryDescription: 'تولد هذه الصفحة من سجل قدرات النضج المصدر من GDS.',
      benefitsTitle: 'فوائد المنتج',
      benefitsDescription: 'استخدم هذه الصفوف لاختيار مسار الحزمة والعقد بدلا من عمل UI محلي.',
      operationsTitle: 'الجاهزية التشغيلية',
      operationsDescription: 'كل قدرة تحدد تدفق التشغيل وحالات UX والوصولية والتليمترية وإعادة المحاولة والاسترجاع ودليل الاختبار.',
    },
    hu: {
      title: 'Maturity roadmap leszállítva',
      eyebrow: 'Hét ajánlott capability csoport',
      lead: 'A legnagyobb értékű GDS maturity munka most issue-alapú, package-native delivery contractként érhető el előnyökkel, API-kkal, akadálymentességgel, observabilityvel, rollbackkel, tesztekkel és dokumentációval.',
      summaryTitle: 'Delivery összefoglaló',
      summaryDescription: 'Ez az oldal az exportált GDS maturity capability registryből generálódik.',
      benefitsTitle: 'Termék előnyök',
      benefitsDescription: 'Ezekkel a sorokkal válaszd ki, melyik package lane és contract váltja a lokális UI munkát.',
      operationsTitle: 'Operatív felkészültség',
      operationsDescription: 'Minden capability definiál runtime flow-t, UX állapotokat, akadálymentességet, telemetriát, retryt, rollbacket és teszt bizonyítékot.',
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;
  const capabilities = getGdsRecommendedMaturityCapabilities();
  const summary = getGdsMaturitySummary();

  return (
    <DocsPageShell title={i18n.title} eyebrow={i18n.eyebrow} lead={i18n.lead}>
      <ReferenceSection title={i18n.summaryTitle} description={i18n.summaryDescription}>
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'total', title: 'Capabilities', description: `${summary.total} recommended delivery groups are issue-backed and exported.` },
            { id: 'production', title: 'Production ready', description: `${summary['production-ready']} groups ship package-native production contracts.` },
            { id: 'tooling', title: 'Tooling', description: `${summary['adoption-tooling']} group owns adoption governance and migration evidence.` },
            { id: 'ops', title: 'Operations', description: `${summary['operational-contract']} groups define operational release contracts.` },
          ]}
        />
      </ReferenceSection>
      <ReferenceSection title={i18n.benefitsTitle} description={i18n.benefitsDescription}>
        <SimpleDataTable
          columns={[
            { key: 'order', header: 'Order' },
            { key: 'issue', header: 'Issue' },
            { key: 'title', header: 'Capability' },
            { key: 'benefit', header: 'Benefit' },
            { key: 'packages', header: 'Packages' },
            { key: 'contracts', header: 'Primary contracts' },
          ]}
          rows={capabilities.map((capability) => ({
            id: capability.id,
            order: String(capability.priorityOrder),
            issue: `#${capability.issueNumber}`,
            title: capability.title,
            benefit: capability.benefit,
            packages: capability.packageLanes.join(', '),
            contracts: capability.primaryContracts.join(', '),
          }))}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      <ReferenceSection title={i18n.operationsTitle} description={i18n.operationsDescription}>
        {capabilities.map((capability) => (
          <StateBlock
            key={capability.id}
            variant={capability.status === 'adoption-tooling' ? 'info' : 'success'}
            title={`${capability.priorityOrder}. ${capability.title}`}
            description={`States: ${capability.uxStates.join(', ')}. Observability: ${capability.observability.join(', ')}. Rollback: ${capability.rollback}`}
            compact
          />
        ))}
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}

export function UseCasesPage() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'Use Cases',
      eyebrow: 'Product-owner adoption guide',
      lead: 'Map product needs to the correct GDS package lane, runtime contract, accessibility obligation, and operational verification command.',
      guideTitle: 'Decision guide',
      guideDescription: 'Use this before opening a new feature request. If the need matches a shipped contract, adopt that contract instead of building locally.',
    },
    de: {
      title: 'Use Cases',
      eyebrow: 'Adoptionsleitfaden für Product Owner',
      lead: 'Ordne Produktbedarf der richtigen GDS-Package-Lane, dem Runtime-Contract, der Accessibility-Pflicht und dem operativen Check zu.',
      guideTitle: 'Entscheidungsleitfaden',
      guideDescription: 'Nutze dies vor einem Feature Request. Wenn der Bedarf zu einem ausgelieferten Contract passt, adoptiere ihn statt lokal zu bauen.',
    },
    fr: {
      title: 'Cas d’usage',
      eyebrow: 'Guide adoption product owner',
      lead: 'Reliez un besoin produit au bon package GDS, au contrat runtime, aux obligations accessibilité et aux commandes de vérification.',
      guideTitle: 'Guide de décision',
      guideDescription: 'À utiliser avant une demande de feature. Si le besoin correspond à un contrat livré, adoptez-le plutôt que de construire localement.',
    },
    it: {
      title: 'Casi d’uso',
      eyebrow: 'Guida di adozione per product owner',
      lead: 'Collega il bisogno prodotto al package GDS corretto, al contratto runtime, all’accessibilità e ai controlli operativi.',
      guideTitle: 'Guida decisionale',
      guideDescription: 'Usala prima di aprire una richiesta. Se il bisogno corrisponde a un contratto già rilasciato, adottalo.',
    },
    ru: {
      title: 'Сценарии использования',
      eyebrow: 'Гайд внедрения для product owner',
      lead: 'Свяжите потребность продукта с пакетом GDS, runtime-контрактом, доступностью и операционными проверками.',
      guideTitle: 'Гайд принятия решения',
      guideDescription: 'Используйте перед запросом новой функции. Если потребность покрыта контрактом, внедряйте его.',
    },
    he: {
      title: 'Use Cases',
      eyebrow: 'מדריך אימוץ ל-product owner',
      lead: 'חברו צורך מוצרי למסלול חבילת GDS, חוזה runtime, חובת נגישות ובדיקות תפעוליות.',
      guideTitle: 'מדריך החלטה',
      guideDescription: 'השתמשו בזה לפני פתיחת בקשת feature. אם הצורך מתאים לחוזה קיים, אמצו אותו.',
    },
    ar: {
      title: 'حالات الاستخدام',
      eyebrow: 'دليل اعتماد لمالك المنتج',
      lead: 'اربط احتياج المنتج بمسار حزمة GDS الصحيح وعقد التشغيل ومتطلبات الوصولية وأوامر التحقق.',
      guideTitle: 'دليل القرار',
      guideDescription: 'استخدمه قبل طلب ميزة جديدة. إذا كان الاحتياج مغطى بعقد منشور، اعتمده بدل بناء محلي.',
    },
    hu: {
      title: 'Use case-ek',
      eyebrow: 'Product owner adoptálási útmutató',
      lead: 'Kösd a termékigényt a megfelelő GDS csomag lane-hez, runtime contracthoz, akadálymentességi kötelezettséghez és operatív ellenőrzéshez.',
      guideTitle: 'Döntési útmutató',
      guideDescription: 'Használd feature request előtt. Ha az igény illik egy kiadott contracthoz, azt adoptáld lokális építés helyett.',
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <DocsPageShell title={i18n.title} eyebrow={i18n.eyebrow} lead={i18n.lead}>
      <ReferenceSection title={i18n.guideTitle} description={i18n.guideDescription}>
        <FeatureBand
          columns={2}
          items={productUseCases.map((useCase) => ({
            id: useCase.id,
            title: useCase.title,
            description: `${useCase.decisionRule} Primary contracts: ${useCase.primaryContracts.join(', ')}.`,
          }))}
        />
      </ReferenceSection>
      <ReferenceSection title="Operational contract" description="Product owners should confirm the delivery lane, risk, checks, and accessibility obligation before approving local UI work.">
        <SimpleDataTable
          columns={[
            { key: 'title', header: 'Use case' },
            { key: 'audience', header: 'Audience' },
            { key: 'risk', header: 'Risk' },
            { key: 'packages', header: 'Packages' },
            { key: 'checks', header: 'Checks' },
          ]}
          rows={productUseCases.map((useCase) => ({
            id: useCase.id,
            title: useCase.title,
            audience: useCase.audience,
            risk: useCase.risk,
            packages: useCase.recommendedPackages.join(', '),
            checks: useCase.operationalChecks.join(' | '),
          }))}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      <ReferenceSection title="Accessibility and recovery" description="Every recommended lane carries explicit accessibility and operational behavior.">
        {productUseCases.map((useCase) => (
          <StateBlock
            key={useCase.id}
            variant={useCase.risk === 'high' ? 'error' : 'info'}
            title={useCase.title}
            description={`${useCase.accessibility} Recovery notes: ${useCase.deliveryNotes.join(' ')}`}
            compact
          />
        ))}
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}

export function InstallPage() {
  const { locale } = useGdsTranslation();
  const installCopy = {
    en: {
      title: 'Install GDS',
      eyebrow: '3.4.1 public install path',
      lead: `Use the umbrella npm package for the default public entry point, satisfy the shared Mantine peer line, wire the provider once, and align theme ownership with the canonical ${targetGdsVersion} governance rules. Current stable is ${stableGdsVersion} after publish verification.`,
      installSectionTitle: '1. Install the packages',
      installSectionDescription: 'The open-source public entry point is the umbrella package. Granular packages stay available for teams that intentionally separate runtime lanes.',
      installCodeTitle: 'Install umbrella package',
      granularCodeTitle: 'Install granular packages',
      peerCodeTitle: 'Install peer dependencies',
      upgradeSectionTitle: `2. Upgrade existing clients to ${targetGdsVersion}`,
      upgradeSectionDescription: 'If your app already uses GDS, move the package line and governance tooling together.',
      upgradeCodeTitle: 'Upgrade commands',
      providerSectionTitle: '3. Add the provider',
      providerSectionDescription: 'All runtime surfaces assume one shared provider near the app root and one framework-native color-scheme bootstrap.',
      nextLayoutTitle: 'Next.js App Router layout',
      providerCodeTitle: 'Next.js provider setup',
      viteBootstrapTitle: 'Vite / SPA bootstrap',
      adoptSectionTitle: '4. Adopt the shipped contracts',
      adoptSectionDescription: 'Use the live demo and pattern catalog before inventing product-local wrappers.',
      enforceSectionTitle: '5. Enforce the adoption contract',
      enforceSectionDescription: 'Treat your app as a real consumer with manifest-driven compliance.',
      strictManifestTitle: 'Strict adoption manifest',
      themeManifestTitle: 'Theme-governance manifest fields',
      verificationTitle: 'Verification contract',
      recoverySectionTitle: '6. Failure and recovery states',
      recoverySectionDescription: 'Handle peer conflicts, npm propagation, and compliance failures explicitly. Do not hide retries or continue with a silent partial install.',
      recoveryCodeTitle: 'Troubleshooting commands',
      fallbackCodeTitle: 'Temporary release-asset fallback',
      clientSectionTitle: 'Client update prompt',
      clientSectionDescription: 'Use this exact text when you notify every adopter about the upgrade and enforcement details.',
      clientCodeTitle: 'Reusable client rollout message',
    },
    de: {
      title: 'GDS installieren',
      eyebrow: 'Öffentlicher 3.4.1-Installationspfad',
      lead: `Verwende das Umbrella-npm-Paket als Standard-Einstieg, erfülle die gemeinsame Mantine-Peer-Linie, binde den Provider einmal ein und richte Theme-Ownership nach ${targetGdsVersion} aus. Aktuell stabil ist ${stableGdsVersion} nach der Publish-Verifikation.`,
      installSectionTitle: '1. Pakete installieren',
      installSectionDescription: 'Der öffentliche Open-Source-Pfad nutzt das Umbrella-Paket. Granulare Pakete bleiben für bewusst getrennte Runtime-Lanes verfügbar.',
      installCodeTitle: 'Umbrella-Paket installieren',
      granularCodeTitle: 'Granulare Pakete installieren',
      peerCodeTitle: 'Peer-Abhängigkeiten installieren',
      upgradeSectionTitle: `2. Bestehende Clients auf ${targetGdsVersion} aktualisieren`,
      upgradeSectionDescription: 'Wenn eure App GDS bereits nutzt, aktualisiert Paketlinie und Governance-Tooling gemeinsam.',
      upgradeCodeTitle: 'Update-Befehle',
      providerSectionTitle: '3. Provider einbinden',
      providerSectionDescription: 'Alle Runtime-Flächen erwarten einen gemeinsamen Provider nahe der App-Wurzel und ein framework-natives Color-Scheme-Bootstrap.',
      nextLayoutTitle: 'Next.js App-Router-Layout',
      providerCodeTitle: 'Next.js Provider-Setup',
      viteBootstrapTitle: 'Vite / SPA Bootstrap',
      adoptSectionTitle: '4. Ausgelieferte Contracts übernehmen',
      adoptSectionDescription: 'Nutzt Live-Demos und Pattern-Katalog, bevor ihr lokale Wrapper erfindet.',
      enforceSectionTitle: '5. Adoptionsvertrag erzwingen',
      enforceSectionDescription: 'Behandle eure App als echten Consumer mit manifest-gesteuerter Compliance.',
      strictManifestTitle: 'Striktes Adoptions-Manifest',
      themeManifestTitle: 'Manifest-Felder für Theme-Governance',
      verificationTitle: 'Verifikationsvertrag',
      recoverySectionTitle: '6. Fehler- und Recovery-Zustände',
      recoverySectionDescription: 'Peer-Konflikte, npm-Propagation und Compliance-Fehler müssen explizit behandelt werden.',
      recoveryCodeTitle: 'Troubleshooting-Befehle',
      fallbackCodeTitle: 'Temporärer Release-Asset-Fallback',
      clientSectionTitle: 'Client-Update-Vorlage',
      clientSectionDescription: 'Nutze genau diesen Text, wenn ihr alle Adopter über Upgrade und Enforcement informiert.',
      clientCodeTitle: 'Wiederverwendbare Rollout-Nachricht',
    },
    fr: {
      title: 'Installer GDS',
      eyebrow: 'Parcours d’installation public 3.4.1',
      lead: `Utilisez le package npm umbrella, respectez la ligne de dépendances pair Mantine, configurez le provider une seule fois et alignez la gouvernance de thème sur ${targetGdsVersion}. La version stable est ${stableGdsVersion} après vérification de publication.`,
      installSectionTitle: '1. Installer les packages',
      installSectionDescription: 'Le point d’entrée open source public est le package umbrella. Les packages granulaires restent disponibles pour les lanes runtime séparées.',
      installCodeTitle: 'Installer le package umbrella',
      granularCodeTitle: 'Installer les packages granulaires',
      peerCodeTitle: 'Installer les dépendances pair',
      upgradeSectionTitle: `2. Mettre à jour les clients existants vers ${targetGdsVersion}`,
      upgradeSectionDescription: 'Si votre application utilise déjà GDS, mettez à jour la ligne de packages et les outils de gouvernance ensemble.',
      upgradeCodeTitle: 'Commandes de mise à jour',
      providerSectionTitle: '3. Ajouter le provider',
      providerSectionDescription: 'Toutes les surfaces runtime supposent un provider partagé proche de la racine et un bootstrap de color scheme natif au framework.',
      nextLayoutTitle: 'Layout Next.js App Router',
      providerCodeTitle: 'Configuration du provider Next.js',
      viteBootstrapTitle: 'Bootstrap Vite / SPA',
      adoptSectionTitle: '4. Adopter les contrats livrés',
      adoptSectionDescription: 'Utilisez la démo live et le catalogue de patterns avant d’inventer des wrappers locaux.',
      enforceSectionTitle: '5. Appliquer le contrat d’adoption',
      enforceSectionDescription: 'Traitez votre application comme un vrai consumer avec une conformité pilotée par manifeste.',
      strictManifestTitle: 'Manifeste d’adoption strict',
      themeManifestTitle: 'Champs de manifeste pour la gouvernance de thème',
      verificationTitle: 'Contrat de vérification',
      recoverySectionTitle: '6. États d’échec et de reprise',
      recoverySectionDescription: 'Traitez explicitement les conflits peer, la propagation npm et les échecs de conformité.',
      recoveryCodeTitle: 'Commandes de diagnostic',
      fallbackCodeTitle: 'Fallback temporaire via release assets',
      clientSectionTitle: 'Modèle de mise à jour client',
      clientSectionDescription: 'Utilisez exactement ce texte lorsque vous informez chaque équipe adopter de la mise à jour et de l’enforcement.',
      clientCodeTitle: 'Message de déploiement réutilisable',
    },
    it: {
      title: 'Installare GDS',
      eyebrow: 'Percorso di installazione pubblico',
      lead: 'Usa il pacchetto npm umbrella come punto di ingresso pubblico predefinito, soddisfa la linea peer condivisa di Mantine, configura il provider una sola volta e allinea la governance del tema alle regole canoniche `3.4.1`.',
      installSectionTitle: '1. Installa i pacchetti',
      installSectionDescription: 'Il punto di ingresso pubblico open source è il pacchetto umbrella.',
      installCodeTitle: 'Installa i pacchetti GDS',
      granularCodeTitle: 'Installa pacchetti granulari',
      peerCodeTitle: 'Installa le dipendenze peer',
      upgradeSectionTitle: '2. Aggiorna i client esistenti alla 3.4.1',
      upgradeSectionDescription: 'Se la tua app usa già GDS, aggiorna insieme linea pacchetti e tooling di governance.',
      upgradeCodeTitle: 'Comandi di aggiornamento',
      providerSectionTitle: '3. Aggiungi il provider',
      providerSectionDescription: 'Tutte le superfici runtime assumono un provider condiviso vicino alla root dell’app.',
      nextLayoutTitle: 'Layout Next.js App Router',
      providerCodeTitle: 'Setup provider',
      viteBootstrapTitle: 'Bootstrap Vite / SPA',
      adoptSectionTitle: '4. Adotta i contratti rilasciati',
      adoptSectionDescription: 'Usa live demo e catalogo pattern prima di introdurre wrapper locali.',
      enforceSectionTitle: '5. Applica il contratto di adozione',
      enforceSectionDescription: 'Tratta la tua app come consumer reale con compliance guidata da manifest.',
      strictManifestTitle: 'Manifest di adozione strict',
      themeManifestTitle: 'Campi manifest per governance del tema',
      verificationTitle: 'Contratto di verifica',
      recoverySectionTitle: '6. Stati di errore e recovery',
      recoverySectionDescription: 'Gestisci conflitti peer, propagazione npm e fallimenti compliance in modo esplicito.',
      recoveryCodeTitle: 'Comandi di troubleshooting',
      fallbackCodeTitle: 'Fallback temporaneo con release asset',
      clientSectionTitle: 'Prompt aggiornamento client',
      clientSectionDescription: 'Usa questo testo quando notifichi tutti gli adopter su upgrade ed enforcement.',
      clientCodeTitle: 'Messaggio riutilizzabile di rollout client',
    },
    ru: {
      title: 'Установка GDS',
      eyebrow: 'Публичный путь установки',
      lead: 'Используйте umbrella npm-пакет как основной публичный вход, соблюдайте общую peer-линейку Mantine, подключите provider один раз и выровняйте владение темой по каноническим правилам `3.4.1`.',
      installSectionTitle: '1. Установите пакеты',
      installSectionDescription: 'Публичная open-source точка входа — umbrella пакет.',
      installCodeTitle: 'Установить пакеты GDS',
      granularCodeTitle: 'Установить granular пакеты',
      peerCodeTitle: 'Установить peer-зависимости',
      upgradeSectionTitle: '2. Обновите существующие клиенты до 3.4.1',
      upgradeSectionDescription: 'Если приложение уже использует GDS, обновляйте линию пакетов и governance tooling вместе.',
      upgradeCodeTitle: 'Команды обновления',
      providerSectionTitle: '3. Подключите provider',
      providerSectionDescription: 'Все runtime-поверхности предполагают один общий provider у корня приложения.',
      nextLayoutTitle: 'Layout Next.js App Router',
      providerCodeTitle: 'Настройка provider',
      viteBootstrapTitle: 'Bootstrap Vite / SPA',
      adoptSectionTitle: '4. Примите поставляемые контракты',
      adoptSectionDescription: 'Используйте live demo и каталог паттернов до создания локальных оберток.',
      enforceSectionTitle: '5. Включите контракт внедрения',
      enforceSectionDescription: 'Считайте приложение реальным consumer с manifest-driven compliance.',
      strictManifestTitle: 'Строгий манифест внедрения',
      themeManifestTitle: 'Поля манифеста theme-governance',
      verificationTitle: 'Контракт проверки',
      recoverySectionTitle: '6. Состояния ошибок и восстановления',
      recoverySectionDescription: 'Явно обрабатывайте peer-конфликты, npm propagation и ошибки compliance.',
      recoveryCodeTitle: 'Команды диагностики',
      fallbackCodeTitle: 'Временный fallback через release assets',
      clientSectionTitle: 'Шаблон обновления клиента',
      clientSectionDescription: 'Используйте этот текст при уведомлении всех adopter-команд об обновлении.',
      clientCodeTitle: 'Переиспользуемое сообщение rollout для клиентов',
    },
    he: {
      title: 'התקנת GDS',
      eyebrow: 'מסלול התקנה ציבורי',
      lead: 'השתמשו בחבילת npm umbrella כנקודת הכניסה הציבורית, השלימו את קו ה-peer של Mantine, הגדירו provider פעם אחת ויישרו את בעלות התמה לכללי `3.4.1` הקנוניים.',
      installSectionTitle: '1. התקנת החבילות',
      installSectionDescription: 'נקודת הכניסה הציבורית בקוד פתוח היא חבילת ה-umbrella.',
      installCodeTitle: 'התקנת חבילות GDS',
      granularCodeTitle: 'התקנת חבילות granular',
      peerCodeTitle: 'התקנת תלויות peer',
      upgradeSectionTitle: '2. עדכון לקוחות קיימים ל-3.4.1',
      upgradeSectionDescription: 'אם האפליקציה כבר משתמשת ב-GDS, עדכנו יחד את קו החבילות וכלי הממשל.',
      upgradeCodeTitle: 'פקודות עדכון',
      providerSectionTitle: '3. הוספת provider',
      providerSectionDescription: 'כל משטחי ה-runtime מניחים provider משותף אחד סמוך לשורש האפליקציה.',
      nextLayoutTitle: 'Layout Next.js App Router',
      providerCodeTitle: 'הגדרת provider',
      viteBootstrapTitle: 'Bootstrap Vite / SPA',
      adoptSectionTitle: '4. אימוץ חוזים רשמיים',
      adoptSectionDescription: 'השתמשו בדמו החי ובקטלוג התבניות לפני יצירת עטיפות מקומיות.',
      enforceSectionTitle: '5. אכיפת חוזה האימוץ',
      enforceSectionDescription: 'התייחסו לאפליקציה כ-consumer אמיתי עם תאימות מונחית manifest.',
      strictManifestTitle: 'Manifest אימוץ מחמיר',
      themeManifestTitle: 'שדות manifest לממשל תמה',
      verificationTitle: 'חוזה אימות',
      recoverySectionTitle: '6. מצבי כשל ושחזור',
      recoverySectionDescription: 'טפלו במפורש בקונפליקטי peer, propagation של npm וכשלי compliance.',
      recoveryCodeTitle: 'פקודות troubleshooting',
      fallbackCodeTitle: 'Fallback זמני דרך release assets',
      clientSectionTitle: 'תבנית עדכון ללקוחות',
      clientSectionDescription: 'השתמשו בטקסט הזה בעת עדכון כל הצוותים המאמצים על השדרוג והאכיפה.',
      clientCodeTitle: 'הודעת rollout לשימוש חוזר ללקוחות',
    },
    ar: {
      title: 'تثبيت GDS',
      eyebrow: 'مسار التثبيت العام',
      lead: 'استخدم حزمة npm الشاملة كنقطة الدخول العامة الافتراضية، ثم التزم بخط peer الخاص بـ Mantine، واضبط المزود مرة واحدة، ووافق حوكمة الثيم مع قواعد `3.4.1` القياسية.',
      installSectionTitle: '1. تثبيت الحزم',
      installSectionDescription: 'نقطة الدخول العامة مفتوحة المصدر هي الحزمة الشاملة.',
      installCodeTitle: 'تثبيت حزم GDS',
      granularCodeTitle: 'تثبيت الحزم granular',
      peerCodeTitle: 'تثبيت تبعيات peer',
      upgradeSectionTitle: '2. تحديث العملاء الحاليين إلى 3.4.1',
      upgradeSectionDescription: 'إذا كان تطبيقك يستخدم GDS بالفعل، حدّث خط الحزم وأدوات الحوكمة معًا.',
      upgradeCodeTitle: 'أوامر التحديث',
      providerSectionTitle: '3. إضافة المزود',
      providerSectionDescription: 'كل أسطح التشغيل تفترض وجود مزود مشترك واحد قريب من جذر التطبيق.',
      nextLayoutTitle: 'Layout Next.js App Router',
      providerCodeTitle: 'إعداد المزود',
      viteBootstrapTitle: 'Bootstrap Vite / SPA',
      adoptSectionTitle: '4. اعتماد العقود المُصدَّرة',
      adoptSectionDescription: 'استخدم العرض الحي وكتالوج الأنماط قبل اختراع أغلفة محلية.',
      enforceSectionTitle: '5. فرض عقد الاعتماد',
      enforceSectionDescription: 'تعامل مع تطبيقك كمستهلك حقيقي مع امتثال مدفوع بالـ manifest.',
      strictManifestTitle: 'Manifest اعتماد صارم',
      themeManifestTitle: 'حقول Manifest لحوكمة الثيم',
      verificationTitle: 'عقد التحقق',
      recoverySectionTitle: '6. حالات الفشل والاستعادة',
      recoverySectionDescription: 'تعامل صراحة مع تعارضات peer وانتشار npm وفشل الامتثال.',
      recoveryCodeTitle: 'أوامر التشخيص',
      fallbackCodeTitle: 'Fallback مؤقت عبر release assets',
      clientSectionTitle: 'قالب تحديث العملاء',
      clientSectionDescription: 'استخدم هذا النص عند إخطار جميع الفرق المتبنية بالتحديث ومتطلبات الإنفاذ.',
      clientCodeTitle: 'رسالة طرح قابلة لإعادة الاستخدام للعملاء',
    },
    hu: {
      title: 'GDS telepítése',
      eyebrow: 'Nyilvános telepítési útvonal',
      lead: 'Használd az umbrella npm csomagot alapértelmezett nyilvános belépési pontként, teljesítsd a közös Mantine peer sort, kösd be egyszer a providert, és igazítsd a téma-tulajdonlást a kanonikus `3.4.1` szabályokhoz.',
      installSectionTitle: '1. Csomagok telepítése',
      installSectionDescription: 'A nyílt forrású nyilvános belépési pont az umbrella csomag.',
      installCodeTitle: 'GDS csomagok telepítése',
      granularCodeTitle: 'Granuláris csomagok telepítése',
      peerCodeTitle: 'Peer függőségek telepítése',
      upgradeSectionTitle: '2. Meglévő kliensek frissítése 3.4.1-re',
      upgradeSectionDescription: 'Ha az app már használ GDS-t, együtt frissítsd a csomagsort és a governance eszközöket.',
      upgradeCodeTitle: 'Frissítési parancsok',
      providerSectionTitle: '3. Provider hozzáadása',
      providerSectionDescription: 'Minden runtime felület egy közös providerre épít az alkalmazás gyökeréhez közel.',
      nextLayoutTitle: 'Next.js App Router layout',
      providerCodeTitle: 'Provider beállítás',
      viteBootstrapTitle: 'Vite / SPA bootstrap',
      adoptSectionTitle: '4. Szállított szerződések átvétele',
      adoptSectionDescription: 'Használd az élő demót és a mintakatalógust, mielőtt helyi wrappert írnál.',
      enforceSectionTitle: '5. Az átvételi szerződés kikényszerítése',
      enforceSectionDescription: 'Kezeld az appot valódi consumerként manifest-alapú megfelelőséggel.',
      strictManifestTitle: 'Szigorú átvételi manifest',
      themeManifestTitle: 'Téma-governance manifest mezők',
      verificationTitle: 'Ellenőrzési szerződés',
      recoverySectionTitle: '6. Hibák és helyreállítás',
      recoverySectionDescription: 'Kezeld explicit módon a peer konfliktusokat, npm propagációt és compliance hibákat.',
      recoveryCodeTitle: 'Hibaelhárítási parancsok',
      fallbackCodeTitle: 'Ideiglenes release-asset fallback',
      clientSectionTitle: 'Ügyfélfrissítési sablon',
      clientSectionDescription: 'Ezt a szöveget használd, amikor minden adoptáló csapatot értesítesz a frissítésről és enforcementről.',
      clientCodeTitle: 'Újrahasznosítható ügyfél rollout üzenet',
    },
  } as const;

  const copy = installCopy[locale as keyof typeof installCopy] ?? installCopy.en;

  return (
    <DocsPageShell
      title={copy.title}
      eyebrow={copy.eyebrow}
      lead={copy.lead}
    >
      <ReferenceSection title={copy.installSectionTitle} description={copy.installSectionDescription}>
        <DocsCodeBlock code={installCode} language="bash" title={copy.installCodeTitle} />
        <DocsCodeBlock code={granularInstallCode} language="bash" title={copy.granularCodeTitle} />
        <DocsCodeBlock code={peerCode} language="bash" title={copy.peerCodeTitle} />
      </ReferenceSection>

      <ReferenceSection title={copy.upgradeSectionTitle} description={copy.upgradeSectionDescription}>
        <DocsCodeBlock code={updateCode} language="bash" title={copy.upgradeCodeTitle} />
        <FeatureBand
          columns={3}
          variant="compact"
          items={[
            {
              id: 'low-risk',
              title: 'Low-risk for shipped lanes',
              description: 'If you already use a shipped GDS theme export directly, this should be a low-risk update.',
            },
            {
              id: 'theme-shift',
              title: 'Theme governance changed',
              description: 'The main change is governance and enforcement. This is not a visual redesign of the canonical themes.',
            },
            {
              id: 'compliance-shift',
              title: 'Compliance is stronger',
              description: 'Repos that adopt the new manifest fields can now detect non-canonical theme ownership automatically.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={copy.providerSectionTitle} description={copy.providerSectionDescription}>
        <DocsCodeBlock code={nextLayoutCode} language="tsx" title={copy.nextLayoutTitle} />
        <DocsCodeBlock code={providerCode} language="tsx" title={copy.providerCodeTitle} />
        <DocsCodeBlock code={viteBootstrapCode} language="tsx" title={copy.viteBootstrapTitle} />
      </ReferenceSection>

      <ReferenceSection title={copy.adoptSectionTitle} description={copy.adoptSectionDescription}>
        <ReferenceLinkGrid
          items={[
            {
              id: 'shell',
              title: 'DiscoveryShell and navigation',
              description: 'Use shipped shell contracts instead of local AppShell wrappers.',
              href: '/general-design-system/live-demos/layouts',
            },
            {
              id: 'cards',
              title: 'Listing, food, map, and share surfaces',
              description: 'Use the public discovery and listing contracts before creating custom cards.',
              href: '/general-design-system/live-demos/surfaces',
            },
            {
              id: 'actions',
              title: 'Semantic actions and auth',
              description: 'Use ActionBar, SemanticButton, provider identity actions, and ShareButtonGroup as the governed interaction path.',
              href: '/general-design-system/live-demos/semantics',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={copy.enforceSectionTitle} description={copy.enforceSectionDescription}>
        <DocsCodeBlock code={complianceCode} language="json" title={copy.strictManifestTitle} />
        <DocsCodeBlock code={themeGovernanceCode} language="json" title={copy.themeManifestTitle} />
        <DocsCodeBlock code={verificationCode} language="bash" title={copy.verificationTitle} />
      </ReferenceSection>

      <ReferenceSection title={copy.recoverySectionTitle} description={copy.recoverySectionDescription}>
        <DocsCodeBlock code={failureRecoveryCode} language="bash" title={copy.recoveryCodeTitle} />
        <DocsCodeBlock code={fallbackInstallCode} language="bash" title={copy.fallbackCodeTitle} />
      </ReferenceSection>

      <ReferenceSection title={copy.clientSectionTitle} description={copy.clientSectionDescription}>
        <DocsCodeBlock code={clientUpdateTemplate} language="markdown" title={copy.clientCodeTitle} />
      </ReferenceSection>

      <SiteFooter />
    </DocsPageShell>
  );
}

export function RulebookPage() {
  const { locale } = useGdsTranslation();
  const copy = locale === 'de'
    ? {
        title: 'Governance',
        eyebrow: 'So werden die Regeln korrekt angewendet',
        lead: 'Die GDS-Einführung ist bewusst streng: Wenn ein Bedarf wiederverwendbar ist, gehört er als paket-eigener Contract in GDS. Wenn er nicht wiederverwendbar ist, bleibt er eng begrenzt, überprüfbar oder wird entfernt.',
        requireTitle: 'Was wir verlangen',
        requireDescription: 'Die gemeinsamen Regeln verhindern, dass lokale Design-Systeme in Produkt-Repositories wachsen.',
        implementedTitle: 'Was in GDS implementiert wird',
        implementedDescription: 'Wiederverwendbare Flächen gehören in Pakete, nicht in die App-Schicht.',
        changedTitle: 'Was sich in 3.4.1 geändert hat',
        changedDescription: 'Theme-Ownership ist jetzt explizit genug, um sie in Client-Repositories zu prüfen und zu erzwingen.',
        fixedTitle: 'Was zur GDS-Nutzung angepasst wird',
        fixedDescription: 'Ist der Bedarf bereits abgedeckt, wird lokale Komposition umgebaut statt neu abstrahiert.',
        deletedTitle: 'Was gelöscht wird',
        deletedDescription: 'Einige lokale Konstrukte sollten nie Teil der Referenzseite sein.',
      }
    : locale === 'fr'
      ? {
          title: 'Gouvernance',
          eyebrow: 'Comment appliquer correctement les règles',
          lead: 'L’adoption de GDS est volontairement stricte : si un besoin est réutilisable, il doit devenir un contrat possédé par les packages. Sinon, il doit rester limité, vérifiable, ou être supprimé.',
          requireTitle: 'Ce que nous exigeons',
          requireDescription: 'Les règles partagées évitent la croissance de systèmes de design locaux dans les bases produits.',
          implementedTitle: 'Ce qui est implémenté dans GDS',
          implementedDescription: 'Les surfaces réutilisables appartiennent aux packages, pas à la couche applicative.',
          changedTitle: 'Ce qui a changé en 3.4.1',
          changedDescription: 'La propriété du thème est désormais assez explicite pour être auditée et appliquée.',
          fixedTitle: 'Ce qui doit être corrigé pour utiliser GDS',
          fixedDescription: 'Si le besoin est déjà couvert, la composition locale doit être réécrite plutôt que ré-emballée.',
          deletedTitle: 'Ce qui doit être supprimé',
          deletedDescription: 'Certaines constructions locales n’auraient jamais dû faire partie du site de référence.',
        }
      : locale === 'it'
        ? {
            title: 'Governance',
            eyebrow: 'Come seguire correttamente le regole',
            lead: 'L’adozione GDS è volutamente rigorosa: se un bisogno è riusabile deve diventare un contratto di package. Se non è riusabile, deve restare stretto, verificabile o essere eliminato.',
            requireTitle: 'Cosa richiediamo',
            requireDescription: 'Le regole condivise impediscono la crescita di design system locali nei codebase prodotto.',
            implementedTitle: 'Cosa viene implementato in GDS',
            implementedDescription: 'Le superfici riusabili appartengono ai package, non al layer applicativo.',
            changedTitle: 'Cosa è cambiato nella 3.4.1',
            changedDescription: 'La proprietà del tema è ora abbastanza esplicita da poter essere verificata e applicata.',
            fixedTitle: 'Cosa va corretto per usare GDS',
            fixedDescription: 'Se il bisogno è già coperto, la composizione locale va riscritta invece di essere re-astratta.',
            deletedTitle: 'Cosa va eliminato',
            deletedDescription: 'Alcuni costrutti locali non dovevano mai entrare nel sito di riferimento.',
          }
        : locale === 'ru'
          ? {
              title: 'Управление',
              eyebrow: 'Как правильно следовать правилам',
              lead: 'Внедрение GDS намеренно строгое: если потребность переиспользуемая, она должна стать package-owned контрактом. Если нет, она должна оставаться узкой, проверяемой или быть удалена.',
              requireTitle: 'Что мы требуем',
              requireDescription: 'Общие правила не дают локальным дизайн-системам разрастаться внутри продуктовых кодовых баз.',
              implementedTitle: 'Что реализуется в GDS',
              implementedDescription: 'Переиспользуемые поверхности принадлежат пакетам, а не слою приложения.',
              changedTitle: 'Что изменилось в 3.4.1',
              changedDescription: 'Владение темой теперь достаточно явно, чтобы его можно было проверять и принудительно применять.',
              fixedTitle: 'Что нужно исправить для использования GDS',
              fixedDescription: 'Если потребность уже покрыта, локальную композицию нужно переписать, а не переоборачивать.',
              deletedTitle: 'Что должно быть удалено',
              deletedDescription: 'Некоторые локальные конструкции не должны были становиться частью референс-сайта.',
            }
          : locale === 'he'
            ? {
                title: 'ממשל',
                eyebrow: 'איך לפעול לפי הכללים בצורה נכונה',
                lead: 'האימוץ של GDS מחמיר בכוונה: צורך שניתן לשימוש חוזר חייב להפוך לחוזה בבעלות החבילות. אם אינו כזה, עליו להישאר מצומצם, ניתן לבקרה או להימחק.',
                requireTitle: 'מה אנחנו דורשים',
                requireDescription: 'הכללים המשותפים מונעים צמיחה של מערכות עיצוב מקומיות בתוך קודבייסים מוצריים.',
                implementedTitle: 'מה ממומש בתוך GDS',
                implementedDescription: 'משטחים לשימוש חוזר שייכים לחבילות ולא לשכבת האפליקציה.',
                changedTitle: 'מה השתנה ב-3.4.1',
                changedDescription: 'בעלות התמה מוגדרת כעת בצורה מפורשת מספיק לבדיקה ואכיפה.',
                fixedTitle: 'מה מתקנים כדי להשתמש ב-GDS',
                fixedDescription: 'אם הצורך כבר מכוסה, יש לשכתב קומפוזיציה מקומית במקום לבצע עטיפה מחדש.',
                deletedTitle: 'מה צריך למחוק',
                deletedDescription: 'חלק מהמבנים המקומיים לא היו אמורים להיות חלק מאתר הייחוס.',
              }
            : locale === 'ar'
              ? {
                  title: 'الحوكمة',
                  eyebrow: 'كيفية اتباع القواعد بشكل صحيح',
                  lead: 'اعتماد GDS صارم عمدًا: إذا كانت الحاجة قابلة لإعادة الاستخدام فيجب أن تصبح عقدًا مملوكًا للحزم. وإن لم تكن كذلك، يجب أن تبقى ضيقة وقابلة للمراجعة أو تُحذف.',
                  requireTitle: 'ما الذي نطلبه',
                  requireDescription: 'القواعد المشتركة تمنع نمو أنظمة تصميم محلية داخل قواعد الأكواد الخاصة بالمنتجات.',
                  implementedTitle: 'ما الذي يتم تنفيذه في GDS',
                  implementedDescription: 'الأسطح القابلة لإعادة الاستخدام تنتمي إلى الحزم وليس إلى طبقة التطبيق.',
                  changedTitle: 'ما الذي تغير في 3.4.1',
                  changedDescription: 'أصبحت ملكية الثيم واضحة بما يكفي للمراجعة والإنفاذ عبر مستودعات العملاء.',
                  fixedTitle: 'ما الذي يجب إصلاحه لاستخدام GDS',
                  fixedDescription: 'إذا كانت الحاجة مغطاة بالفعل، يجب إعادة كتابة التركيب المحلي بدل إعادة تغليفه.',
                  deletedTitle: 'ما الذي يجب حذفه',
                  deletedDescription: 'بعض التركيبات المحلية لم يكن يجب أن تصبح جزءًا من موقع المرجع.',
                }
              : locale === 'hu'
                ? {
                    title: 'Irányítás',
                    eyebrow: 'Hogyan kövesd helyesen a szabályokat',
                    lead: 'A GDS bevezetése szándékosan szigorú: ami újrahasznosítható, annak package-owned szerződéssé kell válnia. Ami nem az, maradjon szűk, ellenőrizhető vagy kerüljön törlésre.',
                    requireTitle: 'Mit követelünk meg',
                    requireDescription: 'A közös szabályok megakadályozzák, hogy helyi design rendszerek nőjenek a termék-kódbázisokban.',
                    implementedTitle: 'Mi kerül a GDS-be',
                    implementedDescription: 'Az újrahasznosítható felületek a csomagokhoz tartoznak, nem az alkalmazási réteghez.',
                    changedTitle: 'Mi változott a 3.4.1-ben',
                    changedDescription: 'A téma-tulajdonlás most már elég explicit a felülvizsgálathoz és kikényszerítéshez.',
                    fixedTitle: 'Mit kell javítani a GDS használatához',
                    fixedDescription: 'Ha az igény már lefedett, a helyi kompozíciót át kell írni, nem újracsomagolni.',
                    deletedTitle: 'Mit kell törölni',
                    deletedDescription: 'Egyes helyi konstrukcióknak sosem kellett volna a referenciaoldal részévé válniuk.',
                  }
      : {
          title: 'Governance',
          eyebrow: 'How to follow the rules properly',
          lead: 'GDS adoption is deliberately strict: if a need is reusable, it should become a package-owned contract. If it is not reusable, it should stay narrow and reviewable or be deleted.',
          requireTitle: 'What we require',
          requireDescription: 'The shared rules exist to prevent local design systems from growing inside product codebases.',
          implementedTitle: 'What gets implemented in GDS',
          implementedDescription: 'Reusable surfaces belong in packages, not in the app layer.',
          changedTitle: 'What changed in 3.4.1',
          changedDescription: 'Theme ownership now includes full CSS VibeThemes: expressive color is package-owned, route-persistent, and enforced without image backgrounds or local theme catalogs.',
          fixedTitle: 'What gets fixed to use GDS',
          fixedDescription: 'If the need is already covered, local composition should be rewritten rather than re-abstracted.',
          deletedTitle: 'What gets deleted',
          deletedDescription: 'Some local constructs should never have become part of the reference site.',
        };
  const i18n = copy;

  return (
    <DocsPageShell
      title={i18n.title}
      eyebrow={i18n.eyebrow}
      lead={i18n.lead}
    >
      <ReferenceSection title={i18n.requireTitle} description={i18n.requireDescription}>
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'reuse',
              title: 'Use shipped contracts first',
              description: 'Shells, listings, actions, detail surfaces, auth, embeds, and feedback should adopt the canonical primitives before any local composition.',
            },
            {
              id: 'exceptions',
              title: 'Keep exceptions narrow',
              description: 'When a product truly needs an exception, the scope, owner, testing, accessibility, and exit condition must be explicit.',
            },
            {
              id: 'delete',
              title: 'Delete local pseudo-primitives',
              description: 'If a site-only wrapper has no reusable contract, it should be removed instead of normalized into the system.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.implementedTitle} description={i18n.implementedDescription}>
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'shells', title: 'Shells', description: 'DiscoveryShell, PublicShell, docs/reference shells, and their navigation rhythm.' },
            { id: 'actions', title: 'Actions', description: 'Semantic actions, action bars, and governed CTA hierarchy.' },
            { id: 'content', title: 'Cards & detail', description: 'Listing, food, map, playback, profile, and editorial/display surfaces.' },
            { id: 'reference', title: 'Reference-site helpers', description: 'Theme explorer, docs sections, locale notices, and proof grids used by the official site.' },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.changedTitle} description={i18n.changedDescription}>
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'approved-theme-lanes',
              title: 'Approved theme lanes only',
              description: 'Clients should use gdsTheme, the shipped public presets, CSS VibeThemes, or createPublicBrandTheme(...).',
            },
            {
              id: 'css-vibes',
              title: 'CSS-only VibeThemes',
              description: 'Colorful app identity must come from --gds-vibe-* tokens for shell, canvas, surfaces, controls, focus, and accents, not pixel image backgrounds.',
            },
            {
              id: 'no-custom-helper',
              title: 'No long-term extendGdsTheme path',
              description: 'extendGdsTheme(...) is no longer a canonical consumer branding-layer API.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.fixedTitle} description={i18n.fixedDescription}>
        <ReferenceLinkGrid
          items={[
            {
              id: 'homepage',
              title: 'Homepage and install routes',
              description: 'These routes should compose package-owned docs/reference surfaces instead of hand-built layout wrappers.',
              href: '/general-design-system/',
            },
            {
              id: 'patterns',
              title: 'Pattern catalog',
              description: 'The catalog should show shipped components and contracts through package-owned framing, not local demo scaffolding.',
              href: '/general-design-system/patterns',
            },
            {
              id: 'demos',
              title: 'Live demos',
              description: 'The runtime showcase should present real shipped surfaces, not fake nested apps or decorative wrappers.',
              href: '/general-design-system/live-demos',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.deletedTitle} description={i18n.deletedDescription}>
        <FeatureBand
          columns={3}
          variant="compact"
          items={[
            {
              id: 'fake-apps',
              title: 'Fake nested websites',
              description: 'Contained previews are valid. Full docs-in-docs shells pretending to be a second site are not.',
            },
            {
              id: 'local-wrappers',
              title: 'Route-local presentation wrappers',
              description: 'Ad hoc Paper/Stack/Group compositions that only make docs look different should be removed.',
            },
            {
              id: 'site-authority',
              title: 'Site-only styling systems',
              description: 'Brand or theme exploration must use the shipped theme helpers, not a parallel token authority.',
            },
          ]}
        />
      </ReferenceSection>

      <SiteFooter />
    </DocsPageShell>
  );
}

export function TokensPage({
  initialThemeSelection,
  onSiteThemeSelectionChange,
}: {
  initialThemeSelection?: ThemeExplorerSelection;
  onSiteThemeSelectionChange?: (selection: ThemeExplorerSelection) => void;
}) {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'Themes',
      eyebrow: 'Official theme explorer',
      lead: 'Test the shipped GDS theme lanes, inspect the governed brand-theme generator, and verify how the official site behaves under each preset.',
      lanesTitle: 'Approved adopter theme lanes',
      lanesDescription: 'These are the only canonical theme ownership paths we recommend to client teams on `3.4.1`.',
      careTitle: 'What clients need to care about',
      careDescription: 'The governance change is about theme ownership and enforceability, not about forcing a visual redesign.',
      linksTitle: 'Theme governance links',
      linksDescription: 'Use these rulebook pages when a team wants brand expression without creating a parallel design system.',
    },
    de: {
      title: 'Themes',
      eyebrow: 'Offizieller Theme-Explorer',
      lead: 'Teste die ausgelieferten GDS-Theme-Lanes, prüfe den gesteuerten Brand-Theme-Generator und verifiziere das Verhalten der offiziellen Seite pro Preset.',
      lanesTitle: 'Freigegebene Theme-Lanes für Adopter',
      lanesDescription: 'Das sind die einzigen kanonischen Theme-Ownership-Pfade, die wir Client-Teams in `3.4.1` empfehlen.',
      careTitle: 'Worauf Clients achten müssen',
      careDescription: 'Die Governance-Änderung betrifft Ownership und Durchsetzbarkeit, nicht ein visuelles Redesign.',
      linksTitle: 'Links zur Theme-Governance',
      linksDescription: 'Nutze diese Regelwerksseiten, wenn ein Team Markenprägung ohne paralleles Design-System braucht.',
    },
    fr: {
      title: 'Thèmes',
      eyebrow: 'Explorateur de thèmes officiel',
      lead: 'Testez les lanes de thème GDS livrées, inspectez le générateur de thème de marque gouverné et vérifiez le comportement du site officiel pour chaque preset.',
      lanesTitle: 'Lanes de thème approuvées pour les adopteurs',
      lanesDescription: 'Ce sont les seuls chemins canoniques de propriété du thème recommandés aux équipes clientes en `3.4.1`.',
      careTitle: 'Ce que les clients doivent surveiller',
      careDescription: 'Le changement principal concerne la gouvernance et l’application, pas une refonte visuelle.',
      linksTitle: 'Liens de gouvernance thème',
      linksDescription: 'Utilisez ces pages de règles lorsqu’une équipe veut de la marque sans système parallèle.',
    },
    it: {
      title: 'Temi',
      eyebrow: 'Esploratore temi ufficiale',
      lead: 'Testa le theme lane GDS rilasciate, ispeziona il generatore brand-theme governato e verifica il comportamento del sito ufficiale per ogni preset.',
      lanesTitle: 'Theme lane approvate per gli adopter',
      lanesDescription: 'Questi sono gli unici percorsi canonici di proprietà tema raccomandati ai team client su `3.4.1`.',
      careTitle: 'Cosa devono considerare i client',
      careDescription: 'Il cambiamento riguarda governance e enforcement, non un redesign visivo.',
      linksTitle: 'Link governance del tema',
      linksDescription: 'Usa queste pagine di regole quando un team vuole branding senza creare un design system parallelo.',
    },
    ru: {
      title: 'Темы',
      eyebrow: 'Официальный обозреватель тем',
      lead: 'Проверьте поставляемые theme lane GDS, изучите управляемый генератор бренд-темы и верифицируйте поведение официального сайта для каждого пресета.',
      lanesTitle: 'Одобренные theme lane для adopter-команд',
      lanesDescription: 'Это единственные канонические пути владения темой, рекомендуемые клиентам на `3.4.1`.',
      careTitle: 'На что клиентам обратить внимание',
      careDescription: 'Изменение касается governance и enforcement, а не визуального редизайна.',
      linksTitle: 'Ссылки по theme governance',
      linksDescription: 'Используйте эти страницы правил, когда нужна бренд-выразительность без параллельной дизайн-системы.',
    },
    he: {
      title: 'ערכות נושא',
      eyebrow: 'סייר התמות הרשמי',
      lead: 'בדקו את נתיבי התמה שסופקו ב-GDS, בחנו את מחולל תמת המותג המנוהל ואמתו את התנהגות האתר הרשמי בכל preset.',
      lanesTitle: 'נתיבי תמה מאושרים למאמצים',
      lanesDescription: 'אלה נתיבי בעלות התמה הקנוניים היחידים המומלצים לצוותי לקוח ב-`3.4.1`.',
      careTitle: 'למה לקוחות צריכים לשים לב',
      careDescription: 'השינוי הוא בממשל ובאכיפה, לא בעיצוב חזותי מחדש.',
      linksTitle: 'קישורי ממשל תמה',
      linksDescription: 'השתמשו בדפי הכללים האלה כשצוות צריך מיתוג בלי לבנות מערכת עיצוב מקבילה.',
    },
    ar: {
      title: 'الثيمات',
      eyebrow: 'مستكشف الثيمات الرسمي',
      lead: 'اختبر مسارات الثيم في GDS، وافحص مُولّد ثيم العلامة الخاضع للحوكمة، وتحقق من سلوك الموقع الرسمي لكل إعداد مسبق.',
      lanesTitle: 'مسارات الثيم المعتمدة للفرق المتبنية',
      lanesDescription: 'هذه هي مسارات ملكية الثيم القياسية الوحيدة الموصى بها لفرق العملاء على `3.4.1`.',
      careTitle: 'ما الذي يجب أن يهتم به العملاء',
      careDescription: 'التغيير يتعلق بالحوكمة والإنفاذ وليس بإعادة تصميم بصري.',
      linksTitle: 'روابط حوكمة الثيم',
      linksDescription: 'استخدم صفحات القواعد هذه عندما تحتاج الفرق إلى تخصيص العلامة بدون نظام تصميم موازٍ.',
    },
    hu: {
      title: 'Témák',
      eyebrow: 'Hivatalos témafelfedező',
      lead: 'Teszteld a szállított GDS témacsatornákat, vizsgáld a szabályozott brand-theme generátort, és ellenőrizd a hivatalos oldal viselkedését minden presetnél.',
      lanesTitle: 'Jóváhagyott témautak adoptálóknak',
      lanesDescription: 'Ezek az egyetlen kanonikus téma-tulajdonlási utak, amelyeket a klienscsapatoknak ajánlunk `3.4.1` alatt.',
      careTitle: 'Mire figyeljenek az ügyfelek',
      careDescription: 'A változás a governance és enforcement területén történt, nem vizuális újratervezés.',
      linksTitle: 'Téma-governance linkek',
      linksDescription: 'Ezeket a szabályoldalakat használd, ha egy csapat márkakifejezést akar párhuzamos design rendszer nélkül.',
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;
  const themePageLists = {
    en: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Canonical base lane.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Dark-default public shell lane.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Flatter operational surface lane.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Serif-forward editorial/public lane.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Governed branded public composition helper.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Full-color package-owned presets for shell, canvas, surfaces, controls, focus, hero, and accent tokens.' },
      ],
      care: [
        { id: 'no-helper', title: 'Stop using extendGdsTheme(...)', description: 'Do not keep it as a long-term consumer branding-layer path.' },
        { id: 'vibe-tokens', title: 'Use --gds-vibe-* tokens', description: 'Do not rebuild colorful theme visuals with route-local gradients, image backgrounds, or product-owned theme catalogs.' },
        { id: 'manifest', title: 'Declare theme ownership files', description: 'Use approvedThemeLanes and themeOwnershipPaths in gds-adoption.json when you use gds-compliance.' },
        { id: 'verify', title: 'Verify after updating', description: 'Run build, tests, and gds-compliance after moving to the 3.4.1 line.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Open theme governance', description: 'Read the canonical theme-lane rules and the creator-authored boundary.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Open exception-surface rules', description: 'Read the narrow exception contract for surfaces that cannot yet be covered directly.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    de: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Kanonische Basis-Lane.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Dark-default Public-Shell-Lane.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Flachere operative Surface-Lane.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Serif-forward Editorial/Public-Lane.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Gesteuerter Brand-Public-Composition-Helper.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Vollfarbige package-owned Presets für Shell, Canvas, Surfaces, Controls, Focus, Hero und Accent-Tokens.' },
      ],
      care: [
        { id: 'no-helper', title: 'extendGdsTheme(...) nicht mehr verwenden', description: 'Nicht als langfristigen Consumer-Branding-Layer-Pfad behalten.' },
        { id: 'vibe-tokens', title: '--gds-vibe-* Tokens verwenden', description: 'Farbige Theme-Visuals nicht mit routenlokalen Gradients, Bildhintergründen oder produkt-eigenen Theme-Katalogen neu bauen.' },
        { id: 'manifest', title: 'Theme-Ownership-Dateien deklarieren', description: 'Nutze approvedThemeLanes und themeOwnershipPaths in gds-adoption.json, wenn du gds-compliance verwendest.' },
        { id: 'verify', title: 'Nach dem Update verifizieren', description: 'Führe Build, Tests und gds-compliance nach dem Wechsel auf die 3.4.1-Linie aus.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Theme-Governance öffnen', description: 'Lies die kanonischen Theme-Lane-Regeln und die creator-authored Grenze.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Exception-Surface-Regeln öffnen', description: 'Lies den engen Exception-Vertrag für Surfaces, die noch nicht direkt abgedeckt werden können.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    hu: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Kanonikus alap lane.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Dark-default public shell lane.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Laposabb operációs surface lane.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Serif-forward editorial/public lane.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Szabályozott branded public composition helper.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Teljes színű package-owned presetek shell, canvas, surface, control, focus, hero és accent tokenekhez.' },
      ],
      care: [
        { id: 'no-helper', title: 'Ne használd tovább az extendGdsTheme(...)-et', description: 'Ne maradjon hosszú távú consumer branding-layer útvonal.' },
        { id: 'vibe-tokens', title: '--gds-vibe-* tokenek használata', description: 'Ne építsd újra a színes téma vizuálokat route-local gradiensekkel, kép hátterekkel vagy product-owned theme katalógusokkal.' },
        { id: 'manifest', title: 'Téma ownership fájlok deklarálása', description: 'Használd az approvedThemeLanes és themeOwnershipPaths mezőket a gds-adoption.json fájlban, amikor gds-compliance-t futtatsz.' },
        { id: 'verify', title: 'Frissítés után ellenőrzés', description: 'Futtass buildet, teszteket és gds-compliance-t a 3.4.1 vonalra váltás után.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Theme governance megnyitása', description: 'Olvasd el a kanonikus theme-lane szabályokat és a creator-authored határt.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Exception-surface szabályok megnyitása', description: 'Olvasd el a szűk exception contractot azokhoz a surface-ekhez, amelyek még nem fedhetők le közvetlenül.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
  };
  const themePageListOverrides = {
    fr: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Lane de base canonique.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Lane de shell public sombre par défaut.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Lane opérationnelle avec surfaces plus plates.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Lane éditoriale/publique orientée serif.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Helper de composition publique de marque gouverné.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Presets package-owned en couleur complète pour shell, canvas, surfaces, contrôles, focus, hero et tokens accent.' },
      ],
      care: [
        { id: 'no-helper', title: 'Arrêter extendGdsTheme(...)', description: 'Ne pas le conserver comme chemin durable de branding-layer consumer.' },
        { id: 'vibe-tokens', title: 'Utiliser les tokens --gds-vibe-*', description: 'Ne reconstruisez pas les visuels colorés avec des gradients route-local, images de fond ou catalogues de thème produit.' },
        { id: 'manifest', title: 'Déclarer les fichiers de propriété thème', description: 'Utilisez approvedThemeLanes et themeOwnershipPaths dans gds-adoption.json avec gds-compliance.' },
        { id: 'verify', title: 'Vérifier après mise à jour', description: 'Exécutez build, tests et gds-compliance après le passage à la ligne 3.4.1.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Ouvrir la gouvernance thème', description: 'Lire les règles canoniques des theme lanes et la limite creator-authored.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Ouvrir les règles d’exception', description: 'Lire le contrat d’exception étroit pour les surfaces pas encore couvertes directement.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    it: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Lane base canonica.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Lane shell pubblico dark-default.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Lane operativa con superfici più piatte.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Lane editoriale/pubblica serif-forward.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Helper governato per composizione pubblica branded.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Preset package-owned full-color per shell, canvas, superfici, controlli, focus, hero e token accent.' },
      ],
      care: [
        { id: 'no-helper', title: 'Smetti di usare extendGdsTheme(...)', description: 'Non mantenerlo come percorso consumer branding-layer a lungo termine.' },
        { id: 'vibe-tokens', title: 'Usa i token --gds-vibe-*', description: 'Non ricostruire visual tema colorati con gradienti route-local, sfondi immagine o cataloghi tema product-owned.' },
        { id: 'manifest', title: 'Dichiara i file di ownership tema', description: 'Usa approvedThemeLanes e themeOwnershipPaths in gds-adoption.json quando usi gds-compliance.' },
        { id: 'verify', title: 'Verifica dopo l’aggiornamento', description: 'Esegui build, test e gds-compliance dopo il passaggio alla linea 3.4.1.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Apri governance tema', description: 'Leggi le regole canoniche delle theme lane e il confine creator-authored.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Apri regole exception surface', description: 'Leggi il contratto stretto per superfici non ancora coperte direttamente.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    ru: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'Каноническая базовая линия.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Публичная shell-линия с тёмным режимом по умолчанию.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Более плоская операционная surface-линия.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Редакционная/публичная линия с serif-направлением.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Управляемый helper для публичной бренд-композиции.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Полноцветные package-owned пресеты для shell, canvas, поверхностей, контролов, focus, hero и accent-токенов.' },
      ],
      care: [
        { id: 'no-helper', title: 'Прекратить использовать extendGdsTheme(...)', description: 'Не сохраняйте это как долгосрочный consumer branding-layer путь.' },
        { id: 'vibe-tokens', title: 'Использовать токены --gds-vibe-*', description: 'Не пересобирайте цветные визуалы тем через route-local градиенты, изображения или product-owned каталоги.' },
        { id: 'manifest', title: 'Объявить файлы ownership темы', description: 'Используйте approvedThemeLanes и themeOwnershipPaths в gds-adoption.json при gds-compliance.' },
        { id: 'verify', title: 'Проверить после обновления', description: 'Запустите build, tests и gds-compliance после перехода на линию 3.4.1.' },
      ],
      links: [
        { id: 'theme-governance', title: 'Открыть governance темы', description: 'Прочитайте канонические правила theme-lane и creator-authored границу.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'Открыть правила exception surface', description: 'Прочитайте узкий exception-контракт для поверхностей без прямого покрытия.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    he: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'נתיב בסיס קנוני.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'נתיב shell ציבורי כהה כברירת מחדל.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'נתיב תפעולי עם משטחים שטוחים יותר.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'נתיב עריכתי/ציבורי עם כיוון serif.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Helper מנוהל לקומפוזיציה ציבורית ממותגת.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Presets צבעוניים package-owned עבור shell, canvas, surfaces, controls, focus, hero ו-tokenים accent.' },
      ],
      care: [
        { id: 'no-helper', title: 'להפסיק להשתמש ב-extendGdsTheme(...)', description: 'לא להשאיר אותו כנתיב consumer branding-layer לטווח ארוך.' },
        { id: 'vibe-tokens', title: 'להשתמש ב-tokenים --gds-vibe-*', description: 'לא לבנות מחדש ויזואליות צבעונית עם gradients מקומיים, רקעי תמונה או קטלוגי תמה product-owned.' },
        { id: 'manifest', title: 'להצהיר על קבצי ownership של תמה', description: 'השתמשו ב-approvedThemeLanes וב-themeOwnershipPaths בתוך gds-adoption.json עם gds-compliance.' },
        { id: 'verify', title: 'לאמת אחרי עדכון', description: 'הריצו build, tests ו-gds-compliance אחרי מעבר לקו 3.4.1.' },
      ],
      links: [
        { id: 'theme-governance', title: 'פתיחת governance לתמות', description: 'קראו את כללי theme-lane הקנוניים ואת גבול creator-authored.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'פתיחת כללי exception surface', description: 'קראו את חוזה החריגים הצר עבור surfaces שלא מכוסים ישירות עדיין.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
    ar: {
      lanes: [
        { id: 'base', title: 'gdsTheme', description: 'مسار أساسي معياري.' },
        { id: 'dark', title: 'gdsDarkPublicTheme', description: 'مسار shell عام داكن افتراضيًا.' },
        { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'مسار تشغيلي بأسطح أكثر تسطيحًا.' },
        { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'مسار تحريري/عام باتجاه serif.' },
        { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Helper محكوم لتركيب public branded.' },
        { id: 'vibes', title: 'CSS VibeThemes', description: 'Presetات package-owned كاملة اللون للـ shell وcanvas والأسطح وعناصر التحكم وfocus وhero وaccent tokens.' },
      ],
      care: [
        { id: 'no-helper', title: 'أوقف استخدام extendGdsTheme(...)', description: 'لا تحتفظ به كمسار دائم لطبقة branding خاصة بالمستهلك.' },
        { id: 'vibe-tokens', title: 'استخدم رموز --gds-vibe-*', description: 'لا تعيد بناء visual الثيمات الملونة بتدرجات محلية للمسار أو خلفيات صور أو كتالوجات product-owned.' },
        { id: 'manifest', title: 'صرّح بملفات ownership للثيم', description: 'استخدم approvedThemeLanes و themeOwnershipPaths في gds-adoption.json عند تشغيل gds-compliance.' },
        { id: 'verify', title: 'تحقق بعد التحديث', description: 'شغّل build و tests و gds-compliance بعد الانتقال إلى خط 3.4.1.' },
      ],
      links: [
        { id: 'theme-governance', title: 'فتح حوكمة الثيم', description: 'اقرأ قواعد theme-lane القياسية وحدود creator-authored.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md' },
        { id: 'exception-rules', title: 'فتح قواعد exception surface', description: 'اقرأ عقد الاستثناء الضيق للأسطح غير المغطاة مباشرة بعد.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md' },
      ],
    },
  };
  const localizedLists = themePageLists[locale as keyof typeof themePageLists]
    ?? themePageListOverrides[locale as keyof typeof themePageListOverrides]
    ?? themePageLists.en;

  return (
    <DocsPageShell
      title={i18n.title}
      eyebrow={i18n.eyebrow}
      lead={i18n.lead}
    >
      <ReferenceThemeExplorer initialSelection={initialThemeSelection} onSelectionChange={onSiteThemeSelectionChange} />
      <ReferenceSection
        title={i18n.lanesTitle}
        description={i18n.lanesDescription}
      >
        <FeatureBand
          columns={4}
          variant="compact"
          items={localizedLists.lanes}
        />
      </ReferenceSection>
      <ReferenceSection
        title={i18n.careTitle}
        description={i18n.careDescription}
      >
        <FeatureBand
          columns={3}
          items={localizedLists.care}
        />
      </ReferenceSection>
      <ReferenceSection
        title={i18n.linksTitle}
        description={i18n.linksDescription}
      >
        <ReferenceLinkGrid
          items={localizedLists.links}
          columns={2}
        />
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}
