# Per-Component Accessibility Reference

Status: Active SSOT
Version: 6.5.0
Last updated: 2026-08-08

Every leading design system (Carbon, Primer, Fluent, Adobe React Aria) ships a per-component **Accessibility** section: a keyboard-interaction table, focus behavior, screen-reader expectations, and an explicit "what the system provides vs. what you must do" split. This is that reference for GDS (issue #448). It is generated against the same package-owned accessibility-evidence registry that gates every release (`apps/playground/src/accessibility-evidence-registry.ts`, enforced by `npm run verify:accessibility-evidence`), so it cannot silently drift from what the components actually do.

For the formal conformance mapping, see the [Accessibility Conformance Report (VPAT / WCAG 2.2 AA)](../VPAT_CONFORMANCE.md). For the reusable CI helpers your own app can adopt, see [`A11Y_CI_PACKAGE.md`](../A11Y_CI_PACKAGE.md).

## How to read this — the provider / consumer split

GDS is a component library, so accessibility is a shared contract:

- **GDS provides (the "system"):** semantic roles, keyboard operability, focus management, visible focus (light/dark/forced-colors), state exposure (name/role/value), localized status announcements, and the CI gates that keep them from regressing.
- **You provide (the "consumer"):** the real content and text alternatives, meaningful labels and link text, page structure (landmarks, headings, `lang`, page title, skip links), and running the `@sovereignsquad/gds-a11y` gate on your assembled routes.

Each section below is explicit about which half is which.

## Baseline that every stable GDS pattern guarantees

These hold for every stable pattern regardless of family (mandatory registry fields, release-gated):

- **Keyboard:** all documented interactions are reachable and operable from the keyboard; `Tab`/`Shift+Tab` follow a deterministic order; `Enter`/`Space` activate the focused control; `Escape` closes governed transient surfaces (menus, drawers, overlays) where present.
- **Focus:** visible focus is preserved in light, dark, **and** forced-colors modes and never depends on hover-only reveal or color-only state.
- **Screen reader:** documented semantics are exposed through semantic HTML or governed roles; state copy stays visible in the DOM (not color-only).
- **WCAG baseline mapping:** `1.3.1` Info & Relationships, `1.4.3` Contrast (Minimum), `2.1.1` Keyboard, `2.4.7` Focus Visible, `4.1.2` Name, Role, Value.
- **AT/browser evidence:** reviewed against VoiceOver + Safari (iOS, macOS) and NVDA + Chrome/Firefox (Windows).

## Per-family reference

The registry scopes keyboard/screen-reader/recovery evidence by pattern family. Every component in a family inherits its family row; the [component callouts](#high-traffic-component-callouts) below add component-specific detail.

### Foundations (shells, navigation, controls, cards)

| Aspect | Behavior |
|---|---|
| Tab sequence | `Tab`/`Shift+Tab` move between shell actions, governed controls, and visible navigation targets in a deterministic order. |
| Activation | `Enter` and `Space` trigger the focused control without a pointer-only affordance. |
| Escape | `Escape` closes governed drawers, menus, and temporary shells when present. |
| Other keys | Arrow keys move inside roving/grouped controls where exposed; `Home`/`End` keep native behavior. |
| Screen reader | header / navigation / main landmarks, named buttons and links; active route and expanded/collapsed nav state stay programmatic. |
| Consumer recovery | If shell behavior regresses, pin the previous package version and keep route-local wrappers deleted until the contract is corrected. |

### Public, editorial & docs

| Aspect | Behavior |
|---|---|
| Tab sequence | Moves through discovery actions, navigation, share controls, and visible CTAs without dead ends. |
| Activation | `Enter`/`Space` activate the focused control and preserve link semantics where navigation is expected. |
| Escape | Dismisses temporary overlays, share layers, and media affordances when present. |
| Screen reader | article/section/list semantics, named links/buttons, media alt/fallback content where relevant; empty/unavailable content uses explicit fallback copy. |
| Consumer recovery | If a public surface exposes an AT regression, remove the affected affordance and fall back to the shipped simpler surface. |

### Operations (dashboards, editing, workflows)

| Aspect | Behavior |
|---|---|
| Tab sequence | Moves through headers, state messaging, inputs, metrics, and mutation actions in task order. |
| Activation | `Enter`/`Space` submit or trigger the governed action; destructive actions keep explicit confirmation. |
| Escape | Exits transient panels and search/drawer affordances without losing page context. |
| Screen reader | form labels/descriptions, status/alert roles where relevant, table/summary semantics; loading/success/error/disabled states stay explicit in copy. |
| Consumer recovery | If an operational pattern regresses, keep mutation paths on the previous package version and use the documented error/empty contract until the patch lands. |

### Data & search

| Aspect | Behavior |
|---|---|
| Tab sequence | Moves through filters, table chrome, bulk actions, and row-level affordances without trapping focus. |
| Activation | `Enter`/`Space` apply the focused filter/action and preserve native table/link semantics. |
| Escape | Closes filter drawers, popovers, and temporary picker surfaces when present. |
| Screen reader | table headers, listbox/menu semantics, filter labels, count/scope summaries, bulk-selection state; fallback tables preserve non-chart access paths. |
| Consumer recovery | If keyboard/semantic data behavior regresses, fall back to the shipped simple table or filter lane before adding local wrappers. |

### Access & recovery

| Aspect | Behavior |
|---|---|
| Tab sequence | Moves through permission summaries, identity controls, and recovery actions in visible order. |
| Activation | `Enter`/`Space` trigger the focused identity/recovery action without relying on color cues alone. |
| Escape | Closes overlays or supporting dialogs when the access pattern renders them. |
| Screen reader | permission/identity summaries, named provider actions, recovery guidance text; blocked/expired/limited states stay explicit. |
| Consumer recovery | If identity/permission evidence becomes stale, keep the previous stable access lane and publish the limitation before rollout. |

### Feedback & messaging

| Aspect | Behavior |
|---|---|
| Tab sequence | Moves through alerts, retry actions, modals, drawers, and resolution actions in current task priority. |
| Activation | `Enter`/`Space` trigger retry/confirm/dismiss/continue from the focused control. |
| Escape | Dismisses temporary feedback surfaces when dismissal is allowed; modal/drawer focus is intentionally bounded while open. |
| Screen reader | alert/dialog/drawer/status content, named confirm/retry controls, state headings; errors/retries stay visible without hover-only disclosure. |
| Consumer recovery | If feedback semantics regress, pin the previous package version and keep recovery states visible through the prior shipped surface. |

## High-traffic component callouts

### KanbanBoard (`@sovereignsquad/gds-core`)

| Interaction | Keys / behavior | Provided by |
|---|---|---|
| Move a card to another column | Each card exposes a **"Move to column" menu** trigger (a labeled button, `"Move: {item}"`); `Enter`/`Space` opens it, arrow keys + `Enter` pick the target column. This is the guaranteed keyboard/SR path and is **always present**. | GDS |
| Optional pointer/keyboard drag (`enableDrag`) | Adds a separate, labeled, keyboard-focusable drag handle built on `@dnd-kit` keyboard/pointer sensors (no native HTML5 drag). It never replaces the move menu. Verified by `verify:kanban-drag-accessibility-runtime`. | GDS |
| Collapse / expand a column (`collapsible`) | The disclosure toggle is a `button` with `aria-expanded` + `aria-controls`; `Enter`/`Space` folds the column to its title + count. A collapsed column is not a drop target. | GDS |
| Column footer (`renderColumnFooter`) | Renders below the card list, outside the drag context, and stays keyboard-reachable (e.g. a "Load more" button). | GDS |
| Column count / title | `totalCount` badge and a `ReactNode` `title` (set `ariaLabel` when the title is not plain text so move-menu targets keep a meaningful accessible name). | GDS + consumer (`ariaLabel` value) |

### GdsSchemaForm (`@sovereignsquad/gds-core`)

| Interaction | Keys / behavior | Provided by |
|---|---|---|
| Field navigation & submit | Fields follow DOM order under `Tab`; submit is explicit (no on-input context change). Field labels, descriptions, and required markers are associated to controls. | GDS + consumer (label/description copy) |
| `checkbox-group` (grouped multi-select) | Rendered as a `fieldset` with a visually-hidden `legend`; each option is a themed Mantine `Checkbox` (with `aria-label`) toggled by `Space`. Inherits GDS theme + forced-colors treatment. | GDS |
| `repeatable` (add-another-row) | Governed **Add**/**Remove** buttons (`Enter`/`Space`), `minRows`/`maxRows` bounds, focus management on add/remove, and an `aria-live="polite"` row-count announcement ("Row added/removed, N rows.") — localized across 12 locales and test-asserted. | GDS |
| Validation errors | Surfaced in text via `ValidatedFieldMessage`, associated to the field (`aria-describedby`), localized and specific (required, min/max rows, selection-required). | GDS |

### Overlays — modal / drawer / sheet / command (`@sovereignsquad/gds-core`)

| Interaction | Keys / behavior | Provided by |
|---|---|---|
| Open / close | `Escape` closes when dismissal is allowed; close returns focus to the trigger. | GDS |
| Focus containment | Focus is intentionally bounded inside the open surface (not trapped — it is escapable). Verify in your CI with `expectGdsFocusTrap`. | GDS + consumer (CI assertion) |
| Reading order | Modal state changes preserve a predictable reading order; non-modal feedback does not steal focus. | GDS |

## Adopting the accessibility CI helpers (consumer tooling)

`@sovereignsquad/gds-a11y` turns GDS's internal a11y gates into tooling you run on **your** assembled routes (see [`A11Y_CI_PACKAGE.md`](../A11Y_CI_PACKAGE.md)):

- `createGdsA11yTest(page, config)` — one route → axe scan + optional keyboard-order assertions + contrast gate → one deterministic report.
- `expectGdsTabOrder(page, selectors, config)` — assert expected keyboard stops are focusable in order.
- `expectGdsFocusTrap(page, containerSelector, config)` — assert overlay/modal focus stays bounded.
- `runGdsContrastGate(page, config)` — check visible governed controls for transparent/missing foreground-background pairs.

Suppressions require explicit metadata (`reason`, `owner`, `expiresAt`, `replacementPath`); expired suppressions return as active findings, and a suppression may never hide a missing GDS primitive, an unlabeled control, a broken keyboard path, an invisible focus trap, or an avoidable contrast failure.

## Known limitations

Carried from the accessibility-evidence registry (limitations stay visible with an owner and recovery path):

- **Third-party embed surfaces** (e.g. `MapPanel`): the GDS containment shell is governed, but iframe/vendor internals may not expose the same semantics. Recovery: prefer package-owned fallback states/text summaries; track any suppression with an expiry.
- **Searchable selection (recipe lane):** keyboard and naming are governed, but the interaction still depends on a documented Mantine recipe path rather than a promoted dedicated GDS export. Recovery: promote the package-native contract before broadening adoption.

## Template — documenting a new component's accessibility

When a component graduates to a stable pattern, add its accessibility record to `accessibility-evidence-registry.ts` (which the release gate enforces) and, if it introduces component-specific interactions beyond its family row, add a callout here using this shape:

```md
### ComponentName (`@sovereignsquad/gds-<package>`)

| Interaction | Keys / behavior | Provided by |
|---|---|---|
| <interaction> | <keys + expected behavior + any aria-* state> | GDS / consumer |

Screen reader: <roles, names, live-region announcements>
Known limitations: <title, impact, owner, recovery path> (or "none")
```

Keep every row grounded in shipped behavior — an interaction listed here must be operable exactly as written, or the component's evidence record (and this table) is wrong and must be fixed, not the other way around.
