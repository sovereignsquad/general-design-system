# Audit findings

Status: **IN PROGRESS — partial.** See "Coverage" for exactly what has and has not
been executed. Per Rule 12 this document states its own limits before its results.

Commit audited: `f42c65d`
Environment: local build + deployed site `sovereignsquad.github.io/general-design-system`

## Coverage

| Phase | State | Evidence |
| --- | --- | --- |
| 0 — Ground-truth registry | **Complete** | `audit/registry.json`, 2,829 atoms, all 16 expected kinds non-zero |
| 1 — Backward trace | **Complete** (bounded scope, stated below) | `audit/backward-trace.json`, 40/40 cells |
| 2 — Forward trace | **Not run** | — |
| 3 — Combinatorial sweep | **Not run** | — |
| 4a — Motion | **Complete** | this document, F1–F4 |
| 4b — i18n | Not run | — |
| 4c — Theme control | Not run | — |
| 4d — Underived | Not run | — |
| 5 — Mutation | **Not run** | — |
| 6 — Completeness critic | Not run | — |

**No clean result is claimed for any un-run phase.** Per the plan's own gate,
Phase 5 has not run, so these findings are unvalidated by mutation testing: they
are defects I found, not evidence that the audit finds all defects.

**Phase 1 scope is bounded and stated.** 4 routes x 5 presets x 2 schemes = 40
cells, 100% executed, 0 skipped. That is 5 of 25 presets and 4 of 24 routes — a
weighted slice per the WGA factor weights, **not** the full space. Findings below
are real; absence of a finding in an unvisited route or preset proves nothing.

## Phase 0 — registry

`node scripts/audit/extract-registry.mjs` → `audit/registry.json`

| Atom kind | Count |
| --- | --- |
| prop | 1,002 |
| export | 590 |
| token-published (DTCG) | 425 |
| token-emitted (`--gds-*` in TS) | 374 |
| pattern | 110 |
| variant (union literal values) | 97 |
| token-declared (CSS) | 56 |
| token-referenced (`var()` in CSS) | 52 |
| interaction-state | 26 |
| theme | 25 |
| route | 24 |
| locale-pack-package | 12 |
| motion-token | 10 |
| accent | 10 |
| locale-pack-site | 8 |
| motion-shipped | 6 |
| motion-reduced-guard | 2 |
| **TOTAL** | **2,829** |

The extractor fails hard if any expected kind resolves to zero, on the principle
that a zero means extraction broke rather than that the system lacks the atom.

---

## Findings

### F1 — `createGdsMotionCssVariables()` is dead code in the runtime

**Severity: medium.** Maintenance risk, not a user-visible defect.

`packages/gds-theme/src/motion.ts:174` exports `createGdsMotionCssVariables()`,
which emits nine `--gds-motion-*` custom properties. It is exported from
`index.ts`, `client.ts`, and `server.ts`, and exercised by
`GdsProvider.test.tsx`. **It is never called by any runtime code in this
repository** — verified by searching all of `packages/*/src` and `apps/*/src`
excluding tests and re-export lines.

The nine values it would emit are instead declared statically in
`packages/gds-theme/styles.css:113–121`, with a `prefers-reduced-motion`
override at `:1079–1086`.

So the same nine values have **two independent definitions** — a hand-maintained
TS emitter that nothing calls, and a hand-maintained CSS block that everything
uses. This is the identical dual-source pattern that `HANDOVER.md` §2 records as
the cause of the 5.0.1/5.0.2 dark-mode defect.

**Fix:** either call the emitter and delete the static block, or delete the
emitter and keep the static block. Not both.

### F2 — the governed stylesheet's own transitions bypass its own motion tokens, using off-scale values

**Severity: medium.** Rule 1 violation (ungoverned literals in the theme path).

`styles.css` declares the motion scale at `:113–121`:

```
--gds-motion-duration-instant: 0ms;
--gds-motion-duration-fast:   120ms;
--gds-motion-duration-base:   180ms;
--gds-motion-duration-slow:   240ms;
--gds-motion-duration-slower: 360ms;
--gds-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

and then, in the same file, hardcodes transitions that use none of them:

| Line | Selector | Declared |
| --- | --- | --- |
| 481 | `html[data-gds-theme-preset] a, … button` | `140ms ease` ×5 properties |
| 1183 | `.gds-tour-spotlight__hole` | `220ms ease` ×4 properties |
| 1209 | `.gds-tour-card` | `220ms ease` ×2 properties |

**140ms and 220ms are not on the scale at all.** The declared durations are
0/120/180/240/360. Two invented values, in the file that defines the scale,
350 lines below the scale.

Confirmed live on the deployed site: all 34 interactive elements sampled on
`/live-demos` compute to `0.14s` with timing function `ease`, while
`--gds-motion-duration-fast` resolves to `.12s` and `--gds-motion-ease-standard`
resolves to `cubic-bezier(.2, 0, 0, 1)` on the same page. **The tokens are live,
correct, and ignored.**

This is the substance behind "I don't see the micro animations on the buttons":
there *is* a transition, but it is a flat `ease` on colour properties, not the
governed easing curve, and nothing on the page uses the motion system's own
expressive presets.

### F3 — reduced motion is correctly handled (checked, not a defect)

Recorded because the audit checked it and the intuitive assumption was wrong.

All three hardcoded transitions in F2 *are* covered under
`prefers-reduced-motion`:

- `:481` (`a`, `button`) → covered by `:1088–1094`, which sets
  `animation/transition/transform: none !important` for
  `a`, `button`, and `[data-gds-motion]`.
- `:1183`, `:1209` (tour spotlight and card) → covered by a dedicated block at
  `:1325–1330` setting `transition: none`.

The tour spotlight travels across the viewport (`top`/`left`/`width`/`height`),
which is exactly the large-area motion that triggers vestibular responses, and it
is correctly suppressed. **No defect.**

### F4 — a figure published in the audit plan was wrong, and is corrected

**Severity: process.** Self-reported.

`docs/DEEP_AUDIT_PLAN.md` and issue #576 stated "107 motion tokens declared vs.
7 shipped declarations", framing the motion system as almost entirely unused.

**That number was wrong.** It came from `grep -cE '^\s+[a-zA-Z]+:'` over
`motion.ts`, which counts every indented key including nested fields inside
preset objects. The real counts are **5 durations, 5 easings, 7 presets**.

The corrected picture is materially different: the motion system is small and
*is* wired up (the tokens resolve live, and `theme.ts:273` and
`KanbanBoard.client.tsx:113` do consume `var(--gds-motion-*)`). The real defect
is F2 — not that the system is unused, but that the stylesheet bypasses it.

Both the plan and the issue must be corrected.

---

## Open questions status

| # | Question | Status |
| --- | --- | --- |
| Q1 | Is the published DTCG graph materially incomplete? | **Open** — Phase 2 not run. Registry shows 425 published vs 374 `--gds-*` emitted in TS; the published set is the vibe atmosphere palette only. Suggestive, not concluded. |
| Q2 | Are `-dark` sibling keys residue? | **Open.** Phase 1 ran but did not target this; the `-dark` keys appear in every cell's token map and resolve, so they are not dangling (F10), but whether they are *needed* post-5.0.2 is unanswered. |
| Q3 | Is the motion system unused? | **Resolved — no.** It is used; the stylesheet bypasses it. See F2, F4. |
| Q4 | Does GDS govern any interaction micro-motion? | **Resolved — yes, but off-token.** 34/34 interactive elements transition at `0.14s ease`, ignoring the governed 120ms/cubic-bezier. See F2. |
| Q5 | Are `ja`/`ko`/`zh` unreachable on the site? | **Open** — Phase 4b not run. Registry confirms the asymmetry: 12 package packs, 8 site packs. |
| Q6 | How many Mantine properties are GDS-governed? | **Partially resolved.** 81.6% of rendered property observations trace to a token; 18.4% do not, and the untraceable set is theme-invariant (F6), i.e. structural Mantine defaults and hardcoded CSS rather than brand-lane accidents. A per-property governance census across all 345 Mantine properties still requires Phase 4c. |


---

## Phase 1 — backward trace (Rule 1)

`node scripts/audit/backward-trace.mjs` -> `audit/backward-trace.json`

Routes: `/live-demos`, `/patterns/foundations`, `/live-demos/surfaces`,
`/patterns/operations`. Presets: `default`, `class-usa`, `gold-athlete`,
`dark-public`, `high-contrast`. Both schemes. **40/40 cells executed, coverage
100%, zero skipped.**

| Metric | Value |
| --- | --- |
| Property observations | 250,398 |
| Untraceable ("literal") observations | **46,062** |
| Untraceable rate | **18.4%** |
| Distinct untraceable values | 240 |
| Custom properties resolved per cell | 1,109–1,238 |

### Classifier construction, and its stated exclusions

Provenance is resolved against **each theme's own token map**, captured live per
cell by probing every custom property through eight CSS categories (colour,
length, duration, timing-function, shadow, weight, letter-spacing, border-width)
so `#7c3aed` and `rgb(124, 58, 237)` compare equal, and a colour token never
pollutes the duration index.

Three properties are **deliberately excluded**, with reasons, so the exclusion is
a decision rather than a silent gap:

- `min-height` / `width` / `height` — layout-computed, never style-authored
- `line-height` — computed from a unitless ratio × font-size; the computed px can
  never equal a declared token
- `font-family` — the computed value is the entire fallback stack

Two classifier defects were found and fixed during the run: duration and
timing-function tokens were not being indexed (first pass reported 135,088
untraceable, ~66% of them false), and comma-separated shorthands were compared
whole instead of per part. The final figures are post-fix.

### F5 — 18.4% of everything rendered cannot be traced to a token

**Severity: high.** Rule 1 violation, at scale.

Untraceable values by property, across all 40 cells:

| Distinct values | Property | Examples |
| --- | --- | --- |
| 72 | `outline-width` | `3px` |
| 46 | `border-top-color` | `rgb(0, 0, 0)`, various `color(srgb …)` |
| 21 | `transition-duration` | `0.2s`, `0.1s`, `0.14s` |
| 17 | `color` | `rgb(0, 0, 0)`, various |
| 17 | `outline-color` | various |
| 13 | `padding-top` | `2.4px`, `7.2px`, `14.4px`, `88px` |
| 12 | `border-top-width` | `1px` |
| 9 | `font-weight` | `500`, `600` |
| 9 | `background-color` | `rgba(0, 0, 0, 0.4)` |
| 8 | `box-shadow` | various |
| 5 | `letter-spacing` | `0.24px`, `0.25px`, `0.44px` |
| 4 | `font-size` | `13px`, `11px` |
| 3 | `padding-left` | `2.4px`, `14.4px`, `296px` |
| 2+2 | `row-gap` / `column-gap` | `6.4px`, `6px` |

### F6 — the untraceable values are theme-invariant, i.e. structural

**This is the most important structural result of Phase 1.**

Untraceable observations per cell are almost identical across every theme:

```
default/light      4,758      class-usa/light    4,590
dark-public/light  4,758      class-usa/dark     4,512
dark-public/dark   4,738      gold-athlete/dark  4,512
default/dark       4,732      high-contrast/dark 4,436
gold-athlete/light 4,596      high-contrast/light 4,430
```

A spread of 7% across five presets and both schemes means the ungoverned values
are **not** brand-lane accidents. They are structural — Mantine component
defaults and hardcoded declarations in `styles.css` — and they render identically
no matter which theme is selected. Switching theme does not change them, which is
precisely why they are invisible to any single-theme review.

It also corrects a second assumption of mine: I expected the hand-authored brand
lanes to carry disproportionate ungoverned values. **They carry slightly fewer
than `default`.** `high-contrast` carries the fewest of all.

### F7 — focus-ring geometry has no token, and it is the single largest cluster

`outline-width` accounts for 72 of 240 distinct untraceable values — the largest
group by a wide margin. `styles.css` hardcodes outline widths at `:506` (`2px`),
`:1000` (`2px`), `:1253` (`2px`), `:1334` (`3px`, forced-colors) and `:1366`
(`2px`). There is no `--gds-focus-ring-width` token.

The focus **colour** is tokenised (`--gds-focus-ring`); the **geometry** is not.
This is exactly the gap issue #558 proposes to close, now with measured evidence.

### F8 — spacing and type values are off any scale

`padding-top` yields `2.4px`, `7.2px`, `14.4px`; `letter-spacing` yields
`0.24px`, `0.44px`; `font-size` yields `13px`, `11px`; `row-gap` yields `6.4px`.
These are rem-derived Mantine defaults, not values anyone chose. There is no GDS
spacing or type scale for them to come from — the gap issues #556 and #557
propose to close.

### F9 — three more off-scale transition durations

Extending F2: beyond the `140ms`/`220ms` found in `styles.css`, the live sweep
found `0.2s` (AppShell header) and `0.1s` (Input). The GDS duration scale is
0/120/180/240/360ms. **None of 100ms, 140ms, 200ms, or 220ms is on it.**

### F10 — no dangling tokens (checked, not a defect)

Every `--gds-*` referenced in `styles.css` (28) resolves to a declaration —
47 declared in CSS plus 97 declared in the TS emitters. **Zero dangling.**

Recorded because the audit specifically suspected `--gds-focus-ring` of being
referenced-but-never-declared, which would have meant its fallback always won.
It is declared in the TS emitter path. The suspicion was wrong.
