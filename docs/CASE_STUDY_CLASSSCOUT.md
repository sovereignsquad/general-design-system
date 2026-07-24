# Case Study: ClassScout — From 10 Blocking Gaps to 10 Governed GDS Primitives

Status: Active reference
Last updated: 2026-07-24

## The problem

In mid-2026, ClassScout — a real consumer product — set out to become a
pure-GDS UI platform: no shadcn/Radix primitives, no app-local Tailwind
token authority, no raw design values (see
`PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md` for the full migration plan). The
refactor uncovered something more valuable than a migration checklist: 10
concrete, specific gaps where ClassScout's actual product needs had no
first-class GDS equivalent, forcing a choice between shipping an app-local
one-off or asking GDS to close the gap properly.

This is the scenario every design system eventually faces: a real consumer
hits a wall GDS didn't anticipate. What ClassScout did next — and what GDS
did in response — is the pattern this case study documents.

## The gaps, concretely

Ten specific, named needs surfaced from ClassScout's real screens, not from
speculative roadmap planning:

1. A branded auth/product theme (`Class USA`) coexisting cleanly with
   Mantine's token authority.
2. Mobile bottom-tab navigation for the product shell.
3. A searchable single-select/combobox for filtering large lists.
4. A match-quality score chip, distinct in meaning from a generic status
   badge.
5. A multi-action footer contract for listing cards.
6. A conversation/chat surface for an assistant-style interaction.
7. A "brand meaning" badge, again distinct from `StatusBadge`.
8. A resilient media component with a branded fallback for broken images.
9. A bounded, accessible numeric quantity stepper.
10. A governed entry point for AI-assisted search.

## What GDS did — and didn't do

The tempting shortcut would have been to let ClassScout build all 10
locally and call the migration done once the shadcn/Radix layer was gone.
That would have satisfied the letter of "pure GDS" (no forbidden primitive
imports) while quietly reintroducing exactly the drift GDS exists to
prevent: ten one-off components with no shared contract, no accessibility
review, no reuse path for the next consumer with the same need.

Instead, each gap became a GDS issue and a first-class, governed component,
not an app-local escape hatch:

| Gap | GDS component | Issue |
|---|---|---|
| Branded theme | `createBrandTheme('class-usa')`, `deriveBrandSemanticTokens`, `brandContrastRatio`, `GdsBrandThemeError` | #316 |
| Bottom-tab navigation | `BottomTabBar`, `BOTTOM_TAB_MAX_ITEMS`, `BOTTOM_TAB_HEIGHT` | #317 |
| Searchable select | `SearchableSelect` | #318 |
| Match-quality chip | `FitScoreChip` | #319 |
| Multi-action card footer | `MAX_LISTING_CARD_ACTIONS` (on `ListingCard`) | #320 |
| Conversation surface | `ChatThread`, `ChatMessage`, `ChatInput`, `StreamingIndicator` | #321 |
| Brand-meaning badge | `MeaningBadge` | #322 |
| Resilient media | `MediaWithFallback` | #323 |
| Quantity stepper | `NumberStepper` | #324 |
| AI search entry | `AISearchCard` | #325 |

Every one of these shipped through GDS's normal release discipline — tested,
documented, added to the live pattern catalog (`apps/playground`), and
carrying the same accessibility/i18n obligations as every other GDS
component (see `docs/CLASSSCOUT_INTEGRATION.md` for the full install and
per-contract usage guide). None of them are ClassScout-specific despite
originating from ClassScout's screens: `FitScoreChip`, `MeaningBadge`,
`ChatThread`, and the rest are available, catalog-registered, reusable
primitives for any GDS consumer today.

## Outcome

- **For ClassScout**: the refactor completed with zero permanent app-local
  UI forks — every gap that would otherwise have forced a local one-off got
  a governed GDS answer instead.
- **For GDS**: the catalog grew by 10 real components plus a brand-theme
  mechanism (`createBrandTheme`), none of them hypothetical — each has a
  paying, real-world consumer already exercising it in production.
- **For future consumers**: anyone building a conversational assistant
  surface, a match-quality indicator, or a branded mobile shell inherits
  these components instead of rediscovering the same gaps ClassScout hit
  first.

## The reusable lesson

This is the same methodology this repository's `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md`
formalizes for benchmarking against external design systems: **a gap is
only real when it's grounded in verifiable evidence** — either a competitor
that already solves it, or, as here, a real consumer product that hit the
wall in production. ClassScout's refactor is the concrete example of the
second kind: real integration pressure, treated as a design-system input
rather than an app-local escape hatch, produced governed primitives that
outlived the project that motivated them.

If your product is migrating onto GDS and hits a gap this catalog doesn't
yet cover, that's the expected first step of the same pattern, not a reason
to fork locally — open an issue (see `CONTRIBUTING.md`'s "always work from
GitHub issues" rule) and follow the same path this case study documents.
