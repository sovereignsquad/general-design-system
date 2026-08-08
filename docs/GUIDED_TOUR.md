# Guided Onboarding Tour

Status: Active SSOT
Version: 4.1.7
Last updated: 2026-08-06

A governed, accessible **guided tour** (spotlight coach-marks): it dims the
viewport with the `--gds-overlay-scrim` token, cuts a spotlight hole over the
current target element, and anchors a step card explaining that function, with
Back / Next / Skip / Done and a "Step _n_ of _m_" indicator. It ships in
`@sovereignsquad/gds-core` so every product gets one accessible, i18n'd,
theme-aware onboarding flow with no app-level forks (issue #466).

Stacking order is guaranteed as scrim < spotlighted target < step card
(`--mantine-z-index-overlay` + 0/1/2): the card renders as a portal *sibling*
of the spotlight, never inside it, so a tall spotlighted section can never
paint over the dialog even when the two overlap on small viewports (#495).

## Public surface

| Export | Kind | Purpose |
|---|---|---|
| `GdsTourProvider` | provider | Mount once inside `GdsProvider`. Holds tour state and renders the spotlight + step card. |
| `useGdsTour()` | hook | Imperative control: `start(id, steps, opts)`, `next()`, `back()`, `goTo(i)`, `stop(reason)`, plus `status`, `index`, `count`, `activeStep`. |
| `GdsGuidedTour` | component | Declarative wrapper — starts a tour when `open` becomes true (persist-aware). Renders nothing. |
| `GdsTourButton` | component | Governed launcher control — a themeable `.gds-tour-launch` button whose label reads the localized `gds.tour.launch` key; starts the given tour on click. |
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

   …or drop in the governed launcher control (localized label, no raw button):

   ```tsx
   import { GdsTourButton } from '@sovereignsquad/gds-core';

   <GdsTourButton tourId="editor-intro" steps={steps} persist="localStorage" />
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
- **i18n** — the Back / Next / Skip / Done / "Step _n_ of _m_" controls and the
  `GdsTourButton` launcher label read the `gds.tour.*` keys (including
  `gds.tour.launch`), shipped in all 12 GDS locale packs.

## Tokens

| Token | Role |
|---|---|
| `--gds-overlay-scrim` | The dimming scrim color (light/dark via the stylesheet; `transparent` under forced-colors). |
| `--gds-tour-spotlight-radius` | Corner radius of the spotlight hole. |
| `--gds-tour-spotlight-padding` | Default halo around the target inside the hole. |

Never hard-code an `rgba()` dim in product code — read `--gds-overlay-scrim`.

## Where it's used

The GDS site dogfoods the module across **every primary destination** through one
shared [`SiteTourLauncher`](../apps/playground/src/SiteTourLauncher.tsx) control —
a consistent "Take the guided tour" button on every page, plus a gate-safe
first-run auto-start on the pages a verification gate never drives.

**Auto-start pages** (launcher button + first-run overlay):

- **Home** — the live Theme Lab, the "what GDS gives you" band, get-started links.
- [**Use with AI**](https://sovereignsquad.github.io/general-design-system/ai) —
  the llms.txt entry point, install/bootstrap, and the non-negotiable agent rules.
- **Pattern Catalog** — browse the pattern families and the SSOT traceability promise.
- **Live Demos** — open a demo family and read the shipped-contract guarantee.
- **API Reference** — the export summary lanes and the searchable export table.
- **Coverage** — the shipped-vs-pending status band and the accessibility evidence.
- **Maturity** — the delivery-maturity summary and the issue-backed capabilities.
- **Use Cases** — pick the lane by product shape and confirm its operational contract.
- **Governance** — the non-negotiable rules and enforced accessibility evidence.
- **Request a Feature** — the intake form and the triage/repository-hygiene contract.

**Manual-only pages** (launcher button, no auto-start — a runtime gate visits
these bare routes, so an auto-opened overlay would surface mid-verification):

- **Install** (`/install`) — visited by the accessibility runtime gate.
- **Themes** (`/themes`) — visited by the theme-trust, accessibility, and
  forced-colors runtime gates.

The shared launcher centralizes the gate-safe auto-start decision so every page
behaves identically: pass `autoStart` on a page no gate drives, omit it on a
gate-visited route.

### Auto-start without breaking automated gates

`SiteTourLauncher` only auto-opens when **all** of these hold, so the overlay
never surfaces during headless verification:

- **A bare URL** — `window.location.search === ''`. GDS's browser runtime gates
  visit query-bearing routes (`/?locale=xx`) or deep sub-routes; a real visitor
  arrives on a clean path. This alone keeps the gate's localized-home visits from
  triggering the home tour.
- **A real browser** — `typeof Element.prototype.scrollIntoView === 'function'`.
  This is `true` in Chrome and `false` under jsdom, so page unit tests that render
  a page standalone never auto-fire the tour.
- **`autoStart` opted in** — pages a gate visits by their bare path (`/install`,
  `/themes`) omit `autoStart` entirely and expose the manual launcher only.

Combined, these are deterministic and need no automation sniffing (unreliable
under raw-CDP headless Chrome). When you add an auto-start tour to your own app,
prefer a first-run surface your test/CI harness does not drive, or gate the
auto-start behind a signal your harness never satisfies (a clean URL, or an
explicit "onboarding enabled" flag it can turn off).
