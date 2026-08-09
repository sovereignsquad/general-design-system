# Handoff: ClassScout design system

## Overview

The visual and behavioural system for ClassScout NYC — a parent-first discovery
product for kids' classes, camps, parties and family events in New York. It is
mobile-first: the design target is a parent on a phone, one-handed, deciding
whether a place is worth a call.

This package documents foundations (colour, type, shape, motion, focus), the
component vocabulary, the trust layer, the generated-imagery system, the map,
and the content rules — plus a token-level specification for the `class-usa`
theme lane in the General Design System.

## About the design files

`ClassScout-Design-System.html` is a **design reference**, not production code.
It is a single self-contained file — no build step, no network, no assets to
resolve — that opens in any browser. Its markup exists to render the reference;
it is not a component library and should not be lifted into the product.

The implementation target is the existing codebase: Next.js App Router, React,
TypeScript, Mantine, and the governed `gds-core` / `gds-theme` / `gds-admin`
packages. Every surface here should be built as (a) token values, (b) variants
of existing design-system primitives, or (c) a named new composition. Anything
that needs a primitive the design system does not have is a request to the
design system and should be raised as one rather than hand-rolled locally.

Two standing constraints in that codebase matter for every screen below: the
compliance checker fails the build on raw design values outside the theme path,
and the accessibility lint preset is at error, so a missing `alt` or an
unlabelled control breaks the build.

## Fidelity

**High fidelity.** Colours, type, spacing, radii and states are final and
should be reproduced exactly. Layout proportions are indicative — recompose
them with the codebase's own grid and shell contracts rather than copying
measurements.

## Design tokens

### Brand

| Token | Value | Role |
| --- | --- | --- |
| Cream | `#FAF7F1` | The page. Also the map canvas and the paper behind every generated image |
| White | `#FFFFFF` | Cards and panels only. The page is never white |
| Ink navy | `#0F2C4A` | Headings, nav, pin silhouettes, inverse surfaces |
| Body | `#1F3A5C` | Running text — 9.9:1 on white |
| Slate | `#5B6573` | Metadata and secondary text |
| Brand orange | `#F5793B` | Fills, marks, avatars, selected pin. Never under text |
| Action orange | `#C24A0A` | Buttons, links, focus ring. The only colour that carries a label |
| Action pressed | `#A33E07` | Pressed and hover state of the above |
| Card border | `#E6E1D8` | Hairline on white |
| Neutral chip | `#F6F1EA` | Chip and tile ground |

The two oranges are one decision, not a gradient. `#C24A0A` clears WCAG AA
against both cream (4.6:1) and white with white text on it (4.9:1); `#F5793B`
does not and is fill-only.

### Semantic

| Token | Value | Meaning — used nowhere else |
| --- | --- | --- |
| Trust green | `#4F8A5B` | Source and freshness signals |
| Trust tint | `#EAF2EC` | Ground for the above |
| Estimate amber | `#C78A2C` | Estimated price or schedule, staleness, caution |
| Estimate tint | `#F8EEDD` | Ground for the above |
| Error red | `#B84A4A` | Failures and destructive confirmation |
| Error tint | `#F7E6E6` | Ground for the above |

### Activity accents

Pin-fill tints: forest `#A9CDB4`, ocean `#A7C9DE`, bronze `#E2C79B`, grape
`#C6B6E0`, magenta `#E9B4CD`, indigo `#B3BEE4`, neutral `#DCD7CD`.

Each family carries four steps between its tint and a shared floor, spaced
proportionally. **Activity colour is not semantic** — there are far more
activities than colour slots, so hue only separates one listing from its
neighbour. The glyph carries identity.

### Type

Display `Playfair Display`; body `Inter`. Both load as variable stacks
(`--font-display`, `--font-body`) with fallbacks so a licensed face can replace
either without touching a component.

| Role | Size / weight | Notes |
| --- | --- | --- |
| H1 | 44/52 · 700 | −0.01em tracking |
| H2 | 30 · 700 | |
| H3 | 22 · 600 | |
| Card title | 20 · 600 | |
| Row label | 18 · 600 | Inter, not the display face |
| Body | 16 · 400 · 1.55 | |
| Meta | 14 · 400 | Slate |
| Badge | 12 · 600 | |

Sentence case everywhere, including section labels. Never below 14px. Tap
targets never below 44px.

### Shape, depth, motion

Radius 8 small · 12 controls and inputs · 16 cards · 24 sheets and modals ·
full pill for chips and badges.

Spacing on an 8px grid: 4, 8, 12, 16, 24, 32, 48, 64. Sibling groups use flex
or grid with `gap`, never per-element margins.

Two shadows only — card `0 1px 2px rgba(15,44,74,.04), 0 8px 24px
rgba(15,44,74,.06)`; overlay `0 2px 6px rgba(15,44,74,.1), 0 16px 40px
rgba(15,44,74,.16)`. No inner shadows, no coloured shadows, never both stacked.

One curve: 200ms `cubic-bezier(0.4,0,0.2,1)`. Cards lift 2px on hover. No
bounces, no parallax, no hover-only affordances. All motion disabled under
`prefers-reduced-motion`.

Focus is a 2px `#C24A0A` outline at 2px offset on every control.

## Screens and surfaces

### Profile

A parent's account home. Warm canvas, an H1 in the display face, a profile
header card, then grouped list rows under sentence-case section labels, over a
five-item bottom tab bar.

- **Profile header card** — white, 16px radius, card shadow, 18px padding.
  58px circular avatar in brand orange with white initials; name at display 24
  · 700; email at 13px slate, truncating on overflow; a 44px circular edit
  button on neutral chip ground. Below, one child chip per child: a 999px
  pill with a 1px border on cream, holding a 28px tinted disc with the child's
  interest glyph and the child's name and age at 14 · 600. The disc tint is
  decorative and never colours the chip itself.
- **List rows** — 44px tile at 12px radius, label at 17–18 · 600, an optional
  count in slate, a chevron in `#A3ABB5`, hairline `#EFEBE3` between rows.
  Five destinations own a tile hue: child profiles violet `#EFEAFB`/`#6D4FBF`,
  parent dashboard navy `#E6EDF5`/`#0F2C4A`, categories orange
  `#FDEDE3`/`#A33E07`, payments green `#EAF2EC`/`#4F8A5B`, providers amber
  `#F8EEDD`/`#C78A2C`. Every other row uses neutral `#F1EFEA`/`#5B6573`. A
  count renders only where one is true.
- **Bottom tab bar** — Search · This week · Saved · Scout · Account. Icon and
  label together, five maximum, destinations only. Active item in action
  orange at weight 600. A floating action button is not an acceptable home for
  a destination — it covers the last row of the list beneath it.

### Scout sheet

A bottom sheet with a 24px top radius over the page it opened from. Header is
the one dark surface in the system: a vertical navy gradient `#123A5E` →
`#0F2C4A` carrying a 50px brand-orange app mark at 14px radius, the name at 19
· 700 in white, a `BETA` pill (`#F4D6A0` ground, navy text), a subtitle in
`#C6D3E0`, and a 44px close button on `rgba(255,255,255,.14)`.

Body sits on cream: the greeting in a white card, quick-start chips composed
from live categories, the privacy line, and a composer with an action-orange
send button.

Scout offers and never promises — "activities that may fit", always closing
with confirmation by the provider. Beta is labelled. The privacy line ("Do not
enter a child's full name.") sits next to the input, not in settings.

### Map

- **Pin** — two layers only, the pin and the glyph; no ring, no capsule. Path
  `M6.04 16.33A8 8 0 1 1 17.96 16.33L12 23Z` in a 24-unit box: the head is a
  true circle of radius 8 centred at `(12,11)`, one unit above the path box's
  own centre, with tangents solved to the tail at `(12,23)`. Fill is the
  activity tint, stroke is ink navy at 1.75. The glyph renders at 0.46 of the
  marker, centred at 45.83% of the height — centring on the bounding box is one
  full unit wrong.
- **States** — idle; hovered from the synced list, stroke `#245A8C` at 2.25;
  selected, fill `#F5793B` and a size step up; saved, a heart badge at the
  head's upper right; approximate location, dashed navy stroke on the neutral
  tint; no emoji mapped, the Tabler glyph in navy on the neutral tint. The fill
  belongs to the activity, so **state is carried by silhouette and scale**.
- **No clustering** and **no DOM markers**. Every result is its own pin, drawn
  in the same render pass as the tiles so it cannot drift during a pan.
- **Filter rail** — horizontally scrolling pills above the safe area; "All"
  always first and always visible; counts are part of the label and follow the
  map bounds; selected fills ink navy with a check. The map insets its own
  bounds by the rail height so the rail never covers a pin's target.
- **Basemap** — canvas and a wash over the raster are both cream. Desaturation
  alone yields a grey map; the cream composite is what makes it read as ours.
- **Neighbourhood fills** — categorical, never a measurement. Accent at 42%
  into cream, painted at 55% opacity, with a paper hairline between areas.
  Adjacent neighbourhoods never share a family. Outside coverage takes a faded
  paper wash.
- **Accessibility** — canvas pixels are not in the accessibility tree on any
  map library. The synced list beside the map carries every result; anything
  that exists only on the map is unreachable for some readers.

### Pin preview card

White, 16px radius, overlay shadow. A 16:9 generated thumbnail, then title at
display 20 · 700, `Activity · Neighbourhood` in slate, a written one-sentence
summary, an age chip and a trust badge, then a bordered block carrying the
price estimate and the last-checked line, then a full-width action-orange
"View provider" with a 48px save button beside it. Close is a 32px white disc
over the art.

Badges are suppressed on the thumbnail at this size — the pills keep their real
type size regardless of tile size and become clutter — and the copy names the
activity instead.

## Imagery

**No photographs of listings, anywhere.** Artwork is generated from the
listing's own activities, seeded by its id, so a card is complete in the first
HTML response with nothing to fetch and nothing to fail. Any direction that
reintroduces per-listing image fetching is a regression.

Two layers, deliberately separate:

1. **Ground** — an SVG data URI. The activity accent mixed into cream at 18%,
   carrying the activity's own glyph oversized 1.15–1.45× so it overflows two
   edges while staying recognisable, at 18% opacity. Angle, scale and position
   are seeded from the listing id — never random; a card that recomposes on
   re-render reads as flicker. Drawing space 300×200, scaled with
   `object-fit: cover`. The ground may crop freely.
2. **Badges** — real DOM over the art, up to three, bottom-left: the lead
   activity as a named pill, the rest as icon-only discs. Fully saturated,
   because a ground at 18% cannot carry colour coding. Each badge filters the
   search by that activity and carries its own accessible name.

Baking badges into the image causes three defects at once and must not return:
corner-anchored content cropped away by `cover`, pill widths estimated
arithmetically because SVG cannot measure text, and no interactivity.

**Heroes** use the same system weaker: a 14% wash and a tile field between 6%
and 20% opacity so the field reads as depth rather than a screen door. A hero
with no activity filter — the common case — uses a 5% neutral tint, not navy:
navy is dark and low-chroma, so mixing it into cream yields a grey, and raising
the tint only makes a darker grey. The colour on those pages comes from the
tile field and badges.

**One accent, four strengths**: pin fill (light tint) · card ground 18% · hero
wash 14% · neighbourhood fill 42%. A listing wears the same colour everywhere,
at the strength each surface can carry. Soft ground, saturated small elements.

A provider-owned photo may occupy the same slot behind a flag, so the card must
not break when a real image replaces generated art.

## Iconography

Tabler outline icons at 2px, through a single re-export module so the set can be
swapped in one file. Roughly 130 in use.

**Every activity owns its glyph.** No fallback, no generic mark, no borrowing —
a repeated glyph teaches a reader that the glyph means nothing. Uniqueness is
enforced by test. Where no literal match exists, depict something real and
specific: the equipment, the venue, the apparatus, the defining posture, the
signature prop. Annotate each such choice inline with what it depicts and why
nothing better exists.

**Emoji appear on the map pin and nowhere else.** Not on cards, thumbnails,
hero art, chips, headings, body copy, empty states, buttons or notifications.
An activity gets one only where an emoji honestly depicts it; otherwise the pin
keeps its Tabler glyph. On a pin the emoji is fully opaque, never recoloured,
never dimmed, and always hidden from assistive technology — the pin's written
name carries the meaning. Emoji support is measured per device, not assumed.

## Components

- **Buttons** — primary (action orange, white label), secondary (white, navy
  label, hairline border), subtle (action-orange label only), danger (error
  red). 12px radius, 44px minimum height. One primary per screen, never two
  side by side. Submitting shows a loading state so a second tap cannot
  double-post.
- **Chips** — neutral `#F6F1EA` for scope and taxonomy; selected uses the brand
  tint `#FDEDE3` with action-orange text and a brand-orange border, never a
  solid bright fill. A removable tag is a real button whose whole surface
  removes the filter and carries its own spoken name.
- **Fields** — visible label always, detail on a description line rather than a
  long label, error text under its own field, 44px minimum height, 12px radius.
  Never three inputs in a row on a phone.
- **Dropdowns are native `<select>`.** A styled combobox on a phone puts a caret
  in the field and raises the keyboard over the options, so choosing one of four
  things starts by dismissing a keyboard nobody asked for. Do not build a custom
  dropdown menu.
- **Choice controls** — checkbox is an independent opt-in, radio is mutually
  exclusive, a switch takes effect immediately and therefore never sits behind a
  save button.
- **Badges** — colour comes from a closed set: a semantic tone or one activity
  accent, never a free value. Labels are written by a person, never derived from
  a glyph's export name. Under forced colours every fill flattens to one system
  pair, so the label and stroke are what survive. Eight accent categories at
  most on one surface. A count announces as "3 unread messages", in that order,
  with its live region mounted at zero so the first arrival is spoken.

## Trust layer

Every listing surface answers age, place, time, cost and source or freshness.
Unknowns are stated, never omitted.

Eight defined labels, each operational: Official source · Public source ·
Provider claimed · Recently checked · Verified by provider · Price estimate ·
Schedule estimate · Age not confirmed · Reported outdated. "Verified by
provider" is narrow — the provider claimed the listing and confirmed its
details — and the word appears nowhere else.

Prices carry "Estimated from $45 · confirm with provider" in amber, plain when
confirmed, "Free", or "Price unknown". Freshness reads "Last checked 2 Jul
2026" and, past the window, "Details may have changed — confirm with provider".
Detail pages carry a source block and a confirmation checklist; every listing
detail carries a report-outdated link. **No numeric trust scores anywhere.**

## States

Every surface defines loading, empty, error, unavailable and success.

- **Loading** — skeletons where the shape is known, plus a sentence for slow
  work ("Loading NYC family activities…"). Never a bare spinner on a long wait.
- **Empty** — what happened, why, and next actions ("Include Sunday", "Ask
  Scout"), with a true count behind each suggestion.
- **Error** — human cause, retry, and a fallback ("Your saved activities are
  still available offline, though schedules and prices may have changed").
- **Unavailable** — where a borough, category or activity is switched off, say
  so plainly and offer what is live. Never an empty grid or a dead filter.
- **Alerts** explain what happened and what to do next. A critical failure never
  lives only in a transient toast.
- **Overlays** — modals for confirmation, focused edits or blocking decisions;
  focus trapped, never stacked, near-full-width on a phone. Drawers and bottom
  sheets carry filters, with explicit apply, reset and close. Destructive
  confirmations restate the target by name.

## Layout and behaviour

Mobile is for finding fast, tablet for comparing, desktop for planning. The
trust logic and hierarchy are identical everywhere; only density adapts.

Cards step 1 column on a phone → 2 → 3, halving in split map/list mode. Mobile
carries a bottom tab bar, desktop a sidebar. A page header answers where am I,
what is this for, what can I do next, and holds the page's primary action.
Breadcrumbs on desktop detail pages, "Back to results" on mobile. View details
and Save are never hidden in an overflow menu.

A desktop table compressed onto a phone is unacceptable — choose horizontal
scroll, a card view, priority columns, or stacked rows. A list card shows one
visible primary action with the rest in overflow; avoid adjacent icon-only
clusters. Filters sit next to the data they affect; toolbar order is search,
filter, sort, reset, create.

Rotation and back-navigation preserve filters, scroll, the selected listing,
map bounds and Scout context. A search is never reset by moving.

## Runtime configurability

An operator can switch off whole categories, individual activity types, whole
boroughs and individual features per city, without a deploy. Live production
currently runs with several activity types, browse categories and boroughs off.

**No composition may depend on a fixed count.** Anything built around six
category tiles, five nav items or a four-up grid will be wrong for a real
operator on a real day. Every grid, rail and sentence must hold at full count,
at half, and at one — and say something true when the count is zero.

## Content rules

Calm, practical, local, adult to adult. Decision support, not marketing. Second
person and direct. One brand name everywhere: ClassScout NYC, or ClassScout in
tight UI.

Never say guaranteed, safe, perfect match, best, or trust us. Never invent a
name for a concept that has a standard one. Never surface an internal
identifier, package name or code field on screen.

Copy is composed from governed values: a sentence must never name a category,
activity or neighbourhood that has been switched off, and must degrade as its
list shrinks to two, to one, to none. Every text slot needs an answer for the
day there is nothing true to say in it.

## Where literal values may live

Only under the theme path. Three places genuinely need plain hex because their
output has no stylesheet and no theme in scope: map paint expressions, generated
SVG data URIs, and the PWA manifest. Everything else reads tokens.

## Files in this bundle

| File | What it is |
| --- | --- |
| `ClassScout-Design-System.html` | The design reference, self-contained. Open in any browser |
| `ClassScout Design System.dc.html` | Editable source of the same document |
| `class-usa-v2-token-spec.md` | Token-level specification for the `class-usa` theme lane: six role-named ramps, all 30 semantic roles with separately authored dark values, computed contrast, the files that change and the tests that break |

## Open items for the implementer

- Dark mode is specified in `class-usa-v2-token-spec.md` but is not active in
  the product. Treat activating it as scoped work, not a toggle.
- The theme lane re-base is a breaking change to `ClassUsaColorRampName` and the
  `classUsa*` Mantine colour keys. The spec lists the old-to-new mapping.
- Pin state colours here (silhouette and scale) differ from a navy-idle /
  terracotta-selected convention. Confirm before sprite generation, since the
  activity fill is spoken for.
- Specimens at difficult content — a long provider name, a listing with one
  activity and with three, a listing whose activity is switched off, a
  neighbourhood with no results — are not yet drawn. They are where
  compositions usually break and are worth producing before build.
