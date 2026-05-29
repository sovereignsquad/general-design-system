# General Design System

Status: Active SSOT
Version: 2.6.6
Last updated: 2026-05-29

`/Users/Shared/Projects/general-design-system` is the cross-project single source of truth for design, UI, and UX.

## How to Use This Design System

This repository serves as the central, hardened hub for all UI, UX, and design patterns across projects. It is organized around strict foundation rules, reusable component contracts, a cross-project pattern service model, and governance requirements.

### Getting Started

1. **Familiarize Yourself with the Foundation**: Start by reading [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md) to understand the core principles, accessibility baselines, and our strict Mantine token policies.
2. **Review the Component Contracts**: Before building a new UI component or workflow, check [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md) to see if a canonical pattern already exists for buttons, tables, modals, public shells, docs pages, or public data surfaces.
3. **Open the Live Pattern Catalog**: Use [https://sovereignsquad.github.io/general-design-system/patterns](https://sovereignsquad.github.io/general-design-system/patterns) to inspect the public, registry-backed reference site that demonstrates the documented contracts directly.
4. **Use the Pattern Service Model**: Before borrowing from Mantine UI or another project, read [PATTERN_SERVICE_MODEL.md](/Users/Shared/Projects/general-design-system/PATTERN_SERVICE_MODEL.md) to convert references into governed, reusable contracts.
5. **Read the Service Backbone Plan**: Use [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](/Users/Shared/Projects/general-design-system/SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) to understand how the GDS operates as a reliable, cross-project service with adoption, validation, and portfolio layers.
6. **Adopt & Migrate**: Use [GOVERNANCE_AND_ADOPTION.md](/Users/Shared/Projects/general-design-system/GOVERNANCE_AND_ADOPTION.md) to understand how to correctly implement this system in a new or legacy codebase, including the required local project statement, the adoption manifest, and compliance tooling.
7. **Run the Adoption Playbook**: Use [ADOPTION_AND_MIGRATION_PLAYBOOK.md](/Users/Shared/Projects/general-design-system/ADOPTION_AND_MIGRATION_PLAYBOOK.md) when converting a local mirror, a legacy UI system, or a new product to direct package consumption.
8. **Check Compatibility & Release Rules**: Use [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) before wiring package installs, CI/Vercel builds, or framework upgrades.

### What You Can Find Here

- **Core Principles & Tokens**: [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md) — The fundamental rules that guide UI decisions, dark/light modes, and Mantine boundaries.
- **Component Contracts & Patterns**: [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md) — Required behaviors for standard UI elements and full-page workflows.
- **Live Pattern Catalog**: [https://sovereignsquad.github.io/general-design-system/patterns](https://sovereignsquad.github.io/general-design-system/patterns) — The public registry-backed component and pattern reference site with family pages for foundations, public, operations, data, access, and feedback coverage.
- **Interactive Theme Lab**: [https://sovereignsquad.github.io/general-design-system/themes](https://sovereignsquad.github.io/general-design-system/themes) — Live testing for shipped theme presets, light/dark behavior, token surfaces, and the bounded creator-authored theming lane.
- **Feature request intake**: [https://sovereignsquad.github.io/general-design-system/request-feature](https://sovereignsquad.github.io/general-design-system/request-feature) — Canonical intake for capability requests, governance questions, and missing contracts.
- **Pattern Service Model**: [PATTERN_SERVICE_MODEL.md](/Users/Shared/Projects/general-design-system/PATTERN_SERVICE_MODEL.md) — The reusable cross-project process for borrowing Mantine-native patterns, promoting them into contracts, and enforcing consistency.
- **Service Backbone Plan**: [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](/Users/Shared/Projects/general-design-system/SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) — The operating model that makes the GDS reliable, adaptable, and replicable across a portfolio of projects.
- **Governance & Migration**: [GOVERNANCE_AND_ADOPTION.md](/Users/Shared/Projects/general-design-system/GOVERNANCE_AND_ADOPTION.md) — Strict rules on how projects must adopt the system, review PRs, and deprecate old code.
- **Adoption & Migration Playbook**: [ADOPTION_AND_MIGRATION_PLAYBOOK.md](/Users/Shared/Projects/general-design-system/ADOPTION_AND_MIGRATION_PLAYBOOK.md) — The canonical step-by-step path from local mirrors or legacy UI systems to direct `@doneisbetter/gds` or granular `@doneisbetter/gds-*` package consumption.
- **Compatibility & Releases**: [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) — Supported Mantine/React/Next ranges, subpath exports, version alignment, and upgrade expectations.
- **Installation Guide**: [INSTALLATION_GUIDE.md](/Users/Shared/Projects/general-design-system/INSTALLATION_GUIDE.md) — The canonical production install path, runtime bootstrap, verification sequence, and common setup mistakes for consumers.
- **Release Publish Runbook**: [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md) — Authenticated npm publish flow, dry-run command, and recovery guidance.
- **Verified Consumer Install Proof**: [VERIFIED_CONSUMER_INSTALL_PROOF.md](/Users/Shared/Projects/general-design-system/VERIFIED_CONSUMER_INSTALL_PROOF.md) — The current evidence for Next 15 / React 19 / Mantine 8 and 9 package consumption plus the canonical npm install path.
- **Compliance Toolkit**: [COMPLIANCE_TOOLKIT.md](/Users/Shared/Projects/general-design-system/COMPLIANCE_TOOLKIT.md) — Shared lint, manifest validation, stale-doc detection, banned-import governance, and repo-level drift checks.
- **Reference Codemods**: [scripts/codemods/README.md](/Users/Shared/Projects/general-design-system/scripts/codemods/README.md) — Narrow, production-safe migration helpers for `DiscoveryShell`, `ActionBar`, and `ListingCard`.
- **Theme Governance**: [THEME_GOVERNANCE.md](/Users/Shared/Projects/general-design-system/THEME_GOVERNANCE.md) — Brand extension, dark-mode defaults, white-label, flat-surface, and tenant-theme rules.
- **Exception Surfaces**: [EXCEPTION_SURFACES.md](/Users/Shared/Projects/general-design-system/EXCEPTION_SURFACES.md) — Chart, map, embed, and other approved exception-surface guidance.
- **Deprecations & Migrations**: [DEPRECATIONS_AND_MIGRATIONS.md](/Users/Shared/Projects/general-design-system/DEPRECATIONS_AND_MIGRATIONS.md) — Contract retirement policy, migration rules, and release handover expectations.
- **Portfolio Matrix**: [PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md](/Users/Shared/Projects/general-design-system/PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md) — The current cross-project inventory, archetypes, and recommended next actions.
- **Operational Files**: `CONTRIBUTING.md` and `CHANGELOG.md` — Shared rules for contributing to the design system and its versioned history.
- **Templates**: `TEMPLATES/` — Starter templates for your project's theme, providers, shell, and thin wrappers.
- **Machine-readable Contracts**: `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` — shared compatibility, adoption, and validation contracts.
- **Primary Runtime Package**: `@doneisbetter/gds` — the public umbrella install for most consumers, re-exporting the theme, core, and admin surface families through root, `client`, and `server` entrypoints.
- **Granular Runtime Packages**: `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin` — direct lanes for consumers that want tighter dependency boundaries or package-by-package upgrades.
- **Tooling Packages**: `@doneisbetter/gds-eslint-config` and `@doneisbetter/gds-compliance` — shared lint and compliance enforcement for adopting repos.
- **Canonical Theme Lanes**: `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)` — the only approved adopter-facing theme ownership paths; `extendGdsTheme(...)` is retained only as a bounded internal/runtime helper and is no longer a canonical consumer lane.
- **Locale Bridge**: `getGdsMessages(locale)` and `GdsLocale` from `@doneisbetter/gds-core` — canonical bridge for host i18n systems that want GDS-owned semantic labels only.
- **Public, Discovery, and Detail Surface Primitives**: `AccentPanel`, `ChoiceChip`, `EditorialHero`, `FeatureBand`, `BrowseSurface`, `EditorialCard`, `ConsumerSection`, `ConsumerDashboardGrid`, `SectionPanel`, `MediaField`, `PublicBrandFooter`, `DiscoveryShell`, `SidebarNav`, `ActionBar`, `ListingCard`, `ShareButtonGroup`, `MapPanel`, `DetailProfileShell`, `PublicFlowShell`, `PlaybackSurface`, `PublicFoodCard`, `FoodMenuSection`, `ProviderIdentityButton`, `ProviderIdentityButtonGroup`, `SocialAuthButtons`, and the enhanced `PublicShell` / `PublicProductCard` / `AuthShell` contracts from `@doneisbetter/gds-core` — canonical public/editorial contracts for accent-safe surfaces, sidebar-first shells, governed navigation and actions, unified discovery cards, sanctioned share/embed panels, detail/profile composition, public staged flows, kiosk/playback surfaces, food/menu presentation, consumer dashboard grouping, operational framing, social-auth entry, and localized media-first card states.
- **Operator Editing Primitives**: `ContentOpsEditor`, `ContentOpsSection`, `ContentOpsActionBar`, `AppShell`, `ResponsiveDataView`, and `PageHeader` from `@doneisbetter/gds-admin` — canonical scaffolds for multi-section content/settings operations, authenticated shell framing, and operational registry/detail workflows.
- **Reference Consumers**: `apps/reference-vite` and `apps/reference-next` — verified fixture apps that exercise the canonical package-consumption path.
- **Docs Site Source**: `apps/playground` — the GitHub Pages source app that publishes the install guide, governance guidance, theme explorer, live demos, and the pattern catalog.
- **Reference-Site Primitives**: `ReferenceSection`, `ReferenceLinkGrid`, `ReferenceLocaleNotice`, `ReferenceThemeExplorer`, and `ReferenceSiteShell` — canonical GDS-owned primitives for rendering the official website and any future reference/docs surfaces without site-local pseudo-components.
- **Projects**: `PROJECTS/` — Product-specific migration plans and adoption strategies.

## Public Site Contract

The GitHub Pages site is the public runtime reference for this repository:

- Overview: `https://sovereignsquad.github.io/general-design-system/`
- Install guide: `https://sovereignsquad.github.io/general-design-system/install`
- Feature request intake: `https://sovereignsquad.github.io/general-design-system/request-feature`
- Theme explorer: `https://sovereignsquad.github.io/general-design-system/themes`
- Governance guide: `https://sovereignsquad.github.io/general-design-system/governance`
- Pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- Live demos: `https://sovereignsquad.github.io/general-design-system/live-demos`
- Demo route families:
- `.../live-demos/surfaces`
- `.../live-demos/layouts`
- `.../live-demos/semantics`
- `.../live-demos/food`
- `.../live-demos/playback`
- `.../live-demos/analytics`
- Pattern family routes:
- `.../patterns/foundations`
- `.../patterns/public`
- `.../patterns/operations`
- `.../patterns/data`
- `.../patterns/access`
- `.../patterns/feedback`

Use the site for:
- live visual inspection of canonical contracts
- route-level pattern discovery
- installation and governance onboarding
- public demos of responsive and state behavior
- proof that the reference site itself is expected to consume GDS primitives directly rather than invent local shell, card, or docs wrappers

Use the markdown SSOT documents for:
- normative policy
- enforcement rules
- migration authority
- versioned contract wording

Reference-site rule:

- `apps/playground` is not a special exemption zone; it is expected to behave like the strictest public GDS consumer in the repository
- if the site needs a reusable docs/reference surface, that surface must be implemented in a GDS package or deleted as non-canonical local noise

---

Product repositories may document:
- local theme/provider paths
- local implementation paths for required pattern contracts
- wrapper component paths
- migration state
- validation commands
- narrow approved exceptions
- consumed GDS version and shared package install path

Product repositories may **not** redefine:
- component behavior
- interaction patterns
- token policy
- responsive strategy
- accessibility baseline
- UX meaning of canonical controls
- package-consumption and migration authority once the direct `@doneisbetter/gds` or granular `@doneisbetter/gds-*` path is active

**If a project-local UI document conflicts with this directory, this directory wins.**

## Repository Rules

This directory is intended to be managed as its own git repository.

Required repository behavior:
- every normative change is committed here, not only in consuming product repos
- projects should reference the SSOT path and aligned version/date in local docs
- projects should use the portfolio matrix and project plans when sequencing GDS work
- breaking behavior changes should be treated as major contract changes
- additive patterns should be documented here before they spread to multiple products

## Validation Commands

- `npm run verify:release` — checks release alignment, builds all packages/apps, verifies export boundaries, then runs lint, tests, and reference validation
- `npm run verify:references` — validates the reference consumers and their adoption manifests
- `npm run verify:mantine` — packs the packages and validates clean Mantine 8.3 and 9.2 / React 19 consumer install smoke
- `npm run publish:dry-run` — validates the authenticated package publish sequence without uploading artifacts
- `npm run publish:npm` — publishes the six public GDS packages from an authenticated npm environment
- `npm run verify:published` — checks the registry until all six packages resolve to the current `VERSION`
- `npm run pack:release` — creates public tarballs, checksums, and install instructions for the fallback GitHub release-bundle distribution path
- `npm run build` — builds `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, `@doneisbetter/gds-admin`, `@doneisbetter/gds`, and the playground in dependency order
- `node scripts/codemods/run-codemod.mjs <transform> <path>` — runs the reference migration codemods in dry-run mode by default
- `npm install` — on supported macOS and Linux x64 environments, the root optional native bindings now bootstrap the local Vite/tsup build layer without extra manual install steps
- `npm run lint` — runs the playground lint target
- `npm run test:run` — runs the shared jsdom component test suite for the workspace packages

The shared package validation path is now expected to cover:
- provider composition in `@doneisbetter/gds-theme` and `@doneisbetter/gds`
- behavior coverage in `@doneisbetter/gds-core` and `@doneisbetter/gds-admin`
- i18n-safe shared copy
- reference consumer manifests and fixture validation
- compliance tooling and shared lint enforcement
- GitHub Actions quality gates before deployment
- version and project-plan alignment for active adopter releases

## Non-Negotiable Rules

- One interaction concept gets one canonical pattern.
- One product gets one active theme and token source.
- New product UI must use Mantine primitives or thin approved wrappers around them.
- No new product UI may bypass Mantine with raw custom primitives, ad hoc HTML/CSS controls, or alternate component frameworks.
- Mantine UI examples may be used only as reference material; reusable output must become GDS-governed project contracts.
- Raw colors and repeated hard-coded spacing in feature code are prohibited.
- Dark/light mode readability is mandatory; mixed-mode surfaces require documented exceptions.
- Loading, empty, error, success, disabled, and permission states are part of every component contract.
- Mobile and responsive behavior must be designed intentionally, not inherited accidentally from desktop.
- Accessibility is part of design acceptance, not a cleanup pass.
- Internationalization resilience is mandatory for shared patterns.
