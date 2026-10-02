# Icon Registry

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

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

Approved aliases include lowercase names such as `delete`, `save`, `warning`, `settings`, `filter`, `upload`, and `download`.

A name resolves in this order: an exact key, an alias, then a case-insensitive key match (`trendingup` and `TRENDINGUP` resolve to `TrendingUp`). Any other string, and an empty or missing name, resolves to `Help`.

Inherited `Object.prototype` member names are the exception. `isGdsIconKey` tests with the `in` operator, so it returns `true` for `constructor`, `toString`, `hasOwnProperty`, `valueOf` and `__proto__`. Those names are not resolved to `Help`: `getGdsIconMetadata` does not return registry metadata for them, and `GdsIcon` throws during render (`constructor`, `hasOwnProperty`, `valueOf`, `__proto__`) or renders text instead of an icon (`toString`). Any name that can come from data or user input must be checked as described in [Stored icon names](#stored-icon-names).

## Keys

This document does not list the keys. Read them from `getGdsIconKeys()`, and a key's category and default label from `getGdsIconMetadata()`. The reference site's icon system page, rendered by `GdsIconSystemReference`, lists every key by category from the same two functions.

## Categories

`GdsIconCategory` in `packages/gds-core/src/icons.ts` defines the categories, and `categoryByIcon` in the same file assigns keys to them. A key with no assignment reports `system`.

| Category | Use |
|---|---|
| `action` | direct user action such as save, delete, edit, upload, submit |
| `status` | success, warning, danger, and info state markers |
| `resource` | domain objects such as users, gallery, course, certificate, family |
| `navigation` | menus, dashboards, home, back, grids, lists |
| `media` | camera, record, preview, hide/show, flash |
| `feedback` | messages, mail, refresh, trends, notifications, help |
| `system` | settings, language, theme, logout, filters, sorting, and keys with no category assignment |
| `content` | rich-text formatting and editing history such as bold, quote, heading, undo |
| `commerce` | shopping, payment and pricing such as cart, wallet, discount, price |
| `security` | access state and credentials such as lock, unlock, key, biometric |

## Stored icon names

These rules apply to an icon chosen at runtime from data: a database column, a CMS field, a configuration file, or user input.

1. Store the canonical `GdsIconKey`, with its exact casing. Do not store aliases, lowercase forms, names from another icon set (such as Material Icons ligature names), or emoji.
2. Validate on read against the registry's own keys:

   ```ts
   import { getGdsIconKeys, type GdsIconKey } from '@sovereignsquad/gds-core';

   const iconKeys = new Set<string>(getGdsIconKeys());

   export function readStoredIconKey(value: string | null | undefined): GdsIconKey | undefined {
     return value != null && iconKeys.has(value) ? (value as GdsIconKey) : undefined;
   }
   ```

   `isGdsIconKey` is not a safe check for stored values, because it returns `true` for inherited `Object.prototype` member names (see [Usage](#usage)).
3. Migrate existing values from another icon set through a product-owned mapping table from each stored value to a `GdsIconKey`, and run every mapped key through the same own-key check. GDS publishes no mapping from Material Icons or any other set.
4. Treat a stored value that fails the check as a data error: log it with the record that holds it, and render the record's text label without an icon. An empty, `null` or missing value means no icon was chosen; the product decides whether that record shows one.

What the `Help` fallback means when a stored name does not resolve:

- `GdsIcon` renders the `Help` glyph and sets `data-gds-icon="Help"` on the SVG, which a test or runtime check can detect. No warning or error is emitted.
- A decorative icon (the default when no `label` is passed) is hidden from assistive technology, so only the glyph is wrong.
- An informative icon (`decorative={false}`) with no `label` takes its accessible name from the resolved key's default label, so it is announced as "Help". An icon whose key comes from data and is rendered informatively must carry its own `label`.

Emoji are not icon keys. Badges render emoji glyphs through their `emoji` prop and the badge glyph mode (`GdsProvider` `defaultBadgeIconStyle`, per-instance `iconStyle`; see [`BADGE_SYSTEM.md`](BADGE_SYSTEM.md)). Elsewhere, map an emoji value to a key or drop the icon.

A renamed or removed key breaks stored values, and a codemod cannot fix stored data. Check [`DEPRECATIONS_AND_MIGRATIONS.md`](../DEPRECATIONS_AND_MIGRATIONS.md) for icon key changes before upgrading.

## Missing concept

When no key means what a surface needs:

- Do not use a key whose meaning differs from the concept. A stand-in icon tells every reader the wrong meaning, and an informative stand-in without a `label` also gets the wrong accessible name from its default label.
- Until a key exists, render the visible text label with no icon. GDS designates no neutral placeholder key.
- Request the key: open a GDS issue that names the concept, the surfaces that need it, and a candidate Tabler icon. Registry keys are drawn from `@tabler/icons-react`.
- If a product must ship a vendor icon before the key exists, record it as a `package-coverage-gap` approved exception. A direct `@tabler/icons-react` import trips `strict.import.tabler-icons` in strict mode; the exception's required fields are listed in [`BADGE_SYSTEM.md`, "Composing icons `GdsIcons` doesn't have"](BADGE_SYSTEM.md#composing-icons-gdsicons-doesnt-have).

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

When `compliance.strictMode` is `true`, `gds-compliance` flags direct `@tabler/icons-react` imports as `strict.import.tabler-icons`. Approved replacement paths are:

- `GdsIcon`
- `GdsIcons`
- semantic actions through `ActionBar` or `SemanticButton`
- reviewed vocabulary packs through `createGdsVocabularyPack`

No rule detects icon fonts loaded with a `<link>` element, or icon names stored as data.

## Operational Behavior

- no network, retry, timeout, persistence, or telemetry side effects are introduced by icon rendering
- unknown names resolve to `Help`, except inherited `Object.prototype` member names (see [Usage](#usage))
- rollback is additive: consumers can pin the previous package version or keep direct imports until strict enforcement is enabled

## Verification

Run:

```bash
npm run build
npm run test:run
npm run verify:release
```

The core tests cover aliases, metadata, categories, decorative/informative accessibility behavior, fallback recovery, and tone tokens.
