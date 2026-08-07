# Layout Primitives

Status: Active SSOT
Version: 4.1.1
Last updated: 2026-07-26

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
