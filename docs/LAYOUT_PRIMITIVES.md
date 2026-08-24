# Layout Primitives

Status: Active SSOT
Version: 6.4.0
Last updated: 2026-08-08

GDS layout primitives are the approved composition layer for product pages, admin tools, docs, public surfaces, and data-heavy workflows. They exist so consumers do not create local `Stack`, `Grid`, `Container`, `Sidebar`, negative-margin, or inline-style layout systems.

## Package API

Use these exports from `@sovereignsquad/gds-core`, `@sovereignsquad/gds-core/server`, `@sovereignsquad/gds-core/client`, or the aggregate `@sovereignsquad/gds` entrypoints:

- `GdsBox`
- `GdsStack`
- `GdsInline`
- `GdsCluster`
- `GdsGrid`
- `GdsSplit`
- `GdsSidebar`
- `GdsBleed`
- `GdsContainer`
- `normalizeGdsResponsiveValue`
- `resolveGdsLayoutStyle`

## Runtime Flow

```text
consumer layout intent
  -> constrained token and enum props
  -> responsive prop normalization
  -> GDS CSS variables and scoped media CSS
  -> semantic DOM element chosen by component prop
  -> DOM-order focus and reading order
  -> release/test/docs verification
```

The primitives do not use network calls, resize observers, client-only measurement loops, or a new CSS framework dependency.

## Responsive Contract

Every responsive prop accepts either one value or a breakpoint object:

```tsx
<GdsGrid columns={{ base: 1, md: 2, lg: 3 }} gap={{ base: 'sm', md: 'lg' }}>
  {cards}
</GdsGrid>
```

Supported breakpoints are `base`, `xs`, `sm`, `md`, `lg`, and `xl`. Supported spacing tokens are `none`, `xs`, `sm`, `md`, `lg`, `xl`, and `2xl`. Supported size tokens are `content`, `narrow`, `page`, `wide`, and `full`.

Raw pixel strings, viewport-unit hacks, visual reordering, and arbitrary CSS values are intentionally not part of the public contract. Use a component prop, token, or a reviewed exception instead.

## Cookbook

Page frame:

```tsx
<GdsContainer component="main" size="page">
  <GdsStack gap="xl">
    <PageHeader title="Settings" />
    <SectionPanel title="Profile">{form}</SectionPanel>
  </GdsStack>
</GdsContainer>
```

Toolbar:

```tsx
<GdsCluster component="header" gap="sm">
  <ResultSummary total={42} />
  <ActionBar primary={{ action: 'add' }} secondary={[{ action: 'filter' }]} />
</GdsCluster>
```

Form:

```tsx
<GdsStack component="form" gap="lg">
  <AdminTextInput name="title" label="Title" value={title} onChange={setTitle} />
  <GdsInline justify="end">
    <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} />
  </GdsInline>
</GdsStack>
```

Data layout:

```tsx
<GdsSidebar side="start" sidebarWidth="narrow" collapseBelow="lg">
  <FilterDrawer opened={opened} onClose={close} />
  <AdvancedDataTable columns={columns} rows={rows} />
</GdsSidebar>
```

Empty state:

```tsx
<GdsContainer size="content">
  <GdsStack align="center" gap="md">
    <StateBlock variant="empty" title="No records yet" />
    <ActionBar primary={{ action: 'add' }} />
  </GdsStack>
</GdsContainer>
```

## A row of *n* items that must never break (issue 619)

The commonest way a governed surface breaks on a phone is a row of items whose count and widths
are not known in advance — badges, chips, filters, actions. GDS has **two** answers, and the
whole rule is choosing between them:

| The row should… | Use | Why |
| --- | --- | --- |
| **Wrap** onto more lines | `GdsInline` (`wrap` defaults to `'wrap'`) | Everything stays visible at any width. This is the default choice. |
| **Scroll** sideways as one rail | a container with `overflow-x: auto` wrapping a `nowrap` row — what `PillBar` / `SoftChipGroup` / `FilterChipGroup` already do | Keeps a single visual line where order matters, and the content is still *reachable* because the rail scrolls. |

**There is no third option, and a raw `<div>` is not one of them.** The badge introduction was
built as a plain `<div>` with `<br />` separators — neither wrapping nor scrollable — which is
why badges were cut off the edge with no way to reach them. Measured at 390px before the fix:
badges sitting outside the viewport inside a container that could not scroll.

The distinction that matters is **reachable**, not *tight*: a chip at `right: 425` on a 390px
viewport is fine when its rail scrolls and broken when it does not. Any check for this must ask
whether the overflowing box is scrollable, or it will report every deliberate rail as a defect.

**The check exists: `npm run verify:viewport-reachability-runtime`.** It sweeps every declared
route in headless Chrome at a true 390px (device emulation — headless Chrome silently refuses
window widths under ~500px) and fails when a content element is beyond the viewport edge with
nothing able to bring it into view. Its verdicts encode this section's rule plus two more
reachability forms established by measurement: an element inside a working `overflow-x` rail is
a **rail** (fine); one inside an ancestor a transform has parked entirely outside the current
clip region is **off-canvas** chrome, revealed by interaction, like `AppShell`'s collapsed
mobile navbar (fine); one clipped by an `overflow: hidden` ancestor or inflating the document's
scroll width is **broken**. `aria-hidden` subtrees and `alt=""` images are not content and are
never counted. A first detector skipped these questions and reported 34 false positives —
slider tracks, parked drawers, deliberate rails — and was discarded rather than shipped.

The gate found two real system defects on its first honest run, both fixed at token level in
`gds-theme` (`overflow-wrap: anywhere` on governed text, so a single unbreakable token — an
email address, a long compound — can no longer inflate a column past the viewport), which is
the issue 619 pattern: the missing capability is the finding.

Both answers are token-driven: spacing comes from the density axis via `gap`, so a compact theme
tightens the row with everything else and no surface does its own arithmetic.

## Bounded viewport frame (`GdsViewportFrame`)

Some surfaces position against the **viewport** rather than their parent, and some gate
themselves on a **viewport breakpoint**. `BottomTabBar` does both — `position: fixed` plus
`hiddenFrom="sm"` — which made it impossible to show inside a page: at desktop widths it
rendered nothing, and at mobile widths it pinned itself to the window and read as the page's
own navigation rather than as an example.

`GdsViewportFrame` bounds the notion of "viewport" so such a surface can be embedded:

```tsx
<GdsViewportFrame width="compact" label="Compact width">
  <BottomTabBar items={items} activeId={activeId} />
</GdsViewportFrame>
```

Two mechanisms, because the two problems are different:

| Problem | Mechanism |
| --- | --- |
| A `position: fixed` child escapes to the window | `contain: layout paint` makes the frame a **containing block** for fixed descendants. `overflow: hidden` alone does not. |
| A breakpoint gate reads the viewport | A media query cannot resolve against an element, so the frame **publishes its width class as `data-gds-viewport-frame`**, and the governed stylesheet resolves `data-gds-viewport-gated` against it. |

Outside a frame the gate is the same media query as before, so wrapping something in a frame is
opt-in and cannot change how it renders anywhere else. Both mechanisms are **CSS**, which is
deliberate: a React context read cleaner in TSX and was the first design, but reading it would
have made every gated component a client component — and `BottomTabBar` is exported from the
server entrypoint. `check-export-contract` refused it, and the design changed rather than the
boundary. Requires `@sovereignsquad/gds-theme/styles.css`, which consumers already import once.

**Width classes** map to the governed breakpoint scale: `compact` (below `sm`, so mobile-only
surfaces resolve as mobile), `medium`, `expanded`. A surface that is mobile-only renders nothing
in a `medium` or `expanded` frame — the same answer the viewport query would give.

**Container queries** were the other candidate. They solve the second problem cleanly but would
require rewriting every gated component against `@container`, changing behaviour for consumers
who are not inside a frame — a much larger blast radius for the same result.

Use it for embedded previews, kiosk panes, split views and documentation of viewport-relative
surfaces. It is **not** a device mock: it carries no chrome, notch or status bar, because it
bounds layout rather than illustrating a phone.

## Replacement Matrix

| Local pattern | GDS replacement |
|---|---|
| `div` with inline `display`, `gap`, `padding`, or `maxWidth` | `GdsBox` |
| local vertical stack wrapper | `GdsStack` |
| local row/flex wrapper | `GdsInline` |
| toolbar/action row with wrapping | `GdsCluster` |
| local responsive grid wrapper | `GdsGrid` |
| two-column hero/detail split | `GdsSplit` |
| sidebar/content frame | `GdsSidebar` |
| negative-margin full-bleed section | `GdsBleed` |
| page max-width wrapper | `GdsContainer` |

## Accessibility

- choose `component` when `div` is not semantic enough, for example `main`, `section`, `nav`, `header`, `aside`, `ul`, or `form`
- DOM order must match focus order and screen-reader order
- do not visually reorder important controls with CSS
- wrapping controls must keep visible focus states and labels attached to their controls
- nested scroll containers must have a label when they become independently scrollable
- RTL layouts should use `side="start"` or `side="end"` rather than left/right naming

## Operational Behavior

- Invalid layout values should fail at TypeScript compile time.
- Runtime rendering is deterministic and SSR-safe.
- No retries or timeouts are required because layout primitives do not perform I/O.
- Rollback is additive: consumers can pin the previous package version or replace the primitive with the prior reviewed layout during recovery.

## Verification

Run:

```bash
npm run build
npm run test:run
npm run verify:release
```

The core test suite covers responsive normalization, semantic element rendering, scoped responsive CSS, sidebar side selection, and token-backed style resolution.
