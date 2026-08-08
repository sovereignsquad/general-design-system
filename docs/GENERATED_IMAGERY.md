# Generated Imagery

Status: Active SSOT
Version: 4.1.5
Last updated: 2026-08-07

A turnkey, theme-managed generated-imagery system (epic #503):
deterministic, zero-network SVG+HTML card thumbnails and hero backdrops
composed from a consumer's own category data — no image hosting, no AI/
generative-model image calls, no per-consumer design work.

**This is not AI-generated imagery.** It's the single most likely point of
confusion given the feature name, so it's stated plainly up front: every
pixel here is deterministic procedural composition (a gradient, an icon, a
seeded transform) computed from data the consumer already has. There is no
prompt, no model call, and no non-determinism — the same entity id always
produces the same result, on the server and the client alike.

## The pieces

| Component | Job | Never |
|---|---|---|
| `GdsGeneratedThumbnail` | Card-scale: accent wash + oversized low-opacity icon motif + up to N ranked category badges | An `<img>` tag, a network request, a fixed stock-photo set |
| `GdsGeneratedHero` | Banner-scale: accent wash + one of four background strategies + up to 6 ranked badges at a fixed size ladder | A full hero-with-copy component — eyebrow/title/CTAs stay whatever the consumer already renders |
| `gdsGeneratedPaletteCssRefs` / `resolveGdsGeneratedPaletteHex` | The shared palette resolver both components (and any headless renderer) draw from | A new color system — it resolves the *existing* theme-token and curated-accent systems |
| `gdsSeededRandom` | The shared deterministic PRNG both components use for placement | `Math.random()` — never used anywhere in this system, on purpose (SSR/hydration correctness) |

## Use cases

- **A listing has no photo yet.** A new host, seller, or menu item is created
  before any real media exists — `GdsGeneratedThumbnail` fills the card's
  image slot so the item reads as finished from the moment it's created,
  never as a blank gray "no image" icon.
- **The content type never had photography to begin with.** A category,
  skill tag, or service type (e.g. "Soccer", "Choir", "Pickup only") has no
  natural photo subject — the generated motif and badges carry that identity
  instead of forcing a stock-photo search for something unphotographable.
- **A location or category landing page needs a hero with no art budget.**
  `GdsGeneratedHero` gives every such page an on-brand backdrop without a
  photographer, a stock license, or per-page design work.
- **A page needs a share image and has no dedicated marketing asset.** See
  [Headless SVG generation for `og:image` and email](#headless-svg-generation-for-ogimage-and-email)
  below — the same system, rendered server-side.

## Where this comes from

A ClassScout engineering proposal generalized last week's `GdsMapPinBadge`
accent+shade work (see [`BADGE_SYSTEM.md`](BADGE_SYSTEM.md)) into a full
imagery system for their own product — verified against source before this
was built: every one of that proposal's 26 activity colors was an exact
match to `gdsBadgeAccentShades`. This system lifts that mechanism out from
under one consumer's brand and makes it **theme-managed**, so any GDS
consumer gets the same quality of result from their own brand, not just the
one this pattern happened to be designed against.

## Two palette sources — pick the one your category semantics need

```tsx
<GdsGeneratedThumbnail seed={listing.id} categories={categories} />
{/* paletteSource="theme" is the default — no config needed */}

<GdsGeneratedThumbnail
  seed={listing.id}
  categories={categories}
  paletteSource="category"
  category="forest"
  shade="deep"
/>
```

| | `paletteSource="theme"` (default) | `paletteSource="category"` |
|---|---|---|
| Colors come from | The active theme's `brand.primary`/`brand.accent` tokens (`--gds-brand-*`) | The fixed, theme-independent `gdsBadgeAccentColors`/`gdsBadgeAccentShades` |
| Varies when the theme changes | Yes — restyles with everything else on the page | No — stays the same category color across every preset/brand |
| Right for | Any consumer, zero config — beautiful against *their* brand, not a palette that happens to suit one brand | Consumers who specifically want category meaning to stay stable across theme changes (e.g. "soccer is always this green, everywhere") |
| Contrast guarantee | Every surface with fixed white text is pushed through `color-mix(in srgb, <color> 30%, black)` first — provably clears the WCAG AA bar even for the lightest possible input, since the resolved value is a live CSS variable with nothing to check in JS | Already individually verified ≥4.5:1 against white by `gdsBadgeAccentShades`'s own test suite; the same `color-mix` step is applied anyway for one visual language across both modes |

An explicit `colors={{ primary, accent }}` override wins over `paletteSource`
entirely, for the one case neither built-in source can cover headlessly: a
consumer's own custom `createBrandTheme(...)` brand resolved outside a live
DOM (see `resolveGdsGeneratedPaletteHex`, and #508 for the OG-image use
case that actually needs it).

## `GdsGeneratedThumbnail`

```tsx
import { GdsGeneratedThumbnail } from '@sovereignsquad/gds-core';

<GdsGeneratedThumbnail
  seed={listing.id}
  categories={[
    { key: 'soccer', label: 'Soccer', icon: <IconBallFootball /> },
    { key: 'basketball', label: 'Basketball', icon: <IconBallBasketball /> },
  ]}
  aspectRatio="3:2"
  maxBadges={3}
  motifOpacity={0.14}
/>
```

`categories` is ranked: index 0 is the lead badge (icon + real text label)
and the source for the background motif; the rest render as icon-only
secondary badges up to `maxBadges`. Two rendering layers, two technologies,
on purpose — the background (motif + gradient) is decorative inline SVG,
`aria-hidden` unconditionally; the badges are real information (a category
name a screen reader must be able to reach) and render as HTML, absolutely
positioned over the SVG rather than composited into it. `GdsBadge`/
`GdsBadgeStack` aren't reusable here as-is: their `accent`/`tone` props are
closed unions that can't accept an arbitrary resolved theme color.

`label` is optional: when omitted (the expected case — a thumbnail
normally sits beside a real card title), the root carries no `role`, but
the badges stay individually accessible regardless. When given, the root
renders `role="group"` (never `role="img"`, which would collapse the
individually-meaningful badges into one opaque name).

### Using it as the card-image placeholder

`ListingCard`, `PublicProductCard`, and `PublicFoodCard` all accept
`image?: ReactNode` and fall back to a plain gray "no image" icon when it's
omitted. `GdsGeneratedThumbnail` composes into that slot directly — no
changes to any of those card components, no new prop, no adapter:

```tsx
import { GdsGeneratedThumbnail, ListingCard } from '@sovereignsquad/gds-core';

<ListingCard
  title={listing.title}
  description={listing.description}
  image={
    listing.photoUrl ? (
      <img src={listing.photoUrl} alt="" />
    ) : (
      <GdsGeneratedThumbnail seed={listing.id} categories={listing.categories} aspectRatio="4:3" />
    )
  }
/>
```

The same pattern applies to `PublicProductCard` and `PublicFoodCard`'s
`image` prop. See the `generated-imagery` pattern on the playground for all
three composed live, side by side with their real fallback state.

## `GdsGeneratedHero`

```tsx
import { GdsGeneratedHero } from '@sovereignsquad/gds-core';

<GdsGeneratedHero
  seed={location.id}
  label="Sports classes in Riverdale"
  background="mosaic-abstract"
  badges={topCategories}
/>
```

The backdrop only, not a full hero-with-copy component — eyebrow/title/
description/CTAs stay whatever the consumer already renders (`EditorialHero`
or their own copy); `GdsGeneratedHero` supplies `position: absolute; inset:
0` art to sit behind it. `label` is **required** here, unlike the
thumbnail's optional one: a hero backdrop is never used without adjacent
context, so there's no decorative-only default.

### Background strategies

| Strategy | Data required | What it looks like |
|---|---|---|
| `'wash'` (default) | None | A flat/gradient accent panel — the true turnkey default |
| `'mosaic-abstract'` | None | A seeded generative tiled texture, theme-tinted |
| `'icon-field'` | None (uses `badges`) | The supplied badges' own icons scattered at low opacity — reuses data already passed in rather than requiring a separate icon list |
| `{ type: 'region-mosaic', regions }` | Consumer-supplied bounding boxes (normalized 0–1 fractions) | A map-like mosaic of tinted regions — this is the adapter a ClassScout-style geo mosaic is built on. **GDS ships the rendering shape only — no city or brand data lives in `gds-core`.** |

```tsx
<GdsGeneratedHero
  seed={location.id}
  label="Neighborhood coverage"
  background={{
    type: 'region-mosaic',
    regions: myOwnNeighborhoodBoxes.map((box) => ({
      x0: box.left, y0: box.top, x1: box.right, y1: box.bottom, weight: box.listingCount,
    })),
  }}
/>
```

### The badge scatter is fixed slots, not free placement

Six freely-placed marks at random sizes reads as clutter and buries
whatever headline sits over this backdrop. `GdsGeneratedHero` uses six fixed
position slots at three sizes — one large, two medium, three small, the
small ones at reduced opacity so they read as depth rather than debris —
and **rank always maps to size**: `badges[0]` gets the large slot, `[1]`
and `[2]` the medium slots, `[3]`–`[5]` the small slots. Entries beyond 6
are dropped. The seed only shuffles which same-rank badge lands in which
same-size slot (plus a small rotation jitter) — never the slot geometry and
never the size-to-rank mapping, so the composition is always controlled
even though every seed looks different.

## Headless SVG generation for `og:image` and email

`GdsGeneratedThumbnail`/`GdsGeneratedHero` are React/live-DOM only — they
lean on `var(--gds-brand-primary, ...)` and `color-mix(in srgb, ...)`,
neither of which resolves outside a browser. For `og:image` routes, email,
or any other context with no live CSS cascade, use their headless twins
instead, exported from **`@sovereignsquad/gds-core/server`** only (never
`/index`/`/client` — they use `react-dom/server`'s `renderToStaticMarkup`
for icon rendering, which has no browser bundle to accidentally leak into):

```ts
import { buildGdsThumbnailSvg, buildGdsHeroSvg } from '@sovereignsquad/gds-core/server';
```

Both take literal hex colors, not CSS variable references — there is no
live theme to read from in this context. `paletteSource: 'theme'` therefore
requires either `themePresetId` (one of the 25 built-in presets, resolved
via the same `getGdsVibeThemeCssVariables` the runtime theme switcher uses)
or an explicit `colors` override for a custom brand theme; `paletteSource:
'category'` needs neither, same as the React components. The `30%`
`color-mix` contrast guarantee is reproduced as real RGB arithmetic on the
literal hex (same ratio, same provable ≥7:1-against-white floor), and badge
labels are hand-laid-out SVG `<text>`, not HTML.

```ts
const svg = buildGdsThumbnailSvg({
  seed: listing.id,
  categories: [
    { key: 'soccer', label: 'Soccer', icon: 'Location' },
    { key: 'basketball', label: 'Basketball', icon: 'Habit' },
  ],
  themePresetId: 'default', // or `colors: { primary, accent }` for a custom brand
  label: `${listing.title} — Soccer`,
});
```

### Next.js recipe: serve the SVG string directly

The simplest, most portable Next.js recipe skips `ImageResponse`/Satori
entirely — `buildGdsThumbnailSvg()`/`buildGdsHeroSvg()` already return a
complete, valid `<svg>` document, and modern platforms (X/Twitter, Discord,
Slack, most others) accept an SVG directly as an `og:image`:

```ts
// app/listings/[id]/og/route.ts
import { buildGdsThumbnailSvg } from '@sovereignsquad/gds-core/server';
import { getListing } from '@/lib/listings';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  const svg = buildGdsThumbnailSvg({
    seed: listing.id,
    categories: listing.categories,
    themePresetId: 'default',
    label: `${listing.title} — ${listing.categories[0].label}`,
  });
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
```

Wire it to `openGraph.images` in the listing's `generateMetadata()` — this
is the exact gap the originating ClassScout proposal called out ("no
listing has a share image... per-listing `og:image` was never built").

**If a platform specifically requires PNG** (some do), `ImageResponse`
needs a JSX element tree, not a pre-rendered string — Satori's restricted
style subset doesn't support CSS variables or `color-mix()` either, so
reuse the same `themePresetId`/`colors` palette inputs but hand-compose the
JSX layout rather than embedding the SVG string; that composition isn't
provided here, since it's a genuinely different rendering path with its own
constraints worth getting right against a real Satori target, not guessed
at speculatively.

### Region-mosaic worked example

`GdsGeneratedHero`'s `region-mosaic` background strategy needs a `regions`
array — normalized `{ x0, y0, x1, y1, weight? }` fractions of the hero's own
box. This is the shape a ClassScout-style neighborhood-coverage mosaic is
built on, with a fabricated (non-real) region set standing in for actual
geo data:

```ts
const svg = buildGdsHeroSvg({
  seed: neighborhood.id,
  themePresetId: 'default',
  label: `${neighborhood.name} coverage`,
  background: {
    type: 'region-mosaic',
    // Any consumer-owned bounding-box source works — normalize whatever
    // coordinate system it uses (lat/lng, pixel, tile) to 0-1 fractions of
    // the hero's own box first.
    regions: neighborhoodBoxes.map((box) => ({
      x0: box.left, y0: box.top, x1: box.right, y1: box.bottom,
      weight: box.listingCount, // more listings -> more visible tint
    })),
  },
});
```

## Where to see it live

The `generated-imagery` pattern on the playground (`/patterns/public`)
renders `GdsGeneratedThumbnail` with both palette sources side by side,
`GdsGeneratedHero` across all four background strategies, and
`GdsGeneratedThumbnail` composed as the `image` placeholder on real
`ListingCard`, `PublicProductCard`, and `PublicFoodCard` instances.
