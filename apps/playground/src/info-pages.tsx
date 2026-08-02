import { useMemo, useRef, useState } from 'react';
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
  type GdsTourStep,
  type ThemeExplorerSelection,
} from '@sovereignsquad/gds-core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { SiteTourLauncher } from './SiteTourLauncher';
import { apiReferenceEntries, apiReferencePackages, getApiReferenceEntries, getApiReferenceSummary } from './api-reference-registry';
import { accessibilityEvidenceEntries, accessibilityEvidenceSummary } from './accessibility-evidence-registry';
import { patternRegistry } from './pattern-registry';
import { ThemeBuilder } from './ThemeBuilder';
import {
  getSiteCopy,
  targetGdsVersion,
} from './site-copy';
import {
  apiReferenceCopy,
  getRulebookCopy,
  getThemePageLists,
  installCopy,
  maturityCopy,
  overviewCopy,
  siteFooterCopy,
  tokensCopy,
  useCasesCopy,
} from './page-copy';
import { productUseCases } from './product-use-cases';

const npmrcCode = `# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}`;

const installCode = `npm install @sovereignsquad/gds@${targetGdsVersion}
npm install -D @sovereignsquad/gds-eslint-config@${targetGdsVersion} @sovereignsquad/gds-compliance@${targetGdsVersion} @sovereignsquad/gds-a11y@${targetGdsVersion}`;

const granularInstallCode = `npm install @sovereignsquad/gds-theme@${targetGdsVersion} @sovereignsquad/gds-core@${targetGdsVersion} @sovereignsquad/gds-admin@${targetGdsVersion}
npm install -D @sovereignsquad/gds-eslint-config@${targetGdsVersion} @sovereignsquad/gds-compliance@${targetGdsVersion} @sovereignsquad/gds-a11y@${targetGdsVersion}`;

const peerCode = `npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;
const mantineCorePackage = '@mantine/' + 'core';

const nextLayoutCode = `// app/layout.tsx
// Mandatory: load the GDS stylesheet once, before your app styles.
import '@sovereignsquad/gds-theme/styles.css';
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

import { GdsProvider } from '@sovereignsquad/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}`;

const viteBootstrapCode = `// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// Mandatory: load the GDS stylesheet once, before your app styles.
import '@sovereignsquad/gds-theme/styles.css';
import { GdsProvider } from '@sovereignsquad/gds/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GdsProvider>
    <App />
  </GdsProvider>,
);`;

const themeAccessibilityCode = `import {
  createGdsThemeAccessibilityReport,
  validateGdsThemeAccessibility,
} from '@sovereignsquad/gds-theme/server';

const validation = validateGdsThemeAccessibility();
if (!validation.ok) {
  throw new Error('GDS theme accessibility verification failed');
}

const report = createGdsThemeAccessibilityReport();
console.log(report.blockingCount, report.forcedColorRoles);`;

const themeAccessibilityCliCode = `npm run verify:theme-accessibility
npm run verify:forced-colors-runtime
npm run verify:accessibility-runtime
npm run verify:theme-trust-runtime`;

const scopedPreviewProviderCode = `// Scoped preview island
const previewRootId = 'product-theme-preview';

<div id={previewRootId}>
  <GdsProvider
    theme={previewTheme}
    defaultColorScheme="dark"
    colorSchemeRootElement={() => document.getElementById(previewRootId) ?? undefined}
    cssVariablesSelector={\`#\${previewRootId}\`}
    applyDocumentColorScheme={false}
  >
    <PreviewSurface />
  </GdsProvider>
</div>;`;

const updateCode = `npm install @sovereignsquad/gds@${targetGdsVersion}

# or granular runtime packages
npm install @sovereignsquad/gds-theme@${targetGdsVersion} @sovereignsquad/gds-core@${targetGdsVersion} @sovereignsquad/gds-admin@${targetGdsVersion}

# governance tooling
npm install -D @sovereignsquad/gds-eslint-config@${targetGdsVersion} @sovereignsquad/gds-compliance@${targetGdsVersion} @sovereignsquad/gds-a11y@${targetGdsVersion}`;

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
npm run verify:accessibility-evidence
npm run verify:a11y-package
gds-compliance check --manifest ./gds-adoption.json`;

const failureRecoveryCode = `# Peer conflict
npm ls @mantine/core @mantine/hooks @mantine/modals @mantine/notifications react react-dom
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react

# Registry propagation after publish
GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published:availability
npm run verify:published:consumer

# Consumer verification failure
gds-compliance check --manifest ./gds-adoption.json --format text`;

const fallbackConsumerInstallCode = `# NOT a documented install path — release-visibility artifact only.
# GDS installs exclusively via GitHub Packages (see the .npmrc block above).
# These tarballs exist for audit/offline purposes; the @sovereignsquad/gds
# umbrella package cannot be installed this way (registry-only dependency ranges).
npm install https://github.com/sovereignsquad/general-design-system/releases/download/gds-v${targetGdsVersion}/sovereignsquad-gds-theme-${targetGdsVersion}.tgz \\
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v${targetGdsVersion}/sovereignsquad-gds-core-${targetGdsVersion}.tgz \\
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v${targetGdsVersion}/sovereignsquad-gds-admin-${targetGdsVersion}.tgz

npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react`;

const fallbackInstallCode = `# Maintainers: this runs automatically in CI (release-bundles.yml) on every gds-v<VERSION> tag.
npm run pack:release
gh release create gds-v${targetGdsVersion} dist/release-bundles/${targetGdsVersion}/* --title "GDS ${targetGdsVersion} release bundles"`;

const clientUpdateTemplate = `# Copy this to every client migration thread

Team, we completed the GDS update to the ${targetGdsVersion} adoption platform release.

What to do now:
- Update all production dependencies to:
  - @sovereignsquad/gds@${targetGdsVersion}
  - @sovereignsquad/gds-eslint-config@${targetGdsVersion} (dev)
  - @sovereignsquad/gds-compliance@${targetGdsVersion} (dev)
  - @sovereignsquad/gds-a11y@${targetGdsVersion} (dev, for reusable Playwright/axe CI gates)
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
  - npm run verify:a11y-package
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

export function AiPage() {
  const installCode = `# .npmrc — required: GitHub Packages authenticates every install, even public packages.
# @sovereignsquad:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}

npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react react react-dom`;

  const providerCode = `import { GdsProvider, MetricCard, SemanticButton } from '@sovereignsquad/gds';

export default function App() {
  return (
    <GdsProvider defaultColorScheme="light">
      <MetricCard label="Active adopters" value="18 apps" trend={{ tone: 'positive', label: '+2%' }} />
      <SemanticButton action="save" />
    </GdsProvider>
  );
}`;

  const agentsTemplate = `# AGENTS.md — UI is built with the General Design System (GDS)

This project uses @sovereignsquad/gds for all UI.
When building UI, compose shipped GDS components — do not author parallel primitives.
Full rules: https://sovereignsquad.github.io/general-design-system/ai`;

  // Dogfood the shipped GdsGuidedTour module (issue 466) via the shared
  // SiteTourLauncher: a launchable + auto-running spotlight tour of this page's
  // key resources. /ai is visited by no runtime gate, so auto-start is safe.
  const entryRef = useRef<HTMLDivElement>(null);
  const bootstrapRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const tourSteps: GdsTourStep[] = [
    {
      id: 'entry',
      target: entryRef,
      title: 'Start with llms.txt',
      body: 'Any agentic coding tool discovers GDS by fetching this machine-readable entry point — install steps, rules, packages, and component families.',
      placement: 'bottom',
    },
    {
      id: 'bootstrap',
      target: bootstrapRef,
      title: 'Install and wrap once',
      body: 'One install command and a single GdsProvider at the app root. Agents follow these same two steps before composing any component.',
      placement: 'top',
    },
    {
      id: 'rules',
      target: rulesRef,
      title: 'Follow the non-negotiable rules',
      body: 'These rules keep agent output on-brand and shippable: compose shipped components, style with tokens only, and honor the semantic contracts.',
      placement: 'top',
    },
  ];

  return (
    <DocsPageShell
      title="Use GDS with AI"
      eyebrow="AI agent integration"
      lead="GDS is designed to be used by AI coding agents and any LLM-powered coding tool. Every component ships TypeScript contracts, a machine-readable entry point (llms.txt), and drop-in repo rules so agents build with the real system automatically."
    >
      <SiteTourLauncher tourId="gds-ai-page" steps={tourSteps} autoStart />
      <div ref={entryRef} data-gds-tour-target="ai-entry">
      <ReferenceSection
        title="Machine-readable entry point (llms.txt)"
        description="Any LLM tool can discover GDS rules by fetching llms.txt at the repo root. It lists install steps, non-negotiable rules, packages, and component families."
      >
        <StateBlock
          variant="info"
          title="How agents find GDS"
          description="Any agentic coding tool that honors the llms.txt standard reads this file automatically when present in a repo. Drop it into your consuming repo or point your agent at the GDS llms.txt directly."
        />
        <ReferenceLinkGrid
          items={[
            { id: 'llmstxt', title: 'llms.txt', description: 'Universal machine-readable entry point — install steps, rules, packages, component families.', href: 'https://raw.githubusercontent.com/sovereignsquad/general-design-system/main/llms.txt' },
            { id: 'agent-guide', title: 'AI Agent Guide', description: 'Long-form guide for any coding agent — install, provider, contracts, component families.', href: 'https://github.com/sovereignsquad/general-design-system/blob/main/docs/AI_AGENT_GUIDE.md' },
          ]}
          columns={2}
        />
      </ReferenceSection>
      </div>

      <div ref={bootstrapRef} data-gds-tour-target="ai-bootstrap">
      <ReferenceSection
        title="Install and bootstrap"
        description="One install command, one required provider. Agents follow these same steps."
      >
        <DocsCodeBlock code={installCode} language="bash" />
        <DocsCodeBlock code={providerCode} language="tsx" />
      </ReferenceSection>
      </div>

      <ReferenceSection
        title="Drop-in repo rules"
        description="Paste these into your repo root so every agent session follows GDS automatically — no per-session prompting required."
      >
        <SimpleDataTable
          columns={[
            { key: 'file', header: 'File' },
            { key: 'reads', header: 'Read by' },
            { key: 'purpose', header: 'Purpose' },
          ]}
          rows={[
            { file: 'AGENTS.md', reads: 'Any agentic coding tool', purpose: 'Cross-tool standard. Tells any agent this project uses GDS and must not invent parallel primitives.' },
            { file: 'llms.txt', reads: 'Any LLM tool', purpose: 'Machine-readable summary of GDS rules, packages, and component families.' },
          ]}
        />
        <DocsCodeBlock code={agentsTemplate} language="markdown" />
      </ReferenceSection>

      <div ref={rulesRef} data-gds-tour-target="ai-rules">
      <ReferenceSection
        title="Non-negotiable rules for agents"
        description="These rules are encoded in llms.txt and the drop-in templates. Agents that follow them produce on-brand, shippable code."
      >
        <SimpleDataTable
          columns={[
            { key: 'rule', header: 'Rule' },
            { key: 'why', header: 'Why' },
          ]}
          rows={[
            { rule: 'Compose shipped GDS components — import from @sovereignsquad/gds', why: 'Prevents parallel primitives that diverge from the governed contract.' },
            { rule: 'Style with props and tokens only — no custom CSS or raw hex', why: 'Ensures designs stay in the theme and remain maintainable.' },
            { rule: 'SemanticButton takes action="save"|"add"|"edit"|... not free text', why: 'The action enum drives icon, label, and aria-label automatically.' },
            { rule: 'Select/MultiSelect take data={[{value,label}]} not <option> children', why: 'Mantine-backed API; children are ignored.' },
            { rule: 'One GdsProvider at the app root — never nest a second one', why: 'Nesting creates duplicate theme contexts and breaks token resolution.' },
            { rule: 'Gate private content with GdsAccessGate protectedContentPolicy="never-render-while-locked"', why: 'Prevents private/paid content from being mounted while locked.' },
          ]}
        />
      </ReferenceSection>
      </div>
    </DocsPageShell>
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
      <SiteTourLauncher
        tourId="gds-request-feature"
        autoStart
        steps={[
          { id: 'request-form', target: 'request-form', title: 'Submit one focused request', body: 'Fill the intake fields for a single capability. Submitting opens a prefilled email — the shared lane maintainers triage from.', placement: 'bottom' },
          { id: 'request-triage', target: 'request-triage', title: 'How requests are triaged', body: 'Only reusable, accessible, non-product-specific needs become GDS issues. This is the contract for what gets promoted, routed, or rejected.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="request-form">
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
      </div>

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

      <div data-gds-tour-target="request-triage">
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
      </div>

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

export function OverviewPage({
  initialThemeSelection,
  onSiteThemeSelectionChange,
}: {
  initialThemeSelection?: ThemeExplorerSelection;
  onSiteThemeSelectionChange?: (selection: ThemeExplorerSelection) => void;
} = {}) {
  const { locale } = useGdsTranslation();
  const i18n = getSiteCopy(overviewCopy, locale);

  // First-run onboarding tour for new visitors landing on the home page,
  // launched via the shared SiteTourLauncher (consistent control + gate-safe
  // auto-start). Home is a theme-trust route, but only ever visited as
  // "/?locale=xx", so the launcher's no-query auto-start guard keeps it safe.
  const themesRef = useRef<HTMLDivElement>(null);
  const whatRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const homeSteps: GdsTourStep[] = [
    {
      id: 'home-themes',
      target: themesRef,
      title: 'Try any theme live',
      body: 'This is the Theme Lab — switch presets, light/dark, and brand lanes and watch the whole site re-theme instantly.',
      placement: 'bottom',
    },
    {
      id: 'home-what',
      target: whatRef,
      title: 'What GDS gives you',
      body: '250+ governed, accessible React components, design tokens, and runtime systems — composed in every product, never reinvented.',
      placement: 'top',
    },
    {
      id: 'home-start',
      target: startRef,
      title: 'Start building',
      body: 'Install once, wrap your app in GdsProvider, and compose shipped components. These links take you to install, patterns, and the API.',
      placement: 'top',
    },
  ];
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
      <SiteTourLauncher tourId="gds-home" steps={homeSteps} autoStart />

      <div ref={themesRef} data-gds-tour-target="home-themes">
      <ReferenceSection
        title={i18n.themesTitle}
        description={i18n.themesDescription}
      >
        <ReferenceThemeExplorer
          initialSelection={initialThemeSelection}
          onSelectionChange={onSiteThemeSelectionChange}
        />
      </ReferenceSection>
      </div>

      <div ref={whatRef} data-gds-tour-target="home-what">
      <ReferenceSection
        title={i18n.whatTitle}
        description={i18n.whatDescription}
      >
        <FeatureBand
          columns={3}
          items={[...i18n.whatItems]}
        />
      </ReferenceSection>
      </div>

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

      <div ref={startRef} data-gds-tour-target="home-start">
      <ReferenceSection title={i18n.startTitle} description={i18n.startDescription}>
        <ReferenceLinkGrid
          items={[...i18n.links]}
        />
      </ReferenceSection>
      </div>

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
  const evidenceRows = accessibilityEvidenceEntries.map((entry) => ({
    id: entry.id,
    pattern: entry.title,
    status: entry.status,
    owner: entry.owner,
    route: entry.route,
  }));

  return (
    <DocsPageShell
      title="Coverage Matrix"
      eyebrow="Pattern parity status"
      lead="This page is the runtime parity matrix between COMPONENTS_AND_PATTERNS.md and the official demo routes. Use it to see what is shipped, where it is shown, and what remains blocked."
    >
      <SiteTourLauncher
        tourId="gds-coverage"
        autoStart
        steps={[
          { id: 'coverage-summary', target: 'coverage-summary', title: 'See what is shipped', body: 'This status band summarizes how many patterns are live demos, static references, or still pending — generated from the shared pattern registry.', placement: 'bottom' },
          { id: 'coverage-evidence', target: 'coverage-evidence', title: 'Accessibility evidence', body: 'Every stable pattern publishes keyboard, focus, WCAG, screen-reader, and AT/browser evidence — visible here, not buried in release notes.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="coverage-summary">
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
      </div>
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
      <div data-gds-tour-target="coverage-evidence">
      <ReferenceSection title="Accessibility evidence" description="Every stable pattern publishes package-owned keyboard, focus, WCAG, screen-reader, and AT/browser evidence. Known limitations stay visible here instead of hiding in release notes.">
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'evidence-total', title: 'Documented patterns', description: `${accessibilityEvidenceSummary.total} stable patterns publish structured accessibility evidence.` },
            { id: 'evidence-verified', title: 'Verified', description: `${accessibilityEvidenceSummary.verified} patterns are currently marked verified.` },
            { id: 'evidence-known', title: 'Known limitations', description: `${accessibilityEvidenceSummary.withKnownLimitations} patterns disclose an explicit limitation and recovery path.` },
            { id: 'evidence-at', title: 'AT/browser checks', description: `${accessibilityEvidenceSummary.atStatuses.verified} verified assistive-technology/browser rows are shipped in the registry.` },
          ]}
        />
        <SimpleDataTable
          columns={[
            { key: 'pattern', header: 'Pattern' },
            { key: 'status', header: 'Evidence' },
            { key: 'owner', header: 'Owner' },
            { key: 'route', header: 'Route' },
          ]}
          rows={evidenceRows}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      </div>
      <SiteFooter />
    </DocsPageShell>
  );
}

export function ApiReferencePage() {
  const { locale } = useGdsTranslation();
  const i18n = getSiteCopy(apiReferenceCopy, locale);
  const summary = getApiReferenceSummary();
  const evidenceRows = accessibilityEvidenceEntries.slice(0, 12).map((entry) => ({
    id: entry.id,
    pattern: entry.title,
    status: entry.status,
    route: entry.route,
    source: entry.evidenceSource,
  }));
  const rows = getApiReferenceEntries().map((entry) => ({
    id: `${entry.packageName}:${entry.exportName}`,
    exportName: entry.exportName,
    packageName: entry.packageName,
    kind: entry.exportKind,
    runtime: entry.runtimeLane,
    status: entry.status,
    stability: entry.stability,
    boundary: entry.dependencyBoundary,
    importPath: entry.importPath,
  }));

  return (
    <DocsPageShell title={i18n.title} eyebrow={i18n.eyebrow} lead={i18n.lead}>
      <SiteTourLauncher
        tourId="gds-api"
        autoStart
        steps={[
          { id: 'api-summary', target: 'api-summary', title: 'The public API at a glance', body: 'Every documented export is counted here by lane — live-demo evidence, support contracts, canonical stability, and dependency-governed boundaries.', placement: 'bottom' },
          { id: 'api-table', target: 'api-table', title: 'Search the full export table', body: 'Each row is one public entry with its package, kind, runtime lane, docs status, stability, dependency boundary, and exact import path.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="api-summary">
      <ReferenceSection title={i18n.summaryTitle} description={i18n.summaryDescription}>
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'exports', title: 'Exports', description: `${apiReferenceEntries.length} public API entries are documented.` },
            { id: 'live', title: 'Live demo', description: `${summary['live-demo'] ?? 0} entries have live route evidence.` },
            { id: 'support', title: 'Support API', description: `${summary['support-api'] ?? 0} entries are documented support contracts.` },
            { id: 'canonical', title: 'Canonical', description: `${summary.canonical ?? 0} entries are stable GDS contracts.` },
            { id: 'boundary', title: 'Dependency-governed', description: `${(summary['mantine-backed'] ?? 0) + (summary['tabler-backed'] ?? 0)} entries expose governed implementation boundaries.` },
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
      </div>
      <ReferenceSection title="Accessibility evidence contract" description="The API surface is paired with a package-owned evidence registry so consumers can audit keyboard behavior, visible focus, WCAG mapping, assistive-technology coverage, known limitations, and recovery notes before adoption.">
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            { id: 'evidence-registry', title: 'Evidence records', description: `${accessibilityEvidenceSummary.total} stable pattern records are generated from the shipped registry.` },
            { id: 'evidence-helper', title: 'Lookup helpers', description: 'The public @sovereignsquad/gds-core helper exports resolve evidence by id, build deterministic indexes, summarize coverage, and validate freshness.' },
            { id: 'evidence-status', title: 'Visible limitations', description: `${accessibilityEvidenceSummary.knownLimitation} patterns remain flagged as known limitations instead of pretending to be fully verified.` },
            { id: 'evidence-at-status', title: 'AT/browser matrix', description: `${accessibilityEvidenceSummary.atStatuses.verified} verified assistive-technology/browser rows are included in the current release.` },
          ]}
        />
        <SimpleDataTable
          columns={[
            { key: 'pattern', header: 'Pattern' },
            { key: 'status', header: 'Evidence' },
            { key: 'route', header: 'Route' },
            { key: 'source', header: 'Source' },
          ]}
          rows={evidenceRows}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      <div data-gds-tour-target="api-table">
      <ReferenceSection title={i18n.tableTitle} description={i18n.tableDescription}>
        <SimpleDataTable
          columns={[
            { key: 'exportName', header: 'Export' },
            { key: 'packageName', header: 'Package' },
            { key: 'kind', header: 'Kind' },
            { key: 'runtime', header: 'Runtime' },
            { key: 'status', header: 'Docs' },
            { key: 'stability', header: 'Stability' },
            { key: 'boundary', header: 'Boundary' },
            { key: 'importPath', header: 'Import path' },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      </ReferenceSection>
      </div>
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
      <SiteTourLauncher
        tourId="gds-maturity"
        autoStart
        steps={[
          { id: 'maturity-summary', target: 'maturity-summary', title: 'Delivery maturity at a glance', body: 'The recommended capability groups are counted by lane — production-ready contracts, adoption tooling, and operational release contracts.', placement: 'bottom' },
          { id: 'maturity-benefits', target: 'maturity-benefits', title: 'Issue-backed capabilities', body: 'Each capability is traceable to a GitHub issue with its benefit, owning packages, and primary contracts — no unbacked roadmap claims.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="maturity-summary">
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
      </div>
      <div data-gds-tour-target="maturity-benefits">
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
      </div>
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
      <SiteTourLauncher
        tourId="gds-use-cases"
        autoStart
        steps={[
          { id: 'use-cases-guide', target: 'use-cases-guide', title: 'Pick the lane by product shape', body: 'Each card states the decision rule and the primary GDS contracts for that product shape, so you adopt the right lane before writing local UI.', placement: 'bottom' },
          { id: 'use-cases-contract', target: 'use-cases-contract', title: 'Confirm the operational contract', body: 'The table pairs each use case with its audience, risk, recommended packages, and the checks a product owner should confirm before approving work.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="use-cases-guide">
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
      </div>
      <div data-gds-tour-target="use-cases-contract">
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
      </div>
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
      {/* Manual launcher only: /install is visited by verify-accessibility-runtime,
          so an auto-start overlay would surface during that gate. */}
      <SiteTourLauncher
        tourId="gds-install"
        steps={[
          { id: 'install-registry', target: 'install-registry', title: 'Install from GitHub Packages', body: 'Add the .npmrc registry line, then install @sovereignsquad/gds and its peers. Every install authenticates, even for public packages.', placement: 'bottom' },
          { id: 'install-provider', target: 'install-provider', title: 'Wrap your app once', body: 'Load the GDS stylesheet, then wrap the app in a single GdsProvider — the one required root that injects theme, tokens, and locale.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="install-registry">
      <ReferenceSection title={copy.installSectionTitle} description={copy.installSectionDescription}>
        <DocsCodeBlock code={npmrcCode} language="ini" title={copy.npmrcCodeTitle} />
        <DocsCodeBlock code={installCode} language="bash" title={copy.installCodeTitle} />
        <DocsCodeBlock code={granularInstallCode} language="bash" title={copy.granularCodeTitle} />
        <DocsCodeBlock code={peerCode} language="bash" title={copy.peerCodeTitle} />
      </ReferenceSection>
      </div>

      <ReferenceSection title={copy.upgradeSectionTitle} description={copy.upgradeSectionDescription}>
        <DocsCodeBlock code={updateCode} language="bash" title={copy.upgradeCodeTitle} />
        <FeatureBand
          columns={3}
          variant="compact"
          items={[
            {
              id: 'low-risk',
              title: 'Low-risk for shipped lanes',
              description: 'If you already consume GDS package exports instead of direct Mantine or Tabler imports, this should be a low-risk update.',
            },
            {
              id: 'dependency-shift',
              title: 'Dependency governance changed',
              description: 'The main change is import-boundary enforcement and public API classification. This is not a visual redesign of the canonical themes.',
            },
            {
              id: 'compliance-shift',
              title: 'Compliance is stronger',
              description: 'Repos that adopt the new manifest fields can now detect unreviewed direct dependency imports automatically.',
            },
          ]}
        />
      </ReferenceSection>

      <div data-gds-tour-target="install-provider">
      <ReferenceSection title={copy.providerSectionTitle} description={copy.providerSectionDescription}>
        <DocsCodeBlock code={nextLayoutCode} language="tsx" title={copy.nextLayoutTitle} />
        <DocsCodeBlock code={providerCode} language="tsx" title={copy.providerCodeTitle} />
        <DocsCodeBlock code={viteBootstrapCode} language="tsx" title={copy.viteBootstrapTitle} />
        <DocsCodeBlock code={scopedPreviewProviderCode} language="tsx" title={copy.scopedPreviewProviderTitle} />
      </ReferenceSection>
      </div>

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
        <DocsCodeBlock code={fallbackConsumerInstallCode} language="bash" title={copy.fallbackConsumerCodeTitle} />
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
      <SiteTourLauncher
        tourId="gds-governance"
        autoStart
        steps={[
          { id: 'gov-require', target: 'gov-require', title: 'The non-negotiable rules', body: 'These are the standing rules every change on GDS must satisfy — the zero-tolerance quality gate, issue-driven work, and mandatory docs.', placement: 'bottom' },
          { id: 'gov-evidence', target: 'gov-evidence', title: 'Accessibility is enforced', body: 'Stable patterns must publish structured accessibility evidence; missing or stale records fail release verification.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="gov-require">
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
      </div>

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
              id: 'dependency-policy',
              title: 'Dependency policy',
              description: 'React, Mantine, and Tabler are accepted implementation dependencies only behind GDS-owned contracts and release gates.',
            },
            {
              id: 'api-boundaries',
              title: 'API boundary labels',
              description: 'The API reference now marks export stability and whether a public entry is a GDS contract, Mantine-backed, Tabler-backed, or tooling-only.',
            },
            {
              id: 'dependency-exceptions',
              title: 'Exception lifecycle',
              description: 'Strict consumers need owner, expiry, replacement issue, testing, accessibility, observability, rollback, and recovery metadata for direct dependency imports.',
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
              description: 'Contained previews are valid only when preview isolation and owned contrast are both package-owned. Full docs-in-docs shells pretending to be a second site are not.',
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
      <div data-gds-tour-target="gov-evidence">
      <ReferenceSection title="Accessibility evidence rules" description="Stable patterns must publish structured evidence with owner, freshness, WCAG mapping, AT/browser status, known limitations, and recovery text. Missing or stale records fail release verification.">
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'evidence-baseline',
              title: 'No anonymous claims',
              description: 'Accessibility statements must resolve to a concrete registry record with keyboard, focus, and screen-reader behavior instead of narrative marketing copy.',
            },
            {
              id: 'evidence-freshness',
              title: 'Freshness is enforced',
              description: 'Evidence older than the allowed window must be marked expired or the release gate fails.',
            },
            {
              id: 'evidence-recovery',
              title: 'Limitations stay visible',
              description: 'Known limitations require an owner, replacement path, follow-up issue, and recovery guidance before the pattern can remain in the shipped registry.',
            },
          ]}
        />
      </ReferenceSection>
      </div>

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
      {/* Manual launcher only: /themes is visited by the theme-trust, accessibility,
          and forced-colors runtime gates, so it must never auto-open an overlay. */}
      <SiteTourLauncher
        tourId="gds-themes"
        steps={[
          { id: 'themes-explorer', target: 'themes-explorer', title: 'Preview every governed theme', body: 'Switch presets, color scheme, and brand color live. What you pick here is the same token contract your app ships.', placement: 'bottom' },
          { id: 'themes-builder', target: 'themes-builder', title: 'Build your own brand theme', body: 'Generate a governed brand theme from a seed color — the builder emits the token overrides you drop into createBrandTheme.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="themes-explorer">
        <ReferenceThemeExplorer initialSelection={initialThemeSelection} onSelectionChange={onSiteThemeSelectionChange} />
      </div>
      <div data-gds-tour-target="themes-builder">
        <ThemeBuilder />
      </div>
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
        title={i18n.accessibilityTitle}
        description={i18n.accessibilityDescription}
      >
        <DocsCodeBlock
          code={themeAccessibilityCode}
          title={i18n.accessibilityApiLabel}
        />
        <DocsCodeBlock
          code={themeAccessibilityCliCode}
          title={i18n.accessibilityReleaseLabel}
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
