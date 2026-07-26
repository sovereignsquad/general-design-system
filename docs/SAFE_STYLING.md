# Safe Styling API

Status: Active SSOT
Version: 3.14.5
Last updated: 2026-07-26

The safe styling API is the approved replacement for product-local inline styles and arbitrary CSS when a full component contract is not the right fit. It constrains common visual needs to GDS tokens and semantic enums.

## Package API

Use these exports from `@sovereignsquad/gds-core`, `@sovereignsquad/gds-core/server`, `@sovereignsquad/gds-core/client`, or the aggregate `@sovereignsquad/gds` entrypoints:

- `gdsStyle`
- `createGdsStyleContract`
- `GdsSafeBox`
- `GdsMediaFrame`
- `GdsOverflowFrame`
- `GdsResponsiveVisibility`

## Runtime Flow

```text
consumer styling intent
  -> GdsSafeStyleProps enum/token contract
  -> token resolver and scanner marker attributes
  -> scoped responsive visibility CSS when needed
  -> GDS-rendered media/overflow/visibility helper
  -> compliance scanner or codemod evidence
```

The helpers do not perform I/O, do not retry, do not use timers, and do not add a runtime CSS framework dependency.

## Approved Props

```tsx
<GdsSafeBox
  safeStyle={{
    background: 'surface',
    border: 'default',
    radius: 'lg',
    shadow: 'subtle',
    overflow: 'contained',
    inset: 'md',
  }}
>
  Governed content
</GdsSafeBox>
```

Supported groups:

- backgrounds: `canvas`, `surface`, `subtle`, `accent`, `danger`, `success`, `warning`, `info`, `transparent`
- borders: `none`, `default`, `subtle`, `accent`, `danger`, `success`, `focus`
- radius: `none`, `sm`, `md`, `lg`, `xl`, `round`
- overflow: `visible`, `clip`, `scroll-x`, `scroll-y`, `auto`, `contained`
- media fit: `cover`, `contain`, `fill`, `scale-down`
- aspect ratio: `square`, `video`, `photo`, `wide`, `portrait`
- visibility: `visible`, `hidden`, `screen-reader-only`, including responsive breakpoint objects

## Helpers

Media:

```tsx
<GdsMediaFrame fit="cover" aspectRatio="video">
  <img src={src} alt={alt} />
</GdsMediaFrame>
```

Overflow:

```tsx
<GdsOverflowFrame policy="contained" label="Transaction table overflow">
  <SimpleDataTable rows={rows} columns={columns} />
</GdsOverflowFrame>
```

Responsive visibility:

```tsx
<GdsResponsiveVisibility visibility={{ base: 'screen-reader-only', md: 'visible' }}>
  Expanded guidance
</GdsResponsiveVisibility>
```

Low-level contract:

```tsx
const contract = createGdsStyleContract('product-preview', {
  background: 'subtle',
  border: 'default',
  radius: 'lg',
});
```

Use the low-level contract for GDS-owned package integration or reviewed adapter code. Product UI should prefer `GdsSafeBox`, `GdsMediaFrame`, `GdsOverflowFrame`, and `GdsResponsiveVisibility`.

## Do Not Use

Do not use raw inline values:

```tsx
<div style={{ color: '#111', padding: '17px', borderRadius: 13 }} />
```

Do not hide content with unlabelled CSS:

```tsx
<div style={{ display: isMobile ? 'none' : 'block' }} />
```

Do not create local media wrappers:

```tsx
<div className="card-image-frame"><img /></div>
```

Use the safe styling helpers instead so color, spacing, radius, overflow, and visibility remain token-backed and scanner-visible.

## Compliance Scanner Behavior

`gds-compliance` flags raw inline style attributes as `strict.inline-style`. The remediation now points to:

- `GdsSafeBox`
- `GdsMediaFrame`
- `GdsOverflowFrame`
- `GdsResponsiveVisibility`
- layout primitives from `docs/LAYOUT_PRIMITIVES.md`

The `inline-styles` codemod remains dry-run classification only and emits governed exception stubs for cases that require design-token review.

## Accessibility

- contrast-sensitive backgrounds use semantic roles, not arbitrary color values
- focus indicators cannot be disabled by safe-style props
- `screen-reader-only` keeps content available to assistive technology
- overflow regions should be labelled when independently scrollable
- media frames must preserve meaningful `alt` text on the media element
- forced-colors mode is declared through `data-gds-forced-colors`

## Operational Behavior

- invalid styling values fail at TypeScript compile time
- scanner enforcement is controlled through existing manifest strict mode
- no secrets, credentials, user data, or source contents are emitted by helpers
- rollback is additive: revert the helper usage or pin the previous package version

## Verification

Run:

```bash
npm run build
npm run test:run
npm run verify:release
```

The core tests cover token resolution, scanner marker attributes, responsive visibility CSS, media fit/aspect behavior, overflow policy, and compliance remediation text.
