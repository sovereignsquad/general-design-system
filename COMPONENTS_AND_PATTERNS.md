# Components & Patterns

Status: Active SSOT
Version: 2.5.1
Last updated: 2026-05-25

This document defines the canonical behavior for UI components, workflows, and responsive layouts. Adopting projects may not alter interaction meanings or bypass these required UX patterns.

## 1. Application Shell & Navigation

- **Stable Shell**: Every authenticated product needs a stable shell that makes current location and primary destinations obvious.
- **Primary Navigation**: Must contain top-level destinations (e.g., `Records`, `Settings`), not actions. Maintain visible indicators for the active route.
- **Mobile Navigation**: Must preserve access to primary destinations without forcing users to open a drawer for routine work (prefer bottom nav or visible top tabs). Secondary nav and preferences belong in a drawer or overflow menu.
- **Page Headers**: Must answer: *Where am I? What is this for? What can I do next?* Page-level primary actions belong here. Avoid massive marketing-style headers in operational UI.
- **Shell Contracts**: Each project must define one local shell contract per user area (for example learner, admin, public, article/docs). Pages may not invent their own navigation rhythm once a shell contract exists.

## 2. Common Workflows & Patterns

- **Dashboards**: Prioritize next actions, urgent states, and important exceptions over broad analytics. On mobile, operational priorities load first; charts move lower.
- **Forms**: Validate early but don't punish typing (prefer blur/submit validation for complex forms). Group related fields. Submit buttons must show a loading state to prevent double submission.
- **Admin & Editor Flows**: Favor dense, predictable information. Bulk actions must show selected counts and consequences. Drafts should survive recoverable failures.
- **Search, Filters, & Lists**: Place filters near the data they affect. Active filters must be visible and removable. Preserving filters during navigation is a feature, not a bug.
- **Destructive Actions**: Must be visually distinct (e.g., danger color) and require confirmation for irreversible impacts. High-impact deletions must restate the target by name.
- **Pattern Service Reuse**: Repeated cards, metrics, tables, filters, auth panels, article layouts, and state blocks must be implemented through local contracts derived from `PATTERN_SERVICE_MODEL.md`, not per-page composition.

## 3. Core Component Contracts

| Component | Policy / Behavior | Preferred Size |
|---|---|---|
| **Buttons** | `primary` (main action), `secondary` (lower-emphasis), `subtle` (utility), `danger` (destructive). Do not place multiple primaries side by side. | `md` |
| **Icon Buttons** | Must have accessible labels. Keep sizes stable in clusters. | `md` |
| **Inputs (Text/Search/Password)** | Visible labels required. Field-level errors must appear nearby. Show/hide required for passwords. Debounce remote search. | `md` |
| **Selects / Combobox** | Use `Select` for small sets, `Combobox` (searchable) for long lists. Use `MultiSelect` only when truly needed. | `md` |
| **Checkboxes/Radios** | Checkbox = independent opt-in. Radio = mutually exclusive. Switch = immediate on/off action. | `md` |
| **Product Cards** | Fixed slots for media/icon, title, metadata, status/progress, primary action, and overflow actions. One visible primary action on mobile. | `md` |
| **Public Product Cards** | Media-first public cards must keep price, availability state, one clear mobile action, and localized helper/state messaging visible without consumer-local layout authority. | `md` |
| **Accent Panels** | Accent and emphasis surfaces must remain readable in light, dark, and auto color schemes through the shared accent contract, not raw tone-0 backgrounds. | `md` |
| **Metric Cards** | Prominent value, readable label, optional trend/status. Analytics may not outrank next action or urgent exceptions on mobile. | `md` |
| **Data Toolbars** | Search, filters, sort, reset, and create actions in predictable order. Active filters visible and removable. | `md` |
| **State Blocks** | Loading, empty, error, permission, disabled, and success states must explain the state and provide the next action where possible. | `md` |
| **Public Shells** | Public marketing/discovery/docs shells must define brand slot, navigation rhythm, readability width, CTA hierarchy, footer slot, and mobile nav behavior, including branded header variants and non-hook mobile nav patterns. | `md` |
| **Public Nav** | Primary public navigation uses explicit nav items, an explicit active item, and semantic `aria-current` handling. | `md` |
| **Auth Shells** | Auth entry surfaces must define title, error/helper placement, provider-brand exception handling, and safe action hierarchy. | `md` |
| **Article Shells** | Docs/news/legal/editorial surfaces must define width, heading rhythm, metadata, side-rail behavior, and mobile collapse. | `md` |
| **Docs Page Shell** | Docs shells may add breadcrumbs, next-step affordances, side rail slots, and shared code-block treatment without redefining article readability rules. | `md` |
| **Editorial Hero** | Public/editorial hero sections must use a shared split text/media contract with one clear primary CTA, deterministic mobile collapse, and background-safe media fade behavior. | `xl` |
| **Feature Band** | Hero-adjacent trust/service/value strips must use a shared multi-column contract with honest loading and empty states. | `md` |
| **Browse Surface** | Catalog/discovery surfaces must use one governed result header + toolbar + filter + scope rhythm instead of page-local list chrome. | `lg` |
| **Editorial Cards** | Guide, promo, collection, and discovery cards must share one canonical media/title/meta/CTA contract. | `md` |
| **Consumer Sections** | Consumer account and member dashboard clusters must use a shared section shell with title, description, action, and governed content area. | `lg` |
| **Media Fields** | Media editing must unify upload, URL entry, preview, status, reset/remove, and policy messaging in one shared contract. | `lg` |
| **Content Operations Editor** | Admin content/settings editors must use a shared scaffold for multi-section editing, preview rails, and sticky or repeated save bars. | `xl` |
| **Public Brand Footer** | Narrative/media/quote public footers must use a shared footer composition contract with documented layout variants and slot hooks instead of repo-local layout systems. | `lg` |
| **Docs Code Blocks** | Install/reference code blocks must use a shared wrapper with accessible copy affordance and neutral styling. | `md` |
| **CTA Button Groups** | Public CTA groups must preserve one obvious primary action, stack safely on small screens, and avoid ornamental motion or hierarchy chrome. | `md` |
| **Upload Surfaces** | Upload/drop surfaces must define drag state, a11y labels, empty/error messaging, and replace/remove behavior. | `md` |
| **Access Summaries** | Role, scope, blocked/forbidden, and ownership cues must be explicit and may not rely on color only. | `md` |
| **Access Recovery Panels** | Protected-content and expired-session failures must use one canonical recovery surface with clear state meaning and one obvious mobile recovery action. | `md` |
| **Placeholder Panels** | Placeholder and coming-soon surfaces must be honest, visibly non-live, and must not imply fabricated data. | `md` |
| **Simple Data Tables** | Public/product summary tables must support loading, empty, error, and threshold-safe states without importing admin CRUD semantics. | `md` |
| **Stats Sections** | Repeated lightweight reporting sections must explicitly define loading, below-threshold, error, and live states. | `md` |

## 4. Feedback & Messaging

- **Alerts**: Scoped, meaningful state messaging. Must explain what the user can do next. Not for permanent page decoration.
- **Loaders & Skeletons**: Use skeletons when the layout shape is known. Use loaders for actions. Long operations need text status, not just a spinner.
- **Notifications**: Transient, cross-surface feedback. Do not use as the *only* place a critical error appears.
- **Badges**: Compact state indication. Color must not be the only signal (use distinct text). Prefer `sm` size.
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
| **Page Header** | Product has more than one page | title, purpose text, primary action, secondary action placement |
| **Product Card** | Product lists courses, providers, children, records, articles, accounts, or other repeated objects | content slots, action slots, mobile order, loading/empty behavior |
| **Public Product Card** | Product has media-first menu, catalog, offer, or discovery cards | image treatment, price/helper hierarchy, availability states, localized helper labels, one mobile primary action, missing-image/loading behavior |
| **Metric / Progress Card** | Product shows repeated stats or progress | value hierarchy, label rules, trend/status rules, mobile priority |
| **Data Toolbar / Responsive Data View** | Product has admin/editor/search/list workflows | search, filters, sort, reset, create, desktop table strategy, mobile fallback |
| **Auth Shell** | Product has login, signup, account linking, consent, or guest entry | auth actions, error placement, provider branding, anonymous/guest behavior |
| **Article / Docs Shell** | Product has release notes, docs, news, or blog content | article width, side rail behavior, metadata, typography, mobile collapse |
| **State Block** | Always | loading, empty, error, permission, disabled, success, not-enough-data states |
| **Public Shell** | Product has public marketing, docs, listing, profile, or auth-adjacent surfaces | brand slot, nav model, readability width, CTA hierarchy, footer, mobile nav, branded header density |
| **Accent Surface** | Product needs a repeated highlighted guidance, support, rollout, or emphasis panel | readable light/dark tones, border/background/foreground semantics, nested focus visibility |
| **Editorial Hero** | Product has split text/media public landing sections | CTA hierarchy, media fade, mobile collapse, loading/error behavior |
| **Feature Band** | Product has repeated public trust/service/location bands | icon/media slot, title rhythm, loading/empty behavior, mobile stacking |
| **Browse Surface** | Product has searchable discovery, marketplace, catalog, or finder pages | result summary, filters, scope control, mobile filter entry, empty/error/loading states |
| **Editorial Card** | Product has repeated public guides, promos, collections, or editorial discovery cards | media slot, badge/meta rhythm, CTA treatment, hover/focus behavior |
| **Consumer Dashboard Section** | Product has member/account/dashboard areas | section chrome, summaries, partial-data handling, action placement |
| **Media Field** | Product allows media upload, URL entry, preview, replace, or remove | selection, preview, status, reset/remove, error/help/policy states |
| **Content Operations Editor** | Product has CMS-like settings, content, or site-operations screens | section grouping, preview/settings rails, action bar, validation/recovery rhythm |
| **Public Brand Footer** | Product uses branded footer storytelling beyond a plain link list | narrative, actions, secondary quote/media slot, legal row, mobile collapse, layout variant choice |
| **Upload / Media Surface** | Product allows image/file selection, drop, preview, replace, or remove | drag states, selection, preview, replace/remove, status overlays |
| **Access Summary** | Product has scoped roles or blocked/forbidden states | role badges, scope labels, blocked/forbidden handling, ownership cues |
| **Access Recovery** | Product has protected routes, scope failures, expired sessions, or recoverable not-found/unavailable states | sign-in, back, retry, support fallback, action priority, mobile recovery hierarchy |

Mantine UI examples may be used to inform these contracts only after the project confirms the GDS behavior, responsive rules, and token boundaries remain unchanged.
