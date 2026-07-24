# GDS Gap Inventory

Status: Working inventory  
Last updated: 2026-07-23

> **Note (2026-07-23):** this file's remaining "not covered" claims were
> cross-checked against current source (previously several were stale —
> charts, uploads, command palette, evidence panels, and period selectors
> were all already resolved and have been corrected below). See
> [`DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md`](DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md)
> for the current, source-verified gap list benchmarked against major
> external design systems — prefer that document for new planning going
> forward; this one is kept for its project-specific evidence trail.

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

- [PROJECTS/SSO_MANTINE_REFACTOR.md](PROJECTS/SSO_MANTINE_REFACTOR.md#L43)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L173)

### 2. White-label / tenant / organization theme variation

Status: `not covered`

Examples:

- SSO style-editor legacy surface
- Messmass organization/partner editors

Why this is a gap:

- GDS requires one token authority per product, but it does not yet define how controlled per-tenant/per-org branding variation should work.

Evidence:

- [PROJECTS/SSO_MANTINE_REFACTOR.md](PROJECTS/SSO_MANTINE_REFACTOR.md#L184)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L131)

### 3. Reporting / analytics dashboard theme grammar

Status: `partially covered`

Examples:

- dense KPI/reporting/gds-admin analytics surfaces
- evidence-heavy reporting workspaces

Why this is a gap:

- GDS covers metric cards and dashboard priority rules, but it does not yet define a full shared visual grammar for reporting-heavy screens.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L19)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L111)
- [PROJECTS/KIDEX_MANTINE_REFACTOR.md](PROJECTS/KIDEX_MANTINE_REFACTOR.md#L49)

### 4. Mixed-mode preview/editor theme exception

Status: `not covered`

Why this is a gap:

- Foundation allows preview/editor exceptions to the “one active mode” rule, but no reusable contract defines how those exceptions should behave.

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L55)

### 5. Editorial / docs shell theme variant

Status: `partially covered`

Examples:

- docs/news/legal/article surfaces
- Narimato legal/docs shell backlog
- SSO docs shell migration

Why this is a gap:

- GDS covers article/docs shells generically, but there is no shared package-level article/docs theme or surface implementation yet.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L67)
- [PROJECTS/NARIMATO.md](PROJECTS/NARIMATO.md#L61)
- [PROJECTS/SSO_MANTINE_REFACTOR.md](PROJECTS/SSO_MANTINE_REFACTOR.md#L43)

### 6. Game / immersive full-viewport theme chrome

Status: `not covered`

Examples:

- Amanoba game UI internals
- Narimato full-viewport game layout

Why this is a gap:

- GDS does not currently define any immersive/gameplay theme contract.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L169)
- [PROJECTS/NARIMATO.md](PROJECTS/NARIMATO.md#L66)

### 7. Certificate / OG / email rendering palettes

Status: `not covered`

Why this is a gap:

- These surfaces are explicitly treated as exceptions, but GDS has no shared palette contract for them.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L170)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L171)

### 8. Chart / map / embed theming rules

Status: `not covered`

Why this is a gap:

- GDS allows charts/maps/embeds as exceptions, but does not define how their colors should align with Mantine tokens.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L198)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L174)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L63)

## 2. UI/UX Elements Not Covered By GDS

## 2A. Not Covered At The SSOT Contract Level

### 1. Breadcrumbs

Status: `resolved` (issue #390) — `GdsBreadcrumbs` ships as a standalone, independently reusable breadcrumb trail; `DocsPageShell` now uses it internally.

Why this was a gap:

- Breadcrumb behavior was only embedded inside `PageHeader`/`WorkspaceHeader`/`DocsPageShell`, with no standalone, independently exported primitive.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L51)
- [DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md](DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md) P0 item 2

### 2. Period selectors / reporting time-range controls

Status: `not covered`

Why this is a gap:

- Data toolbars mention search/filter/sort/reset/create, but not reporting-specific date/period controls.

Evidence:

- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L37)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L53)

### 3. Evidence panels

Status: `not covered`

Why this is a gap:

- Evidence-heavy reporting/queue layouts are named in project work, but no GDS contract exists for them.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L55)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L118)

### 4. Editor/builder settings flows

Status: `not covered`

Why this is a gap:

- GDS covers editor flows broadly, but no reusable builder/settings-form contract exists.

Evidence:

- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L56)

### 5. File upload / image upload workflows

Status: `resolved` — `UploadDropzone` and `MediaField` ship in `@sovereignsquad/gds-core` (network transport remains a documented consumer responsibility; GDS owns the UI states only).

Evidence (historical):

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L110)

### 6. Date/time input and calendar workflows

Status: `in progress` (tracking issue #389, part of the 2026-07-23 delivery batch)

Why this was a gap:

- `GdsSchemaForm` infers a `date` field type from JSON Schema `format: 'date'`, but no backing UI component shipped — `@mantine/dates` was not a dependency anywhere in the monorepo.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L104)
- [DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md](DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md) P0 item 1

### 7. Chart / analytics visualization surfaces

Status: `resolved` — `GdsChart` ships a 12-type governed wrapper/contract (two type sets, per-type validation rules) plus `SemanticCharts` (`GdsAreaChart`/`GdsSparkline`/`GdsLongitudinalChart`/`GdsBenchmarkBarChart`/`GdsRadarChart`/`GdsMaturityRadarChart`/`GdsGaugeChart`), `ReportingSection`, `PeriodSelector`, and `EvidencePanel`.

Evidence (historical):

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L174)
- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L198)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L34)

### 8. Map integrations

Status: `resolved` — `MapPanel` ships as a governed embed-exception surface (deliberately outside the `GdsChart` contract; see `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md` item 10 for the remaining nuance that maps aren't a chart *type*).

Evidence (historical):

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L199)

### 9. Rich text / markdown editor contract

Status: `resolved` (issue #392) — `GdsRichTextEditor` (Tiptap-backed, encapsulated behind a dedicated `@sovereignsquad/gds-core/rich-text-editor` subpath so the dependency stays opt-in) now composes into `ContentOpsEditor`'s demo as the description field.

Why this was a gap:

- "Content Ops Editor" patterns own the surrounding layout (section grouping, preview rail, save bar) but not the actual text-editing surface inside them.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L56)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L59)
- [DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md](DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md) P1 item 4

### 10. Command palette / spotlight flows

Status: `resolved` — `CommandPalette.client.tsx` ships `CommandRegistryProvider`/`useCommandLauncher` as a GDS-level command palette contract (not `@mantine/spotlight` directly).

Evidence (historical):

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L107)

### 11. Survey / questionnaire runtime flows

Status: `not covered`

Why this is a gap:

- GDS covers forms, but not multi-step survey/interruption-recovery UX.

Evidence:

- [PROJECTS/KIDEX_MANTINE_REFACTOR.md](PROJECTS/KIDEX_MANTINE_REFACTOR.md#L150)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L258)

### 12. Game / rewards / leaderboard surfaces

Status: `not covered`

Why this is a gap:

- These are repeatedly named as remaining surfaces, but GDS has no shared gameplay or reward-surface contract.

Evidence:

- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L360)
- [PROJECTS/AMANOBA_MANTINE_REFACTOR.md](PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L361)

### 13. Share dialogs / profile panels

Status: `not covered`

Why this is a gap:

- These are called out in ClassScout, but no cross-project contract exists.

Evidence:

- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L159)
- [PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md](PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L97)

## 2B. Package surfaces shipped (2.3.0–2.3.2)

As of release **2.3.2**, the following are exported from `@sovereignsquad/gds-core`, `@sovereignsquad/gds-admin`, and `@sovereignsquad/gds-theme` (see [COMPATIBILITY_AND_RELEASES.md](./COMPATIBILITY_AND_RELEASES.md)):

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

- [FOUNDATION.md](FOUNDATION.md#L80)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L35)

### 2. Metric/progress card contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L81)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L36)

Notes:

- `StatsStrip` and `InfoCard` exist, but no single shared `MetricCard` / `ProgressCard` contract is formalized in the package layer.

### 3. Data toolbar contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L82)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L37)

### 4. Responsive data view contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L82)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L65)

Notes:

- `DataTable` exists, but the mobile fallback contract is still only documented, not shipped as a reusable shared surface.

### 5. Auth shell contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L83)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L66)

### 6. Article/docs shell contract/component

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L84)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L67)

### 7. State-block family beyond `EmptyState`

Status: `partially covered`

Evidence:

- [FOUNDATION.md](FOUNDATION.md#L85)
- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L38)

Notes:

- `EmptyState` and `ConfirmDialog` exist, but there is no complete shared family for loading, permission, success, disabled, and not-enough-data states.

### 8. Full page-header contract with breadcrumb support

Status: `partially covered`

Evidence:

- [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md#L14)
- [PROJECTS/MESSMASS_MANTINE_REFACTOR.md](PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L51)

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
