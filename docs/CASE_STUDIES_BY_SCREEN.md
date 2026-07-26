# Case Studies by Screen — Building Real Screens from GDS Templates

Status: Active reference
Version: 3.14.6
Last updated: 2026-07-26

Most GDS case studies are **migration/adoption** stories (see
[`CASE_STUDY_CLASSSCOUT.md`](CASE_STUDY_CLASSSCOUT.md)). This one is
**screen-organized**: three end-to-end screen types, each composed only from the
canonical layout templates in
[`RESPONSIVE_AND_PLATFORM_GUIDANCE.md`](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#canonical-layout-templates),
walked across the named size classes (`compact` → `xlarge`). The point is to show
the *same* screen reflowing across devices without a bespoke per-breakpoint
rewrite — you compose GDS primitives and let their governed size-class rules do
the work.

Reach for a **size class**, never a raw media query: the alias→width map is
exported as `gdsBreakpointByAlias` from `@sovereignsquad/gds-core`, and GDS
primitives resolve it internally.

---

## 1. List-detail admin (operational)

**Screen type:** an internal tool — a records list plus a detail/edit pane
(users, orders, tickets). Primary size classes: `expanded`/`large`.

**Template:** [Operational shell](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#canonical-layout-templates)
(`AppShell` from `@sovereignsquad/gds-admin`) wrapping a
[List-detail](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#canonical-layout-templates)
(`GdsSplit` list pane + `DetailProfileShell` detail pane).

| Size class | Layout |
|---|---|
| `compact` (phone) | `AppShell` rail collapses to a burger; the `GdsSplit` stacks to a **single column** — the list is the screen, and selecting a row routes to a full-screen `DetailProfileShell`. Never a side-by-side split at this width. |
| `medium` | Still list-first; the detail opens as a full-screen surface or a drawer, not a squeezed second column. |
| `expanded` / `large` | The `GdsSplit` shows list + detail **side by side**; the `AppShell` rail is a persistent, collapsible nav. This is the tool's home width. |
| `xlarge` | Add a third **supporting pane** (`GdsSidebar`/`SectionPanel`: activity log, metadata) rather than stretching the detail pane; cap the detail measure with `GdsContainer`. |

**Per-screen decisions:** keep row actions reachable by keyboard at every width;
the move/detail affordance is a tap-to-open menu on touch, not a drag; the rail's
collapsed state persists (`DiscoveryShell`/`AppShell` sidebar storage).

---

## 2. Public discovery surface (compact-first)

**Screen type:** a public, unauthenticated browse/search experience (listings,
search, filters). Primary size class: `compact` — mobile is the default, not an
afterthought.

**Template:** `PublicShell` with `mobileNavigationMode="bottom-tab"`
(`BottomTabBar`) + a [Supporting pane](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#canonical-layout-templates)
(`GdsSidebar`/`SectionPanel`) for filters.

| Size class | Layout |
|---|---|
| `compact` | One column of `ListingCard`s; filters live behind a sheet/drawer, not an always-open rail; primary destinations sit in the `BottomTabBar` (safe-area aware via `--gds-safe-area-inset-bottom` / `gdsSafeAreaInset`). No horizontal scroll of primary content (WCAG 1.4.10 Reflow). |
| `medium` | Two-up card grid; filters may become an inline row; the bottom tab bar still owns primary nav. |
| `expanded` | Filters promote to a **persistent supporting pane** beside the results; the bottom tab bar gives way to the `PublicShell` header nav (`hiddenFrom="sm"` on the bar). |
| `large` / `xlarge` | Cap the results measure with `GdsContainer`; use the extra width for the supporting pane and richer cards, not larger body text. |

**Per-screen decisions:** the teaser/paywall boundary (if any) uses the governed
`GdsAccessGate`, never CSS hiding; installable as a PWA via
`getGdsWebAppManifest` + `useGdsStandaloneDisplayMode` to drop browser chrome
when standalone.

---

## 3. Kiosk / large-screen lane (`xlarge`, 10-foot / touch)

**Screen type:** a fixed large display — a lobby kiosk, a wall dashboard, a TV
surface. Primary size class: `xlarge`, but with a **10-foot / touch** interaction
model rather than pointer + hover.

**Template:** [Operational shell](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#canonical-layout-templates)
(`AppShell`) or a `GdsContainer`-capped dashboard grid, tuned for reach and focus.

| Concern | Decision |
|---|---|
| Hit targets & focus | Increase hit-target and focus-ring sizes; assume touch or remote, never hover — **avoid hover-only affordances** entirely. |
| Focus order | Keep keyboard/remote focus order deterministic and visible; every actionable element is reachable without a pointer. |
| Measure | Even at 4K, cap content measure with `GdsContainer`; use space for supporting panes and larger targets, not full-width body text or bigger fonts. |
| Motion | Respect `prefers-reduced-motion`; kiosk auto-advance must be pausable. |
| Theme | A high-visibility lane (e.g. a dark public preset) is fine, but it still passes the same contrast gates — no bespoke unlit palette. |

**Per-screen decisions:** kiosks are single-viewport; do **not** reach for
multi-window orchestration (a documented non-goal — see below).

---

## Foldable / dual-screen — recorded decision (do not build yet)

Issue #459 asked for an explicit **build-or-not** decision on foldable /
dual-screen support (CSS `viewport-segments` + a size-class extension).

**Decision: do not build now — defer, with a re-evaluation trigger.**

- **Why not now:** the `viewport-segments` CSS environment variables /
  `@media (spanning: …)` features are still limited to a narrow set of engines
  and devices, and the single-window foldable case is a *responsive-layout*
  concern the existing size classes already approximate (a fold reads as a
  `compact`/`medium` boundary). Committing a size-class extension and a token
  surface now would gate GDS on an unstable spec for a small device population.
- **What GDS does instead today:** treat a fold as a normal responsive boundary
  via the named size classes; the canonical templates above already reflow across
  it. Multi-window / Window Management API orchestration remains an **explicit,
  permanent non-goal** (application/OS concern).
- **Re-evaluation trigger:** revisit when `viewport-segments` (or the successor
  `env(viewport-segment-*)`) reaches baseline support across the browsers GDS
  targets in `compatibility.matrix.json`. At that point, file a fresh issue to
  add a `folded`/`spanned` size-class extension — additively, not as a rewrite.

This decision is recorded here and mirrored in
[`RESPONSIVE_AND_PLATFORM_GUIDANCE.md`](RESPONSIVE_AND_PLATFORM_GUIDANCE.md#scope-decisions).
