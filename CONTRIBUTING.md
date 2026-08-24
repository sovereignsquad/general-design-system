# Contributing

Status: Active
Version: 6.5.0
Last updated: 2026-08-09

This repository is shared design-system infrastructure.

## Standing Operating Rules (non-negotiable)

These apply to every change, every contributor (human or agent), regardless
of task. Full detail for agents in [`CLAUDE.md`](CLAUDE.md).

1. **Zero-tolerance quality gate for `main`** — no deprecation warnings, no
   warnings, no errors anywhere in the build/lint/test/`verify:release`
   chain for anything committed or merged to `main`. Fix the source; never
   suppress or hide the signal.
2. **Always work from GitHub issues** — decompose every request into
   deliverables and record them as GitHub issues before/while implementing.
   Reference and close issues from the commits that resolve them.
3. **Documentation is mandatory** — ship doc updates in the same change set
   as the behavior they describe, not as a follow-up.
4. **Industry-standard Definition of Done is mandatory** — implemented,
   tested, clean build/lint/test, documented, traceable to an issue, edge
   cases considered, committed and pushed. Explicitly checked, not assumed.
5. **Never guess** — read, research, and analyse the actual code/docs/system
   state before acting or reporting a result. If something can't be verified,
   say so instead of filling the gap with an assumption.
6. **Pre-authorized branch/push operations** — the repository owner uses
   an AI coding assistant on iOS mobile with no terminal access. `dev` and `preview`
   branches may be created, merged, and pulled without asking first. When the
   owner says "commit and push to main," push directly to `main` (no PR,
   no waiting for approval) — provided Rule 1's quality gate passes.

## Allowed Change Types

- Shared foundation rules (`FOUNDATION.md`)
- Component and UX contracts (`COMPONENTS_AND_PATTERNS.md`)
- Cross-project pattern-service contracts (`PATTERN_SERVICE_MODEL.md`)
- Governance, migration, or enforcement processes (`GOVERNANCE_AND_ADOPTION.md`)
- Project-specific migration plans under `PROJECTS/`

## Rules

1. Keep normative files cross-project. Do not document project-local hacks here.
2. Put rollout details for a specific product under `PROJECTS/`.
3. If a rule is not ready for cross-project use, keep it in the project until it is.
4. Prefer durable, reviewable language over brainstorming notes.
5. Do not weaken the Mantine-only platform rule without an explicit major-version policy change.
6. Promote repeated local UI solutions into `PATTERN_SERVICE_MODEL.md` before copying them across projects.

## Validation Expectations

Before merging shared package changes, run:

- `npm run verify:release`
- `npm run build`
- `npm run lint`
- `npm run test:run`

`vitest.config.ts` caps `maxWorkers` at 4 because each test file holds a full jsdom tree in
memory. Raising it oversubscribes a typical developer machine and produces timeout failures
that look like real assertion failures (#641); change it only with a measurement.

If a change affects root composition, shared copy, or exported component behavior, the change should include or update automated tests unless there is a documented reason it cannot.

## Adding a Component or Pattern

This is the concrete, end-to-end mechanics for shipping a new public component
or pattern. It is the practical companion to the conceptual lifecycle in
[`PATTERN_SERVICE_MODEL.md`](PATTERN_SERVICE_MODEL.md). Each new component must
pass `npm run verify:release`; the steps below are what that gate actually
checks, in the order you'll do them. Worked example: a `StatusPill` in
`@sovereignsquad/gds-core`.

1. **Create the source file(s).** Component source lives in `packages/<pkg>/src/`
   (e.g. `packages/gds-core/src/StatusPill.tsx`). If the component uses hooks,
   state, refs, or any browser API, add `'use client';` as the first line **and**
   name the file with a `.client.tsx` suffix (17 such files exist today, e.g.
   `KanbanBoard.client.tsx`); a server-safe component (no `'use client'`) is a
   plain `.tsx`. Colocate the test as `StatusPill.test.tsx` in the same folder.

2. **Export it, with JSDoc.** Add the export to the package barrel
   (`packages/gds-core/src/index.ts`) under the appropriate `// ── … ──` section
   group. Every symbol re-exported from a public entry point must carry a
   one-paragraph JSDoc (what it does + when to use it) — see the *JSDoc*
   convention below. Client-only components are additionally reachable through
   `client.ts`; server-safe ones through `server.ts`. `check-export-contract`
   fails if `server.ts` transitively reaches any `'use client'` file, so keep
   client code out of the server entry.

3. **Register it in the catalog.** Every public PascalCase UI component must be
   either registered or explicitly exempted, or `verify:component-catalog-parity`
   fails:
   - **Registered** — add (or extend) a `PatternRegistryEntry` in
     `apps/playground/src/pattern-registry.ts` with `sourceComponent: 'StatusPill'`.
     Registry membership is what drives the catalog's every-theme render,
     forced-colors check, i18n routing, and accessibility-evidence capture, so
     prefer this for anything with visible UI.
   - **Exempted** — if it is a non-catalog primitive/utility, add it to
     `boundary/component-catalog-exemptions.json` with a reason.

4. **Add export coverage.** Add an `ExportCoverageEntry` to
   `apps/playground/src/pattern-export-coverage.ts`
   (`{ packageName, exportName, status, registryId, rationale }`). **Any**
   exported `function`/`const`/`class` in package `src/` must have a coverage
   entry, or `verify:pattern-export-coverage` and `verify:api-docs-coverage`
   fail. Use `status: 'support-api'` for non-visual helpers (skips the live-proof
   evidence requirement); `registryId` must be a real `id` in `pattern-registry.ts`.

5. **Internationalize every string.** No user-facing English literal goes in a
   component. Add a `gds.*` message key and consume it via
   `useGdsTranslation().t('gds.statusPill.label', 'Status')`. The key must be
   added to **all 12 locale packs** in `packages/gds-core/src/locales/` (`en`,
   `es`, `de`, `fr`, `it`, `hu`, `ru`, `he`, `ar`, `zh`, `ja`, `ko`) with full
   parity — `verify:i18n-message-parity` fails on a key missing from any pack,
   and `verify:i18n-package-copy` / `verify:locale-coverage` guard package copy
   and route coverage.

6. **Respect the vendor boundary.** Don't leak engine types (`@mantine/*`,
   `@tabler/icons-react`, `@dnd-kit/*`) into the public `.d.ts` surface, and
   don't introduce new `.mantine-*` CSS selectors — `verify:boundary` freezes
   both surfaces to an allowlist that can only shrink. Wrap vendor types behind
   GDS-owned interfaces (see `GdsDateInputBaseProps` for the pattern) and use
   GDS styling hooks.

7. **Test and verify.** Cover the component with a colocated `.test.tsx`
   (`renderWithGds` from `test-utils/render` wires the provider/router), then run
   `npm run verify:release`. The relevant sub-checks are `build`, `lint`,
   `test:run`, `verify:component-catalog-parity`, and the `verify:references`
   chain (pattern-catalog-coverage, pattern-export-coverage, api-docs-coverage,
   locale-coverage, i18n-message-parity, owned-contrast, and more).

   Two standing sub-requirements, both from real failures the rules exist to prevent:

   - **No fixed counts (issue 541).** Any component or pattern rendering a
     variable-length collection — tiles, nav items, filter rails, badge groups —
     must be tested and demonstrated at **zero, one, and a representative full
     count**, not just the happy-path count its first demo happened to use, and
     must say something true at zero. `GdsMapFilterRail`'s tests are the model:
     an empty options array is a test case, not an assumption. This is checked
     by review rather than mechanically — a checker that flags "a demo whose
     data is one hardcoded array" cannot tell a fixture from a fixed-count
     assumption without understanding the component, so it would misfire
     constantly (evaluated under issue 541; documentation-and-test is the
     honest enforcement level).
   - **The states contract (issue 542).** Any pattern that renders data (not a
     pure primitive) must define and demo its **loading, empty, error, and
     success** states before shipping — an empty state says what happened and
     what to do next, an error state names a human cause and offers a retry —
     and must state explicitly when **unavailable** (operator-toggled-off) does
     not apply and why. `AsyncSurface`/`StateBlock` are the governed vocabulary
     for these states; `GdsMapPinPreviewCard` is the model for per-field absent
     treatments (every optional field has a defined absence, and the loading
     skeleton has the same shape as the loaded card). Whether state-demo
     coverage becomes a registry-tracked field was evaluated under issue 542
     and deferred: the registry records what IS proven (`coverageStatus` is
     derived from the demos, issue 609), and a per-state boolean would be a
     hand-maintained claim of exactly the kind Rule 14 forbids — if it becomes
     derivable from the demos themselves, it can land then.

8. **Document it.** Add the component's contract to
   `COMPONENTS_AND_PATTERNS.md` (and any deeper `docs/*.md` reference), and a
   `CHANGELOG.md` entry — per Standing Rule 3, docs ship in the same change set.

**Overlay demos (`Modal`/`Dialog`/`Drawer`/`ConfirmDialog`) must never hardcode
`opened` to a literal `true`.** A demo case rendered that way opens on first
paint and — since `onClose` in a throwaway demo is typically a no-op — can
never be dismissed, which locks page scroll and traps focus behind it,
blocking every other pattern on that page (GH-496). Give every overlay demo
real `useState` open/close behavior with a trigger button, matching
`OverlayAliasDemo` in `apps/playground/src/pattern-pages.tsx`.

## Importing an externally-designed theme

Source material for a new theme lane — a Figma file, a screenshot, an AI
design tool's output (Claude Design or otherwise), a brand guideline PDF —
is allowed to come from outside this repository. The theme that results
from it is not allowed to be a copy of that source; it must become the same
governed contract every other lane uses. This is the maintainer-facing
walkthrough for that process; the conceptual rule lives in
[`THEME_GOVERNANCE.md`](THEME_GOVERNANCE.md)'s "Importing an externally-produced
design" section, and the copy-pasteable prompt that carries a fresh agent
through the steps below is
[`TEMPLATES/GDS_THEME_CREATION_PROMPT.md`](TEMPLATES/GDS_THEME_CREATION_PROMPT.md).
The structure the incoming handoff itself should follow — fidelity statement,
role-and-rationale token tables, the states contract, content rules, the
literal-values allowlist, and a closing "open items, don't guess" list — is
[`TEMPLATES/DESIGN_HANDOFF_TEMPLATE.md`](TEMPLATES/DESIGN_HANDOFF_TEMPLATE.md)
(issue 539), codified from the ClassScout v2 handoff that set the bar.

1. **File the issue first.** Per Standing Rule 2, record the request as a
   GitHub issue before implementation starts — name the brand/product, the
   source material (link or description), and which existing shipped lane
   (if any) it's closest to.

2. **Read the source for intent, not values.** Note the palette relationships,
   type feel, and overall mood the source communicates. Do not copy a hex
   value, a spacing number, or a shadow definition straight out of a Figma
   inspector, a screenshot's sampled pixel, or a generated design tool's CSS
   output and drop it into a token file — every value that ships must be one
   a human (or agent) chose and verified in this repo, not one lifted
   unverified from elsewhere.

3. **Map the intent into the full `GdsVibeTheme` contract**
   (`packages/gds-theme/src/vibe-themes.ts`) — every field the interface
   requires (`id`, `label`, `primary`, `accent`, `glow`, and the `Light`/`Dark`
   pair for `canvas`, `shell`, `surface`, `border`, `text`, `muted`), plus
   `gradient`/`hero`, plus `flatSurfaces: true` if it's a serious brand lane
   with no decorative treatment. **The dark-mode value for every field is a
   separate, considered design decision — never a reused or derived copy of
   the light-mode value.** Issues #533 and #534 were both production
   incidents caused by exactly that shortcut (a semantic token frozen at its
   light-mode value bled into dark mode; a badge color-mix formula wasn't
   scheme-aware) — do not repeat it. If this is a full branded product theme,
   also add its `createBrandTheme('<id>', …)` semantic-role token table in
   `packages/gds-theme/src/brand-tokens.ts`, copying the exact key list an
   existing branded lane (e.g. `class-usa`) defines in
   `brandSemanticCssVariablesByPreset` — don't improvise a subset.

4. **Verify every pairing against WCAG AA** (4.5:1 normal text, 3:1 large
   text/UI components) in both light and dark, from real
   `getComputedStyle()` values on the live pattern catalog routes
   (`/patterns`, `/patterns/operations`, `/patterns/foundations`,
   `/patterns/data`) — not visual impression, not the Theme Lab preview card
   alone. `HANDOVER.md`'s environment-bootstrap section has the
   headless-Chrome/CDP pattern this repo uses for that check.

5. **Register and verify like any other lane.** Add the preset id to
   `packages/gds-theme/src/theme-presets.ts` (union type, catalog entry,
   `resolveGdsThemePreset` wiring), add live Theme Lab coverage and package
   tests, then run `npm run verify:release` clean — no exemption exists for
   an externally-sourced lane; it passes the same gates every other theme
   does.

6. **Document and close the loop.** Add a `CHANGELOG.md` entry noting the
   new lane and its source, per Standing Rule 3, and close the tracking
   issue from Step 1 referencing the resolving commit.

## Comment & Documentation Conventions

- **Issue references.** Use bare `#NNN` (GitHub's native auto-linking format)
  in comments, CHANGELOG entries, and doc prose — not `GH-NNN` or other
  variants. **Exception:** inside any `.js`/`.jsx`/`.ts`/`.tsx` file under
  `apps/*` (the consumer-surface apps `gds-compliance`'s `strict.raw-color`
  rule scans for raw hex color literals), do **not** write a bare `#NNN`
  issue reference — every digit `0-9` is also a valid hex character, so a
  3-8 digit issue number immediately after `#` is indistinguishable from a
  CSS hex color literal (`#316` reads as valid 3-digit hex shorthand) and
  will fail `verify:release`'s compliance gate. In those files, write
  `issue NNN` (no `#`) instead. `.md` files are never scanned by this rule
  and may always use bare `#NNN`.
- **JSDoc.** Every symbol re-exported from a package's public entry point
  (`index.ts`, `client.ts`, `server.ts`) — components, hooks, and exported
  utility functions — must carry a JSDoc comment explaining what it does and
  when to use it (one paragraph is enough; see `GdsBreadcrumbs.tsx` or
  `GdsDensity.tsx` for the target style). Internal helpers, `.test.tsx`
  files, and demo/story code are exempt.

  **Enforced by `npm run verify:api-jsdoc-coverage`** (in the `verify:release`
  chain), which measures every top-level export across `gds-core`, `gds-admin`,
  `gds-theme` and `gds-a11y` and fails below a 95% floor per package.

  This paragraph previously claimed enforcement by `eslint-plugin-jsdoc`'s
  `require-jsdoc` rule in `@sovereignsquad/gds-eslint-config`. That was not
  true and is corrected here (issue 516): the rule exists but is gated behind
  an `enforceExportedJsdoc` option that is only ever passed `true` inside that
  package's own unit test, and `npm run lint` targets `apps/playground` alone —
  which would not cover the packages the exports live in even if it were wired.
  The Node coverage gate is the real mechanism.
- **File-header comments are not required.** This codebase has never
  consistently used them (many long-standing files, e.g. `Typography.tsx`,
  have none) and retrofitting one everywhere would be pure diff churn with
  no functional payoff. Don't add one to a file you're not otherwise
  touching; feel free to add a short one to a file you are touching for
  another reason, if it genuinely helps orient a reader.

## Recommended Commit Scopes

- `foundation` (Changes to tokens, accessibility, Mantine baseline)
- `components` (Changes to component behaviors, responsive layouts)
- `governance` (Changes to adoption rules, review processes)
- `pattern-service` (Changes to reusable cross-project pattern contracts)
- `project-plan` (Changes under the `PROJECTS/` directory)

Examples:

- `foundation: tighten mantine-only token policy`
- `components: clarify destructive modal behavior`
- `governance: update PR checklist requirements`
- `pattern-service: add reusable article shell contract`
- `project-plan: add sso mantine refactor plan`
