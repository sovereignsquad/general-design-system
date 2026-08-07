# Motion System

Status: Active SSOT
Version: 4.1.3
Last updated: 2026-07-26

GDS motion is a governed token and preset system. Consumers must use `@sovereignsquad/gds-theme` motion exports instead of route-local transition durations, custom easing curves, animation-only loading states, or unbounded overlay motion.

## Architecture

```text
motion tokens
  -> preset registry
  -> reduced/no-motion resolver
  -> CSS variable contract
  -> component or theme adoption
```

The runtime contract is intentionally small:

- static token maps for duration and easing
- named presets for common UI surfaces
- a resolver that applies `system`, `reduce`, or `no-motion` policy
- CSS variable generation for hosts that need inline theme bootstrapping
- a client hook for `prefers-reduced-motion`

## Runtime API

Import static helpers from `@sovereignsquad/gds-theme` or `@sovereignsquad/gds-theme/server`:

```ts
import {
  createGdsMotionCssVariables,
  getGdsMotionPreset,
  gdsMotionDurations,
  gdsMotionEasings,
  gdsMotionPresets,
} from '@sovereignsquad/gds-theme';
```

Client surfaces may use:

```tsx
import { useGdsReducedMotion } from '@sovereignsquad/gds-theme/client';

const motion = useGdsReducedMotion();
const overlayMotion = motion.getPreset('overlay');
```

`withGdsMotion()` remains the opt-in Mantine theme helper for interactive hover/press defaults. It now consumes the same token registry.

## Tokens

Duration tokens:

- `instant`: `0ms`
- `fast`: `120ms`
- `base`: `180ms`
- `slow`: `240ms`
- `slower`: `360ms`

Easing tokens:

- `standard`: general state transitions
- `entrance`: modal, drawer, and surface entry
- `exit`: leaving surfaces
- `emphasis`: lightweight feedback affordance
- `linear`: skeleton/no-motion fallback

## Presets

Use named presets rather than inventing motion locally:

- `overlay`: modal, popover, blocking dialog
- `drawer`: drawer, sheet, mobile full-screen surface
- `command`: command palette and quick action reveal
- `list`: list, table, and card collection changes
- `feedback`: toast, notification, badge, and inline status
- `skeleton`: loading skeleton shimmer or pulse timing
- `state`: color, border, disabled, validation, and status changes

## Reduced Motion

`getGdsMotionPreset(id, 'reduce')` removes transform movement and keeps only short opacity or immediate state changes where useful.

`getGdsMotionPreset(id, 'no-motion')` returns:

- `durationMs: 0`
- `transition: "none"`
- `shouldAnimate: false`
- linear easing
- no transform

The shipped CSS also declares motion variables and resets transition/animation/transform for reduced-motion users under:

```css
@media (prefers-reduced-motion: reduce)
```

## Accessibility Rules

- Essential information must never be conveyed only by animation.
- Focus must not wait for animation completion.
- Overlays must be operable immediately after opening.
- Loading skeletons must have textual or semantic loading state nearby.
- Reduced-motion and no-motion modes must reveal the same final state.
- Route changes during animation must fail safe to the final open/closed state.

## Overlay And Feedback Policy

Overlay, drawer, and command surfaces should use the matching preset and must avoid chained custom transforms. Nested overlays are governed by the overlay manager; motion must not hide the currently focused or topmost surface.

Feedback and notification motion may emphasize state changes, but success, failure, retry, and dismissal must also be represented by text/state semantics.

## Rollback

The motion system is additive:

- components can keep existing static styles
- consumers can set policy to `no-motion`
- package CSS honors user reduced-motion preference
- consumers can pin the previous package version if an opt-in motion helper causes adoption risk

## Testing

Required coverage:

- preset registry contains all named surface presets
- reduced/no-motion resolver removes transform movement
- CSS variable generator returns zero-duration variables for `no-motion`
- theme helper uses token-backed values
- overlay and skeleton consumers verify no-motion fallbacks when adopted

Repository verification:

```bash
npm run build
npm run test:run -- packages/gds-theme/src/GdsProvider.test.tsx
npm run verify:release
```
