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
  StateBlock,
} from '@doneisbetter/gds-core';

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
  return (
    <DocsPageShell
      title="General Design System"
      eyebrow="Official reference and live demo"
      lead="One place to understand, install, test, and trust GDS. This website is both the public product site and the live runtime proof of the shipped design system."
      meta={(
        <>
          <span>Open source</span>
          <span>npm-ready</span>
          <span>Live demos</span>
        </>
      )}
    >
      <ReferenceSection
        title="What GDS is"
        description="GDS is a governed design-system platform for products that want predictable UI contracts, shared runtime behavior, and a clear path away from local wrappers and UI drift."
      >
        <FeatureBand
          columns={3}
          items={[
            {
              id: 'what',
              title: 'Reusable runtime contracts',
              description: 'Shells, cards, action systems, auth, embeds, feedback, and detail surfaces ship as canonical primitives.',
            },
            {
              id: 'why',
              title: 'A faster path to consistency',
              description: 'Teams adopt shipped contracts instead of recreating layout, button, and card patterns from scratch.',
            },
            {
              id: 'proof',
              title: 'This site is the live demo',
              description: 'Visitors can inspect the actual shipped theme lanes, public patterns, and application surfaces directly on this website.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection
        title="Why GDS is useful"
        description="GDS works best for teams that want fewer local decisions, stronger accessibility defaults, clearer migration targets, and measurable compliance."
      >
        <FeatureBand
          columns={4}
          variant="compact"
          items={[
            {
              id: 'predictable',
              title: 'Predictable delivery',
              description: 'Stable contracts reduce clarification overhead and keep implementation decisions reviewable.',
            },
            {
              id: 'shared-quality',
              title: 'Shared quality bar',
              description: 'Accessibility, empty/loading/error states, and semantic actions are handled through reusable surfaces.',
            },
            {
              id: 'ops-clarity',
              title: 'Operational clarity',
              description: 'Consumers can verify adoption with manifests, compliance tooling, and published migration guidance.',
            },
            {
              id: 'public-trust',
              title: 'Public trust',
              description: 'The official site is built on the same system it promotes, so visitors can inspect real shipped behavior.',
            },
          ]}
        />
      </ReferenceSection>

      <ReferenceSection title="Start here" description="The fastest route depends on what you need right now.">
        <ReferenceLinkGrid
          items={[
            {
              id: 'patterns',
              title: 'Browse patterns',
              description: 'See the documented pattern inventory grouped by foundations, public, operations, data, access, and feedback.',
              href: '/general-design-system/patterns',
              badge: 'Pattern catalog',
            },
            {
              id: 'themes',
              title: 'Explore themes',
              description: 'Test the shipped presets and the governed brand-theme generator in the live theme lab.',
              href: '/general-design-system/themes',
              badge: 'Theme explorer',
            },
            {
              id: 'install',
              title: 'Install GDS',
              description: 'Copy the npm commands, provider setup, and verification contract used by real adopters.',
              href: '/general-design-system/install',
              badge: 'npm',
            },
            {
              id: 'demos',
              title: 'Open live demos',
              description: 'Inspect runtime surfaces for shells, cards, auth, actions, food, playback, and analytics.',
              href: '/general-design-system/live-demos',
              badge: 'Live demos',
            },
            {
              id: 'governance',
              title: 'Read governance',
              description: 'Understand strict mode, approved exceptions, and the rule that reusable needs belong in GDS rather than local app code.',
              href: '/general-design-system/governance',
              badge: 'Rulebook',
            },
          ]}
        />
      </ReferenceSection>

      <SiteFooter />
    </DocsPageShell>
  );
}

export function InstallPage() {
  return (
    <DocsPageShell
      title="Install GDS"
      eyebrow="Public install path"
      lead="Use the umbrella npm package for the default public entry point, then satisfy the shared Mantine peer line, wire the provider once, and align your theme ownership with the canonical `2.6.7` governance rules."
    >
      <ReferenceSection title="1. Install the packages" description="The open-source public entry point is the umbrella package.">
        <DocsCodeBlock code={installCode} language="bash" title="Install GDS packages" />
        <DocsCodeBlock code={peerCode} language="bash" title="Install peer dependencies" />
      </ReferenceSection>

      <ReferenceSection title="2. Upgrade existing clients to 2.6.7" description="If your app already uses GDS, move the package line and governance tooling together.">
        <DocsCodeBlock code={updateCode} language="bash" title="Upgrade commands" />
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

      <ReferenceSection title="3. Add the provider" description="All runtime surfaces assume one shared provider near the app root.">
        <DocsCodeBlock code={providerCode} language="tsx" title="Provider setup" />
      </ReferenceSection>

      <ReferenceSection title="4. Adopt the shipped contracts" description="Use the live demo and pattern catalog before inventing product-local wrappers.">
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

      <ReferenceSection title="5. Enforce the adoption contract" description="Treat your app as a real consumer with manifest-driven compliance.">
        <DocsCodeBlock code={complianceCode} language="json" title="Strict adoption manifest" />
        <DocsCodeBlock code={themeGovernanceCode} language="json" title="Theme-governance manifest fields" />
        <DocsCodeBlock code={verificationCode} language="bash" title="Verification contract" />
      </ReferenceSection>

      <ReferenceSection title="Client update prompt" description="Use this exact text when you notify every adopter about the upgrade and enforcement details.">
        <DocsCodeBlock code={clientUpdateTemplate} language="markdown" title="Reusable client rollout message" />
      </ReferenceSection>

      <SiteFooter />
    </DocsPageShell>
  );
}

export function RulebookPage() {
  return (
    <DocsPageShell
      title="Governance"
      eyebrow="How to follow the rules properly"
      lead="GDS adoption is deliberately strict: if a need is reusable, it should become a package-owned contract. If it is not reusable, it should stay narrow and reviewable or be deleted."
    >
      <ReferenceSection title="What we require" description="The shared rules exist to prevent local design systems from growing inside product codebases.">
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

      <ReferenceSection title="What gets implemented in GDS" description="Reusable surfaces belong in packages, not in the app layer.">
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

      <ReferenceSection title="What changed in 2.6.7" description="Theme ownership is now explicit enough to review and enforce across client repos.">
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

      <ReferenceSection title="What gets fixed to use GDS" description="If the need is already covered, local composition should be rewritten rather than re-abstracted.">
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

      <ReferenceSection title="What gets deleted" description="Some local constructs should never have become part of the reference site.">
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
  return (
    <DocsPageShell
      title="Themes"
      eyebrow="Official theme explorer"
      lead="Test the shipped GDS theme lanes, inspect the governed brand-theme generator, and verify how the official site behaves under each preset."
    >
      <ReferenceThemeExplorer />
      <ReferenceSection
        title="Approved adopter theme lanes"
        description="These are the only canonical theme ownership paths we recommend to client teams on `2.6.7`."
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
        title="What clients need to care about"
        description="The governance change is about theme ownership and enforceability, not about forcing a visual redesign."
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
        title="Theme governance links"
        description="Use these rulebook pages when a team wants brand expression without creating a parallel design system."
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
