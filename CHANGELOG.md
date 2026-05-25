# Changelog

All notable policy changes to the General Design System are recorded here.

## 2.4.2 - 2026-05-25

- Added `@gds/core` `PublicProductCard` for media-first public menu, catalog, and offer surfaces with price/state/action hierarchy.
- Added `es` locale support plus canonical `GdsLocale` and `getGdsMessages(locale)` exports for host-i18n bridges.
- Extended shared lint/compliance tooling to support manifest-driven approved dependency/import exceptions such as `lucide-react`.
- Updated compatibility, governance, and Pesti Est adoption docs for registry-first CI usage and locale/exception guidance.

## 2.4.1 - 2026-05-25

- Added `@gds/core` `AccessRecoveryPanel` as the canonical protected-content, expired-session, and recoverable failure surface.
- Updated component contracts to treat access recovery as a first-class shared pattern family.
- Resolved the learner-shell evaluation by documenting that LMS learner shells remain local adapters until broader portfolio reuse is proven.
- Updated Amanoba guidance to consume shared access recovery now while keeping learner shell, course cards, and gamification list cards local for now.

## 2.3.2 - 2026-05-25

- Added `@gds/core` `GameBoardTile` for memory-match and flip/select game boards (reduced-motion aware).
- Added `docs/AMANOBA_BLOCKING_CONTRACTS.md` scaffolds for remaining Amanoba-only surfaces (LearnerAppShell, course cards, recovery panel).
- Refreshed `GDS_GAP_INVENTORY.md` §2B to reflect 2.3.0–2.3.1 shipped package surfaces.
- Added Amanoba dark-shell + yellow CTA `extendGdsTheme` recipe appendix to `THEME_GOVERNANCE.md`.

## 2.4.0 - 2026-05-25

- Added `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` as machine-readable compatibility and adoption contracts.
- Added `@gds/eslint-config` and `@gds/compliance` to provide shared lint and compliance enforcement for adopting repositories.
- Added new public composition primitives in `@gds/core`: `PublicNav`, `PublicSiteFooter`, `DocsPageShell`, `DocsCodeBlock`, `CtaButtonGroup`, `PlaceholderPanel`, `SimpleDataTable`, and `StatsSection`.
- Expanded `@gds/theme` with `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, and root-provider theme/default color-scheme overrides.
- Added reference consumer fixtures under `apps/reference-vite` and `apps/reference-next`, plus `npm run verify:references` for fixture and manifest validation.
- Added `DEPRECATIONS_AND_MIGRATIONS.md` to formalize contract retirement, migration guidance, and release handover expectations.

## 2.3.1 - 2026-05-25

- Changed `@gds/core` `PageHeader` eyebrow styling to a neutral default, removing forced uppercase and decorative tracking from the canonical contract.
- Added opt-in `eyebrowVariant="ornamental"` for products that explicitly want decorative eyebrow styling.
- Removed forced hover motion and transform transitions from the canonical `@gds/theme` base theme.
- Added `withGdsMotion()` as an explicit opt-in theme helper for products that want shared motion styling.
- Expanded `COMPATIBILITY_AND_RELEASES.md` with an explicit Next.js App Router consumer path for `server` and `client` package entrypoints.

## 2.3.0 - 2026-05-24

- Added publish-ready package metadata and explicit `client` / `server` subpath exports for `@gds/theme`, `@gds/core`, and `@gds/admin`.
- Added `COMPATIBILITY_AND_RELEASES.md` to define the active Mantine/React/Next consumption contract, install guidance, and version-alignment rules.
- Added new shared package primitives and scaffolds for `MetricCard`, `ProgressCard`, `ProductCard`, `StateBlock`, `DataToolbar`, `PublicShell`, `AuthShell`, `ArticleShell`, `UploadDropzone`, `MediaCard`, `AccessSummary`, `ResponsiveDataView`, `WorkspaceHeader`, and `EditorScaffold`.
- Expanded admin primitives to support mobile footer navigation, richer page-header action slots, and shared empty-state handling in tables.
- Added release-alignment verification via `npm run verify:release` and a shared pull-request checklist template.
- Added `THEME_GOVERNANCE.md` and `EXCEPTION_SURFACES.md` to cover provider-brand, white-label, tenant-theme, chart, map, embed, and other approved exception surfaces.
- Added portfolio onboarding plans for Impact, Camera, and Pesti Est plus matrix rows reflecting their current GDS adoption pressure.

## 2.2.2 - 2026-05-24

- Updated `@gds/theme` `GdsProvider` to include Mantine modals and notifications so the shared provider matches the documented root composition contract.
- Added shared package i18n coverage for theme-toggle labels, empty-data messaging, and semantic error feedback.
- Added a shared Vitest + jsdom test harness plus behavior coverage for `@gds/theme`, `@gds/core`, and `@gds/admin`.
- Added root test commands and pull-request quality gates for build, lint, and tests.

## 2.2.1 - 2026-05-23

- Added `PROJECTS/NARIMATO.md` for Narimato (Mantine-rooted, enforcement phase).
- Updated `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` Narimato row from discovery to enforcement.
- Fixed `@gds/core` `ConfirmDialog` confirm button color: `brand` → `violet` (valid Mantine palette).

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

- Added root provider/theme implementation notes to the required project-adoption contract.

## 1.2.1 - 2026-05-21

- Added component contracts for date/time inputs, file uploads, loaders/skeletons, tooltips, breadcrumbs, and pagination.
- Expanded migration deliverables with provider/theme implementation notes plus validation and deletion checklist expectations.

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
