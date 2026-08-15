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

## Phases 3–4 (tracked on issue 626)

3. Nav-level regrouping into the four areas, with legacy redirects for every moved URL — a
   rename is not shipped until the old name still works (the #606 lesson).
4. Per-component canonical pages to the full template: purpose, when-to-use, all variants and
   states, use cases.
