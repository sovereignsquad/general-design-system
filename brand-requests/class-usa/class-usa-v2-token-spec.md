# class-usa lane — v2 re-base spec

Read-only handoff. Every value below is ready to paste; the branch, issue, build and
`verify:*` runs still need someone with write access to the repo.

## Decisions taken (from the intake form)

- Re-base `class-usa` in place. No deprecated names, values or aliases left behind.
- Ramps renamed to roles; the exported type becomes `ClassUsaColorRampName =
  'navy' | 'brand' | 'action' | 'trust' | 'cream' | 'slate'` (six, not five).
- Mantine colour keys rename to match: `classUsaNavy`, `classUsaBrand`,
  `classUsaAction`, `classUsaTrust`, `classUsaCream`, `classUsaSlate`.
- `primaryColor` stays `classUsaNavy` for chrome; `Button.defaultProps.color`
  becomes `classUsaAction` so CTAs read orange.
- Fonts: display `Playfair Display`, body `Inter`. Bogart and Garet removed.
- Radius: buttons 12px, cards 16px, pills only on Chip and Badge.
- Flat in-product; one soft warm glow retained for marketing/hero only.
- Catalog label stays "Class USA".
- New generic font lane `playfair-display`.

## Colour ramps

```ts
const classUsaDefaultColorRamps: ClassUsaColorRamps = {
  navy:   ['#e9eef6','#cdd8e6','#a3b6cc','#7691b0','#4e6d92','#2a4a70','#0f2c4a','#0c243d','#0a1d31','#071626'],
  brand:  ['#fdeee6','#fbd8c6','#f9bb9c','#f79c70','#f68a55','#f5793b','#e0641f','#c25317','#9e4312','#7a330d'],
  action: ['#fbe9df','#f6cdb8','#eda customary','#e08a52','#d4691f','#c85307','#c24a0a','#a33e07','#843205','#652604'],
  trust:  ['#eef5f0','#d8e7dd','#b6d2c0','#92bca2','#71a586','#5a9370','#4f8a5b','#3f6f4a','#31573a','#24402b'],
  cream:  ['#faf7f1','#f4eee2','#ece3d1','#e3d6bd','#d9c9a8','#cdba92','#bfad80','#a8946a','#8a7a57','#6b5e44'],
  slate:  ['#f7f8fa','#eceef2','#d9dde4','#c0c6d0','#a2aab7','#848d9c','#5b6573','#48505c','#373d47','#262b33'],
};
```

Anchors: navy `[6] #0F2C4A`, brand `[5] #F5793B`, action `[6] #C24A0A`,
pressed `[7] #A33E07`, trust `[6] #4F8A5B`, cream `[0] #FAF7F1`, slate `[6] #5B6573`.

One step above is a placeholder and must be replaced before build — `action[2]`
is written as text, not hex, deliberately, so the ramp cannot ship unreviewed.
Suggested value: `#e8a87c`.

## Semantic tokens

Dark canvas is neutral charcoal per the ruling; navy is kept for accents and the
inverse shell only.

| Role | light | dark |
| --- | --- | --- |
| brand.primary | `#0f2c4a` | `#f2ede4` |
| brand.primaryPressed | `#071626` | `#071626` |
| brand.accent | `#c24a0a` | `#f5793b` |
| accent | `#c24a0a` | `#f5793b` |
| support | `#4f8a5b` | `#8fc2a0` |
| bg.canvas / bg.page | `#faf7f1` | `#14171c` |
| bg.card / bg.surface | `#ffffff` | `#1c2027` |
| bg.inverse | `#0f2c4a` | `#0f2c4a` |
| border.card | `#e6e1d8` | `#2c323b` |
| text.body / text.primary | `#1f3a5c` | `#f2ede4` |
| text.meta / text.secondary | `#5b6573` | `#b8bfc9` |
| text.onInverse | `#faf7f1` | `#faf7f1` |
| nav.inactiveOnInverse | `rgba(250,247,241,0.72)` | `rgba(250,247,241,0.72)` |
| price | `#c78a2c` | `#e0a23c` |
| star | `#c24a0a` | `#f5793b` |
| state.success | `#4f8a5b` | `#8fc2a0` |
| state.warning | `#c78a2c` | `#e0a23c` |
| state.danger | `#b3261e` | `#f2786f` |
| state.info | `#1d6fa5` | `#6fb6e8` |
| badge.attention | `#c24a0a` | `#f5793b` |
| badge.validation | `#4f8a5b` | `#8fc2a0` |
| badge.info | `#f6f1ea` | `#232830` |
| badge.urgencyBg | `#fdede3` | `#4a2410` |
| focus.ring | `#c24a0a` | `#f5793b` |
| control.disabledBg | `#f1efea` | `#2c323b` |
| control.disabledText | `#7a7f88` | `#8a919c` |

The light/dark split on the accent is the point of the whole re-base: `#C24A0A`
carries text on warm white, `#F5793B` carries it on charcoal. Neither works in
the other scheme.

## Contrast, computed

| Pairing | Ratio | Gate |
| --- | --- | --- |
| `#0f2c4a` on `#faf7f1` | 12.5:1 | AA / AAA |
| `#1f3a5c` on `#ffffff` | 9.9:1 | AA / AAA |
| `#5b6573` on `#faf7f1` | 5.5:1 | AA |
| `#ffffff` on `#c24a0a` | 4.9:1 | AA — the `primary-button` gate |
| `#c24a0a` on `#faf7f1` | 4.6:1 | AA, narrow — do not lighten |
| `#f2ede4` on `#1c2027` | 14.0:1 | AA / AAA |
| `#f5793b` on `#1c2027` | 6.0:1 | AA |
| `#faf7f1` on `#0f2c4a` | 12.2:1 | AA — `text.onInverse` |

Computed from the sRGB relative-luminance formula, same maths as
`brandContrastRatio`. They are a desk check, not a substitute for
`getComputedStyle()` readings on rendered routes.

## Files to change

- `packages/gds-theme/src/brand-tokens.ts` — ramp type, defaults, merge,
  validator (`REQUIRED_RAMPS` grows to six), `deriveClassUsaSemanticTokens`,
  Mantine colour keys, fonts, radii, `Button.defaultProps.color`.
- `packages/gds-theme/src/vibe-themes.ts` — `class-usa` entry and
  `classUsaSemanticCssVariables`; every key keeps its `-dark` sibling.
- `packages/gds-theme/src/theme-presets.ts` — catalog description only; id and
  label unchanged.
- `packages/gds-theme/src/font-lanes.ts` — add the `playfair-display` lane.
- `packages/gds-theme/src/brand-tokens.test.ts`,
  `vibe-themes.test.ts`, `GdsProvider.test.tsx` — three assertions currently
  pin the old palette: `primary === '#0b223e'`,
  `--gds-brand-primary === '#0b223e'`, and `primaryColor === 'classUsaNavy'`.
  The first two change; the third holds.

## Proposed issue

**Title:** Re-base the class-usa brand lane onto the ClassScout v2 palette

**Body:** The class-usa lane still ships the retired navy/terracotta/sage
palette and declares Bogart and Garet, neither of which is loadable from any
font lane. Re-base it: six role-named ramps, navy chrome with an orange action
colour, a Playfair Display font lane, and separately-authored dark values for
every semantic role. No aliases or deprecated names retained. Breaking change
to `ClassUsaColorRampName` and the `classUsa*` Mantine colour keys; old-to-new
key mapping in the PR description.

Write it as "issue 532" style with no hash anywhere that the compliance
scanner reads.

## Verification still owed

Theme Lab light and dark, operations / foundations / data pattern routes, live
demos, `verify:forced-colors-runtime`, `verify:theme-trust-runtime`,
`verify:token-contrast-scoring`, and package tests for the lane — run locally
first, and do not describe the deployed site as updated until it is.
