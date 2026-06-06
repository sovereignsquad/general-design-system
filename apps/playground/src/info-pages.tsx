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
import {
  apiReferenceCopy,
  getRulebookCopy,
  getSiteCopy,
  getThemePageLists,
  installCopy,
  maturityCopy,
  overviewCopy,
  siteFooterCopy,
  targetGdsVersion,
  tokensCopy,
  useCasesCopy,
} from './site-copy';
import { productUseCases } from './product-use-cases';

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
  const i18n = getSiteCopy(siteFooterCopy, locale);
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
  const i18n = getSiteCopy(overviewCopy, locale);
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
  const i18n = getSiteCopy(apiReferenceCopy, locale);
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
  const i18n = getSiteCopy(maturityCopy, locale);
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
  const i18n = getSiteCopy(useCasesCopy, locale);

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

  const copy = getSiteCopy(installCopy, locale);

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
  const copy = getRulebookCopy(locale);
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
  const i18n = getSiteCopy(tokensCopy, locale);
  const localizedLists = getThemePageLists(locale);

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
