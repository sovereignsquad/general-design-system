# Responsive & Platform Guidance — Size Classes, Multi-Screen, PWA

Status: Active SSOT
Version: 4.1.6
Last updated: 2026-07-26

This is GDS's answer to three questions the audit surfaced (issue #455): *what does GDS guarantee across screen sizes and device types, does it support multi-screen / PWA, and what are the per-screen best practices?* It also records the **explicit scope decisions** — build vs. documented non-goal — for the areas that need one, so consumers can plan around a stated position rather than an implicit gap.

Companion docs: [`docs/LAYOUT_PRIMITIVES.md`](LAYOUT_PRIMITIVES.md) (the responsive layout APIs), [`docs/PWA_VIEWPORT_POLICY.md`](PWA_VIEWPORT_POLICY.md) (viewport/zoom + manifest relationship), and [`docs/SAFE_STYLING.md`](SAFE_STYLING.md) (token-backed responsive style contracts).

## Named size classes

GDS adopts a small, named **size-class vocabulary** so guidance and code talk about the same buckets instead of ad-hoc pixel widths. These map onto Mantine's breakpoint aliases (the values GDS primitives already use via `useMediaQuery`):

| Size class | Mantine alias | Nominal min width | Typical device |
|---|---|---|---|
| `compact` | `< sm` | 0 | phones (portrait), small windows |
| `medium` | `sm` | 48em (~768px) | phones (landscape), small tablets |
| `expanded` | `md` | 62em (~992px) | tablets, split-screen desktop |
| `large` | `lg` | 75em (~1200px) | laptops, desktops |
| `xlarge` | `xl` | 88em (~1408px) | large desktops, TV/kiosk |

**Rule:** reach for a size class, not a raw media query. GDS primitives resolve these internally (e.g. `useGdsKanbanOrientation` stacks columns at `compact` portrait and goes multi-column otherwise; `DiscoveryShell` collapses its rail at a chosen breakpoint). Consumers should compose GDS responsive primitives and the layout components in [`LAYOUT_PRIMITIVES.md`](LAYOUT_PRIMITIVES.md) rather than hand-rolling breakpoints.

> **Single source of truth:** the alias→width map above is exported as **`gdsBreakpointByAlias`** from `@sovereignsquad/gds-core` (the one map `KanbanBoard`/`useGdsKanbanOrientation` and `DiscoveryShell` resolve against). Consumers building custom responsive chrome should import it rather than hard-coding pixel breakpoints.

## Per-screen-size best practices

### `compact` (phones, portrait / small windows)
- One primary column; stack, don't shrink. Use `GdsStack`/`GdsGrid` reflow, never horizontal scrolling of primary content (WCAG 1.4.10 Reflow).
- Primary destinations stay reachable without a hidden-drawer-only pattern (see the mobile-navigation contract in `COMPONENTS_AND_PATTERNS.md`).
- Keep focused text inputs ≥ 16px so mobile browsers don't force-zoom (guarded by default — see `PWA_VIEWPORT_POLICY.md` and `verify:input-zoom-guard-runtime`).
- Prefer bottom-anchored primary actions and sticky action bars; keep tap targets comfortably large.

### `medium` (phones landscape, small tablets)
- Introduce a second column only where it earns its place (list + peek, filters + results). Otherwise stay single-column.
- Multi-column surfaces (Kanban, data views) switch on here via the governed orientation hooks — horizontal scrolling is acceptable for *secondary* rails (a Kanban board), never for primary reading content.

### `expanded` (tablets, split-screen desktop)
- The **list-detail** and **supporting-pane** templates become primary (see [Canonical layout templates](#canonical-layout-templates)).
- Persistent navigation rail rather than a drawer; keep the rail collapsible.

### `large` / `xlarge` (laptops, desktops, TV/kiosk)
- Cap content measure (line length) even as the viewport grows — use `GdsContainer` max-widths; don't stretch body text to full width.
- Use the extra space for supporting panes, not larger fonts. On TV/kiosk, increase hit-target and focus-ring sizes and assume a 10-foot / touch context; keep keyboard/remote focus order deterministic.
- Avoid hover-only affordances (kiosk/touch and TV remotes have no hover).

## Canonical layout templates

Compose these from shipped primitives instead of bespoke page scaffolds:

- **List-detail** — a `GdsSplit` (or `GdsSidebar`) with a scrollable list pane and a detail pane; collapses to a single stacked column at `compact`/`medium` (list → drill into detail as a route or full-screen surface). Use `DetailProfileShell` for the detail side.
- **Supporting pane** — a primary content column plus a secondary pane (filters, metadata, activity) via `GdsSidebar`/`SectionPanel`; the supporting pane moves below primary content at `compact`.
- **Operational shell** — `AppShell` (from `@sovereignsquad/gds-admin`) provides the header/nav/main structure with a collapsible rail across size classes.

## Scope decisions

These are engineering **recommendations** (the roadmap owner may override); each is stated explicitly so there is no implicit gap.

### PWA — *partial build (delivered)*
GDS ships the thin, standards-based PWA pieces and no app framework: the viewport/zoom policy + helper (`getGdsPwaViewportMetaContent`, the `app-shell-fixed` exception lane), plus the #458 thin build below.
- **Delivered (#458):** a web-app-manifest generator (`getGdsWebAppManifest`), `display-mode: standalone` detection (`useGdsStandaloneDisplayMode`), and `env(safe-area-inset-*)` safe-area tokens (`gdsSafeAreaInset` + the `--gds-safe-area-inset-*` custom properties). See [`PWA_VIEWPORT_POLICY.md`](PWA_VIEWPORT_POLICY.md#pwa-thin-build-helpers-458).
- **Documented non-goal:** service-worker/offline caching strategy and an install-prompt UX framework — these are application-architecture concerns that belong to the consuming app, not a component library. GDS documents the integration point rather than owning the runtime.

### Multi-screen — *documented non-goal (recommended), with one exception*
GDS is single-viewport-responsive. **Recommendation:**
- **Non-goal:** multi-monitor / multi-window orchestration and the Window Management API — these are application/OS concerns with no component-library surface; GDS will not add them.
- **Decided — do not build yet (#459):** foldable / dual-screen support via CSS `viewport-segments` + a size-class extension is **deferred**. A single-window fold reads as a normal responsive size-class boundary today, and committing a token/size-class surface now would gate GDS on an unstable, narrowly-supported spec. **Re-evaluation trigger:** revisit when `viewport-segments` (or `env(viewport-segment-*)`) reaches baseline support across the browsers in `compatibility.matrix.json`, then file a fresh issue for an additive `folded`/`spanned` size class. Full rationale in [`CASE_STUDIES_BY_SCREEN.md`](CASE_STUDIES_BY_SCREEN.md#foldable--dual-screen--recorded-decision-do-not-build-yet).

### Per-screen case studies — *delivered (#459)*
Current migration/adoption case studies are joined by **screen-organized** ones — a list-detail admin, a public discovery surface, and a kiosk/large-screen lane, each composed from the canonical layout templates and walked across the named size classes — in [`CASE_STUDIES_BY_SCREEN.md`](CASE_STUDIES_BY_SCREEN.md).

### Guidance & community — *incremental build*
Do/don't visual pairs, a recipes/templates gallery, wider prose-doc localization, and a public support channel are worthwhile but each is its own effort. The `request-feature` route already exists as the intake seed. These remain tracked under the parent epic (#440) and are decomposed as picked up.

## Child issues filed

Per the epic's "split into child issues as each is picked up" guidance, the concrete **build** decisions above are filed as their own tracked issues:

- **#457** — consolidate the duplicated `breakpointByAlias` into one shared size-class token. ✅ **Delivered** as the exported `gdsBreakpointByAlias` (see [Single source of truth](#named-size-classes) above).
- **#458** — PWA thin build: web-app-manifest helper, `display-mode: standalone` detection, and `env(safe-area-inset-*)` safe-area tokens (with service-worker/offline and install-prompt UX kept as explicit non-goals). ✅ **Delivered** as `getGdsWebAppManifest`, `useGdsStandaloneDisplayMode`, and `gdsSafeAreaInset` (see [`PWA_VIEWPORT_POLICY.md`](PWA_VIEWPORT_POLICY.md#pwa-thin-build-helpers-458)).
- **#459** — screen-organized case studies + a foldable/dual-screen (`viewport-segments`) exploration. ✅ **Delivered** in [`CASE_STUDIES_BY_SCREEN.md`](CASE_STUDIES_BY_SCREEN.md); foldable decision recorded: **defer**, re-evaluate when `viewport-segments` reaches baseline browser support.

This document is the standing decision record those issues resolve against; update it when a decision changes.
