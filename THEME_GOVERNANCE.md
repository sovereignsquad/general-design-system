# Theme Governance

Status: Active SSOT
Version: 6.0.0
Last updated: 2026-08-09

This document defines the approved adopter-facing theme lanes for products that need branding without creating a second design authority.

## Base rule

- `gdsTheme` is the only shared token authority. Its **default semantic-role token layer** (`--gds-bg-*`, `--gds-text-*`, `--gds-border-card`, `--gds-text-on-inverse`) is defined at `:root` in `styles.css` so every surface resolves one governed value instead of a per-call-site fallback — see [`docs/SEMANTIC_ROLE_TOKENS.md`](docs/SEMANTIC_ROLE_TOKENS.md) for the values, the per-token-pair WCAG AA contrast contract (policed by `verify:token-contrast-scoring`), and the preset/brand override precedence.
- Adopters must use one of the approved theme lanes:
  - `gdsTheme`
  - `gdsDarkPublicTheme`
  - `gdsFlatSurfaceTheme`
  - `gdsEditorialPublicTheme`
  - `createPublicBrandTheme(...)`
- Products may not fork the shared theme into a permanent parallel token system.
- Public and operator accent surfaces must resolve from shared semantic contracts such as `AccentPanel`, not product-local `light-dark(...)` patches or raw `*.0` shade assumptions.
- `extendGdsTheme(...)` is no longer a canonical adopter path. It remains temporarily exported only for bounded internal/runtime composition inside GDS-controlled implementation.

## Allowed extension surfaces

- primary color and semantic brand palette
- typography family where product identity or locale coverage requires it
- shell defaults for dark or light products
- component default props when they remain compatible with shared interaction meaning
- narrow `theme.other` tokens for non-Mantine rendering surfaces such as email, OG images, or certificates

## Not allowed

- changing shared interaction meaning through theme overrides
- declaring a second token layer as the real authority while `gdsTheme` remains nominal
- product-specific page styling that bypasses the theme for repeated surfaces

## White-label and tenant theming

White-label or tenant theming is allowed only when:

- the base product still resolves from `gdsTheme`
- tenant overrides remain scoped to documented brand surfaces
- contrast, readability, and focus states still meet the shared baseline
- switching tenants does not introduce a second runtime provider authority

## Identity provider branding policy

Identity providers are part of the same governance envelope as theme authority. Adopters that render social auth must use `SocialAuthButtons` and pass providers from the approved policy list in `gds-adoption.json`.

- approved providers are declared under `compliance.identityProviderBranding.approvedProviders`
- forbidden customizations are declared under `compliance.identityProviderBranding.forbiddenCustomizations`
- allowed visual variants are declared under `compliance.identityProviderBranding.allowedVariants`
- minimum accessible touch target is declared under `compliance.identityProviderBranding.minTouchTargetPx`
- color authority is declared under `compliance.identityProviderBranding.colorAuthority`

Allowed policy:

- keep visual identity within policy-approved SocialAuth behavior
- never implement local third-party-branded auth controls that bypass GDS action semantics
- do not mutate provider icon/mark, loading, disabled, or label mechanics via per-product wrappers unless approved in policy
- use `getSupportedProviderIdentityIds()` and `getProviderIdentityPolicy(provider)` when a consumer needs runtime audit or logging metadata
- represent tenant-disabled and provider-error states through the shipped provider props, not local disabled button wrappers

Recommended model:

1. start from the closest shipped lane
2. use `createPublicBrandTheme(...)` when a branded public product needs governed overrides
3. apply tenant-level overrides only on documented brand surfaces and only through the approved lane

For public/editorial products that want one sanctioned entrypoint instead of ad hoc merging, use `createPublicBrandTheme({ editorialSerif, flatSurfaces, overrides })` from `@sovereignsquad/gds-theme`.

## Creator-authored experience theming

Some products need a bounded creator-, editor-, or customer-authored visual canvas. GDS allows this only as a narrow experience override lane, never as a second app-wide theme authority.

Ownership boundary:

- GDS owns app chrome, navigation, shells, shared controls, consent surfaces, legal rows, recovery states, and system messaging.
- The adopting product owns storage, moderation, sanitization, and publish flow for creator-authored presentation data.
- Creator-authored overrides may own only the approved experience canvas.

Allowed override modes:

- scoped class hooks on a bounded canvas root
- scoped CSS injected after base experience styles
- creator-authored media, colors, and decorative presentation inside the approved canvas

Not allowed:

- replacing `PublicShell`, `PublicNav`, `DocsPageShell`, or other GDS-owned chrome
- hiding required consent, legal, or recovery controls
- redefining shared action semantics, focus handling, or system state meaning
- unbounded CSS that leaks into the surrounding page
- treating creator CSS as a second theme authority for the full product

Required render order:

1. render GDS shell and system-owned controls
2. render the approved creator canvas
3. apply creator-scoped overrides after base experience styles only inside that canvas
4. fall back safely to the base GDS presentation if overrides are missing or invalid

Required documentation path:

- declare the exception in `gds-adoption.json` with category `product-authored-experience`
- keep `scope` narrow to the actual canvas files
- include `a11yRequirements`, `testingRequirements`, and `observabilityRequirements`
- describe what shared controls must remain governed outside the canvas

Recommended implementation shape:

```ts
type ExperienceThemeOverrideMode = 'none' | 'css-class' | 'scoped-css';

type ExperienceOverrideContract = {
  mode: ExperienceThemeOverrideMode;
  scopeId: string;
  renderOrder: 'after-base-experience-styles';
  mayOverride: string[];
  mustNotOverride: string[];
};
```

This is a governance contract first. Products still own storage and moderation, but they may not use that as justification for replacing GDS-owned application structure.

## Dark-mode rule

- a product may default to dark when that is part of its deliberate shell identity
- dark products must still provide readable tokens for text, paper, card, alert, table, and link surfaces
- mixed-mode islands remain exceptions, not the default layout strategy
- preset styles must set `--mantine-color-text` and `--mantine-color-dimmed` from `--gds-vibe-text` and `--gds-vibe-muted` on body, shell, card, and paper surfaces so nested Mantine components cannot keep stale light-mode foregrounds on dark backgrounds
- dark and dark-forward VibeTheme controls must use `--gds-vibe-control` and `--gds-vibe-control-text` for inputs, default buttons, and code-like surfaces rather than assuming the base Mantine default variant remains readable
- mixed-preview surfaces, such as the Theme Lab shipped-lane gallery and VibeTheme contract preview, must use `data-gds-local-contrast` plus local `--gds-vibe-*`, Mantine foreground variables, local control tokens, and a local radius token when they intentionally render a light preview card inside a dark page

## Theme trust hardening

Owned contrast is a first-class contract. A surface that intentionally renders with a different readability envelope than the surrounding page must not rely on ambient page colors or ad hoc route-local `Paper` styling.

Required split of responsibilities:

- `BoundedPreviewSurface` owns preview isolation. It prevents nested shell demos from escaping their frame and painting over the page.
- `getGdsOwnedContrastProps(...)` owns mixed-surface readability. It marks the surface with `data-gds-owned-contrast` and `data-gds-local-contrast`, then applies the package-owned `--gds-local-background`, `--gds-local-radius`, `--gds-vibe-*`, and control-text tokens.
- These are separate contracts. Preview isolation does not replace owned contrast, and owned contrast does not replace preview isolation.

Required runtime behavior:

- any GDS-controlled route that renders a live shell inside documentation must use `BoundedPreviewSurface`
- any GDS-controlled route that renders a light card inside a dark shell, a dark control cluster inside a light shell, or any other mixed readability island must use `getGdsOwnedContrastProps(...)`
- consumers may not declare `data-gds-owned-contrast` or `data-gds-local-contrast` directly in product-local route code
- package-owned controlled surfaces must keep local control tokens for buttons, inputs, selects, code blocks, badges, labels, and dimmed copy

Release blocking policy:

- `npm run verify:theme-trust-runtime` is mandatory for release verification
- `npm run verify:forced-colors-runtime` is mandatory for release verification
- source-level owned-contrast compliance must fail if route code declares owned-contrast markers directly instead of using the package helper
- if a route-level preview or mixed-theme surface fails owned contrast or preview isolation, rollback to the previous stable release line and keep the board item open
- exceptions require a documented package-owned helper or primitive, never a route-local style patch

Forced-colors contract:

- `@media (forced-colors: active)` must replace decorative gradients with system-backed canvas/control colors
- controls must resolve from `ButtonFace` / `ButtonText`
- disabled states must resolve from `GrayText`
- selected/active states must resolve from `Highlight` / `HighlightText`
- focus indicators must stay visibly outlined in forced-colors mode
- this contract binds **every** theme lane, including the expressive vibe/brand presets (`cosmic`, `neon-night`, …) whose `!important` gradients must not out-specify the forced-colors reset; a specificity backstop in `styles.css` guarantees this
- runtime acceptance requires the browser-level `verify:forced-colors-runtime` gate, not only static CSS review — which now sweeps the new-component pattern routes across 8 presets (including the vibe lanes) so a gradient-leak regression in any lane is caught

## Appendix: Amanoba dark shell + yellow CTA

Amanoba is a dark-default LMS/game product. Recommended recipe:

```ts
import { createPublicBrandTheme } from '@sovereignsquad/gds-theme/client';

export const amanobaMantineTheme = createPublicBrandTheme({
  flatSurfaces: true,
  overrides: {
    primaryColor: 'amanoba',
    colors: {
      amanoba: [/gds-* yellow scale */],
      amanobaYellow: [/gds-* alias scale */],
      ink: [/gds-* dark grey scale */],
    },
    other: {
      brand: { /gds-* email/OG/chart tokens */ },
      email: { /gds-* transactional email palette */ },
    },
    components: {
      Text: { defaultProps: { c: 'gray.2' } },
      Card: { defaultProps: { bg: 'ink.8', withBorder: true } },
      /gds-* form + modal dark surfaces */
    },
  },
});
```

Rules:

- use `@sovereignsquad/gds-theme/client` in client providers; use `@sovereignsquad/gds-theme/server` only for SSR-safe theme data
- do not call `withGdsMotion()` unless product marketing explicitly wants shared hover motion
- keep provider-branded OAuth colors in documented exception surfaces, not in `primaryColor`

## Approved preset modes

- `high-contrast` (`resolveGdsThemePreset('high-contrast')`) is the approved **accessibility** lane: a maximal-contrast, flat, undecorated preset with pure black/white surfaces, WCAG AAA body and meta text in both schemes, solid borders, near-black filled controls, and no decorative gradients. It is a first-class selectable preset (issue #453) — distinct from OS-driven `forced-colors` support, which GDS also honors — for products or users that want a deliberately high-contrast shell. Verified by `verify:token-contrast-scoring` and `verify:theme-accessibility`.
- `colorblind-safe` (`resolveGdsThemePreset('colorblind-safe')`) is the approved **accessibility** lane whose brand palette is drawn from the Okabe-Ito colorblind-safe qualitative set (blue `#0072b2` / vermillion `#d55e00`) so categorical/brand color stays distinguishable across deuteranopia, protanopia, and tritanopia (issue #453). It complements — it does not replace — GDS's standing rule that state is never signalled by hue alone (semantic components carry a label + icon per WCAG 1.4.1), which is what keeps success/danger distinguishable under every preset.
- `gdsDarkPublicTheme` is the approved preset for products that deliberately default to a dark public shell.
- `gdsFlatSurfaceTheme` is the approved preset for products that need flatter operational surfaces without creating a second token authority.
- `gdsEditorialPublicTheme` is the approved preset for public/editorial products that need serif-forward storytelling and flatter public surfaces without creating a private token branch.
- `createPublicBrandTheme()` is the approved composition helper for branded public products that need to layer serif headings, flat surfaces, and product-local token overrides in one governed merge path.
- `extendGdsTheme()` is deprecated for consumer use and should not appear in adopter docs, templates, or theme ownership files.
- the live token/theme lab at `https://sovereignsquad.github.io/general-design-system/themes` is the public reference surface for testing these shipped preset lanes interactively
- `withGdsMotion()` remains opt-in only. Shared motion is not part of the canonical base theme.
- `AccentPanel` is the approved cross-mode accent-surface primitive. If a product needs emphasis or rollout surfaces, start there before inventing page-local color-mode handling.

## Z-index / stacking layers

GDS does not publish a second, competing z-index scale. `@mantine/core/styles.css` (loaded via the mandatory `@sovereignsquad/gds-theme/styles.css` import) already ships a documented CSS variable scale — `--mantine-z-index-app` (100), `--mantine-z-index-modal` (200), `--mantine-z-index-popover` (300), `--mantine-z-index-overlay` (400), `--mantine-z-index-max` (9999) — and GDS defers to it as the single stacking authority rather than inventing a parallel one that could drift out of sync.

`gdsZIndexToken` (`@sovereignsquad/gds-theme`) exposes this scale by documented, typed tier name (`app`, `modal`, `popover`, `overlay`, `max`) so GDS's own components and consumers don't need to know Mantine's internal variable names. Any GDS component that renders fixed/sticky page-level chrome outside a Mantine overlay primitive (e.g. `BottomTabBar`, `FloatingActionPlacement`) must use `gdsZIndexToken.app` rather than an ad hoc number — this was a real, unpublished gap (see `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md` P0 item 3) where two such components independently hardcoded different arbitrary values (200 and 20) with no shared authority. Consumers building custom overlays outside GDS's own component set should align with the same scale instead of guessing a number.

## Elevation

FOUNDATION.md's "no decorative shadow layering" policy governs cards and surfaces, not overlays — FOUNDATION.md explicitly says "Overlays may use elevation." Previously this had no published contract at all (issue #395): `gdsTheme.components.Popover.defaultProps.shadow` is now explicitly set to `'md'` (`shadows.md`'s already-established, deliberate soft-shadow value), giving Popover and everything built on top of it — Menu, HoverCard, and Select/Combobox/MultiSelect/Autocomplete dropdowns, none of which set their own `shadow` prop internally — a documented elevation tier instead of an undocumented Mantine default. `shadows.sm` is deliberately left untouched: `Card`'s own `shadow: 'sm'` default already depends on it, and changing it would be a real visual regression for every card in the system. Mantine's `Modal` does not expose a theme-configurable `shadow` prop at all, so its elevation remains Mantine's own fixed, non-GDS-owned styling.

## Density

`GdsDensityProvider`/`useGdsDensity` (`@sovereignsquad/gds-core`) publish a global density-mode axis (`compact`/`comfortable`/`spacious`) that a product can set once at the app or section level, rather than relying only on each component's own scattered local density prop (`AdvancedDataTable`'s density state, `CardContracts`'s `density` prop). This is new and purely additive: existing components' own defaults and props are unchanged. New density-aware call sites should read `useGdsDensity()` (or use `useGdsCardContract()`, the density-aware wrapper around `resolveGdsCardContract`) as the extension pattern, falling back to the ambient value only when no explicit `density` prop is passed — an explicit prop always wins.

## CSS VibeThemes

GDS must provide expressive color lanes for real products. Light mode and dark mode are scheme choices, not the full theme offering. A VibeTheme is a package-owned visual contract that combines a Mantine theme preset with CSS variables for canvas, shell, surface, border, text, muted text, primary, accent, glow, gradient, and hero treatments.

Approved colorful preset ids:

- `sunset` - warm orange product energy
- `oceanic` - cool cyan-blue product clarity
- `forest` - grounded green product trust
- `ruby` - bold red high-attention product surfaces
- `amber` - golden operational warmth
- `neon-night` - dark-forward lime campaign surfaces
- `skyline` - indigo technology surfaces
- `aurora` - teal-cyan optimistic app surfaces
- `coral` - expressive creator, commerce, and social surfaces
- `mint` - clean growth, health, and learning surfaces
- `orchid` - grape editorial and premium surfaces
- `royal` - confident violet SaaS and professional surfaces
- `cosmic` - highly saturated blue-violet-cyan-magenta launch and showcase surfaces

Usage rule:

```ts
import {
  getGdsVibeThemes,
  resolveGdsThemePreset,
  resolveGdsVibeTheme,
  useGdsThemePresetState,
} from '@sovereignsquad/gds-theme/client';

const theme = resolveGdsThemePreset('coral');
const vibe = resolveGdsVibeTheme('coral');
const availableVibes = getGdsVibeThemes();

const { selection, setPreset, setScheme, setFontLane, reset } = useGdsThemePresetState();
```

Runtime rule:

- `useGdsThemePresetState(...)` must set `data-gds-theme-preset`, `data-gds-theme-runtime`, `data-gds-font-lane`, `data-mantine-color-scheme`, and the `--gds-vibe-*` CSS variables on the document root.
- `useGdsThemePresetState(...)` also loads the active font lane's web font: the default `'inter'` lane is loaded statically by `packages/gds-theme/styles.css`; every other lane is loaded on demand via a single non-blocking `<link id="gds-font-lane-stylesheet">`, added/swapped/removed as the lane changes (issue 529). The package stylesheet must never statically `@import` more than the default lane's font — that duplicates each lane's own governed `cssImportUrl` (font-lanes.ts) by hand and defeats every lane's declared `loadStrategy: 'non-blocking-stylesheet'`.
- The official site must use the selected VibeTheme across the whole shell, not only inside the Theme Lab card.
- VibeTheme visuals must be CSS-only: gradients, color-mix, surface variables, and component tokens are allowed; pixel/image backgrounds are not the default theme mechanism.
- `cosmic` is the sanctioned high-saturation reference lane. If teams need a dramatic multicolour app vibe, start from `cosmic` instead of building route-local image or gradient systems.

Do not create a product-local theme catalog to achieve colorful branding. If a color lane is missing, add it to the GDS preset registry and VibeTheme registry, document the intended product use, add live Theme Lab coverage, and verify the lane through package tests.

Avoid:

- route-local theme state that resets on navigation
- hardcoded app-only gradients outside the GDS VibeTheme registry
- using image backgrounds as the theme identity
- changing only `primaryColor` while leaving shell, controls, cards, nav, focus, and page canvas visually neutral
- consumer-owned `createTheme(...)`, `mergeMantineTheme(...)`, or `extendGdsTheme(...)` theme catalogs

## Importing an externally-produced design (issue #535)

A theme lane's source material — a Figma file, a screenshot, an AI design
tool's output (Claude Design or otherwise), a brand guideline PDF — is
allowed to originate outside this repository. What that source material is
allowed to become is not: it must be re-derived into the same governed
`GdsVibeTheme`/brand-token contract every other lane uses, never consumed
directly as CSS, an image, or a copy-pasted color value.

This is the same one-directional principle [`docs/FIGMA_UI_KIT.md`](docs/FIGMA_UI_KIT.md)
already states for the opposite direction — "the code tokens and component
contracts are authoritative... never the reverse" — and the same
"borrowing" discipline [`PATTERN_SERVICE_MODEL.md`](PATTERN_SERVICE_MODEL.md)
already requires when studying an external reference: "study the shape,
rebuild as a governed contract" — not "copy the external artifact as
product styling authority."

Required process for any externally-sourced design:

1. **Extract intent, not values.** Identify the palette (primary, accent,
   any secondary hues), the light/dark surface treatment, and the overall
   feel (flat/brand-serious vs. expressive/gradient-forward). Do not lift a
   hex value straight from a screenshot or a Figma variable and drop it
   into a token file unverified — every value that ships must be
   deliberately chosen for both schemes, not "whatever the source file
   happened to show in whichever mode it was captured in."
2. **Map into the full `GdsVibeTheme` field list** (`packages/gds-theme/src/vibe-themes.ts`)
   — every light/dark pair, not just the ones the source material made
   obvious. A source design that only shows one color scheme does not
   excuse skipping the other; the missing scheme must be deliberately
   designed and contrast-checked, not derived by an unverified brightness
   flip. This is not a hypothetical risk — issues #533/#534 were exactly
   this failure mode (a dark-mode value silently inherited from a
   light-mode source instead of being independently designed), shipped to
   production before being caught.
3. **Verify every pairing the new lane produces** against WCAG AA (4.5:1
   normal text, 3:1 large text/UI components) in both schemes, from real
   computed styles on the live pattern catalog — not visual impression of
   the source material.
4. **Register and verify exactly like any other lane** — add it to the
   preset registry, add live Theme Lab coverage, add package tests, pass
   `npm run verify:release`. An externally-sourced theme gets no exemption
   from any rule in this document.
5. **Trace it to a GitHub issue** and document the source (which design,
   whose brand, what tool produced it) in the commit/PR — a future
   maintainer needs to know a lane's provenance without guessing.

The operational tool for this — a copy-pasteable prompt that walks a fresh
Claude Code session through this exact process, including how to handle a
source design as input — is [`TEMPLATES/GDS_THEME_CREATION_PROMPT.md`](TEMPLATES/GDS_THEME_CREATION_PROMPT.md).
See `CONTRIBUTING.md`'s "Importing an externally-designed theme" section
for the maintainer-facing walkthrough.

## 3.0.0 theme explorer proof contract

The GitHub Pages theme route must prove all approved lanes before the 3.0.0 release:

- preset selection for `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)`
- light, dark, and auto color-scheme proof copy
- comparison mode between two shipped lanes
- reset behavior that returns to the baseline `gdsTheme` lane
- explicit unsupported-lane guidance that explains why `extendGdsTheme(...)`, `createTheme(...)`, and `mergeMantineTheme(...)` are prohibited in consumer-owned theme files

If any lane regresses contrast or keyboard/focus visibility, block the release and keep consumers on the previous stable package line until the lane is fixed.

## Runtime persistence contract

Theme selection is part of the public reference-site runtime contract, not temporary page state.

The official website and any governed adopter that offers theme or typography switching must preserve the selected runtime across:

- internal navigation
- direct links to nested routes
- GitHub Pages or static-host SPA fallback reloads
- full browser refreshes
- remounting the theme explorer after visiting another route

Required implementation:

1. Store only serializable theme intent:
   - preset id
   - effective color scheme
   - font lane id
   - brand primary id
   - governed brand flags
   - runtime key
2. Reconstruct the Mantine theme from GDS helpers on startup:
   - `resolveGdsThemePreset(...)`
   - `applyGdsFontLane(...)`
   - or use the canonical `useGdsThemePresetState(...)` hook, which performs the same validation, reconstruction, persistence, and root attribute application
3. Apply the reconstructed runtime to the root provider before route content depends on it.
4. Set root runtime attributes for inspection and regression checks:
   - `data-mantine-color-scheme`
   - `data-gds-theme-runtime`
   - `data-gds-font-lane`
5. Pass the active runtime selection back into `ReferenceThemeExplorer` so controls reflect the whole-site runtime instead of resetting to local defaults.
6. Treat storage as best-effort. If `localStorage` is blocked, theme application must still work for the current session.
7. Add regression coverage that selects a non-default preset and non-default font lane, remounts the app on a nested route, and verifies the selected runtime survives.

What ruins the system:

- keeping theme selection only in component-local `useState`
- storing a full Mantine theme object instead of serializable intent
- rebuilding the root provider from `gdsTheme` defaults on every direct route load
- letting `/themes` controls own a private runtime that differs from the site shell
- using route-local CSS, `light-dark(...)` patches, or page-specific providers to fake runtime changes
- persisting only color scheme while dropping preset, font lane, or brand-generator options
- allowing static-host 404 fallback loads to reset the runtime
- using `extendGdsTheme(...)`, `createTheme(...)`, or `mergeMantineTheme(...)` in consumer-owned theme files as a shortcut around the approved lane contract

Preferred reference-site shape:

```ts
const {
  selection,
  setSelection,
  setPreset,
  setScheme,
  setFontLane,
  reset,
} = useGdsThemePresetState({ storageKey: 'gds-reference-theme-selection' });

<GdsProvider
  theme={selection.theme}
  defaultColorScheme={selection.colorScheme}
  forceColorScheme={selection.colorScheme === 'auto' ? undefined : selection.colorScheme}
>
  <ReferenceThemeExplorer
    initialSelection={selection}
    onSelectionChange={setSelection}
  />
</GdsProvider>;
```

Review checklist for runtime-theme work:

- Can a visitor choose `Oceanic wave`, switch to dark mode, choose `Space Grotesk`, then open `/live-demos/surfaces` directly without losing the runtime?
- Do direct links and static-host fallback pages serve the same persisted runtime as normal internal navigation?
- Are font files or imports available for every advertised font lane?
- Does `createGdsTokenGraph()` still expose a complete light/dark token pair for every shipped lane?
- Does `gds-theme-tokens validate` pass before the release branch is promoted?
- Has `gds-theme-tokens diff --compare <previous-graph.json>` been reviewed for intentional token changes and rollback safety?
- Does the test harness use a real in-memory storage implementation instead of a no-op storage mock?
- Does CI fail if the persistence contract is removed from the official reference app?
