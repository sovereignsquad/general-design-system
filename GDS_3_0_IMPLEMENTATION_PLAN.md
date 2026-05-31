# GDS 3.0.0 Implementation Plan

Status: Planned
Target release: 3.0.0
Current stable baseline: 2.6.7
Last updated: 2026-05-31

This plan defines the next major General Design System release. GDS 3.0.0 is the release where the system becomes a complete adoption platform: package contracts, live reference site, governance tooling, feature-intake process, migration support, and production-grade component coverage must work together as one predictable operating model.

The current package line remains `2.6.7` until the 3.0.0 work is implemented, verified, published, and documented. All roadmap, milestone, and project-board work for this wave must use `3.0.0` consistently.

## Release Objective

GDS 3.0.0 must let a consumer team answer these questions without clarification:

- what GDS is and why it is the UI authority
- how to install it through npm
- how to bootstrap it in Next.js App Router and Vite
- which primitives and patterns must be used for each surface
- which theme lanes are approved
- how to request a missing function
- how to migrate away from local shell/card/action/theme code
- how to prove compliance in CI
- how to see every shipped component and pattern on the live GitHub Pages site

## Release Principles

- The GitHub Pages site is the live reference consumer, not a marketing carve-out.
- Every exported component or required pattern needs a discoverable demo, usage guidance, accessibility notes, and state coverage.
- All UI/UX/frontend implementation must consume GDS primitives and packages.
- Consumer-facing docs must use one version line for the release: `3.0.0`.
- Governance rules must be measurable through `gds-compliance`, not only documented.
- The feature-request lane must capture missing functions without polluting the canonical delivery board.

## Scope

### 1. Reference Site Completeness

Build the public reference site into the complete live demo for GDS.

Required functions:

- component catalog coverage for every exported public, admin, docs, access, data, food, media, and feedback primitive
- pattern family pages for foundations, public, operations, data, access, feedback, media, food, docs, and governance
- meaningful menu names and route taxonomy
- live examples for light, dark, and auto color modes where relevant
- copy blocks for install, usage, rules, accessibility, and verification
- request-a-feature entry point using the public mailto lane

### 2. Install And Bootstrap Experience

Make first-time installation and upgrades deterministic.

Required functions:

- umbrella package install path
- granular package install path
- peer dependency matrix for Mantine, React, and Next/Vite
- Next.js App Router bootstrap
- Vite bootstrap
- `GdsProvider` and color-scheme script guidance
- compliance manifest starter
- verification command sequence
- upgrade guidance from `2.6.7` to `3.0.0`

### 3. Component And Pattern Contract Hardening

Move collected surface families from “documented” to “production-grade and demoed”.

Required functions:

- shells and navigation: `DiscoveryShell`, `DocsShell`, `ReferenceSiteShell`, `PublicShell`, `SidebarNav`, `PageHeader`
- actions: `ActionBar`, `SemanticButton`, semantic vocabulary packs, share buttons, CTA groups
- cards/listing: `ListingCard`, `PublicProductCard`, `PublicFoodCard`, `EditorialCard`, `ProductCard`
- browse/data: `BrowseSurface`, `DataToolbar`, `FilterDrawer`, responsive data views, simple data tables
- detail/profile: `DetailProfileShell`, section stacks, related content patterns
- maps/embeds/playback: `MapPanel`, `PlaybackSurface`, sanctioned iframe rules
- media/upload: `MediaField`, `UploadDropzone`, upload states, preview/reset/remove behavior
- access/auth: `AuthShell`, `ProviderIdentityButton`, `SocialAuthButtons`, `AccessSummary`, `AccessRecoveryPanel`
- docs/reference: `ReferenceSection`, `ReferenceLinkGrid`, code blocks, locale notices
- food/menu: `PublicFoodCard`, `FoodMenuSection`, freshness/pickup/scarcity semantics

### 4. Theme Governance 3.0

Make theme ownership unambiguous for adopters.

Required functions:

- official `3.0.0` theme-lane page
- preset selector and comparison UI on the reference site
- approved lanes: `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, `createPublicBrandTheme(...)`
- explicit deprecation guidance for consumer-facing `extendGdsTheme(...)`
- compliance checks for non-canonical local branding layers
- token/readability proof across light, dark, and auto schemes

### 5. Feature Intake And Triage

Add a simple public lane for missing functions without turning the repository into an unrelated backlog.

Required functions:

- request-a-feature page or section on GitHub Pages
- `mailto:moldovancsaba+general.design.system@gmail.com` link with prefilled subject/body
- triage policy: request -> review -> issue -> milestone -> implementation -> docs/demo -> release
- repository hygiene rule: only GDS issues belong in this repo and project board
- labels for `feature-request`, `needs-triage`, `3.0.0`, `client-impact`

### 6. Compliance And Migration Tooling

Make adoption enforceable and repeatable.

Required functions:

- strict GDS-only compliance profile
- manifest fields for required contracts and approved theme lanes
- detection for local shell/card/action/theme wrappers
- codemods for common migrations
- clear failure output with remediation paths
- fixture coverage for compliant and non-compliant consumer layouts

### 7. Release And Operational Safety

Cut 3.0.0 only when the package, docs, site, board, npm publication, and verification evidence are aligned.

Required functions:

- `VERSION` and all package versions move to `3.0.0` only during release prep
- changelog section for `3.0.0`
- docs version headers updated to `3.0.0`
- npm publish workflow validates all packages
- GitHub Pages deploy passes
- `npm run verify:release` passes
- `npm run verify:published` passes after publish
- `npm run audit:board:strict` passes before and after issue closure

## Delivery Waves

### Wave 1: 3.0.0 Release Governance

Outcome: project board, milestone, labels, release rules, and version policy are safe.

Deliverables:

- create `GDS 3.0.0 - Adoption Platform Release` milestone
- create independent production-grade issues for each wave
- keep old `2.6.7` milestones closed or archived after audit
- add docs explaining that `3.0.0` is the target while `2.6.7` remains current stable until release
- verify no unrelated issues remain in the repository

### Wave 2: Reference Site Coverage

Outcome: the GitHub Pages site is visibly complete and professional.

Deliverables:

- catalog every exported component
- add missing demos and usage examples
- expand pattern family navigation
- add state/theme/accessibility matrices
- add feature request page

### Wave 3: Install, Upgrade, And Bootstrap

Outcome: consumers can install and upgrade without clarification.

Deliverables:

- install guide rewrite for `3.0.0`
- Next.js and Vite templates
- upgrade prompt from `2.6.7` to `3.0.0`
- package/version compatibility matrix
- live install page on reference site

### Wave 4: Contract And Function Completion

Outcome: all collected functions have a package contract, docs, and demo or an explicit non-goal/exception.

Deliverables:

- media/upload contract
- date/time/reporting controls decision
- evidence/reporting panels
- chart/map/embed theming rules
- docs/reference shell and code-block polish
- access/auth recovery state hardening

### Wave 5: Enforcement And Migration

Outcome: teams can adopt GDS 3.0.0 and prove compliance.

Deliverables:

- strict compliance rule expansion
- fixtures for local drift
- codemod coverage
- migration playbook update
- failure-output documentation

### Wave 6: Release Cut

Outcome: 3.0.0 is published and deployable by clients.

Deliverables:

- version bump to `3.0.0`
- package build and publish
- GitHub release
- Pages deployment
- published package verification
- board audit and closure proof

## Execution Order

1. Normalize the GitHub project board around the `3.0.0` milestone.
2. Create only GDS-scoped issues; keep unrelated product work out of this repository.
3. Implement reference-site coverage first because it exposes missing functions fastest.
4. Harden install/bootstrap docs before asking clients to upgrade.
5. Complete missing contracts and demos.
6. Expand compliance and codemods.
7. Bump versions, publish packages, deploy Pages, and verify npm.

## Acceptance Criteria

- Every `3.0.0` issue is independently executable and has acceptance criteria.
- Every exported public package component appears on the reference site or is explicitly documented as internal/compatibility-only.
- Every required pattern family has docs, demo, accessibility notes, and state coverage.
- Install and upgrade paths are copy-paste safe.
- Theme governance has no ambiguous consumer-owned override path.
- Feature requests have a visible public intake lane.
- `npm run verify:release` passes.
- `npm run audit:board:strict` passes.
- All packages are published at `3.0.0`.
- GitHub Pages presents the `3.0.0` docs and live demo.

## Verification Commands

```bash
npm run audit:board:strict
npm run build
npm run lint
npm run test:run
npm run verify:references
npm run verify:mantine
npm run verify:release
npm run publish:dry-run
npm run publish:npm
npm run verify:published
```

## Rollback And Recovery

- If package publication fails, do not mark the release complete; keep `3.0.0` issues open until npm verification passes.
- If Pages deploy fails, keep the previous stable site live and fix the deploy before announcing 3.0.0.
- If compliance rules produce false positives, narrow the rule and keep docs/runtime changes intact.
- If a component contract is incomplete, mark it explicit `planned` or `pilot`; do not present it as required in 3.0.0 docs.

