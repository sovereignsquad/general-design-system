import { useMemo, useState } from 'react';
import {
  ActionBar,
  DocsCodeBlock,
  DocsPageShell,
  FeatureBand,
  FormField,
  PublicBrandFooter,
  ReferenceLinkGrid,
  ReferenceSection,
  ReferenceThemeExplorer,
  SimpleDataTable,
  StateBlock,
} from '@doneisbetter/gds-core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { patternRegistry } from './pattern-registry';

const stableGdsVersion = '2.6.7';
const targetGdsVersion = '3.0.0';

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
  return (
      <PublicBrandFooter
        brandTitle="General Design System"
        description="The official GDS website and live demo. Every public route on this site exists to help teams understand what is shipped, how to install it, and which contracts they should adopt instead of building locally."
        actions={(
          <p style={{ margin: 0 }}>
            <a href="/general-design-system/install">Install GDS</a>
        </p>
      )}
      secondary={(
        <>
          <p style={{ margin: 0 }}>
            <a href="/general-design-system/patterns">Browse patterns</a>
          </p>
          <p style={{ margin: 0 }}>
            <a href="/general-design-system/themes">Explore themes</a>
          </p>
          <p style={{ margin: 0 }}>
            <a href="/general-design-system/governance">Read governance</a>
          </p>
          <p style={{ margin: 0 }}>
            <a href="/general-design-system/request-feature">Request a feature</a>
          </p>
        </>
      )}
      legal="Open source. Public npm packages. Governed adoption path."
    />
  );
}

export function RequestFeaturePage() {
  const [name, setName] = useState('Your name');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
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
      `Use case: ${useCase}`,
      `Desired benefit: ${benefit}`,
      `Priority/urgency: ${urgency}`,
      '',
      'Please keep this request focused to one capability.',
    ];

    return parts.join('\n');
  }, [name, email, organization, useCase, benefit, urgency]);

  const mailtoUrl = useMemo(
    () => `mailto:${featureRequestRecipient}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`,
    [mailSubject, mailBody],
  );

  return (
    <DocsPageShell
      title="Request a Feature"
      eyebrow="Official intake path"
      lead="Every feature request from teams should start with this simple form. We route it to the primary maintainers and add it to the public backlog."
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
          <div style={{ display: 'grid', gap: 'var(--mantine-spacing-md)' }}>
            <FormField label="Name">
              <input
                id="gds-feature-name"
                aria-label="Name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Your name"
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
              />
            </FormField>
            <FormField label="Organization (optional)">
              <input
                id="gds-feature-org"
                aria-label="Organization"
                value={organization}
                onChange={(event) => setOrganization(event.currentTarget.value)}
                placeholder="Company or project name"
                style={{ width: '100%' }}
              />
            </FormField>
            <FormField label="What capability is missing?">
              <textarea
                id="gds-feature-what"
                aria-label="What capability is missing?"
                value={useCase}
                onChange={(event) => setUseCase(event.currentTarget.value)}
                placeholder="Describe the missing primitive or behavior."
                rows={3}
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
              />
            </FormField>
            <FormField label="Urgency">
              <input
                id="gds-feature-urgency"
                aria-label="Urgency"
                value={urgency}
                onChange={(event) => setUrgency(event.currentTarget.value)}
                placeholder="High, Medium, Low"
                style={{ width: '100%' }}
              />
            </FormField>
          </div>
          <div style={{ marginTop: 'var(--mantine-spacing-sm)' }}>
            <ActionBar
              primary={{ action: 'submit', onClick: () => { window.location.href = mailtoUrl; } }}
              secondary={[{ action: 'reset', onClick: () => {
                setName('Your name');
                setEmail('');
                setOrganization('');
                setUseCase('');
                setBenefit('');
                setUrgency('');
              } }]}
            />
          </div>
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

      <ReferenceSection title="Need to send directly" description={`Send urgent requests to ${featureRequestRecipient}.`}>
        <a href={mailtoUrl}>Open prefilled email</a>
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
      meta: ['Open source', 'npm-ready', 'Live demos'],
      whatTitle: 'What GDS is',
      whatDescription: 'GDS is a governed design-system platform for products that want predictable UI contracts, shared runtime behavior, and a clear path away from local wrappers and UI drift.',
      whyTitle: 'Why GDS is useful',
      whyDescription: 'GDS works best for teams that want fewer local decisions, stronger accessibility defaults, clearer migration targets, and measurable compliance.',
      startTitle: 'Start here',
      startDescription: 'The fastest route depends on what you need right now.',
    },
    de: {
      title: 'General Design System',
      eyebrow: 'Offizielle Referenz und Live-Demo',
      lead: 'Ein zentraler Ort, um GDS zu verstehen, zu installieren, zu testen und zu vertrauen. Diese Website ist sowohl die öffentliche Produktseite als auch der Live-Runtime-Beweis des ausgelieferten Design-Systems.',
      meta: ['Open Source', 'npm-bereit', 'Live-Demos'],
      whatTitle: 'Was GDS ist',
      whatDescription: 'GDS ist eine gesteuerte Design-System-Plattform für Produkte, die vorhersagbare UI-Verträge, gemeinsames Runtime-Verhalten und einen klaren Weg weg von lokalen Wrappern und UI-Drift benötigen.',
      whyTitle: 'Warum GDS nützlich ist',
      whyDescription: 'GDS ist ideal für Teams, die weniger lokale Einzelentscheidungen, stärkere Accessibility-Standards, klarere Migrationsziele und messbare Compliance wollen.',
      startTitle: 'Hier starten',
      startDescription: 'Der schnellste Einstieg hängt davon ab, was du jetzt brauchst.',
    },
    fr: {
      title: 'General Design System',
      eyebrow: 'Référence officielle et démo live',
      lead: 'Un seul endroit pour comprendre, installer, tester et fiabiliser GDS. Ce site est à la fois la vitrine publique et la preuve runtime du design system livré.',
      meta: ['Open source', 'prêt pour npm', 'Démos live'],
      whatTitle: 'Ce qu’est GDS',
      whatDescription: 'GDS est une plateforme de design system gouvernée pour les produits qui veulent des contrats UI prévisibles, un comportement runtime partagé et une sortie claire des wrappers locaux.',
      whyTitle: 'Pourquoi GDS est utile',
      whyDescription: 'GDS convient aux équipes qui veulent moins de décisions locales, de meilleurs standards d’accessibilité, des migrations plus claires et une conformité mesurable.',
      startTitle: 'Commencer ici',
      startDescription: 'Le chemin le plus rapide dépend de votre besoin immédiat.',
    },
    it: {
      title: 'General Design System',
      eyebrow: 'Riferimento ufficiale e demo live',
      lead: 'Un unico posto per capire, installare, testare e fidarsi di GDS. Questo sito è sia prodotto pubblico sia prova runtime del design system rilasciato.',
      meta: ['Open source', 'pronto per npm', 'Demo live'],
      whatTitle: 'Cos’è GDS',
      whatDescription: 'GDS è una piattaforma di design system governata per prodotti che vogliono contratti UI prevedibili e comportamento runtime condiviso.',
      whyTitle: 'Perché GDS è utile',
      whyDescription: 'GDS è ideale per team che vogliono meno decisioni locali, migliore accessibilità e adozione verificabile.',
      startTitle: 'Inizia qui',
      startDescription: 'Il percorso più rapido dipende da cosa ti serve adesso.',
    },
    ru: {
      title: 'General Design System',
      eyebrow: 'Официальный референс и live-демо',
      lead: 'Единая точка, чтобы понять, установить, протестировать и доверять GDS. Этот сайт одновременно публичный продукт и runtime-доказательство поставляемой системы.',
      meta: ['Open source', 'готово для npm', 'Live-демо'],
      whatTitle: 'Что такое GDS',
      whatDescription: 'GDS — управляемая дизайн-системная платформа для предсказуемых UI-контрактов и общего runtime-поведения.',
      whyTitle: 'Почему GDS полезен',
      whyDescription: 'GDS подходит командам, которым нужны меньше локальных решений, сильнее доступность и проверяемое внедрение.',
      startTitle: 'Начните здесь',
      startDescription: 'Самый быстрый путь зависит от вашей текущей задачи.',
    },
    he: {
      title: 'General Design System',
      eyebrow: 'אתר ייחוס ודמו חי רשמי',
      lead: 'מקום אחד להבין, להתקין, לבדוק ולסמוך על GDS. האתר הזה הוא גם אתר המוצר הציבורי וגם הוכחת runtime חיה של המערכת.',
      meta: ['קוד פתוח', 'מוכן ל-npm', 'דמואים חיים'],
      whatTitle: 'מה זה GDS',
      whatDescription: 'GDS היא פלטפורמת Design System מנוהלת למוצרים שרוצים חוזי UI צפויים והתנהגות runtime משותפת.',
      whyTitle: 'למה GDS מועיל',
      whyDescription: 'GDS מתאים לצוותים שרוצים פחות החלטות מקומיות, נגישות טובה יותר ואימוץ מדיד.',
      startTitle: 'מתחילים כאן',
      startDescription: 'המסלול המהיר תלוי במה שצריך עכשיו.',
    },
    ar: {
      title: 'General Design System',
      eyebrow: 'مرجع رسمي وعرض حي',
      lead: 'مكان واحد لفهم GDS وتثبيته واختباره وبناء الثقة به. هذا الموقع هو موقع المنتج العام وإثبات التشغيل الحي للنظام.',
      meta: ['مفتوح المصدر', 'جاهز لـ npm', 'عروض حية'],
      whatTitle: 'ما هو GDS',
      whatDescription: 'GDS منصة تصميم محكومة للمنتجات التي تريد عقود واجهات متوقعة وسلوك تشغيل مشترك.',
      whyTitle: 'لماذا GDS مفيد',
      whyDescription: 'GDS مناسب للفرق التي تريد قرارات محلية أقل، وصولية أقوى، واعتمادًا قابلًا للقياس.',
      startTitle: 'ابدأ من هنا',
      startDescription: 'أسرع مسار يعتمد على ما تحتاجه الآن.',
    },
    hu: {
      title: 'General Design System',
      eyebrow: 'Hivatalos referencia és élő demó',
      lead: 'Egy hely, ahol megértheted, telepítheted, tesztelheted és megbízhatóan használhatod a GDS-t. Ez az oldal egyszerre nyilvános termékoldal és élő runtime bizonyíték.',
      meta: ['Nyílt forráskód', 'npm-kész', 'Élő demók'],
      whatTitle: 'Mi a GDS',
      whatDescription: 'A GDS egy irányított design system platform kiszámítható UI-szerződésekkel és közös runtime viselkedéssel.',
      whyTitle: 'Miért hasznos a GDS',
      whyDescription: 'A GDS azoknak a csapatoknak jó, akik kevesebb lokális döntést és erősebb hozzáférhetőséget szeretnének.',
      startTitle: 'Kezdés itt',
      startDescription: 'A leggyorsabb út attól függ, mire van most szükséged.',
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
          items={locale === 'de' ? [
            { id: 'what', title: 'Wiederverwendbare Runtime-Contracts', description: 'Shells, Karten, Aktionssysteme, Auth, Embeds, Feedback und Detailflächen werden als kanonische Primitives ausgeliefert.' },
            { id: 'why', title: 'Schneller zu Konsistenz', description: 'Teams übernehmen ausgelieferte Contracts statt Layout-, Button- und Kartenmuster lokal neu zu bauen.' },
            { id: 'proof', title: 'Diese Seite ist die Live-Demo', description: 'Besucher können die real ausgelieferten Theme-Lanes, öffentlichen Patterns und App-Flächen direkt hier prüfen.' },
          ] : locale === 'fr' ? [
            { id: 'what', title: 'Contrats runtime réutilisables', description: 'Shells, cartes, systèmes d’action, auth, embeds, feedback et surfaces détail sont livrés comme primitives canoniques.' },
            { id: 'why', title: 'Un chemin plus rapide vers la cohérence', description: 'Les équipes adoptent les contrats livrés au lieu de recréer localement layouts, boutons et cartes.' },
            { id: 'proof', title: 'Ce site est la démo live', description: 'Les visiteurs peuvent inspecter ici les lanes de thème, patterns publics et surfaces applicatives réellement livrés.' },
          ] : [
            { id: 'what', title: 'Reusable runtime contracts', description: 'Shells, cards, action systems, auth, embeds, feedback, and detail surfaces ship as canonical primitives.' },
            { id: 'why', title: 'A faster path to consistency', description: 'Teams adopt shipped contracts instead of recreating layout, button, and card patterns from scratch.' },
            { id: 'proof', title: 'This site is the live demo', description: 'Visitors can inspect the actual shipped theme lanes, public patterns, and application surfaces directly on this website.' },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection
        title={i18n.whyTitle}
        description={i18n.whyDescription}
      >
        <FeatureBand
          columns={4}
          variant="compact"
          items={locale === 'de' ? [
            { id: 'predictable', title: 'Planbare Lieferung', description: 'Stabile Contracts senken Abstimmungsaufwand und halten Entscheidungen überprüfbar.' },
            { id: 'shared-quality', title: 'Gemeinsamer Qualitätsmaßstab', description: 'Accessibility, Empty/Loading/Error-Zustände und semantische Aktionen werden über wiederverwendbare Flächen geliefert.' },
            { id: 'ops-clarity', title: 'Operative Klarheit', description: 'Consumer können Adoption über Manifeste, Compliance-Tooling und veröffentlichte Migrationsleitfäden verifizieren.' },
            { id: 'public-trust', title: 'Öffentliches Vertrauen', description: 'Die offizielle Seite nutzt dasselbe System, das sie empfiehlt, und zeigt dadurch reales Laufzeitverhalten.' },
          ] : locale === 'fr' ? [
            { id: 'predictable', title: 'Livraison prévisible', description: 'Des contrats stables réduisent le coût de clarification et gardent les décisions auditable.' },
            { id: 'shared-quality', title: 'Barre qualité partagée', description: 'Accessibilité, états vide/chargement/erreur et actions sémantiques sont fournis via des surfaces réutilisables.' },
            { id: 'ops-clarity', title: 'Clarté opérationnelle', description: 'Les équipes vérifient l’adoption avec manifestes, outillage conformité et guides de migration publiés.' },
            { id: 'public-trust', title: 'Confiance publique', description: 'Le site officiel est construit avec le système qu’il promeut, ce qui expose le comportement réellement livré.' },
          ] : [
            { id: 'predictable', title: 'Predictable delivery', description: 'Stable contracts reduce clarification overhead and keep implementation decisions reviewable.' },
            { id: 'shared-quality', title: 'Shared quality bar', description: 'Accessibility, empty/loading/error states, and semantic actions are handled through reusable surfaces.' },
            { id: 'ops-clarity', title: 'Operational clarity', description: 'Consumers can verify adoption with manifests, compliance tooling, and published migration guidance.' },
            { id: 'public-trust', title: 'Public trust', description: 'The official site is built on the same system it promotes, so visitors can inspect real shipped behavior.' },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title={i18n.startTitle} description={i18n.startDescription}>
        <ReferenceLinkGrid
          items={locale === 'de' ? [
            { id: 'patterns', title: 'Patterns durchsuchen', description: 'Sieh das dokumentierte Pattern-Inventar nach Foundations, Public, Operations, Data, Access und Feedback.', href: '/general-design-system/patterns', badge: 'Pattern-Katalog' },
            { id: 'coverage', title: 'Coverage-Matrix öffnen', description: 'Verfolge die Parität von Komponenten und Patterns zwischen Doku und Live-Routen.', href: '/general-design-system/coverage', badge: 'Paritätsmatrix' },
            { id: 'themes', title: 'Themes erkunden', description: 'Teste ausgelieferte Presets und den gesteuerten Brand-Theme-Generator im Live-Lab.', href: '/general-design-system/themes', badge: 'Theme-Explorer' },
            { id: 'install', title: 'GDS installieren', description: 'Übernimm npm-Befehle, Provider-Setup und Verifikationsvertrag aus realen Adopter-Pfaden.', href: '/general-design-system/install', badge: 'npm' },
            { id: 'demos', title: 'Live-Demos öffnen', description: 'Prüfe Runtime-Flächen für Shells, Karten, Auth, Aktionen, Food, Playback und Analytics.', href: '/general-design-system/live-demos', badge: 'Live-Demos' },
            { id: 'governance', title: 'Governance lesen', description: 'Verstehe Strict Mode, freigegebene Ausnahmen und die Regel, dass Wiederverwendbares in GDS gehört.', href: '/general-design-system/governance', badge: 'Regelwerk' },
          ] : locale === 'fr' ? [
            { id: 'patterns', title: 'Parcourir les patterns', description: 'Consultez l’inventaire documenté par familles foundations, public, operations, data, access et feedback.', href: '/general-design-system/patterns', badge: 'Catalogue patterns' },
            { id: 'coverage', title: 'Ouvrir la matrice de couverture', description: 'Suivez la parité composants/patterns entre documentation et routes runtime.', href: '/general-design-system/coverage', badge: 'Matrice de parité' },
            { id: 'themes', title: 'Explorer les thèmes', description: 'Testez les presets livrés et le générateur de thème de marque gouverné dans le labo live.', href: '/general-design-system/themes', badge: 'Explorateur de thèmes' },
            { id: 'install', title: 'Installer GDS', description: 'Copiez les commandes npm, le setup provider et le contrat de vérification utilisés par les adopteurs réels.', href: '/general-design-system/install', badge: 'npm' },
            { id: 'demos', title: 'Ouvrir les démos live', description: 'Inspectez les surfaces runtime pour shells, cartes, auth, actions, food, playback et analytics.', href: '/general-design-system/live-demos', badge: 'Démos live' },
            { id: 'governance', title: 'Lire la gouvernance', description: 'Comprenez le mode strict, les exceptions approuvées et la règle qui impose les besoins réutilisables dans GDS.', href: '/general-design-system/governance', badge: 'Règles' },
          ] : [
            { id: 'patterns', title: 'Browse patterns', description: 'See the documented pattern inventory grouped by foundations, public, operations, data, access, and feedback.', href: '/general-design-system/patterns', badge: 'Pattern catalog' },
            { id: 'coverage', title: 'Open coverage matrix', description: 'Track component and pattern parity between documentation and live runtime routes.', href: '/general-design-system/coverage', badge: 'Parity matrix' },
            { id: 'themes', title: 'Explore themes', description: 'Test the shipped presets and the governed brand-theme generator in the live theme lab.', href: '/general-design-system/themes', badge: 'Theme explorer' },
            { id: 'install', title: 'Install GDS', description: 'Copy the npm commands, provider setup, and verification contract used by real adopters.', href: '/general-design-system/install', badge: 'npm' },
            { id: 'demos', title: 'Open live demos', description: 'Inspect runtime surfaces for shells, cards, auth, actions, food, playback, and analytics.', href: '/general-design-system/live-demos', badge: 'Live demos' },
            { id: 'governance', title: 'Read governance', description: 'Understand strict mode, approved exceptions, and the rule that reusable needs belong in GDS rather than local app code.', href: '/general-design-system/governance', badge: 'Rulebook' },
          ]}
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

export function InstallPage() {
  const { locale } = useGdsTranslation();
  const installCopy = {
    en: {
      title: 'Install GDS',
      eyebrow: '3.0.0 public install path',
      lead: `Use the umbrella npm package for the default public entry point, satisfy the shared Mantine peer line, wire the provider once, and align theme ownership with the canonical ${targetGdsVersion} governance rules. Current stable remains ${stableGdsVersion} until the release gate is complete.`,
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
      eyebrow: 'Öffentlicher 3.0.0-Installationspfad',
      lead: `Verwende das Umbrella-npm-Paket als Standard-Einstieg, erfülle die gemeinsame Mantine-Peer-Linie, binde den Provider einmal ein und richte Theme-Ownership nach ${targetGdsVersion} aus. Aktuell stabil bleibt ${stableGdsVersion}, bis das Release-Gate abgeschlossen ist.`,
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
      eyebrow: 'Parcours d’installation public 3.0.0',
      lead: `Utilisez le package npm umbrella, respectez la ligne de dépendances pair Mantine, configurez le provider une seule fois et alignez la gouvernance de thème sur ${targetGdsVersion}. La version stable reste ${stableGdsVersion} jusqu’à la fin du release gate.`,
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
      lead: 'Usa il pacchetto npm umbrella come punto di ingresso pubblico predefinito, soddisfa la linea peer condivisa di Mantine, configura il provider una sola volta e allinea la governance del tema alle regole canoniche `2.6.7`.',
      installSectionTitle: '1. Installa i pacchetti',
      installSectionDescription: 'Il punto di ingresso pubblico open source è il pacchetto umbrella.',
      installCodeTitle: 'Installa i pacchetti GDS',
      granularCodeTitle: 'Installa pacchetti granulari',
      peerCodeTitle: 'Installa le dipendenze peer',
      upgradeSectionTitle: '2. Aggiorna i client esistenti alla 2.6.7',
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
      lead: 'Используйте umbrella npm-пакет как основной публичный вход, соблюдайте общую peer-линейку Mantine, подключите provider один раз и выровняйте владение темой по каноническим правилам `2.6.7`.',
      installSectionTitle: '1. Установите пакеты',
      installSectionDescription: 'Публичная open-source точка входа — umbrella пакет.',
      installCodeTitle: 'Установить пакеты GDS',
      granularCodeTitle: 'Установить granular пакеты',
      peerCodeTitle: 'Установить peer-зависимости',
      upgradeSectionTitle: '2. Обновите существующие клиенты до 2.6.7',
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
      lead: 'השתמשו בחבילת npm umbrella כנקודת הכניסה הציבורית, השלימו את קו ה-peer של Mantine, הגדירו provider פעם אחת ויישרו את בעלות התמה לכללי `2.6.7` הקנוניים.',
      installSectionTitle: '1. התקנת החבילות',
      installSectionDescription: 'נקודת הכניסה הציבורית בקוד פתוח היא חבילת ה-umbrella.',
      installCodeTitle: 'התקנת חבילות GDS',
      granularCodeTitle: 'התקנת חבילות granular',
      peerCodeTitle: 'התקנת תלויות peer',
      upgradeSectionTitle: '2. עדכון לקוחות קיימים ל-2.6.7',
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
      lead: 'استخدم حزمة npm الشاملة كنقطة الدخول العامة الافتراضية، ثم التزم بخط peer الخاص بـ Mantine، واضبط المزود مرة واحدة، ووافق حوكمة الثيم مع قواعد `2.6.7` القياسية.',
      installSectionTitle: '1. تثبيت الحزم',
      installSectionDescription: 'نقطة الدخول العامة مفتوحة المصدر هي الحزمة الشاملة.',
      installCodeTitle: 'تثبيت حزم GDS',
      granularCodeTitle: 'تثبيت الحزم granular',
      peerCodeTitle: 'تثبيت تبعيات peer',
      upgradeSectionTitle: '2. تحديث العملاء الحاليين إلى 2.6.7',
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
      lead: 'Használd az umbrella npm csomagot alapértelmezett nyilvános belépési pontként, teljesítsd a közös Mantine peer sort, kösd be egyszer a providert, és igazítsd a téma-tulajdonlást a kanonikus `2.6.7` szabályokhoz.',
      installSectionTitle: '1. Csomagok telepítése',
      installSectionDescription: 'A nyílt forrású nyilvános belépési pont az umbrella csomag.',
      installCodeTitle: 'GDS csomagok telepítése',
      granularCodeTitle: 'Granuláris csomagok telepítése',
      peerCodeTitle: 'Peer függőségek telepítése',
      upgradeSectionTitle: '2. Meglévő kliensek frissítése 2.6.7-re',
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
        changedTitle: 'Was sich in 2.6.7 geändert hat',
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
          changedTitle: 'Ce qui a changé en 2.6.7',
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
            changedTitle: 'Cosa è cambiato nella 2.6.7',
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
              changedTitle: 'Что изменилось в 2.6.7',
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
                changedTitle: 'מה השתנה ב-2.6.7',
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
                  changedTitle: 'ما الذي تغير في 2.6.7',
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
                    changedTitle: 'Mi változott a 2.6.7-ben',
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
          changedTitle: 'What changed in 2.6.7',
          changedDescription: 'Theme ownership is now explicit enough to review and enforce across client repos.',
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
              description: 'Clients should use gdsTheme, the shipped public presets, or createPublicBrandTheme(...).',
            },
            {
              id: 'no-custom-helper',
              title: 'No long-term extendGdsTheme path',
              description: 'extendGdsTheme(...) is no longer a canonical consumer branding-layer API.',
            },
            {
              id: 'manifest-enforcement',
              title: 'Manifest-based enforcement',
              description: 'Clients can now declare approvedThemeLanes and themeOwnershipPaths so compliance tooling can flag drift.',
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

export function TokensPage() {
  const { locale } = useGdsTranslation();
  const copy = {
    en: {
      title: 'Themes',
      eyebrow: 'Official theme explorer',
      lead: 'Test the shipped GDS theme lanes, inspect the governed brand-theme generator, and verify how the official site behaves under each preset.',
      lanesTitle: 'Approved adopter theme lanes',
      lanesDescription: 'These are the only canonical theme ownership paths we recommend to client teams on `2.6.7`.',
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
      lanesDescription: 'Das sind die einzigen kanonischen Theme-Ownership-Pfade, die wir Client-Teams in `2.6.7` empfehlen.',
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
      lanesDescription: 'Ce sont les seuls chemins canoniques de propriété du thème recommandés aux équipes clientes en `2.6.7`.',
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
      lanesDescription: 'Questi sono gli unici percorsi canonici di proprietà tema raccomandati ai team client su `2.6.7`.',
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
      lanesDescription: 'Это единственные канонические пути владения темой, рекомендуемые клиентам на `2.6.7`.',
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
      lanesDescription: 'אלה נתיבי בעלות התמה הקנוניים היחידים המומלצים לצוותי לקוח ב-`2.6.7`.',
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
      lanesDescription: 'هذه هي مسارات ملكية الثيم القياسية الوحيدة الموصى بها لفرق العملاء على `2.6.7`.',
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
      lanesDescription: 'Ezek az egyetlen kanonikus téma-tulajdonlási utak, amelyeket a klienscsapatoknak ajánlunk `2.6.7` alatt.',
      careTitle: 'Mire figyeljenek az ügyfelek',
      careDescription: 'A változás a governance és enforcement területén történt, nem vizuális újratervezés.',
      linksTitle: 'Téma-governance linkek',
      linksDescription: 'Ezeket a szabályoldalakat használd, ha egy csapat márkakifejezést akar párhuzamos design rendszer nélkül.',
    },
  } as const;
  const i18n = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <DocsPageShell
      title={i18n.title}
      eyebrow={i18n.eyebrow}
      lead={i18n.lead}
    >
      <ReferenceThemeExplorer />
      <ReferenceSection
        title={i18n.lanesTitle}
        description={i18n.lanesDescription}
      >
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'base', title: 'gdsTheme', description: 'Canonical base lane.' },
            { id: 'dark', title: 'gdsDarkPublicTheme', description: 'Dark-default public shell lane.' },
            { id: 'flat', title: 'gdsFlatSurfaceTheme', description: 'Flatter operational surface lane.' },
            { id: 'editorial', title: 'gdsEditorialPublicTheme', description: 'Serif-forward editorial/public lane.' },
            { id: 'brand', title: 'createPublicBrandTheme(...)', description: 'Governed branded public composition helper.' },
          ]}
        />
      </ReferenceSection>
      <ReferenceSection
        title={i18n.careTitle}
        description={i18n.careDescription}
      >
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'no-helper',
              title: 'Stop using extendGdsTheme(...)',
              description: 'Do not keep it as a long-term consumer branding-layer path.',
            },
            {
              id: 'manifest',
              title: 'Declare theme ownership files',
              description: 'Use approvedThemeLanes and themeOwnershipPaths in gds-adoption.json when you use gds-compliance.',
            },
            {
              id: 'verify',
              title: 'Verify after updating',
              description: 'Run build, tests, and gds-compliance after moving to the 2.6.7 line.',
            },
          ]}
        />
      </ReferenceSection>
      <ReferenceSection
        title={i18n.linksTitle}
        description={i18n.linksDescription}
      >
        <ReferenceLinkGrid
          items={[
            {
              id: 'theme-governance',
              title: 'Open theme governance',
              description: 'Read the canonical theme-lane rules and the creator-authored boundary.',
              href: 'https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md',
            },
            {
              id: 'exception-rules',
              title: 'Open exception-surface rules',
              description: 'Read the narrow exception contract for surfaces that cannot yet be covered directly.',
              href: 'https://github.com/sovereignsquad/general-design-system/blob/main/EXCEPTION_SURFACES.md',
            },
          ]}
          columns={2}
        />
      </ReferenceSection>
      <SiteFooter />
    </DocsPageShell>
  );
}
