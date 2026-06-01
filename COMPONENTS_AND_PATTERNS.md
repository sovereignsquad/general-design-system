# Components & Patterns

Status: Active SSOT
Version: 3.0.0
Last updated: 2026-06-01

This document defines the canonical behavior for UI components, workflows, and responsive layouts. Adopting projects may not alter interaction meanings or bypass these required UX patterns.

Public reference site:

- overview: `https://sovereignsquad.github.io/general-design-system/`
- pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- family pages:
- `.../patterns/foundations`
- `.../patterns/public`
- `.../patterns/operations`
- `.../patterns/data`
- `.../patterns/access`
- `.../patterns/feedback`

The website is the live visual reference for these contracts. This document remains the normative SSOT for policy and required behavior.

The official website must also consume these contracts directly. `apps/playground` is the reference consumer, not a carve-out for local docs-only wrappers.

## 1. Application Shell & Navigation

- **Stable Shell**: Every authenticated product needs a stable shell that makes current location and primary destinations obvious.
- **Primary Navigation**: Must contain top-level destinations (e.g., `Records`, `Settings`), not actions. Maintain visible indicators for the active route.
- **Mobile Navigation**: Must preserve access to primary destinations without forcing users to open a drawer for routine work (prefer bottom nav or visible top tabs). Secondary nav and preferences belong in a drawer or overflow menu.
- **Page Headers**: Must answer: *Where am I? What is this for? What can I do next?* Page-level primary actions belong here. Avoid massive marketing-style headers in operational UI.
- **Shell Contracts**: Each project must define one local shell contract per user area (for example learner, admin, public, article/docs). Pages may not invent their own navigation rhythm once a shell contract exists.
- **DiscoveryShell**: Sidebar-first authenticated discovery, explore, catalog, and dashboard products must use `DiscoveryShell` as the canonical shell contract unless an approved exception is documented. It owns header, sidebar, main, mobile collapse, and sticky-nav rhythm.
- **DiscoveryShell State Governance**: Sidebar open/collapse behavior must use the shipped `useDiscoveryShellState` lane or the `DiscoveryShell` controlled props (`sidebarOpened`, `onSidebarOpenedChange`, `sidebarStorageKey`). Local ad-hoc state handling is not an approved replacement.
- **Sidebar IA**: Sidebar information architecture must be composed through `SidebarNav`, `SidebarNavSection`, and `SidebarNavItem` so section labels, active states, icon spacing, and mobile collapse semantics stay aligned.

## 2. Common Workflows & Patterns

- **Dashboards**: Prioritize next actions, urgent states, and important exceptions over broad analytics. On mobile, operational priorities load first; charts move lower.
- **Forms**: Validate early but don't punish typing (prefer blur/submit validation for complex forms). Group related fields. Submit buttons must show a loading state to prevent double submission.
- **Admin & Editor Flows**: Favor dense, predictable information. Bulk actions must show selected counts and consequences. Drafts should survive recoverable failures.
- **Search, Filters, & Lists**: Place filters near the data they affect. Active filters must be visible and removable. Preserving filters during navigation is a feature, not a bug.
- **Destructive Actions**: Must be visually distinct (e.g., danger color) and require confirmation for irreversible impacts. High-impact deletions must restate the target by name.
- **Pattern Service Reuse**: Repeated cards, metrics, tables, filters, auth panels, article layouts, and state blocks must be implemented through local contracts derived from `PATTERN_SERVICE_MODEL.md`, not per-page composition.
- **Semantic Actions**: Repeated CTA rows and button stacks must use `ActionBar` plus semantic action IDs. Do not create local button-stack wrappers when the need is priority orchestration rather than bespoke business logic.
- **Detail Surfaces**: Drawer and page detail experiences should converge on `DetailProfileShell` so hero, sections, related content, and action placement remain consistent between contexts.
- **Embed Surfaces**: Third-party maps and iframe panels must use `MapPanel` or a documented exception. Freeform embeds are not an approved default.

## 3. Core Component Contracts

| Component | Policy / Behavior | Preferred Size |
|---|---|---|
| **Buttons** | `primary` (main action), `secondary` (lower-emphasis), `subtle` (utility), `danger` (destructive). Do not place multiple primaries side by side. | `md` |
| **Choice Chips** | Neutral chips for lightweight filter, scope, taxonomy, and mode selection. Use active state and shared tokens rather than ad hoc badge colors or CSS pills. | `sm` |
| **Icon Buttons** | Must have accessible labels. Keep sizes stable in clusters. | `md` |
| **Inputs (Text/Search/Password)** | Visible labels required. Field-level errors must appear nearby. Show/hide required for passwords. Debounce remote search. | `md` |
| **Selects / Combobox** | Use `Select` for small sets, `Combobox` (searchable) for long lists. Canonical decision: do **not** wrap searchable selection yet; use governed Mantine composition for static and async search with shared labeling, empty, loading, and mobile ergonomics. Use `MultiSelect` only when truly needed. | `md` |
| **Checkboxes/Radios** | Checkbox = independent opt-in. Radio = mutually exclusive. Switch = immediate on/off action. | `md` |
| **Product Cards** | Fixed slots for media/icon, title, metadata, status/progress, primary action, and overflow actions. One visible primary action on mobile. | `md` |
| **Public Product Cards** | Media-first public cards must keep price, availability state, one clear mobile action, and localized helper/state messaging visible without consumer-local layout authority. | `md` |
| **Accent Panels** | Accent and emphasis surfaces must remain readable in light, dark, and auto color schemes through the shared accent contract, not raw tone-0 backgrounds. | `md` |
| **Metric Cards** | Prominent value, readable label, optional trend/status. Analytics may not outrank next action or urgent exceptions on mobile. | `md` |
| **Data Toolbars** | Search, filters, sort, reset, and create actions in predictable order. Active filters visible and removable. | `md` |
| **Listing State Contract** | Listing flows should use `ListingProvider` + `useListingState` with `SortMenu`, `ResultSummary`, `ActiveFilterChips`, and `BulkActionsBar` so search/sort/filter/page/selection stay in one governed runtime lane. | `md` |
| **Reporting Contracts** | Reporting-heavy workflows must use governed period controls, evidence/source panels, chart-token wrappers, text summaries, and table fallbacks. | `lg` |
| **State Blocks** | Loading, empty, error, permission, disabled, and success states must explain the state and provide the next action where possible. | `md` |
| **Async Surface** | Async data surfaces should use `AsyncSurface` to enforce deterministic loading/empty/error/refreshing/success behavior with governed retry affordances. | `md` |
| **Notification Contracts** | Transient and persistent feedback must use `GdsNotificationProvider`, `NotificationCenter`, `InlineAlert`, and `BannerNotice` with explicit severity and action semantics. | `md` |
| **Surface Presentation** | Shared bounded layout contract for canonical state and panel surfaces using `inline`, `centered`, and `fill` modes with controlled min-height and alignment. | `md` |
| **Discovery Shell** | Canonical sidebar-first shell with header, sidebar, main, mobile drawer collapse, optional footer nav, and sticky navigation behavior. | `xl` |
| **Sidebar Navigation** | Sectioned sidebar IA with labels, active-route signaling, semantic icons/labels, and consistent row spacing. | `md` |
| **Action Bar** | Semantic action orchestration for primary, secondary, tertiary, and icon-only actions with governed responsive wrapping. | `md` |
| **Listing Card** | Unified discovery/listing card for events, venues, communities, and similar public objects with media, metadata, disclosure, and save/share affordances. | `md` |
| **Share Button Group** | Governed public sharing contract with native share, copy-link, and channel buttons instead of product-local share wrappers. | `md` |
| **Public Food Card** | Food/menu card for dishes, bundles, bakery drops, and FMCG seasonal sets with governed freshness, pickup, scarcity, and action semantics. | `md` |
| **Food Menu Section** | Grouped weekly or category-based food/menu composition built on the canonical food-card contract. | `lg` |
| **Map Panel** | Sanctioned map/embed panel with shared header chrome, semantic actions, and built-in loading/empty/error states. | `lg` |
| **Detail Profile Shell** | Shared detail composition for page and drawer modes with hero, section stack, action placement, and related content. | `xl` |
| **Public Flow Shell** | Staged public-flow shell for consent, review, share, and recovery states around bounded hardware-adjacent or upload-driven experiences. | `xl` |
| **Playback Surface** | Fullscreen, embedded, or kiosk playback framing for timed or media-first presentation with governed error and degraded states. | `xl` |
| **Reference Section** | Canonical docs/reference content section with governed title, summary, density, and action rhythm for the official site and future reference surfaces. | `lg` |
| **Reference Link Grid** | Canonical docs/reference card grid for install, governance, demo, and pattern-navigation links with consistent CTA structure. | `lg` |
| **Reference Locale Notice** | Canonical disclosure surface for partial or in-progress localized reference-site coverage so language claims stay honest. | `md` |
| **Reference Theme Explorer** | Canonical shipped-theme explorer with preset switching, color-scheme preview, bounded creator-authored controls, and live proof surfaces. | `xl` |
| **Reference Site Shell** | Canonical public reference-site shell for the official website and future docs/reference properties using governed navigation, route context, and footer rhythm. | `xl` |
| **Docs Shell** | Canonical docs/reference shell for public documentation surfaces with full-width content and governed sidebar/header contracts. | `xl` |
| **Public Shells** | Public marketing/discovery/docs shells must define brand slot, navigation rhythm, readability width, CTA hierarchy, footer slot, and mobile nav behavior, including branded header variants and non-hook mobile nav patterns. | `md` |
| **Public Nav** | Primary public navigation uses explicit nav items, an explicit active item, and semantic `aria-current` handling. | `md` |
| **Auth Shells** | Auth entry surfaces must define intent, inline error/helper placement, guest/support lanes, provider-brand exception handling, safe action hierarchy, and canonical social-auth placement. | `md` |
| **Social Auth Buttons** | Provider-button cluster for Google, Apple, GitHub, and similar identity lanes with governed wording, spacing, loading/error/tenant-disabled states, and provider-brand treatment. Use `ProviderIdentityButton` / `ProviderIdentityButtonGroup`; `SocialAuthButtons` is a compatibility façade. | `md` |
| **Article Shells** | Docs/news/legal/editorial surfaces must define width, heading rhythm, metadata, side-rail behavior, and mobile collapse. | `md` |
| **Docs Page Shell** | Docs shells may add breadcrumbs, next-step affordances, side rail slots, and shared code-block treatment without redefining article readability rules. | `md` |
| **Editorial Hero** | Public/editorial hero sections must use a shared split text/media contract with one clear primary CTA, deterministic mobile collapse, and background-safe media fade behavior. | `xl` |
| **Feature Band** | Hero-adjacent trust/service/value strips must use a shared multi-column contract with honest loading and empty states. | `md` |
| **Browse Surface** | Catalog/discovery surfaces must use one governed result header + toolbar + filter + scope rhythm instead of page-local list chrome. | `lg` |
| **Editorial Cards** | Guide, promo, collection, and discovery cards must share one canonical media/title/meta/CTA contract. | `md` |
| **Consumer Sections** | Consumer account and member dashboard clusters must use a shared section shell with title, description, action, and governed content area. | `lg` |
| **Consumer Dashboard Grid** | Metric/progress/account-summary cards should use a shared responsive grid rhythm before introducing page-local dashboard layout CSS. | `lg` |
| **Media Fields** | Media editing must unify upload, URL entry, preview, typed status, retry/replace/reset/remove actions, accepted-type/size guidance, and policy messaging in one shared contract. | `lg` |
| **Content Operations Editor** | Admin content/settings editors must use a shared scaffold for multi-section editing, preview rails, and sticky or repeated save bars. | `xl` |
| **Section Panels** | Operational dashboards, detail pages, and settings surfaces must reuse the shared section/panel framing contract instead of local `SectionCard` wrappers. Body layout now includes the same shared presentation contract (`inline`, `centered`, `fill`). | `lg` |
| **Public Brand Footer** | Narrative/media/quote public footers must use a shared footer composition contract with documented layout variants and slot hooks instead of repo-local layout systems. | `lg` |
| **Filter Drawer** | Mobile/operational filters must use the shared drawer/bottom-sheet contract with explicit apply/reset/close behavior. | `md` |
| **Docs Code Blocks** | Install/reference code blocks must use a shared wrapper with accessible copy affordance and neutral styling. | `md` |
| **CTA Button Groups** | Public CTA groups must preserve one obvious primary action, stack safely on small screens, and avoid ornamental motion or hierarchy chrome. | `md` |
| **Upload Surfaces** | Upload/drop surfaces must define drag state, selection, pending/error/readonly states, a11y labels, accepted-type/size guidance, policy messaging, and retry/remove behavior. | `md` |
| **Access Summaries** | Role, scope, owner, blocked/forbidden/expired/permission-limited, and recovery cues must be explicit and may not rely on color only. | `md` |
| **Access Recovery Panels** | Protected-content, expired-session, timeout, unavailable, forbidden, and not-found failures must use one canonical recovery surface with clear state meaning and one obvious mobile recovery action. | `md` |
| **Placeholder Panels** | Placeholder and coming-soon surfaces must be honest, visibly non-live, and must not imply fabricated data. | `md` |
| **Simple Data Tables** | Public/product summary tables must support loading, empty, error, and threshold-safe states without importing admin CRUD semantics. | `md` |
| **Advanced Data Table** | Enterprise/operator tables should use `AdvancedDataTable` for governed sorting, row selection, density modes, sticky headers, and responsive card fallback behavior. | `lg` |
| **Stats Sections** | Repeated lightweight reporting sections must explicitly define loading, below-threshold, error, and live states. | `md` |

## 4. Feedback & Messaging

- **Alerts**: Scoped, meaningful state messaging. Must explain what the user can do next. Not for permanent page decoration.
- **Loaders & Skeletons**: Use skeletons when the layout shape is known. Use loaders for actions. Long operations need text status, not just a spinner.
- **Notifications**: Transient, cross-surface feedback. Do not use as the *only* place a critical error appears.
- **Badges**: Use `StatusBadge` for state, `CountBadge` for numeric counters, and `LabelTag` for taxonomy labels. Color must not be the only signal (use distinct text). Prefer `sm` size.
- **Modals**: Used for confirmation, focused edits, or blocking decisions. Trap focus inside. Do not stack modals. Mobile: near-full width. Desktop: centered, content-fit.
- **Drawers**: Used for filters or secondary panels. Must define clear mobile vs desktop width behavior.

## 5. Responsive Behavior & Touch Ergonomics

- **Small-Screen Priority**: 1. Next action -> 2. Urgent exception -> 3. Recent work -> 4. Analytics.
- **Table Responsive Strategies**: "Desktop table compressed onto mobile" is unacceptable. Must choose: horizontal scroll, list/card view, priority columns, or stacked rows.
- **Mobile Action Density**: List cards should have *one* visible primary action (others in overflow). Avoid adjacent icon-only clusters to prevent accidental taps. Touch targets must remain comfortable.

## 6. Required Reusable Pattern Families

The following families are mandatory local contracts when a project has the corresponding surface:

| Family | Required When | Must Define |
|---|---|---|
| **App Shell** | Product has authenticated, public, admin, or docs areas | navigation model, account controls, active route, mobile behavior |
| **DiscoveryShell** | Product has sidebar-first explore, catalog, directory, dashboard, or workspace surfaces | header/sidebar/main contract, mobile collapse, sticky sidebar, chrome spacing |
| **Page Header** | Product has more than one page | title, purpose text, primary action, secondary action placement |
| **Product Card** | Product lists courses, providers, children, records, articles, accounts, or other repeated objects | content slots, action slots, mobile order, loading/empty behavior |
| **Listing Card** | Product lists public discovery objects such as events, venues, communities, clubs, or offers | media ratio, disclosure, metadata rows, save/share/cta affordances |
| **Public Food Card** | Product lists dishes, prepared meals, bakery drops, bundles, or seasonal food sets | food-oriented price hierarchy, freshness/pickup/scarcity helper text, menu-specific states |
| **Food Menu Section** | Product presents grouped weekly menus, category menus, or preorder collections | grouped headings, section notes, category helper notes, governed item grids, empty menu handling |
| **Public Product Card** | Product has media-first menu, catalog, offer, or discovery cards | image treatment, price/helper hierarchy, availability states, localized helper labels, one mobile primary action, missing-image/loading behavior |
| **Metric / Progress Card** | Product shows repeated stats or progress | value hierarchy, label rules, trend/status rules, mobile priority |
| **Reporting Section** | Product has analytics, evidence, dashboard, KPI, or period-scoped reporting surfaces | period/scope control, metrics, evidence, chart summary, table fallback, partial/stale/permission-limited states |
| **Period Selector** | Product lets users change reporting period, scope, or freshness windows | timezone disclosure, selected period description, filtered/stale state, disabled/error handling |
| **Evidence Panel** | Product shows proof behind metrics, claims, reports, or moderation/audit decisions | source, freshness, confidence, evidence count, permission disclosure, retry action |
| **Chart Token Panel** | Product renders charts or sanctioned third-party visualization surfaces | text summary, non-color-only legend, GDS token mapping, empty/error/below-threshold states, accessible table fallback |
| **Data Toolbar / Responsive Data View** | Product has admin/editor/search/list workflows | search, filters, sort, reset, create, desktop table strategy, mobile fallback |
| **ActionBar** | Product has repeated action rows, save bars, CTA clusters, or semantic button stacks | primary/secondary/tertiary priority, icon-only lane, mobile wrapping, loading/disabled states |
| **Auth Shell** | Product has login, signup, account linking, consent, or guest entry | auth intent, inline errors, provider branding, anonymous/guest behavior, support fallback |
| **Social Auth Buttons** | Product has provider-based login, signup, SSO, or account-linking entry | provider ordering, brand treatment, divider usage, loading/error/tenant-disabled states. Prefer `ProviderIdentityButton` / `ProviderIdentityButtonGroup`; `SocialAuthButtons` is compatibility-only. |
| **Article / Docs Shell** | Product has release notes, docs, news, or blog content | article width, side rail behavior, metadata, typography, mobile collapse |
| **State Block** | Always | loading, empty, error, permission, disabled, success, not-enough-data states |
| **Surface Presentation Contract** | Shared surfaces that need bounded framing | `inline`, `centered`, and `fill` body behavior for state and panel surfaces |
| **Section Panel** | Operational dashboards and detail surfaces | Shared framed section surfaces with bounded panel body presentation |
| **Public Shell** | Product has public marketing, docs, listing, profile, or auth-adjacent surfaces | brand slot, nav model, readability width, CTA hierarchy, footer, mobile nav, branded header density |
| **Accent Surface** | Product needs a repeated highlighted guidance, support, rollout, or emphasis panel | readable light/dark tones, border/background/foreground semantics, nested focus visibility |
| **Editorial Hero** | Product has split text/media public landing sections | CTA hierarchy, media fade, mobile collapse, loading/error behavior |
| **Feature Band** | Product has repeated public trust/service/location bands | icon/media slot, title rhythm, loading/empty behavior, mobile stacking |
| **Browse Surface** | Product has searchable discovery, marketplace, catalog, or finder pages | result summary, filters, scope control, mobile filter entry, empty/error/loading states |
| **Editorial Card** | Product has repeated public guides, promos, collections, or editorial discovery cards | media slot, badge/meta rhythm, CTA treatment, hover/focus behavior |
| **Consumer Dashboard Section** | Product has member/account/dashboard areas | section chrome, summaries, partial-data handling, action placement |
| **Media Field** | Product allows media upload, URL entry, preview, replace, or remove | selection, preview, typed status, accepted-type/size guidance, progress, retry/replace/reset/remove, error/help/policy states |
| **Content Operations Editor** | Product has CMS-like settings, content, or site-operations screens | section grouping, preview/settings rails, action bar, validation/recovery rhythm |
| **DetailProfileShell** | Product has repeated page/drawer detail surfaces for profiles, items, or entities | hero/meta, sections, related content, action placement, divider rhythm |
| **MapPanel** | Product embeds maps or other sanctioned third-party iframe surfaces | title/description/actions, loading/empty/error states, embed accessibility and sizing |
| **Public Flow Shell** | Product has staged public capture, upload, consent, review, share, or recovery journeys | stage header, state semantics, action ordering, bounded runtime/hardware slot |
| **Share Button Group** | Product exposes public sharing, referrals, invites, or copy-link flows | native share fallback, copy feedback, external channel labeling, compact/icon-only behavior |
| **Playback Surface** | Product has fullscreen, kiosk, slideshow, or timed media presentation | playback framing, degraded/error/empty states, lightweight control lane, mode semantics |
| **Searchable Selection** | Product has repeated searchable selects or comboboxes | use the documented Mantine recipe path first; do not invent local wrappers unless GDS promotes a new canonical export |
| **Public Brand Footer** | Product uses branded footer storytelling beyond a plain link list | narrative, actions, secondary quote/media slot, legal row, mobile collapse, layout variant choice |
| **Reference Site Shell** | Product or property is the official docs/reference site for a governed system | public nav model, route grouping, live-demo disclosure, footer rhythm, locale notice placement |
| **Reference Theme Explorer** | Product or property needs a governed public theme-inspection surface | shipped preset list, preview scheme control, creator-authored guardrails, preview reset, live proof surfaces |
| **Upload / Media Surface** | Product allows image/file selection, drop, preview, replace, or remove | drag states, selection, pending/error/readonly states, accepted-type/size guidance, policy copy, retry/remove slots |
| **Access Summary** | Product has scoped roles or blocked/forbidden/expired/permission-limited states | role badges, scope labels, owner labels, recovery hints, non-color-only state labels |
| **Access Recovery** | Product has protected routes, scope failures, expired sessions, timeouts, or recoverable not-found/unavailable states | sign-in, back, retry, support fallback, action priority, mobile recovery hierarchy |

Mantine UI examples may be used to inform these contracts only after the project confirms the GDS behavior, responsive rules, and token boundaries remain unchanged.

### Media/Upload State Matrix

`MediaField` is the canonical field-level contract for assets that can be uploaded, linked by URL, previewed, replaced, reset, removed, or locked. It owns visible state, field chrome, help/error/policy placement, accepted-type and size guidance, progress presentation, and action-slot ordering. It does not upload files or call storage APIs.

Supported `MediaField` states:

| State | Meaning | Required UX |
|---|---|---|
| `empty` | No asset is selected | Show upload or URL entry plus helper/policy copy |
| `drag-active` | A file is being dragged into a supported region | Show a visible drop affordance without relying on color only |
| `selected` | An asset is selected but not necessarily persisted | Show preview/value and available replace/reset/remove actions |
| `preview-loading` | Preview is resolving | Show preview status and keep recovery actions stable |
| `uploading` | Consumer upload is in progress | Show bounded progress when supplied and do not imply hidden retries |
| `upload-failed` | Consumer upload failed | Show inline error/policy and a visible retry slot |
| `unsupported-type` | File type violates the consumer policy | Show accepted type guidance and a recovery action |
| `too-large` | File size violates the consumer policy | Show max-size guidance and a recovery action |
| `removed` | Asset was removed from the field | Show the removed state and keep reset/reselect path available when applicable |
| `saved` | Asset is persisted or confirmed by the consumer | Show preview/value and governed edit actions |
| `invalid` | Field validation failed outside upload policy | Show inline error and described recovery |
| `readonly` | Asset is visible but not editable | Suppress edit controls and keep preview/value/policy visible |

`UploadDropzone` is the canonical selection/drop surface. It owns keyboard file selection, drag state, selected-file summary, error/status/policy presentation, accepted-type and max-size guidance, retry/remove action slots, and readonly/disabled presentation. It must never own network transport, storage mutation, hidden retries, or timeouts. Consumers pass structured state (`upload-pending`, `upload-failed`, `unsupported-type`, `too-large`, `readonly`) from their runtime and wire retry/timeout behavior through explicit action slots.

### Reporting, Evidence, and Chart Rules

Reporting surfaces must not present charts or KPIs without proof context. Use `ReportingSection` as the top-level composition when a page combines period controls, metrics, charting, evidence, and fallback data. Use `PeriodSelector` for period/scope changes, `EvidencePanel` for source/freshness/confidence disclosure, and `ChartTokenPanel` for chart containment.

Required reporting states:

| State | Meaning | Required UX |
|---|---|---|
| `loading` | Report data is synchronizing | Show explicit loading text; do not leave blank charts |
| `below-threshold` | Privacy or quality threshold is not met | Hide sensitive aggregates and explain threshold behavior |
| `partial` | Some sources are missing | Keep the report visible only with a partial-data disclosure |
| `empty` | No records match the scope | Explain the empty scope and offer a next action where possible |
| `error` | Report preparation failed | Show retry action slot; GDS does not fetch or retry |
| `stale` | Data exists but is outside freshness expectations | Show freshness disclosure and refresh affordance where available |
| `filtered` | User or policy filters affect the result | Keep active scope/filter context visible |
| `permission-limited` | Access rules hide some evidence or rows | Explain what is hidden without leaking private data |

Chart rules:

- charts must include a text summary that communicates the main result without requiring visual interpretation
- legends must use labels plus token names or semantic descriptions; color alone is not enough
- charts must provide a table fallback for the underlying summarized data when the data is meaningful to inspect
- GDS owns chart wrapper, state, legend, summary, and fallback placement; consumers own chart library choice, data fetching, retries, timeouts, and timezone math
- external chart embeds remain exception surfaces unless wrapped in `ChartTokenPanel` or another sanctioned GDS chart wrapper

### Access, Auth, and Identity Rules

Auth and protected-content surfaces must use `AuthShell`, `ProviderIdentityButton`, `ProviderIdentityButtonGroup`, `SocialAuthButtons`, `AccessSummary`, and `AccessRecoveryPanel` before creating local wrappers.

Auth shell states and lanes:

- `sign-in`, `sign-up`, `account-linking`, and `guest-entry` intent must be visible through the shell contract
- provider errors must be inline and announced through accessible alert semantics
- guest and support fallback actions must be explicit slots, not hidden links in product copy
- GDS owns provider button presentation, label rhythm, disabled/loading/error/tenant-policy states, touch target, and focus visibility
- consumers own OAuth/OIDC redirects, session mutation, provider telemetry, retries, and timeout logic

Provider-brand governance:

- approved providers are declared in `compliance.identityProviderBranding.approvedProviders`
- visual variants are bounded by `allowedVariants`
- forbidden local customizations are declared in `forbiddenCustomizations`
- `getSupportedProviderIdentityIds()` exposes the shipped provider lane list
- `getProviderIdentityPolicy(provider)` exposes the runtime policy metadata consumers can log or compare
- unsupported providers must use explicit labels and remain governed by the neutral fallback style unless approved by policy

Access and recovery states:

| State | Required UX |
|---|---|
| `unauthenticated` | Sign-in action first, safe back action second |
| `expired-session` | Sign-in or retry without losing recovery context |
| `timeout` | Retry action first, back/support fallback visible |
| `forbidden` | Scope meaning explained without leaking private data |
| `missing` | Not-found meaning separated from permission failure |
| `unavailable` | Retry/back/support hierarchy visible |
| `permission-limited` | Access summaries disclose limited scope and owner/recovery path |

## 7. Semantic Vocabulary Extension Lane

When a product needs a governed semantic action that does not exist in the core vocabulary, extend it through `createGdsVocabularyPack(namespace, actions)` and pass the resulting pack into `SemanticButton`, `ActionBar`, or `SidebarNavItem`.

Rules:

- use a stable product namespace such as `camera`
- keep extension labels semantic and reusable, not page-specific copy
- do not bypass the system with raw labels/icons in shared action primitives
- upstream the action into core when the need repeats across products
