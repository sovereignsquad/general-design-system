# GDS Theme-Creation Prompt (copy-paste into a new Claude session)

Status: Active
Last updated: 2026-08-09

Reusable, self-contained brief for handing to a fresh Claude session (any
surface — Claude Code, Claude for Design/Figma-integrated, or plain
claude.ai) whose job is to prepare a new environment and create a new GDS
theme lane. Copy everything in the fenced block below and paste it as the
first message. It does not assume the receiving session has any prior
context loaded.

---

```
You are setting up to create a new theme lane for the General Design System
(GDS) — a governed, cross-project Mantine-based component library owned by
sovereignsquad. Read this whole brief before touching anything.

## 1. What you're building

A GDS "theme" is not just a color swap. It's a full VibeTheme contract: a
named preset with light AND dark values for canvas/shell/surface/border/
text/muted-text, a primary and accent color, a decorative glow/gradient/hero
treatment (or an explicit opt-out if the brand is flat/undecorated), and —
if it's a real branded product theme rather than a generic color lane — a
full semantic-role token set (body text, card border, badges, states,
prices, etc.) with light AND dark values for every one of them. Half of
this system existed as a real bug until today: a theme that only defines
light-mode values, or that reuses a single non-adapting color for both
schemes, WILL render illegible in dark mode. This has already happened
twice in production on this exact system (issues #533/#534) — do not repeat it.
Every token you add needs a real, considered dark-mode value, not a copy of
the light one.

## 2. If you're starting from a source design (Figma, screenshot, AI tool output)

Skip this section if you're designing a lane from scratch with no external
reference. If you were handed a source — a Figma file, a screenshot, an
export from an AI design tool (including Claude Design), or a brand
guideline PDF — that source is allowed to shape this theme. It is not
allowed to become this theme by direct copy. Read `CONTRIBUTING.md`'s
"Importing an externally-designed theme" section and `THEME_GOVERNANCE.md`'s
"Importing an externally-produced design" section in full before going
further. Summary of what they require:

- **Extract intent, not values.** Note the palette relationship (which color
  reads as primary vs. accent vs. purely decorative), the type feel
  (serif/sans, weight, formality), and the overall mood. Do not lift a hex
  value straight out of a Figma inspector panel, a screenshot color-picker,
  or an AI tool's generated CSS/JSON and paste it into a token file
  unverified. Every value that ships is one you chose and verified against
  WCAG AA in this repo — not one copied unmodified from somewhere else.
- **The source almost never specifies a real dark mode.** Most brand decks,
  marketing screenshots, and single-shot AI-generated mockups are light-only.
  You are responsible for designing a genuine dark-mode counterpart for
  every token — not deriving one mechanically (inverting lightness, running
  it through a color-conversion function) without checking real contrast
  afterward. This exact shortcut caused two production incidents in this
  system (issues #533/#534): a semantic token frozen at its light-mode value
  bled straight into dark mode, and a badge color-mix formula wasn't
  scheme-aware. Treat every dark-mode value as its own design decision, not
  a derivation.
- **Accessibility wins over source fidelity.** If the source conflicts with
  WCAG AA — its brand accent on its brand background fails 4.5:1 for body
  text, say — adjust the value and note the deviation in your report-back
  (Section 7). Never ship a pairing that fails contrast because "that's the
  brand color in the source file."
- **Record provenance.** Note the source's origin (a link, a filename, "PDF
  attached to issue N") in the GitHub issue you file, so the lane's origin
  is traceable later, not just its final token values.

Everything below still applies in full — a source design informs what you
report back in Section 7, it does not skip any step in Sections 3-6.

## 3. Where to look first (public, live reference — no auth needed)

- Live Theme Lab (every shipped lane, switchable light/dark, right now):
  https://sovereignsquad.github.io/general-design-system/themes
- Pattern Catalog (what every lane needs to render correctly across):
  https://sovereignsquad.github.io/general-design-system/patterns
- Operations pattern family (buttons, forms, Kanban — the densest surface
  for checking button/badge/input contrast in a candidate theme):
  https://sovereignsquad.github.io/general-design-system/patterns/operations
- Foundations pattern family (shells, cards, baseline controls):
  https://sovereignsquad.github.io/general-design-system/patterns/foundations
- Data pattern family (tables, badges, filters):
  https://sovereignsquad.github.io/general-design-system/patterns/data
- Live component demos (interactive, not just static docs):
  https://sovereignsquad.github.io/general-design-system/live-proofs
- Full API reference:
  https://sovereignsquad.github.io/general-design-system/api

Open the Theme Lab first. Switch through the existing shipped lanes (the
generic "vibe" lanes — sunset, oceanic, forest, ruby, amber, neon-night,
skyline, aurora, coral, mint, orchid, royal, cosmic — and the real branded
lanes — class-usa, gold-athlete, athlete-gold) in BOTH light and dark before
designing anything new. Your new theme needs to sit comfortably alongside
these, not clash with or duplicate one.

## 4. Repository and environment setup

- Repo: `sovereignsquad/general-design-system` (GitHub)
- Clone/read access to that repo, on a branch — do not work directly on
  `main`. If you don't have repo access yet, say so and stop; don't guess
  at file contents from this prompt alone.
- Read `CLAUDE.md` at the repo root in full before making any change — it
  is the binding operating contract (zero-tolerance quality gate, no AI
  attribution anywhere, issue-driven work, no hallucinated verification
  claims — Rule 12 specifically requires you to state exactly what you
  tested and where, local build vs. actually deployed, before calling
  anything "done").
- Read `HANDOVER.md` at the repo root for current project state and a full
  environment-bootstrap brief (Node/npm versions, headless-Chrome/CDP setup
  for live verification, the local static-serve pattern that exactly
  mirrors the deployed site, GitHub access requirements).
- Read `THEME_GOVERNANCE.md` in full — it is the authoritative rulebook for
  what you're about to do. Sections that matter most for this task:
  "CSS VibeThemes", "Dark-mode rule", "Theme trust hardening", "Approved
  preset modes", "Runtime persistence contract".
- Read `FOUNDATION.md` for the base accessibility/token rules that apply to
  every surface regardless of theme.

## 5. The exact files a new theme touches

- `packages/gds-theme/src/vibe-themes.ts` — add a new entry to the vibe
  registry. Every field on the `GdsVibeTheme` interface is required unless
  explicitly marked optional:
  `id`, `label`, `primary`, `accent`, `glow`, `canvasLight`, `canvasDark`,
  `shellLight`, `shellDark`, `surfaceLight`, `surfaceDark`, `borderLight`,
  `borderDark`, `textLight`, `textDark`, `mutedLight`, `mutedDark`,
  `gradient`, `hero`, and optionally `flatSurfaces: true` if this is a real
  branded product theme with no decorative gradient/glow/shadow anywhere in
  its own identity (set this for a serious brand lane; leave it unset for
  an expressive generic color lane where the gradient/glow IS the point).
- `packages/gds-theme/src/theme-presets.ts` — add the new preset id to the
  `GdsThemePresetId` union type, add a `themePresetCatalog` entry (id,
  label, description, `runtimeLane: 'resolveGdsThemePreset(<id>)'`), and
  wire `resolveGdsThemePreset` to resolve it.
- If this is a real branded theme (not just a generic vibe color lane), it
  also needs a `createBrandTheme('<id>', ...)` definition in
  `packages/gds-theme/src/brand-tokens.ts`, including its own semantic-role
  token table with EVERY token's light value AND its `-dark` sibling (see
  `brandSemanticCssVariablesByPreset` in `vibe-themes.ts` for the exact key
  list an existing branded lane like `class-usa`/`gold-athlete` defines —
  copy that key list exactly, don't improvise a subset).
- Every new hex/rgb color value must live in these token files — never
  inline in a component or a route. `gds-compliance`'s own scanner will
  flag a raw color literal anywhere in `apps/playground/src` outside a
  theme/token file, and it also flags `#` followed by 3-8 hex-looking
  characters even in a code COMMENT (e.g. writing "issue #532" trips it,
  since "532" is valid hex) — write issue references as "issue 532", no
  hash, anywhere in a scanned file.

## 6. Non-negotiable rules for the new theme

- Every light-mode token needs a real, separately-considered dark-mode
  value — never assume one can be derived by just flipping brightness
  without checking actual contrast.
- Verify EVERY text/background pairing your new theme produces meets WCAG
  AA (4.5:1 for normal text, 3:1 for large text / UI components) in BOTH
  light and dark, computed from real rendered `getComputedStyle()` values
  — not visual impression, not assumption. `HANDOVER.md` §6 has the exact
  local-build + headless-Chrome verification pattern this repo uses.
- No decorative gradient/glow/colored-shadow if `flatSurfaces: true` — the
  shared CSS rules will neutralize it, but don't design against something
  that will be removed.
- No hardcoded values anywhere outside the token files (§5).
- Test against the full pattern surface (§3's routes), not just the Theme
  Lab card — a color that looks fine on one card can fail badly on a real
  button, badge, or form control elsewhere. `verify:forced-colors-runtime`
  and `verify:theme-trust-runtime` in `npm run verify:release` are the
  automated backstops for this, but they don't replace looking at real
  rendered routes yourself first.
- Add live Theme Lab coverage and package tests for the new lane — a color
  lane isn't done until it's selectable and verified in the same places
  every other shipped lane is.
- Traceable to a GitHub issue, per `CLAUDE.md` Rule 2 — file one (or ask
  for the issue number) before or alongside implementation.
- No AI/model/session attribution anywhere in the commit, PR, code, or docs
  (`CLAUDE.md` Rule 9).
- State exactly what you verified, where, before calling anything done —
  local build vs. actually deployed, which routes, which schemes
  (`CLAUDE.md` Rule 12). Do not claim the live site reflects your change
  until you've confirmed it's actually been pushed and deployed.

## 7. What to report back before implementing anything

Before writing any code, report the full structured brief (issue 540 — this
is the operational half of `TEMPLATES/DESIGN_HANDOFF_TEMPLATE.md`: putting
the questions here is what makes them actually get asked):

1. **Identity**: the brand/product this theme is for; its primary and accent
   color intent (real hex values if known, or the desired feel if not);
   whether it's a flat/undecorated brand theme or an expressive vibe lane;
   and which existing shipped lane (if any) it's closest to.
2. **Fidelity and scope, one line**: what in the source material is binding
   and what is indicative (e.g. "colours and states exact; layout
   proportions indicative — recompose on GDS's own grid").
3. **States contract**: whether any surface in this lane needs
   loading/empty/error/unavailable/success treatments beyond GDS's own
   component defaults — and for each, the content direction, not just the
   look.
4. **Content rules**: brand-specific vocabulary constraints (forbidden
   words, tone) not already covered by GDS's i18n/copy governance.
5. **Count-driven compositions**: whether anything in this lane looks like a
   fixed grid/rail/list — and if so, confirmation it has been designed to
   hold at full, half, one, and zero, not just the common case (the
   standing rule from issue 541).
6. **Provenance**: the source material's origin, tool, and licence — per
   Section 2 and `THEME_GOVERNANCE.md`'s importing section (stated there;
   cross-reference rather than restate) — plus any point where you deviated
   from the source for accessibility reasons.

Get that confirmed before touching `vibe-themes.ts` — guessing brand intent
from a vague brief is exactly the kind of assumption this project's rules
forbid, and items 2-5 are precisely the ones that get guessed when only
colours are asked for.
```

---

## Notes for whoever is pasting this

- The bracketed public URLs above are all live, unauthenticated, and
  confirmed working as of this writing — no login needed to view them.
- If there's a source design for the new brand — a Figma file, a screenshot,
  an AI design tool export, a brand PDF — tell the target session explicitly
  and point it at that source; Section 2 covers how it must handle that
  input (extract intent, never copy raw values, design dark mode as its own
  decision). This prompt doesn't assume any source exists, since one isn't
  always available.
- This file lives at `TEMPLATES/GDS_THEME_CREATION_PROMPT.md` so it can be
  copied again later without regenerating it from scratch — update it in
  place if the theme-creation process changes (new required token, a
  renamed file, a new governance rule) rather than letting it drift stale.
