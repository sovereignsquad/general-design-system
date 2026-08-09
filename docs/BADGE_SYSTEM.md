# Badge System

Status: Active SSOT
Version: 5.0.2
Last updated: 2026-08-08

The unified, always-theme-aware GDS badge system (epic #484): one governed
family for status labels, category tags, counts, removable filter tokens, and
composed shape+icon marks, working on **all 25 theme presets** without
per-preset escape hatches.

## The pieces

| Component | Job | Never |
|---|---|---|
| `GdsBadge` | Static status/meaning label (semantic `tone` or curated `accent`) | Interactive |
| `GdsCountBadge` | Numeric/dot count, corner-anchorable | Carries text labels |
| `GdsRemovableTag` | Removable filter token (whole chip is a button) | Static decoration |
| `GdsBadgeStack` + `GdsBadgeStackLayer` | Composition primitive: layered shape+icon+corner marks | A visible pattern by itself |
| `GdsBadgeShapes` (`GdsBadgeShape*`) | Six silhouettes from Tabler's own geometry | Hand-drawn SVG |
| `GdsMapPinBadge` | Category-colored map-pin marker, pin + icon only, correct by construction (issue #501) | A build-it-yourself pin composition, a ring/capsule layer |

Legacy `StatusBadge`/`LabelTag`/`CountBadge`/`MeaningBadge`/`FitScoreChip`
remain supported; new work should prefer the components above. Migrating the
~40 inline `<Badge>` call sites is explicitly follow-up work, not this epic.

## Foundations it stands on

- **Semantic role tokens on every preset** (#485): all 25 presets define the
  full `--gds-state-*`/`--gds-badge-*`/`--gds-brand-*` role set —
  hand-authored on 2, WCAG-validated derivation
  (`deriveVibeSemanticCssVariables`) on the other 23. See
  [`SEMANTIC_ROLE_TOKENS.md`](SEMANTIC_ROLE_TOKENS.md).
- **Auto-foreground contrast helper** (#486): `pickGdsAutoForeground` picks a
  WCAG-safe foreground and never throws; the `GdsBadge` accent palette is
  verified against it in tests. See [`CONTRAST_CHECKER.md`](CONTRAST_CHECKER.md).
- **Shape vocabulary** (#487): circle, squircle, hexagon, shield, rosette,
  pin — authored via Tabler's `createReactComponent` from Tabler's own
  `iconNode` data. See [`ICON_REGISTRY.md`](ICON_REGISTRY.md).
- **Canonical icons in badges** (#494): `GdsBadge`'s `icon` prop (and legacy
  `StatusBadge`/`MeaningBadge`) renders through `GdsIcon` from the governed
  `GdsIcons` dictionary, never ad hoc SVG. This governs that closed-vocabulary
  `icon` prop specifically — `GdsBadgeStackLayer`'s composition surface is a
  separate, intentionally open contract; see "Composing icons `GdsIcons`
  doesn't have" below.

## Color: a closed two-axis union

`GdsBadge` accepts **either** a semantic `tone`
(`success | warning | danger | info | neutral`, mapped to `--gds-state-*`
with fallbacks) **or** a curated non-semantic `accent`
(`plum | indigo | ocean | teal | forest | bronze | terracotta | magenta |
slate | grape`, fixed sRGB values each ≥ 4.5:1 against white) — mutually
exclusive at the type level, no free color strings. Guidance: 8 or fewer
accent categories per surface.

```tsx
import { GdsBadge, GdsCountBadge, GdsRemovableTag } from '@sovereignsquad/gds-core';

<GdsBadge tone="success" icon="Success" label="Published" />
<GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
<GdsCountBadge value={126} cap={99} label="unread messages" />
<GdsCountBadge dot label="new activity" anchor={<GdsIcon icon="Notifications" size="lg" />} />
<GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={clear} />
```

## Hard rules

- **Meaning never lives in color alone.** `GdsBadge`/`GdsRemovableTag`
  require `label`; forced-colors flattens every badge to one system pair, and
  the shapes/icons survive because they are `currentColor` strokes.
- **No arbitrary color.** Both color axes are closed unions.
- **Counts announce correctly.** `GdsCountBadge` keeps its `role="status"`
  live region mounted even at zero (a region mounted later never announces its
  first appearance), and announces "{count} {label}" — "99+ notifications",
  never the reverse.
- **Removal is a real button.** `GdsRemovableTag`'s whole surface is a
  `<button>` with a consumer-supplied localized `removeLabel` — the component
  bakes in no language, which is why it ships no locale strings of its own.
- **Composition uses the stack.** Corner dots separate from the base mark via
  a CSS mask cutout, never a ring painted in the page background color (which
  breaks over the gradient/hero surfaces vibe themes use).

## Map markers: use `GdsMapPinBadge`, don't hand-compose one

A category-colored map-pin marker (an activity/interest icon in a filled or
outline pin, e.g. sports/food/arts/music categories) is common enough, and
easy enough to get subtly wrong by hand, that it has its own governed
component — reach for it before composing `GdsBadgeShapePin` yourself:

```tsx
import { GdsMapPinBadge } from '@sovereignsquad/gds-core';

<GdsMapPinBadge accent="ocean" icon="Location" label="Community pool" />
<GdsMapPinBadge accent="forest" icon={<IconBallFootball />} label="Riverside Field — soccer" filled />
<GdsMapPinBadge accent="forest" icon="Habit" label="Trailhead" filled fillOpacity={0.85} />
<GdsMapPinBadge accent="forest" shade="deeper" icon={<IconBallBasketball />} label="Rec Center — basketball" filled />
```

- `accent` — one of the curated 10 (never a free color; this is what makes
  categories distinguishable on a map at a glance).
- `icon` — a canonical `GdsIcons` key, **or** any externally-sourced icon
  element. Categories like sports/hobbies/interests routinely have no
  `GdsIcons` equivalent, so external sourcing (`package-coverage-gap`
  exception) is expected here, not a compliance gap to work around.
- `label` — required, and must be a real accessible name you write, **never**
  derived from the icon's own import or display name. (A real example: Tabler's
  `IconBallFootball` component displays as `"BallFootball"` — using that as
  the visible label instead of writing `"Football"` is a wrong label, not a
  stylistic choice.)
- `filled` — solid pin for real basemap imagery (the default outline mode is
  for schematic/light contexts).
- `fillOpacity` — 0–1, filled mode only, defaults to `1`. Softens the pin's
  own fill against dense basemap imagery. Never touches the icon: the icon
  layer is always fully opaque regardless of this value.
- `shade` — `'base' | 'deep' | 'deeper' | 'deepest'` (issue #502), defaults to
  `'base'`. Differentiates related sub-categories that should read as one
  accent family (e.g. several sports under one `accent`) without spending a
  second accent slot on each one — see "Within-accent differentiation: `shade`,
  not transparency" below.

**Exactly two layers — the pin, and the icon. No ring/capsule, ever.** An
earlier revision tried a ring capsule behind the icon to guarantee contrast
in filled mode, and that was wrong on both sides: filled, the opaque ring
disc ate most of the icon's own size; unfilled, the ring drawn as a second
outline added a visible circle with no contrast benefit, reading as a
"double ring" next to icons (like a soccer ball) that already draw their own
circular outline. The actual problem — the icon disappearing into a
same-color fill — is fixed directly instead: **the icon color always
contrasts the pin's own fill.** Outline mode has no fill to collide with, so
pin and icon share one `accent` color; filled mode switches the icon to an
inverse (white-on-dark) color, never `accent`, regardless of `fillOpacity`.
With no ring to share space with, the icon is sized to `0.46` of the marker
(up from `0.42`, but not the ring's old `0.62`) so it fills more of the pin
head — capped there because the pin head is a *circle*, and wide-content
icons (`IconMasksTheater`'s two side-by-side masks, `IconBike`'s two
separated wheels) render past that circle's own boundary above roughly
`0.48`. `0.46` was chosen by overlaying the pin head's solved-center circle
on the widest icons actually shipped here and confirming they stay inside
it, not by centering only round/symmetric icons and assuming the rest fit.

### Within-accent differentiation: `shade`, not transparency

`accent` is coarse by design — 10 slots for top-level categories, so a map
stays scannable at a glance (see "8 or fewer accent categories per surface"
above). That's the wrong granularity when several *related* sub-categories
(e.g. Football/Basketball/Tennis, all "sports") need to read as one family
while still being individually distinguishable. `fillOpacity` doesn't solve
this — it's transparency, not color differentiation, and does nothing in
outline mode. `shade` is the real mechanism:

```tsx
<GdsMapPinBadge accent="forest" icon={<IconBallFootball />} label="Riverside Field — soccer" filled />
<GdsMapPinBadge accent="forest" shade="deep" icon={<IconBallBasketball />} label="Rec Center — basketball" filled />
<GdsMapPinBadge accent="forest" shade="deeper" icon={<IconBallTennis />} label="Courts — tennis" filled />
<GdsMapPinBadge accent="forest" shade="deepest" icon={<IconBallVolleyball />} label="Beach — volleyball" filled />
```

**Darker-only, and that's not an arbitrary limit.** An earlier draft of this
axis (a live-computed HSL lightness shift, explored in the interactive spec
artifact before this shipped) let shades go lighter as well as darker. That
was wrong: sweeping lightness deltas across all 10 accents against the
white icon color `GdsMapPinBadge` uses in filled mode shows that
**lightening any accent — even slightly — drops some of them below the
4.5:1 WCAG AA bar the base palette already guarantees.** `teal` fails first,
at only +4 lightness; `ocean`, `bronze`, `forest`, and `terracotta` follow
shortly after. Darkening has generous headroom for all 10. `shade` only
offers the direction that stays contrast-safe: `'base' | 'deep' | 'deeper' |
'deepest'`, exported as `GdsBadgeAccentShade` alongside the precomputed
`gdsBadgeAccentShades` palette (`GdsBadge.tsx`) — 10 accents × 4 levels, 40
fixed hex values, every one verified ≥ 4.5:1 against white in badge tests,
the same bar `gdsBadgeAccentColors` itself is held to.

**Proportional spacing, not a fixed lightness delta.** Each accent's four
levels are computed by interpolating from that accent's own base lightness
down to a shared lightness floor, in three equal steps — not by subtracting
the same fixed amount from every accent. A fixed delta reaches the floor at
different points for different accents: `teal` starts darker than most, so
a shared delta would floor out its `deeper` and `deepest` steps at nearly
the same color, making them visually indistinguishable from each other.
Proportional spacing keeps all four steps distinct for every accent,
`teal` included — verified directly in tests, not just asserted.

`GdsMapPinBadge` locks in the centering, stroke-matching, and contrast
constants below by construction — including forcing `stroke={1.75}` onto
whatever icon element you pass it, even if you forgot to set it yourself.
Reach for `GdsBadge`'s own `shape="pin"` only when you need a flat inline
badge, not a standalone marker (different, smaller icon-scale contract, no
forced-external-icon-stroke handling).

## Composing icons `GdsIcons` doesn't have

The "canonical icons in badges" rule above governs `GdsBadge`/
`StatusBadge`/`MeaningBadge`'s closed `icon` prop — a `GdsIconKey`, resolved
through `GdsIcon`, full stop. It does not extend to `GdsBadgeStack` +
`GdsBadgeStackLayer` (`GdsBadgeStack.tsx`): `GdsBadgeStackLayer`'s
`children` is typed as plain `ReactNode`, not constrained to `GdsIconKey`,
and that's deliberate, not an oversight — `GdsIcon` withholds the
`className`/`style`/`ref` composition surface a layering primitive needs to
position layers against each other and against the base mark, so the stack
takes whatever icon element a consumer hands it, `GdsIcons` member or not.

This is the same vocabulary gap `GdsMapPinBadge` already documents above
(sports/hobbies/interest categories `GdsIcons` has no entry for) — compose
them as `GdsBadgeStackLayer` children directly, the same way an
externally-sourced icon element is already sanctioned for `GdsMapPinBadge`'s
own `icon` prop:

```tsx
import { GdsBadgeStack, GdsBadgeStackLayer } from '@sovereignsquad/gds-core';
import { IconBallFootball } from '@tabler/icons-react';

<GdsBadgeStack label="Football club member">
  <GdsBadgeStackLayer>
    <IconBallFootball />
  </GdsBadgeStackLayer>
</GdsBadgeStack>
```

`GdsBadgeStack`'s accessibility contract stays in force regardless of where
a layer's icon came from: give the stack a `label` and the *whole* stack
becomes `role="img"` with that label — individual layers are never labeled
on their own — or omit `label` and the whole stack is `aria-hidden`.

A direct `@tabler/icons-react` import like the one above still trips
`gds-compliance`'s `strict.import.tabler-icons` rule outside
`packages/gds-core/`, `packages/gds-admin/`, and `packages/gds-theme/` —
exactly as it should. That isn't a compliance gap to route around; it's
what the rule's own `package-coverage-gap` exception category exists for.
Declare it in `gds-adoption.json`'s `approvedExceptions`: the entry needs
the base fields every approved exception carries (`surface`, `reason`,
`owner`, `reviewDate`) plus the fields a `package-coverage-gap` exception
itself requires (`category: 'package-coverage-gap'`, `scope`,
`allowedImplementation`, `mustStillUse`, `mustNotDo`, `exitCondition`,
`status`) — see `packages/gds-compliance/index.js`'s
`EXCEPTION_REQUIRED_FIELDS` for the enforced schema.

## Hand-built shape+icon compositions must match `GdsBadge`'s own contract

`GdsBadge`'s `shape` prop is the sanctioned way to combine a `GdsBadgeShapes`
silhouette with an icon — reach for it first (or `GdsMapPinBadge` for map
markers specifically, above). When a consumer needs its own composition
instead, it must reproduce `GdsBadge.tsx`'s exact centering and stroke
contract, not eyeball it:

- **Icon scale + offset, by shape**: `scale: 0.42` **and** `translateY(-4.1667%)`
  for `shape="pin"` specifically; `scale: 0.55` with **no** offset for the
  other five shapes (circle, squircle, hexagon, shield, rosette), whose
  bounding-box center is already the right icon position. The pin's offset is
  not a value someone eyeballed: `GdsBadgeShapePin`'s head is a true circle —
  its path is an SVG arc of radius 8 — and solving that arc's own center with
  the standard endpoint-to-center formula (not approximated) puts it at
  `(12, 11)` in the pin's 24-unit path space, one unit above the path box's
  own center `(12, 12)`. `-1/24 = -4.1667%` is that exact offset. Centering on
  the path's raw bounding-box center instead (`0%` offset) is measurably
  wrong, not just a style preference — it is one full unit off the circle's
  actual center. Note the pin's tail hides more than a third of that circle
  below its chord, so the *visible* dome's own midpoint sits above this
  point; the rule here is "center on the circle," not "center on what's
  visibly rendered" — a deliberate, different rule change would be required
  to target the latter instead.
- **Matching stroke weight**: the shape and the icon must render at the same
  stroke width. Both `GdsBadgeShapePin` (and the other shapes) and `GdsIcon`
  default to `stroke={1.75}` — if either is overridden, override both the
  same way, or the icon reads thinner/thicker than its own pin outline.
- Reference implementation: `GdsBadge.tsx`'s own `shape`+`icon` composition,
  and the live "Badges on a map" section of the composition gallery below
  (real filled pins, correct centering, one accent color per marker category).
- This `0.42` scale is specific to `GdsBadge`'s small inline badge context.
  `GdsMapPinBadge` (above) is a different, larger, standalone marker with no
  ring/capsule and its own `0.46` scale + fill-contrast contract — don't
  cross-apply the two.

## Suggested shape semantics (default, not enforced)

circle = interest/count · squircle = persona · hexagon = activity ·
shield = verification · rosette = certification/award · pin = location/maps.

## Composition gallery (issue #499)

Beyond the vocabulary swatches, the badges pattern demonstrates badges
composed into the surfaces they actually ship on, using only shipped
components — no design-preview artifact stands in for this:

- **On cards** — `ProductCard`'s `status`/`footer` and `ListingCard`'s
  `score`/`reason` slots accept any node, so a `GdsBadge` replaces the plain
  status pill and a badge cluster summarizes categories/reasons.
- **Beside buttons** — `GdsCountBadge`'s `anchor` corner-anchors to an icon
  inside a real `<button>`; the button carries the accessible name, the pill
  stays decorative, and count changes announce through the badge's own live
  region. A plain `GdsBadge` can also sit beside a labeled button as a status
  echo.
- **On a map** — `MapPanel`'s `renderMap` composes `GdsBadgeShapePin` with a
  **`fill` override** (it is a Tabler *outline* icon by default) so the
  marker reads as a filled pin against basemap imagery, exactly the way
  `GdsBadge`'s own `shape="pin"` composes shape + icon internally.
- **Profile clusters** — several badges read left-to-right in a wrapping row
  beside identity. `GdsBadgeStack`'s corner model stays reserved for a
  *single* mark (e.g. a verification shield on the avatar), never a cluster.
- **In overlays** — a `GdsDialog` can confirm a badge was just earned; an
  `InlineAlert`'s `action` slot can carry a badge. Badges never render inside
  a toast body, which stays text-only for assistive tech.
- **Across themes, live** — `GdsVibeThemeScope` (new, this issue) scopes a
  subtree to one preset/scheme's `--gds-vibe-*`/`--gds-state-*`/`--gds-badge-*`
  variables, paired with `VibeThemePicker`, so the gallery proves live: `tone`
  badges read `--gds-state-success` (genuinely varies per preset — WCAG-
  derived) but `--gds-state-warning-dark`/`--gds-state-danger-dark`/
  `--gds-state-info-dark` directly (fixed anchors, byte-identical on every
  preset), while `accent` badges use fixed sRGB values that never read a CSS
  variable at all. All three are real, verified behaviors, not one uniform
  "theme-aware" claim — see `GdsVibeThemeScope`'s own tests for the
  cross-preset assertions.

```tsx
import { VibeThemePicker, GdsVibeThemeScope } from '@sovereignsquad/gds-theme';

<GdsVibeThemeScope presetId="high-contrast" scheme="light">
  <GdsBadge tone="success" icon="Success" label="Published" />
</GdsVibeThemeScope>
```

`GdsVibeThemeScope` is for side-by-side preset comparison (theme-preview
panels, this gallery); product surfaces should keep reading the app-wide
theme instead of scoping locally.

## Where to see it live

The badges pattern on the playground (`/patterns/feedback`) renders every
component above plus the full composition gallery, and the forced-colors
runtime gate asserts each stays mounted and painted under
`forced-colors: active` on that route.

## The same activity identity, worn a different way

`GdsMapPinBadge`'s accent+shade table is the asset a category owns — a
color and a glyph, grouped into families by accent and separated within a
family by shade. `GdsGeneratedThumbnail`/`GdsGeneratedHero` (epic #503) draw
from that same table to compose card thumbnails and hero backdrops, so a
category reads the same whether it's a map pin, a card motif, or a hero
badge. See [`GENERATED_IMAGERY.md`](GENERATED_IMAGERY.md).

## Badge glyph mode: Tabler icons or emoji (issue #525)

A client asked for emoji as an alternative to Tabler icons in badges, for
different purposes (a more playful surface, say, versus a formal one) —
with two hard requirements: switching to emoji is a **whole-badge-system**
choice, not a one-badge-at-a-time opt-in, and it must **never** reach
`GdsGeneratedThumbnail`/`GdsGeneratedHero`, which keep composing their
background motif and lead badge from Tabler icons regardless.

```tsx
import { GdsProvider } from '@sovereignsquad/gds-theme';
import { GdsBadge, GdsMapPinBadge } from '@sovereignsquad/gds-core';

// Set once, app-wide — every badge/pin whose category has an emoji renders
// it; one with no emoji keeps its Tabler icon even in emoji mode.
<GdsProvider defaultBadgeIconStyle="emoji">
  <GdsBadge accent="terracotta" icon="Location" emoji="🏀" label="Basketball" />
  <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Pivot Point Basketball" />
</GdsProvider>
```

- **Ambient by default, overridable per instance.** `GdsProvider`'s
  `defaultBadgeIconStyle` (`'tabler'` default, unchanged behavior for every
  existing consumer) sets the mode for every `GdsBadge`/`GdsMapPinBadge`
  below it via `GdsIconStyleContext` — a consumer's own `iconStyle` prop on
  either component overrides it locally for the rare exception.
- **The failsafe is a plain data-presence check, not a runtime probe.** A
  badge/pin with no `emoji` renders its Tabler `icon` even when the mode is
  `'emoji'` — icon is the gap-filler, not the default. Deliberately not a
  "does this device render this glyph" check: that's unreliable across
  browsers, untestable in CI without flaking (Rule 1), and would break
  `GdsGeneratedThumbnail`'s server/client determinism guarantee for a
  component that never reads `emoji` in the first place.
- **Emoji renders on a fixed dark-neutral disc, never the badge's own
  accent/tone color.** Emoji are OS-rendered color glyphs — their color
  can't be forced via CSS the way a Tabler `currentColor` stroke icon can,
  so contrast against an arbitrary accent can't be guaranteed the same way.
  `GdsBadge` renders a small `var(--mantine-color-dark-7, #1f2937)` coin
  behind the glyph; `GdsMapPinBadge` fills the whole pin with that same
  fixed color while the ring/silhouette keeps `accent` — modeled directly
  on a client-provided reference (a sports-activity map using this
  component). `filled`/`fillOpacity` have no effect while emoji is active
  on `GdsMapPinBadge` (dev-mode warning if both are set); `shape` has no
  effect while emoji is active on `GdsBadge` (same warning).
- **Always `aria-hidden`.** The required `label` carries meaning, exactly
  like `icon` today — emoji never becomes the only signal.
- **Known, accepted limitation: emoji glyph shape varies by OS/vendor**
  (Apple/Google/Microsoft/Samsung render the same codepoint differently).
  Tabler icons are self-hosted SVG and don't have this problem — that's a
  real tradeoff of choosing emoji, not something to fix here.
- **`GdsCategoryDefinition`** (`category-registry.ts`) is the shared shape
  behind a consumer's own category data: `key`, `label`, `accent`, optional
  `shade`, **required** `icon`, **optional** `emoji`. GDS ships the type and
  a `resolveGdsCategoryBadgeIcon` resolver only — no business taxonomy
  (categories like "Soccer" are a consumer's own domain vocabulary, per the
  same reasoning `GdsMapPinBadge`'s own icon docs already give). `icon`
  being required and `emoji` optional is the structural guarantee behind
  "emoji affects only the badge": `GdsGeneratedThumbnail`/`GdsGeneratedHero`
  read only a category's `icon` field — they have no code path that reads
  `emoji` at all.
- **Live demo**: the badges pattern (`/patterns/feedback`) includes a
  Tabler/emoji toggle (`SportsEmojiModeDemo`) showing a Soccer/Basketball/
  Baseball category set as badges and map pins in both modes, next to
  `GdsGeneratedThumbnail`s for the same categories that never change.
