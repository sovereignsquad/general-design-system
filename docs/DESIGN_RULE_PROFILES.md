# Design Rule Profiles

Status: Active SSOT
Version: 6.4.0
Last updated: 2026-08-21

Design rule profiles are GDS's answer to a question every brand theme eventually asks: not
just "does this pass contrast," but "does this *look designed*" — by the same established,
named conventions a human designer would cite. GDS states a theme's answer as a computed,
verifiable fact rather than a subjective claim: the 60-30-10 color-proportion rule, a named
modular type-scale ratio, and a hue-angle color-harmony classification, all read from the
theme's own real values, never hand-typed.

This is the narrative entry point for the whole system (milestone: Design Rule Profiles,
issues [#643](https://github.com/sovereignsquad/general-design-system/issues/643)–[#653](https://github.com/sovereignsquad/general-design-system/issues/653)).
Each linked section below is the detailed technical reference; this document connects them.

## Research grounding

Three established design conventions this system encodes, cited from this milestone's own
originating research (tracking issue [#654](https://github.com/sovereignsquad/general-design-system/issues/654)):

- **The 60-30-10 rule** — a page's color should split roughly 60% dominant/neutral surface,
  30% secondary/brand-chrome, 10% scarce accent
  ([Wix: "What Is the 60-30-10 Color Rule?"](https://www.wix.com/wixel/resources/60-30-10-color-rule),
  [UX Planet: "The 60-30-10 Rule"](https://uxplanet.org/the-60-30-10-rule-a-simple-way-to-creating-catchy-user-interfaces-e9e2cf957213)).
  GDS can only classify *intended token role*, not control what fraction of a real rendered
  page ends up which color (a page-composition decision, not a token decision) — see
  "Declared vs. measured," below.
- **Named modular type-scale ratios**
  ([Creative Market: "What is a Typographic Scale?"](https://creativemarket.com/blog/typographic-scale))
  — the six historically named ratios: 1.067 (Minor Second), 1.125 (Major Second), 1.2
  (Minor Third), 1.25 (Major Third), 1.333 (Perfect Fourth), 1.5 (Perfect Fifth), 1.618
  (Golden Ratio). A modular scale computes `size(n) = base × ratio^n`.
- **Color-harmony classification**
  ([The Color Atlas: "Color Harmony & Relationships"](https://thecoloratlas.org/color-harmony-relationships/))
  — the standard color-wheel relationships: monochromatic (0° hue difference), analogous
  (30°), triadic (120°), split-complementary (150°), and complementary (180°), each with a
  tolerance band; anything outside every band, or where a color reads as near-gray,
  classifies `custom`.

The wider milestone also drew on Dieter Rams' ten principles for good design, Nielsen's
usability heuristics, the 8-point grid, Gestalt principles, Material Design 3's tonal-palette
color roles, and WCAG 2.2 contrast requirements as general design-quality framing — see #654
for the full source list. Only the three conventions above became a computed, gated axis;
the rest informed the milestone's scope without becoming their own classification mechanism.

## The `GdsDesignRuleProfile` contract (#643)

`GdsThemeAxes` carries an eighth, optional axis (`packages/gds-theme/src/axes.ts`):

```ts
export interface GdsDesignRuleProfile {
  colorProportion: {
    rule: GdsColorProportionRule;              // '60-30-10' | 'none'
    classification: GdsColorProportionClassification;
  };
  colorHarmony: GdsColorHarmony;                // 'complementary' | 'analogous' | 'triadic'
                                                 // | 'split-complementary' | 'monochromatic' | 'custom'
  typeScale: { ratio: GdsTypeScaleRatio };      // one of the six named ratios above
  contrastTarget: GdsContrastTarget;            // 'AA' | 'AAA'
}
```

`GDS_DEFAULT_DESIGN_RULE_PROFILE` — no proportion claim (`rule: 'none'`), `custom` harmony,
`1.25` (Major Third) type scale, `AA` contrast — is a profile every existing theme already
satisfies with zero behavior change; the axis is additive. `validateGdsDesignRuleProfile(profile,
themeId)` throws a single `GdsAxisError` on the first violation found (matching the file's own
`validateGdsShapeAxis`/`validateGdsDensityAxis` pattern), including a check that a role never
appears in more than one proportion class and that `rule: 'none'` cannot carry a non-empty
classification.

## Classification: how the numbers are computed, not asserted

### Color proportion (#644)

Every `BrandSemanticRole` (`packages/gds-theme/src/semantic-token-source.ts`) — the same role
names every preset emits, shared identically across all 25 presets since role *meaning* is
preset-independent — is classified into exactly one of three arrays in
`packages/gds-theme/src/color-proportion-classification.ts`:

- `DOMINANT_ROLES` — large-surface roles (`bg.*`, `text.*`, `border.card`, disabled controls).
- `SECONDARY_ROLES` — brand-chrome roles (`brand.primary`, `brand.primaryPressed`, `support`).
- `ACCENT_ROLES` — scarce-signal roles (`brand.accent`, `accent`, `price`, `star`, `state.*`,
  `badge.*`, `focus.ring`).

```ts
import { resolveGdsColorProportionProfile } from '@sovereignsquad/gds-theme';

resolveGdsColorProportionProfile('class-usa');
// { rule: '60-30-10', classification: { dominant: [...], secondary: [...], accent: [...] } }
```

This is a claim about *intended token usage* — how many role names fall in each class — not
measured rendered pixels. See "Declared vs. measured," below.

### Type-scale ratio (#645)

`resolveGdsTypeScaleProfile(presetId)` (`packages/gds-theme/src/type-scale-profile.ts`) reads
the live `GDS_DEFAULT_TYPOGRAPHY_AXIS.scale.ratio` (or a preset's overriding axis) and asserts
it against the six named ratios — never a hardcoded literal, so the returned name cannot drift
from the value actually driving typography math:

```ts
import { resolveGdsTypeScaleProfile, NAMED_TYPE_SCALE_RATIO_LABELS } from '@sovereignsquad/gds-theme';

const { ratio } = resolveGdsTypeScaleProfile('class-usa'); // 1.125
NAMED_TYPE_SCALE_RATIO_LABELS[ratio]; // 'Major Second'
```

This ratio governs only the `2xs`/`2xl`/`3xl`/`4xl` text steps; `xs`–`xl` are
Mantine-inherited non-uniform overrides, not on the modular scale (see THEME_GOVERNANCE.md's
"Raw token scale vs. Mantine-rendered scale" section).

### Color harmony (#646)

`resolveGdsColorHarmonyProfile(presetId)` (`packages/gds-theme/src/color-harmony-classification.ts`)
converts a preset's actual `primary`/`accent` hex values (`vibe-themes.ts`) to HSL and buckets
the hue-angle distance between them against the five named angles (each ±15°):

```ts
import { resolveGdsColorHarmonyProfile } from '@sovereignsquad/gds-theme';

resolveGdsColorHarmonyProfile('sunset'); // one of the six GdsColorHarmony values
```

This measures only the primary/accent hue relationship, not a full-palette analysis, and is
independent of WCAG contrast — a theme's contrast obligations are unaffected by whether its
hues form a named harmony.

## Enforcement (#647, #652)

Classification is descriptive metadata unless something enforces it. Two independent
enforcement points, source-level only — neither has visibility into rendered pixels:

- **Dev-time, in the running app**: `createBrandTheme`'s `overrides` escape hatch is checked
  against the theme's own accent-classed tokens; a `background`/`backgroundColor`/`bg` key
  matching one fires a dev-only `gdsDevWarnOnce`, once per call, naming the offending value —
  a warning, not a thrown error, since governed roles already win over the collision at render
  time.
- **Lint-time, across any source file**: `@sovereignsquad/gds-eslint-config`'s
  `no-accent-as-background` rule flags any accent-classed `--gds-*` custom property used as a
  `background`/`backgroundColor`/`bg` value. It's opt-in (`accentBackgroundVariables`, backed
  by the generated `ACCENT_BACKGROUND_VARIABLES` list) since the rule has no built-in default
  list — see `packages/gds-eslint-config/README.md` for the option shape and
  `allowedAccentBackgrounds` (the reviewed exceptions this repo's own source already needs: a
  CTA fill, a badge fill, an active-tab indicator — the intended small-surface use of an
  accent token, not a scarcity violation).
- **CI-time, without running the app**: `gds-compliance check-design-rules` (below) scans
  committed source for the same misuse, plus any `createBrandTheme(...)` call with no
  `designRuleProfile` at all.

## Measurement: declared vs. measured (#649, #650)

Every classification above is a claim about *intended* token usage — the only way to check
whether a rendered page actually lands close to it is to measure real pixels.
`npm run audit:design-rule-coverage` (`scripts/audit/design-rule-coverage.mjs`) does exactly
that: for every shipped preset × light/dark scheme, across a fixed four-route sample (`/`,
`/patterns/public`, `/components`, `/themes`), it captures every visible element's rendered
background-color area via a headless-Chrome CDP session, classifies each resolved color
against #644's `dominant`/`secondary`/`accent` split, and area-weights the result into
`audit/design-rule-coverage.json`.

**Scope and honesty**: this measures only `apps/playground` — GDS cannot see a consumer's
rendered app — and the artifact's own `methodology` field states its exclusions plainly:
`background-image`/gradient/SVG-fill paint is excluded from measurement entirely (not counted
as unclassified); overlapping elements are summed independently, not resolved to one
topmost-paint-per-pixel; a meaningful share of rendered area comes from the `--gds-vibe-*`
atmosphere variables, deliberately outside #644's classification scope, and lands in
`unclassified` without representing a violation. Regenerate the artifact to see current
numbers — this document does not restate them as static prose that could drift from the
committed measurement.

`audit/budgets.json`'s `designRuleUnclassifiedRate` entry tracks the worst-case (highest)
`unclassified` percentage across all 25 presets via `npm run verify:budgets`'s standard
ratchet mechanism. It is `advisory: true` — reported in the console table and PR summary, not
yet blocking `verify:release` — since this is a brand-new, single-release-old measurement
mechanism; graduating it to blocking is an explicit future decision, not automatic.

## Seeing it live: the Theme Lab (#651)

Every measurement above is otherwise only visible in a JSON artifact, a test, or source.
`GdsDesignRuleProfilePanel` (`packages/gds-core/src/GdsDesignRuleProfilePanel.tsx`), wired
into `ReferenceThemeExplorer` on [`/themes`](https://sovereignsquad.github.io/general-design-system/themes),
renders two donut charts — declared role classification vs. measured rendered reality for the
selected preset — plus type-scale and color-harmony badges, updating live on preset switch.
Every number is read at render time from the live resolvers above and a generated copy of the
`audit/design-rule-coverage.json` artifact — never a hand-typed literal.

## Adopting it

`createBrandTheme`'s three overloads (`'class-usa'`, `'gold-athlete'`, and the generic
five-ramp entry point) all accept an optional `designRuleProfile`, defaulting to the computed
profile for a named preset or `GDS_DEFAULT_DESIGN_RULE_PROFILE` for a custom brand, and return
it on the result so a caller can inspect what was actually applied:

```ts
import { createBrandTheme } from '@sovereignsquad/gds-theme';

const { mantineTheme, designRuleProfile } = createBrandTheme('class-usa', { fonts });
designRuleProfile.colorProportion.rule; // '60-30-10'
```

Verify a codebase's own adoption without running the app:

```bash
npx gds-compliance check-design-rules --manifest ./gds-adoption.json --format text
```

```text
GDS compliance check found 2 issue(s):
- [warn] design-rule.accent-as-background (src/components/Hero.tsx:42): Token "--gds-brand-accent" is classified accent (issue #644) -- meant to be scarce, never a background fill.
- [warn] design-rule.missing-profile (src/theme.ts:10): createBrandTheme(...) call has no designRuleProfile (issue #648) -- adoption-visibility signal, not a hard requirement.
```

Both findings are `warn` by default (exit code `0`). Add `compliance.designRuleProfile.enforced:
true` to `gds-adoption.json` to make `accent-as-background` an `error` and fail CI —
`missing-profile` stays `warn`-only either way, since it names an adoption gap, not a
violation. See `docs/CLASSSCOUT_INTEGRATION.md`'s "Design rule profile" section for this same
example in the context of a full real consumer integration.

Adoption is incremental and composable, not all-or-nothing: a consumer can use
`createBrandTheme`'s `designRuleProfile` without wiring `check-design-rules` into their own
CI, wire the lint rule without the CLI, or any other subset — each mechanism above is
independently useful.

## FAQ

**Why isn't 60-30-10 a hard blocking gate?** Because GDS cannot control what fraction of a
real rendered page ends up which color — that's a page-composition decision the consumer
makes, not something a token system can enforce. What GDS *can* do, and does, is classify its
own tokens by intended role-frequency (#644) and measure how close its own reference site
actually lands (#649/#650) — honestly reporting the gap rather than hiding it behind a
passing gate that doesn't mean what it implies.

**Why do declared and measured proportions sometimes disagree?** They are two different
metrics. Declared/intended (#644) counts *token roles* — how many named roles fall in each
class, regardless of how often any one of them is actually used on a page. Measured/rendered
(#649) counts *pixel area* — how much of the actual rendered surface is painted from each
class, including area painted by the `--gds-vibe-*` atmosphere variables that #644 never
classified at all. A preset can declare a clean 60-30-10 role split and still measure
differently, because measured reality also depends on page composition and atmosphere
styling that classification was never scoped to capture. Neither number is presented as more
"correct" than the other — see the panel's own on-page framing.
