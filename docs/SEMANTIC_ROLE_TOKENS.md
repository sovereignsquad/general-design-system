# Default Semantic-Role Token Layer

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

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

This layer defines the **structural contract roles** (backgrounds, text, border, on-inverse) — the ones the issue names (`bg`/`surface`/`on-*`/`border`) and the ones the readability contract depends on. It deliberately does **not** define the **decorative / state / accent** roles (`--gds-brand-accent`, `--gds-state-*`, `--gds-focus-ring`, `--gds-badge-*`, `--gds-price`, `--gds-support`, …) at the default layer, when **no preset is active**. Those stay **brand/preset-driven**, because their hue is a brand decision (an accent is intentionally violet under one theme, terracotta under another) rather than a fixed default.

No default brand-accent text role exists. `--gds-brand-accent` is undefined at this layer, `createPublicBrandTheme` emits no `--gds-*` roles, and `createBrandTheme` emits `--gds-brand-accent` as its raw input in both schemes, so no GDS role gives a brand-coloured text value derived per scheme. Use [`checkGdsContrast`](CONTRAST_CHECKER.md#brand-text-on-role-surfaces) for the brand-coloured text, measured against these surfaces in each scheme the product renders.

### Every preset now defines the full role set (badge-system foundation, #485)

As of 4.0.0, all **25** presets define the full decorative/state/accent role set — not just `class-usa`/`gold-athlete`. `class-usa` and `gold-athlete` keep their existing hand-authored values (`classUsaSemanticCssVariables`/`goldAthleteSemanticCssVariables` in `packages/gds-theme/src/vibe-themes.ts`); the other 23 get theirs from `deriveVibeSemanticCssVariables()`, mixed from each preset's own `GdsVibeTheme` palette in sRGB (matching the runtime `color-mix(in srgb, ...)`) and pushed toward black/white until each pair clears WCAG AA (normal text) or non-text AA (3:1) against its background — verified for every preset, both modes, in `vibe-themes.test.ts`. `--gds-state-danger`/`--gds-state-danger-dark` and `--gds-state-warning-dark` are fixed, non-preset-tinted anchors (`#b3261e`/`#f2786f`/`#e0a23c`) rather than derived, since those exact values were already identical between the two hand-authored presets.

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
