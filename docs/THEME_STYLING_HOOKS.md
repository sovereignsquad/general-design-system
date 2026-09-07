# Theme Styling Hooks

GDS themes its surfaces through **GDS-owned styling hooks**, not vendor-internal
class names. This decouples the styling contract from the engine: a vendor class
rename can't break GDS theming, and the public CSS surface is enforced by
`verify:css-boundary` (see [`docs/BOUNDARY_CONTRACT.md`](BOUNDARY_CONTRACT.md)).

## How hooks are attached

GDS-owned classes are attached **globally, in one place** — the theme's
`components.<Component>.classNames` config (`packages/gds-theme/src/theme.ts`).
Mantine lands the class on the component's element (by slot) for every instance,
under the base theme and every preset (preset merges preserve base `classNames`).
The published stylesheet then keys on the GDS class.

| Hook | Surface | Attached via |
|------|---------|--------------|
| `.gds-paper` | `Paper` root | `theme.components.Paper.classNames.root` |
| `.gds-card` | `Card` root | `theme.components.Card.classNames.root` |
| `.gds-alert` | `Alert` root | `theme.components.Alert.classNames.root` |
| `.gds-code` | `Code` root | `theme.components.Code.classNames.root` |
| `[data-gds-overlay-surface]` | overlay/dropdown surface | overlay rule (#342) |
| `[data-gds-fixed-tone]` | any element a preset rule repaints | set by the consumer; every preset-gated rule excludes it via `:where(:not(…))` (#724) |

## Opting one element out of preset theming

`[data-gds-fixed-tone]` is the one hook consumers set themselves. Every rule gated on
`html[data-gds-theme-preset]` (outside the forced-colors and reduced-motion blocks, and
excluding `body`) carries `:where(:not([data-gds-fixed-tone]))` on its subject, at zero
specificity, so the element keeps its own styling and nothing else in the cascade moves.
Element-level, not inherited. Contract and test: `THEME_GOVERNANCE.md`, "Opting one element
out of the preset repaint".

## Migrating a selector off the vendor class

The surface group above is migrated. Remaining `.mantine-*` selectors in
`styles.css` are frozen in `boundary/public-css-allowlist.json` and migrate
incrementally — each migration is a ratchet-down the gate enforces:

1. Add a GDS class via `theme.components.<X>.classNames.<slot>` (this lands it on
   the same element the `.mantine-X-slot` selector targets — so the rule applies
   identically and there is **no visual change**).
2. Rename the selector in `styles.css` (`.mantine-X-slot` → `.gds-<x>`).
3. Verify parity: `npm run verify:theme-trust-runtime && npm run verify:forced-colors-runtime`.
4. Shrink the baseline: `node scripts/verify-css-boundary.mjs --write` and review the diff.

The CSS-boundary gate guarantees the vendor-selector surface only ever shrinks
deliberately, never grows by accident.
