# ClassScout — Design Token Refinement (2026-08-08)

Status: **v1.1 addendum — refines specific rows of the locked v1.0 token doc**
Layered on top of `ClassScout-Design-Tokens-and-Components.md` (v1.0,
2026-06-20), which stays in place as the historical record of what was
originally reconciled from the brand PDFs. This addendum does **not**
reopen or re-litigate v1.0 — it records a later, additional source (a
Figma prototype) and exactly which v1.0 rows it changes.

## Source

Two Figma links to the same file (`DHb3LghHT02dtcKlTsL3cX`) were provided:
a prototype-view deep link into the "home" screen, and a design-view link
to the file's single page. The file contains one page with five top-level
screens (Home, Search, Bookings, Saved, Profile) — a ClassScout-style
mobile app walkthrough. The file defines no Figma variables; all values
below were read from raw fills/text colors via the Figma MCP
(`get_design_context` on 5 representative component subtrees, plus a
screenshot of all 5 screens), not guessed or inferred.

## What changed vs. v1.0, and what didn't

| Token | v1.0 (locked) | Measured in prototype | Decision |
|---|---|---|---|
| `color.navy` | `#0b223e` | `#0d2340` | **Unchanged** — sub-1% delta, within rendering/color-profile noise (14.75:1 vs. 14.96:1 contrast on ivory). |
| `color.terracotta` | `#ca8570` | `#ff6b35` | **Refined** — every CTA, badge, notification dot, FAB, and avatar in the prototype uses this vivid coral, not the muted v1.0 terracotta. |
| `color.slate` | `#434c59` | `#6b7897` (body text), `#9aa3b8` (inactive nav) | **Refined, capped by AA** — see below. |
| `color.sage` | `#90a287` | not observed | **Unchanged** — no sage instance appeared in any of the 5 sampled screens (no neighborhood-chip/"Recommended" selection state was present to sample). |
| `color.ivory` (cream) | `#faf7f1` | not directly re-sampled | **Unchanged** — visually consistent with v1.0 in both screenshots; no isolated page-background pixel sample taken. |
| — | — | `#1d6fa5` ("Verified" badge) | **New role added**: `state.info` (previously just reused navy). |

### The accessibility constraint that shaped this refinement

`createBrandTheme('class-usa')` throws (`GdsBrandThemeError`) if its own
semantic tokens fail 4.5:1 WCAG AA — the same bar v1.0 itself sets in its
"Accessibility & performance" section. Two of the prototype's literal
pixel values fail that bar on their own:

- White text on the raw coral (`#ff6b35`) is only 2.84:1.
- The prototype's slate body-text color (`#6b7897`) is only 4.13:1 on the
  ivory canvas.

So this refinement keeps each color's **hue and intent** from the
prototype, but lands the **lightness** wherever it's the closest AA-safe
match, rather than copying pixel values verbatim:

- Coral ramp: anchor `#ff6b35` (exact match, used for non-gated roles —
  badges, price, star, focus ring), with a separate, darker interactive
  step `#d63900` (4.72:1 with white text) for `--gds-brand-accent-action` —
  the same two-step pattern v1.0's shipped ramp already used (`#ca8570`
  anchor vs. `#a85a44` action step).
- Slate: `#5e6a86` (5.06:1 on ivory / 5.41:1 on white) — same hue/
  saturation family as the prototype's `#6b7897`, lightened only as far as
  it still clears AA.
- `state.info`: `#1d6fa5` / `#51a8e1` (dark mode) — both clear AA outright,
  no adjustment needed.

## Explicitly out of scope (flagged, not actioned)

- **Typography.** The prototype uses Plus Jakarta Sans (UI) and DM Serif
  Display (the hero quote), not Bogart/Garet. v1.0 §2 is explicit that
  fonts are locked ("Fonts are settled — Bogart/Garet (this doc is the
  authority)"). Silently swapping fonts because a prototype used different
  ones would contradict a decision v1.0 already made deliberately; it needs
  an explicit brand call, not a code-side inference from one prototype.
- **Category-icon pastel tint system.** The prototype pairs each Quick
  Category icon (and several Profile menu rows) with one of ~7 new pale
  hue washes (coral/peach, lavender, mint, sky-blue, amber, pink, green)
  behind the icon. This is a new token-role surface — it would need new
  `BrandSemanticRole` entries, not a value change to an existing one — so
  it belongs in its own gap request, not folded into a color refinement.
- **Elevation/shadows.** The prototype uses pronounced navy-tinted shadows
  throughout (hero card, badges, bottom nav). The shipped Class USA theme
  defaults to `flatSurfaces: true`. Flipping that default is a system-wide
  visual change, not a token-value refinement.
- **`badge.urgencyBg` / `brand-accent-tint`** (`#f5ddd5`). No screen in the
  5 sampled surfaced this role (no "Few Spots Left"-style urgency badge was
  visible), so it was left as-is rather than guessed at.

## Where this landed in code

`packages/gds-theme/src/brand-tokens.ts` (the public `createBrandTheme
('class-usa')` ramps + derivation) and `packages/gds-theme/src/
vibe-themes.ts` (the hand-authored `class-usa` vibe entry +
`classUsaSemanticCssVariables`, which mirror `brand-tokens.ts` by existing
test contract) — see issue #521 and the `4.1.7` `CHANGELOG.md` entry for
the full before/after values.
