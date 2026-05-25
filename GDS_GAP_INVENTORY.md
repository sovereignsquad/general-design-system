# GDS Gap Inventory

Status: Working inventory  
Last updated: 2026-05-25

This file captures the color-theme and UI/UX gaps that are still **not covered** or only **partially covered** by the current General Design System.

Definitions used here:

- **Not covered**: no clear SSOT contract exists in the current GDS rulebooks.
- **Partially covered**: the rulebooks mention the family generically, but the GDS package layer does not yet expose a reusable shared primitive/contract implementation.

## 1. Color Themes Not Covered By GDS

The current GDS covers:

- one generic Mantine theme baseline
- token authority rules
- dark/light readability rules
- general accessibility/contrast rules

The current GDS does **not** yet define canonical shared theme contracts for the following theme families:

### 1. Provider-branded auth themes

Status: `not covered`

Examples:

- SSO provider-branded auth controls
- Amanoba third-party provider-branded controls

Why this is a gap:

- GDS defines `AuthShell` behavior, but not a canonical rule for how third-party/provider brand colors may coexist with Mantine token authority.

Evidence:

- [PROJECTS/SSO_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/SSO_MANTINE_REFACTOR.md:43)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:173)

### 2. White-label / tenant / organization theme variation

Status: `not covered`

Examples:

- SSO style-editor legacy surface
- Messmass organization/partner editors

Why this is a gap:

- GDS requires one token authority per product, but it does not yet define how controlled per-tenant/per-org branding variation should work.

Evidence:

- [PROJECTS/SSO_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/SSO_MANTINE_REFACTOR.md:184)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:131)

### 3. Reporting / analytics dashboard theme grammar

Status: `partially covered`

Examples:

- dense KPI/reporting/admin analytics surfaces
- evidence-heavy reporting workspaces

Why this is a gap:

- GDS covers metric cards and dashboard priority rules, but it does not yet define a full shared visual grammar for reporting-heavy screens.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:19)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:111)
- [PROJECTS/KIDEX_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/KIDEX_MANTINE_REFACTOR.md:49)

### 4. Mixed-mode preview/editor theme exception

Status: `not covered`

Why this is a gap:

- Foundation allows preview/editor exceptions to the “one active mode” rule, but no reusable contract defines how those exceptions should behave.

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:55)

### 5. Editorial / docs shell theme variant

Status: `partially covered`

Examples:

- docs/news/legal/article surfaces
- Narimato legal/docs shell backlog
- SSO docs shell migration

Why this is a gap:

- GDS covers article/docs shells generically, but there is no shared package-level article/docs theme or surface implementation yet.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:67)
- [PROJECTS/NARIMATO.md](/Users/Shared/Projects/general-design-system/PROJECTS/NARIMATO.md:61)
- [PROJECTS/SSO_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/SSO_MANTINE_REFACTOR.md:43)

### 6. Game / immersive full-viewport theme chrome

Status: `not covered`

Examples:

- Amanoba game UI internals
- Narimato full-viewport game layout

Why this is a gap:

- GDS does not currently define any immersive/gameplay theme contract.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:169)
- [PROJECTS/NARIMATO.md](/Users/Shared/Projects/general-design-system/PROJECTS/NARIMATO.md:66)

### 7. Certificate / OG / email rendering palettes

Status: `not covered`

Why this is a gap:

- These surfaces are explicitly treated as exceptions, but GDS has no shared palette contract for them.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:170)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:171)

### 8. Chart / map / embed theming rules

Status: `not covered`

Why this is a gap:

- GDS allows charts/maps/embeds as exceptions, but does not define how their colors should align with Mantine tokens.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:198)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:174)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:63)

## 2. UI/UX Elements Not Covered By GDS

## 2A. Not Covered At The SSOT Contract Level

### 1. Breadcrumbs

Status: `not covered`

Why this is a gap:

- Page headers are covered, but breadcrumb behavior is only referenced in project plans and not defined in the SSOT.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:51)

### 2. Period selectors / reporting time-range controls

Status: `not covered`

Why this is a gap:

- Data toolbars mention search/filter/sort/reset/create, but not reporting-specific date/period controls.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:37)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:53)

### 3. Evidence panels

Status: `not covered`

Why this is a gap:

- Evidence-heavy reporting/queue layouts are named in project work, but no GDS contract exists for them.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:55)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:118)

### 4. Editor/builder settings flows

Status: `not covered`

Why this is a gap:

- GDS covers editor flows broadly, but no reusable builder/settings-form contract exists.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:56)

### 5. File upload / image upload workflows

Status: `not covered`

Why this is a gap:

- Current condensed SSOT documents do not define an upload contract, while project plans still call out upload workflows.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:110)

### 6. Date/time input and calendar workflows

Status: `not covered`

Why this is a gap:

- The current rulebooks do not define date/time input behavior even though project plans identify `@mantine/dates` as an expected surface area.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:104)

### 7. Chart / analytics visualization surfaces

Status: `not covered`

Why this is a gap:

- GDS has dashboard priority guidance, but no visualization contract for charts, reporting canvases, or analytics blocks.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:174)
- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:198)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:34)

### 8. Map integrations

Status: `not covered`

Why this is a gap:

- Explicit exception area in ClassScout without any shared GDS contract.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:199)

### 9. Rich text / markdown editor contract

Status: `not covered`

Why this is a gap:

- Editor flows are mentioned broadly, but no canonical content-editor contract exists.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:56)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:59)

### 10. Command palette / spotlight flows

Status: `not covered`

Why this is a gap:

- `@mantine/spotlight` is identified as a likely optional package, but there is no GDS-level command palette contract.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:107)

### 11. Survey / questionnaire runtime flows

Status: `not covered`

Why this is a gap:

- GDS covers forms, but not multi-step survey/interruption-recovery UX.

Evidence:

- [PROJECTS/KIDEX_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/KIDEX_MANTINE_REFACTOR.md:150)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:258)

### 12. Game / rewards / leaderboard surfaces

Status: `not covered`

Why this is a gap:

- These are repeatedly named as remaining surfaces, but GDS has no shared gameplay or reward-surface contract.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:360)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/AMANOBA_MANTINE_REFACTOR.md:361)

### 13. Share dialogs / profile panels

Status: `not covered`

Why this is a gap:

- These are called out in ClassScout, but no cross-project contract exists.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:159)
- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md:97)

## 2B. Package surfaces shipped (2.3.0–2.3.2)

As of release **2.3.2**, the following are exported from `@gds/core`, `@gds/admin`, and `@gds/theme` (see [COMPATIBILITY_AND_RELEASES.md](./COMPATIBILITY_AND_RELEASES.md)):

- **core:** `MetricCard`, `ProgressCard`, `ProductCard`, `StateBlock`, `AuthShell`, `PublicShell`, `ArticleShell`, `PageHeader`, `GameBoardTile`, …
- **admin:** `DataToolbar`, `ResponsiveDataView`, `AppShell`, `WorkspaceHeader`, …
- **theme:** `extendGdsTheme`, `gdsTheme`, `withGdsMotion`, `./client` and `./server` entrypoints

Remaining Amanoba-blocking contracts: [docs/AMANOBA_BLOCKING_CONTRACTS.md](./docs/AMANOBA_BLOCKING_CONTRACTS.md).

## 2C. Covered In Policy, But Not Yet Delivered As Reusable GDS Package Surface (legacy inventory)

The items below were gaps before 2.3.0; many are now shipped. Kept for audit trail—prefer §2B and `AMANOBA_BLOCKING_CONTRACTS.md` for current status.

Missing reusable GDS package surfaces (historical):

### 1. Product card contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:80)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:35)

### 2. Metric/progress card contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:81)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:36)

Notes:

- `StatsStrip` and `InfoCard` exist, but no single shared `MetricCard` / `ProgressCard` contract is formalized in the package layer.

### 3. Data toolbar contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:82)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:37)

### 4. Responsive data view contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:82)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:65)

Notes:

- `DataTable` exists, but the mobile fallback contract is still only documented, not shipped as a reusable shared surface.

### 5. Auth shell contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:83)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:66)

### 6. Article/docs shell contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:84)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:67)

### 7. State-block family beyond `EmptyState`

Status: `partially covered`

Evidence:

- [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md:85)
- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:38)

Notes:

- `EmptyState` and `ConfirmDialog` exist, but there is no complete shared family for loading, permission, success, disabled, and not-enough-data states.

### 8. Full page-header contract with breadcrumb support

Status: `partially covered`

Evidence:

- [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md:14)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](/Users/Shared/Projects/general-design-system/PROJECTS/MESSMASS_MANTINE_REFACTOR.md:51)

## 3. Highest-Value Next Standardization Targets

If this inventory is used for sequencing, the highest-value next additions would be:

1. `MetricCard` / `ProgressCard`
2. `DataToolbar`
3. `ResponsiveDataView`
4. `AuthShell`
5. `ArticleShell`
6. `StateBlock` family expansion
7. upload/date/editor contracts
8. chart/map/embed exception guidance
