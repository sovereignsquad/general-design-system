# Deep Audit Plan — GDS and the reference site

Status: Approved plan, not yet executed
Version: 6.0.0
Last updated: 2026-08-11

This document is the executable methodology for a full-depth, code-level audit of
the General Design System and its public reference site. It is written to be run,
not read: every phase states its inputs, its extraction targets by real file path,
its output schema, its pass/fail criteria, and the evidence artifact it must
produce.

## 0. The two governing rules

Both come from the owner and are absolute.

1. **Nothing but GDS tokens may render on the reference site.** Any value that
   cannot be traced back to a governed token is a finding — regardless of whether
   it looks correct.
2. **No GDS token may be absent from the lists, the live proofs, the explanations,
   the variation displays, or the use cases.** Any token missing any of those five
   is a finding — regardless of whether the token itself works.

A third rule governs how the audit is conducted: **no assuming, no guessing.** The
owner has explicitly declined to enumerate what must be checked. The audit
therefore derives its own checklist from the codebase (Phase 0) rather than from
anyone's memory or imagination. If a thing exists in source, it enters the audit
automatically.

## 1. Why this methodology

Design-system audit checklists cannot prove completeness. This plan is built on
four disciplines that must prove it, plus one that finds what nobody thought to
look for.

| Discipline | Contribution |
| --- | --- |
| **DO-178C bidirectional traceability** (DAL A) | Forward *and* backward tracing. An element with no upstream requirement is *extraneous* and is a finding regardless of correct function. This is the formal statement of both governing rules. |
| **NIST combinatorial testing** (NISTIR 7878, SP 800-142) | Most faults arise from 1–2 parameter interactions. *t*-way covering arrays achieve exhaustive-equivalent fault detection at 20–700× reduction, with coverage **measured** rather than claimed. |
| **Mutation testing** | Coverage is not effectiveness — a suite can cover everything and assert nothing. Fault injection plus kill-rate is the only evidence an audit actually detects defects. |
| **WCAG-EM 1.0** | Formal evaluation structure (scope → explore → sample → evaluate → report) and the structured-plus-random sample pattern, reused here as an audit-of-the-audit. |
| **Property-based / metamorphic testing** | Invariants over generated inputs surface "unknown unknowns you didn't think to test for" — the direct mechanism for the no-assuming rule. |

The specific trap all of this exists to avoid is already present in this
repository: issue 516 is a gate reporting 100% coverage while covering 0 of 17
exports. DO-178C names that failure mode exactly — tests written from code rather
than from requirements make coverage look good while requirement coverage is
partial.

## 2. Measured scope

Ground truth, read from source and from the deployed site. Not estimated.

| Dimension | Count | Source of truth |
| --- | --- | --- |
| Theme presets | 25 | `tokens/gds.tokens.json` |
| Color schemes | 2 | light / dark |
| DTCG published tokens | 425 (17 roles × 25 themes) | `tokens/gds.tokens.json` |
| `--gds-*` properties at runtime | 102 (19 vibe + 83 semantic-role) | measured, deployed `/live-proofs` |
| `--mantine-*` properties at runtime | 345 | measured, deployed `/live-proofs` |
| Total custom properties on one page | 1,077 | measured, deployed `/live-proofs` |
| Public exports | 214 (core 131, theme 44, admin 18, a11y 17, umbrella 4) | package `index.ts` files |
| Public UI components | 287 (154 registered, 133 exempted) | `verify:component-catalog-parity` |
| Pattern registry entries | 110 | `apps/playground/src/pattern-registry.ts` |
| Routes | 22 | `apps/playground/src/App.tsx` |
| Package locale packs | 13 files (12 locales + index) | `packages/gds-core/src/locales/` |
| Site phrase packs | 8 | `apps/playground/src/generated-site-phrases/` |
| Site phrase keys per pack | 1,258 | same |
| Motion tokens declared | 5 durations + 5 easings + 7 presets | `packages/gds-theme/src/motion.ts` |
| Transition/animation declarations shipped | 7 | `packages/gds-theme/styles.css` |
| `@keyframes` blocks shipped | 0 | `packages/gds-theme/styles.css` |
| `prefers-reduced-motion` blocks | 2 | `packages/gds-theme/styles.css` |
| `:hover` rules in the GDS stylesheet | 2 | `packages/gds-theme/styles.css` |
| `:focus-visible` rules | 20 | `packages/gds-theme/styles.css` |

### 2.1 Open questions this sizing raised

Recorded as questions, **not** findings. Each is assigned to the phase that
resolves it. None may be reported as a defect before that phase produces evidence.

| # | Question | Phase |
| --- | --- | --- |
| Q1 | DTCG exposes 17 roles/theme; runtime emits 102 `--gds-*` properties. Is the published token graph materially incomplete for design-tool consumers? | 2 |
| Q2 | `-dark`-suffixed sibling keys are still emitted (`--gds-accent-dark`, …). Is this correct post-5.0.2 resolution, or residue of the pattern HANDOVER §2 identifies as the illegibility bug? | 1 |
| Q3 | Do the shipped transitions actually use the declared motion scale? | 4 |
| Q4 | 2 `:hover` rules total. Does GDS govern any interaction micro-motion, or is all of it Mantine default? | 4 |
| Q5 | 12 package locales vs. 8 site packs. Are `ja`, `ko`, `zh` unreachable on the site? | 4 |
| Q6 | 345 Mantine properties render the site. How many are GDS-governed vs. framework default? | 1 |

## 3. State space

```
25 themes × 2 schemes × 110 patterns                    =   5,500 cells
        × ~6 interaction states                          =  33,000
        × 8 locales (incl. 2 RTL)                        = 264,000
        × 3 density modes (once issue 556 lands)         = 792,000
```

Exhaustive execution is infeasible. Per NIST, the answer is not sampling but
**covering arrays**: 2-way coverage across all factors, raised to 3-way for
accessibility-critical factor groups, with achieved *t*-way coverage reported as a
computed number. Coverage becomes evidence, not an assertion.

---

# Phase 0 — Ground-truth registry

**Purpose.** Derive the audit's checklist from the codebase so that no human list
is required and nothing can be forgotten. This phase is what makes "no assuming"
mechanically true.

**Extraction targets** (real paths, verified to exist):

| Atom | Extracted from |
| --- | --- |
| Theme presets | `packages/gds-theme/src/theme-presets.ts` |
| Vibe theme fields | `packages/gds-theme/src/vibe-themes.ts` |
| Brand tokens / semantic roles | `packages/gds-theme/src/brand-tokens.ts` |
| Published token graph | `tokens/gds.tokens.json` |
| Runtime custom properties | live CDP capture per route per theme per scheme |
| Public exports | `packages/*/src/index.ts`, `client.ts`, `server.ts` + `package.json` `exports` |
| Component props & variants | TypeScript AST over `packages/*/src/*.tsx` |
| Pattern entries | `apps/playground/src/pattern-registry.ts` |
| Routes | `apps/playground/src/App.tsx` |
| Motion tokens | `packages/gds-theme/src/motion.ts` |
| Motion as shipped | `packages/gds-theme/styles.css` |
| Locale keys | `packages/gds-core/src/locales/*.ts`, `apps/playground/src/generated-site-phrases/*.ts` |
| Icon registry | `packages/gds-core/src/icons` |
| Accent ramps | `packages/gds-core/src/GdsBadge.tsx` |

**Output schema** — `audit/registry.json`:

```ts
type AuditAtom = {
  id: string;                    // stable, e.g. 'token:--gds-bg-card'
  kind: 'token' | 'export' | 'prop' | 'variant' | 'state'
      | 'locale-key' | 'motion' | 'route' | 'pattern' | 'icon' | 'accent';
  name: string;
  source: { file: string; line: number };
  /** Obligations this atom must satisfy — populated per kind, see Phase 2. */
  obligations: string[];
};
type AuditRegistry = { generatedAt: string; commit: string; atoms: AuditAtom[] };
```

**Pass criteria.** Registry is non-empty for every `kind`. A kind resolving to
zero atoms fails the phase — it means extraction is broken, not that the system
lacks that atom. The registry regenerates deterministically: two runs on one
commit produce byte-identical output.

**Evidence.** `audit/registry.json` plus a per-kind count table.

---

# Phase 1 — Backward trace (Rule 1: nothing but GDS tokens)

**Purpose.** Prove that every rendered value traces to a governed token. Anything
that does not is extraneous, per DO-178C, and is a finding regardless of
appearance.

**Method.** For every route × theme × scheme, capture computed styles for every
element via CDP, then classify each declared property's provenance against *that
theme's own resolved token map*:

| Verdict | Meaning |
| --- | --- |
| `token` | Resolves to a `--gds-*` value |
| `derived` | Approved Mantine-bridged value traceable to a GDS decision |
| `literal` | **Finding.** Ungoverned hardcoded value |
| `ua-default` | **Finding.** Browser default — nobody chose it |
| `unevaluated` | Reported, never counted as a pass |

**The critical detail.** Provenance must resolve against each theme's own token
map, not by string-matching. A hardcoded `8px` that coincidentally equals the
default theme's radius passes under `default` and fails under the other 24. Only
per-theme resolution catches it — and that case is known to exist here: the
`/live-proofs` page renders 32px / 16px / 8px / 4px radii from four uncoordinated
decision points, on Mantine's untouched doubling scale, with **no `--gds-radius-*`
token existing at all**.

**Tracked properties.** All axes: geometry, spacing, typography, color, elevation,
motion, interaction. Derived from Phase 0, not hand-listed.

**Resolves.** Q2, Q6.

**Pass criteria.** Zero `literal`, zero `ua-default`, zero `unevaluated`. Any
allowlisted exception carries a written justification and an expiry date.

**Evidence.** `audit/backward-trace.json` — full provenance matrix, plus a
findings table of file, line, property, theme, computed value, expected token.

---

# Phase 2 — Forward trace (Rule 2: no token left out)

**Purpose.** Prove every token reaches all five obligations.

**The obligation matrix.** For each of the 102 runtime `--gds-*` properties, and
each atom of every other kind:

| Obligation | Satisfied when |
| --- | --- |
| **Listed** | Appears in a published, machine-readable inventory (token graph, API reference) |
| **Demoed live** | Rendered by at least one live proof on the reference site, in a state a visitor can actually observe |
| **Explained** | Carries prose stating what it is *and why it exists* — a name is not an explanation |
| **Variations shown** | Its range is displayed: every step of a scale, every theme's value, both schemes |
| **Use case given** | At least one concrete "use this when…" statement |

102 properties × 5 obligations = **510 cells minimum**, before other atom kinds.
Every empty cell is a gap finding.

**Resolves.** Q1.

**Pass criteria.** No empty cell. A deliberately-excluded atom requires a recorded
exclusion reason; silent absence fails.

**Evidence.** `audit/forward-trace.json` — the full matrix, plus a per-obligation
gap list.

---

# Phase 3 — Combinatorial render sweep

**Purpose.** Cover the interaction space with measured, not hoped-for, coverage.

**Factors.** theme (25) × scheme (2) × pattern (110) × interaction state (~6) ×
locale (8) × **viewport (≥3)** × density (3, post-556) × reduced-motion (2) ×
forced-colors (2).

> **Viewport was added after the fact.** The original factor list omitted it. The
> defect analysis in §3.1.1 shows 18% of this repository's known defects are
> viewport- or mobile-specific — a factor responsible for nearly a fifth of
> defects cannot be absent from the array. This is the first correction the
> evidence forced on the plan, and it is recorded rather than quietly patched.

**Strength.** 2-way across all factors; **3-way** for the accessibility-critical
group (scheme × state × forced-colors × reduced-motion × density × viewport),
where interaction faults concentrate and consequences are highest.

**Method.** Generate covering arrays, execute via the existing CDP harness at
`scripts/lib/browser-runtime.mjs`, one browser session reused across cells, bounded
concurrency, results streamed.

**Pass criteria.** Achieved *t*-way coverage reported per factor group. Any cell
that could not execute is reported as skipped and **fails the phase** — a skipped
cell is a coverage gap, and per Rule 12 partial coverage may never be implied
complete by omission.

**Evidence.** `audit/coverage-array.json` including achieved coverage percentages
and the complete skipped-cell list with reasons.

## 3.1 Cell-selection algorithm — WGA (Weighted Gap Augmentation)

The state space is ~792,000 cells and execution is expensive. WGA selects which
cells to run. It is deliberately an **augmentation** algorithm: it measures what
the existing gates already cover and adds to it. Nothing in the current
verification chain is replaced or rewritten.

### 3.1.1 Empirical basis — this repository's own defect history

Weights are derived from the 34 `bug`-labelled issues in this repository, tagged
per issue against title and body. Not a generic 80/20 prior, and not an
assumption.

| Dimension | Defects | Share |
| --- | --- | --- |
| Contrast / WCAG | 13 | 38% |
| Keyboard / focus | 8 | 24% |
| **Viewport / mobile** | 6 | 18% |
| **The verification layer itself** | 6 | 18% |
| Forced colors | 5 | 15% |
| i18n / locale | 5 | 15% |
| Dark scheme specifically | 4 | 12% |
| Brand lanes (class-usa, gold-athlete) | 4 | 12% |
| Interaction state | 3 | 9% |

Two results from this data change the plan as originally written:

**Correction 1 — viewport was a missing factor.** Section 3's factor list omitted
viewport entirely, yet 18% of known defects are viewport- or mobile-specific
(issues 513, 495, 380, 379 among them). A factor responsible for nearly a fifth of
defects cannot be absent from the array. **Viewport is added as a first-class
factor** at the breakpoints the theme actually defines.

**Correction 2 — brand lanes are less dominant than assumed.** At 12% across 2 of
25 themes they are roughly 1.5× over-represented per theme, not the dominant
cluster. They get a modest weight, not a large one. The prior assumption was
wrong, and the measurement is what corrected it.

**Confirmation — Phase 5 is not optional.** 18% of everything labelled a bug here
was a defect in the *verification*, not the product (574, 563, 553, 516, 515,
379). Nearly one in five. That is the empirical case for mutation-gating the
report.

### 3.1.2 Factor weights

```
w(level) = max(0.5, incidence(level) / mean_incidence)
```

The `0.5` floor is load-bearing: **no factor level is ever weighted to zero.**
A zero weight is how a blind spot becomes permanent, and this repository's history
shows defects in every dimension measured.

### 3.1.3 Cost model

Cells are not equally expensive. Measured transition costs on the existing harness:

| Transition | Relative cost |
| --- | --- |
| Browser launch | ~1000 |
| Route navigation | ~50 |
| Locale switch (reload) | ~50 |
| Viewport resize | ~10 |
| Theme switch (identity remount) | ~5 |
| Scheme toggle | ~2 |
| Interaction state change | ~1 |

Cell *order* therefore dominates cell *count* in wall-clock terms. The same
coverage costs an order of magnitude less if cells are ordered to minimise
expensive transitions — hold a browser and a route, sweep every theme, scheme and
state beneath them, then move.

### 3.1.4 The algorithm

```ts
function selectCells(existingSuite, factors, budget) {
  // 1. MEASURE what the current gates already cover. Do not rebuild them.
  //    (forced-colors: 31 cases/7 routes/8 presets; theme-trust: 22; input-zoom: 3;
  //     kanban: 1 — real coverage, currently unmeasured in t-way terms.)
  let covered = measureTWayCoverage(existingSuite, factors, t = 2);

  // 2. Seed with a proper offline covering array for the uncovered remainder.
  //    NIST: offline covering arrays out-detect online-greedy and adaptive-random.
  //    3-way for the accessibility-critical group, 2-way elsewhere.
  const seed = ipog(factors, { t: 2, strengthen: A11Y_CRITICAL_GROUP, tStrong: 3 })
                 .filter(cell => !covered.has(cell));

  const selected = [];
  let candidates = [...seed, ...sampleUncovered(factors, covered)];

  while (candidates.length && cost(selected) < budget) {
    // 3. Value = weighted NEW t-tuples this cell would cover.
    const scored = candidates.map(c => {
      const gained = newTuples(c, covered);
      const value  = sum(gained.map(tupleWeight));       // from 3.1.2
      return { c, value, ratio: value / transitionCost(c, last(selected)) };
    });

    const best = maxBy(scored, s => s.ratio);

    // 4. Adaptive-random tie-break: among near-equal ratios, take the cell
    //    farthest from everything already selected. This is where the unknown
    //    unknowns live — the factor combinations nobody reasoned about.
    const ties = scored.filter(s => s.ratio >= best.ratio * 0.95);
    const pick = maxBy(ties, s => minDistance(s.c, selected));

    selected.push(pick.c);
    covered = covered.union(newTuples(pick.c, covered));
    candidates = candidates.filter(c => c !== pick.c);

    // 5. STOP ON MUTATION SCORE, NOT ON COVERAGE.
    //    Coverage measures what was executed; mutation score measures what would
    //    be caught. Re-scored every K cells against the Phase 5 mutant catalogue.
    if (selected.length % K === 0) {
      const score = mutationScore(selected);
      if (score >= 1.0 && marginalGain(score) < EPSILON) break;
    }
  }

  // 6. Order for execution: minimise expensive transitions without changing the set.
  return orderByTransitionCost(selected);
}
```

### 3.1.5 Why the stopping rule is mutation score

This is the part that answers "improve the quality of the tests" rather than
"increase the number of tests". Coverage is a measure of what was *executed*;
mutation score is a measure of what would be *caught*. A suite can reach high
*t*-way coverage while asserting nothing — which is precisely issue 516, a gate
reporting 100% while covering 0 of 17 exports.

WGA therefore stops when adding cells stops increasing the mutation score, not
when a coverage percentage is reached. Two suites with identical coverage and
different mutation scores are not equally good, and only the second number
distinguishes them.

### 3.1.6 What this does not do

- It does not replace the existing gates. It measures and augments them.
- It does not remove any currently-passing check.
- It does not change the harness, the CI chain, or any component.
- It adds one selection step in front of Phase 3's execution, and one ordering
  step behind it.

---

# Phase 4 — Named and underived dimensions

**Purpose.** Cover the dimensions the owner named, plus the ones they deliberately
did not — the latter derived from Phase 0, never invented.

### 4a. Micro-animation and interaction motion

Every `transition`, `animation`, `@keyframes`, and `transform` in shipped CSS and
component source. For each: is it theme-driven or hardcoded? Does it honour
`prefers-reduced-motion`? Is it reachable by keyboard focus as well as hover?

Open question Q3 (does shipped motion use the scale) and Q4 (2 `:hover` rules) are
resolved here. **The likely conclusion — that GDS governs almost no interaction
motion and what exists is Mantine default — must be proven by enumeration, not
asserted from these counts.**

### 4b. Language variants

All 12 package locales and 8 site packs × 1,258 keys. Checks: key parity across
packs; untranslated English leakage (issue 517 reports this for `ar`/`he`/`zh`);
RTL layout correctness for `ar`/`he`; **pseudo-localization** to surface expansion
breakage and hardcoded strings that never entered the locale system at all.
Q5 (`ja`/`ko`/`zh` site reachability) resolves here.

### 4c. Theme-controlled elements

For each of the 345 Mantine properties: GDS-governed, or framework default? A
property nobody chose is `ua-default` by another name.

### 4d. Underived dimensions

Any atom kind in the Phase 0 registry with no obligation coverage from Phases 1–3
is swept here. This is the mechanical guarantee that the audit's scope is not
limited by anyone's imagination.

**Evidence.** `audit/dimensions.json` per sub-phase, each with its own findings
table.

---

# Phase 5 — Mutation: prove the audit works

**Purpose.** A "zero violations" result is worthless until the audit is shown to
detect real defects. This is the direct countermeasure to issue 516.

**Mutant catalog** — injected one at a time into a scratch build, never committed:

| # | Mutation | Phase that must kill it |
| --- | --- | --- |
| M1 | Hardcode a radius equal to the default theme's value | 1 |
| M2 | Hardcode a color not in any token | 1 |
| M3 | Remove a token from the published graph | 2 |
| M4 | Remove a token's live proof | 2 |
| M5 | Remove a token's explanation prose | 2 |
| M6 | Delete a locale key from one pack | 4b |
| M7 | Replace a translated string with English | 4b |
| M8 | Remove a `prefers-reduced-motion` guard | 4a |
| M9 | Set a focus-ring width to 0 | 3 |
| M10 | Break a component under one theme only | 3 |
| M11 | Introduce an untraceable Mantine default | 4c |
| M12 | Add a new atom with no obligations | 0 |

**Mutation score = killed / injected.**

**Pass criteria.** **100% on M1–M12.** These are not random mutants; each targets a
specific claim the audit makes. A survivor means that claim is unsupported, and
the audit is not fit to report until the corresponding phase is fixed. Additional
randomly generated mutants are scored separately and reported, with a target of
≥ 90%.

**Evidence.** `audit/mutation-score.json` — per-mutant kill/survive, and for each
survivor the phase that should have caught it.

---

# Phase 6 — Adversarial completeness critic

**Purpose.** Ask what the audit did not check.

**Method.** A dedicated pass over all prior evidence artifacts, asking: which
modality was not run; which claim rests on reasoning rather than observation;
which cell was skipped; which atom kind produced suspiciously few findings; where
does a phase's pass depend on another phase's unverified output. WCAG-EM's random
sample is applied here: a random selection of atoms is re-verified by hand against
the automated verdict, and any disagreement invalidates that phase's result.

**Pass criteria.** Every gap named explicitly. Per Rule 12, the final report states
what was covered *and what was not* — partial coverage may never be implied
complete by omission.

**Evidence.** `audit/completeness-critique.md`.

---

# Deliverables

| Artifact | Contents |
| --- | --- |
| `audit/registry.json` | Every auditable atom, derived from source |
| `audit/backward-trace.json` | Provenance of every rendered value |
| `audit/forward-trace.json` | The 5-obligation matrix |
| `audit/coverage-array.json` | Achieved *t*-way coverage + skipped cells |
| `audit/dimensions.json` | Motion, i18n, theme-control, underived sweeps |
| `audit/mutation-score.json` | Proof the audit detects defects |
| `audit/completeness-critique.md` | What the audit did not cover |
| `audit/FINDINGS.md` | Ranked findings, each with file, line, evidence, and fix |

Every finding becomes a GitHub issue in the #81 format, on the board, sequenced —
per the established process. Fixes land in the shared packages, never page-locally
(Rule 10).

# Execution order

Phase 0 → 1 ∥ 2 → 3 → 4 → **5** → 6.

Phase 5 gates the report. No finding — and no clean result — may be published
before the mutation score proves the audit detects the defects it claims to look
for. An audit that has not been mutation-tested is an opinion.

# Standing constraints

- **Rule 11** — no assumption, no guess, no invented value. Every number in the
  final report traces to a captured artifact.
- **Rule 12** — every claim states its scope: which routes, which themes, which
  schemes, which locales, local build vs. deployed. Partial coverage is stated,
  never implied complete.
- **Rule 10** — fixes land in the shared package that renders the defect.
- **Rule 1** — the audit's own tooling ships warning-free and error-free.
