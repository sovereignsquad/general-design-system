# Messmass Mantine Refactor

Status: GDS runtime in place, local design system still the styling source
Version: 2.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/messmass`

Paths below are relative to the Messmass repository root.

## Objective

Refactor Messmass into a strict Mantine-only product UI that follows the shared SSOT without preserving the existing local custom admin/reporting design system as a competing authority.

This is not a light visual refresh. The target is a real foundation replacement where Mantine becomes the only approved product UI primitive system, theme authority, and pattern runtime for admin, reporting, analytics, and editor workflows.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `3e3fc847`, with a clean working tree.

- **Packages.** `gds-core`, `gds-theme` and `gds-admin` 6.3.0 in `dependencies` (`package.json:146-148`) and `gds-compliance` 6.3.0 in `devDependencies` (`:176`), all vendored `file:vendor/gds/` tarballs. `overrides` repeat the runtime three (`:205-207`). `gds-eslint-config` is not installed, and no file imports `gds-admin`. [INSTALLATION_GUIDE.md, "Registry outage: bounded vendored fallback"](../INSTALLATION_GUIDE.md#registry-outage-bounded-vendored-fallback) treats vendoring as temporary and asks for a `temporary` exception; `approvedExceptions` is empty (`gds-adoption.json:47`).
- **Stack.** Next.js 15.5.24 App Router (`package.json:165`), React `^19.2.6` (`:167`), Mantine `^8.3.18` (`:140-145`), Chart.js (`:153`) and `@tabler/icons-react` (`:150`). `lucide-react` (`:161`) is imported by no source file. There is no Tailwind dependency or config.
- **Provider and theme.** One `GdsProvider` (`app/providers.tsx:25`) with `defaultColorScheme="light"`, wrapping `GdsConfirmProvider` (`:26`). No second `MantineProvider` exists in application code. The theme comes from `createPublicBrandTheme` (`lib/ui/mantineTheme.ts:9`), an approved lane, with four brand ramps from `lib/theme/mantinePalette.ts`.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is imported once (`app/layout.tsx:6`), after direct imports of `@mantine/core/styles.css` and `@mantine/notifications/styles.css` (`:4-5`). It already imports both, so Mantine's CSS loads twice ([INSTALLATION_GUIDE.md, "Root runtime setup"](../INSTALLATION_GUIDE.md#3-root-runtime-setup)). The styling source is a local token layer: `app/styles/theme.css` defines the `--mm-*` custom properties (imported at `app/globals.css:9`), and no stylesheet or TypeScript source file reads a `--gds-*` token. `app/globals.css:106` assigns `--mantine-color-body`. Two `@media (prefers-color-scheme: dark)` blocks set `color-scheme: dark` (`app/styles/theme.css:665-670`, `app/globals.css:767-771`) while `GdsProvider` sets `defaultColorScheme="light"`.
- **Manifest and compliance posture.** `gds-adoption.json` declares `gdsVersion` 6.3.0 (`:3`), `strictMode` `false` (`:51`) and `migrationStatus` `partial` (`:53`), a schema value. `AppShell`, `AdminResourceManager`, `AdminDataTable`, `AdminResourceGrid`, `PageHeader`, `AdminCrudForm`, `AdminModal`, `ActionBar` and `WorkspaceHeader` are in `requiredContracts` (`:16-32`) and imported by no file; their `localAdapters` entries are `planned` (`:37-45`). `protectedSurfacePaths` names `app/styles/theme.css` (`:50`), and the scanner reads only JavaScript and TypeScript files. `documentationPaths` is absent, so the stale-reference scan never runs; `docs/coding-standards.md:16` names `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM`, which does not exist. CI runs `npx gds-compliance check` (`.github/workflows/ci.yml:58`), and `gds-compliance check` from the current GDS release reports no finding against this checkout. That does not cover any stylesheet, the strict rules while `strictMode` is `false`, or colour literals under `lib/theme/`, which are exempt as theme-owned ([COMPLIANCE_TOOLKIT.md, "What a zero-finding run proves"](../COMPLIANCE_TOOLKIT.md#what-a-zero-finding-run-proves)). `.stylelintrc.json` exists, but `stylelint` is in neither `package.json`, `package-lock.json` nor `node_modules/.bin`, so no stylesheet lint runs.
- **Local adapter docs.** `docs/design/design-system.md:22` states that icons are Tabler through GDS-compatible wrappers. Icons render through `components/MaterialIcon.tsx` and three Material Icons font links (`app/layout.tsx:158`, `:163`, `:168`); `@tabler/icons-react` is imported in a few components (`components/Sidebar.tsx:8`, `components/TopHeader.tsx:6`).
- **Surfaces still without GDS.** A GDS component is used by `AuthShell` on the admin login (`app/admin/login/page.tsx:11`), `useGdsConfirm` in the admin clicker-manager, users and visualization pages and the three fanmass tabs, `ChoiceChip` in `components/ColoredHashtagBubble.tsx` and `components/HashtagMultiSelect.tsx`, and `MetricCard` in `components/analytics/MetricCard.tsx:15`. The admin shell, navigation, list pages, forms, modals, analytics and the public report renderer are local components styled by CSS modules and global classes. Browser `window.alert` and `confirm()` calls remain (`components/TopHeader.tsx:92,96`, `app/admin/bitly/page.tsx:397`); `GdsConfirmProvider` is mounted and `GdsToastProvider` is not.
- **Local code that duplicates a shipped GDS export.** Exports below are in installed 6.3.0.

| Local | Shipped export |
|---|---|
| `components/AdminLayout.tsx`, `components/Sidebar.tsx`, `components/TopHeader.tsx` | `AppShell`, `WorkspaceHeader` (`gds-admin`), `SidebarNav` (`gds-core`) |
| `components/NotificationPanel.tsx` | `GdsNotificationCenter` (`gds-core`) |
| `components/UnifiedAdminPage.tsx`, `components/UnifiedListView.tsx`, `components/UnifiedCardView.tsx` | `AdminResourceManager`, `AdminDataTable`, `AdminResourceGrid` (`gds-admin`) |
| `components/UnifiedAdminHeroWithSearch.tsx` | `PageHeader` (`gds-admin`), `DataToolbar` (`gds-core`) |
| `components/modals/BaseModal.tsx`, `components/modals/FormModal.tsx` | `AdminModal`, `AdminCrudForm` (`gds-admin`) |
| `.btn*` in `app/styles/components.css`; `.badge-*` and `.alert*` in `app/globals.css` | `SemanticButton`, `StatusBadge`, `InlineAlert` (`gds-core`) |
| `components/StandardState.tsx`, `components/analytics/AnalyticsStatePanel.tsx`, `PublicReportState` in `components/reports/PublicReportShell.tsx` | `StateBlock`, `EmptyState` (`gds-core`) |
| `components/RoleDropdown.tsx` | `Select` (`gds-core`) |
| `components/SaveStatusIndicator.tsx` | `AdminFormStatus` (`gds-admin`) |
| `lib/tour/`, `components/tour/` | `GdsTourProvider`, `GdsGuidedTour`, `GdsTourButton`, `useGdsTour` (`gds-core`) |
| `--z-*` scale in `app/styles/theme.css:599-614` | `gdsZIndexToken` (`gds-theme`) |

## Next steps

1. Re-point the `--mm-*` families in `app/styles/theme.css` at GDS and Mantine variables and delete the file family by family.
2. Delete the direct Mantine stylesheet imports at `app/layout.tsx:4-5`.
3. Replace `window.alert` and `confirm()` with the mounted `useGdsConfirm`, and mount `GdsToastProvider` for success and error messages.
4. Adopt the unused `requiredContracts` in the order of [ADOPTION_AND_MIGRATION_PLAYBOOK.md](../ADOPTION_AND_MIGRATION_PLAYBOOK.md), or keep them `planned` with dates. Record the vendored tarballs as a `temporary` exception, or move to the registry install.
5. Add a stylesheet gate, declare `documentationPaths`, correct the SSOT path in `docs/coding-standards.md:16`, and set `compliance.strictMode`.

The full fix list is `gds_fix_handover.md` at the repository root.

## Current Risk (superseded 2026-10-01)

Recorded 2026-05-23. Messmass had the highest authority conflict among the active product repositories.

Observed problems:

- Mantine is mandatory in the shared SSOT, but Messmass does not currently show Mantine as the active package-level UI foundation. Superseded: Mantine 8.3 and the GDS packages are declared, and `GdsProvider` is the root provider.
- Messmass has a substantial local custom system for admin, reporting, analytics, and editor surfaces. Still true: see Current state.
- local documentation still contains stale hybrid-authority language that treats the local wrapper/token system as authoritative until a future Mantine migration is complete. Partly superseded: `docs/coding-standards.md:21` declares the local token-and-wrapper system a frozen compatibility layer. The same file names a nonexistent SSOT path (`:16`) and still instructs `--mm-*` token use (`:230`, `:469-480`).

Known conflicting local file:

- `docs/coding-standards.md`

That conflict must be treated as a product-governance bug, not a documentation nuance.

## Non-Goals

- preserving the current local token/wrapper system as a long-lived product authority
- introducing Mantine only in isolated new pages while old shared surfaces continue to define the grammar
- replacing report/chart engines only because the UI foundation changes
- treating analytics/reporting builder improvements as permission to delay the Mantine runtime decision

## Target End State

- one root Mantine provider for product UI (done: `GdsProvider`, `app/providers.tsx:25`)
- one Messmass Mantine theme as the only active token authority (open: the `--mm-*` layer in `app/styles/theme.css` is the styling source)
- Mantine notifications and modals wired centrally (done by `GdsProvider`; browser dialogs remain)
- shared admin, analytics, reporting, and editor surfaces built from Mantine primitives or thin Mantine wrappers (open)
- current local CSS and page-local layout inventions either deleted or reduced to narrow exceptions (open)
- project-local docs reduced to adapter, migration, validation, and exception notes only (open)

## Pattern Service Priorities

Messmass has unusually high leverage in these contracts:

1. **AdminShell**: authenticated admin shell, navigation, account controls, and responsive workspace navigation
2. **PageHeader**: title, purpose, primary action, secondary actions, and breadcrumbs where required
3. **MetricCard**: repeated analytics/reporting KPIs
4. **DataToolbar**: search, filters, sort, period selectors, reset, create
5. **ResponsiveDataView**: admin tables, evidence panels, queues, and mobile fallbacks
6. **StateBlock**: loading, empty, error, permission, disabled, success
7. **EditorFormPrimitives**: report variant forms, partner/org editors, builder selection and settings flows

Status 2026-10-01: `MetricCard` is the only one of these backed by a GDS component (`components/analytics/MetricCard.tsx:15`). The others are local components.

Acceptance requirements:

- no page-local shell reinvention after Mantine root runtime lands
- analytics and reporting surfaces use shared Mantine-backed cards, headers, state blocks, and toolbars
- one-primary-action mobile behavior is preserved in list/card workflows
- chart engines may remain where justified, but chart surroundings must be Mantine-governed

## Recommended Sequence

### Phase 0: Governance And Authority Fix

Status: Partial. `docs/coding-standards.md:21` declares the local layer frozen; its SSOT path (`:16`) does not exist and its `--mm-*` rules remain.

Tasks:

- update Messmass-local docs to remove stale hybrid-authority language
- freeze new UI work that bypasses Mantine once the migration begins
- define exact root provider/theme paths before surface migration starts

Exit criteria:

- local docs no longer conflict with the shared SSOT
- Mantine-only authority is explicit

### Phase 1: Root Mantine Runtime

Status: Complete. Provider in `app/providers.tsx`, theme in `lib/ui/mantineTheme.ts`.

Tasks:

- install the required Mantine package baseline
- define one Messmass theme module
- add root provider composition
- wire notifications and modals centrally

Exit criteria:

- all product UI renders under Mantine root runtime
- theme ownership is explicit and singular

### Phase 2: Shared Admin And Workspace Surfaces

Status: Open. The admin shell, workspace navigation and page header are local components (`components/AdminLayout.tsx`, `components/Sidebar.tsx`, `components/TopHeader.tsx`).

Primary surfaces:

- admin shell
- workspace navigation
- page header
- shared state blocks

Reason:

- these surfaces currently spread visual and interaction decisions across the product

Exit criteria:

- shared admin/workspace primitives exist and are reused

### Phase 3: Reporting And Analytics Shared Primitives

Status: Open, apart from the `MetricCard` adapter.

Primary surfaces:

- reporting workspaces
- analytics home
- sponsorship/activation analytics
- shared toolbars, KPI cards, and evidence panels

Exit criteria:

- repeated analytics/reporting composition is contract-driven, not page-local

### Phase 4: Editor And Variant Workflows

Status: Open. Forms and modals are local components (`components/modals/FormModal.tsx`, `components/modals/BaseModal.tsx`).

Primary surfaces:

- organization reports
- partner reports
- report builder selection and settings
- organization/partner editors

Exit criteria:

- forms, filters, dialogs, and settings panels use Mantine primitives consistently

### Phase 5: Legacy CSS And Wrapper Deletion

Status: Open. `app/styles/theme.css` is imported and read by the stylesheets.

Tasks:

- delete or narrow old custom CSS that still acts as product authority
- remove obsolete local wrapper assumptions from docs and code

Exit criteria:

- remaining non-Mantine UI exceptions are narrow and documented

## Required Local Adapter

Messmass must document:

- theme path
- provider path
- wrapper policy
- exact local paths for AdminShell, PageHeader, MetricCard, DataToolbar, ResponsiveDataView, StateBlock, and EditorFormPrimitives
- validation commands
- approved exceptions
- migration backlog

Status 2026-10-01: `docs/design/design-system.md` ("Approved Local Patterns") lists the local shell, list, modal, action-rail and header components with their GDS targets, and mirrors `localAdapters`. Its icon line (`:22`) differs from the code (see Current state).

## Required Validation

At minimum:

- lint/static checks against non-Mantine product primitives
- checks against raw product design values in feature code
- visual/readability review for high-traffic admin/reporting surfaces
- contract inventory for the required local pattern families

Status 2026-10-01: CI runs `gds-compliance check`, which reads no stylesheet and skips the strict rules while `strictMode` is `false`. No stylesheet lint runs.

## Strategic Note

Messmass has a large amount of already-built workflow logic. That is valuable. The migration should preserve the workflow intelligence while replacing the UI foundation beneath it. The main risk is not missing features. The main risk is allowing the current local system to keep functioning as an undeclared competing design system.
