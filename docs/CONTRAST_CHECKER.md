# Consumer Contrast Checker

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

GDS hard-gates the contrast of its **own** readable-text token pairs in CI
(`verify:token-contrast-scoring`, see [`THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md)).
This is the same WCAG 2.x math, surfaced as a small, pure, **server-safe** API
(issue #453) so a consumer can score *their own* pairs — brand colors, custom
surface tokens, a one-off badge color — against the WCAG AA/AAA thresholds
before shipping, instead of eyeballing them or re-implementing the formula.

## Package API

Exported from `@sovereignsquad/gds-theme` and its `/server` and `/client`
entrypoints (pure data — no React, no DOM, safe in a Server Component, a route
handler, or a build script):

- `getGdsContrastRatio(foreground, background)` → `number`
- `checkGdsContrast(foreground, background, options?)` → `GdsContrastResult`
- `pickGdsAutoForeground(background, options?)` → `string`
- Types: `GdsContrastLevel`, `GdsContrastTextSize`, `GdsContrastResult`, `GdsAutoForegroundOptions`

### `getGdsContrastRatio(foreground, background)`

Returns the WCAG 2.x contrast ratio (1–21, rounded to 2 decimals) between two
colors. Accepts `#hex` (3- or 6-digit), `rgb()`, and `rgba()` strings. A
translucent foreground (alpha < 1) is composited over the background first, so
the scored color is the one a user actually sees. **Throws** if either color
cannot be parsed.

```ts
import { getGdsContrastRatio } from '@sovereignsquad/gds-theme';

getGdsContrastRatio('#000000', '#ffffff'); // 21   (max)
getGdsContrastRatio('#767676', '#ffffff'); // 4.54 (the classic AA-normal boundary gray)
getGdsContrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff'); // ratio of 50%-black composited on white
```

### `checkGdsContrast(foreground, background, options?)`

Checks a pair against a WCAG threshold and reports the ratio, the required
minimum, and whether it passes. Defaults to the GDS baseline — **AA, normal
text (4.5:1)** — the same bar `verify:token-contrast-scoring` hard-gates GDS's
own readable-text pairs at.

```ts
import { checkGdsContrast } from '@sovereignsquad/gds-theme';

checkGdsContrast('#767676', '#ffffff');
// { ratio: 4.54, required: 4.5, passes: true, level: 'AA', size: 'normal' }

checkGdsContrast('#767676', '#ffffff', { level: 'AAA' });
// { ratio: 4.54, required: 7, passes: false, level: 'AAA', size: 'normal' }

checkGdsContrast('#8f8f8f', '#ffffff', { size: 'large' });
// { ratio: 3.23, required: 3, passes: true, level: 'AA', size: 'large' }
```

`options`:

| Option | Values | Default | Meaning |
|---|---|---|---|
| `level` | `'AA'` \| `'AAA'` | `'AA'` | WCAG conformance level. |
| `size` | `'normal'` \| `'large'` | `'normal'` | `'large'` = ≥ 18pt, or ≥ 14pt bold. |

Thresholds (WCAG 1.4.3 / 1.4.6):

| | `normal` | `large` |
|---|---|---|
| **AA** | 4.5 | 3 |
| **AAA** | 7 | 4.5 |

### `pickGdsAutoForeground(background, options?)`

Picks a foreground color that reads clearly against `background` — the
"what text/icon color goes on top of this badge?" question a component
renders with, as opposed to `checkGdsContrast`'s "does this specific pair
pass?" question. Tries each of `options.candidates` (default
`['#ffffff', '#000000']`) in order and returns the first one that clears the
requested WCAG threshold; if none clear the bar outright (a rare
mid-luminance `background`), returns whichever candidate scored the highest
ratio, so the result is always the *best available* choice rather than an
arbitrary default. **Never throws** — an unparseable `background` or
candidate falls back to the first candidate instead of propagating an error,
since this is meant to be safe to call directly in a render path over a
caller-supplied color GDS doesn't control.

```ts
import { pickGdsAutoForeground } from '@sovereignsquad/gds-theme';

pickGdsAutoForeground('#155724'); // '#ffffff' — white clears AA on that dark green
pickGdsAutoForeground('#f5f5f5'); // '#000000' — black clears AA on that near-white
pickGdsAutoForeground('#808080', { level: 'AAA' });
// '#000000' — neither candidate clears 7:1, so the higher-scoring one (black, ~5.32:1) wins
pickGdsAutoForeground('not-a-color'); // '#ffffff' — unparseable input, safe default
```

`options` adds one field on top of `checkGdsContrast`'s `level`/`size`:

| Option | Values | Default | Meaning |
|---|---|---|---|
| `candidates` | `string[]` | `['#ffffff', '#000000']` | Foreground colors to try, in preference order. |

This exists because neither obvious alternative works for GDS's token
system: Mantine's own `autoContrast` is a structural dead end for
`var(--gds-*, fallback)` colors (its `isLightColor` check returns `false`
for any `var(...)` input, so it can never attempt a real comparison), and
`getGdsContrastRatio` — while it does the correct math — throws on
unparseable input, which would crash a render over a caller-supplied color.

## Checking a brand theme

`createBrandTheme` validates a fixed set of pairs
([`THEME_GOVERNANCE.md`, `createBrandTheme` contrast scope](../THEME_GOVERNANCE.md#createbrandtheme-contrast-scope)).
It does not validate the filled CTA against its label, the accent roles used as text, or the
focus ring, and no GDS gate scores a consumer's own theme. Score those pairs in a test or build
script:

```ts
import { getPrimaryShade, isLightColor, type MantineTheme } from '@mantine/core';
import { checkGdsContrast, createBrandTheme, pickGdsAutoForeground } from '@sovereignsquad/gds-theme/server';

// brandColors and fonts are the product's own createBrandTheme inputs.
const { mantineTheme, cssVariables } = createBrandTheme({ brandColors, fonts });

// The fill a filled primary Button paints, and the label Mantine paints on it.
function filledPrimary(theme: MantineTheme, scheme: 'light' | 'dark') {
  const ramp = theme.colors[theme.primaryColor];
  const fill = ramp[getPrimaryShade(theme, scheme)];
  // Under `autoContrast`, Mantine picks the label from the light-scheme shade in both schemes.
  const lightFill = ramp[getPrimaryShade(theme, 'light')];
  const label = theme.autoContrast && isLightColor(lightFill, theme.luminanceThreshold) ? theme.black : theme.white;
  return { fill, label };
}

for (const scheme of ['light', 'dark'] as const) {
  const { fill, label } = filledPrimary(mantineTheme, scheme);
  checkGdsContrast(label, fill); // filled CTA label: 4.5:1
  // A label that passes, chosen from the theme's own colours, when the one above does not:
  pickGdsAutoForeground(fill, { candidates: [mantineTheme.white, mantineTheme.black] });

  const suffix = scheme === 'dark' ? '-dark' : '';
  const page = cssVariables[`--gds-bg-page${suffix}`];
  for (const role of ['--gds-brand-accent', '--gds-accent', '--gds-price', '--gds-star']) {
    checkGdsContrast(cssVariables[`${role}${suffix}`], page); // accent roles rendered as text: 4.5:1
  }
  checkGdsContrast(cssVariables[`--gds-focus-ring${suffix}`], page, { size: 'large' }); // non-text: 3:1
}
```

- Use this check for the theme that reaches `GdsProvider`. A product that keeps `cssVariables` but
  builds its own Mantine theme scores its own theme with `filledPrimary`. Build it with
  `createPublicBrandTheme`, which returns a complete `MantineTheme` with `primaryShade`,
  `white`, `black` and `luminanceThreshold` resolved; the fill is read from
  `getPrimaryShade`, never assumed to be a fixed step.
- The label is `theme.white` unless `autoContrast` is set. A theme that sets `white` to an
  off-white is scored with that value.
- If the theme sets `components.Button.defaultProps.color` (the `'class-usa'` overload does),
  filled Buttons paint that palette instead of `primaryColor`; read the fill from it.
- Under an active preset (`data-gds-theme-preset` on `<html>`), `styles.css` repaints filled
  Buttons from `--gds-vibe-primary` with `--mantine-color-white`; score that pair for the CTA
  instead. The floor rule `primary-cta-text-contrast` reports that pair for built-in presets
  ([`ACCESSIBILITY_FLOOR.md`](ACCESSIBILITY_FLOOR.md)).
- The focus ring is non-text (WCAG 1.4.11, 3:1). `checkGdsContrast` has no non-text mode;
  `size: 'large'` applies the same 3:1 threshold.
- `size: 'large'` is valid for a text pair only when the rendered label is large text: at least
  18pt (24px) regular or 14pt (about 18.66px) bold. The rendered font size and weight decide
  it, not the component's `size` prop. A pair below 3:1 fails either way.
- The colour roles `createBrandTheme` emits for these pairs are concrete values. Resolve any
  `var()`, `light-dark()` or `color-mix()` value to `#hex`, `rgb()` or `rgba()` before scoring
  it; `checkGdsContrast` throws on them.

### Brand text on role surfaces

A brand ramp step used as text is scored against every surface it renders on, in each scheme the
product renders. No exported resolver returns the default role values for a non-preset lane;
take them from the [role table](SEMANTIC_ROLE_TOKENS.md#the-default-role-values). `Card`,
`Paper` and the `GdsProvider` wrapper paint `--mantine-color-body`, which Mantine sets to
`theme.white` in the light scheme and `theme.colors.dark[7]` in the dark scheme.

```ts
function scoreBrandText(theme: MantineTheme, color: string, schemes: ('light' | 'dark')[]) {
  const surfaces = {
    light: [theme.white /* , light role surfaces the text sits on */],
    dark: [theme.colors.dark[7] /* , dark role surfaces the text sits on */],
  };
  return schemes.flatMap((scheme) => surfaces[scheme].map((surface) => checkGdsContrast(color, surface)));
}
```

A step that passes in one scheme is not guaranteed in the other. A single-scheme product pins
the scheme ([`THEME_GOVERNANCE.md`, Colour scheme](../THEME_GOVERNANCE.md#colour-scheme)) and
scores that scheme only. Worked example:
[`THEME_GOVERNANCE.md`, Appendix: Amanoba dark shell + yellow CTA](../THEME_GOVERNANCE.md#appendix-amanoba-dark-shell--yellow-cta).

### Tenant seed colour

A colour supplied at runtime by a tenant or creator (`seed`) is caller data. The rules for using
it are in [`THEME_GOVERNANCE.md`, Tenant seed colour](../THEME_GOVERNANCE.md#tenant-seed-colour).

```ts
import { checkGdsContrast, pickGdsAutoForeground } from '@sovereignsquad/gds-theme';

// seed: the tenant colour, already resolved to #hex, rgb() or rgba().
// surfaces: the concrete colours the seed sits next to, for each scheme the product renders.
function checkTenantSeed(seed: string, surfaces: string[]) {
  const label = pickGdsAutoForeground(seed);
  return {
    label,
    labelOnFill: checkGdsContrast(label, seed), // 4.5:1
    fillOnSurfaces: surfaces.map((surface) => checkGdsContrast(seed, surface, { size: 'large' })), // 3:1
  };
}
```

- When `labelOnFill.passes` is `false`, no candidate reaches 4.5:1 on that seed
  (`pickGdsAutoForeground` returned the best-scoring one), and the seed cannot be a filled
  control colour.
- A `var()` seed is not measured: `pickGdsAutoForeground` returns its first candidate and
  `checkGdsContrast` throws. Resolve it first.
- A 3-digit hex parses. A hex with alpha digits appended does not, and `checkGdsContrast`
  throws on it; derive tints with `color-mix()` instead.

## How this relates to the other contrast surfaces

GDS has three contrast surfaces; reach for the right one:

| Surface | Scope | Use when |
|---|---|---|
| `getGdsContrastRatio` / `checkGdsContrast` (this doc) | **your own** arbitrary color pair | You're validating a brand or custom color before you ship it. |
| `createGdsThemeAccessibilityReport` / `validateGdsThemeAccessibility` ([`THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md)) | **GDS's built-in presets**, role by role, both schemes | You want the readiness report for the shipped presets. Both take no argument and score only the presets from `getGdsVibeThemes()`; they cannot score a consumer theme. For your own theme, see [Checking a brand theme](#checking-a-brand-theme). |
| `verify:token-contrast-scoring` (CI gate) | **GDS's shipped** token pairs | Never called by consumers — it's how GDS holds its own tokens to the bar. |

The ratio math is identical across all three; these differ only in what they
score and whether they run in your app or in GDS's release pipeline.

## Notes & limits

- **Composition only for the foreground.** A translucent *background* is not
  composited against a further-back layer — pass the effective (already
  composited) background you want scored.
- **WCAG 2.x only.** This is the ratio-based WCAG 2.0/2.1/2.2 algorithm, the
  same one GDS gates on. It is not APCA (WCAG 3 draft); GDS does not ship an
  APCA scorer today.
- **Parsing is intentionally strict** — `#hex` (3 or 6 digits), `rgb()`, `rgba()` only. Named
  CSS colors, `hsl()`, `color()`, `var()`, `light-dark()`, `color-mix()` and 4- or 8-digit
  hex are not parsed (they'd need a DOM to resolve reliably); convert to one of the accepted
  forms first.
- **`passes` compares the rounded ratio.** The ratio is rounded to two decimals before it is
  compared with the threshold, so a pair whose unrounded ratio is less than 0.005 below the
  threshold reports `passes: true`.
