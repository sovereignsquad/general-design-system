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

const installCode = `npm install @doneisbetter/gds@2.6.7
npm install -D @doneisbetter/gds-eslint-config@2.6.7 @doneisbetter/gds-compliance@2.6.7`;

const peerCode = `npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;

const providerCode = `// app/providers.tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}`;

const updateCode = `npm install @doneisbetter/gds@2.6.7

# or granular runtime packages
npm install @doneisbetter/gds-theme@2.6.7 @doneisbetter/gds-core@2.6.7 @doneisbetter/gds-admin@2.6.7

# governance tooling
npm install -D @doneisbetter/gds-eslint-config@2.6.7 @doneisbetter/gds-compliance@2.6.7`;

const complianceCode = `{
  "schemaVersion": 1,
  "gdsVersion": "2.6.7",
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

const clientUpdateTemplate = `# Copy this to every client migration thread

Team, we completed the GDS update to the 2.6.7 reference surface.

What to do now:
- Update all production dependencies to:
  - @doneisbetter/gds@2.6.7
  - @doneisbetter/gds-eslint-config@2.6.7 (dev)
  - @doneisbetter/gds-compliance@2.6.7 (dev)
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
      eyebrow: 'Public install path',
      lead: 'Use the umbrella npm package for the default public entry point, then satisfy the shared Mantine peer line, wire the provider once, and align your theme ownership with the canonical `2.6.7` governance rules.',
      installSectionTitle: '1. Install the packages',
      installSectionDescription: 'The open-source public entry point is the umbrella package.',
      installCodeTitle: 'Install GDS packages',
      peerCodeTitle: 'Install peer dependencies',
      upgradeSectionTitle: '2. Upgrade existing clients to 2.6.7',
      upgradeSectionDescription: 'If your app already uses GDS, move the package line and governance tooling together.',
      upgradeCodeTitle: 'Upgrade commands',
      providerSectionTitle: '3. Add the provider',
      providerSectionDescription: 'All runtime surfaces assume one shared provider near the app root.',
      providerCodeTitle: 'Provider setup',
      adoptSectionTitle: '4. Adopt the shipped contracts',
      adoptSectionDescription: 'Use the live demo and pattern catalog before inventing product-local wrappers.',
      enforceSectionTitle: '5. Enforce the adoption contract',
      enforceSectionDescription: 'Treat your app as a real consumer with manifest-driven compliance.',
      strictManifestTitle: 'Strict adoption manifest',
      themeManifestTitle: 'Theme-governance manifest fields',
      verificationTitle: 'Verification contract',
      clientSectionTitle: 'Client update prompt',
      clientSectionDescription: 'Use this exact text when you notify every adopter about the upgrade and enforcement details.',
      clientCodeTitle: 'Reusable client rollout message',
    },
    de: {
      title: 'GDS installieren',
      eyebrow: 'Öffentlicher Installationspfad',
      lead: 'Verwende das Umbrella-npm-Paket als Standard-Einstieg, erfülle danach die gemeinsame Mantine-Peer-Linie, binde den Provider einmal ein und richte die Theme-Verantwortung nach den kanonischen `2.6.7`-Governance-Regeln aus.',
      installSectionTitle: '1. Pakete installieren',
      installSectionDescription: 'Der Open-Source-Öffentlichkeitspfad nutzt das Umbrella-Paket.',
      installCodeTitle: 'GDS-Pakete installieren',
      peerCodeTitle: 'Peer-Abhängigkeiten installieren',
      upgradeSectionTitle: '2. Bestehende Clients auf 2.6.7 aktualisieren',
      upgradeSectionDescription: 'Wenn eure App GDS bereits nutzt, aktualisiert Paketlinie und Governance-Tooling gemeinsam.',
      upgradeCodeTitle: 'Update-Befehle',
      providerSectionTitle: '3. Provider einbinden',
      providerSectionDescription: 'Alle Runtime-Flächen erwarten einen gemeinsamen Provider nahe der App-Wurzel.',
      providerCodeTitle: 'Provider-Setup',
      adoptSectionTitle: '4. Ausgelieferte Contracts übernehmen',
      adoptSectionDescription: 'Nutzt Live-Demos und Pattern-Katalog, bevor ihr lokale Wrapper erfindet.',
      enforceSectionTitle: '5. Adoptionsvertrag erzwingen',
      enforceSectionDescription: 'Behandle eure App als echten Consumer mit manifest-gesteuerter Compliance.',
      strictManifestTitle: 'Striktes Adoptions-Manifest',
      themeManifestTitle: 'Manifest-Felder für Theme-Governance',
      verificationTitle: 'Verifikationsvertrag',
      clientSectionTitle: 'Client-Update-Vorlage',
      clientSectionDescription: 'Nutze genau diesen Text, wenn ihr alle Adopter über Upgrade und Enforcement informiert.',
      clientCodeTitle: 'Wiederverwendbare Rollout-Nachricht',
    },
    fr: {
      title: 'Installer GDS',
      eyebrow: 'Parcours d’installation public',
      lead: 'Utilisez le package npm umbrella comme point d’entrée public par défaut, puis respectez la ligne de dépendances pair Mantine, configurez le provider une seule fois et alignez la gouvernance de thème sur les règles canoniques `2.6.7`.',
      installSectionTitle: '1. Installer les packages',
      installSectionDescription: 'Le point d’entrée open source public est le package umbrella.',
      installCodeTitle: 'Installer les packages GDS',
      peerCodeTitle: 'Installer les dépendances pair',
      upgradeSectionTitle: '2. Mettre à jour les clients existants vers 2.6.7',
      upgradeSectionDescription: 'Si votre application utilise déjà GDS, mettez à jour la ligne de packages et les outils de gouvernance ensemble.',
      upgradeCodeTitle: 'Commandes de mise à jour',
      providerSectionTitle: '3. Ajouter le provider',
      providerSectionDescription: 'Toutes les surfaces runtime supposent un provider partagé proche de la racine de l’application.',
      providerCodeTitle: 'Configuration du provider',
      adoptSectionTitle: '4. Adopter les contrats livrés',
      adoptSectionDescription: 'Utilisez la démo live et le catalogue de patterns avant d’inventer des wrappers locaux.',
      enforceSectionTitle: '5. Appliquer le contrat d’adoption',
      enforceSectionDescription: 'Traitez votre application comme un vrai consumer avec une conformité pilotée par manifeste.',
      strictManifestTitle: 'Manifeste d’adoption strict',
      themeManifestTitle: 'Champs de manifeste pour la gouvernance de thème',
      verificationTitle: 'Contrat de vérification',
      clientSectionTitle: 'Modèle de mise à jour client',
      clientSectionDescription: 'Utilisez exactement ce texte lorsque vous informez chaque équipe adopter de la mise à jour et de l’enforcement.',
      clientCodeTitle: 'Message de déploiement réutilisable',
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
        <DocsCodeBlock code={providerCode} language="tsx" title={copy.providerCodeTitle} />
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
