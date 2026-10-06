# Safe Styling API

Status: Active SSOT
Version: 6.8.0
Last updated: 2026-10-01

The safe styling API is the approved replacement for product-local inline styles and arbitrary CSS when a full component contract is not the right fit. It constrains common visual needs to GDS tokens and semantic enums.

## Package API

Use these exports from `@sovereignsquad/gds-core`, `@sovereignsquad/gds-core/server`, `@sovereignsquad/gds-core/client`, or the aggregate `@sovereignsquad/gds` entrypoints:

- `gdsStyle`
- `createGdsStyleContract`
- `GdsSafeBox`
- `GdsMediaFrame`
- `GdsOverflowFrame`
- `GdsResponsiveVisibility`

## Runtime Flow

```text
consumer styling intent
  -> GdsSafeStyleProps enum/token contract
  -> token resolver and scanner marker attributes
  -> scoped responsive visibility CSS when needed
  -> GDS-rendered media/overflow/visibility helper
  -> compliance scanner or codemod evidence
```

The helpers do not perform I/O, do not retry, do not use timers, and do not add a runtime CSS framework dependency.

## Approved Props

```tsx
<GdsSafeBox
  safeStyle={{
    background: 'surface',
    border: 'default',
    radius: 'lg',
    shadow: 'subtle',
    overflow: 'contained',
    inset: 'md',
  }}
>
  Governed content
</GdsSafeBox>
```

Supported groups, one per field of `GdsSafeStyleProps` in `packages/gds-core/src/SafeStyles.tsx`. The type is authoritative; TypeScript rejects any other value.

- `background`: `canvas`, `surface`, `subtle`, `accent`, `danger`, `success`, `warning`, `info`, `transparent`
- `border`: `none`, `default`, `subtle`, `accent`, `danger`, `success`, `focus`
- `radius`: `none`, `sm`, `md`, `lg`, `xl`, `round`
- `shadow`: `none`, `subtle`, `raised`
- `overflow`: `visible`, `clip`, `scroll-x`, `scroll-y`, `auto`, `contained`
- `mediaFit`: `cover`, `contain`, `fill`, `scale-down`
- `aspectRatio`: `square`, `video`, `photo`, `wide`, `portrait`
- `inset`: a `GdsLayoutToken` spacing step (see [Spacing, size and type steps by prop](#spacing-size-and-type-steps-by-prop))
- `visibility`: `visible`, `hidden`, `screen-reader-only`, including responsive breakpoint objects
- `focusRing`: `default`, `inset`
- `forcedColors`: `auto` (default), `preserve`

## Helpers

Media:

```tsx
<GdsMediaFrame fit="cover" aspectRatio="video">
  <img src={src} alt={alt} />
</GdsMediaFrame>
```

Overflow:

```tsx
<GdsOverflowFrame policy="contained" label="Transaction table overflow">
  <SimpleDataTable rows={rows} columns={columns} />
</GdsOverflowFrame>
```

Responsive visibility:

```tsx
<GdsResponsiveVisibility visibility={{ base: 'screen-reader-only', md: 'visible' }}>
  Expanded guidance
</GdsResponsiveVisibility>
```

Low-level contract:

```tsx
const contract = createGdsStyleContract('product-preview', {
  background: 'subtle',
  border: 'default',
  radius: 'lg',
});
```

Use the low-level contract for GDS-owned package integration or reviewed adapter code. Product UI should prefer `GdsSafeBox`, `GdsMediaFrame`, `GdsOverflowFrame`, and `GdsResponsiveVisibility`.

## Spacing, size and type steps by prop

Which step names a prop accepts depends on the prop family. GDS layout primitives and `safeStyle` reject unknown names at compile time. Mantine props accept any string: a name outside the family's set becomes an invalid CSS value or an undeclared variable, and the style is not applied.

This table is not generated. Each row names the declaration it describes; where the two differ, the declaration is correct.

| Prop family | Accepted step names | Resolves to | Follows a density-axis mode | Declared in |
|---|---|---|---|---|
| Mantine style props `m*` and `p*` (`p`, `px`, `py`, `mt`, …) | The keys of `gdsTheme.spacing`: `xs`, `sm`, `md`, `lg`, `xl` | `var(--mantine-spacing-<step>)`. Any other string is passed through as the CSS value, so `py="2xl"` produces the invalid value `2xl`. A number becomes a literal `rem` length. | No. `gdsTheme.spacing` is set once from `GDS_DEFAULT_DENSITY_AXIS.scale`. | `packages/gds-theme/src/theme.ts` (`spacing`) |
| Mantine component `gap` and `spacing` (`Stack`, `Group`, `SimpleGrid`, …) | Same keys | `var(--mantine-spacing-<step>)`. Another name, such as `gap="2xl"`, produces `var(--mantine-spacing-2xl)`, which no GDS or Mantine stylesheet declares, so no gap is applied. | No | `packages/gds-theme/src/theme.ts` (`spacing`) |
| GDS layout primitives `gap`, `padding`, `margin`, `bleed`; `safeStyle.inset` | `GdsLayoutToken`: `0`, `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `xs`–`xl`: `var(--mantine-spacing-<step>)`. `2xl`: `calc(var(--mantine-spacing-xl) * 1.5)`, declared by the layout primitives themselves, separately from the density-axis `2xl`. `3xl` is not accepted. | No | `GdsLayoutToken` in `packages/gds-core/src/LayoutPrimitives.tsx`; spacing maps in `LayoutPrimitives.tsx` and `SafeStyles.tsx` |
| GDS layout widths: `maxWidth`, `GdsContainer` `size`, `GdsSidebar` `sidebarWidth`, `GdsGrid` `minColumnWidth` | `GdsLayoutSize`: the `GdsLayoutToken` names except `0`, plus `aside`, `content`, `narrow`, `page`, `wide`, `full` | Spacing names as above. `aside`–`wide` are fixed `rem` widths in `LayoutPrimitives.tsx`, not axis tokens. `full` is `100%`. `maxWidth` and `GdsContainer` `size` set a maximum width, so content reflows below it. | No | `GdsLayoutSize` in `LayoutPrimitives.tsx` |
| `safeStyle.radius` | `GdsRadiusToken`: `none`, `sm`, `md`, `lg`, `xl`, `round` | `var(--mantine-radius-<step>)`; `none` is `0`; `round` is a fixed full-round value. There is no `xs`. | No | `SafeStyles.tsx` |
| Mantine `radius` prop | The keys of `gdsTheme.radius`: `xs`, `sm`, `md`, `lg`, `xl` | `var(--mantine-radius-<step>)`, fed from `GDS_DEFAULT_SHAPE_AXIS.scale`. The shape axis's `none` and `pill` are not Mantine keys and resolve to undeclared variables. | No | `packages/gds-theme/src/theme.ts` (`radius`) |
| Text: `fz` style prop, `Text` `size` | The theme's `fontSizes` keys, `xs`–`xl` (`gdsTheme` keeps Mantine's); `fz` also takes `h1`–`h6` | `var(--mantine-font-size-<step>)` or `var(--mantine-h<n>-font-size)`. `fz="2xl"` passes through as the invalid value `2xl`; `<Text size="2xl">` resolves to an undeclared variable. | Not applicable | Mantine default theme |
| Headings: `Title` `size`; `PageTitle`, `SectionTitle`, `CardTitle` | `Title` `size`: `h1`–`h6`, `xs`–`xl`. The heading roles fix their size (`h1`, `h2`, `h4`) and take `order` for the semantic level. | `var(--mantine-h<n>-font-size)`, set from `gdsTheme.headings.sizes` for `h1`–`h3`. Other strings pass through as literals. The largest step is `h1`. | Not applicable | `theme.ts` (`headings`); `packages/gds-core/src/Typography.tsx` |
| `GdsIcon` `size` | `xs`, `sm`, `md`, `lg` | Fixed `rem` sizes in `packages/gds-core/src/icons.ts`, not axis tokens. A number or other string is used as a literal size. | No | `icons.ts` |
| Axis variable in a prop or style value: `var(--gds-space-<step>)`, `var(--gds-font-size-<step>)` | `GDS_SPACE_STEPS`: `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`. `GDS_TEXT_STEPS`: `2xs`–`4xl`. | The custom property. It is declared only where a lane emits axis tokens through `resolveGdsAxisTokens`: the theme-preset runtime and the `class-usa` and `gold-athlete` brand lanes. `styles.css` does not declare these at `:root`, so elsewhere the reference is undefined. | `--gds-space-*` follows the lane's density-axis mode | `packages/gds-theme/src/axes.ts` |

The density, typography and shape scales render on the reference site through `GdsDensitySpacingSystemReference`, `GdsTypographySystemReference` and `GdsShapeElevationSystemReference`, which read the resolved values from the same resolvers a theme calls.

### Section-scale spacing

The density axis declares `2xl` and `3xl` above `xl`. From props on this version:

- Mantine style props and component `gap`/`spacing` stop at `xl`.
- GDS layout primitives reach `2xl`. Compose section spacing from them, for example `<GdsStack gap="2xl">` or `<GdsContainer padding="2xl">`.
- `3xl` is reachable only as `var(--gds-space-3xl)`, and only in a lane that emits it. In any other lane, use the layout primitive step.

### No step exists

These values have no token a prop can reach on this version:

- spacing above the density-axis `3xl`, and `3xl` itself outside lanes that emit `--gds-space-3xl`
- content measures other than the named layout widths (`aside`, `content`, `narrow`, `page`, `wide`); there is no text-measure (line-length) token
- display type larger than the `h1` heading size: no heading role or `Title` step is larger, and text steps above `xl` are not reachable from `fz` or `size`
- letter spacing: the default typography axis declares no tracking, so no `--gds-tracking-*` is emitted by default, and no GDS component reads one
- icon sizes above `GdsIcon`'s `lg`, and any icon-size axis token

For a value with no step, use the nearest step that exists. If none fits, record the gap in the pull request with a reference to the GDS issue that tracks it, and keep the nearest step until GDS ships one. A numeric or `rem` literal is not a governed substitute, and passing lint does not make it one (see [Compliance Scanner Behavior](#compliance-scanner-behavior)).

### Responsive values, zero, and values between steps

- Each value in a responsive object (`{ base: …, md: … }`) follows the same table.
- `0` and `none` are allowed wherever `GdsLayoutToken` is accepted.
- A value between two steps rounds to the nearer step.
- `ImageResponse` and Open Graph image routes render outside the React DOM theme. They fall under the certificate, email and OG rendering exception in [`EXCEPTION_SURFACES.md`](../EXCEPTION_SURFACES.md#permanent-or-likely-long-lived-exceptions).

Text sizes are `rem`-based, so they follow the user's browser font size; do not set font sizes in `px` (WCAG 1.4.4). Visual size and heading level are separate: a heading role keeps its size when `order` changes, and a larger visual size never requires a different heading level (WCAG 1.3.1).

## Do Not Use

Do not use raw inline values:

```tsx
<div style={{ color: '#111', padding: '17px', borderRadius: 13 }} />
```

Of the three values in this example, `gds/no-raw-design-values` reports only the color; the padding string and the numeric radius pass lint. `gds-compliance` reports the color as `forbidden-color` in every mode; with `compliance.strictMode: true` it also reports the file under `strict.raw-color`, `strict.inline-color`, `strict.non-token-radius` and `strict.inline-style`.

Do not hide content with unlabelled CSS:

```tsx
<div style={{ display: isMobile ? 'none' : 'block' }} />
```

Do not create local media wrappers:

```tsx
<div className="card-image-frame"><img /></div>
```

Use the safe styling helpers instead so color, spacing, radius, overflow, and visibility remain token-backed and scanner-visible.

## Global CSS in a GDS app

A consumer stylesheet reaches every GDS and Mantine element its selectors match. These rules apply to every stylesheet the app loads: global CSS, CSS Modules and injected `<style>` elements. Each rule has an identifier for reviews and exception records.

| Identifier | Rule | Why it breaks GDS | Governed path |
|---|---|---|---|
| `global-css.element-selectors` | No element or type selectors that can match GDS or Mantine controls: `html`, `body`, `*`, `button`, `a`, `input`, `select`, `textarea`, `h1`–`h6`, `[role="button"]`, inside or outside media queries. | GDS components render these elements, and Mantine sizes them through component classes and CSS variables. An element rule that adds padding, a minimum height, a font size or a color changes every matching control, for example block padding inside a fixed-height button. | Style the app's own elements through the app's own classes. Base typography comes from the theme passed to `GdsProvider`. |
| `global-css.important` | No `!important` against GDS or Mantine rules. | `!important` overrides the component's own declarations, and can defeat GDS's `:focus-visible`, `forced-colors` and `prefers-reduced-motion` rules in `@sovereignsquad/gds-theme/styles.css`. | Component props and theme inputs. To keep an element's own styling under a theme preset, set `data-gds-fixed-tone` on it ([`THEME_STYLING_HOOKS.md`](THEME_STYLING_HOOKS.md#opting-one-element-out-of-preset-theming)). `data-gds-fixed-tone` first ships in 6.8.0; it is not in 6.7.0 or earlier releases. |
| `global-css.mantine-variables` | Never assign a `--mantine-*` custom property. Reading one with `var()` is allowed. | Mantine declares its color-scheme variables under `:root[data-mantine-color-scheme='light']` and `:root[data-mantine-color-scheme='dark']`, specificity (0,2,0). An override written as `html[data-mantine-color-scheme='dark']`, specificity (0,1,1), loses without any error. An override that wins repaints every component that reads the variable: `--mantine-color-body` is the background of `body`, the `GdsProvider` wrapper, `Paper` (which `Card` and Modal content render), the Modal header, and GDS `Card` roots. | Set colors through the theme passed to `GdsProvider`: a theme preset or a brand theme. |
| `global-css.page-background` | Do not set the page background by reassigning `--mantine-color-body`. | Outside theme presets, the page canvas is `--mantine-color-body`, painted by the `GdsProvider` wrapper (at least the viewport height) and shared with every surface listed above. Preset lanes also paint `body` from `--gds-vibe-canvas` and the preset gradient. `--gds-bg-page` is declared in `styles.css`, but nothing paints the page from it. A gradient assigned to `--mantine-color-body` is invalid wherever the variable is read as `background-color` (Mantine's `body` and `Paper` rules), which leaves those surfaces with no background color, and it repaints the gradient wherever the variable is read through `background` (the `GdsProvider` wrapper, GDS `Card` roots). | None on this version. GDS has no governed way to set a page background separate from surface colors, including a gradient. Use a theme preset or a brand theme, which sets the page and surface colors together. |
| `global-css.z-index` | Fixed or sticky consumer chrome (headers, sidebars, bottom bars) must use the `gdsZIndexToken` tiers and stay at or below the `app` tier. No parallel numeric z-index scale. | GDS overlays sit on the higher tiers. `ConfirmDialog`, which `GdsConfirmProvider` renders, is a Mantine `Modal` with no `zIndex`, so it sits on the `modal` tier. Chrome stacked above that tier covers the dialog while it holds focus. | In JS, `gdsZIndexToken.app` from `@sovereignsquad/gds-theme`. In CSS, read the same tiers by the variables `gdsZIndexToken` resolves to (`var(--mantine-z-index-app)` and the other tiers in `packages/gds-theme/src/z-index.ts`); GDS publishes no z-index custom properties of its own on this version. Content that must appear above overlays, such as a global toast, goes through `GdsToastProvider` and `useGdsToasts`, not a higher number. |
| `global-css.color-scheme` | No `color-scheme` declarations in consumer CSS. | `GdsProvider` owns the color scheme: it writes `data-mantine-color-scheme` on the root, and Mantine binds `color-scheme` on `:root` to it. GDS tokens use `light-dark()`, which follows the computed `color-scheme`. A consumer declaration can make `light-dark()` tokens resolve for one scheme while Mantine's scheme variables resolve for the other. | Set the scheme through `GdsProvider` (`defaultColorScheme`, `forceColorScheme`), using the recipes in [`THEME_GOVERNANCE.md`, "Colour scheme"](../THEME_GOVERNANCE.md#colour-scheme). |

### Open gaps

These have no governed fix on this version:

| Identifier | Gap |
|---|---|
| `global-css.gap.placeholder-color` | GDS sets the input placeholder color only in preset lanes (`html[data-gds-theme-preset] … ::placeholder` in `styles.css`). Elsewhere the placeholder is Mantine's `--mantine-color-placeholder`, which is below the WCAG 1.4.3 minimum against the light-scheme input background. Removing a consumer's `!important` placeholder pin does not fix this; it is a GDS gap. |
| `global-css.gap.button-height` | `gdsTheme` sets the `Button` default `size` to `sm`, which renders Mantine's `--button-height-sm`. Button height is not bound to `--gds-control-height-*`, and the default renders below `GDS_MIN_TARGET_PX`, the `control-height-min-target` floor in [`ACCESSIBILITY_FLOOR.md`](ACCESSIBILITY_FLOOR.md) (WCAG 2.5.5). Removing a consumer's global `button` minimum height lowers its targets to that default. |
| `global-css.gap.dimmed-text` | In preset lanes, GDS binds `--mantine-color-dimmed` and `--mantine-color-text` to the preset's `--gds-vibe-*` text roles. Elsewhere dimmed text uses Mantine's own `--mantine-color-dimmed`, which GDS does not bind to a GDS text role. |

### Special cases

- **User-generated HTML** (CMS output, rendered Markdown): scope element rules under the app's own container class. GDS ships no prose container on this version.
- **Third-party widgets that need global CSS**: scope the rules to the widget's root element, and declare the stylesheet as an `approvedExceptions` entry in `gds-adoption.json`.
- **Reading a Mantine variable** (a z-index tier, a scheme color) is allowed; `global-css.mantine-variables` forbids assignment only.

## Compliance Scanner Behavior

`gds-compliance` reports `strict.inline-style` for a source file that contains a `style={{` attribute. It runs only when `compliance.strictMode` is `true` in `gds-adoption.json`; with strict mode off or absent, it does not run (see [`COMPLIANCE_TOOLKIT.md`](../COMPLIANCE_TOOLKIT.md#covered-rule-classes)). Its remediation points to:

- `GdsSafeBox`
- `GdsMediaFrame`
- `GdsOverflowFrame`
- `GdsResponsiveVisibility`
- layout primitives from `docs/LAYOUT_PRIMITIVES.md`

`gds/no-raw-design-values` (`@sovereignsquad/gds-eslint-config`) inspects string literals and template-literal text only. It reports:

- a hex, `rgb()` or `rgba()` color anywhere in a string
- a string that holds a `padding`, `margin`, `gap`, `radius` or `borderRadius` declaration together with a `px` or `rem` value, as in CSS text (`RAW_SPACING_PATTERN` in `packages/gds-eslint-config/index.js`)

It does not report:

- numeric props, such as a number passed to `gap`, `py`, `maw` or `size`, including inside responsive objects
- `px` or `rem` strings passed as props, such as `fz`, `maw` or `size`
- spacing and radius values in style objects, numeric or string, because the property name and the value are separate syntax nodes
- properties outside its pattern, such as `letterSpacing`
- files under a `theme/` or `tokens/` path segment

A clean lint run therefore does not show that spacing, sizes and type are tokenized.

Neither tool reads stylesheets. `gds-compliance` applies its source rules only to files with the extensions in `SOURCE_EXTENSIONS` (`packages/gds-compliance/index.js`), and the ESLint rule inspects JavaScript and TypeScript syntax. No rule in [Global CSS in a GDS app](#global-css-in-a-gds-app) is enforced by either tool on this version.

The `inline-styles` codemod remains dry-run classification only and emits governed exception stubs for cases that require design-token review.

## Accessibility

- contrast-sensitive backgrounds use semantic roles, not arbitrary color values
- focus indicators cannot be disabled by safe-style props
- `screen-reader-only` keeps content available to assistive technology
- overflow regions should be labelled when independently scrollable
- media frames must preserve meaningful `alt` text on the media element
- forced-colors mode is declared through `data-gds-forced-colors`
- consumer stylesheets must not override GDS focus, forced-colors or reduced-motion rules (`global-css.element-selectors`, `global-css.important`)
- fixed and sticky chrome stays below GDS dialogs, so a focus-trapped dialog is never covered (`global-css.z-index`, WCAG 2.4.11)

## Operational Behavior

- invalid styling values fail at TypeScript compile time
- `strict.inline-style` runs only when `compliance.strictMode` is `true`
- no secrets, credentials, user data, or source contents are emitted by helpers
- rollback is additive: revert the helper usage or pin the previous package version

## Verification

Run:

```bash
npm run build
npm run test:run
npm run verify:release
```

The core tests cover token resolution, scanner marker attributes, responsive visibility CSS, media fit/aspect behavior, overflow policy, and compliance remediation text.
