# Reference-Site Architecture

Status: Active SSOT (issue 626)
Last updated: 2026-08-15

The owner's directive, verbatim core: **rebuild the structure — what goes where, why, and
how; professional UX-first; a complete element list with all examples and use cases; nothing
the system can do may be hidden.** This document is where every placement decision lives with
its reason. A section whose content cannot say why it is there is misfiled by definition —
that is how the badge system ended up under "Messaging Primitives" and how a shipped motion
vocabulary appeared on no page at all.

## The rule for every placement

1. **A capability has exactly one canonical home.** Scattering one vocabulary across families
   (badges in three places) makes each fragment look like the whole.
2. **Section names mean what a reader expects.** "Feedback" holds feedback — alerts, loaders,
   notifications, overlays — never badges, never imagery.
3. **Nothing shipped is invisible.** Every public export appears on a discoverable page; the
   component census is the completeness oracle and a gate holds the claim
   (`verify:component-catalog-parity`; Phase 2 extends it to one-canonical-page-each).
4. **Structure is site data; capability is GDS** (Rule 16). Reorganising never forks a
   component — a page needing something new means the package grows first.

## Target shape (phased)

| Area | Holds | Why |
| --- | --- | --- |
| **Foundations** | Colour/theming, typography, density & spacing, shape & elevation, **motion & micro-interactions**, icons, accessibility | The axes readers must understand before any component makes sense |
| **Components** | The complete element list, grouped by function, each with one canonical page: what it is, when to use it, every variant/state, use cases | The owner's "complete element list with all examples and use cases", held by a gate |
| **Patterns** | Multi-component compositions: discovery/browse, forms & workflows, auth & access, dashboards & ops, editorial, conversation & AI, maps | Compositions answer "how do I build the page", components answer "what is this piece" |
| **Systems** | The doc-with-proof deep dives: badge system, generated imagery, map system, theming, i18n | GDS's differentiators deserve narrative homes, not just catalog rows |

## Phase 1 — delivered with this document

- **Badges & Indicators is one home** (family `foundations`): `badges`, `meaning-badge`,
  `fit-score-chip` — previously split across `feedback` and `public`.
- **Generated Imagery is its own section** under foundations — previously filed as
  "Editorial & Brand Storytelling", which described one use, not the system.
- **Map System is one section** (`gds-map`, `pin-system`, `map-panel`) — previously split
  between "Public Shells & Docs" and "Discovery & Listing".
- **Feedback means feedback again**: alerts, loaders, notifications, modals, drawers under
  "Overlays & Feedback".
- **Motion & Micro-interactions exists**: `GdsMotionSystemReference` (gds-core, Rule 16)
  surfaces all six durations, five easings, seven presets live on hover, and the reaction
  axis — every value read from the exports consumers import, reduced motion honoured by the
  tokens themselves. Before this entry, none of it appeared anywhere.

## Phase 2 — delivered

**`/components` is the complete element list**, in the primary navigation: all 297 public
components, derived from the same census the parity gate reads — 165 registered components
linking to their canonical catalog home, 132 reviewed helpers stating in full view why they
have no page of their own. Filterable by name, section, or reason. The claim is gate-held:
`verify:component-catalog-parity` now also fails on index drift, so the page structurally
cannot omit — a hand-maintained list hides its first omission; this one cannot. (Closing the
loop surfaced one stale record: `GdsSchemaForm` was simultaneously registered and exempted;
the dead exemption is removed.)

## Phase 3 — delivered

The primary navigation is the four content areas plus the core pages, in reading order:
**What Is GDS · Install · Foundations · Components · Patterns · Systems · API · Themes ·
Governance.** `/foundations` is a top-level area (its old catalog URL `/patterns/foundations`
redirects forever), and **`/systems`** is the umbrella for the deep dives — theming, badge
system, generated imagery, motion, map system, i18n — plus a Resources grid carrying every
page that left the primary navigation (Live Proofs, Coverage, Maturity, Use Cases, Request a
Feature, Use with AI). The regroup hides nothing: one canonical home, not fewer doors. Demoted
pages share the `resources` intent so no children sub-nav is polluted.

## Phase 4 — delivered at the structural level

Every registry entry is **deep-linkable** (`/patterns/<family>#entry-<id>`, and
`/foundations#entry-<id>` for the foundations area), and the `/components` index links each of
the 165 registered components straight to its exact home — not just its family page — through
the new governed `GdsInlineLink` (which exists because the GDS-only site literally had no
inline-anchor primitive; the missing capability was the finding, again). The canonical-page
template each entry already follows: title, summary as when-to-use, live demos as
variants/states, coverage text as evidence. Deepening individual entries' use-case prose is
continuous editorial work under the standing rules, not a phase with an end state — any entry
found wanting files as its own issue.

## Phase 5 — delivered (issue 631)

A reader could not find `semantic-actions` (`ActionBar`/`SemanticButton`'s click-feedback
micro-interaction) because it lives under a section literally called "Workflow Guidance," while
a section called "Motion & Micro-interactions" existed and held only `GdsMotionSystemReference`
— a token reference table (durations/easings/presets), zero buttons. A direct violation of this
document's own rule 2. Fixed at the data layer, not a page-local patch:

- `motion-system`'s section is renamed **Motion Tokens** (accurate to its content), with its
  summary now pointing to Semantic Actions for interactive feedback, and `semantic-actions`'s
  summary now states it carries the click micro-interaction — closing the loop both ways and
  making both entries reachable by the same search term.
- `PatternFamilyPage` (shared by all six family routes, 114 registry entries total: foundations
  30, public 35, operations 15, feedback 12, access 11, data 11) gained the filter-plus-browse
  pattern `/components` already proved in Phase 2: a live text filter over title/section/
  summary/sourceComponent, and a "Jump to section" anchor grid. `ReferenceSection` gained an
  optional `id` prop (forwarded to `SectionPanel`'s existing one) so section headings are
  anchor-targets, the same mechanism `PatternEntryCard` already used per-entry.

**Not resolved by this phase, tracked separately (issue 632):** `/foundations`'s actual 8
sections (Shell & Navigation Guidance, Controls & Inputs, Layout Contracts, Workflow Guidance,
Cards & Metrics, Generated Imagery, Motion Tokens, Badges & Indicators) do not match this
document's own "Target shape" table above, which defines Foundations as the color/typography/
spacing/shape/motion/icons/a11y axes — nor do they match the live page's own `familyMeta`
description ("Shells, controls, cards, and baseline workflow rules"). The Systems row above
separately claims "badge system, generated imagery" as `/systems` content, which would mean
Badges & Indicators and Generated Imagery are filed on the wrong page by this table's own
definition. That is a real re-categorization decision, not a findability fix, and stays open
until made deliberately.

## Phase 6 — Foundations rebuilt to the 7 axes; Components and Systems become real hosting pages (issue 632/633, in progress)

The re-categorization Phase 5 deliberately left open is now decided: **Foundations holds
strictly the 7 axes**, matching this document's own "Target shape" table for the first time
since it was written. `PatternFamily` gained two new members, `components` and `systems`, each
hosted at its existing top-level route (`/components`, `/patterns/components` redirects
forever, same mechanism as `/foundations`/`/patterns/foundations`; same for `/systems`).
`PatternFamilyPage`'s filter-plus-jump-to-section rendering (Phase 5) was factored into a
standalone `FamilyEntryBrowser`, so `ComponentsIndexPage` and `SystemsPage` compose it directly
alongside their own bespoke header content instead of needing a fake `familyMeta` entry.

25 entries moved, mechanically, entry by entry:
- **4 → `systems`** (badges, fit-score-chip, meaning-badge, generated-imagery) — matches this
  table's Systems row exactly.
- **19 → `components`**, two sections (Controls & Inputs: theme-toggle, form-field,
  game-board-tile, buttons, choice-chips, icon-buttons, inputs, selects-combobox,
  checkboxes-radios, semantic-actions, accent-panels; Shell & Navigation: stable-shell,
  primary-navigation, mobile-navigation, page-headers, shell-contracts, discovery-shell,
  sidebar-navigation, semantic-nav-link) — the "what is this piece" content this table's
  Components row calls for, previously homeless because no other family had a real Controls &
  Inputs or Shell & Navigation section.
- **5 → `operations`**, Workflow Guidance (forms, action-bar, pattern-service-reuse,
  maturity-capabilities, vocabulary-extension-lane) — an exact existing section-name match,
  no invented category.
- **1 → `public`**, Discovery & Listing (product-cards) — next to the existing
  `public-product-cards` entry.

`motion-system` (Motion Tokens) is the only entry that stayed. **Foundations will read sparse
until Phases 7-11 land** (five new axis reference pages — typography, density & spacing, shape
& elevation, icons, accessibility, plus a compact colour/theming entry linking out to the full
`/themes` Theme Lab) — five of the seven axes have zero existing live page today, only scattered
token infrastructure, so each is a from-scratch build following the `GdsMotionSystemReference`/
`GdsPinSystemReference` template: every value surfaced live from the real export a consumer
would import, never a hand-typed swatch. Tracked as issue 632's remaining sub-issues.
