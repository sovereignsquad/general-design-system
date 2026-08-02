# Guided Onboarding Tour

Status: Active SSOT
Version: 3.14.16
Last updated: 2026-08-02

A governed, accessible **guided tour** (spotlight coach-marks): it dims the
viewport with the `--gds-overlay-scrim` token, cuts a spotlight hole over the
current target element, and anchors a step card explaining that function, with
Back / Next / Skip / Done and a "Step _n_ of _m_" indicator. It ships in
`@sovereignsquad/gds-core` so every product gets one accessible, i18n'd,
theme-aware onboarding flow with no app-level forks (issue #466).

## Public surface

| Export | Kind | Purpose |
|---|---|---|
| `GdsTourProvider` | provider | Mount once inside `GdsProvider`. Holds tour state and renders the spotlight + step card. |
| `useGdsTour()` | hook | Imperative control: `start(id, steps, opts)`, `next()`, `back()`, `goTo(i)`, `stop(reason)`, plus `status`, `index`, `count`, `activeStep`. |
| `GdsGuidedTour` | component | Declarative wrapper — starts a tour when `open` becomes true (persist-aware). Renders nothing. |
| `GdsTourStep` | type | One step: `{ id, target, title, body, placement?, canSkip?, spotlightPadding?, interaction? }`. |
| `useHasSeenTour(id)` | hook | SSR-safe check for whether a persisted tour was already completed on this device. |

## Add a product tour (consumer drop-in)

1. **Mount the provider once**, at the app root, inside `GdsProvider`:

   ```tsx
   import { GdsProvider } from '@sovereignsquad/gds';
   import { GdsTourProvider } from '@sovereignsquad/gds-core';

   <GdsProvider>
     <GdsTourProvider>
       <App />
     </GdsTourProvider>
   </GdsProvider>
   ```

2. **Tag the elements to spotlight** with a stable `data-gds-tour-target` id (a
   React ref also works — refactor-safe, no brittle CSS selectors):

   ```tsx
   <button data-gds-tour-target="save">Save</button>
   ```

3. **Define steps and start the tour** (imperative):

   ```tsx
   import { useGdsTour, type GdsTourStep } from '@sovereignsquad/gds-core';

   const steps: GdsTourStep[] = [
     { id: 'save', target: 'save', title: 'Save your work', body: 'Changes persist instantly.' },
     { id: 'share', target: 'share', title: 'Share', body: 'Invite teammates here.', placement: 'bottom' },
   ];

   const tour = useGdsTour();
   <button onClick={() => tour.start('editor-intro', steps, { persist: 'localStorage' })}>Take the tour</button>
   ```

   …or declaratively, to auto-run once for first-time users:

   ```tsx
   import { GdsGuidedTour } from '@sovereignsquad/gds-core';

   <GdsGuidedTour id="editor-intro" steps={steps} open persist="localStorage" />
   ```

## Behavior & accessibility

- **Targeting** — `data-gds-tour-target="<id>"` or a React ref. A missing target
  logs a dev warning and skips the step rather than crashing.
- **Interaction** — the spotlighted element is read-only by default; pass
  `interaction: 'allow-target'` on a step to let the user click through the hole.
- **Keyboard** — `Esc` skips (when the step allows), `Enter` / `→` advances,
  `←` goes back, `Tab` is trapped inside the step card.
- **Focus** — the step card is a focus-trapped `role="dialog"`
  (`aria-labelledby`/`aria-describedby`); focus moves into it on each step and
  **returns to the invoker** when the tour ends.
- **Announcements** — a polite live region reads "Step _n_ of _m_" on each step.
- **Reduced motion** — `prefers-reduced-motion` removes the spotlight travel
  animation. **Forced colors** — the dim is invisible, so the spotlight degrades
  to a strong outline on the target and the card uses system colors.
- **Scroll** — the current target is scrolled into view; background scroll is
  locked while a tour runs; the spotlight repositions on scroll/resize.
- **Persistence** — `persist: 'localStorage'` marks a `tourId` seen so an
  auto-start tour runs only once; default is no persistence.
- **i18n** — the Back / Next / Skip / Done / "Step _n_ of _m_" controls read the
  `gds.tour.*` keys, shipped in all 12 GDS locale packs.

## Tokens

| Token | Role |
|---|---|
| `--gds-overlay-scrim` | The dimming scrim color (light/dark via the stylesheet; `transparent` under forced-colors). |
| `--gds-tour-spotlight-radius` | Corner radius of the spotlight hole. |
| `--gds-tour-spotlight-padding` | Default halo around the target inside the hole. |

Never hard-code an `rgba()` dim in product code — read `--gds-overlay-scrim`.

## Where it's used

The GDS site dogfoods the module on two surfaces, each **auto-running once** for
first-time visitors (persisted per device) with a "Take the guided tour" control
that replays on demand:

- **Home page** — spotlights the live Theme Lab, the "what GDS gives you" band,
  and the get-started links.
- [**Use with AI**](https://sovereignsquad.github.io/general-design-system/ai) —
  spotlights the llms.txt entry point, the install/bootstrap step, and the
  non-negotiable agent rules.

### Auto-start without breaking automated gates

Auto-first-run is scoped to a route that no headless verification gate visits.
GDS's browser runtime gates start with empty `localStorage` — so to them every
run looks like a "first visit" — which means an unconditional auto-start would
render the tour overlay over the page a gate is asserting against and flake it.
Rather than sniff for automation (unreliable under raw-CDP headless Chrome), the
site uses two deterministic, route-aware signals:

- **`/ai`** — a route no runtime gate loads at all, so its auto-start is
  unconditional.
- **Home (`/`)** — a route the `theme-trust` gate *does* load, but only ever as
  `/?locale=xx` (with a query string), never bare `/`. So its auto-start is gated
  on `window.location.search === ''`: a real visitor on `/` sees it once; the
  gate's `/?locale=…` visits never trigger it.

When you add an auto-start tour to your own app, prefer a first-run surface your
test/CI harness does not drive, or gate the auto-start behind a signal your
harness never satisfies (a clean URL, or an explicit "onboarding enabled" flag
it can turn off).
