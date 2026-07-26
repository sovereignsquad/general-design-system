# Governance & Adoption

Status: Active SSOT
Version: 3.14.4
Last updated: 2026-07-26

This document defines how products adopt the design system, enforce compliance, and migrate legacy UI. 

## 1. Project Adoption Contract

New projects must use this design system immediately. Legacy projects must begin migrating and acknowledge this repository as the Single Source of Truth (SSOT).

### Required Local Statement
Every adopting project must include the following statement in their primary developer documentation:
> `/Users/Shared/Projects/general-design-system` is the single source of truth for design, UI, and UX. Project-local files describe only implementation adapter details, migration state, validation commands, and approved exceptions.

### Local Adapter Requirements
The local adapter must document:
- The path to the local Theme and Root Provider.
- The consumed GDS version and package-install path.
- Local wrapper component locations.
- Local paths for every required pattern-service contract: shell, page header, product card, metric card, data toolbar, responsive data view, auth shell, article shell, and state block where applicable.
- Known exceptions and the migration backlog.
- Path to the machine-readable `gds-adoption.json` manifest when the repo is on the formal compliance path.

**Compliance Definition:** A project is compliant when this directory is documented as the SSOT, Mantine is the *only* foundational UI primitive system, tokens come exclusively from the shared project theme, and legacy CSS/primitives have been deleted or reduced to documented narrow exceptions.

### Authority Conflict Rule

If a project-local document still treats a pre-Mantine wrapper system, CSS token layer, Tailwind system, MUI system, or other legacy layer as the current authority, that project is not governance-compliant even if migration code has started.

Those conflicts must be fixed in Phase 0, not deferred to the end.

## 2. Implementation Readiness

Before starting a new product UI implementation or a Mantine migration, projects must make and document these mandatory decisions:

1. **Theme Ownership**: Exact path for the theme and root provider.
2. **Notifications & Modals**: Where they are set up centrally.
3. **Primitive Policy**: Which controls are wrapped vs used directly.
4. **Legacy Boundary**: Which files are legacy and frozen from new UI work.
5. **Pattern Contract Inventory**: Which local files implement required GDS pattern families and which are still backlog.

**First PR Shape:** The first PR should establish the root provider, theme, and modal/notification setup, migrating *one* high-value surface. Do not attempt a full-app migration in one pass.

Projects should also be classified in `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` before major migration work begins.

## 3. Migration Playbook

Migrate legacy applications via true refactoring, not by bridging old token layers indefinitely.

### Forbidden Target States
- Keeping two active token systems in production.
- Allowing new screens to choose freely between old CSS and Mantine.
- Preserving a legacy theme provider as a permanent fallback.

### Standard Migration Phases
1. **Phase 0: Freeze** - Ban new product UI in the old system.
2. **Phase 1: Root Platform** - Add `MantineProvider`, theme, and central overlays.
3. **Phase 2: Core Primitives** - Migrate buttons, inputs, alerts, cards.
4. **Phase 3: Auth & High-Traffic** - Migrate login, registration, and core user journeys.
5. **Phase 4: Admin & CRUD** - Migrate dashboards, tables, and settings.
6. **Phase 5: Secondary Surfaces** - Migrate docs and low-traffic pages.
7. **Phase 6: Deletion** - Delete old CSS modules, legacy primitive folders, and old token systems.

## 4. Enforcement & Review

Projects must actively enforce the Mantine-only policy to prevent design-system drift.

### Minimum Enforcement Layers
- **Adoption Manifest**: Every mature adopter should declare a `gds-adoption.json` file validated against `schemas/gds-adoption.schema.json`.
- **Shared Lint Config**: `@sovereignsquad/gds-eslint-config` should be the default enforcement package for raw design value and forbidden import checks.
- **Compliance CLI**: `gds-compliance` should validate manifest structure, adapter paths, exception metadata, and repo-level drift.
- **Compliance Config**: `gds-adoption.json` may declare `compliance.documentationPaths`, `compliance.staleDocumentationReferences`, `compliance.protectedSurfacePaths`, and `compliance.bannedImports` so shared tooling can catch stale SSOT references, protected-surface drift, and lingering legacy UI dependencies without product-local scripts.
- **Theme Governance Config**: `gds-adoption.json` may declare `compliance.approvedThemeLanes` and `compliance.themeOwnershipPaths` so shared tooling can flag non-canonical branding-layer theme ownership in consumer repos.
- **Strict GDS-only Mode**: Repos that have already migrated to canonical shells, actions, listings, and detail surfaces should enable `compliance.strictMode` so local shell adapters, local button wrappers, and other prohibited surface drift fail fast.
- **Compliance Toolkit Contract**: Use [COMPLIANCE_TOOLKIT.md](COMPLIANCE_TOOLKIT.md) as the normative package + CI contract for `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance`.

## Feature Request Intake

The public feature-request lane is:

- `https://sovereignsquad.github.io/general-design-system/request-feature`
- `mailto:moldovancsaba+general.design.system@gmail.com`

Maintainers should classify each request as one of:

- missing component
- missing pattern
- documentation question
- compliance question
- unsupported product-specific request

Promote a request to a GitHub issue only when it can become a reusable GDS contract with accessibility, tests, documentation, and migration value. Product-specific backlog, private integrations, sensitive data, or one-off business logic must stay outside the GDS project board.
- **Import Boundaries**: Lint rules forbidding imports from legacy primitive directories.
- **Forbidden Values**: Lint against raw CSS colors (e.g., `#FF0000`), hard-coded radii, and unapproved size tokens in feature UI.
- **Static Checks**: CI/CD checks to prevent new legacy patterns.
- **Release Alignment**: Shared package versions and active project plans must stay aligned with `VERSION`.
- **Pattern Drift Checks**: Static or review checks that prevent new page-local shell, header, card, metric, data-toolbar, auth, article, or state-block implementations when an approved local contract already exists.
- **Mode/Readability Checks**: Visual or computed-style checks for dark/light mode contrast, clipped labels, and mixed-mode surfaces on high-traffic pages.
- **Responsive Localization Checks**: Public shells, docs shells, navigation bars, toolbars, and action clusters must be tested with localized labels at mobile width before release. Header brands must be truncation-safe, action controls must remain inside the viewport, and no translated label may push another control off-screen. The official site enforces this through `npm run verify:accessibility-runtime` with Russian, German, Hebrew, and Arabic header cases.
- **Adapter Inventory Checks**: Periodic verification that required local contract paths still exist and still map to the declared responsibilities.
- **GDS-only Source Gate (Mandatory)**: For the official GDS website consumer (`apps/playground`), CI must fail if core route files import from `@mantine/core` directly or use inline `style={{...}}` objects. This is enforced by `scripts/verify-playground-gds-only.mjs` through `npm run verify:references`.
- **No Policy Bypass Rule**: If any verification gate fails, releases and board closure are blocked until the drift is fixed or an explicit reviewed exception contract is added.

## 5. Canonical Adoption Path

Use [ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md) as the normative staged path from local mirrored adapters or partial GDS adoption to direct `@sovereignsquad/gds-*` package consumption.

### Pull Request Checklist
Reviewers must ask:
- Does this use shipped GDS contracts first, with direct Mantine/Tabler usage only behind an approved dependency-boundary exception?
- Could theme defaults solve this instead of local override logic?
- Does this use the documented server-safe/client-safe import path for the target runtime?
- If runtime theme or typography switching is present, does it persist serializable theme intent across direct links, static-host fallback reloads, browser refreshes, and route remounts?
- Are loading, empty, error, disabled, and success states explicitly handled?
- Does this use an existing local pattern-service contract instead of inventing a page-local version?
- Does the component remain keyboard and screen-reader usable?
- Did any hard-coded design value (CSS) enter feature code?

### Exception Rule
Exceptions must be documented in the local project adapter. The note must include:
- Reason and Scope
- User Impact
- Removal condition / expiration
Exceptions must remain narrow. Do not promote a one-off exception into a shared primitive unless documented here first.

For machine-readable governance and CI enforcement, `gds-adoption.json` should use the canonical exception contract fields:

- `surface`
- `category`
- narrow `scope`
- `reason`
- `allowedImplementation`
- `mustStillUse`
- `mustNotDo`
- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`
- `owner`
- `reviewDate`
- `exitCondition`
- `status`

Use `category` to distinguish runtime constraints, product-authored experiences, package coverage gaps, dependency boundaries, and short-lived migration bridges. Broad file globs are not acceptable exception scope.

For `product-authored-experience` exceptions, the manifest must also declare:

- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`

Those creator-authored lanes may style only the bounded experience canvas. They may not replace GDS-owned shell, navigation, consent, legal, or recovery chrome.

If a consumer needs an approved dependency-level exception such as `lucide-react`, the exception should also appear in `gds-adoption.json` with:

- `dependency`
- optional `allowImports`
- `reason`
- `owner`
- `reviewDate`
- `replacementIssue`
- `rollbackPlan`

Shared lint/gds-compliance tooling may use that manifest-level allowlist to keep the default GDS guardrails active without forcing a repo to abandon the shared tooling entirely.

Dependency-boundary exceptions must use `category: "dependency-boundary"` when the exception permits direct imports from an implementation dependency such as Mantine, Tabler, or a temporary icon bridge. They must also define accessibility, testing, observability, exit, and rollback requirements so the exception remains operationally owned.

Recommended compliance path:

1. declare the manifest
2. add documentation paths
3. add stale-reference strings that should never remain in local docs
4. declare protected surface directories once high-traffic governed contracts exist
5. migrate to canonical shell/action/listing/detail primitives
6. declare the approved theme lanes and theme ownership paths once provider/theme files are stable
7. fail CI on `gds-compliance check`
8. enable `strictMode` once the repo is ready for true GDS-only enforcement

Before declaring a new local surface gap, teams must check both:

- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md)
- `https://sovereignsquad.github.io/general-design-system/patterns`

The markdown document is the normative contract. The GitHub Pages pattern catalog is the live visual proof and demo inventory for those contracts.

Strict mode should approve the canonical lanes explicitly:

- `DiscoveryShell`
- `DetailProfileShell`
- `ListingCard`
- `ActionBar`
- `useGdsForm` (or equivalent package-owned form contract wrapper)
- `OverlayManagerProvider`
- `CommandRegistryProvider`
- `GdsTelemetryProvider`

For the official reference site, also prefer:

- `DocsShell` (public/site docs shell)
- `DocsHeaderActionSelect` (bounded, localization-safe header action select)
- `ReferenceSection`
- `ReferenceLinkGrid`
- `ReferenceThemeExplorer`
- `ReferenceLocaleNotice`

Reference policies:

- [THEME_GOVERNANCE.md](THEME_GOVERNANCE.md)
- [DEPENDENCY_GOVERNANCE.md](DEPENDENCY_GOVERNANCE.md)
- [EXCEPTION_SURFACES.md](EXCEPTION_SURFACES.md)
- [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md)
- [TEMPLATES/gds-adoption.json.template](TEMPLATES/gds-adoption.json.template)

## 4A. Package Consumption Rule

- Adopt shared packages through the documented install path whenever possible.
- Vendored or sibling-repo package copies must be treated as temporary transitional strategy, not the desired steady state.
- CI/Vercel-hosted products should prefer the published/shared package path once available.

### Project Adoption Manifest Rule

- New and actively governed consumers should include `gds-adoption.json`.
- The manifest must record the consumed GDS version, required contracts, local adapters, approved exceptions, and migration state.
- Compliance tooling must treat the manifest as the machine-readable contract for repo-level validation.

## 5. Cross-Project Pattern Service Adoption

Projects must use `PATTERN_SERVICE_MODEL.md` when a UI pattern appears in more than one project or more than one major surface inside the same project.

Required adoption behavior:

1. Identify the repeated workflow problem.
2. Review Mantine and Mantine UI examples only as Mantine-native references.
3. Document the GDS-level behavior contract before broad implementation.
4. Implement through shipped GDS primitives or a narrow, approved dependency-boundary exception when a direct implementation dependency is temporarily unavoidable.
5. Delete or freeze older local variants.
6. Add enforcement so the project cannot silently fork the pattern again.

Cross-project recommendations in `PATTERN_SERVICE_MODEL.md` must be reviewed during project planning. Product-local plans may sequence the work differently, but they may not reject the shared contracts without a documented exception.

## 6. Portfolio Operations

The GDS is a service, not just a rulebook. It must be operated across the portfolio deliberately.

### Required Portfolio Artifacts

- `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md`
- one project-specific plan per high-priority active product
- changelog entries for normative changes

### Required Portfolio Cadence

- review the portfolio matrix at the start of any new migration planning effort
- update project plans when a phase is completed or materially re-scoped
- review stale exceptions, stale status, and unresolved authority conflicts at least monthly or once per release train

### Priority Rules

When choosing where to invest GDS work next, prioritize:

1. projects with active authority conflicts
2. projects with shared high-traffic surfaces that can produce reusable contracts
3. projects already partly migrated where enforcement can prevent regression
4. discovery-only projects only after the active portfolio is classified

## 7. Recommended Fix Categories

Use these categories consistently when reviewing products:

- **Authority conflict**: local docs or code still treat a legacy system as current authority
- **Hybrid primitive drift**: Mantine and a competing UI stack coexist in feature code
- **Pattern reinvention**: page-local shells/cards/toolbars/states repeat without a contract
- **CSS authority leakage**: global or module CSS still acts as product UI authority
- **Validation gap**: migration exists but guardrails do not

Projects should document which of these categories apply in their local adapter or project plan.
