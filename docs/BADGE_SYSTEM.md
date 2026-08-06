# Badge System

Status: Active SSOT
Version: 3.15.0
Last updated: 2026-08-06

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
- **Canonical icons in badges** (#494): badge icons render through `GdsIcon`
  from the governed `GdsIcons` dictionary, never ad hoc SVG.

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

## Suggested shape semantics (default, not enforced)

circle = interest/count · squircle = persona · hexagon = activity ·
shield = verification · rosette = certification/award · pin = location/maps.

## Where to see it live

The badges pattern on the playground (`/patterns/feedback`) renders every
component above, and the forced-colors runtime gate asserts each stays
mounted and painted under `forced-colors: active` on that route.
