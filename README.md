# General Design System

Status: Active SSOT
Version: 6.1.0
Last updated: 2026-08-09

`/Users/Shared/Projects/general-design-system` is the cross-project single source of truth for design, UI, and UX.

## Use with AI coding agents

GDS is built to be consumed by AI coding agents, not just humans:

- **Universal entry point:** [`llms.txt`](llms.txt) — the machine-readable index any LLM coding tool can read: what GDS is, install, the non-negotiable rules, packages, component families, and where to read more.
- **Agent usage guide:** [`docs/AI_AGENT_GUIDE.md`](docs/AI_AGENT_GUIDE.md) — how an agent installs, wraps the app in `GdsProvider`, styles with props/tokens, and honors the GDS contracts.
- **Drop-in repo rules:** [`TEMPLATES/AGENTS.md.template`](TEMPLATES/AGENTS.md.template) (the cross-tool `AGENTS.md` standard) — copy into a consuming repo as `AGENTS.md` so every agent session builds with GDS automatically.
- **Creating a new GDS theme:** [`TEMPLATES/GDS_THEME_CREATION_PROMPT.md`](TEMPLATES/GDS_THEME_CREATION_PROMPT.md) — a copy-pasteable brief for any Claude session (Claude Code, Claude for Design, or plain claude.ai) to prepare a new environment and build a theme lane, including how to responsibly import an externally-produced design (a Figma file, a screenshot, Claude Design output) instead of copying it directly. See [`CONTRIBUTING.md`](CONTRIBUTING.md#importing-an-externally-designed-theme) and [`THEME_GOVERNANCE.md`](THEME_GOVERNANCE.md) for the governing rules.

The quickest start for any agent: install `@sovereignsquad/gds`, wrap the app once in `GdsProvider`, and compose shipped components — never raw Mantine primitives or custom CSS.

## How to Use This Design System

This repository serves as the central, hardened hub for all UI, UX, and design patterns across projects. It is organized around strict foundation rules, reusable component contracts, a cross-project pattern service model, and governance requirements.

### Getting Started

> **Mandatory first step for consumers:** import the GDS stylesheet exactly once at your app entry, before your own app styles — `import '@sovereignsquad/gds-theme/styles.css'`. Without it, GDS surfaces (including dropdown/menu/overlay backgrounds) render unstyled. See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).

1. **Familiarize Yourself with the Foundation**: Start by reading [FOUNDATION.md](FOUNDATION.md) to understand the core principles, accessibility baselines, and our strict Mantine token policies.
2. **Review the Component Contracts**: Before building a new UI component or workflow, check [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md) to see if a canonical pattern already exists for buttons, tables, modals, public shells, docs pages, or public data surfaces.
3. **Open the Live Pattern Catalog**: Use [https://sovereignsquad.github.io/general-design-system/patterns](https://sovereignsquad.github.io/general-design-system/patterns) to inspect the public, registry-backed reference site that demonstrates the documented contracts directly.
4. **Use the Pattern Service Model**: Before borrowing from Mantine UI or another project, read [PATTERN_SERVICE_MODEL.md](PATTERN_SERVICE_MODEL.md) to convert references into governed, reusable contracts.
5. **Read the Service Backbone Plan**: Use [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) to understand how the GDS operates as a reliable, cross-project service with adoption, validation, and portfolio layers.
6. **Adopt & Migrate**: Use [GOVERNANCE_AND_ADOPTION.md](GOVERNANCE_AND_ADOPTION.md) to understand how to correctly implement this system in a new or legacy codebase, including the required local project statement, the adoption manifest, and compliance tooling.
7. **Run the Adoption Playbook**: Use [ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md) when converting a local mirror, a legacy UI system, or a new product to direct package consumption.
8. **Check Compatibility & Release Rules**: Use [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) before wiring package installs, CI/Vercel builds, or framework upgrades.

> **Prefer to learn by building?** Follow the hands-on
> [Tutorial: Build a CRUD Admin Screen with GDS Primitives](docs/TUTORIAL_CRUD_ADMIN_SCREEN.md)
> to assemble a real list/detail/create/update screen from the governed resource,
> form, table, and shell primitives, step by step.

### What You Can Find Here

- **Core Principles & Tokens**: [FOUNDATION.md](FOUNDATION.md) — The fundamental rules that guide UI decisions, dark/light modes, and Mantine boundaries.
- **Component Contracts & Patterns**: [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md) — Required behaviors for standard UI elements and full-page workflows.
- **Live Pattern Catalog**: [https://sovereignsquad.github.io/general-design-system/patterns](https://sovereignsquad.github.io/general-design-system/patterns) — The public registry-backed component and pattern reference site with family pages for foundations, public, operations, data, access, and feedback coverage.
- **API Reference**: [https://sovereignsquad.github.io/general-design-system/api](https://sovereignsquad.github.io/general-design-system/api) and [API_REFERENCE.md](API_REFERENCE.md) — Registry-backed package export reference with import paths, runtime lanes, accessibility notes, state contracts, and verification coverage.
- **Maturity Capabilities**: [https://sovereignsquad.github.io/general-design-system/maturity](https://sovereignsquad.github.io/general-design-system/maturity) — The seven recommended high-value capability groups with issue links, package lanes, benefits, accessibility, observability, rollback, testing, and product-owner delivery value in every supported site language.
- **Product Use Cases**: [https://sovereignsquad.github.io/general-design-system/use-cases](https://sovereignsquad.github.io/general-design-system/use-cases) and [USER_GUIDE.md](USER_GUIDE.md) — Product-owner adoption guide for choosing GDS package lanes and operational checks.
- **CLI and Low-Level Design**: [CLI_AND_LLD.md](CLI_AND_LLD.md) — Verification command inventory and the low-level docs/i18n architecture.
- **Coverage Matrix**: [https://sovereignsquad.github.io/general-design-system/coverage](https://sovereignsquad.github.io/general-design-system/coverage) — Route-level parity view of documented patterns versus live runtime representation status.
- **Interactive Theme Lab**: [https://sovereignsquad.github.io/general-design-system/themes](https://sovereignsquad.github.io/general-design-system/themes) — Live testing for shipped theme presets, colorful app lanes, light/dark behavior, token surfaces, and the bounded creator-authored theming lane.
- **Feature request intake**: [https://sovereignsquad.github.io/general-design-system/request-feature](https://sovereignsquad.github.io/general-design-system/request-feature) — Canonical intake for capability requests, governance questions, and missing contracts.
- **Repository hygiene rule**: only reusable GDS components, patterns, docs, compliance, migration, release, or package work belongs on this repository's [issue board](PROJECT_BOARD.md). Product-specific requests must be transferred or closed with an explicit owner.
- **Pattern Service Model**: [PATTERN_SERVICE_MODEL.md](PATTERN_SERVICE_MODEL.md) — The reusable cross-project process for borrowing Mantine-native patterns, promoting them into contracts, and enforcing consistency.
- **Service Backbone Plan**: [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) — The operating model that makes the GDS reliable, adaptable, and replicable across a portfolio of projects.
- **GDS 3.0.0 Implementation Plan**: [GDS_3_0_IMPLEMENTATION_PLAN.md](GDS_3_0_IMPLEMENTATION_PLAN.md) — The next major-release plan for the adoption platform, reference site, feature intake, compliance, and release process.
- **Governance & Migration**: [GOVERNANCE_AND_ADOPTION.md](GOVERNANCE_AND_ADOPTION.md) — Strict rules on how projects must adopt the system, review PRs, and deprecate old code.
- **Adoption & Migration Playbook**: [ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md) — The canonical step-by-step path from local mirrors or legacy UI systems to direct `@sovereignsquad/gds` or granular `@sovereignsquad/gds-*` package consumption.
- **Compatibility & Releases**: [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) — Supported Mantine/React/Next ranges, subpath exports, version alignment, and upgrade expectations.
- **Documentation Versioning**: [docs/DOCUMENTATION_VERSIONING.md](docs/DOCUMENTATION_VERSIONING.md) — How to read docs for a specific version: current major on `main`/the live site, and every released version (including the previous major `2.x` at `gds-v2.6.5`) immutably addressable at its `gds-v*` release tag, plus the support policy.
- **Case Study — ClassScout**: [docs/CASE_STUDY_CLASSSCOUT.md](docs/CASE_STUDY_CLASSSCOUT.md) — How a real consumer integration's 10 blocking gaps became 10 governed, reusable GDS components instead of app-local one-offs.
- **Case Studies by Screen**: [docs/CASE_STUDIES_BY_SCREEN.md](docs/CASE_STUDIES_BY_SCREEN.md) — Three screen-organized case studies (list-detail admin, public discovery, kiosk/large-screen) composed from the canonical layout templates and walked across the named size classes, plus the recorded foldable/dual-screen decision.
- **Dependency Governance**: [DEPENDENCY_GOVERNANCE.md](DEPENDENCY_GOVERNANCE.md) — React, Mantine, and Tabler dependency classes, import boundaries, exception lifecycle, compatibility gates, and risk reporting.
- **Installation Guide**: [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) — The canonical production install path, runtime bootstrap, verification sequence, and common setup mistakes for consumers.
- **Release Publish Runbook**: [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) — Authenticated npm publish flow, dry-run command, and recovery guidance.
- **Verified Consumer Install Proof**: [VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) — The current evidence for Next 15 / React 19 / Mantine 8 and 9 package consumption plus the canonical npm install path.
- **Compliance Toolkit**: [COMPLIANCE_TOOLKIT.md](COMPLIANCE_TOOLKIT.md) — Shared lint, manifest validation, stale-doc detection, banned-import governance, and repo-level drift checks.
- **Reference Codemods**: [scripts/codemods/README.md](scripts/codemods/README.md) — Narrow, production-safe migration helpers for shells, actions, listing cards, Mantine controls, Tabler icons, raw controls, inline styles, alerts/confirms, and tables, verified by `node scripts/verify-codemods.mjs`.
- **Layout Primitives**: [docs/LAYOUT_PRIMITIVES.md](docs/LAYOUT_PRIMITIVES.md) — Governed Box, Stack, Inline, Cluster, Grid, Split, Sidebar, Bleed, and Container composition APIs with responsive token props and replacement guidance.
- **Safe Styling API**: [docs/SAFE_STYLING.md](docs/SAFE_STYLING.md) — Token-backed style contracts, media wrappers, overflow wrappers, responsive visibility, scanner guidance, and do-not-use examples.
- **Icon Registry**: [docs/ICON_REGISTRY.md](docs/ICON_REGISTRY.md) — Semantic `GdsIcon`, `GdsIcons`, metadata, aliases, accessibility defaults, and direct-import replacement guidance.
- **Notification Center**: [docs/NOTIFICATION_CENTER.md](docs/NOTIFICATION_CENTER.md) — Unified notification queue, severity/state policy, retry behavior, screen-reader announcements, metadata-only audit events, and disabled-provider rollback semantics.
- **Motion System**: [docs/MOTION_SYSTEM.md](docs/MOTION_SYSTEM.md) — Duration/easing tokens, overlay/list/feedback/skeleton/state presets, reduced-motion/no-motion fallbacks, CSS variables, and the `useGdsReducedMotion` client hook.
- **Overlay System**: [docs/OVERLAY_SYSTEM.md](docs/OVERLAY_SYSTEM.md) — Modal, drawer, sheet, command, nesting, close policy, focus return, route recovery, mobile-fullscreen, and overlay-event governance.
- **Responsive & Platform Guidance**: [docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md](docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md) — Named size-class semantics, per-screen-size best practices (compact → xlarge / TV / kiosk), canonical layout templates (list-detail, supporting-pane), and the explicit scope decisions for PWA (partial build) and multi-screen (documented non-goal with a foldable exception).
- **PWA Viewport & Zoom Policy**: [docs/PWA_VIEWPORT_POLICY.md](docs/PWA_VIEWPORT_POLICY.md) — Canonical `<meta name="viewport">` content via `getGdsPwaViewportMetaContent(...)`, the reviewed `app-shell-fixed` (zoom-disabled) exception lane for installed PWA app shells, and its required WCAG 1.4.4/1.4.10 mitigations.
- **Confirmation Service**: [docs/CONFIRMATION_SERVICE.md](docs/CONFIRMATION_SERVICE.md) — Typed destructive action requests, risk copy, async execution, retry, undo windows, focus return, and metadata-only confirmation events.
- **Form Orchestration**: [docs/FORM_ORCHESTRATION.md](docs/FORM_ORCHESTRATION.md) — Advanced validation, dirty state, autosave, optimistic submit, server error mapping, retry, draft restore, and metadata-only form events.
- **Schema Forms**: [docs/SCHEMA_FORMS.md](docs/SCHEMA_FORMS.md) — JSON Schema, OpenAPI, and Zod-like adapters for generated GDS forms with i18n keys, required metadata, validation, renderer overrides, and accessibility wiring. Field types include `checkbox-group` (themed grouped multi-select rendered with the governed Mantine `Checkbox`, not a raw native input) and `repeatable` (add-another-row of N sub-fields); all validation messages and `repeatable` aria-live announcements are localized across the 12 supported locales, and the date field types require the opt-in `@sovereignsquad/gds-theme/dates.css` import.
- **I18n Runtime**: [docs/I18N_RUNTIME.md](docs/I18N_RUNTIME.md) — Pluralization, number/currency/date/relative-time formatting, locale-aware sorting, RTL direction utilities, text-expansion fixtures, and missing-key telemetry.
- **Content Design System**: [docs/CONTENT_DESIGN.md](docs/CONTENT_DESIGN.md) — Voice/tone, errors, retry copy, destructive confirmations, empty states, permission messages, CTAs, form hints, success feedback, placeholder contracts, and localization-safe templates.
- **Design-To-Code Handoff**: [docs/DESIGN_HANDOFF.md](docs/DESIGN_HANDOFF.md) — Figma component mapping, token variable mapping, handoff status, prop annotations, state semantics, accessibility annotations, report generation, and stale/missing mapping validation.
- **Figma UI Kit — Build & Sync Playbook**: [docs/FIGMA_UI_KIT.md](docs/FIGMA_UI_KIT.md) — The documented sync path that produces a 1:1 Figma kit from GDS's authoritative substrate (DTCG variables + the handoff component/variable mapping), keeping code tokens authoritative, with the GDS-owned vs. design-owned publication boundary.
- **Evaluation Tooling & Tokenless Adoption**: [docs/EVALUATION_TOOLING.md](docs/EVALUATION_TOOLING.md) — Why a tokenless in-browser sandbox is a package-distribution decision (public npm) rather than a tooling one, the recommendation, the interim read→run path (live site + reference apps), and the re-evaluation trigger.
- **Data Table Engine**: [docs/DATA_TABLE_ENGINE.md](docs/DATA_TABLE_ENGINE.md) — Headless and visual table APIs for local/remote data, sorting, filtering, pagination, selection, export requests, mobile cards, state recovery, and virtualized windows.
- **Resource Manager**: [docs/RESOURCE_MANAGER.md](docs/RESOURCE_MANAGER.md) — CRUD/list/detail/edit/delete/activate/archive/copy-preview workflow framework with typed adapters, permissions, destructive confirmation boundaries, and metadata-only events.
- **Asset Manager**: [docs/ASSET_MANAGER.md](docs/ASSET_MANAGER.md) — Upload queue, validation, progress, retry, preview cards, thumbnails, display modes, alt/caption metadata policy, and failed asset recovery.
- **Access Gate and Paywall Runtime**: [docs/ACCESS_GATE.md](docs/ACCESS_GATE.md) — Canonical teaser/paywall contract, auth adapter boundary, protected-content non-rendering policy, metadata-only events, retries, rollback, testing, and live-proof route.
- **Task Patterns**: [docs/TASK_PATTERNS.md](docs/TASK_PATTERNS.md) — Structured best-practice workflow contracts for create resource, review submission, bulk approve, failed upload recovery, copy public link, publish toggle, and destructive confirmation tasks.
- **Production Page Templates**: [docs/PAGE_TEMPLATES.md](docs/PAGE_TEMPLATES.md) — Package-native admin dashboard, settings, resource manager, CRUD editor, analytics, public event, error page, and empty-state page templates with typed slots, required states, accessibility, telemetry events, and rollback guidance.
- **Theme Governance**: [THEME_GOVERNANCE.md](THEME_GOVERNANCE.md) — Brand extension, dark-mode defaults, white-label, flat-surface, and tenant-theme rules.
- **Default Semantic-Role Tokens**: [docs/SEMANTIC_ROLE_TOKENS.md](docs/SEMANTIC_ROLE_TOKENS.md) — The base `gdsTheme`'s canonical `--gds-bg-*`/`--gds-text-*`/`--gds-border-card` role layer defined at `:root`, its per-token-pair WCAG AA contrast contract (policed by `verify:token-contrast-scoring`), and the preset/brand override precedence.
- **Design Tokens (W3C DTCG export)**: [docs/DESIGN_TOKENS_DTCG.md](docs/DESIGN_TOKENS_DTCG.md) and [tokens/gds.tokens.json](tokens/gds.tokens.json) — The GDS token set exported in W3C DTCG format (391 tokens across 23 presets) for Figma variables, Style Dictionary v4, and cross-platform tooling, generated from the authoritative code tokens and drift-checked in CI (`verify:tokens-dtcg`).
- **Accessibility Evidence**: [ACCESSIBILITY_EVIDENCE.md](ACCESSIBILITY_EVIDENCE.md) — Structured keyboard, focus, WCAG, AT/browser, limitation, and recovery evidence for stable patterns.
- **Accessibility Conformance Report (VPAT / WCAG 2.2 AA)**: [VPAT_CONFORMANCE.md](VPAT_CONFORMANCE.md) — The first-party VPAT® 2.5 / WCAG 2.2 Level AA conformance statement, generated from the accessibility-evidence registry and CI gates, with an explicit provider/consumer responsibility split and a per-release refresh path.
- **Per-Component Accessibility Reference**: [docs/ACCESSIBILITY_PER_COMPONENT.md](docs/ACCESSIBILITY_PER_COMPONENT.md) — Consumer-facing keyboard-interaction tables, focus/screen-reader behavior, and the provider/consumer responsibility split per pattern family and for high-traffic components (Kanban, GdsSchemaForm, overlays), plus how to adopt the `gds-a11y` CI helpers.
- **Accessibility CI Package**: [A11Y_CI_PACKAGE.md](A11Y_CI_PACKAGE.md) — Reusable Playwright/axe helpers for keyboard, focus-trap, contrast, suppression, and deterministic report gates.
- **Consumer Contrast Checker**: [docs/CONTRAST_CHECKER.md](docs/CONTRAST_CHECKER.md) — Pure, server-safe `getGdsContrastRatio(...)` / `checkGdsContrast(...)` exposing the same WCAG 2.x contrast math GDS hard-gates its own tokens with, so consumers can score their own brand/custom color pairs against AA/AAA (normal/large) thresholds before shipping.
- **Exception Surfaces**: [EXCEPTION_SURFACES.md](EXCEPTION_SURFACES.md) — Chart, map, embed, and other approved exception-surface guidance.
- **Deprecations & Migrations**: [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md) — Contract retirement policy, migration rules, and release handover expectations.
- **Portfolio Matrix**: [PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md](PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md) — The current cross-project inventory, archetypes, and recommended next actions.
- **Operational Files**: `CONTRIBUTING.md` and `CHANGELOG.md` — Shared rules for contributing to the design system and its versioned history.
- **Templates**: `TEMPLATES/` — Starter templates for your project's theme, providers, shell, and thin wrappers.
- **Machine-readable Contracts**: `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` — shared compatibility, adoption, and validation contracts.
- **Adoption Reporting**: `gds-compliance adoption-report`, `gds-compliance exceptions`, and `gds-compliance expire-check` — score consumer drift, export Markdown/HTML evidence, and fail CI when dependency-boundary exceptions expire.
- **Primary Runtime Package**: `@sovereignsquad/gds` — the public umbrella install for most consumers, re-exporting the theme, core, and admin surface families through root, `client`, and `server` entrypoints.
- **Granular Runtime Packages**: `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin` — direct lanes for consumers that want tighter dependency boundaries or package-by-package upgrades.
- **Tooling Packages**: `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance` — shared lint and compliance enforcement for adopting repos.
- **Accessibility Testing Package**: `@sovereignsquad/gds-a11y` — optional Playwright/axe helpers for consumer CI accessibility gates without adding browser-test weight to runtime packages.
- **Canonical Theme Lanes**: `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)` — the only approved adopter-facing theme ownership paths; `extendGdsTheme(...)` is retained only as a bounded internal/runtime helper and is no longer a canonical consumer lane.
- **CSS VibeThemes**: `sunset`, `oceanic`, `forest`, `ruby`, `amber`, `neon-night`, `skyline`, `aurora`, `coral`, `mint`, `orchid`, `royal`, and `cosmic` — governed vibrant lanes resolved through `getGdsThemePresets()`, `resolveGdsThemePreset(...)`, `getGdsVibeThemes()`, and runtime CSS variables so products can ship expressive color without image backgrounds or local theme authority. `cosmic` is the intentionally high-saturation multicolour showcase lane.
- **Font Lane Registry**: `getGdsFontLanes()`, `resolveGdsFontLane(...)`, `isGdsFontLaneId(...)`, `getGdsFontLaneStylesheetUrls()`, and `applyGdsFontLane(...)` from `@sovereignsquad/gds-theme` — the approved 10+ webfont lanes with source metadata, `font-display: swap`, fallback stacks, locale coverage, and provider-safe theme bindings. Consumers must use these lanes instead of product-local font catalogs.
- **Theme Token Operations**: `createGdsTokenGraph()`, `validateGdsTokenGraph(...)`, `createGdsTokenDiff(...)`, `createGdsThemeCompatibilityReport(...)`, and the `gds-theme-tokens` CLI from `@sovereignsquad/gds-theme` — governed token graph, diff, lint, and compatibility evidence for theme release review and rollback-safe audits.
- **Theme Runtime State**: `useGdsThemePresetState(...)` from `@sovereignsquad/gds-theme/client` — canonical runtime hook for persistent whole-site preset switching, font-lane switching, root runtime attributes, corrupted-storage fallback, and reset behavior.
- **Motion Runtime State**: `gdsMotionDurations`, `gdsMotionEasings`, `gdsMotionPresets`, `getGdsMotionPreset(...)`, `createGdsMotionCssVariables(...)`, and `useGdsReducedMotion(...)` from `@sovereignsquad/gds-theme` / `@sovereignsquad/gds-theme/client` — canonical motion timing, preset, reduced-motion, and no-motion policy APIs for overlays, command surfaces, feedback, skeletons, lists, and state transitions.
- **Locale Bridge**: `getGdsMessages(locale)`, `GdsLocale`, `GdsLocaleText`, `GdsFormattedNumber`, `GdsFormattedCurrency`, `GdsFormattedDate`, `GdsRelativeTime`, `GdsPlural`, `GdsDirectionBoundary`, `resolveGdsLocale`, `resolveGdsMessage`, `formatGdsNumber`, `formatGdsCurrency`, `formatGdsDate`, `formatGdsRelativeTime`, `formatGdsPlural`, `compareGdsLocaleString`, `sortGdsLocaleStrings`, `createGdsMissingKeyTracker`, `createGdsTextExpansionFixture`, and `useGdsDirection` from `@sovereignsquad/gds-core`, plus `GdsI18nContext`, `gdsLocaleMetadata`, `getGdsLocaleMetadata(...)`, `isGdsRtlLocale(...)`, and `getGdsLocaleIdsByScript(...)` from `@sovereignsquad/gds-theme` — canonical bridges for host i18n systems, runtime formatting, locale-aware sorting, missing-key telemetry, RTL direction, script coverage, text expansion, and GDS-owned semantic labels. Consumers must centralize language resources instead of embedding per-language prose or local Intl wrappers in UI components.
- **Public, Discovery, Detail, Reporting, and Access Primitives**: `GdsBox`, `GdsStack`, `GdsInline`, `GdsCluster`, `GdsGrid`, `GdsSplit`, `GdsSidebar`, `GdsBleed`, `GdsContainer`, `GdsSafeBox`, `GdsMediaFrame`, `GdsOverflowFrame`, `GdsResponsiveVisibility`, `AccentPanel`, `ChoiceChip`, `EditorialHero`, `FeatureBand`, `BrowseSurface`, `EditorialCard`, `ConsumerSection`, `ConsumerDashboardGrid`, `SectionPanel`, `MediaField`, `UploadDropzone`, `ReportingSection`, `PeriodSelector`, `EvidencePanel`, `ChartTokenPanel`, `GdsChart`, `PublicBrandFooter`, `DiscoveryShell`, `SidebarNav`, `ActionBar`, `ListingCard`, `ShareButtonGroup`, `MapPanel`, `DetailProfileShell`, `PublicFlowShell`, `PlaybackSurface`, `PublicFoodCard`, `FoodMenuSection`, `ProviderIdentityButton`, `ProviderIdentityButtonGroup`, `SocialAuthButtons`, `AccessSummary`, `AccessRecoveryPanel`, `GdsAccessGate`, `resolveGdsAccessState`, `createGdsAccessAdapter`, `resolveGdsAccessAdapterState`, `validateGdsAccessGateContract`, `createGdsAccessGateEvent`, and the enhanced `PublicShell` / `PublicProductCard` / `AuthShell` contracts from `@sovereignsquad/gds-core` — canonical layout, safe styling, public/editorial, accent-safe, sidebar-first, governed navigation/action, unified discovery, sanctioned share/embed, detail/profile, public staged flow, kiosk/playback, food/menu, reporting/evidence/chart containment, access recovery, teaser/paywall boundaries, consumer dashboard, operational framing, social-auth, and localized media-first card contracts. Access-gated pages must use `protectedContentPolicy="never-render-while-locked"` so private or paid content is not mounted behind CSS or overlays. Card families now share `size`, `density`, and `variant` through `resolveGdsCardContract`, so adopters can choose compact or spacious cards without local layout CSS; `ListingCard` also owns keyboard-safe `interactiveMode` lanes for `surface-link`, `surface-button`, and `flip` reveal behavior. Chart-heavy surfaces use `GdsChart` with `gdsChartTypeRegistry`, `gdsChartSetATypeRegistry`, `gdsChartSetBTypeRegistry`, `validateGdsChartData`, vendor-neutral renderer adapters, token legends, state shells, and accessible table fallback instead of local chart wrappers. Block-based pages use `renderGdsLayout`, `validateGdsLayout`, `renderGdsLayoutWithDiagnostics`, `getGdsLayoutTemplates`, `getGdsLayoutTemplate`, `GdsLayoutTemplatePreview`, and `registerGdsBlock` for governed schema composition and developer cookbook previews instead of local page-builder glue.
- **Runtime Governance Primitives**: `useGdsForm`, `useGdsFormOrchestration`, `createGdsDraftAdapter`, `GdsSchemaForm`, `createGdsFormFromSchema`, `jsonSchemaToGdsFormSchema`, `openApiToGdsFormSchema`, `zodToGdsFormSchema`, `GdsDataTable`, `useGdsDataTable`, `createGdsTableAdapter`, `serializeGdsTableQuery`, `GdsResourceManager`, `useGdsResourceManager`, `createGdsResourceAdapter`, `GdsAssetManager`, `GdsAssetPreviewCard`, `useGdsAssetUploadQueue`, `createGdsAssetAdapter`, `validateGdsAsset`, `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `useGdsKanbanOrientation`, `getGdsTaskPatterns`, `getGdsTaskPattern`, `validateGdsTaskPatterns`, `GdsAdminDashboardTemplate`, `GdsSettingsTemplate`, `GdsResourceManagerTemplate`, `GdsCrudEditorTemplate`, `GdsAnalyticsTemplate`, `GdsPublicEventTemplate`, `GdsErrorPageTemplate`, `GdsEmptyStateTemplate`, `getGdsPageTemplates`, `getGdsPageTemplate`, `validateGdsPageTemplates`, `createGdsPageTemplateEvent`, `gdsFormReducer`, `GdsFormProvider`, `GdsValidationSummary`, `FormErrorSummary`, `ValidatedFieldMessage`, `GdsNotificationProvider`, `GdsNotificationCenter`, `NotificationCenter`, `useGdsNotifications`, `createGdsNotificationId`, `getGdsNotificationLivePolicy`, `createGdsNotificationAuditEvent`, `OverlayManagerProvider`, `useOverlayManager`, `GdsModal`, `GdsDrawer`, `GdsSheet`, `CommandRegistryProvider`, `CommandPalette`, `useCommandLauncher`, `GdsTelemetryProvider`, `useGdsTelemetry`, `emitGdsEvent`, `createGdsTelemetryAdapter`, `gdsOperationalEventTypes`, and `gdsUxFailureReasons` from `@sovereignsquad/gds-core` — canonical runtime lanes for deterministic form submit/validation behavior, generated schema-backed forms, governed data tables and resource workflows, responsive `KanbanBoard` columns with server-paginated `totalCount` badges, a `ReactNode` column `title`, per-column `renderColumnFooter` (load-more/pagination), and opt-in `collapsible` columns (`collapsedColumnIds`/`onCollapsedChange`), asset upload queues, task-pattern and production page-template contracts, notification queues with retry/announcement/audit semantics, overlay stack governance, keyboard-first quick actions, and privacy-safe UI observability with vendor-neutral adapter boundaries, sampling, payload rejection, retry, and timeout semantics.
- **Content Governance Primitives**: `getGdsContentPatterns`, `getGdsContentPattern`, `getGdsCopyTemplates`, `getGdsCopyTemplate`, `renderGdsCopyTemplate`, `validateGdsCopyTemplate`, `validateGdsContentPatterns`, `createGdsContentExpansionReport`, and `GdsContentPatternCatalog` from `@sovereignsquad/gds-core` — canonical content patterns and copy-template contracts for localization-safe product messages.
- **Design Handoff Primitives**: `getGdsDesignComponentMappings`, `getGdsDesignTokenMappings`, `validateGdsDesignHandoffMappings`, `generateGdsDesignHandoffReport`, and `GdsDesignHandoffCatalog` from `@sovereignsquad/gds-core` — canonical design-to-code mapping and report contracts for approved Figma/code handoff.
- **Dependency-Governed Public API**: API reference entries classify each export as `canonical`, `support-api`, `compatibility`, or `internal-risk`, and mark whether the implementation boundary is `gds-contract`, `mantine-backed`, `tabler-backed`, or `tooling`.
- **Operator Editing Primitives**: `ContentOpsEditor`, `ContentOpsSection`, `ContentOpsActionBar`, `AppShell`, `ResponsiveDataView`, and `PageHeader` from `@sovereignsquad/gds-admin` — canonical scaffolds for multi-section content/settings operations, authenticated shell framing, and operational registry/detail workflows.
- **Reference Consumers**: `apps/reference-vite` and `apps/reference-next` — verified fixture apps that exercise the canonical package-consumption path.
- **Docs Site Source**: `apps/playground` — the GitHub Pages source app that publishes the install guide, governance guidance, theme explorer, live proofs, and the pattern catalog.
- **Reference-Site Primitives**: `ReferenceSection`, `ReferenceLinkGrid`, `ReferenceLocaleNotice`, `ReferenceThemeExplorer`, `DocsShell`, and `DocsHeaderActionSelect` — canonical GDS-owned primitives for reference/docs surfaces without site-local pseudo-components, including bounded localized header actions.
- **Project Board**: [PROJECT_BOARD.md](PROJECT_BOARD.md) — the label-based issue board (GitHub Issues grouped by `status:` labels; no external Projects v2 board), its taxonomy, saved-search views, and tooling.
- **Board Sync Checklist**: [docs/BOARD_SYNC_CHECKLIST.md](docs/BOARD_SYNC_CHECKLIST.md) — required consistency pass between implementation, docs, and issue-board state before release and after major delivery waves.
- **Client Upgrade Prompt**: [CLIENT_UPGRADE_PROMPT.md](CLIENT_UPGRADE_PROMPT.md) — copy/paste checklist and communication template for consumer teams.
- **Projects**: `PROJECTS/` — Product-specific migration plans and adoption strategies.

## Where the language files are

Every user-visible string on the reference site comes from one of **three** sources. If wording
is wrong in a language, this table says which file to edit.

Only the first row travels with the packages. The site's phrase overlay translates the rendered
DOM, which is why the reference site can look fully localized while a consumer who installs
`@sovereignsquad/gds-core` sees English — **what a consumer gets is the package messages and
nothing else** (issue 617).

| What | File(s) | Authored by | Locales |
| --- | --- | --- | --- |
| **Package messages** — semantic labels GDS components resolve through `getGdsMessages(locale)` / `t(...)`. **The only localization consumers of the packages receive.** | `packages/gds-core/src/locales/<locale>.ts` | **Edit directly**; new keys are appended by a generator that never overwrites an existing value. See below. | 12: `ar de en es fr he hu it ja ko ru zh` |
| **Site phrase packs** — every other visible string, matched by its English text at runtime through the **GDS engine** (`translateGdsDom`/`useGdsDomPhraseTranslation` in gds-core, Rule 16 — the site supplies only these packs and their loader) | `apps/playground/src/generated-site-phrases/<locale>.ts` | **Generated.** See below. | 11 (English is the key, so it has no pack) |
| **Structured page copy** — per-locale blocks for page titles, leads, nav labels and link lists | `apps/playground/src/page-copy.ts`, `apps/playground/src/site-copy.ts`, `packages/gds-core/src/ReferenceThemeExplorer.copy.ts` | **Generated**, then editable in place. | 12 |

### Fixing a wrong translation

**Package messages** and **structured page copy** are ordinary source. Edit the value for the
locale and commit — nothing rewrites a value that is already there.

### Where the package messages come from

A component's user-visible default is written once, at the call site, and the packs are derived
from it:

```tsx
export function AsyncSurface({ emptyTitle: emptyTitleProp, … }) {
  const { t } = useGdsTranslation();
  const emptyTitle = emptyTitleProp ?? t('gds.asyncSurface.emptyTitle', 'No results');
```

`node scripts/generate-component-message-packs.mjs` reads every `t('id', 'English')` call in
`packages/gds-core/src` and appends whatever is missing to all 12 packs, machine-translating the
non-English ones. It **never overwrites an existing value**, so a corrected translation survives
every later run — which is what makes "edit directly" safe.

`npm run verify:i18n-message-parity` then holds three properties: the packs cover the same keys as
each other, every `t()` id in the components exists in the packs, and each pack's English matches
the fallback at its call site. The middle one is the load-bearing addition. A pack-vs-pack check
passes happily when an id is missing from *all* twelve packs, and that component then renders its
English fallback in every language, permanently and silently — four ids were in exactly that state
when the check was added (`gds.navigation.openMobile` and three `gds.featureBand.*`).

As with the site phrases, **the wording is machine translation and has not been reviewed by a
human.** The same single-word limits below apply, and for the same reason.

**Site phrase packs are regenerated**, so an edit there is overwritten on the next
`npm run artifacts:refresh`. The generator keeps any existing non-empty value, with **one
exception**: a value identical to its English source is retried when another locale translated
the same phrase (issue 588), because that is the signature of a missed translation. So a
deliberate "this term stays in English" needs to be recorded, not just typed.

### Where the phrase packs come from

`scripts/generate-site-phrase-translations.mjs` extracts every string literal from a fixed list
of source files at the top of that script — the playground's pages plus the GDS files that own
user-visible copy (theme presets, component defaults, the Theme Lab) — and translates each one.
**If a string renders in English on a translated page, the usual cause is that its source file
is not in that list.**

Machine translation is the current source and **the wording has not been reviewed by a human**.
Two known limits, both measured rather than assumed:

- **Single words are unreliable**, because one word carries no context. Measured on Korean:
  `Browse` → 먹다 ("to eat"), `About` → the preposition, `Adoption` → adopting a child. Ordinary
  capitalised words are still included; bare lowercase tokens, acronyms and identifier shapes
  (`GdsBadge`, `partner-discovery`) are deliberately excluded.
- **API value names stay in English on purpose.** A contrast matrix listing `plum`, `outline` or
  `deepest` is naming values a consumer types in code; translating them would make the page
  disagree with the API.

`npm run verify:i18n-leakage` fails when a pack ships English where a translation belongs, using
peer evidence (another locale translated the same phrase) and the locale's script.

## Public Site Contract

The GitHub Pages site is the public runtime reference for this repository:

- Overview: `https://sovereignsquad.github.io/general-design-system/`
- Install guide: `https://sovereignsquad.github.io/general-design-system/install`
- Feature request intake: `https://sovereignsquad.github.io/general-design-system/request-feature`
- Theme explorer: `https://sovereignsquad.github.io/general-design-system/themes`
- Governance guide: `https://sovereignsquad.github.io/general-design-system/governance`
- Pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- Coverage matrix: `https://sovereignsquad.github.io/general-design-system/coverage`
- API reference: `https://sovereignsquad.github.io/general-design-system/api`
- Maturity capabilities: `https://sovereignsquad.github.io/general-design-system/maturity`
- Product use cases: `https://sovereignsquad.github.io/general-design-system/use-cases`
- Live proofs: `https://sovereignsquad.github.io/general-design-system/live-proofs`
- Demo route families:
- `.../live-proofs/surfaces`
- `.../live-proofs/layouts`
- `.../live-proofs/semantics`
- `.../live-proofs/food`
- `.../live-proofs/playback`
- `.../live-proofs/analytics`
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
- live runtime proof of form validation, overlay stack governance, command palette behavior, and telemetry contract events through the catalog demos (`/patterns/foundations`, `/patterns/feedback`)

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
- package-consumption and migration authority once the direct `@sovereignsquad/gds` or granular `@sovereignsquad/gds-*` path is active

**If a project-local UI document conflicts with this directory, this directory wins.**

## Install (GitHub Packages)

Current and future GDS releases publish to **GitHub Packages** (`https://npm.pkg.github.com`), the canonical registry — authenticated in CI by the workflow run's own ambient `GITHUB_TOKEN`, with no `NPM_TOKEN` or npm.com account dependency. Because it's a real resolving registry (not tarballs), the recommended `@sovereignsquad/gds` umbrella package resolves here too. A frozen `3.9.0` snapshot of the packages also exists on npmjs.com; it is **deprecated and unsupported** — kept only so existing installs keep resolving, and never updated — so new work should use GitHub Packages. Add to your `.npmrc`:

```ini
# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

`${GITHUB_TOKEN}` is your own GitHub personal access token with `read:packages` scope, exported in your shell (or provided by CI). GitHub Packages authenticates every install — including public packages — so a token is needed here even though the packages are public. If your organization enforces SAML SSO, authorize the token for the `sovereignsquad` org first. See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for full setup and `401` troubleshooting.

### Release-visibility artifacts (not an install path)

Every `gds-v<VERSION>` tag also produces a public GitHub Release with `.tgz` tarballs attached, via `npm run pack:release`. These exist for audit/offline visibility only — they are **not** a documented consumer install path, and the `@sovereignsquad/gds` umbrella package cannot be installed this way (its dependency ranges assume its sub-packages resolve from a registry). Do not point consumers at these tarball URLs; use GitHub Packages above.

See [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) for the full publish process.

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
- `npm run verify:references` — validates reference consumers, adoption manifests, official `DocsShell` usage, strict playground GDS-only source rules (no `@mantine/core` imports and no inline `style={{...}}` on core Pages routes), SSOT pattern-catalog coverage, package export-to-pattern coverage, website trust/clarity checks, surface-presentation migration evidence, route-level locale coverage declarations, canonical theme-governance lanes, media/upload contracts, reporting/access contracts, and reference codemods
- `npm run verify:accessibility-evidence` — validates that every stable pattern publishes structured accessibility evidence with required WCAG mappings, AT/browser rows, freshness, owners, limitations, and recovery metadata
- `npm run verify:a11y-package` — builds and tests the reusable `@sovereignsquad/gds-a11y` Playwright/axe helper package and verifies its docs/API contract
- `npm run verify:theme-tokens` — validates the shipped theme token graph, light/dark pair ownership, and per-surface compatibility coverage
- `npm run verify:forced-colors-runtime` — emulates `forced-colors: active` in a headless browser and checks governed routes for platform-backed surfaces, visible focus, and readable control states
- `gds-compliance adoption-report --manifest ./gds-adoption.json --format md` — emits the governed adoption score and remediation summary for a consumer repository
- `gds-compliance expire-check --manifest ./gds-adoption.json` — fails when dependency-boundary exceptions are past `removeBy` with `enforcementMode: "error"`
- `npm run verify:api-docs-coverage` — validates the registry-backed public API documentation contract for shipped runtime exports
- `npm run verify:access-gate` — validates the access-gate docs, exports, live proof registry, privacy policy, and non-rendering tests for paywall/protected-content boundaries
- `npm run verify:i18n-route-coverage` — validates localized route declarations and route-copy implementation markers
- `npm run audit:render-coverage` — Phase 3 of the deep audit (issue 583): generates a deterministic IPOG covering array over the 8-factor render state space (theme, scheme, route, theme-defined viewports, locale, reduced-motion, forced-colors, interaction state), WGA-selects against what the runtime gates already cover, executes in transition-cost order with the Phase-1 classifier, and writes achieved per-factor-group *t*-way coverage to `audit/coverage-array.json`; any skipped cell fails the phase
- `npm run verify:stale-theme-values-runtime` — switches theme in place through the Theme Lab's own controls and diffs ~16k element-properties (including SVG paint servers and image sources) against a fresh load of the target theme; any surviving value is reported as a `StaleValueReport` with selector, property, expected, actual, and from/to identities. Also asserts switch latency against a 3000ms budget and that keyboard focus and scroll position survive the remount
- `npm run verify:focus-ring-runtime` — renders a no-JS fixture linking only the published stylesheet, with no theme attribute, and asserts the governed 2px solid focus ring computes on keyboard focus for native controls and the NavLink/Tabs.Tab classes — the pre-hydration state a server-rendered consumer paints first
- `npm run verify:viewport-reachability-runtime` — sweeps every declared route in headless Chrome at a true 390px and fails when content is unreachable: clipped by an overflow-hidden ancestor or inflating the page's scroll width, with working rails, off-canvas panels, `aria-hidden` subtrees, and `alt=""` images correctly not counted
- `npm run verify:i18n-message-parity` — validates package locale pack key parity, that every `t()` id in `gds-core` source is defined in the packs, and that each pack's English matches the fallback at its call site
- `npm run verify:i18n-package-copy` — blocks native dialog prompt copy in packages
- `npm run board:labels` — idempotently provisions the issue-board label taxonomy (colors + descriptions) from `scripts/board-labels.config.mjs`; uses the default `GITHUB_TOKEN` (no PAT)
- `npm run audit:board` — audits the label-based issue board ([PROJECT_BOARD.md](PROJECT_BOARD.md)): reports each open issue's `status:` column and any open issue missing/duplicating one
  - CI note: if `gh`/the API is unavailable, the audit emits a warning and continues unless `GDS_BOARD_AUDIT_STRICT=1` is set
- `npm run audit:board:strict` — runs the same issue-board audit in fail-hard mode for local release sign-off and board normalization work
- `npm run audit:dependencies` — enforces zero production dependency advisories and verifies any dev/reference-tooling advisories are explicitly documented in [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md)
- `npm run verify:mantine` — packs the packages and validates clean Mantine 8.3 and 9.2 / React 19 consumer install smoke
- `npm run publish:dry-run` — validates the authenticated package publish sequence without uploading artifacts
- `npm run publish:npm` — publishes the seven public GDS packages from an authenticated npm environment
- `npm run verify:published` — checks the registry until all seven packages resolve to the current `VERSION`, then installs and type-checks a clean npm consumer fixture
- `npm run verify:published:availability` — checks only npm registry version availability for the current `VERSION`
- `npm run verify:published:consumer` — installs the current `VERSION` from npm into a temporary consumer and verifies imports/types outside the monorepo
- `npm run board:sync-release` — closes explicitly delivered release issues from `GDS_RELEASE_DELIVERED_ISSUES` (closing is the "move to Done") and strips their `status:` labels
- `npm run pack:release` — creates public tarballs, checksums, and install instructions for the fallback GitHub release-bundle distribution path
- `npm run build` — builds `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, `@sovereignsquad/gds-admin`, `@sovereignsquad/gds`, and the playground in dependency order
- `node scripts/codemods/run-codemod.mjs <transform> <path>` — runs the reference migration codemods in dry-run mode by default and emits `GdsCodemodResult` with changed files, manual follow-ups, failed transforms, and governed exception stubs
- `npm install` — on supported macOS and Linux x64 environments, the root optional native bindings now bootstrap the local Vite/tsup build layer without extra manual install steps
- `npm run lint` — runs the playground lint target
- `npm run test:run` — runs the shared jsdom component test suite for the workspace packages

The shared package validation path is now expected to cover:
- provider composition in `@sovereignsquad/gds-theme` and `@sovereignsquad/gds`
- behavior coverage in `@sovereignsquad/gds-core` and `@sovereignsquad/gds-admin`
- i18n-safe shared copy
- reference consumer manifests and fixture validation
- compliance tooling and shared lint enforcement
- GitHub Actions quality gates before deployment
- version and project-plan alignment for active adopter releases

## Non-Negotiable Rules

- One interaction concept gets one canonical pattern.
- One product gets one active theme and token source.
- New product UI must use shipped GDS contracts first; Mantine and Tabler are implementation dependencies behind GDS-owned APIs unless a reviewed dependency-boundary exception is active.
- No new product UI may bypass Mantine with raw custom primitives, ad hoc HTML/CSS controls, or alternate component frameworks.
- Mantine UI examples may be used only as reference material; reusable output must become GDS-governed project contracts.
- Raw colors and repeated hard-coded spacing in feature code are prohibited.
- Dark/light mode readability is mandatory; mixed-mode surfaces require documented exceptions.
- Loading, empty, error, success, disabled, and permission states are part of every component contract.
- Mobile and responsive behavior must be designed intentionally, not inherited accidentally from desktop.
- Translated labels, browser zoom, and resized windows are mandatory layout inputs. Shells and headers must avoid horizontal overflow, clipped action controls, and overlapping brand/action regions in every supported locale.
- Accessibility is part of design acceptance, not a cleanup pass.
- Internationalization resilience is mandatory for shared patterns.
