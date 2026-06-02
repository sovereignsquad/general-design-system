# Changelog

All notable policy changes to the General Design System are recorded here.

## 3.0.4 - 2026-06-02

- Added `cosmic` as the first intentionally high-saturation CSS VibeTheme, with a multicolour blue-violet-cyan-magenta background, star-field atmosphere, glass panels, and vivid gradient primary controls.
- Documented `cosmic` as the sanctioned dramatic showcase lane so consumers do not need route-local image backgrounds or private gradient systems for bold launch/public surfaces.

## 3.0.3 - 2026-06-02

- Added package-owned CSS VibeThemes for the colorful preset line so `sunset`, `oceanic`, `forest`, `ruby`, `amber`, `neon-night`, `skyline`, `aurora`, `coral`, `mint`, `orchid`, and `royal` now expose full canvas, shell, surface, border, text, accent, glow, gradient, and hero tokens instead of only changing `primaryColor`.
- Extended `useGdsThemePresetState(...)` to apply `data-gds-theme-preset` plus `--gds-vibe-*` CSS variables on the document root, making whole-site theme switching persistent across direct links and route changes.
- Updated the GitHub Pages Theme Lab with a visual VibeTheme gallery and current-token proof section, and documented the no-image-background/no-local-theme-catalog governance rule.

## 3.0.0 - 2026-05-31

- Delivered the adoption-platform release with hardened install/bootstrap docs, reference-site governance, public feature-request intake, media/upload contracts, reporting/evidence/chart contracts, auth/access identity hardening, strict compliance expansion, and verified reference codemods.
- Added 3.0.0 release-readiness checks covering board scope, implementation evidence, release safety, client communication, and registry verification gates.
- Updated the publish runbook so major releases require strict board audit before and after version bump and may not be announced until npm publication is verified.

## 2.6.7 - 2026-05-31

- Cut and published the `2.6.7` npm release line so the widened docs/reference-shell layout is available through the public package line and not only on repository `main`.
- Updated `DocsPageShell` in `@doneisbetter/gds-core` to use the full available page width for the official site and other reference/docs surfaces, removing the narrow article cap that was squeezing wide content such as the theme-governance explorer.
- Aligned the public site copy, install guidance, and versioned docs/routes to the `2.6.7` line.

## 2.6.5 - 2026-05-29

- Cut and published the `2.6.5` npm release line so consumers can update to the canonical theme-governance hardening through the public registry instead of relying on unpublished mainline changes.
- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.

## 2.6.4 - 2026-05-28

- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, the shipped public presets, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.
- Added `ReferenceSection`, `ReferenceLinkGrid`, `ReferenceLocaleNotice`, and `ReferenceThemeExplorer` to `@doneisbetter/gds-core` plus `ReferenceSiteShell` to `@doneisbetter/gds-admin` so the official website can consume GDS-owned docs/reference primitives instead of site-local Mantine composition.
- Converted `apps/playground` onto the new reference-site primitives, replaced the remaining direct page-level Mantine composition in the public site source, and added a strict `gds-adoption.json` baseline for the website.
- Updated the public route structure, docs copy, and rulebooks so the GitHub Pages site is described as both the official GDS website and a strict live reference consumer rather than a separate playground exception.
- Added the registry-backed GitHub Pages pattern catalog under `/patterns` with dedicated family routes for foundations, public, operations, data, access, and feedback coverage.
- Expanded the public docs site to show live demos for the remaining workflow and responsive-guidance contracts that had previously been represented only as reference notes.
- Hardened the GitHub Pages playground with route-level lazy loading, deterministic vendor chunking, and contained shell previews so the public site behaves like a documentation site instead of a nested application demo.
- Added an interactive `/themes` explorer so adopters can switch among shipped theme presets, test light/dark behavior, inspect the bounded creator-authored theming lane, and compare theme lanes directly on the public site.
- Added a dedicated `/live-demos` hub so the public website separates official docs from runtime showcase sections more clearly.
- Strengthened `@doneisbetter/gds-compliance` exception enforcement to fail stale exception scopes, uncovered local exception adapters, and incomplete creator-authored experience exception metadata.
- Updated theme governance, exception-surface, compliance, and adoption rulebooks to formalize the creator-authored experience contract and the new repo-to-manifest exception checks.
- Added `SocialAuthButtons` to `@doneisbetter/gds-core` as the canonical provider-entry cluster for Google, Apple, GitHub, Microsoft, LinkedIn, Discord, X, Facebook, and email-shaped auth lanes.
- Added `ShareButtonGroup` to `@doneisbetter/gds-core` as the canonical public sharing surface for native share, copy-link, email, message, and social-channel actions.
- Enhanced `AuthShell` to support governed social-auth placement and divider rhythm instead of consumer-local auth-provider layouts.
- Published the umbrella install path `@doneisbetter/gds` as the preferred public npm entrypoint while keeping the granular runtime packages available for stricter dependency boundaries.
- Aligned release automation and public documentation so npm publication, GitHub Pages guidance, and release-bundle fallback distribution target the same live release line.

## 2.6.3 - 2026-05-27

- Added `showGdsNotification(...)` to `@doneisbetter/gds-theme/client` as the canonical semantic notification helper for consumers already governed by the shared provider stack.
- Enhanced `AuthShell` with `headerActions` so products can place theme toggles or other small auth-entry controls without rebuilding the shell locally.
- Enhanced `PageHeader` to accept `subtitle` as an alias for `description`, reducing consumer-only adapter code.
- Hardened `SemanticButton` to use the label-first prerender path by default, removing the need for client repos to carry their own hydration-safe semantic-button wrappers.

## 2.6.2 - 2026-05-27

- Expanded shared Mantine peer support to include `^9.0.0` across the runtime packages and verified fresh packed-consumer installs against Mantine `9.2.1`, React `19.2.0`, and Next `15.5.18`.
- Added `npm run verify:mantine` as the canonical compatibility command and broadened the smoke harness to cover both Mantine `8.3.6` and `9.2.1` in isolated clean installs.
- Added root optional native bindings for supported macOS and Linux x64 environments so fresh local `npm install` runs provision the Vite/tsup native layer more reliably.
- Updated README, compatibility guidance, migration guidance, release runbook, and consumer-install proof docs to reflect the Mantine 9 support line and the current temporary release-asset install path.
- Added `ChoiceChip` to `@doneisbetter/gds-core` as the canonical neutral chip for lightweight filter, scope, taxonomy, and mode selection without page-local badge wrappers.
- Added `getSemanticActionLabel(...)` to `@doneisbetter/gds-core` as a server-safe semantic-label helper for SSR/static fallback rendering without exposing raw vocabulary access as the only consumer path.
- Recorded the current Narimato reference-consumer audit and updated the Narimato project note to reflect direct npm package consumption plus its intentionally local exceptions.

## 2.6.1 - 2026-05-26

- Renamed the public package line from the unpublished placeholder `@gds/*` scope to the real npm organization scope `@doneisbetter/gds-*`.
- Updated package metadata, workspace wiring, reference consumers, compliance manifests, docs, and release scripts to consume the `@doneisbetter/gds-*` package family consistently.
- Fixed release-environment dependency gaps (`@floating-ui/core`, `@humanfs/core`, and `@babel/core`) so local and CI release verification run cleanly on the current toolchain.
- Updated the packed Mantine 8 compatibility harness to install the renamed tarballs correctly and verified the `@doneisbetter/gds-*` line against Mantine `8.3.6`, React `19.2.0`, and Next `15.5.18`.
- Clarified npm as the canonical future registry source and documented public GitHub release assets as the approved temporary install path while npm publication remains unavailable.
- Added `npm run pack:release`, release-bundle checksums/manifests, and the `GDS Release Bundles` GitHub Actions workflow.
- Added `VERIFIED_CONSUMER_INSTALL_PROOF.md` to make the current Next 15 / React 19 / Mantine 8 install evidence explicit for adopter teams.

## 2.6.0 - 2026-05-26

- Added `SectionPanel` and `ConsumerDashboardGrid` to `@doneisbetter/gds-core` as the canonical operational panel rhythm and consumer dashboard layout scaffolds.
- Hardened shared operational contracts in `@doneisbetter/gds-admin`: `AppShell` now supports primary/secondary/account navigation regions and header context, `PageHeader` now supports subtitle/status/overflow actions, `ResponsiveDataView` now supports active filter chips plus mobile filter surfaces, and `EditorScaffold` / `ContentOpsEditor` now support context and sticky footer action regions.
- Enhanced `@doneisbetter/gds-core` `BrowseSurface`, `EditorialCard`, `FilterDrawer`, and `MediaField` to reduce remaining local public/gds-admin overrides.
- Added `createPublicBrandTheme()` to `@doneisbetter/gds-theme` and formalized the branded public theme merge path.
- Widened shared Mantine peer ranges to include `8.3.x` and added `npm run verify:mantine8` as a packed-consumer compatibility smoke for Mantine 8.3.6 + React 19.2.0 + Next 15.5.18.
- Documented the canonical searchable-selection decision: use governed Mantine recipe composition rather than a new shared wrapper until a stronger repeated contract emerges.

## 2.5.1 - 2026-05-25

- Expanded `@doneisbetter/gds-compliance` with configurable banned imports plus default stale-SSOT reference detection so consumer repos can catch lingering legacy UI dependencies and outdated documentation paths through shared tooling.
- Added [COMPLIANCE_TOOLKIT.md](/Users/Shared/Projects/general-design-system/COMPLIANCE_TOOLKIT.md) as the canonical CI and local enforcement contract for `@doneisbetter/gds-eslint-config` and `@doneisbetter/gds-compliance`.
- Updated template and adoption artifacts to use the canonical repository path and the current machine-readable manifest contract.

## 2.5.0 - 2026-05-25

- Added new cross-project public and consumer contracts in `@doneisbetter/gds-core`: `BrowseSurface`, `EditorialCard`, `ConsumerSection`, and `MediaField`.
- Added new content-operations contracts in `@doneisbetter/gds-admin`: `ContentOpsEditor`, `ContentOpsSection`, and `ContentOpsActionBar`.
- Added `gdsEditorialPublicTheme` to `@doneisbetter/gds-theme` as the approved serif-forward, flatter editorial preset.
- Added `ADOPTION_AND_MIGRATION_PLAYBOOK.md` plus manifest-driven compliance settings for documentation paths, stale-reference detection, and protected surface declarations.
- Updated the Next.js and Vite reference consumers plus shared component tests to exercise the new browse, consumer, media, and content-operations contracts.

## 2.4.4 - 2026-05-25

- Enhanced `PublicShell` with canonical header variants, class-name hooks, and server-safe mobile navigation modes so public consumers can stop shipping repo-local spacing and nav overrides.
- Enhanced `PublicBrandFooter` with documented layout variants and slot-level class hooks for narrative, media, quote, and legal regions.
- Enhanced `PublicProductCard` with localized state-label overrides plus pickup and inventory helper-note support for menu, discovery, and retail-like public surfaces.
- Updated the Vite and Next.js reference consumers plus shared component tests to exercise the new public-surface contracts end to end.

## 2.4.3 - 2026-05-25

- Added `AccentPanel` as the canonical light/dark-safe accent surface contract for public and operator-facing emphasis panels.
- Added `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` to `@doneisbetter/gds-core` for shared public/editorial composition without repo-local layout authority.
- Hardened release verification with export-contract checks that fail on missing published export targets or server entrypoints that drift into client-only modules.
- Updated the Next.js and Vite reference consumers to exercise the new public/editorial primitives and the server-safe import path.
- Added an authenticated publish runbook and shared `publish:dry-run` / `publish:npm` scripts for the five public GDS packages.
- Added `verify:published` plus a manual GitHub Actions publish workflow so authenticated CI can publish and verify registry availability with bounded retry behavior.

## 2.4.2 - 2026-05-25

- Added `@doneisbetter/gds-core` `PublicProductCard` for media-first public menu, catalog, and offer surfaces with price/state/action hierarchy.
- Added `es` locale support plus canonical `GdsLocale` and `getGdsMessages(locale)` exports for host-i18n bridges.
- Extended shared lint/gds-compliance tooling to support manifest-driven approved dependency/import exceptions such as `lucide-react`.
- Updated compatibility, governance, and Pesti Est adoption docs for registry-first CI usage and locale/exception guidance.

## 2.4.1 - 2026-05-25

- Added `@doneisbetter/gds-core` `AccessRecoveryPanel` as the canonical protected-content, expired-session, and recoverable failure surface.
- Updated component contracts to treat access recovery as a first-class shared pattern family.
- Resolved the learner-shell evaluation by documenting that LMS learner shells remain local adapters until broader portfolio reuse is proven.
- Updated Amanoba guidance to consume shared access recovery now while keeping learner shell, course cards, and gamification list cards local for now.

## 2.3.2 - 2026-05-25

- Added `@doneisbetter/gds-core` `GameBoardTile` for memory-match and flip/select game boards (reduced-motion aware).
- Added `docs/AMANOBA_BLOCKING_CONTRACTS.md` scaffolds for remaining Amanoba-only surfaces (LearnerAppShell, course cards, recovery panel).
- Refreshed `GDS_GAP_INVENTORY.md` §2B to reflect 2.3.0–2.3.1 shipped package surfaces.
- Added Amanoba dark-shell + yellow CTA `extendGdsTheme` recipe appendix to `THEME_GOVERNANCE.md`.

## 2.4.0 - 2026-05-25

- Added `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` as machine-readable compatibility and adoption contracts.
- Added `@doneisbetter/gds-eslint-config` and `@doneisbetter/gds-compliance` to provide shared lint and compliance enforcement for adopting repositories.
- Added new public composition primitives in `@doneisbetter/gds-core`: `PublicNav`, `PublicSiteFooter`, `DocsPageShell`, `DocsCodeBlock`, `CtaButtonGroup`, `PlaceholderPanel`, `SimpleDataTable`, and `StatsSection`.
- Expanded `@doneisbetter/gds-theme` with `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, and root-provider theme/default color-scheme overrides.
- Added reference consumer fixtures under `apps/reference-vite` and `apps/reference-next`, plus `npm run verify:references` for fixture and manifest validation.
- Added `DEPRECATIONS_AND_MIGRATIONS.md` to formalize contract retirement, migration guidance, and release handover expectations.

## 2.3.1 - 2026-05-25

- Changed `@doneisbetter/gds-core` `PageHeader` eyebrow styling to a neutral default, removing forced uppercase and decorative tracking from the canonical contract.
- Added opt-in `eyebrowVariant="ornamental"` for products that explicitly want decorative eyebrow styling.
- Removed forced hover motion and transform transitions from the canonical `@doneisbetter/gds-theme` base theme.
- Added `withGdsMotion()` as an explicit opt-in theme helper for products that want shared motion styling.
- Expanded `COMPATIBILITY_AND_RELEASES.md` with an explicit Next.js App Router consumer path for `server` and `client` package entrypoints.

## 2.3.0 - 2026-05-24

- Added publish-ready package metadata and explicit `client` / `server` subpath exports for `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`.
- Added `COMPATIBILITY_AND_RELEASES.md` to define the active Mantine/React/Next consumption contract, install guidance, and version-alignment rules.
- Added new shared package primitives and scaffolds for `MetricCard`, `ProgressCard`, `ProductCard`, `StateBlock`, `DataToolbar`, `PublicShell`, `AuthShell`, `ArticleShell`, `UploadDropzone`, `MediaCard`, `AccessSummary`, `ResponsiveDataView`, `WorkspaceHeader`, and `EditorScaffold`.
- Expanded admin primitives to support mobile footer navigation, richer page-header action slots, and shared empty-state handling in tables.
- Added release-alignment verification via `npm run verify:release` and a shared pull-request checklist template.
- Added `THEME_GOVERNANCE.md` and `EXCEPTION_SURFACES.md` to cover provider-brand, white-label, tenant-theme, chart, map, embed, and other approved exception surfaces.
- Added portfolio onboarding plans for Impact, Camera, and Pesti Est plus matrix rows reflecting their current GDS adoption pressure.

## 2.2.2 - 2026-05-24

- Updated `@doneisbetter/gds-theme` `GdsProvider` to include Mantine modals and notifications so the shared provider matches the documented root composition contract.
- Added shared package i18n coverage for theme-toggle labels, empty-data messaging, and semantic error feedback.
- Added a shared Vitest + jsdom test harness plus behavior coverage for `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`.
- Added root test commands and pull-request quality gates for build, lint, and tests.

## 2.2.1 - 2026-05-23

- Added `PROJECTS/NARIMATO.md` for Narimato (Mantine-rooted, enforcement phase).
- Updated `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` Narimato row from discovery to enforcement.
- Fixed `@doneisbetter/gds-core` `ConfirmDialog` confirm button color: `brand` → `violet` (valid Mantine palette).

## 2.2.0 - 2026-05-23

- Added `SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md` to define the GDS as a reliable, cross-project service with authority, pattern, adoption, validation, portfolio, and lifecycle layers.
- Added `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` to classify projects by foundation signals, migration archetypes, risk, and recommended next actions.
- Added `PROJECTS/MESSMASS_MANTINE_REFACTOR.md` to address the highest known authority-conflict project in the portfolio.
- Expanded `PATTERN_SERVICE_MODEL.md` with required service outputs, contract maturity states, compatibility promises, and portfolio usage guidance.
- Expanded `GOVERNANCE_AND_ADOPTION.md` with authority-conflict handling, adapter-inventory checks, portfolio operations, and normalized remediation categories.

## 2.1.0 - 2026-05-23

- Added `PATTERN_SERVICE_MODEL.md` as the cross-project operating model for borrowing Mantine UI ideas and promoting them into governed GDS contracts.
- Defined mandatory reusable pattern families for shells, page headers, product cards, metrics, data toolbars, responsive data views, auth shells, article/docs shells, and state blocks.
- Added cross-project recommendations for Amanoba, KIDEX, ClassScout, and SSO so each project has a concrete Mantine-only pattern-service implementation path.
- Updated foundation, component, governance, and README guidance to prohibit page-local reinvention of reusable patterns and to require local adapter paths for shared contracts.

## 2.0.0 - 2026-05-22

- **Massive Consolidation & Hardening:** Refactored the sprawling 17-file structure into 3 hardened, professional rulebooks (`FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, and `GOVERNANCE_AND_ADOPTION.md`).
- Eliminated all outdated, duplicated, and inconsistent language.
- Enforced a strictly professional, prescriptive tone for all Mantine, UX, and Token boundaries.

## 1.3.3 - 2026-05-22

- Added the normative color-mode and readability contract for dark mode, light mode, contrast, mixed-mode exceptions, and Mantine theme responsibilities.
- Updated foundation and runtime guidance to make human readability and active-mode consistency release gates.

## 1.3.2 - 2026-05-21

- Updated the Amanoba migration plan from planned to in-progress.
- Recorded completed Amanoba Phase 0/1 runtime work, active Mantine guardrails, and the current course-surface migration snapshot.
- Added remaining Amanoba high-priority gaps for lesson runtime, quiz runtime, final exam, auth, dashboard, saved lessons, practice hub, admin/editor forms, and deletion-phase legacy dependencies.

## 1.3.1 - 2026-05-21

- Updated the SSO migration plan to mark admin-shell migration and legacy theme-stack removal as completed.
- Clarified the SSO path toward the remaining docs/editorial migration and final deletion pass.

## 1.3.0 - 2026-05-21

- Added a primitive policy matrix for direct-versus-wrapper decisions.
- Added implementation tables for variants, sizes, breakpoints, shell switches, and responsive behavior.
- Added enforcement guidance for lint rules, import boundaries, and drift checks.
- Added reusable starter templates for providers, theme, shell, page header, and button wrappers.
- Updated runtime, readiness, and README guidance to point directly to the new implementation assets.

## 1.2.3 - 2026-05-21

- Promoted implementation-readiness checks into the required reading order.

## 1.2.2 - 2026-05-21

- Added root provider/gds-theme implementation notes to the required project-adoption contract.

## 1.2.1 - 2026-05-21

- Added component contracts for date/time inputs, file uploads, loaders/skeletons, tooltips, breadcrumbs, and pagination.
- Expanded migration deliverables with provider/gds-theme implementation notes plus validation and deletion checklist expectations.

## 1.2.0 - 2026-05-21

- Tightened the SSOT from “Mantine preferred/first” language to an explicit Mantine-only product primitive policy.
- Clarified that no new product UI may bypass Mantine with ad hoc primitives or alternate component frameworks.
- Updated migration, governance, adoption, and KIDEX adapter language to reflect the stricter policy.
- Added `MANTINE_RUNTIME.md` to define provider, theme, notifications, modals, wrapper, CSS, form, overlay, and data-display runtime requirements.

## 1.1.0 - 2026-05-21

- Expanded the SSOT into a stricter multi-project policy repository.
- Added Mantine platform policy and navigation/responsive rules to the required reading order.
- Tightened component, foundation, UX, governance, and project-adoption contracts for cross-project enforcement.
- Clarified that product repositories may document only adapters, exceptions, migration state, and validation commands.
- Added repository hygiene rules for shared Git usage across consuming projects.
- Added implementation-readiness requirements so projects document root provider, theme ownership, primitive policy, legacy boundaries, responsive strategy, and drift controls before the first Mantine PR.
- Expanded the SSO project plan with local-adapter requirements, phase exit criteria, validation commands, and initial implementation sequence.

## 1.0.0 - 2026-05-21

- Established `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` as the cross-project design, UI, and UX SSOT.
- Added normative foundation rules for theme ownership, tokens, layout, accessibility, responsiveness, and internationalization.
- Added strict component contracts for buttons, icon buttons, inputs, forms, cards, modals, drawers, tables, navigation, alerts, notifications, empty states, loaders, errors, and pagination.
- Added UX rules for app shells, dashboards, learner flows, admin/editor flows, destructive actions, authentication, search, filters, responsive behavior, and content tone.
- Added governance rules for adoption, project adapters, exceptions, review, migration order, and definition of done.
- Added the project adoption contract that each project must reference in its local documentation.
- Added a true-refactor Mantine migration playbook for legacy projects.
- Added project-specific migration planning under `PROJECTS/`, including the initial SSO refactor plan.
- Added contributing guidance for operating this directory as a shared standalone git repository.
