# The GDS Map System

Status: Active SSOT (issues 549, 572)
Owner: GDS core
Last updated: 2026-08-14

The map is the first GDS surface with a **runtime external-service dependency**: every other
component renders from the bundle, while a map needs a network, a tile host, a CSP entry, and a
degraded path when none of those hold. This document is the single place that records what GDS
owns, what a consuming product owns, which obligations a consumer *inherits* by rendering a map
at all, and why the load-bearing decisions went the way they did — so they are re-decided on
purpose or not at all.

Where this document names a number or a contract, the value lives in source and is cited;
nothing here is a second copy that can drift (Rule 14). Where a capability does not exist yet,
this document says so and names the issue that carries it (Rule 15) — an honest gap is
documentation; a workaround that looks like the system is a lie about the system.

## 1. What GDS owns, what the product owns

| Concern | Owner | Where |
| --- | --- | --- |
| Panel chrome, loading/empty/error states | GDS | `MapPanel` (`@sovereignsquad/gds-core`) |
| Map engine, tiles, markers, credit, a11y | GDS | `GdsMap` (`@sovereignsquad/gds-core/map`) |
| Basemap treatment (wash) | GDS | `GdsMapBasemapWash` (`@sovereignsquad/gds-core`) |
| Pin vocabulary and states | GDS | `GdsMapPinBadge`, `GdsSavedIndicator` |
| Tile-source choice at scale, CSP, credentials | **Product** | see §4 — obligations travel with this |
| What the map is *of* (data, filtering, routing) | **Product** | consumer code |

`MapPanel.renderMap` is deliberately consumer-supplied: GDS governs how a map surface looks,
degrades, and announces itself — not which map a product renders. `GdsMap` is the governed
default for products that do not bring their own engine.

## 2. The layer model

```
MapPanel                      panel chrome; renders StateBlocks INSTEAD of the map
└─ renderMap() →
   GdsMapBasemapWash          theme wash host (§5); pointer-events pass through
   └─ GdsMap                  Leaflet engine, subpath export
      ├─ tile layer           validated source (§4)
      ├─ marker layer         keyboard-focusable, labelled (§6)
      ├─ ODbL credit          GDS UI, not Leaflet chrome — cannot be styled away
      └─ list view            the text equivalent; not optional (§6)
```

Two structural consequences, both enforced by construction rather than convention: a state
block can never render *under* a wash (the wash renders nothing without children, and
`MapPanel` renders states instead of `renderMap`), and the credit cannot be removed by styling
(it is a GDS-rendered element, with Leaflet's own attribution control disabled —
`GdsMap.client.tsx`).

## 3. The engine: Leaflet, pinned exactly

Recorded at the decision (`boundary/vendor-governance.json`, CHANGELOG "#566/#567"): **Leaflet,
not MapLibre**, because nothing in scope requires WebGL — which matters under forced-colors and
on low-end devices — and raster tiles suffice while vector-tile styling is out of scope.
Pinned **exactly**, never by range: a map engine renders third-party tiles and holds imperative
DOM, and a silent minor bump is not something to learn about from a broken map.

Two properties follow from "imperative DOM" and are easy to trip over:

- **Theme switches re-initialise the map.** Leaflet reads pane geometry when it constructs; a
  CSS-variable change cannot reach back into it. The theme identity remounts `GdsMap` (issue
  561); `verify:stale-theme-values-runtime` (issue 598) is the detector for anything that
  survives such a remount when it should not.
- **The engine is CSS-dependent.** `.leaflet-tile { position: absolute }` is load-bearing;
  without the stylesheet, tiles render as a vertical strip. The `@sovereignsquad/gds-core/map.css`
  export exists for exactly this, and its build step refuses to emit a file missing that rule.

Coordinates are `{ lat, lng }` (WGS84); rendering uses Leaflet's default Web-Mercator
projection (EPSG:3857), the projection every raster tile host serves. Products needing another
CRS are outside `GdsMap`'s contract and own their engine via `renderMap`.

## 4. Tiles, and the obligations a consumer inherits

The tile source and its attribution are **one object** (`map-tile-policy.ts`): OSM data is
ODbL-licensed and the credit is a licence condition, not a styling preference, so
`GdsMapTileSource` cannot be constructed without `attributionText`, `assertGdsTileSource`
throws rather than substituting a default (silently rendering a *different* map would be worse
than failing), and `GDS_OSM_TILE_SOURCE` is frozen so the credit cannot be mutated off the
shared object.

What GDS cannot enforce, the consumer owns — these are the decisions with licence or terms
consequences:

1. **The default OSM host is for light use.** The OSM Foundation's tile usage policy requires
   an identifying User-Agent/Referer and forbids heavy bulk use. A product with real traffic
   is expected to move to its own tile host — which is why the source is configurable — and any
   replacement carries its host's own terms *plus* the ODbL credit if it serves OSM-derived
   data.
2. **CSP.** Tiles are cross-origin images; the product's `img-src` must include its tile host.
3. **Wrapping.** A product that hides, covers, or crops the credit region has removed a licence
   condition, whatever the CSS that did it looks like.

## 5. Themed presentation: the wash

Raster tiles arrive in the tile host's palette and read as a foreign surface inside a themed
page. The recorded rationale (issue 549, from the source spec): **desaturation alone yields a
grey map — the canvas-colour composite is what makes it read as ours.** `GdsMapBasemapWash`
is that recipe as one layer: `backdrop-filter: saturate(GDS_MAP_WASH_SATURATION)` pulls the
tiles' palette down, and a `GDS_MAP_WASH_TINT` composite of `--gds-vibe-canvas` (falling back
to `--gds-bg-canvas`) tints toward the **active theme** — a cream theme washes cream, a dark
theme washes dark, and no literal colour exists anywhere in the component. Both constants are
exports; consult them there rather than here. The layer is `pointer-events: none` and
`aria-hidden`, sits above tiles but below Leaflet's overlay panes, so markers and popups render
un-washed.

**Not built yet:** deeper themed basemap presentation — theme-scaled map chrome and area-fill
recipes — is issue **569**; the neighborhood-fill colour-recipe utility is issue **550**. The
wash is the shipped first layer of that story, not the whole of it.

## 6. Accessibility architecture, and why there is no clustering

A map pane is imperative DOM a keyboard user can pan blind through — so the architecture is
that **the map is never the only way to read the data**:

- The map region is a labelled, announced region; marker changes announce debounced counts
  ("N places in view") rather than firing per pan frame (`GdsMap.client.tsx`).
- Every marker is keyboard-focusable with a consumer-supplied accessible name — never a name
  derived from an icon import (`GdsMapPinBadge.label`'s rule).
- **The list view is the text equivalent and it is not optional.** Selection state is shared
  between pin and list row (`aria-pressed`), so the list is the same data, not a summary.
  This is also why the accessibility evidence registry directs consumers to prefer
  `MapPanel`'s fallback states and text summaries whenever an embedded provider does not meet
  the required contract (`accessibility-evidence-registry.ts:108`): an iframe map has no
  governed text equivalent of its own.

**No clustering** is a decision, not a gap (source spec, preserved): every result is its own
pin, drawn in the same render pass as the tiles so it cannot drift during a pan. Clustering
would also make the announced counts and the list equivalence lie — a cluster of 12 is one
focus stop for what the list presents as twelve rows. If a product has too many pins to render
individually, the governed answer is filtering the data, not hiding results inside a numbered
circle.

## 7. Pins

The pin vocabulary is `GdsMapPinBadge` (see `docs/BADGE_SYSTEM.md`, "Map markers" and "Marker
states"): curated accents, darker-only shades, and the issue-545 state contract governed by
**the fill belongs to the activity — state is carried by silhouette and scale**. Saved is a
composition (`GdsSavedIndicator mode="corner"`), not a pin state, because a pin can be saved
while hovered and saving is a user action with its own labelled control.

## 8. Degradation model

What exists today: `MapPanel`'s loading/empty/error `StateBlock`s, `assertGdsTileSource`
failing loudly on an invalid source, and the map.css guard (§3).

**Not built yet:** governed offline and blocked-tile degradation — detecting tile fetch
failure (offline, CSP, ad-blocker) and preserving the CONTENT via the list view rather than
showing a broken grid — is issue **570**. Until it lands, a product whose tiles fail shows the
tiles' failure, not a governed state; that absence is recorded here rather than papered over.

## 9. The rail and the preview card

**`GdsMapFilterRail`** (issue 547, shipped): horizontally scrolling filter pills composed on
`PillBar` — which already owns the scrollable roving-tabindex radiogroup and the
contrast-correct selected treatment — plus the rail contract: an "All" pseudo-option always
first (consumers speak `null`, never a sentinel), counts rendered into labels when supplied
(the "All" total only when *every* option carries a count — a partial sum reads as a total and
is not one), and a ResizeObserver-backed `onHeightChange` so the consumer insets the map
viewport by the rail's real height — the half of the spec that needs rail/map coordination.
Counts are the consumer's and are expected to follow the map bounds; recomputing them is data
logic (§1).

**`GdsMapPinPreviewCard`** (issue 548, shipped): what opens when a pin is tapped. Composed,
not built — the generated-imagery thumbnail with `badges="none"` (at this tile size badge
pills keep their real type size and become clutter; the activity is named in text on the meta
line), `GdsSavedIndicator` beside the primary action, `MeaningBadge` for trust, and the
elevation axis's `sheet` role for the surface shadow. Every field has a defined absent
treatment: no categories → no media region, no trust badge → row omitted (the absence of a
claim is not a claim), no price and no last-checked → no estimate block, `loading` → a
same-shape skeleton. Control labels are consumer-supplied and required — the same
no-shipped-English rule the pin's `label` follows.

Both are proven on the reference site's gds-map demo as one composition over one data set:
the rail's counts come from the markers the map renders, and selecting a pin opens that pin's
own card.

## 10. The rest of the programme

| Issue | What it adds |
| --- | --- |
| **550** | Neighborhood-fill colour recipe + no-clustering architecture notes (partly §6) |
| **569** | Themed basemap presentation beyond the wash |
| **570** | Offline / blocked-tile degradation |

When one lands, its architectural content moves here — this file is the destination the
programme's issues nominate, and a section that still says "not built yet" after its issue
closes is a defect in this document.
