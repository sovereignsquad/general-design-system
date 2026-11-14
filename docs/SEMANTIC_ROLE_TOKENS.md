# Default Semantic-Role Token Layer

Status: Active SSOT
Version: 6.8.0
Last updated: 2026-11-13

GDS components speak in **semantic roles** — `var(--gds-bg-surface)`, `var(--gds-text-body)`, `var(--gds-border-card)` — not raw Mantine ramps. Historically those role variables were only *defined* by `createBrandTheme(...)`; the base `gdsTheme` left them undefined, so every component fell back to a per-call-site guess (`--gds-bg-surface` resolved to `#eee` in one place, `white` in another, `gray-1` in a third). That made the default theme's surfaces inconsistent and made a guaranteed contrast contract impossible (issue #451).

This layer fixes that: **`@sovereignsquad/gds-theme/styles.css` now defines the canonical structural roles at `:root`** as the default token layer, so a component reads one governed value regardless of where it's used.

## The default role values

Defined once in `:root` (light / dark via CSS `light-dark()`), matching the contrast-gated `default` theme palette:

| Role variable | Light | Dark | Purpose |
|---|---|---|---|
| `--gds-bg-canvas` / `--gds-bg-page` | `#f8fafc` | `#0f172a` | Page colour role, used for contrast checks; not painted (see below) |
| `--gds-bg-surface` / `--gds-bg-card` | `#ffffff` | `#1e293b` | Card / raised surface |
| `--gds-bg-inverse` | `#111827` | `#111827` | Inverse/emphasis surface (dark in both schemes) |
| `--gds-border-card` | `#e2e8f0` | `#334155` | Subtle card border (decorative) |
| `--gds-text-body` / `--gds-text-primary` | `#111827` | `#f8fafc` | Body / primary text |
| `--gds-text-meta` / `--gds-text-secondary` | `#64748b` | `#cbd5e1` | Meta / secondary text |
| `--gds-text-on-inverse` | `#f8fafc` | `#f8fafc` | Text on an inverse surface |

No provider or shell paints these page roles onto the page: neither `GdsProvider` nor any shell reads `--gds-bg-canvas` or `--gds-bg-page` for the page background. Outside presets the page canvas is `--mantine-color-body`, painted by the `GdsProvider` wrapper and shared with `Paper`, `Card` and modal surfaces; presets paint `body` from `--gds-vibe-canvas`. Components and contrast checks read these roles as the page colour. Consumer rules for the page background are in [`SAFE_STYLING.md`, Global CSS in a GDS app](SAFE_STYLING.md#global-css-in-a-gds-app).

The [Amanoba appendix in `THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md#appendix-amanoba-dark-shell--yellow-cta) is the worked example of a dark-only product measuring brand text against these values.

### The default layer follows the CSS `color-scheme` property

The values above are `light-dark()` declarations. `light-dark()` resolves against the CSS `color-scheme` of the element that reads the variable, and Mantine binds `color-scheme` on `:root` to `data-mantine-color-scheme`, which `GdsProvider` writes. A consumer `color-scheme` declaration therefore flips every `light-dark()` value inside its scope regardless of the provider's scheme, while Mantine's own `--mantine-color-*` variables keep following the attribute; the page renders half in each scheme. GDS declares no `color-scheme` of its own, and consumers declare none: use the [`THEME_GOVERNANCE.md`, Colour scheme](../THEME_GOVERNANCE.md#colour-scheme) recipes for the scheme a product needs.

- Follow `color-scheme`: every `light-dark()` value in the `:root` layer of `packages/gds-theme/styles.css` (the roles in the table above with different light and dark values, and the default `--gds-vibe-danger`, `--gds-vibe-warning` and `--gds-vibe-success`), the governed `light` variant tint that `GdsProvider` applies to every theme, and lane styles written with `light-dark()` such as `gdsDarkPublicTheme`'s surfaces.
- Do not follow it: brand values from `theme.other.gdsCssVariables` (resolved per scheme by `GdsProvider` in JS), preset values written by `useGdsThemePresetState`, and Mantine's scheme variables.

### Scope — structural roles only

This layer defines the **structural contract roles** (backgrounds, text, border, on-inverse) — the ones the issue names (`bg`/`surface`/`on-*`/`border`) and the ones the readability contract depends on. It does **not** define the remaining **decorative** roles (`--gds-price`, `--gds-support`, …) at the default layer, when **no preset is active**; those stay **brand/preset-driven**.

The brand and state roles do have defaults (#968), in the generated `gds:brand-defaults` block: `--gds-brand-primary`, `--gds-brand-accent`, `--gds-brand-accent-action` (each with `-fg`) and `--gds-state-success`/`-warning`/`-danger`/`-info`, from `getGdsDefaultLaneCssVariables()`, which returns the `default` preset's roles. Presets and `createBrandTheme` override every one of them inline. In a lane without a preset, controls that used to fall back to `--gds-vibe-primary` or Mantine's primary colour now paint the default preset's brand primary.

### Brand primary and state info are a readable grey, never the body text colour (#970)

A primary control or info badge filled with the body text colour reads as text. Every preset therefore paints `--gds-brand-primary` and `--gds-state-info` with `deriveGdsReadableGrey()`: the preset's muted text colour at 4.5:1 on the card, and in dark the same grey lifted only until it clears 4.5:1 on the dark card (the `default` preset: `#64748b` and `rgb(154, 164, 179)`). Hand-authored lanes keep their values unless one equals the body text colour; `applyGdsGreyWhenText()` replaces those (`gold-athlete`, and `class-usa` in dark; `class-usa` light keeps its navy). The badge and chart pairs are derived from the result. `createBrandTheme(...)` keeps the brand colours it is given. The accessibility-floor rule `brand-fill-not-text-colour` fails any preset where either role equals the body text colour.

`--gds-focus-ring` (#765) and the badge roles `--gds-badge-*` (#968) are defaulted too, because components read them without a fallback and render broken without them. With no value, a badge painted with no background colour and the inherited text colour. Both are generated into `packages/gds-theme/styles.css` (the `gds:axis-defaults` and `gds:badge-defaults` blocks, by `npm run tokens:axis-css`), the badge roles from `getGdsDefaultLaneCssVariables()`. Each badge role is a background/foreground pair derived and contrast-checked together, so it holds 4.5:1 on any surface. Presets and brand themes override both, as with every role here. The chart roles `--gds-chart-*` (#954) follow the same pattern in a `gds:chart-defaults` block; see [CHART_TOKENS.md](CHART_TOKENS.md).

No default brand-accent text role exists. `--gds-brand-accent` is undefined at this layer, `createPublicBrandTheme` emits no `--gds-*` roles, and `createBrandTheme` emits `--gds-brand-accent` as its raw input in both schemes, so no GDS role gives a brand-coloured text value derived per scheme. Use [`checkGdsContrast`](CONTRAST_CHECKER.md#brand-text-on-role-surfaces) for the brand-coloured text, measured against these surfaces in each scheme the product renders.

### Card surface from the palette (#865)

A preset's declared card surface (`surfaceLight` / `surfaceDark` on `GdsVibeTheme`) is the card when it is opaque: `getGdsVibeCardSurface(vibe, scheme)` returns it when it parses with alpha 1 and `undefined` otherwise. For that scheme it sets `--gds-bg-card` and `--gds-bg-surface`, every tint and foreground derived against them (badge pairs, the readable grey, chart roles), and `--gds-vibe-card`, which makes `.gds-card`, `.gds-paper`, the Mantine `Card` and the dark `Popover` dropdown paint it flat. A translucent surface keeps the previous behaviour: `#ffffff` in light, the canvas mixed 12% toward white in dark, and the surface gradient paint.

- A hand-authored table (`class-usa`, `gold-athlete`) may repeat an opaque surface but never contradict it; a different value throws `GdsCardSurfaceError` at construction.
- Owned- and local-contrast surfaces reset `--gds-vibe-card`, so cards inside paint the local surface. Forced colours set it to `Canvas`.
- Changed presets: `high-contrast` dark card `rgb(31, 31, 31)` -> `#000000`, `colorblind-safe` dark card `rgb(39, 48, 59)` -> `#101b28`. Both declare an opaque `#ffffff` light surface, so their light card role stays `#ffffff` and `colorblind-safe` cards now paint flat in both schemes. Every other preset is unchanged.
- A preset with its own per-preset card rule in `styles.css` (the `sunset` to `royal` gradients) should keep its surface translucent; those rules do not read `--gds-vibe-card`.

### Every preset now defines the full role set (badge-system foundation, #485)

As of 4.0.0, every preset defines the full decorative/state/accent role set — not just `class-usa`/`gold-athlete`. `class-usa` and `gold-athlete` keep their existing hand-authored values (`classUsaSemanticCssVariables`/`goldAthleteSemanticCssVariables` in `packages/gds-theme/src/vibe-themes.ts`); every other registered preset gets them from `deriveVibeSemanticCssVariables()`, mixed from each preset's own `GdsVibeTheme` palette in sRGB (matching the runtime `color-mix(in srgb, ...)`) and pushed toward black/white until each pair clears WCAG AA (normal text) or non-text AA (3:1) against its background — verified for every preset, both modes, in `vibe-themes.test.ts`. `--gds-state-danger`/`--gds-state-danger-dark` and `--gds-state-warning-dark` are fixed, non-preset-tinted anchors (`#b3261e`/`#f2786f`/`#e0a23c`) rather than derived, since those exact values were already identical between the two hand-authored presets.

This was a deliberate scope decision for the badge-system epic (#484): badges need a real per-preset color everywhere, not a shared fallback chain, so the semantic role gap was closed at the token layer instead of inside the badge components.

## Precedence — presets always win

The `:root` values are the **base layer only**. At runtime, brand and vibe-preset application injects role variables as **inline `:root` styles** (`getGdsVibeThemeCssVariables`, `GdsProvider`), and an inline style always wins over this stylesheet rule. So:

- Base `gdsTheme` → the `:root` defaults above.
- A vibe preset (Theme Lab) → its `--gds-vibe-*` repaint on top; the structural role defaults remain unless the preset overrides them.
- `createBrandTheme(...)` / `class-usa` / `gold-athlete` → their full semantic map overrides every role. The map reaches the page through `theme.other.gdsCssVariables` ([`THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md#themeothergdscssvariables) documents its shape and write targets). Overriding a role does not validate it: [`THEME_GOVERNANCE.md`, `createBrandTheme` contrast scope](../THEME_GOVERNANCE.md#createbrandtheme-contrast-scope) lists which pairs the factory checks.

There is **no regression to existing presets**: because presets override via inline styles, nothing a preset already renders changes.

## The per-token-pair contrast contract

The readable-text role values are **identical to the `default` theme token nodes that `verify:token-contrast-scoring` already hard-gates** (see [`THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md)). So the contract below is not a new promise to police separately — it is guaranteed and enforced by the existing release gate.

| Pair | Light | Dark | Min | Gated? |
|---|---|---|---|---|
| `text-body` on `bg-surface` | 17.74 | 13.98 | 4.5 | ✅ hard |
| `text-body` on `bg-canvas` | 16.96 | 17.06 | 4.5 | ✅ hard |
| `text-meta` on `bg-surface` | 4.76 | 9.85 | 4.5 | ✅ hard |
| `text-meta` on `bg-canvas` | 4.55 | 12.02 | 4.5 | ✅ hard |
| `text-on-inverse` on `bg-inverse` | 16.96 | 16.96 | 4.5 | ✅ |
| `border-card` on `bg-surface` | 1.23 | — | — | decorative (non-gated) |

`border-card` is a subtle 1px card border, not text — it is intentionally low-contrast and is scored only at the advisory (INFO) tier, never hard-gated, consistent with how the contrast gate treats decorative borders.

Consumers can verify their own overrides against this same bar with the [consumer contrast checker](CONTRAST_CHECKER.md):

```ts
import { checkGdsContrast } from '@sovereignsquad/gds-theme';

checkGdsContrast('#64748b', '#f8fafc'); // { ratio: 4.55, required: 4.5, passes: true, ... }
```

## Consuming the roles

Read the role variable with a Mantine fallback, so the value degrades gracefully if `styles.css` has not loaded yet:

```tsx
<div style={{ background: 'var(--gds-bg-surface)', color: 'var(--gds-text-body)' }} />
```

Do **not** hard-code `#fff` / `gray-6` / etc. for these structural needs — reach for the role so the default layer, presets, and brand themes can all re-theme it. See [`SAFE_STYLING.md`](SAFE_STYLING.md) for the token-backed style contracts that wrap these roles.

Read `--mantine-*` variables; never assign them in consumer CSS. Mantine declares its scheme variables under `:root[data-mantine-color-scheme='light']` and `:root[data-mantine-color-scheme='dark']`, specificity (0,2,0), so a weaker override loses silently, and a winning override of `--mantine-color-body` repaints the page wrapper, `Paper`, `Card` and modal surfaces together. Rules for consumer stylesheets: [`SAFE_STYLING.md`, Global CSS in a GDS app](SAFE_STYLING.md#global-css-in-a-gds-app).
