# Motion System

Status: Active SSOT
Version: 6.10.0
Last updated: 2026-11-26

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

Import static helpers from `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-theme/server`, or `@sovereignsquad/gds-theme/tokens` where Mantine and React must not load:

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
- `ambient`: `1000ms`, for looping motion only (a typing indicator, a pending spinner)

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

## Button Reactions And Micro-interactions

Every Mantine `Button` under a GDS theme reacts to the pointer through the reaction axis tokens:

- on a mouse device (`@media (hover: hover)`), hover lifts the button by `--gds-reaction-hover-lift`
- press sinks it to `--gds-reaction-pressed-scale` (default `0.97`, no lift)
- a pending (`aria-disabled`), loading or disabled button does not react

`SemanticButton` runs an action's whole feedback cycle from a promise:

```tsx
<SemanticButton action="save" onAction={() => saveDraft()} />
```

- **Pending.** Shown only if the promise is still running after `GDS_BUTTON_PENDING_DELAY_MS` (500ms), then held at least `GDS_BUTTON_PENDING_MIN_MS` (200ms), so a fast action never flashes a spinner. The label changes to the action's pending text ("Saving…") and the icon runs the action's pending motion. Clicks are ignored and the button is `aria-disabled`, so it keeps keyboard focus.
- **Success or error.** The button shows the result for `GDS_BUTTON_FEEDBACK_DURATION_MS` (2000ms), then returns to rest. Success runs the action's success motion; error turns the button red, shows a cross, shakes briefly and shows "Failed".
- **Confirm first.** An action declaring `motion.confirm` (`delete`) asks "Click again to confirm" on the first click and disarms after `GDS_BUTTON_CONFIRM_WINDOW_MS` (3000ms).
- **No layout shift.** A button with `onAction` or `feedbackState` reserves the width of its widest label.
- **Announcements.** A polite live region announces pending, success and the full error message.

Each action's motion is declared in the vocabulary (`GdsVocabulary[action].motion`):

| Action | Pending | Success |
| --- | --- | --- |
| `send` | spinner | icon flies off, check pops in |
| `save` | spinner | check draws |
| `copy` | spinner | check pops in |
| `delete` | spinner (after confirm) | check pops in |
| `add` | spinner | icon turns a quarter, check pops in |
| `download` | arrow bobs down | check draws |
| `upload` | arrow bobs up | check draws |
| `refresh` | icon spins | check pops in |
| `reward` | spinner | icon pops |
| `complete` | spinner | icon draws |

Actions without a declared success motion use the spinner and pop their own success icon. Some actions have their own pending loop instead of the spinner: `search` (the lens circles), `record` (breathes), `restore` and `reset` (turn back), `print` (the page feeds), `export` and `import` (the arrow bobs), `habit` (the rings light in turn).

### Click motions

Every vocabulary action also declares `motion.press`, a click motion played once on every click of a `SemanticButton`, with or without `onAction`. It is chosen from what the action's icon depicts, after Apple's SF Symbols effects and the animated icon sets (lucide-animated, Lordicon):

| Kind | Click motions | Examples |
| --- | --- | --- |
| Whole icon | `ring`, `rock`, `swing`, `turn`, `quarter`, `rewind`, `blink`, `bounce`, `pop`, `celebrate`, `scribble`, `flip`, `page`, `shutter`, `flicker`, `squeeze`, `wave`, `launch`, `orbit`, `drop`, `nudge-left`, `nudge-right`, `nudge-up-right`, `nudge-down-right` | notifications rings, settings turns, eye blinks, trophy celebrates, play nudges right |
| Strokes | `draw`, `draw-last`, `draw-stagger` | home draws its outline, check draws its tick, language draws stroke by stroke |
| One part of the icon | `lid`, `separate`, `join`, `plus`, `bars`, `dip`, `date`, `cells`, `rows`, `sweep`, `arrow-in`, `arrow-out`, `knob`, `swap`, `feed`, `flap`, `needle`, `share`, `rings` | delete lifts the lid, duplicate separates the sheets, users slides the second person in, mail opens the flap |

The full action-by-action table is on the reference site's Button Micro-feedback page, read from `GdsVocabulary`. Rules:

- One motion per meaning: actions that mean the same share a motion (duplicate and clone separate; back and reply nudge left).
- Discrete and short: every click motion runs on the `base`, `slow` or `slower` token (under 500ms) and plays once. A repeated click restarts it. A button returning to rest after a result does not replay it.
- No icon motion on hover; Apple advises against motion on frequent interactions.
- A plain click never changes the label; only `onAction` and `feedbackState` do, so navigation actions keep theirs.
- Part-level motions address the Tabler icon's paths by position (`path:nth-of-type`), so a vocabulary pack that swaps an action's icon should also choose a whole-icon motion.

`verify:button-motion-runtime` clicks every action on the reference site and fails when its click motion does not run, when a plain click changes the label, or when anything animates under reduced motion. The keyframes are `gds-button-*` in `styles.css`; they animate only `transform`, `opacity` and stroke offset, on the motion tokens. `verify:button-motion-runtime` checks every declared motion on the reference site, the width, the hover and press transforms, and that nothing animates under reduced motion.

## Reduced Motion

`getGdsMotionPreset(id, 'reduce')` removes transform movement and keeps only short opacity or immediate state changes where useful.

`getGdsMotionPreset(id, 'no-motion')` returns:

- `durationMs: 0`
- `transition: "none"`
- `shouldAnimate: false`
- linear easing
- no transform

Under reduced motion the button cycle keeps its labels, colours and announcements; icons and labels swap without animation, loops stop, and the hover and press transforms are off.

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
