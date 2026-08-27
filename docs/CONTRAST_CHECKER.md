# Consumer Contrast Checker

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-08-08

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

## How this relates to the other contrast surfaces

GDS has three contrast surfaces; reach for the right one:

| Surface | Scope | Use when |
|---|---|---|
| `getGdsContrastRatio` / `checkGdsContrast` (this doc) | **your own** arbitrary color pair | You're validating a brand or custom color before you ship it. |
| `createGdsThemeAccessibilityReport` / `validateGdsThemeAccessibility` ([`THEME_GOVERNANCE.md`](../THEME_GOVERNANCE.md)) | a whole **GDS theme's** semantic roles | You extend or generate a theme and want a full role-by-role readiness report. |
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
- **Parsing is intentionally strict** — `#hex`, `rgb()`, `rgba()` only. Named
  CSS colors, `hsl()`, and `color()` are not parsed (they'd need a DOM to
  resolve reliably); convert to one of the accepted forms first.
