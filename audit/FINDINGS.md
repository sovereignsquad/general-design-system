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
| 2 — Forward trace | **Complete** | `audit/forward-trace.json`, 365 cells |
| 3 — Combinatorial sweep | **Not implemented** | — |
| 4a — Motion | **Complete** | this document, F1–F4 |
| Remediation | #553, #519, #520, #578, #537 shipped | commits 9c07819, and this one |
| 4b — i18n | **Complete** (parity + leakage only) | `audit/dimensions.json` |
| 4c — Theme control | **Complete** | `audit/dimensions.json` |
| 4d — Underived | **Complete** | `audit/dimensions.json` |
| 5 — Mutation | **Run — FAILED its own gate** | `audit/mutation-score.json`, 85.7% vs 100% required |
| 6 — Completeness critic | **Complete** | `audit/completeness-critique.md` |

> ## VERDICT: the audit does not pass its own gate
>
> Phase 5 required **100% on M1-M12**. Achieved **85.7% (6/7 run), 5 not run**.
>
> The defects below are individually verified. **No claim of completeness is
> supported.** "18.4% untraceable" is what the audit found, not the true figure.
> "0/73 tokens satisfy all five" is a floor. And crucially, **Phase 1 is entirely
> unvalidated** - M1 and M2, the only mutants that would test it, did not run.
>
> See `audit/completeness-critique.md` for the full list of what was not covered.

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
| Q1 | Is the published DTCG graph materially incomplete? | **Resolved — yes, severely.** The published graph (17 atmosphere roles) and the 73 semantic tokens that paint components overlap by exactly **1**. See F12. |
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


---

## Phase 2 — forward trace (Rule 2)

`node scripts/audit/forward-trace.mjs` -> `audit/forward-trace.json`

Token universe: **73** `--gds-*` tokens (34 `-dark` scheme siblings excluded as
partners of their base, not independent tokens). **365 matrix cells**
(73 x 5 obligations).

| Obligation | Satisfied | Gap | Confidence |
| --- | --- | --- | --- |
| listed | 42/73 (58%) | 31 | high — direct lookup against the published graph + docs corpus |
| demoed | 58/73 (79%) | 15 | high — direct `var()` reachability from shipped CSS/TS |
| explained | 42/73 (58%) | 31 | medium — prose-window heuristic |
| variationsShown | 1/73 (1%) | 72 | **LOW — proxy heuristic** |
| useCase | 4/73 (5%) | 69 | **LOW — directive-phrase heuristic** |

**Confidence is reported per obligation because two of the five are weak.** A
false negative on `variationsShown` or `useCase` does **not** prove the site
omits that variation or use case — it proves the heuristic could not find it.
Those two numbers are directional, not conclusions.

### F11 — zero tokens satisfy all five obligations

**0 of 73.** Every token has at least one gap. Even discounting the two
low-confidence obligations entirely, **31 tokens are undocumented anywhere** in
the docs corpus or the published graph, and 15 are unreachable.

### F12 — the published token graph and the tokens that paint the system are near-disjoint sets

**Severity: high. This resolves Q1, and it is the sharpest result of Phase 2.**

- Published DTCG graph: **17 roles** — `primary`, `accent`, `glow`,
  `canvas-light/dark`, `shell-light/dark`, `surface-light/dark`,
  `border-light/dark`, `text-light/dark`, `muted-light/dark`, `gradient`, `hero`.
  These are the *vibe atmosphere palette*.
- Tokens that actually paint components: **73** semantic roles — `--gds-bg-card`,
  `--gds-text-body`, `--gds-border-card`, `--gds-badge-info`, and so on.
- **Overlap: exactly 1** (`accent`).

So `tokens/gds.tokens.json` — the artifact a design tool imports, and the one
`verify:tokens-dtcg` drift-checks — describes 17 atmosphere colours and **72 of
the 73 tokens that determine what a component actually looks like are absent
from it.**

The published graph is not a subset of the system. It is a different, much
smaller thing wearing the system's name.

### F13 — 15 declared tokens are unreachable

Declared, but referenced by no shipped CSS rule or component style, so nothing
can ever render them:

```
--gds-vibe-warning            --gds-badge-attention       --gds-bg-canvas
--gds-vibe-success            --gds-badge-validation      --gds-bg-page
--gds-vibe-hero               --gds-badge-info            --gds-brand-primary-pressed
--gds-motion-duration-instant --gds-badge-urgencyBg       --gds-accent
--gds-motion-ease-exit        --gds-nav-inactiveOnInverse --gds-tour-spotlight-padding
```

Note `--gds-badge-info`, `--gds-badge-attention`, `--gds-badge-validation` and
`--gds-badge-urgencyBg` in that list — the badge tone tokens, unreachable, while
issue #534 reports fixed-tone badges failing WCAG contrast in dark mode. Whether
those are related is **not established** and must not be assumed; it is flagged
for Phase 4d.

### F14 — two more classifier defects, found and fixed

**Severity: process.** Self-reported, consistent with F4.

1. `--gds-foo` appeared in the first token universe. It is not a token — it comes
   from a JSDoc example in `GdsProvider.tsx:82` illustrating the pair-collapsing
   pattern. Comment stripping was added; the universe dropped 74 -> 73.
2. `variationsShown` and `useCase` were initially reported as flat percentages.
   Both rest on weak heuristics, and reporting 1% without that qualifier would
   have implied a certainty the method does not support. Per-obligation
   confidence is now emitted in the artifact itself.

This is the third and fourth classifier defect the audit has found in its own
tooling (see F4, and the two fixed during Phase 1). Every one was found by
checking a suspicious result rather than accepting it — which is the behaviour
Phase 5 exists to make systematic rather than lucky.


---

## Phase 4b — language variants (Q5)

### F15 — three package locales have no site pack

**Resolves Q5 — yes.** `ja`, `ko`, `zh` ship as `gds-core` locale packs but have
no `generated-site-phrases` pack. The packages support Japanese, Korean and
Chinese; **the reference site cannot render in them.**

Key parity is otherwise clean: zero missing and zero extra keys across all 12
package packs and all 8 site packs.

### F16 — English leakage is wider than issue #517 records

Values identical to their English source:

| Corpus / locale | Untranslated | Rate |
| --- | --- | --- |
| site / **hu** | 47 / 1249 | **3.8%** |
| site / **de** | 43 / 1249 | **3.4%** |
| site / he | 41 / 1249 | 3.3% |
| package / de | 5 / 188 | 2.7% |
| site / fr | 31 / 1249 | 2.5% |
| package / fr | 4 / 188 | 2.1% |
| site / it, site / ru | 20 / 1249 | 1.6% |
| site / ar | 18 / 1249 | 1.4% |
| site / es | 17 / 1249 | 1.4% |
| package / es, package / zh | 1 / 188 | 0.5% |

Issue **#517 names `ar`, `he`, `zh`**. The two worst offenders are **`hu` and
`de`**, which #517 does not mention, and `ar` is mid-table. #517's scope is
incomplete and should be widened.

**Not covered:** RTL rendering and pseudo-localization, both named in the plan.
This sub-phase measured key parity and leakage only.

## Phase 4c — theme control (Q6)

### F17 — GDS consumes 92 Mantine variables and declares 5

**Resolves Q6.**

| | |
| --- | --- |
| `--mantine-*` GDS declares | **5** |
| `--mantine-*` GDS consumes | **92** |
| **Consumed but never declared by GDS** | **87** |
| Mantine components with GDS defaults | 20 |

87 framework values are load-bearing in GDS's own stylesheet without GDS ever
setting them. Combined with F6 (untraceable values are theme-invariant), this is
the mechanism: the ungoverned 18.4% is largely Mantine defaults flowing through
because GDS never overrode them.

## Phase 4d — underived dimensions

### F18 — 60% of the registry has no phase coverage

| Kind | Atoms | Covered by |
| --- | --- | --- |
| `export` | 590 | **nothing** |
| `prop` | 1,002 | **nothing** |
| `variant` | 97 | **nothing** |
| `accent` | 10 | **nothing** |

**1,699 of 2,829 atoms — 60% — were never evaluated against any obligation.**
This is the audit's own largest gap and is stated here rather than left implicit.

## Phase 5 — mutation (the gate)

**6/7 killed = 85.7%. Required: 100%. GATE FAILED.**

| Mutant | Targets | Result |
| --- | --- | --- |
| M3 remove a token from the published DTCG graph | Phase 2 `listed` | **SURVIVED** |
| M4 make a declared token unreachable | Phase 2 `demoed` | killed |
| M5 add an undocumented token | Phase 0 + 2 | killed |
| M6 delete a locale key | Phase 4b parity | killed |
| M7 replace a translation with English | Phase 4b leakage | killed |
| M11 add an undeclared Mantine dependency | Phase 4c | killed |
| M12 add a prop variant | Phase 0 | killed |
| M1, M2, M8, M9, M10 | Phases 1, 3, 4a | **NOT RUN** |

### F19 — M3's survival invalidates the reported `listed` figure

Not a coding bug. `listed` resolves as `publishedRoles.has(role) ||
docBlob.includes(name)`, and because the published roles and the `--gds-*`
universe are near-disjoint (F12), the first clause almost never decides. So
`listed` measures **"the name appears in some markdown file"**, not "present in a
published inventory".

**The reported 42/73 (58%) overstates the obligation.** Under the stricter
reading it is closer to 1/73. F12 itself is unaffected — it was derived by direct
set comparison, and M3's survival is further evidence *for* it.

### F20 — two mutants were themselves defective and had to be fixed

M4 replaced only the first of two `var(--gds-focus-ring,` references, leaving the
token reachable — it read as an analysis survivor when it was a weak mutant. M7
mutated both sides of a locale entry to *different* strings, so it could never
create the key-equals-value condition leakage detection looks for.

Both were fixed and both then killed. Score moved 57.1% → 71.4% → 85.7%.

**A mutation harness can be wrong in the direction that flatters the audit.**
Two of three original survivors were harness defects, not analysis defects — and
had they gone undiagnosed they would have understated the audit's real
capability, while a defect in the opposite direction would have overstated it.
This is the fifth and sixth defect the audit has found in its own tooling.


---

## F21 — the mutation harness left contaminated artifacts on disk

**Severity: high (tooling). Self-reported. This is the seventh defect the audit has
found in its own tooling.**

`scripts/audit/mutate.mjs` restored mutated **source** correctly but not the
**artifacts**. Each analysis run rewrites `audit/registry.json`,
`audit/forward-trace.json` and `audit/dimensions.json`, so the last file written by a
mutation run is a *mutant's* output, not the clean baseline.

The committed `audit/forward-trace.json` was carrying `--gds-audit-mutant-token` —
the M5 mutant's planted value.

**How it was caught, and why that matters.** While transcribing initial values for
`audit/budgets.json`, the numbers came out as:

| Budget | Contaminated | Clean |
| --- | --- | --- |
| `tokensWithGaps` | 74 | **73** |
| `unreachableTokens` | 16 | **15** |
| `undeclaredMantineDependencies` | 88 | **87** |
| `registryAtomsWithoutCoverage` | 1703 | **1699** |

Each was inflated by exactly the mutants' planted atoms. They did not match the
figures already published in this document, and that mismatch is the only reason it
surfaced. **Had the transcription been done without cross-checking, every budget in
the ratchet — the file the entire health-retention plan depends on — would have been
seeded from poisoned data, permanently one unit too loose.**

**Fix:** the harness now snapshots the clean artifacts before the first mutant,
restores them in a `finally`-equivalent path plus SIGINT/SIGTERM handlers, and
asserts no mutant marker survives the run. A surviving marker fails the harness.

**The general lesson, which generalises past this harness:** a test tool that writes
artifacts must treat those artifacts as state to restore, exactly like source. F20
recorded that a mutation harness can be wrong in the direction that flatters the
audit; F21 records that it can also silently corrupt the inputs of everything
downstream of it.


---

## F22 — two release-chain gates are blind to the 73 semantic tokens

**Severity: high.** Found by the gate mutation suite (#580) on its first real run.
This is F12's root cause reaching further than F12 reported.

`verify:theme-tokens` and `verify:theme-accessibility` both **exit 0 under a planted
defect**:

| Mutant | Planted | Gate verdict |
| --- | --- | --- |
| Rename `--gds-support` to `--gds-support-RENAMED` in the derived semantic set | a semantic token vanishes | **passes** |
| Set `--gds-text-body` to `#f5f5f5` (near-white on a light canvas) | a text role fails contrast | **passes** |

Both were rebuilt before the gate ran, so this is not the dist-staleness artefact that
made the first attempt a false accusation — the gates genuinely do not see it.

**Cause, verified rather than inferred:**

- `validateGdsTokenGraph()` validates a graph of **425 tokens = 17 roles × 25 themes** —
  the vibe *atmosphere* palette. Probing it for a semantic role returns nothing.
- `createGdsThemeAccessibilityReport()` scores entries like
  `{ role: "page text", foreground: "#111827", background: "#f8fafc", ratio: 16.96 }`.
  `#111827` is `vibe.textLight`, read directly from the palette — not the derived
  `--gds-text-body`.

So the 73 semantic `--gds-*` roles that actually determine what a component looks like
are **outside the scope of both gates**.

**Why this matters more than F12 as originally written.** F12 reported that the
published DTCG graph and the runtime semantic roles overlap by exactly 1, framed as an
incompleteness problem for external design tools. It is also a **verification blind
spot inside the release chain**: a semantic token can be renamed, broken, or dropped to
a failing contrast ratio and `verify:release` stays green.

It is worth noting that #537 was exactly this class of defect — a semantic pairing
rendering at 1.89:1 while every contrast gate passed — and F22 explains the mechanism
rather than just the instance.

**Status:** recorded as `KNOWN_SURVIVORS` in `scripts/audit/gate-mutants.config.mjs`,
attributed to **#585**, review by 2026-12-01, and reported on every suite run. The suite
passes with them present because they are filed and dated — **not because they are
fixed**, and its summary says so in those words.

## F23 — three defects in the gate suite's own first run, self-corrected

**Severity: process.** Consistent with F4, F14, F19, F20, F21.

1. **A false accusation.** The `verify:theme-tokens` mutant initially survived because
   that gate imports from `dist/` and a source mutation never reached it. Reporting it
   would have blamed a working gate for a defect in the mutant. Fixed with a
   `requiresBuild` step; it then survived legitimately, for the reason in F22.
2. **A crying-wolf clean-tree check.** It compared against absolute cleanliness and
   flagged the suite's own new untracked files as leaked mutations. Now compared against
   a baseline captured before the run.
3. **The suite's own summary overclaimed.** It printed `0 survived` when two mutants had
   survived and were merely *known*. A summary that rounds a recorded weakness down to
   zero converts a known-failing state into an unknown-failing one. Now reports
   `6 killed, 2 KNOWN survivors tracked to an open issue, 0 unexplained`, with an
   explicit note that the pass reflects filing, not fixing.

That is nine defects the audit and its tooling have found in themselves. Every one was
caught by checking a result that looked wrong rather than accepting it — which is
precisely the behaviour #580 exists to make systematic instead of dependent on someone
being suspicious on the day.


---

## F24 — F18 overstated the uncovered surface, and the fix nearly made 494 false accusations

**Severity: process.** Self-reported, correcting an earlier finding in this document.

**F18 said** 1,699 of 2,829 atoms (60%) had "no obligation coverage at all", listing
`export` (590), `prop` (1,002), `variant` (97), `accent` (10).

**That was true of audit-phase coverage and false of gate coverage.** `export` was
already covered: `verify:api-jsdoc-coverage` measures exactly that surface, at the
declaration site, and reports **99.8% across 1,242 declarations**. F18 counted a kind as
uncovered because no *audit phase* touched it, without checking whether an existing gate
already did.

**The near-miss.** Issue 581's first implementation modelled a `jsdoc` obligation on
`export` anyway and reported **3/497 — 494 gaps**. Every one was false. The registry
records an export at its **barrel** line (`packages/gds/src/index.ts:3`, a re-export
statement); the JSDoc lives on the declaration in the component's own file. The
predicate was reading the wrong file entirely.

It was caught only because 0.6% was implausible next to a gate that had just reported
99.8% for the same surface — the same cross-check that caught F21.

**Corrected position:** `export` is recorded in `COVERED_ELSEWHERE` with the owning gate
named. The real uncovered surface is **410 atoms**: 373 props without a JSDoc line and
37 variants demonstrated by no playground demo. Both now ratcheted via the
`obligationGaps` budget.

**A measurement change is recorded explicitly.** `registryAtomsWithoutCoverage` drops
1,699 → 0, but it now measures something different: atoms in kinds with *neither an
obligation model nor a recorded owner*. The 1,699 did not evaporate — 410 of them carry
real unmet obligations and are tracked by the new budget. `audit/budgets.json` states
this in the entry itself, because a budget that silently changes meaning is
indistinguishable from a budget that was gamed.

**The generalisable lesson**, and it applies to the whole audit: *"no phase covered it"
is not the same as "nothing covers it."* Three counts of the export surface now exist —
590 (registry barrel entries), 518 (api-docs registry), 1,242 (api-jsdoc declarations) —
measuring genuinely different things under the same word. Any future claim about "the
public export surface" has to say which one it means.

---

## F25 — A gate that always fails scores a perfect mutation kill

**Severity:** high — this defect class certifies broken verification as working.

`verify:obligation-coverage` read its ceiling from `budgets.registryAtomsWithoutCoverage`.
The same change set had just ratcheted that budget to **0**, because the measurement moved
to the new `obligationGaps` key (see F24). So the gate compared 410 gaps against a budget
of 0 and **exited non-zero on every clean run**, including runs with nothing wrong.

It stayed invisible for the worst possible reason: **the gate mutation suite reported its
mutant `KILLED`.** The suite's verdict is inverted — non-zero exit under a planted defect
means the gate detected it. A gate that fails unconditionally therefore "detects"
everything. It scored a perfect kill precisely because it was broken.

Two independent fixes, because there were two defects:

1. **The wrong key** — the gate now reads `obligationGaps`, and a *missing* budget entry
   is a hard failure rather than `Infinity`. Defaulting an absent budget to `Infinity`
   passes vacuously, which is the issue #516 failure mode verbatim.
2. **The missing baseline** — `verify-gates.mjs` now runs every gate **clean, once,
   before applying any mutation**, and marks its mutants `INVALID` with `BASELINE BROKEN`
   if that clean run does not exit 0.

**This is the exact mirror of the false-`SURVIVED` class.** `requiresBuild` (F20) fixed
mutants that reported SURVIVED because the gate could not see the mutation. F25 is
mutants reporting KILLED because the gate could not see *anything*. Both come from the
same omission: **running a gate without first establishing what its result means.** An
inverted verdict is only interpretable against a known-passing baseline, and the suite
never established one.

**Negative control, run before the fix was accepted:** `obligationGaps` was temporarily
set to 0, reproducing the broken state. The suite exited 1 and reported
`obligation-detects-new-undocumented-prop INVALID — BASELINE BROKEN: verify:obligation-coverage
exits 1 with no mutation applied`. Restored, the clean suite scores 8/10 with the mutant
genuinely `KILLED`.

**Also fixed in the same pass — F21 recurring.** The gate suite restored mutated *source*
but not the *artifacts* its child gates write. The obligation mutant left
`audit/obligation-coverage.json` at 411 gaps, which tripped the budget gate on the next
run against the audit's own leftovers. `mutate.mjs` was fixed for this class already; the
newer suite was written without the lesson. It now snapshots and restores every audit
artifact its children write.

**The generalisable rule, now learned twice:** any harness that runs a tool which writes
artifacts must treat those artifacts as state to restore, exactly like source — and any
harness that interprets an exit code must first establish what a clean exit code is.
