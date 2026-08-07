# Icon Registry

Status: Active SSOT
Version: 4.0.0
Last updated: 2026-08-06

The icon registry is the approved replacement for consumer direct imports from `@tabler/icons-react` or other icon libraries. Consumers choose icons by GDS semantic meaning, not vendor component names.

## Package API

Use these exports from `@sovereignsquad/gds-core`, `@sovereignsquad/gds-core/server`, `@sovereignsquad/gds-core/client`, or the aggregate `@sovereignsquad/gds` entrypoints:

- `GdsIcon`
- `GdsIcons`
- `gdsIconRegistry`
- `getGdsIconKeys`
- `getGdsIconMetadata`
- `isGdsIconKey`
- `getGdsIconToneColor`

## Runtime Flow

```text
consumer semantic intent
  -> GdsIcon name or icon alias
  -> approved registry lookup
  -> metadata category and default label
  -> decorative or informative accessibility mode
  -> stable SVG render with data-gds-icon attributes
```

The registry keeps the vendor dependency internal to GDS. Consumers should not import vendor icon components directly.

## Usage

Informative icon:

```tsx
<GdsIcon name="delete" label="Delete record" tone="danger" />
```

Decorative icon inside labelled control:

```tsx
<SemanticButton action="save" />
```

Metadata lookup:

```ts
const metadata = getGdsIconMetadata('warning');
// { name: 'Warning', category: 'status', defaultLabel: 'Warning', ... }
```

Approved aliases include lowercase names such as `delete`, `save`, `warning`, `settings`, `filter`, `upload`, and `download`. Unknown runtime values recover to `Help` instead of throwing during render.

## Categories

| Category | Use |
|---|---|
| `action` | direct user action such as save, delete, edit, upload, submit |
| `status` | success, warning, danger, and info state markers |
| `resource` | domain objects such as users, gallery, course, certificate, family |
| `navigation` | menus, dashboards, home, back, grids, lists |
| `media` | camera, record, preview, hide/show, flash |
| `feedback` | messages, mail, refresh, trends, notifications, help |
| `system` | settings, language, theme, logout, filters, sorting |

## Badge Shapes (siblings, not registry entries)

The badge shape vocabulary (issue #487, epic #484) lives beside the registry in
`packages/gds-core/src/badge-shapes.ts`: `GdsBadgeShapeCircle`, `GdsBadgeShapeSquircle`,
`GdsBadgeShapeHexagon`, `GdsBadgeShapeShield`, `GdsBadgeShapeRosette`, `GdsBadgeShapePin`,
plus the closed `GdsBadgeShapes` name→component dictionary (`GdsBadgeShapeName` union).

- Each shape is authored with Tabler's public `createReactComponent` from Tabler's own
  `iconNode` path data (`IconCircle`, `IconSquareRounded`, `IconHexagon`, `IconShield`,
  `IconRosette`, `IconMapPin`'s balloon) — imported geometry, never hand-drawn, so the
  24×24 coordinate space, corner language, and `currentColor` stroke behavior match every
  registry icon by construction.
- They are deliberately **not** `GdsIcons` keys and do not render through `<GdsIcon />`:
  badge composition (`GdsBadgeStack`, issue #488) needs the full Tabler prop surface
  (`className`/`style`/`ref`/rest-spread) that `<GdsIcon />` intentionally withholds.
- The pin uses only `IconMapPin`'s balloon silhouette — the decorative inner dot is
  dropped so the head can host a composed icon (center the inner icon around y≈10.3 of
  the 24-unit canvas, not the geometric middle).

## Accessibility Rules

- informative icons require `label` and render with `role="img"`
- decorative icons are hidden with `aria-hidden`
- icon-only controls must use a labelled GDS control such as `ActionBar`, `SemanticButton`, or a button with an explicit `aria-label`
- status color must not be the only state indicator; pair status icons with text through `StateBlock`, `InlineAlert`, `StatusBadge`, or equivalent GDS copy
- high-contrast and forced-colors behavior must rely on token-backed tones, not raw color strings

## Migration

Replace direct imports:

```tsx
import { IconTrash } from '@tabler/icons-react';

<IconTrash aria-hidden />
```

with:

```tsx
<GdsIcon name="delete" decorative />
```

or, for icon-only controls:

```tsx
<ActionBar iconOnly={[{ action: 'delete', ariaLabel: 'Delete record' }]} />
```

The `tabler-icons` codemod rewrites safe one-to-one imports to `GdsIcons.*` and reports unsupported icons for semantic review.

## Compliance Scanner Behavior

`gds-compliance` flags direct `@tabler/icons-react` imports as `strict.import.tabler-icons`. Approved replacement paths are:

- `GdsIcon`
- `GdsIcons`
- semantic actions through `ActionBar` or `SemanticButton`
- reviewed vocabulary packs through `createGdsVocabularyPack`

## Operational Behavior

- no network, retry, timeout, persistence, or telemetry side effects are introduced by icon rendering
- fallback for unknown runtime names is `Help`
- rollback is additive: consumers can pin the previous package version or keep direct imports until strict enforcement is enabled

## Verification

Run:

```bash
npm run build
npm run test:run
npm run verify:release
```

The core tests cover aliases, metadata, categories, decorative/informative accessibility behavior, fallback recovery, and tone tokens.
