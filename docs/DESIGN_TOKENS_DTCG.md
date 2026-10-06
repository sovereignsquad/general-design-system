# Design Tokens — W3C DTCG Export

Status: Active SSOT
Version: 6.8.0
Last updated: 2026-10-01

GDS publishes its design tokens in the **W3C Design Tokens Community Group (DTCG)** format so they can be consumed by Figma variables, [Style Dictionary](https://styledictionary.com/) v4, Tokens Studio, and other platform tooling — not only by the Mantine-native runtime (issue #452). Some values still reference Mantine's CSS variables and resolve only where those variables are declared; see [Values that need Mantine's CSS variables](#values-that-need-mantines-css-variables).

**Artifact:** [`tokens/gds.tokens.json`](../tokens/gds.tokens.json) — 425 tokens across 25 theme presets (17 roles per preset; 375 `$type: "color"` + 50 `$type: "com.sovereignsquad.gds.cssGradient"` effect tokens).

## The code tokens stay authoritative

The DTCG file is **generated, never hand-edited.** It is produced from `createGdsTokenGraph()` in `@sovereignsquad/gds-theme` — the same token source the theme-token contract (`verify:theme-tokens`) and the `gds-theme-tokens` CLI use. The runtime CSS variables and the DTCG export therefore cannot disagree: both derive from one source.

- **Regenerate:** `npm run tokens:dtcg`
- **CI drift gate:** `npm run verify:tokens-dtcg` (part of `verify:release`) rebuilds `gds-theme`, regenerates the document in memory, and fails if `tokens/gds.tokens.json` is stale. A token change that isn't reflected in the committed artifact cannot pass a release.

Output is fully deterministic (stable key ordering, no timestamps) so the drift check is stable across machines.

## Format

The document nests **theme preset → role → token**:

```json
{
  "gds": {
    "default": {
      "$description": "GDS theme preset: default",
      "primary": {
        "$type": "color",
        "$value": "#7c3aed",
        "$description": "default primary (shared mode)",
        "$extensions": { "com.sovereignsquad.gds": { "role": "primary", "mode": "shared", "category": "color" } }
      }
    }
  }
}
```

- **Color tokens** use the strict DTCG `$type: "color"`. `$value` is the token's CSS color (hex or `rgba(...)`), directly consumable by Style Dictionary and Figma variable importers.
- **Effect tokens** (CSS `gradient` / `hero` roles) are composite CSS values with no strict DTCG color representation, so they use a GDS-namespaced custom `$type` (`com.sovereignsquad.gds.cssGradient`) and carry the raw CSS string in `$value`. DTCG tooling that understands only `color` skips them; nothing is lost.
- Each token's `$extensions["com.sovereignsquad.gds"]` records its `role`, `mode` (`light` / `dark` / `shared`), and `category`, so a consumer can filter (e.g. only light-mode surface colors) without re-deriving semantics.

## Values that need Mantine's CSS variables

Some `$value`s are CSS expressions that reference a `--mantine-*` custom property: a length multiplied by `var(--mantine-scale)`, or a `light-dark()` pair of `--mantine-color-*` variables, as in `gds.global.vibe-danger`. Such a value resolves only in a document that declares Mantine's CSS variables, which a page does by loading `@sovereignsquad/gds-theme/styles.css` (it imports `@mantine/core/styles.css`). In Figma variables, Style Dictionary output, or any page without that stylesheet, the reference stays unresolved.

The generator (`inferDtcgType` in `scripts/generate-dtcg-tokens.mjs`) gives every value that contains `var()` a GDS custom `$type`, never `color` or `dimension`. Tools that read only the standard DTCG types skip these values; tools that pass custom types through emit the unresolved `var()`.

Count the affected values in the committed file:

```bash
jq '[.. | objects | select(has("$value")) | select(."$value" | tostring | contains("var(--mantine-"))] | length' tokens/gds.tokens.json
```

A page outside `GdsProvider` that has no bundler cannot load that stylesheet; what GDS supports there is in [`INSTALLATION_GUIDE.md`, "Surfaces outside GdsProvider"](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider).

## Consuming the tokens

**Style Dictionary v4** accepts DTCG as a native input:

```js
// sd.config.js
export default {
  source: ['node_modules/@sovereignsquad/gds-theme-tokens/gds.tokens.json'], // or a vendored copy of tokens/gds.tokens.json
  platforms: {
    css: { transformGroup: 'css', files: [{ destination: 'gds-tokens.css', format: 'css/variables' }] },
  },
};
```

**Figma:** import `tokens/gds.tokens.json` through a DTCG-aware plugin (e.g. Tokens Studio) to create Figma variables mapped 1:1 to the GDS color tokens. This is the token substrate the forthcoming official Figma UI kit (#450) builds on — keeping the code tokens authoritative and generating Figma variables from them avoids drift.

Prefer the runtime theme APIs (`gdsTheme`, `getGdsThemePresets()`, CSS VibeThemes, `useGdsThemePresetState`) inside a GDS React app; the DTCG export exists for **cross-platform and design-tool** consumption, not to replace the runtime theme lanes.
