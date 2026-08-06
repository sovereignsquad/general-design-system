# Changelog

All notable policy changes to the General Design System are recorded here.

## 3.15.0 - 2026-08-06 — Unified, always-theme-aware badge system (epic #484)

Everything below ships together as the badge-system release: foundations (#485, #486), shape
vocabulary (#487), canonical badge icons (#494), the component layer (#488–#491), cleanup
(#493), docs (#492), and the guided-tour mobile fix (#495).

### Badge system components: GdsBadge, GdsCountBadge, GdsRemovableTag, GdsBadgeStack (#488–#491), cleanup (#493), and docs (#492)

Completes epic #484's component layer on the shipped foundations (#485–#487, #494). New
front-door doc: [`docs/BADGE_SYSTEM.md`](docs/BADGE_SYSTEM.md).

- **`GdsBadgeStack` + `GdsBadgeStackLayer`** (#488): Font Awesome-model layering box (square
  `1em`-default, centered/corner layers, corner scale via custom properties). Corner dots
  separate from the base mark with a CSS **mask cutout**, never a ring painted in the page
  background (which breaks over vibe-theme gradients); all layers are `currentColor` DOM/SVG,
  so forced-colors keeps them visible.
- **`GdsBadge`** (#489): static status/meaning label with the closed two-axis color union —
  semantic `tone` (`success|warning|danger|info|neutral` → `--gds-state-*` tokens) XOR curated
  `accent` (10 fixed values, each test-verified ≥ 4.5:1 against white via
  `pickGdsAutoForeground`); governed `icon` (GdsIcons) and `shape` (GdsBadgeShapes) props;
  `label` required — meaning never in color alone; never interactive.
- **`GdsCountBadge`** (#490): numeric/dot count, `value` XOR `dot` at the type level,
  corner-anchorable to any element via the stack. Its `role="status"` live region is
  **always mounted** (a region mounted later never announces its first appearance) and
  announces "{count} {label}" — "99+ notifications", never the reverse.
- **`GdsRemovableTag`** (#491): the removable filter token as one shared component — whole
  chip is a `<button>` with a required, consumer-localized `removeLabel` (no baked-in
  strings). Adopted by all four former inline copies: `ActiveFilterChips`
  (ListingPrimitives), `DataToolbar`, `BrowseSurface`, and gds-admin's `ResponsiveDataView`.
- **Cleanup (#493)**: `MeaningBadge` and `FitScoreChip` gained their missing live demos;
  both components' `{...props}`-after-`style` spread no longer lets a caller's `style` wipe
  token colors (merge order fixed, regression-tested); the `PillBar`/`SoftChipGroup`/
  `FilterChipGroup` radiogroups now implement the roving tabindex + arrow-key contract their
  ARIA roles promise (one tab stop per group; arrows/Home/End move selection and focus).
  The stale DTCG token count item was already fixed in #485's commit.
- All new components registered (registry + live demo + export coverage + catalog parity)
  and asserted mounted-and-painted under forced-colors on `/patterns/feedback`.

### Guided tour: step card no longer buried under the spotlighted target (#495)

On small viewports, a tall spotlighted section (e.g. the home page Theme Lab) overlapped the
bottom-anchored step card and painted **over** it — Skip/Next unreachable, page inert behind the
scrim: the tour was unusable on mobile. Root cause: the card rendered *inside*
`.gds-tour-spotlight`, whose own overlay-level stacking context capped the card below the
elevated `[data-gds-tour-active-target]` (overlay + 1).

- The card is now a portal **sibling** of the spotlight at `overlay + 2`, giving the intended
  order scrim < spotlighted target < step card; regression-tested structurally (dialog must not
  be a descendant of the spotlight) and re-verified on a 390×844 viewport with hit-testing.
- [`docs/GUIDED_TOUR.md`](docs/GUIDED_TOUR.md) now documents the layering guarantee.

### Badge shape vocabulary: six Tabler-geometry silhouettes (#487, part of epic #484)

Approved via the visual proposal review: six badge silhouettes, all authored from Tabler's own
`iconNode` path data through Tabler's public `createReactComponent` — imported geometry, never
hand-drawn, so the 24×24 space, corner language, and `currentColor` stroke behavior match the
`GdsIcons` registry by construction.

- **New `@sovereignsquad/gds-core` exports**: `GdsBadgeShapeCircle` (← `IconCircle`),
  `GdsBadgeShapeSquircle` (← `IconSquareRounded`), `GdsBadgeShapeHexagon` (← `IconHexagon`),
  `GdsBadgeShapeShield` (← `IconShield`), `GdsBadgeShapeRosette` (← `IconRosette`), and
  `GdsBadgeShapePin` (← `IconMapPin`'s balloon silhouette, decorative inner dot dropped so the
  head can host a composed icon — for badges placed on maps), plus the closed `GdsBadgeShapes`
  dictionary and `GdsBadgeShapeName` union that #489's `GdsBadge` will typecheck its `shape`
  prop against.
- Deliberately siblings of `<GdsIcon />`, not registry keys: they expose the full Tabler prop
  surface (`className`/`style`/`ref`/rest-spread) that badge composition (#488) needs and
  `<GdsIcon />` intentionally withholds.
- Suggested shape-to-meaning pairing (documented default, not enforced): circle=interest/count,
  squircle=persona, hexagon=activity, shield=verification, rosette=certification, pin=location.
- Demoed on the badges pattern; asserted mounted-and-painted under forced-colors on
  `/patterns/feedback`; documented in [`docs/ICON_REGISTRY.md`](docs/ICON_REGISTRY.md) and
  [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md).

### Badges render the canonical GdsIcons set (#494, part of epic #484)

The governed icon dictionary's `status` category maps one-to-one onto badge semantics, yet no
badge component used it — `StatusBadge` was text-only and `MeaningBadge`'s `icon` was an
ungoverned `ReactNode` pass-through.

- **`StatusBadge` gains opt-in `withIcon`**: renders the canonical status icon
  (`Success`/`Warning`/`Danger`/`Info`) through `GdsIcon` ahead of the label, decorative
  (`aria-hidden`) since the label carries the meaning; `neutral` has no canonical status icon and
  renders none.
- **`MeaningBadge`'s `icon` prop now routes canonical `GdsIcons` keys through `GdsIcon`**
  (e.g. `icon="Warning"`, `icon="Star"`); any other `ReactNode` renders exactly as before, so
  existing custom-markup callers are unaffected.
- Playground demos show both; [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md)'s badge
  rules now state that badge icons come from the governed dictionary, never ad hoc SVG.

### Badge-system foundation: auto-foreground contrast helper (#486, part of epic #484)

Badges render on 25 theme presets × custom brand colors; a static foreground color can't stay
readable across all of them. Adds the pick-a-safe-foreground primitive the upcoming `GdsBadge`
family needs, on top of the existing consumer contrast checker (#453).

- **New `pickGdsAutoForeground(background, options?)`** (`@sovereignsquad/gds-theme`): tries each
  of `options.candidates` (default `['#ffffff', '#000000']`) against `background` in order and
  returns the first that clears the requested WCAG threshold (`AA`/`AAA` × `normal`/`large`,
  same as `checkGdsContrast`); if none clear the bar, returns whichever scored highest so the
  result is always the best available choice. **Never throws** — an unparseable `background` or
  candidate falls back to the first candidate, since this is meant to be safe to call directly in
  a render path over a caller-supplied color GDS doesn't control.
- Exists because neither existing option works here: Mantine's `autoContrast` is a structural dead
  end for `var(--gds-*, fallback)` values, and `getGdsContrastRatio` correctly throws on
  unparseable input, which would crash a render.
- Docs: [`docs/CONTRAST_CHECKER.md`](docs/CONTRAST_CHECKER.md) gains a `pickGdsAutoForeground`
  section alongside `getGdsContrastRatio`/`checkGdsContrast`.

### Badge-system accessibility audit: 6 confirmed bug fixes (#478–#483)

Fixes found while researching the upcoming customizable badge system, landed ahead of that work per the agreed "fix bugs now, then badge system" sequencing. No public API removals; `brandContrastRatio` now throws on unparseable input instead of silently scoring it as black (see #483).

- **Removable filter chips are now keyboard-operable** (#478): `ActiveFilterChips`, `DataToolbar`, `BrowseSurface`, and `ResponsiveDataView` rendered their remove affordance as a `<div onClick>`, unreachable by keyboard. They now render via Mantine `Badge`'s polymorphic `component="button"` with a real `aria-label` and `type="button"`.
- **`StatusBadge`/`LabelTag` semantic color no longer gets overridden by theme presets** (#479): the preset decorative Badge tint (specificity `(0,2,1)`) beat Mantine's own color-prop-driven Badge styling (specificity `(0,1,0)`), silently repainting every semantic status badge to the same brand tint under any of the 25 presets. Both components now mark themselves `data-gds-badge-fixed-tone`, which the preset rule excludes.
- **`FitScoreChip` tooltip is now keyboard-reachable, and its "good"/"partial" bands can no longer render identically** (#480): the chip gained `tabIndex`/focus-triggered tooltip events, and the `partial` band now reads `--gds-brand-accent-action` instead of duplicating `--gds-brand-accent`.
- **`GdsIcon`/`resolveGdsIconKey` now resolves the lowercase form of every multi-word icon key** (#481): the previous single-character-capitalize fallback broke 14 keys (`TrendingUp`, `EyeOff`, `ChevronDown`, etc.), silently falling back to the generic `Help` icon. Replaced with a full case-insensitive lookup table.
- **`createBrandTheme()` now emits `--gds-text-on-inverse`** (#482), the fully-kebab-cased name every consumer and preset actually reads, alongside the previously-emitted (but unused) `--gds-text-onInverse`.
- **`brandContrastRatio()` now throws on unparseable hex input** (#483) instead of silently coercing it to black via `NaN`-bitwise-coercion, which previously produced a plausible-but-wrong contrast ratio for any caller passing e.g. a CSS variable reference.

### Badge-system foundation: semantic role tokens for all 25 presets (#485, part of epic #484)

Only `class-usa`/`gold-athlete` (2 of 25 presets) defined the `--gds-state-*`/`--gds-badge-*`/`--gds-brand-*`/etc. semantic role variables a theme-aware badge needs. Rather than give the new badge system a fallback-chain-only escape hatch, the gap is closed at the token layer: every preset now defines the full role set.

- **New `packages/gds-theme/src/color-math.ts`**: sRGB color parsing/mixing/contrast utilities, extracted from `accessibility-report.ts` (no behavior change there — same math, now shared) so they can back the new derivation below too.
- **New `deriveVibeSemanticCssVariables()`** (`vibe-themes.ts`): for the 23 presets without a hand-authored semantic set, mixes each role from that preset's own `GdsVibeTheme` palette in sRGB (matching the runtime `color-mix(in srgb, ...)`) and pushes it toward black/white until it clears WCAG AA (text) or non-text AA (3:1) against its background — verified for all 25 presets, both modes, in `vibe-themes.test.ts`. `state-danger`/`state-danger-dark`/`state-warning-dark` are fixed, non-preset-tinted anchors rather than derived, matching the values already shared identically between the two hand-authored presets. `class-usa`/`gold-athlete`'s existing values are untouched.
- Docs: [`docs/SEMANTIC_ROLE_TOKENS.md`](docs/SEMANTIC_ROLE_TOKENS.md) updated to reflect that all 25 presets — not just 2 — now define the full role set; [`docs/DESIGN_TOKENS_DTCG.md`](docs/DESIGN_TOKENS_DTCG.md)'s stale "391 tokens across 23 presets" corrected to the actual 425/25.

## 3.14.17 - 2026-08-02 — Guided tour: consistent rollout across every primary destination (#475)

Extends the onboarding tour from two surfaces to **every primary site destination** through one shared launcher, so the "Take the guided tour" experience is identical everywhere and the gate-safe auto-start rule lives in exactly one place.

- **New governed module export — `GdsTourButton` (`@sovereignsquad/gds-core`):** a themeable `.gds-tour-launch` launcher whose label reads the new localized `gds.tour.launch` key (added to all 12 locale packs) and starts a tour via `useGdsTour`. Customers get a drop-in launcher instead of hand-rolling a raw control.
- **New shared site control — [`SiteTourLauncher`](apps/playground/src/SiteTourLauncher.tsx):** composes `GdsTourButton` + a gate-safe first-run auto-start (bare URL + real browser). The consistent launcher appears on every page and the auto-start decision is centralized here instead of copy-pasted per page.
- **Auto-start pages:** Home, Use with AI, Pattern Catalog, Live Demos, API Reference, Coverage, Maturity, Use Cases, Governance, and Request a Feature each ship a page-specific spotlight tour that runs once for first-time visitors and replays on demand.
- **Manual-only on gate routes:** Install (`/install`) and Themes (`/themes`) expose the launcher button but **omit** auto-start, because the accessibility / theme-trust / forced-colors runtime gates visit those bare routes — an auto-opened overlay would surface mid-verification. This corrects the Install page, which briefly carried auto-start.
- **Gate safety, centralized:** auto-start fires only when `window.location.search === ''` (real visitors arrive on clean paths; gates visit `/?locale=xx` or deep sub-routes) **and** `Element.prototype.scrollIntoView` exists (`true` in Chrome, `false` under jsdom, so page unit tests never auto-fire). No automation sniffing.
- Docs ([`docs/GUIDED_TOUR.md`](docs/GUIDED_TOUR.md)) updated with the full destination list, the manual-only rule, and the new `GdsTourButton` surface; `verify:release` (including the accessibility, theme-trust, and forced-colors runtime gates) stays green.

## 3.14.16 - 2026-08-02 — Guided tour: first-run onboarding on the home page (#474)

Brings the auto-running onboarding tour to the home/overview page, where every visitor lands.

- The home page now auto-runs a short tour once for first-time visitors — spotlighting the live Theme Lab, the "what GDS gives you" band, and the get-started links — with a "Take the guided tour" launcher that replays it on demand.
- **Gate-safe by a no-query signal:** the home route *is* loaded by the `theme-trust` gate, but only ever as `/?locale=xx`, so auto-start is gated on `window.location.search === ''` — a real visitor on bare `/` sees it once; the gate's `/?locale=…` visits (query present) never trigger the overlay. Documented in [`docs/GUIDED_TOUR.md`](docs/GUIDED_TOUR.md). No module API change; `theme-trust` and the full `verify:release` stay green.

## 3.14.15 - 2026-08-02 — Guided tour: auto-run once for first-time visitors (#473)

Completes the onboarding half of the guided-tour module (#466): the GDS site now **auto-runs** the tour once for first-time visitors, not just on manual click.

- The [Use with AI](https://sovereignsquad.github.io/general-design-system/ai) page mounts `GdsGuidedTour` with `open persist="localStorage"`, so a fresh visitor sees the tour once and never again; the "Take the guided tour" launcher still replays it on demand.
- **Gate-safe by construction:** auto-start is scoped to the `/ai` route, which no headless runtime gate (`theme-trust`, `forced-colors`, `input-zoom`, `kanban-drag`) loads — so the overlay can never surface during a verification run. The rationale (and guidance for consumers doing their own auto-start) is documented in [`docs/GUIDED_TOUR.md`](docs/GUIDED_TOUR.md). No module API change.

## 3.14.14 - 2026-08-02 — Guided Onboarding Tour module (spotlight coach-marks) (#466)

Ships a first-class, reusable **guided onboarding tour** so every product on GDS gets one governed, accessible, i18n'd first-run flow with no app-level forks — and dogfoods it on the GDS site.

- **New module** (`@sovereignsquad/gds-core`): `GdsTourProvider`, `useGdsTour()`, the declarative `GdsGuidedTour`, the `GdsTourStep` type, and `useHasSeenTour()`. A tour dims the viewport, cuts a spotlight hole over the current target, and anchors a step card with Back / Next / Skip / Done and a "Step _n_ of _m_" indicator; advancing moves the spotlight and scrolls the next target into view. Targets are referenced by a stable `data-gds-tour-target` id or a React ref (#467–#470).
- **Governed scrim token** (`gds-theme`): `--gds-overlay-scrim` (light/dark; `transparent` under forced-colors) plus `--gds-tour-spotlight-radius`/`-padding`, so no raw `rgba()` dim lands in product code.
- **Accessibility**: focus-trapped `role="dialog"` step card with `aria-labelledby`/`describedby`, focus-return-to-invoker, `Esc`/arrows/`Enter`/`Tab` handling, a polite "Step _n_ of _m_" live region, forced-colors outline degrade, and `prefers-reduced-motion` support. Controls read new `gds.tour.*` keys shipped across all 12 locale packs.
- **Docs**: new [`docs/GUIDED_TOUR.md`](docs/GUIDED_TOUR.md) (contract + consumer drop-in), a Guided Onboarding Tour rules section in `COMPONENTS_AND_PATTERNS.md`, and `llms.txt` coverage.
- **Dogfood**: the [Use with AI](https://sovereignsquad.github.io/general-design-system/ai) page gains a "Take the guided tour" control that spotlights the llms.txt entry point, the install/bootstrap step, and the non-negotiable agent rules.
- Board taxonomy extended with an `area: onboarding` label.

## 3.14.13 - 2026-07-31 — Vendor-neutral AI-tool naming across docs, templates, and site copy (#465)

Removes tool-specific branding from the AI-integration surface so GDS reads as consumable by any LLM-powered coding tool rather than naming particular products. No runtime, token, or component-API change.

- **Removed the design-tool sync feature** (`.design-sync/` inputs, previews, and conventions, plus `docs/CLAUDE_DESIGN.md`): the sync path was documentation and committed preview inputs for a specific external design tool, not part of the shipped packages. The authoritative design-to-code path remains the DTCG token export (`tokens/gds.tokens.json`) and the handoff mapping documented in [`docs/FIGMA_UI_KIT.md`](docs/FIGMA_UI_KIT.md) and [`DESIGN_HANDOFF.md`](DESIGN_HANDOFF.md).
- **Removed `TEMPLATES/CLAUDE.md.template`**: the cross-tool `TEMPLATES/AGENTS.md.template` (the `AGENTS.md` standard read by any agentic coding tool) is the single drop-in repo-rules template going forward.
- **Neutralized AI-tool naming** in `README.md`, `llms.txt`, `docs/AI_AGENT_GUIDE.md`, `docs/CLASSSCOUT_INTEGRATION.md`, `TEMPLATES/AGENTS.md.template`, the `/ai` playground page, and all 8 non-English site-phrase packs — product names replaced with neutral descriptors ("AI coding agents", "any LLM-powered coding tool"). The `/ai` page drops the design-tool sync section and the tool-specific drop-in row; its link grid and repo-rules table are updated accordingly.

## 3.14.12 - 2026-07-27 — KanbanBoard zone-based wheel-scroll routing (#464)

Fixes a real desktop-trackpad complaint from a consumer (`salesleadgenerator`): in multi-column layout the columns live in a horizontal `ScrollArea`, and a two-finger "natural scroll" gesture over a card could be captured by that horizontal region instead of scrolling the page.

- **`data-gds-kanban-column-header="<columnId>"`** (always on, additive): each column header now exposes a stable hit-region attribute so consumers can target it — previously cards/columns/bodies/footers had `data-gds-kanban-*` but the header did not.
- **`columnPanZone?: 'header' | 'none'`** (default `'none'`, fully backward compatible): opts into Linear-style zone routing. With `'header'`, a wheel gesture over a column header pans the columns horizontally regardless of gesture shape (a single non-passive listener on the `ScrollArea` viewport, routing via `closest('[data-gds-kanban-column-header]')`), while a gesture over a card or empty space is never captured and scrolls the page normally. Fine-pointer (desktop) only, inert in stacked orientation, RTL-aware. Existing consumers who don't opt in see zero behavior change.
- Unit-tested for the routing decision (which zone captures the gesture, asserted via `preventDefault`); the physical trackpad scroll is a real-browser verification, since headless synthetic wheel events don't reproduce trackpad-driver behavior. Documented in `COMPONENTS_AND_PATTERNS.md`.

## 3.14.11 - 2026-07-26 — Complete JSDoc coverage on the public API + coverage gate

- **Full JSDoc backfill** (#414): every public export across the consumer-facing packages now carries a JSDoc block — **1,136/1,136 public exports documented (100%)**, up from ~6%: `gds-core` 914, `gds-admin` 85, `gds-theme` 137, `gds-a11y` already complete. Component functions get a summary of what they are and their governed behavior; props interfaces get an interface-level block plus **per-property docs on the fields consumers hover** (defaults, throw conditions, accessibility roles), all written from the actual implementation. Comment-only — no runtime or type changes beyond the emitted `.d.ts` now carrying the docs, so editors surface field-level hover documentation for the entire shipped API.
- **New coverage gate** (#414): `verify:api-jsdoc-coverage` (wired into `verify:references` / `verify:release`) asserts public exports stay documented at a ≥95% floor per package and overall, mechanically enforcing the ship-with-docs Definition of Done so the surface can't silently regress. Closes #414.

## 3.14.10 - 2026-07-26 — First-class accessibility theme presets: high-contrast + colorblind-safe

Delivers the theme-preset half of #453 — the two accessibility presets peers ship (Primer's high-contrast/colorblind lanes) that GDS lacked as *selectable presets* despite having forced-colors support and contrast CI.

- **`high-contrast` preset** (#453): a maximal-contrast, flat, undecorated accessibility lane. Pure black/white canvases and surfaces, black/white body text (21:1), near-pure dark-gray/light-gray meta text (AAA, ≥11:1 both schemes), solid black/white borders, near-black filled controls (`primaryColor: 'dark'` + `autoContrast`), no shadows, and no decorative gradients (a scoped `styles.css` rule flattens the body and suppresses the vibe overlay). Distinct from OS-driven `forced-colors` support (which GDS also honors) — this is a preset a product or user can choose deliberately.
- **`colorblind-safe` preset** (#453): a brand palette drawn from the **Okabe-Ito** colorblind-safe qualitative set (Okabe & Ito, 2008) — `primary` = blue `#0072b2`, `accent` = vermillion `#d55e00`, the classic pairing that stays distinguishable across deuteranopia/protanopia/tritanopia — with `autoContrast` filled controls and dark-on-light AA/AAA text. It targets the categorical/brand palette; GDS's standing "never signal state by hue alone" rule (semantic components carry a label + icon per WCAG 1.4.1) already keeps success/danger distinguishable under every preset.
- Both are first-class entries in `getGdsThemePresets()` (so they appear in the Theme Lab automatically) and ship full `GdsVibeTheme` token sets. The token graph, `verify:token-contrast-scoring` (now **200 readable-text pairs across 25 themes**, all ≥ AA — the two new lanes clear AAA), `verify:theme-accessibility` (300 checks), the DTCG export (`tokens/gds.tokens.json`, 25 themes), and `THEME_GOVERNANCE.md` are all updated. Additive; no change to existing presets.

## 3.14.9 - 2026-07-26 — Default semantic-role token layer for the base gdsTheme

- **Default semantic-role token layer** (#451): the base `gdsTheme` now defines its **structural** semantic roles at `:root` in `@sovereignsquad/gds-theme/styles.css` — `--gds-bg-canvas`/`--gds-bg-page`/`--gds-bg-surface`/`--gds-bg-card`/`--gds-bg-inverse`, `--gds-border-card`, `--gds-text-body`/`--gds-text-primary`/`--gds-text-meta`/`--gds-text-secondary`, and `--gds-text-on-inverse` (light/dark via CSS `light-dark()`). Previously these role variables were defined only by `createBrandTheme(...)`, so the base theme left them undefined and every component fell back to a divergent per-call-site guess (`--gds-bg-surface` resolved to `#eee`/`gray-1`/`white` in different places). Now a component reads **one governed default** regardless of where it's used.
  - **Values match the contrast-gated `default` theme**, so the documented per-token-pair **WCAG AA contrast contract** (`text-body`/`text-meta` on `bg-surface`/`bg-canvas`, `text-on-inverse` on `bg-inverse`) is guaranteed and **already policed by `verify:token-contrast-scoring`** — no new gate needed. Full table in the new [`docs/SEMANTIC_ROLE_TOKENS.md`](docs/SEMANTIC_ROLE_TOKENS.md).
  - **Additive and no-regression:** brand/vibe-preset application injects role variables as inline `:root` styles that win over the stylesheet layer, so **presets are unaffected by construction**. The decorative/state/accent roles (`--gds-brand-accent`, `--gds-state-*`, `--gds-focus-ring`, `--gds-badge-*`, …) are deliberately **left undefined** at the default layer so their hue stays a brand/preset decision rather than a fixed default.
  - **Role-misuse fix:** `BottomTabBar`'s top border read `--gds-text-secondary` (a text role) for a border; it now reads `--gds-border-card`, so the new governed `text-secondary` value cannot darken that hairline. `THEME_GOVERNANCE.md` and `README.md` updated.

## 3.14.8 - 2026-07-26 — Consumer WCAG contrast checker

- **Consumer contrast checker** (#453): two additive, pure, **server-safe** exports in `@sovereignsquad/gds-theme` (root, `/server`, and `/client` entries) surface the same WCAG 2.x contrast math GDS hard-gates its own tokens with (`verify:token-contrast-scoring`), so consumers can score **their own** brand/custom color pairs before shipping instead of re-implementing the formula:
  - **`getGdsContrastRatio(foreground, background)`** — returns the WCAG contrast ratio (1–21, 2-dp), accepting `#hex` (3-/6-digit), `rgb()`, and `rgba()`; a translucent foreground is composited over the background first so the scored color is the one a user sees. Throws on an unparseable color.
  - **`checkGdsContrast(foreground, background, options?)`** — checks a pair against a chosen WCAG threshold and reports `{ ratio, required, passes, level, size }`. Defaults to the GDS baseline **AA / normal (4.5:1)**; `level` (`'AA'`|`'AAA'`) and `size` (`'normal'`|`'large'`) select the 4.5 / 3 / 7 / 4.5 thresholds.

  No React, no DOM — safe in a Server Component, route handler, or build script. Documented in [`docs/CONTRAST_CHECKER.md`](docs/CONTRAST_CHECKER.md). This is the consumer-facing checker slice of #453; the broader theme-builder/preset work on that issue remains open.

## 3.14.7 - 2026-07-26 — Screen-organized case studies + recorded foldable decision; JSDoc backfill batch

- **Screen-organized case studies + recorded foldable decision** (#459): new [`docs/CASE_STUDIES_BY_SCREEN.md`](docs/CASE_STUDIES_BY_SCREEN.md) walks three screen types — a list-detail admin (operational shell + `GdsSplit`/`DetailProfileShell`), a public discovery surface (`PublicShell` + `BottomTabBar` + a supporting pane), and a kiosk/large-screen lane — each composed only from the canonical layout templates and walked across the named size classes (`compact`→`xlarge`), complementing the existing migration/adoption case study. The **foldable / dual-screen build-or-not decision** is recorded: **defer** — a single-window fold reads as a normal responsive size-class boundary today, and CSS `viewport-segments` is too narrowly supported to gate on — with a re-evaluation trigger when `viewport-segments` reaches baseline browser support; multi-window/Window Management orchestration stays a permanent non-goal. `RESPONSIVE_AND_PLATFORM_GUIDANCE.md` and `README.md` updated. Docs-only.
- **JSDoc backfill — batch** (#414): added interface- and per-prop JSDoc to `FormFieldProps`, `ActionBarProps`/`ActionBarAction`/`ActionBarIconAction`, and `ReferenceSectionProps`, so consumer editors surface field-level docs on hover for these primitives. Docs-only (JSDoc → `.d.ts`), no behavior change. #414 remains open as the phased backfill tracker.

## 3.14.6 - 2026-07-26 — PWA thin build: web-app-manifest generator, standalone detection, safe-area tokens

Delivers the standards-based PWA pieces scoped in #455 (PWA = *partial build*), keeping GDS a component/theme library rather than an app framework.

- **PWA thin build** (#458): three additive, tree-shakeable helpers in `@sovereignsquad/gds-theme` (no breaking changes):
  - **`getGdsWebAppManifest(options)`** — server-safe generator returning a valid, spec-shaped W3C web-app-manifest object from GDS theme/brand inputs, so the manifest's `theme_color`/`background_color` stay aligned to the active theme instead of a hand-maintained duplicate. Required `name`/`themeColor`/`backgroundColor` (throws otherwise); defaults `display: 'standalone'`, `start_url`/`scope`/`id: '/'`, `short_name` falls back to `name`. GDS does not serve the manifest — consumers serialize the result to their `manifest.webmanifest` (e.g. a Next.js `app/manifest.ts`). Exported from the root, `/server`, and `/client` entries.
  - **`useGdsStandaloneDisplayMode()`** — SSR-safe client hook reporting whether the app runs as an installed PWA and its current `display-mode` (`standalone`/`fullscreen`/`minimal-ui`/`browser`), updating live on mode change; detects the `display-mode` media features plus iOS Safari's legacy `navigator.standalone`. Exported from the root and `/client` entries.
  - **`gdsSafeAreaInset`** + **`--gds-safe-area-inset-{top,right,bottom,left}`** — governed safe-area inset custom properties in `styles.css` (each `env(safe-area-inset-*, 0px)`, resolving to `0px` on non-notched displays) exposed as ready-to-use `var(...)` strings, so shells/consumers read one inset source instead of hard-coding `env(safe-area-inset-*)`.

  **Explicit non-goals (unchanged):** service-worker/offline caching and an install-prompt UX framework — application-architecture concerns owned by the consuming app; GDS documents the integration point only. Documented in `docs/PWA_VIEWPORT_POLICY.md` and `docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md`.

## 3.14.5 - 2026-07-26 — Meta-text-on-page contrast hard-gated (every lane clears WCAG AA)

- **Meta-on-page contrast nudged to WCAG AA and promoted to a hard gate** (#460): eight expressive light lanes (`dark-public`, `editorial`, `sunset`, `ruby`, `skyline`, `coral`, `orchid`, `royal`) shared the default `mutedLight` (`#64748b`), which on their tinted light canvases produced meta/muted-text-on-page contrast of **4.26–4.48** — just under 4.5:1. `verify:token-contrast-scoring` previously reported these as non-blocking *advisories*. Those lanes now carry a slightly darker `mutedLight` (`#5f6d82`) — a minimal nudge that clears 4.5:1 on every one of those canvases (worst case 4.70) while keeping meta-on-card comfortably above AA (≥5.2) — and the `muted`-on-`canvas` pair is **promoted from advisory to a hard release gate**. The gate now hard-asserts **184 readable-text fg/bg pairs across 23 themes** at WCAG AA 4.5:1 with an empty advisory tier. Only `mutedLight` in light mode changed (dark mode, body text, and the lanes that were already ≥4.5 are untouched); the DTCG token export (`tokens/gds.tokens.json`) is regenerated to match, and `VPAT_CONFORMANCE.md` is updated.

## 3.14.4 - 2026-07-26 — Theme Lab result cards re-theme like a built-in theme + active-preset indicator

Bug fix for the Theme Lab (`/themes`, `ReferenceThemeExplorer`), reported as "Theme Lab ruins the page."

- **Theme Lab control/result cards now re-theme their own backgrounds like any built-in theme** (#461): the three primary control cards ("Theme preset", "Brand builder options", "Current selection summary") were wrapped in a bespoke *owned-contrast* surface (`role: 'theme-lab-controls'`) built from an internally contradictory token set — a **dark** `surfaceDark` gradient `background`/`backgroundColor` combined with a **light** `surface`. Under the global `html[data-gds-theme-preset] [data-gds-owned-contrast]` `!important` rule this painted the cards as **dark boxes on an otherwise light page** for every light preset (amber, cosmic, editorial, …), inconsistent with the rest of the page and, per the report, unreadable. The override is removed: those cards are now plain `.gds-paper` surfaces that re-theme **both background and text** through the same `html[data-gds-theme-preset] .gds-paper` rule every other card uses — readable in light and dark across all presets, exactly "as any built-in theme." Owned contrast stays reserved for the intentional vibe *swatch* surfaces (the shipped-lane gallery, the VibeTheme contract, and the Athlete Gold reference), whose job is to preview a specific vibe atmosphere rather than match the page. The now-unused `theme-lab-controls` value is retired from the `GdsOwnedContrastRole` public union.
- **Active-preset "Selected" indicator** (#461): the Theme Lab control panel now shows a clear `Selected: <preset>` badge on both the preset picker and the current-selection summary, so an active Theme Lab preset is visibly labelled (previously there was no active-state affordance in the control area).
- **Gates updated at the source** (#461): `verify-owned-contrast-compliance.mjs` and `verify-theme-trust-runtime.mjs` previously *required* the `theme-lab-controls` owned surface (they had codified the buggy behavior). They now assert the opposite — the control cards must **not** carry a bespoke owned-contrast surface, must share the page's global `.gds-paper` background, and must render exactly two visible "Selected" indicators — and the retired role is guarded against reintroduction. The `core.test.tsx` explorer test was updated to match. No API change beyond the retired role literal; only the Theme Lab's own rendering is affected.

## 3.14.3 - 2026-07-25 — Shared `gdsBreakpointByAlias` size-class helper

- **`gdsBreakpointByAlias` public helper** (#457): the breakpoint alias→width map (`{ xs: 36em, sm: 48em, md: 62em, lg: 75em, xl: 88em }`) was duplicated inside `KanbanBoard` (`useGdsKanbanOrientation`) and `DiscoveryShell`. It is now a single exported `gdsBreakpointByAlias` from `@sovereignsquad/gds-core`, consumed by both — one source of truth aligned with the named size-class vocabulary in `docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md`. Additive and backward compatible: existing behavior is unchanged; consumers building custom responsive chrome can now resolve the same governed widths instead of hard-coding pixel breakpoints. `verify:token-contrast-scoring` (#456) also joined the release chain in this line — real per-token-pair WCAG scoring of the readable-text fg/bg pairs across all shipped themes — though it added no consumer-facing behavior.

## 3.14.2 - 2026-07-25 — Forced-colors hardening for themed surfaces + widened forced-colors gate coverage (3.14.0 quality follow-up)

Quality follow-up to the 3.14.0 primitives (epic #440, group A). This closes the theme half of #445 by fixing a real forced-colors accessibility bug that the widened gate coverage surfaced.

- **Forced-colors: themed surfaces/controls no longer leak decorative gradients** (#445): the vibe/brand theme presets (`cosmic`, `neon-night`, `sunset`, …) paint `!important` gradient `background`/`background-image` on Papers, cards, buttons, badges, and the app shell using preset-scoped selectors carrying **two** attributes (`[data-mantine-color-scheme][data-gds-theme-preset='…']`, plus `:not()` clauses for buttons). `@sovereignsquad/gds-theme/styles.css` already had a `@media (forced-colors: active)` reset, but its `html[data-gds-theme-preset] …` selectors carry only **one** attribute, so those preset rules out-specified it and their gradients survived into forced-colors mode — a genuine contrast bug (a forced-colors user could get unreadable text over a gradient). Added a forced-colors **specificity backstop** that re-applies the neutralization (surfaces → `Canvas`, controls → `ButtonFace`/`Highlight`, badges → `Mark`, `background-image: none`, decorative `body::before`/`::after` hidden) with a never-matching `:not(#gds-never)` id guard, which contributes an ID's specificity weight so it outranks every preset rule regardless of attribute/`:not()` count — in any theme lane, present or future. No API change; only forced-colors rendering of the expressive theme lanes is affected (the default/dark lanes were already correct).
- **Widened forced-colors gate coverage** (#445): `scripts/verify-forced-colors-runtime.mjs` now drives route coverage off the pattern-catalog families that mount the 3.14.0 components — it visits `/patterns/operations` (Kanban) and `/patterns/foundations` (Forms), which the old fixed 4-route list never did — and exercises the two new-component routes across **8** theme presets (well beyond the previous 3), spanning neutral, dark, flat-surface, editorial, brand-discovery, high-saturation vibe (`cosmic`/`neon-night`), and warm lanes. It adds targeted per-component checks for the Kanban collapse toggle + column footer and the schema form's checkbox-group + repeatable rows, so a vanished-in-forced-colors or decorative-background regression on those specific controls fails `verify:release`. This widened sweep is what caught the vibe-theme gradient leak above; CI-only, no package impact.

## 3.14.1 - 2026-07-25 — GdsSchemaForm i18n + themed checkbox-group (3.14.0 quality follow-up)

Quality follow-up to the 3.14.0 primitives (epic #440, group A):

- **Themed checkbox-group** (#444): `GdsSchemaForm`'s `checkbox-group` now renders governed Mantine `Checkbox` controls instead of a raw native `<input type="checkbox">`, so the checkboxes inherit the GDS theme and the governed forced-colors remap like every other control (closing a real light/dark and forced-colors gap for that field). No API change.
- **GdsSchemaForm i18n** (#443): the previously hardcoded-English user-facing strings — the `repeatable` row-count live announcements (`Row added/removed, N rows.`), the checkbox-group/repeatable validation messages (`requires at least one selection.`, `has a row with a missing required field.`, min/max rows), the shared `is required.` message, the default add/remove-row button labels, and the `(required)` marker — now route through `useGdsTranslation()` with new `gds.schemaForm.*` keys added across all **12** locale packs (English output unchanged). Added a test for the `repeatable` aria-live announcement. Consumer `addRowLabel`/`removeRowLabel` overrides still win. (Number-embedded pre-existing validation messages for `minLength`/`maxLength`/`pattern`/`email`/`number` remain a tracked follow-up under #443.)
- **Docs** (#446): `llms.txt` updated to describe the 3.14.0 Kanban props, the `GdsSchemaForm` `checkbox-group`/`repeatable` field types, and the opt-in `dates.css`; `docs/SCHEMA_FORMS.md` notes the themed checkbox + localized messages.

## 3.14.0 - 2026-07-25 — Kanban server-pagination/footer/collapsible, opt-in date CSS, GdsSchemaForm primitives, label-based issue board

- **KanbanColumn server-paginated count** (#432): the header count badge now renders `column.totalCount` when set, falling back to `column.items.length`. Server-paginated columns (where `items` hold only the loaded page) can show their real total instead of the loaded-page count. Additive and backward compatible — omitting `totalCount` is unchanged. `COMPONENTS_AND_PATTERNS.md` updated.
- **KanbanColumnData.title accepts ReactNode** (#434): column headings can now be a `ReactNode` (icon + label, colored dot, custom count pill), matching `KanbanItem.title`. Set the new `KanbanColumnData.ariaLabel` when `title` is not a plain string so move-menu targets and drag announcements keep a meaningful accessible name (string titles need nothing). Backward compatible.
- **KanbanColumn footer slot** (#435): new `footer` / `renderFooter(column)` on `KanbanColumn`, and `renderColumnFooter(column)` on `KanbanBoard`, render an element below the card list (pagination / "load more" / per-column actions) outside the drag `SortableContext`. Additive.
- **Collapsible KanbanColumn** (#436): opt-in `collapsible` (off by default) renders a header disclosure toggle (`button` with `aria-expanded`/`aria-controls`) that folds a column body to its title + count; a collapsed column is not a drop target. Controllable board-wide via `collapsedColumnIds` + `onCollapsedChange(columnId, collapsed)` or per-column via `collapsed` + `onCollapsedChange(collapsed)`. New localized `gds.kanban.collapseColumn`/`expandColumn` strings across all 12 locales. Mirrors the `enableDrag` opt-in pattern — zero behavior change on upgrade.
- **gds-theme date-component CSS is now opt-in** (#433): `@sovereignsquad/gds-theme/styles.css` no longer unconditionally `@import`s `@mantine/dates/styles.css`. The Mantine dates stylesheet moved to a separate `@sovereignsquad/gds-theme/dates.css` export, imported only by consumers who render a GDS date component (`GdsDateInput`/`GdsDateTimeInput`/`GdsDateRangeInput`, or a `GdsSchemaForm` `date` field). Consumers who use no date component now need neither `@mantine/dates` nor `dayjs` and no longer hit a build-time "Module not found: @mantine/dates/styles.css". `@mantine/dates` and `dayjs` remain required peers of `gds-core` (where the date components live and are imported in JS); `gds-theme` deliberately does **not** declare them — it ships `dates.css` as an opt-in CSS `@import` only, not a JS dependency, so a consumer that loads `dates.css` already has them via `gds-core`. **Migration for date-component users:** add `import '@sovereignsquad/gds-theme/dates.css';` alongside your existing `styles.css` import. The playground adds it; `INSTALLATION_GUIDE.md` and `COMPONENTS_AND_PATTERNS.md` document it.
- **GdsSchemaForm checkbox-group + repeatable field primitives** (#437): two new `GdsSchemaFieldType`s. `checkbox-group` renders a grouped multi-select as a `fieldset` of checkboxes (value `string[]`; `required` = at least one), distinct from the single `boolean` checkbox and the `select` dropdown; a JSON Schema `enum` opts into it with `x-gds-fieldType: 'checkbox-group'`. `repeatable` is an "add another row of N fields" primitive — the descriptor carries nested `fields`, the value is an array of row objects, with governed add/remove controls, `minRows`/`maxRows` bounds, per-row required-sub-field validation, row-context button labels, focus management on add/remove, and an `aria-live` row-count announcement. Both flow through the `renderers` override map and `onEvent`. Additive (existing forms unaffected); no new i18n keys (labels are descriptor-driven, matching the component's existing string handling). Documented in `docs/SCHEMA_FORMS.md`; admin CRUD tutorial updated.
- **JSDoc backfill — batch 1** (#414): added export-level JSDoc to a coherent batch of compact gds-core primitives — the selection-chip family (`PillBar`, `SoftChipGroup`, `FilterChipGroup`, `GdsSelectionOption`, `GdsSelectionGroupProps`), `FitScoreChip`, `NumberStepper`, and `ListingCard` (with `ListingCardProps`, `ListingMetadataRow`, `ListingCardAffordance`, `ListingCardMediaRatio`, `MAX_LISTING_CARD_ACTIONS`). Docs-only, no behavior change. #414 remains open as the phased tracker for the remaining public-export backfill.
- **Project board moved from Projects v2 to a label-based issue board** (#438, supersedes #431): the board is now **GitHub Issues grouped by `status:` labels** (`PROJECT_BOARD.md`), not an org-level Projects v2 board. Every board operation is a label change the ambient `GITHUB_TOKEN` can perform, so the `GDS_PROJECT_TOKEN` PAT requirement is gone — the fragile part that could not be managed from the maintainer's agent/mobile workflow and drifted after each release. New taxonomy SSOT (`scripts/board-labels.config.mjs`: `status:`/`priority:`/`area:` labels), a provisioner (`npm run board:labels`, `gh label create --force`), a rewritten label audit (`audit:board` non-strict inside `verify:release` so a missing `gh` never blocks a release; `audit:board:strict` fails when an open issue isn't in exactly one status column), and a label-based `board:sync-release` (closing a delivered issue is its "move to Done"). The retired Projects v2 scripts (`audit-project-board.mjs`, `complete-3-4-board.mjs`, `sync-hvb-board.mjs`) and their npm entries are removed; `.github/workflows/board-sync.yml` now provisions labels and runs the strict audit with the default token. Docs updated: `PROJECT_BOARD.md` (new), `RELEASE_PUBLISH.md`, `docs/BOARD_SYNC_CHECKLIST.md`, `README.md`.
- **Dependency & CI hardening** (#439): patched the newly-disclosed high-severity `brace-expansion` DoS advisory (**GHSA-mh99-v99m-4gvg**, `<= 5.0.7`) by moving the single tree entry to `5.0.8` within `minimatch`'s existing `^5.0.0` range (`npm update brace-expansion`, no override) — production audit is clean again. Also fixed the `quality.yml` "Override to Mantine 9" CI step, which the #433 work had tipped into an ERESOLVE: removing the incorrect `@mantine/dates`/`dayjs` peer declaration from `gds-theme` (its JS never imports them — they belong on `gds-core`) restored the Mantine-9 resolution while keeping the opt-in `dates.css`.

## 3.13.0 - 2026-07-24 — React 19 runtime, react-router 8, Kanban generics/affordance, dev diagnostics, DX docs

- **Workspace runtime upgraded to React 19; react-router advisory remediated** (#430): bumped the dev/app React runtime from 18.3.1 to 19.2.7 across the reference apps and package dev/test tooling, and migrated the playground from `react-router-dom@7` to `react-router@8` (the DOM bindings merged into `react-router` in v7+). This clears the high-severity **GHSA-qwww-vcr4-c8h2** production advisory (`react-router` 7.12.0–8.2.0; react-router 8 peer-requires React ≥19.2.7, which is why the React bump was needed). **The published peer contract is unchanged** — `react`/`react-dom` peers stay `^18.2.0 || ^19.0.0`, so React 18 remains a fully supported consumer lane (still validated by `verify:mantine`'s Mantine 7 + React 18 consumer-install smoke); only the workspace's own dev/CI runtime moved to 19. No GDS component code changed (the codebase was already React-19-clean: `createRoot`, no removed APIs, `@types/react` already 19; Mantine 7.17.8 already declares a React 19 peer). `compatibility.matrix.json` now labels React 19 + Mantine 7 as the primary CI/workspace line. A newly-disclosed dev-only PostCSS source-map advisory (**GHSA-r28c-9q8g-f849**, nested in `next`/`tsup`, non-shipped) — previously masked by the react-router production failure — is documented as an accepted dev advisory in `DEPENDENCY_AUDIT.md`, matching the identical `GHSA-6g55-p6wh-862q` disposition.
- **KanbanCard move-menu icon no longer implies drag** (#429): the "move to column" menu trigger defaulted to `IconArrowsMove` (a 4-way-arrows glyph) whenever `onMoveItem` was set — independent of `enableDrag` — which universally reads as "grab and drag me." But that control is a tap-to-open destination menu, and real pointer/touch drag is gated behind `enableDrag` (a separate grip handle), so on touch the icon promised a free-drag it never performed. The default is now a new governed `More` (vertical-dots) glyph (`IconDotsVertical`) — the standard "tap to open a menu" affordance with zero drag implication — used whether `enableDrag` is on or off. New optional `moveMenuIcon?: ReactNode` and `moveMenuLabel?: string` props on `KanbanBoard`/`KanbanColumn`/`KanbanCard` let consumers override the trigger's icon/verb without losing the governed menu. Backward compatible (icon swap + additive props); the accessible `"Move: {name}"` label and menu behavior are unchanged. Also adds the reusable `GdsIcons.More` kebab icon. See the "Move-menu icon vs. drag-handle icon" note in [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md).
- **`GdsPageTemplateAction.loading` (deprecates `pending`)** (#405): the page-template action busy-state prop is now named `loading`, matching every other GDS action/button API (`SemanticButton`, `ConfirmDialog`, `GdsAccessGateAction`, table row actions) — the previous outlier `pending` name forced consumers to remember which API used which. Backward compatible: `pending` is still honored as an alias (mapped to `loading`) with a one-time dev-only deprecation warning, and will be removed in a future major version; if both are set, `loading` wins. No repo consumer used `pending`, so blast radius is limited to the deprecation path. `docs/PAGE_TEMPLATES.md` updated.
- **Dev-mode misuse diagnostics** (#404): new dev-only `gdsDevWarnOnce` helper (`@sovereignsquad/gds-theme`, with `resetGdsDevWarnings` for test isolation) surfaces three previously-silent misuse gaps as one-time `console.warn` messages, stripped entirely from production builds (`process.env.NODE_ENV === 'production'` guard). Wired into: (1) `useGdsTranslation` — warns when called without a `GdsProvider` ancestor (detected by context-identity), which otherwise silently pins every string to built-in English; (2) `GdsDateInput`/`GdsDateTimeInput`/`GdsDateRangeInput` — warn on transposed `minDate`/`maxDate` or an out-of-range `value`; (3) `GdsAccessGate` — now routes contract-validation findings through the warning in addition to the optional `onEvent`, so an invalid state/reason/action combination is no longer completely silent when `onEvent` is omitted. Additive and non-breaking: correct usage sees zero behavior change and zero production cost; only incorrect usage gains a dev-time signal. This complements — never replaces — GDS's existing fail-loud `throw` for hard contract breaks.
- **Generic `KanbanBoard` item/column typing** (#399): `KanbanBoard`, `KanbanColumn`, `KanbanCard`, and their prop interfaces are now generic over the item and column shape — `KanbanBoard<TItem extends KanbanItem, TColumn extends KanbanColumnData<TItem>>`, with `KanbanColumnData<TItem extends KanbanItem = KanbanItem>` carrying `items: TItem[]`. Both parameters default to the base `KanbanItem` / `KanbanColumnData`, so this is a **backward-compatible typing enhancement with no runtime behavior change** — existing non-generic call sites (including the playground's `KanbanBoardDemo` and all prior tests) compile unchanged. Consumers who extend `KanbanItem` / `KanbanColumnData` with app-specific required fields now receive them fully typed inside `renderItem(item, column)` **without a cast** (previously the fixed `(KanbanItem, KanbanColumnData)` callback signature made an extended-shape `renderItem` a compile error at the call site — surfaced by a real downstream consumer build). `onMoveItem` keeps its string-id signature and no `@dnd-kit` types leak onto the public surface (`verify:boundary` unaffected). See the "Typed item/column extension" note in [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md).

## 3.12.0 - 2026-07-23 — competitive gap-closing batch (#387-#398)

Following `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md`'s benchmark against Material Design 3, Fluent UI 2, IBM Carbon, Ant Design 5, Shopify Polaris, Adobe Spectrum, Atlassian Design System, and Chakra UI, this release closes every P0/P1/P2 gap identified plus three incidental tech-debt items, in one consolidated batch.

**P0 — highest-impact gaps:**
- **Date/time picker family** (#389): `GdsDateInput`, `GdsDateTimeInput`, `GdsDateRangeInput` wrap `@mantine/dates` (new peer dependency, matching the `@mantine/core` engine class). `GdsSchemaForm`'s `date` field type now renders `GdsDateInput` instead of a bare native `<input type="date">`, keeping its stored value as an ISO (`yyyy-mm-dd`) string for backward compatibility.
- **`GdsBreadcrumbs`** (#390): standalone, independently reusable breadcrumb trail (labeled `nav` landmark; last item always renders as the non-link current page even if it carries an `href`). `DocsPageShell` now uses it internally instead of an inline, duplicated implementation.
- **z-index token scale** (#391): `gdsZIndexToken` (`@sovereignsquad/gds-theme`) documents and defers to Mantine's own `--mantine-z-index-*` CSS variable scale as the single stacking authority. Fixed two real ad hoc violations found during implementation — `BottomTabBar` and `FloatingActionPlacement` each independently hardcoded different arbitrary z-index values (200 and 20) with no shared authority; both now use `gdsZIndexToken.app`.

**P1 — real gaps, narrower blast radius:**
- **`GdsRichTextEditor`** (#392): Tiptap-backed rich text editor (user-confirmed dependency choice, matching the `@dnd-kit` precedent's reasoning), composed into `ContentOpsEditor`'s demo as the description field. Fully encapsulated behind a dedicated `@sovereignsquad/gds-core/rich-text-editor` subpath export — kept out of the main package entry so its larger "Content engine" dependency stays genuinely opt-in (confirmed: `apps/reference-vite`'s own vendor chunk stayed at its pre-change size, since it never imports the subpath).
- **Global density-mode primitive** (#393): `GdsDensityProvider`/`useGdsDensity` publish a `compact`/`comfortable`/`spacious` axis products can set once, plus `useGdsCardContract()` documenting the fall-back-to-ambient-density extension pattern. Purely additive — no existing component's default changed.
- **`GdsColumnGrid`/`GdsColumnGridItem`** (#394): named 12-column (configurable) track-span grid, matching Carbon's 2x Grid / Ant Design's 24-col `Grid`, complementing `GdsGrid`'s equal-width auto-column layouts.
- **Overlay elevation scale** (#395): `Popover.defaultProps.shadow` is now explicitly `'md'`, cascading to Menu/HoverCard/Select-family dropdowns. `Card`'s existing `shadow: 'sm'` default is untouched. `Modal` has no theme-configurable shadow prop in this Mantine version, documented as a real constraint rather than left silently unaddressed.
- **CJK locale coverage** (#396): `zh` (Simplified Chinese), `ja`, `ko` message locales ship with full parity (168 keys each) and correct `direction`/`script` metadata. Machine-translated via the same disclosed Google Translate approach already used for playground site-phrases — **not reviewed by a native speaker**; flagged for review before treating as production-quality.

**P2 — lower urgency:**
- **Icon catalog expansion** (#397): ~40 new semantic icon keys (navigation, commerce, security, rich-text-editor toolbar, plus location/building/folder/archive/connectivity/flag/tool/phone/drag-handle).
- **Financial/network chart types** (#398): `candlestick` (OHLC) and `sankey` (flow) ship as a new governed "Set C" (`gdsChartSetCTypeRegistry`), with their own validation rules (OHLC high/low range containment; sankey source/target/non-negative-flow).

**Incidental tech debt fixed:**
- **Locale-metadata drift** (#387): `es` (Spanish) shipped full messages in `gds-core/locales` but was missing from `gds-theme`'s `gdsLocaleMetadata` (RTL/script-detection registry), silently mis-defaulting to English direction/script rules. Fixed, plus a new parity test guards against recurrence. `GDS_GAP_INVENTORY.md`'s stale "not covered" claims (charts, uploads, command palette, evidence panels) were also corrected.
- **Vibe-theme/preset drift guard** (#388): the 23 `GdsThemePresetId` entries each need a Mantine theme override (`theme-presets.ts`) and an independently hand-authored CSS "vibe theme" object (`vibe-themes.ts`). Confirmed the two intentionally draw from different color sources (Mantine's functional ramp vs. a bespoke, more saturated palette), so merging them isn't a safe mechanical refactor — added `vibe-themes.test.ts` instead, which fails CI if a preset id is ever added to one file without the other.

See `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md` for the full comparison this batch was scoped against.

## 3.11.1 - 2026-07-23 — release-cutover patch (no functional change)

- **Patch-only version bump** (#385): `gds-v3.11.0`'s git tag was created by `auto-tag-release.yml` before that same day's fix to the workflow (explicit `gh workflow run --ref` dispatch, added to work around GitHub Actions' anti-recursion rule for `GITHUB_TOKEN`-authored pushes) landed, so the tag was stuck pointing at the pre-fix commit and `release-bundles.yml` never created a GitHub Release/tarball for it. Moving the existing tag directly was attempted and blocked (git proxy `403` on both tag deletion and force-push, no GitHub-API tag-ref tool available). This patch bump carries no functional/code change beyond the version-bump surfaces themselves — it exists solely so the now-fixed automated pipeline produces a correctly-tagged `gds-v3.11.1` release and GitHub Packages publish with zero manual tag surgery.

## 3.11.0 - 2026-07-23 — mobile input-zoom guard + accessible Kanban drag-and-drop

- **Mobile input-focus auto-zoom guard** (#379, #380): `gdsTheme` now floors the effective font-size of every Mantine `Input`-based control (`TextInput`, `Textarea`, `NativeSelect`, `Select`, `PasswordInput`, `NumberInput`, `MultiSelect`, `Autocomplete`, `TagsInput` — including `gds-admin`'s `AdminTextInput`/`AdminTextarea`/`AdminSelect`, which are thin pass-throughs) to at least 16px at `xs`/`sm`/the implicit default size, via a new `components.Input.vars` entry in `packages/gds-theme/src/theme.ts` using `max(1rem, var(--mantine-font-size-sm))`. This prevents iOS Safari's/Chrome's forced page-zoom on input focus — a distinct mechanism from pinch-zoom, unaffected by `getGdsPwaViewportMetaContent`/`zoomPolicy` — without touching pinch-zoom or OS-level text scaling, so it ships as a silent default rather than an opt-in flag. `md`/`lg`/`xl` sizes (already ≥16px) are unchanged. `GdsSchemaForm`'s `renderDefaultField` raw-native-element fallback (no Mantine class, so the theme fix can't reach it) gets its own matching inline font-size floor. **Visual diff for existing consumers on upgrade:** any `xs`/`sm`/default-size input renders measurably larger text (12–14px → 16px) with no code change required. See the new "Input-focus auto-zoom" section in [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md).
- **Accessible Kanban pointer/touch/keyboard drag-and-drop** (#381–#384): `KanbanBoard` gains an opt-in `enableDrag?: boolean` prop (default `false` — zero behavior change for existing consumers). When enabled, each `KanbanCard` gets an additional drag handle built on `@dnd-kit/core` + `@dnd-kit/sortable` (new dependencies of `@sovereignsquad/gds-core`, fully encapsulated — never a public export or consumer import, see the new "Interaction engine" class in [`DEPENDENCY_GOVERNANCE.md`](DEPENDENCY_GOVERNANCE.md)), supporting pointer, touch, and keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel) dragging with localized live-region announcements (new `gds.kanban.drag*`/`announce*` message keys across all 9 locale packs). Native HTML5 `draggable`/`dragstart` is still never used (it remains inoperable by keyboard/screen-reader users and is prohibited by the accessibility release gate) — the existing keyboard-accessible "Move to column" menu stays unconditionally rendered and fully functional in both modes, and is the guaranteed accessible-equivalent fallback. `onMoveItem`'s signature widens with an optional trailing `toIndex` parameter (backward compatible — existing 3-argument call sites are unaffected). New `scripts/verify-kanban-drag-accessibility-runtime.mjs` (wired into `verify:release`) asserts the Move menu and drag handle both keep working with `enableDrag` on.

## 3.10.0 - 2026-07-22 — kanban + media + PWA viewport lane

- **Kanban Board pattern**: new governed responsive `KanbanBoard` (`KanbanColumn`/`KanbanCard` sub-parts, `useGdsKanbanOrientation` hook) in `@sovereignsquad/gds-core`. Portrait-mobile viewports render one stacked column per row; landscape phones, tablets, and desktop render multi-column with horizontal scroll — resolved automatically via a `useMediaQuery`-backed hook, no consumer CSS or breakpoint logic required. Cards move between columns through a keyboard-accessible "move to column" menu (`onMoveItem(itemId, fromColumnId, toColumnId)`) instead of native HTML5 drag-and-drop, which cannot be operated by keyboard or screen-reader users. Registered in the pattern catalog (`kanban-board`, operations family) with a live demo, i18n keys (`gds.kanban.*`) added to all 9 locale packs, and a new `docs`/`COMPONENTS_AND_PATTERNS.md` "Kanban Board Rules" section.
- **`MediaPreviewCard` / `AdminResourceCard` missing-media handling**: added `hideWhenNoMedia?: boolean` to `MediaPreviewCard` (and threaded through `AdminResourceCard`/`AdminResourceGrid`/`AdminResourceManager`) so records with no `src`/`thumbnailSrc` can omit the media area entirely instead of showing the default "No media" placeholder. Missing media already never crashed the card; this adds explicit opt-in control for record types that structurally never have media (e.g. lead/contact rows).
- **PWA viewport & zoom policy**: new `getGdsPwaViewportMetaContent(...)` export from `@sovereignsquad/gds-theme` generates the canonical `<meta name="viewport">` content. Default `zoomPolicy: 'browser-default'` leaves pinch-zoom untouched (required for WCAG 1.4.4/1.4.10); the new `'app-shell-fixed'` lane adds `maximum-scale=1, user-scalable=no` as a reviewed, documented, opt-in exception for installed PWA app shells. See [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md) for the required accessibility mitigations, scope limits, and exit condition.
- **Fully automatic release cutover**: new `.github/workflows/auto-tag-release.yml` triggers on any push to `main` that changes the root `VERSION` file, and creates/pushes the matching `gds-v<VERSION>` tag using the workflow's own `GITHUB_TOKEN` — no maintainer needs to run `git tag`/`git push` or draft a release in the GitHub web UI for a routine version bump. That tag push fans out into the existing `release-bundles.yml` (build, `verify:release`, pack, create the GitHub Release, attach tarballs) and `publish-npm.yml`, which now also triggers on the tag push (previously `workflow_dispatch`-only) instead of requiring a manual run. See the updated "GitHub Actions publish path" section in [`RELEASE_PUBLISH.md`](RELEASE_PUBLISH.md).
- **GitHub Packages distribution channel**: new `.github/workflows/publish-github-packages.yml` publishes all seven packages to GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`) on the same `gds-v*` tag trigger, authenticated with the workflow run's own ambient `GITHUB_TOKEN` — no `NPM_TOKEN`/npm.com account dependency, so it keeps working even when the npmjs.com publish is blocked. Unlike the release-bundle tarball fallback, it's a real resolving registry, so the `@sovereignsquad/gds` umbrella package installs correctly there too. `scripts/publish-packages.mjs` and `scripts/check-registry-publication.mjs` already supported a configurable `GDS_NPM_REGISTRY`, so no script changes were needed — only the `.npmrc`/registry-URL wiring in the new workflow and consumer install docs (README.md, `INSTALLATION_GUIDE.md` §9, `RELEASE_PUBLISH.md`).

## 3.9.0 - 2026-07-01 — brand-completion-lane (#362–#368)

- **Choice-chip family catalog coverage** (#362): the `choice-chips` catalog demo now mounts the full exported family — `ChoiceChip` (static, link/button, multi-select toggles) plus the stateful `PillBar`, `SoftChipGroup`, and `FilterChipGroup` selection groups (including a disabled option) — so every-theme render, forced-colors, and a11y-evidence gates exercise the whole family, not just the base chip.
- **MissingDataPrompt catalog coverage + i18n catalog keys** (#363): the `state-blocks` catalog demo renders `MissingDataPrompt` with a required-fields list, a call-to-action slot, and a `role="status"` recovery variant. Localized message keys `gds.state.missingData.title` / `gds.state.missingData.description` are added to all 9 locale packs (public catalog). `MissingDataPrompt` stays server-safe (no `'use client'`, no context hook) with English semantic defaults, so consumers localize by passing `title`/`description` resolved from the catalog — the component remains usable from `@sovereignsquad/gds-core/server`.
- **Form control family catalog coverage + i18n catalog keys** (#364): the `forms` and `form-field` catalog demos now mount `GdsSegmentedControl` (default, disabled, and many-item overflow), `GdsSlider` (1–10 plus a min-equals-max boundary), `GdsRatingScale` (1–5), and `GdsWizardStepper` (first/mid/last steps). Localized wizard/slider/rating message keys (`gds.form.wizard.back|next|finish|progress|optional`, `gds.form.slider.label`, `gds.form.rating.aria`) are added to all 9 packs (public catalog). The controls stay server-safe with English prop defaults; no public API changes.
- **Overlay Dialog/SidePanel alias coverage + i18n** (#365): the `modals` and `drawers` catalog demos now open `GdsDialog` and `GdsSidePanel` (open/close, focus trap, focus return, opaque surface). The overlay close-button `aria-label` now routes through the new `gds.overlay.close` key (added to all 9 packs) via the client-only `OverlayManager`, instead of Mantine's built-in English default.
- **Chart-wrapper family catalog coverage + i18n catalog keys** (#366): the `reporting-contracts` catalog demo now renders all seven wrappers (`GdsAreaChart`, `GdsSparkline`, `GdsLongitudinalChart`, `GdsBenchmarkBarChart`, `GdsRadarChart`, `GdsMaturityRadarChart`, `GdsGaugeChart`) in populated, empty, and loading states so the accessible table fallback is exercised per theme. Localized chart table-header keys (`gds.chart.table.label|value|secondaryValue|group`, all 9 packs) are added to the public catalog; `GdsChart` stays server-safe (English header defaults, consumer-overridable via `tableValueHeader`/`groupLabel`). The reporting legend swatches use `getGdsSeriesColor` instead of raw Mantine tokens, and a focused test asserts the benchmark wrapper mirrors its input into the table fallback.
- **Gold Athlete (Habigoal) brand preset** (#367): new first-class governed brand lane `gold-athlete`, mirroring the `class-usa` apparatus — `brand-tokens.ts` (five 10-step ramps `gold`/`charcoal`/`crimson`/`ivory`/`slate`, `CreateGoldAthleteBrandThemeOptions`, `createBrandTheme('gold-athlete')`), `vibe-themes.ts` (`gold-athlete` VibeTheme + semantic CSS variables, with the single-id brand-semantic guard widened to a preset map so the new lane's variables emit), `goldAthleteThemePreset` in `theme-presets.ts` (catalog + registry), and `index`/`client`/`server` exports (`goldAthleteThemePreset`, `GoldAthleteColorRampName`, `GoldAthleteColorRamps`, `CreateGoldAthleteBrandThemeOptions`). The palette passes WCAG AA in both schemes: charcoal body/heading text on ivory surfaces in light mode, ivory text with metallic-gold accents on near-black surfaces in dark mode, and a separate accessible `--gds-brand-accent-action` (darkened gold `#8a5a00`, 5.9:1 with white) for filled accent controls so the gold accent is never used as on-white body text. Additive — existing presets and the decorative `athlete-gold` vibe are unchanged.
- **Component→pattern-registry parity gate** (#368): new blocking `verify:component-catalog-parity` gate (wired into `verify:release`) fails CI if any public PascalCase UI component exported from `@sovereignsquad/gds-core` or `@sovereignsquad/gds-admin` (via each package's `index`/`client`/`server` entrypoints) is neither registered in the pattern registry (`apps/playground/src/pattern-registry.ts`, as a `sourceComponent`) nor listed in the reviewed exemption allowlist `boundary/component-catalog-exemptions.json` with a reason. Hooks (`use*`) and type-only exports are dropped by classification. Registry membership is what drives catalog render (every-theme + forced-colors), i18n routing, and a11y evidence, so this closes the exact gap that let the 17 lane components ship export-covered but unrendered/unevidenced. Sequencing this gate last surfaced that #362–#366 rendered the lane components in the catalog demos (`pattern-pages.tsx`) but never recorded them as `sourceComponent`, so the gate now completes that link: `PillBar`/`SoftChipGroup`/`FilterChipGroup` on the choice-chips row, `MissingDataPrompt` on state-blocks, `GdsSegmentedControl`/`GdsSlider`/`GdsRatingScale`/`GdsWizardStepper` on forms, the seven chart wrappers (`GdsAreaChart`/`GdsSparkline`/`GdsLongitudinalChart`/`GdsBenchmarkBarChart`/`GdsRadarChart`/`GdsMaturityRadarChart`/`GdsGaugeChart`) on reporting-contracts, `GdsDialog` on modals, and `GdsSidePanel` on drawers. The 124 genuinely non-catalog exports (layout/style primitives, typography atoms, providers/context, i18n formatters, page templates/catalog helpers, chart sub-parts and variant wrappers, `Admin*`/`Partner*` sub-parts of registered composites, icon surfaces, and client-runtime composites whose canonical pattern is registered elsewhere) are exempted with grouped reasons; stale exemptions warn non-fatally. Deterministic sub-second static scan, no build/network. See [`docs/COMPONENT_CATALOG_PARITY.md`](docs/COMPONENT_CATALOG_PARITY.md).

## 3.8.0 - 2026-07-01

- **Opaque overlay surfaces** (#342): GDS now owns the painted background of every overlay/dropdown surface (`Popover`, `Menu`, `Select`/`Combobox`, `MultiSelect`, `Autocomplete`, `HoverCard`). `styles.css` sets an opaque, GDS-owned `--gds-overlay-surface` token (white / `--mantine-color-dark-6` / system `Canvas` under forced-colors) and applies it to all dropdown containers with hard fallbacks, so overlays stay solid even when the vendor base stylesheet is absent or an unlayered consumer reset competes. Resolves the cross-client transparent-dropdown failures.
- **Mandatory stylesheet import documented + guarded** (#344): every consumer integration path — `INSTALLATION_GUIDE.md`, `docs/CLASSSCOUT_INTEGRATION.md`, `docs/AI_AGENT_GUIDE.md`, `README.md`, the Vite/Next `TEMPLATES`, and the playground install code — now shows `import '@sovereignsquad/gds-theme/styles.css'` as the first bootstrap step. `verify-install-bootstrap-docs.mjs` fails CI if any tracked integration doc or template omits it, preventing the documentation gap that caused unstyled/transparent surfaces in consumer apps.
- **Public type-boundary gate** (#343): `verify:public-types` (in `verify:release`) scans the built consumer-facing `.d.ts` for `@mantine/*` references and fails on any not recorded in `boundary/public-type-allowlist.json`. This seals GDS's public type surface — a vendor major or accidental pass-through now fails in GDS's CI, not in a consumer's compile step — and freezes the documented intentional exposures (the `GdsPrimitives` passthrough; theme-override types) so the surface can only shrink deliberately, never grow by accident. See [`docs/PUBLIC_TYPE_BOUNDARY.md`](docs/PUBLIC_TYPE_BOUNDARY.md).
- **Single install surface** (#346): consumers install `@sovereignsquad/gds` (+ React) only — the engine (`@mantine/*`, `@tabler/icons-react`) is pulled in automatically as auto-installed peers and never listed by the consumer. The engine stays a peer on purpose (single resolved instance, no dual-instance/skew failures). New `verify:install-surface` gate enforces that all GDS packages pin the **same** engine range, React/react-dom remain consumer-owned peers, the umbrella declares the full engine, and the GDS-owned `GdsIcons` surface is reachable (so consumers never import `@tabler/icons-react` directly). Install docs now lead with the single command.
- **Boundary contract suite** (#347): one named `verify:boundary` gate (in `verify:release`) composes the boundary gates into a single verdict — public type surface (#343), single install surface (#346), and a new **public CSS-selector gate** (`verify:css-boundary`) that freezes the `.mantine-*` selectors in the published stylesheet to `boundary/public-css-allowlist.json` and fails on new ones. Together with the runtime opaque-overlay checks (#342) and the export contract, this makes the vendor boundary a one-way ratchet: the vendor surface can only shrink deliberately, never grow by accident. See [`docs/BOUNDARY_CONTRACT.md`](docs/BOUNDARY_CONTRACT.md).
- **Vendor version governance** (#348): `vendor-governance.json` is the single source of truth for the GDS-owned engine version; `verify:vendor-pin` (in `verify:release`) fails if any package's engine/platform peer ranges drift from the manifest. Engine upgrades become deliberate, reversible internal migrations behind the sealed public contract via [`docs/VENDOR_UPGRADE_RUNBOOK.md`](docs/VENDOR_UPGRADE_RUNBOOK.md) — the CI matrix smoke-tests the candidate major, breakage is absorbed in adapters only, and rollback is a single revert.
- **Styling-contract migration to GDS hooks** (#345): GDS themes its core surface group (`Paper`, `Card`, `Alert`, `Code`) through GDS-owned classes (`.gds-paper`, `.gds-card`, `.gds-alert`, `.gds-code`) attached globally via theme `classNames`, instead of vendor-internal `.mantine-*` selectors. The published stylesheet's vendor-selector surface shrank 38 → 34 (enforced down by `verify:css-boundary`); migration is visually identical (the GDS class lands on the same element) and verified by the theme-trust + forced-colors runtime checks across all presets. Remaining selectors migrate incrementally under the gate. See [`docs/THEME_STYLING_HOOKS.md`](docs/THEME_STYLING_HOOKS.md).
- **Overlay adapter seam** (#349): a GDS-owned `OverlayAdapter` interface (with default `mantineOverlayAdapter`) makes the overlay engine swappable without changing any consumer call site or the public component API. `GdsProvider` accepts an `overlayAdapter` prop (defaults to current behavior); `useOverlayAdapter()` exposes it; `surfaceProps(role)` carries the `data-gds-overlay-surface` hook (#342). All adapter types are GDS-owned, so the seam does not widen the vendor type boundary. Swappability is proven by a test that reads a different engine purely by swapping the injected adapter. Overlay components adopt the seam incrementally. See [`docs/OVERLAY_ADAPTER.md`](docs/OVERLAY_ADAPTER.md).
- **Class USA first-class theme and primitive completion** (#359): `createBrandTheme('class-usa')` and `classUsaThemePreset` now ship the locked Class USA ramps, fonts, semantic tokens, token graph, and CSS variables, including accessible `--gds-brand-accent-action` for filled accent controls. `GdsProvider` applies theme-owned variables to the document root so portalled overlays inherit the active brand. Core now exposes brand-button variants, pill/soft/filter chip groups, dialog/side-panel aliases, missing-data prompts, saved/rating listing-card anatomy, and a larger accessible chart wrapper set (`GdsAreaChart`, `GdsSparkline`, `GdsLongitudinalChart`, `GdsBenchmarkBarChart`, `GdsRadarChart`, `GdsMaturityRadarChart`, `GdsGaugeChart`, `GdsCalendarHeatmapChart`, `GdsHistogramChart`, `GdsDivergingBarChart`, `GdsSlopeChart`, `GdsSymmetryChart`) with table fallback and opt-in decimation.
- **Gold-Athlete handoff closure** (Habigoal #502): the Athlete Gold lane now benefits from global portal variable propagation and the expanded package-native controls requested by the Habigoal audit: `GdsSegmentedControl`, `GdsSlider`, `GdsRatingScale`, `GdsWizardStepper`, chart-kit wrappers, `MissingDataPrompt`, and strict compliance rules for app-local raw hex/rgb colors, inline color literals, and non-token numeric radii. `docs/CLASSSCOUT_INTEGRATION.md` was updated with the 3.8.0 single-package install and migration surface list.

## 3.7.0 - 2026-06-30

- **Published consumer smoke**: `verify:published` now runs registry polling and a clean npm consumer fixture that installs the published package line outside the monorepo, type-checks imports, and verifies runtime exports across all seven public packages.
- **Athlete Gold reference surface**: `/themes` now includes a package-owned black-and-metallic-gold navigation reference panel backed by the shipped Athlete Gold VibeTheme tokens.
- **Schema upload adapter**: `GdsSchemaForm` accepts `uploadAdapter` for file-upload fields, with progress, retry, cancel, remove, upload-result payloads, and metadata-only upload events.
- **Actionable table cells**: `GdsDataTable` columns can mark `interactive: true`; grid-cell focus remains roving while `Enter`/`F2` enters nested controls and `Escape` returns to the cell.
- **Release board sync**: `board:sync-release` closes explicitly delivered issues and normalizes closed GitHub project-board cards to `Done`, with dry-run and idempotent behavior.

## 3.6.0 - 2026-06-26 (sprint 2)

Two batches shipped under the 3.6.0 version number before per-batch versioning
discipline began in 3.7.0 — kept as two dated entries, sprint 1 first, for
historical accuracy rather than merged or renumbered.

- **GdsDataTable keyboard navigation** (#333): roving grid-cell focus with Up/Down/Left/Right/Home/End traversal, `role="grid"` semantics, `aria-selected`/`aria-rowindex` per row, and `aria-live` row/column announcements.
- **GdsSchemaForm `FileUploadField`** (#334): `'file-upload'` schema field type now maps JSON Schema `format: "binary"` / `data-url` into the governed `UploadDropzone`, supports accept/multiple/max-size/progress metadata, validates required and oversized files, and submits `File[]` payloads.
- **VibeTheme expansion + `VibeThemePicker`** (#335): honey-amber `warm` lane plus the new `Athlete Gold` black-and-gold performance lane are registered in `theme-presets` and `vibe-themes`; `VibeThemePicker` renders swatch buttons for all 20 vibe presets with keyboard-accessible `role="radiogroup"` and live glow/border selection states.
- **CI Mantine 9 matrix** (#336): `quality.yml` now runs `validate` across `mantine-7` and `mantine-9` with `fail-fast: false`, overriding Mantine packages to `^9` in the second leg via `npm install --no-save`.
- **AccessGate `render-degraded-while-locked` policy** (#337): new `protectedContentPolicy` value renders the protected subtree with `aria-hidden` + `inert` while the gate is locked, enabling SEO-crawlable and hydration-ready degraded content surfaces.

## 3.6.0 - 2026-06-26 (sprint 1)

- **`/ai` route** (#327): live playground page at `/ai` surfacing `llms.txt`, install steps, a drop-in `AGENTS.md` agent-rule template, non-negotiable agent rules, and a design-tool sync entry point. Registered in locale-coverage and gds-adoption governance contracts; all 9 locale packs covered.
- **10 design-tool sync previews** (#328): hand-authored preview components for the 10 ClassScout components shipped in 3.5.0 — `BottomTabBar`, `SearchableSelect`, `FitScoreChip`, `ChatThread`, `ChatMessage`, `ChatInput`, `StreamingIndicator`, `MeaningBadge`, `MediaWithFallback`, `NumberStepper`, `AISearchCard`. For upload to the canonical design-tool sync project.
- **ClassScout integration guide** (#330): `docs/CLASSSCOUT_INTEGRATION.md` with install, GdsProvider bootstrap with `createBrandTheme`, and per-contract usage examples for all 10 B1–B10 gaps; drop-in `AGENTS.md` agent rules for the ClassScout repo.
- **Mantine 9 migration audit** (#329): `docs/MANTINE9_MIGRATION.md`; `verify:mantine` already passes Mantine 9 with no GDS code changes required.
- Opened milestone #26 (GDS 3.6.0) and 5 backlog issues (#327-331).
- Closed all 10 ClassScout issues (#316-325) with 3.5.0 delivery notes; closed milestone #25.

## 3.5.0 - 2026-06-21

- ClassScout pure-GDS unblock (issues #316–#325): closed the 10 gaps required for consumers to ship on pure GDS with no app-level forks.
  - `gds-theme`: `createBrandTheme({ brandColors, fonts })` plus a brand-named semantic token layer (`brand.primary`, `bg.page`, `text.*`, `price`, `state.*`) emitted as `--gds-*` variables on top of the governed token graph, with WCAG-AA contrast enforcement (#316).
  - `gds-core`: `'bottom-tab'` mobile navigation mode + `BottomTabBar` (safe-area aware, raised center action) for `PublicShell`/`DiscoveryShell` (#317); `SearchableSelect` combobox with async/grouped options and full keyboard a11y (#318); `FitScoreChip` (#319); `ListingCard` `reason`/`score`/`actions` composition slots (#320); conversation surface `ChatThread`/`ChatMessage`/`ChatInput`/`StreamingIndicator` (#321); `MeaningBadge` distinct from `StatusBadge` (#322); `MediaWithFallback` resilient media (#323); `NumberStepper` (#324); `AISearchCard` governed assistant-entry pattern (#325).
  - All new UI consumes GDS tokens, is keyboard- and screen-reader-accessible, and is registered in the pattern export/API-docs coverage registries.
- Added an AI-agent integration layer so GDS is consumable by any LLM-powered coding tool: `llms.txt` (universal machine-readable entry point), `docs/AI_AGENT_GUIDE.md`, and a "Use with AI" quick-start in the README.
- Added a drop-in repo rule template `TEMPLATES/AGENTS.md.template` (cross-tool `AGENTS.md` standard) so consuming repos make every agent session build with GDS automatically.
- Added a design-tool sync integration: syncing GDS into a visual design tool so the design agent builds screens with the real GDS components, with committed sync inputs that make a re-sync one command.
- Synced all 252 components (249 hand-authored, render-verified previews + 3 floor-carded body-portal overlays) into the canonical GDS design-tool sync project, with a conventions header teaching the GdsProvider/prop-token/semantic-action build idiom.

## 3.4.14 - 2026-06-13

- Added dependency-governance policy for React, Mantine, Tabler, dependency classes, replacement triggers, and exception lifecycle.
- Classified API reference exports by stability and implementation boundary so consumers can distinguish canonical GDS contracts from Mantine/Tabler-backed surfaces.
- Added `GdsIcon name="..."` semantic icon support while keeping the existing `icon` prop compatible.
- Added dependency-boundary exception validation, dependency-risk reporting, and expanded compatibility smoke coverage for Mantine 7/React 18 plus Mantine 8/9 React 19.

## 3.4.13 - 2026-06-13

- Fixed `DocsShell` mobile headers so translated brand labels truncate safely instead of wrapping into the action controls.
- Added `DocsHeaderActionSelect` as the package-owned bounded header select for language and compact docs-shell actions.
- Added browser runtime verification for Russian, German, Hebrew, and Arabic mobile header layouts to catch clipped controls, horizontal overflow, and brand/action overlap before release.
- Updated governance and component rules so responsive localization failures block release instead of being treated as cosmetic defects.

## 3.4.12 - 2026-06-12

- Fixed cosmic and dark-forward preset overrides so mixed light preview cards no longer inherit forced white text, forced dimmed text, or fixed `28px` Paper/Card radius values from the surrounding page.
- Added local contrast CSS ownership for preview-surface buttons, inputs, badges, code, nested cards, foreground text, muted text, backgrounds, borders, and radius tokens.
- Stopped generated phrase translation from mutating interactive controls after React render so buttons, links, labels, selects, and input attributes do not become scrambled or stale.
- Added regression coverage for local contrast surfaces, radius governance, and safe phrase translation boundaries.

## 3.4.9 - 2026-06-12

- Fixed the Theme Lab shipped-lane gallery so light VibeTheme preview cards keep their own dark foreground tokens when the surrounding page is in dark mode.
- Scoped the preset contrast guard away from `[data-gds-local-contrast]` surfaces so intentional mixed-preview cards can own local readable text, controls, and code colors.
- Added release verification coverage for the local contrast marker used by the gallery cards.

## 3.4.8 - 2026-06-12

- Hardened the shared preset stylesheet so VibeTheme surfaces push readable foreground tokens through Mantine text, dimmed text, shell, card, paper, input, table, alert, code, link, and default-button surfaces.
- Fixed dark and dark-forward colorful lanes where nested Mantine components could keep light-mode text colors on dark or saturated backgrounds.
- Added theme-governance verification for preset contrast token coverage so future theme changes cannot silently drop the foreground contract.

## 3.4.7 - 2026-06-07

- Removed English-only route coverage from the official playground so every public route keeps all supported locales available instead of falling back to English.
- Added checked-in generated phrase resources and release verification for route, demo, pattern, and use-case copy that still comes from registry/demo data.
- Localized shared shell/reference labels including navigation section headings and reference link actions, and fixed direct localized URL initialization via `?locale=...`.

## 3.4.6 - 2026-06-07

- Fixed the package-owned theme explorer i18n resolver so incomplete locale resources no longer render mixed-language surfaces by merging partial translations with English fallback copy.
- Added regression coverage proving partial theme-explorer locale resources fall back to one complete language until the locale has full nested copy coverage.
- Aligned package, reference-app, and install metadata to the `3.4.6` patch release line.

## 3.4.5 - 2026-06-07

- Added strict consumer-admin migration enforcement with `approvedAdminPrimitives` and `strict.admin.local-wrapper` detection for product-local admin layout, form, action, card, breadcrumb, media, and field shims.
- Added package-native core exports for primitive/layout, typography role, sanctioned style utility, semantic chart, and icon-tone contracts so strict consumers have installable replacements for common local wrappers.
- Expanded the playground/reference site with Spanish full-copy route coverage and updated release/install guidance for the `3.4.5` package line.

## 3.4.4 - 2026-06-07

- Added the package-native operational telemetry contract with `GdsOperationalEvent`, `GdsEventPayloadPolicy`, `GdsTelemetryAdapter`, `emitGdsEvent`, `createGdsTelemetryAdapter`, event taxonomy, and UX failure reason registry.
- Added non-blocking adapter dispatch with emitted, adapter-unavailable, payload-rejected, sampled-out, sampling-disabled, and dropped states plus bounded retry and timeout behavior for analytics adapters.
- Expanded telemetry tests, API coverage, install guidance, API reference, user guide, and LLD documentation for privacy-safe payload rules, accessibility boundaries, rollback, and operational behavior.

## 3.4.3 - 2026-06-07

- Fixed mobile shell navigation so `DiscoveryShell` opens reliably from the hamburger and closes the mobile menu when a navigation item is selected, with `closeMobileNavigationOnItemSelect` available for rare controlled-menu opt-outs.
- Fixed inline mobile navigation in `DocsShell` and `PublicShell` so documentation and public flow menus collapse back to the hamburger/menu state after link or action activation.
- Added regression coverage for mobile navigation close-on-selection behavior across discovery and public shell contracts.

## 3.4.2 - 2026-06-06

- Moved reference-site localized route labels, app-shell copy, page copy, and theme-explorer copy out of React runtime components into dedicated i18n resource contracts.
- Added public locale metadata helpers in `@sovereignsquad/gds-theme`: `gdsLocaleMetadata`, `getGdsLocaleMetadata(...)`, `isGdsRtlLocale(...)`, and `getGdsLocaleIdsByScript(...)`.
- Updated `GdsProvider` and font-lane coverage to resolve RTL and script support from locale metadata instead of hardcoded language arrays.
- Replaced the locale coverage verifier so CI fails on component-local language dictionaries, `locale === ...` branches, localized route labels, and locale arrays outside approved i18n resource files.

## 3.4.1 - 2026-06-06

- Fixed the public reference site locale experience so the overview route no longer mixes English cards and links into Russian, Italian, Hebrew, Arabic, Hungarian, German, or French full-copy locales.
- Localized the shared site footer and primary navigation labels used by the full-copy routes.
- Added regression coverage to fail when Russian overview renders the English strings `Operational clarity`, `Public trust`, or `Browse patterns`.

## 3.4.0 - 2026-06-06

- Added issue-backed maturity capability contracts for the seven recommended high-value GDS delivery areas: admin delivery, runtime feedback, foundation surfaces, global readiness, adoption governance, theme operations, and product-system delivery.
- Added `getGdsMaturityCapabilities()`, `getGdsRecommendedMaturityCapabilities()`, `getGdsMaturityCapability(...)`, and `getGdsMaturitySummary()` to `@sovereignsquad/gds-core`.
- Added the localized `/maturity` GitHub Pages route so developers and product owners can inspect benefits, package lanes, primary contracts, UX states, accessibility, observability, rollback, testing, and operational behavior in every supported site language.
- Created the 3.4.0 GitHub project-board issue set using the issue #81 production-grade structure.
- Updated API, user-guide, CLI/LLD, install, compatibility, release, and README guidance to the `3.4.0` npm release line.

## 3.3.0 - 2026-06-06

- Added registry-backed `/api` documentation for published GDS package exports, including import paths, runtime lanes, state contracts, accessibility notes, and verification metadata.
- Added `/use-cases` as the product-owner adoption guide for matching product needs to package lanes, primary contracts, risk, accessibility obligations, and operational checks.
- Added `API_REFERENCE.md`, `USER_GUIDE.md`, and `CLI_AND_LLD.md` so GitHub readers can discover the same API, product, CLI, and low-level design contracts without relying only on the GitHub Pages UI.
- Added release gates for API documentation coverage, route localization coverage, package message parity, and native-dialog i18n copy enforcement.
- Fixed project-board audit issue-state pagination so the strict board audit reports all current open project items.

## 3.0.7 - 2026-06-06

- Added package-owned block layout cookbook APIs: `getGdsLayoutTemplates`, `getGdsLayoutTemplate`, and `GdsLayoutTemplatePreview`.
- Replaced the reference-site layout cookbook's app-local raw form controls with the GDS-owned preview component while preserving template selection, JSON editing, diagnostics, copy behavior, and rendered preview states.
- Added `npm run audit:dependencies` to the release gate, upgraded Vitest to `4.1.8`, moved the private Next reference fixture to dev-only scope, and documented the remaining upstream Next/PostCSS dev advisory in `DEPENDENCY_AUDIT.md`.

## 3.0.6 - 2026-06-06

- Added package-native admin CRUD primitives in `@sovereignsquad/gds-admin`: `AdminTextInput`, `AdminTextarea`, `AdminCheckbox`, `AdminSelect`, `AdminFileUpload`, `AdminFormSection`, `AdminFormStatus`, `AdminFormActions`, and `AdminCrudForm`.
- Added hardened admin data/resource surfaces: `AdminDataTable`, `AdminAnalyticsTable`, `AdminModal`, `AdminDetailDrawer`, `AdminReviewLayout`, `AdminResourceManager`, `AdminResourceGrid`, `AdminResourceCard`, `AdminResourceToolbar`, and `AdminResourceEmptyState`.
- Added core interaction/runtime contracts: `GdsConfirmProvider`, `useGdsConfirm`, `GdsToastProvider`, `useGdsToasts`, typed `GdsIcon`, `MediaPreviewCard`, `PublicCaptureFlow`, `PlaybackControls`, and creator theme validation/boundary utilities.
- Expanded `gds-compliance` strict mode to detect direct Mantine imports, direct Tabler imports, raw form controls/buttons, browser dialogs, raw table markup, inline styles, and undeclared local GDS adapters with exception-aware suppression.

## 3.0.5 - 2026-06-02

- Fixed the `cosmic` VibeTheme to behave as a dark-forward runtime lane so the Theme Lab and live preview no longer render washed-out light panels or low-contrast muted text.
- Tightened `cosmic` glass panels, inputs, badges, code blocks, and dimmed text treatment so the high-saturation multicolour background remains vivid while content stays readable.

## 3.0.4 - 2026-06-02

- Added `cosmic` as the first intentionally high-saturation CSS VibeTheme, with a multicolour blue-violet-cyan-magenta background, star-field atmosphere, glass panels, and vivid gradient primary controls.
- Documented `cosmic` as the sanctioned dramatic showcase lane so consumers do not need route-local image backgrounds or private gradient systems for bold launch/public surfaces.

## 3.0.3 - 2026-06-02

- Added package-owned CSS VibeThemes for the colorful preset line so `sunset`, `oceanic`, `forest`, `ruby`, `amber`, `neon-night`, `skyline`, `aurora`, `coral`, `mint`, `orchid`, and `royal` now expose full canvas, shell, surface, border, text, accent, glow, gradient, and hero tokens instead of only changing `primaryColor`.
- Extended `useGdsThemePresetState(...)` to apply `data-gds-theme-preset` plus `--gds-vibe-*` CSS variables on the document root, making whole-site theme switching persistent across direct links and route changes.
- Updated the GitHub Pages Theme Lab with a visual VibeTheme gallery and current-token proof section, and documented the no-image-background/no-local-theme-catalog governance rule.

## 3.0.0 - 2026-05-31

- Delivered the adoption-platform release with hardened install/bootstrap docs, reference-site governance, public feature-request intake, media/upload contracts, reporting/evidence/chart contracts, auth/access identity hardening, strict compliance expansion, and verified reference codemods.
- Added 3.0.0 release-readiness checks covering board scope, implementation evidence, release safety, client communication, and registry verification gates.
- Updated the publish runbook so major releases require strict board audit before and after version bump and may not be announced until npm publication is verified.

## 2.6.7 - 2026-05-31

- Cut and published the `2.6.7` npm release line so the widened docs/reference-shell layout is available through the public package line and not only on repository `main`.
- Updated `DocsPageShell` in `@sovereignsquad/gds-core` to use the full available page width for the official site and other reference/docs surfaces, removing the narrow article cap that was squeezing wide content such as the theme-governance explorer.
- Aligned the public site copy, install guidance, and versioned docs/routes to the `2.6.7` line.

## 2.6.5 - 2026-05-29

- Cut and published the `2.6.5` npm release line so consumers can update to the canonical theme-governance hardening through the public registry instead of relying on unpublished mainline changes.
- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.

## 2.6.4 - 2026-05-28

- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, the shipped public presets, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.
- Added `ReferenceSection`, `ReferenceLinkGrid`, `ReferenceLocaleNotice`, and `ReferenceThemeExplorer` to `@sovereignsquad/gds-core` plus `ReferenceSiteShell` to `@sovereignsquad/gds-admin` so the official website can consume GDS-owned docs/reference primitives instead of site-local Mantine composition.
- Converted `apps/playground` onto the new reference-site primitives, replaced the remaining direct page-level Mantine composition in the public site source, and added a strict `gds-adoption.json` baseline for the website.
- Updated the public route structure, docs copy, and rulebooks so the GitHub Pages site is described as both the official GDS website and a strict live reference consumer rather than a separate playground exception.
- Added the registry-backed GitHub Pages pattern catalog under `/patterns` with dedicated family routes for foundations, public, operations, data, access, and feedback coverage.
- Expanded the public docs site to show live demos for the remaining workflow and responsive-guidance contracts that had previously been represented only as reference notes.
- Hardened the GitHub Pages playground with route-level lazy loading, deterministic vendor chunking, and contained shell previews so the public site behaves like a documentation site instead of a nested application demo.
- Added an interactive `/themes` explorer so adopters can switch among shipped theme presets, test light/dark behavior, inspect the bounded creator-authored theming lane, and compare theme lanes directly on the public site.
- Added a dedicated `/live-demos` hub so the public website separates official docs from runtime showcase sections more clearly.
- Strengthened `@sovereignsquad/gds-compliance` exception enforcement to fail stale exception scopes, uncovered local exception adapters, and incomplete creator-authored experience exception metadata.
- Updated theme governance, exception-surface, compliance, and adoption rulebooks to formalize the creator-authored experience contract and the new repo-to-manifest exception checks.
- Added `SocialAuthButtons` to `@sovereignsquad/gds-core` as the canonical provider-entry cluster for Google, Apple, GitHub, Microsoft, LinkedIn, Discord, X, Facebook, and email-shaped auth lanes.
- Added `ShareButtonGroup` to `@sovereignsquad/gds-core` as the canonical public sharing surface for native share, copy-link, email, message, and social-channel actions.
- Enhanced `AuthShell` to support governed social-auth placement and divider rhythm instead of consumer-local auth-provider layouts.
- Published the umbrella install path `@sovereignsquad/gds` as the preferred public npm entrypoint while keeping the granular runtime packages available for stricter dependency boundaries.
- Aligned release automation and public documentation so npm publication, GitHub Pages guidance, and release-bundle fallback distribution target the same live release line.

## 2.6.3 - 2026-05-27

- Added `showGdsNotification(...)` to `@sovereignsquad/gds-theme/client` as the canonical semantic notification helper for consumers already governed by the shared provider stack.
- Enhanced `AuthShell` with `headerActions` so products can place theme toggles or other small auth-entry controls without rebuilding the shell locally.
- Enhanced `PageHeader` to accept `subtitle` as an alias for `description`, reducing consumer-only adapter code.
- Hardened `SemanticButton` to use the label-first prerender path by default, removing the need for client repos to carry their own hydration-safe semantic-button wrappers.

## 2.6.2 - 2026-05-27

- Expanded shared Mantine peer support to include `^9.0.0` across the runtime packages and verified fresh packed-consumer installs against Mantine `9.2.1`, React `19.2.0`, and Next `15.5.18`.
- Added `npm run verify:mantine` as the canonical compatibility command and broadened the smoke harness to cover both Mantine `8.3.6` and `9.2.1` in isolated clean installs.
- Added root optional native bindings for supported macOS and Linux x64 environments so fresh local `npm install` runs provision the Vite/tsup native layer more reliably.
- Updated README, compatibility guidance, migration guidance, release runbook, and consumer-install proof docs to reflect the Mantine 9 support line and the current temporary release-asset install path.
- Added `ChoiceChip` to `@sovereignsquad/gds-core` as the canonical neutral chip for lightweight filter, scope, taxonomy, and mode selection without page-local badge wrappers.
- Added `getSemanticActionLabel(...)` to `@sovereignsquad/gds-core` as a server-safe semantic-label helper for SSR/static fallback rendering without exposing raw vocabulary access as the only consumer path.
- Recorded the current Narimato reference-consumer audit and updated the Narimato project note to reflect direct npm package consumption plus its intentionally local exceptions.

## 2.6.1 - 2026-05-26

- Renamed the public package line from the unpublished placeholder `@gds/*` scope to the real npm organization scope `@sovereignsquad/gds-*`.
- Updated package metadata, workspace wiring, reference consumers, compliance manifests, docs, and release scripts to consume the `@sovereignsquad/gds-*` package family consistently.
- Fixed release-environment dependency gaps (`@floating-ui/core`, `@humanfs/core`, and `@babel/core`) so local and CI release verification run cleanly on the current toolchain.
- Updated the packed Mantine 8 compatibility harness to install the renamed tarballs correctly and verified the `@sovereignsquad/gds-*` line against Mantine `8.3.6`, React `19.2.0`, and Next `15.5.18`.
- Clarified npm as the canonical future registry source and documented public GitHub release assets as the approved temporary install path while npm publication remains unavailable.
- Added `npm run pack:release`, release-bundle checksums/manifests, and the `GDS Release Bundles` GitHub Actions workflow.
- Added `VERIFIED_CONSUMER_INSTALL_PROOF.md` to make the current Next 15 / React 19 / Mantine 8 install evidence explicit for adopter teams.

## 2.6.0 - 2026-05-26

- Added `SectionPanel` and `ConsumerDashboardGrid` to `@sovereignsquad/gds-core` as the canonical operational panel rhythm and consumer dashboard layout scaffolds.
- Hardened shared operational contracts in `@sovereignsquad/gds-admin`: `AppShell` now supports primary/secondary/account navigation regions and header context, `PageHeader` now supports subtitle/status/overflow actions, `ResponsiveDataView` now supports active filter chips plus mobile filter surfaces, and `EditorScaffold` / `ContentOpsEditor` now support context and sticky footer action regions.
- Enhanced `@sovereignsquad/gds-core` `BrowseSurface`, `EditorialCard`, `FilterDrawer`, and `MediaField` to reduce remaining local public/gds-admin overrides.
- Added `createPublicBrandTheme()` to `@sovereignsquad/gds-theme` and formalized the branded public theme merge path.
- Widened shared Mantine peer ranges to include `8.3.x` and added `npm run verify:mantine8` as a packed-consumer compatibility smoke for Mantine 8.3.6 + React 19.2.0 + Next 15.5.18.
- Documented the canonical searchable-selection decision: use governed Mantine recipe composition rather than a new shared wrapper until a stronger repeated contract emerges.

## 2.5.1 - 2026-05-25

- Expanded `@sovereignsquad/gds-compliance` with configurable banned imports plus default stale-SSOT reference detection so consumer repos can catch lingering legacy UI dependencies and outdated documentation paths through shared tooling.
- Added [COMPLIANCE_TOOLKIT.md](COMPLIANCE_TOOLKIT.md) as the canonical CI and local enforcement contract for `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance`.
- Updated template and adoption artifacts to use the canonical repository path and the current machine-readable manifest contract.

## 2.5.0 - 2026-05-25

- Added new cross-project public and consumer contracts in `@sovereignsquad/gds-core`: `BrowseSurface`, `EditorialCard`, `ConsumerSection`, and `MediaField`.
- Added new content-operations contracts in `@sovereignsquad/gds-admin`: `ContentOpsEditor`, `ContentOpsSection`, and `ContentOpsActionBar`.
- Added `gdsEditorialPublicTheme` to `@sovereignsquad/gds-theme` as the approved serif-forward, flatter editorial preset.
- Added `ADOPTION_AND_MIGRATION_PLAYBOOK.md` plus manifest-driven compliance settings for documentation paths, stale-reference detection, and protected surface declarations.
- Updated the Next.js and Vite reference consumers plus shared component tests to exercise the new browse, consumer, media, and content-operations contracts.

## 2.4.4 - 2026-05-25

- Enhanced `PublicShell` with canonical header variants, class-name hooks, and server-safe mobile navigation modes so public consumers can stop shipping repo-local spacing and nav overrides.
- Enhanced `PublicBrandFooter` with documented layout variants and slot-level class hooks for narrative, media, quote, and legal regions.
- Enhanced `PublicProductCard` with localized state-label overrides plus pickup and inventory helper-note support for menu, discovery, and retail-like public surfaces.
- Updated the Vite and Next.js reference consumers plus shared component tests to exercise the new public-surface contracts end to end.

## 2.4.3 - 2026-05-25

- Added `AccentPanel` as the canonical light/dark-safe accent surface contract for public and operator-facing emphasis panels.
- Added `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` to `@sovereignsquad/gds-core` for shared public/editorial composition without repo-local layout authority.
- Hardened release verification with export-contract checks that fail on missing published export targets or server entrypoints that drift into client-only modules.
- Updated the Next.js and Vite reference consumers to exercise the new public/editorial primitives and the server-safe import path.
- Added an authenticated publish runbook and shared `publish:dry-run` / `publish:npm` scripts for the five public GDS packages.
- Added `verify:published` plus a manual GitHub Actions publish workflow so authenticated CI can publish and verify registry availability with bounded retry behavior.

## 2.4.2 - 2026-05-25

- Added `@sovereignsquad/gds-core` `PublicProductCard` for media-first public menu, catalog, and offer surfaces with price/state/action hierarchy.
- Added `es` locale support plus canonical `GdsLocale` and `getGdsMessages(locale)` exports for host-i18n bridges.
- Extended shared lint/gds-compliance tooling to support manifest-driven approved dependency/import exceptions such as `lucide-react`.
- Updated compatibility, governance, and Pesti Est adoption docs for registry-first CI usage and locale/exception guidance.

## 2.4.1 - 2026-05-25

- Added `@sovereignsquad/gds-core` `AccessRecoveryPanel` as the canonical protected-content, expired-session, and recoverable failure surface.
- Updated component contracts to treat access recovery as a first-class shared pattern family.
- Resolved the learner-shell evaluation by documenting that LMS learner shells remain local adapters until broader portfolio reuse is proven.
- Updated Amanoba guidance to consume shared access recovery now while keeping learner shell, course cards, and gamification list cards local for now.

## 2.3.2 - 2026-05-25

- Added `@sovereignsquad/gds-core` `GameBoardTile` for memory-match and flip/select game boards (reduced-motion aware).
- Added `docs/AMANOBA_BLOCKING_CONTRACTS.md` scaffolds for remaining Amanoba-only surfaces (LearnerAppShell, course cards, recovery panel).
- Refreshed `GDS_GAP_INVENTORY.md` §2B to reflect 2.3.0–2.3.1 shipped package surfaces.
- Added Amanoba dark-shell + yellow CTA `extendGdsTheme` recipe appendix to `THEME_GOVERNANCE.md`.

## 2.4.0 - 2026-05-25

- Added `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` as machine-readable compatibility and adoption contracts.
- Added `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance` to provide shared lint and compliance enforcement for adopting repositories.
- Added new public composition primitives in `@sovereignsquad/gds-core`: `PublicNav`, `PublicSiteFooter`, `DocsPageShell`, `DocsCodeBlock`, `CtaButtonGroup`, `PlaceholderPanel`, `SimpleDataTable`, and `StatsSection`.
- Expanded `@sovereignsquad/gds-theme` with `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, and root-provider theme/default color-scheme overrides.
- Added reference consumer fixtures under `apps/reference-vite` and `apps/reference-next`, plus `npm run verify:references` for fixture and manifest validation.
- Added `DEPRECATIONS_AND_MIGRATIONS.md` to formalize contract retirement, migration guidance, and release handover expectations.

## 2.3.1 - 2026-05-25

- Changed `@sovereignsquad/gds-core` `PageHeader` eyebrow styling to a neutral default, removing forced uppercase and decorative tracking from the canonical contract.
- Added opt-in `eyebrowVariant="ornamental"` for products that explicitly want decorative eyebrow styling.
- Removed forced hover motion and transform transitions from the canonical `@sovereignsquad/gds-theme` base theme.
- Added `withGdsMotion()` as an explicit opt-in theme helper for products that want shared motion styling.
- Expanded `COMPATIBILITY_AND_RELEASES.md` with an explicit Next.js App Router consumer path for `server` and `client` package entrypoints.

## 2.3.0 - 2026-05-24

- Added publish-ready package metadata and explicit `client` / `server` subpath exports for `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`.
- Added `COMPATIBILITY_AND_RELEASES.md` to define the active Mantine/React/Next consumption contract, install guidance, and version-alignment rules.
- Added new shared package primitives and scaffolds for `MetricCard`, `ProgressCard`, `ProductCard`, `StateBlock`, `DataToolbar`, `PublicShell`, `AuthShell`, `ArticleShell`, `UploadDropzone`, `MediaCard`, `AccessSummary`, `ResponsiveDataView`, `WorkspaceHeader`, and `EditorScaffold`.
- Expanded admin primitives to support mobile footer navigation, richer page-header action slots, and shared empty-state handling in tables.
- Added release-alignment verification via `npm run verify:release` and a shared pull-request checklist template.
- Added `THEME_GOVERNANCE.md` and `EXCEPTION_SURFACES.md` to cover provider-brand, white-label, tenant-theme, chart, map, embed, and other approved exception surfaces.
- Added portfolio onboarding plans for Impact, Camera, and Pesti Est plus matrix rows reflecting their current GDS adoption pressure.

## 2.2.2 - 2026-05-24

- Updated `@sovereignsquad/gds-theme` `GdsProvider` to include Mantine modals and notifications so the shared provider matches the documented root composition contract.
- Added shared package i18n coverage for theme-toggle labels, empty-data messaging, and semantic error feedback.
- Added a shared Vitest + jsdom test harness plus behavior coverage for `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`.
- Added root test commands and pull-request quality gates for build, lint, and tests.

## 2.2.1 - 2026-05-23

- Added `PROJECTS/NARIMATO.md` for Narimato (Mantine-rooted, enforcement phase).
- Updated `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` Narimato row from discovery to enforcement.
- Fixed `@sovereignsquad/gds-core` `ConfirmDialog` confirm button color: `brand` → `violet` (valid Mantine palette).

## 2.2.0 - 2026-05-23

- Added `SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md` to define the GDS as a reliable, cross-project service with authority, pattern, adoption, validation, portfolio, and lifecycle layers.
- Added `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` to classify projects by foundation signals, migration archetypes, risk, and recommended next actions.
- Added `PROJECTS/MESSMASS_MANTINE_REFACTOR.md` to address the highest known authority-conflict project in the portfolio.
- Expanded `PATTERN_SERVICE_MODEL.md` with required service outputs, contract maturity states, compatibility promises, and portfolio usage guidance.
- Expanded `GOVERNANCE_AND_ADOPTION.md` with authority-conflict handling, adapter-inventory checks, portfolio operations, and normalized remediation categories.

## 2.1.0 - 2026-05-23

- Added `PATTERN_SERVICE_MODEL.md` as the cross-project operating model for borrowing Mantine UI ideas and promoting them into governed GDS contracts.
- Defined mandatory reusable pattern families for shells, page headers, product cards, metrics, data toolbars, responsive data views, auth shells, article/docs shells, and state blocks.
- Added cross-project recommendations for Amanoba, KIDEX, ClassScout, and SSO so each project has a concrete Mantine-only pattern-service implementation path.
- Updated foundation, component, governance, and README guidance to prohibit page-local reinvention of reusable patterns and to require local adapter paths for shared contracts.

## 2.0.0 - 2026-05-22

- **Massive Consolidation & Hardening:** Refactored the sprawling 17-file structure into 3 hardened, professional rulebooks (`FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, and `GOVERNANCE_AND_ADOPTION.md`).
- Eliminated all outdated, duplicated, and inconsistent language.
- Enforced a strictly professional, prescriptive tone for all Mantine, UX, and Token boundaries.

## 1.3.3 - 2026-05-22

- Added the normative color-mode and readability contract for dark mode, light mode, contrast, mixed-mode exceptions, and Mantine theme responsibilities.
- Updated foundation and runtime guidance to make human readability and active-mode consistency release gates.

## 1.3.2 - 2026-05-21

- Updated the Amanoba migration plan from planned to in-progress.
- Recorded completed Amanoba Phase 0/1 runtime work, active Mantine guardrails, and the current course-surface migration snapshot.
- Added remaining Amanoba high-priority gaps for lesson runtime, quiz runtime, final exam, auth, dashboard, saved lessons, practice hub, admin/editor forms, and deletion-phase legacy dependencies.

## 1.3.1 - 2026-05-21

- Updated the SSO migration plan to mark admin-shell migration and legacy theme-stack removal as completed.
- Clarified the SSO path toward the remaining docs/editorial migration and final deletion pass.

## 1.3.0 - 2026-05-21

- Added a primitive policy matrix for direct-versus-wrapper decisions.
- Added implementation tables for variants, sizes, breakpoints, shell switches, and responsive behavior.
- Added enforcement guidance for lint rules, import boundaries, and drift checks.
- Added reusable starter templates for providers, theme, shell, page header, and button wrappers.
- Updated runtime, readiness, and README guidance to point directly to the new implementation assets.

## 1.2.3 - 2026-05-21

- Promoted implementation-readiness checks into the required reading order.

## 1.2.2 - 2026-05-21

- Added root provider/gds-theme implementation notes to the required project-adoption contract.

## 1.2.1 - 2026-05-21

- Added component contracts for date/time inputs, file uploads, loaders/skeletons, tooltips, breadcrumbs, and pagination.
- Expanded migration deliverables with provider/gds-theme implementation notes plus validation and deletion checklist expectations.

## 1.2.0 - 2026-05-21

- Tightened the SSOT from “Mantine preferred/first” language to an explicit Mantine-only product primitive policy.
- Clarified that no new product UI may bypass Mantine with ad hoc primitives or alternate component frameworks.
- Updated migration, governance, adoption, and KIDEX adapter language to reflect the stricter policy.
- Added `MANTINE_RUNTIME.md` to define provider, theme, notifications, modals, wrapper, CSS, form, overlay, and data-display runtime requirements.

## 1.1.0 - 2026-05-21

- Expanded the SSOT into a stricter multi-project policy repository.
- Added Mantine platform policy and navigation/responsive rules to the required reading order.
- Tightened component, foundation, UX, governance, and project-adoption contracts for cross-project enforcement.
- Clarified that product repositories may document only adapters, exceptions, migration state, and validation commands.
- Added repository hygiene rules for shared Git usage across consuming projects.
- Added implementation-readiness requirements so projects document root provider, theme ownership, primitive policy, legacy boundaries, responsive strategy, and drift controls before the first Mantine PR.
- Expanded the SSO project plan with local-adapter requirements, phase exit criteria, validation commands, and initial implementation sequence.

## 1.0.0 - 2026-05-21

- Established `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` as the cross-project design, UI, and UX SSOT.
- Added normative foundation rules for theme ownership, tokens, layout, accessibility, responsiveness, and internationalization.
- Added strict component contracts for buttons, icon buttons, inputs, forms, cards, modals, drawers, tables, navigation, alerts, notifications, empty states, loaders, errors, and pagination.
- Added UX rules for app shells, dashboards, learner flows, admin/editor flows, destructive actions, authentication, search, filters, responsive behavior, and content tone.
- Added governance rules for adoption, project adapters, exceptions, review, migration order, and definition of done.
- Added the project adoption contract that each project must reference in its local documentation.
- Added a true-refactor Mantine migration playbook for legacy projects.
- Added project-specific migration planning under `PROJECTS/`, including the initial SSO refactor plan.
- Added contributing guidance for operating this directory as a shared standalone git repository.
