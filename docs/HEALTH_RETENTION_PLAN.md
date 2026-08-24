# Health Retention Plan

Status: Delivered — mechanisms run in verify:release (#577)
Version: 6.0.0
Last updated: 2026-08-11

How GDS stays fixed after the audit findings are fixed. This is not another
audit. It is the mechanism that makes regression detectable in the ordinary
course of work, by people who are not thinking about the audit.

## 1. The diagnosis this plan has to answer

GDS already has **45 `verify-*` scripts**, **21 chained commands** in
`verify:release`, and **8 of those are explicitly coverage / parity /
completeness gates**:

```text
verify-api-docs-coverage        verify-i18n-message-parity
verify-api-jsdoc-coverage       verify-locale-coverage
verify-component-catalog-parity verify-pattern-catalog-coverage
verify-release-doc-completeness verify-pattern-export-coverage
```

**They caught none of the twenty findings in `audit/FINDINGS.md`.** Not the 18.4%
untraceable render values, not the token graph covering 1 of 74 tokens, not the
15 unreachable tokens, not the 87 undeclared Mantine dependencies, not the three
locales with no site pack, not the off-scale motion values.

Worse: issue **#516** proves one of those coverage gates reports **100% while
covering 0 of 17 exports**. A gate that lies is worse than a missing gate,
because it consumes the attention that would have found the problem.

So the failure is not "too few gates". It is three specific things:

| Failure mode | Evidence |
| --- | --- |
| Gates check **known instances**, not **completeness** | Every finding was a thing nobody had written a gate for |
| Gates are **never verified themselves** | #516; plus six defects the audit found in its own tooling (F4, F14, F19, F20 and two in Phase 1) |
| Findings have **no ratchet** | Nothing records "18.4% today", so 19% tomorrow is invisible |

Adding a 46th script does not fix any of those. The four mechanisms below do.

## 2. Mechanism 1 — Ratchets, not absolutes

Every quantitative finding becomes a **committed budget that can only decrease**.

`audit/budgets.json`, checked in, enforced by one gate:

```jsonc
{
  "untraceableRenderRate":        { "max": 18.4, "unit": "%",     "finding": "F5" },
  "tokensFailingAllObligations":  { "max": 73,   "unit": "count", "finding": "F11" },
  "publishedGraphCoverage":       { "min": 1,    "unit": "count", "finding": "F12" },
  "unreachableTokens":            { "max": 15,   "unit": "count", "finding": "F13" },
  "undeclaredMantineDependencies":{ "max": 87,   "unit": "count", "finding": "F17" },
  "registryAtomsWithoutCoverage": { "max": 1699, "unit": "count", "finding": "F18" },
  "localesWithoutSitePack":       { "max": 3,    "unit": "count", "finding": "F15" },
  "englishLeakageWorstLocale":    { "max": 3.8,  "unit": "%",     "finding": "F16" },
  "offScaleMotionValues":         { "max": 5,    "unit": "count", "finding": "F2/F9" }
}
```

Rules:

- CI fails if a measured value **exceeds** its budget. Work is never blocked by
  the existing debt — only by adding to it.
- When a value improves, the budget **must** be lowered in the same PR. A gate
  enforces this: measured-well-below-budget is itself a failure, so budgets
  cannot rot upward-slack.
- Budgets live in a committed file, so **every change to one appears in a diff**
  and requires a human to approve it. That is the whole point: today, a
  regression is invisible; after this, it is a line in a code review.

This mirrors the `chunkSizeWarningLimit: 700` precedent already in
`apps/playground/vite.config.ts` — but enforced rather than warned, and applied
to correctness rather than only bundle size.

## 3. Mechanism 2 — Gates are mutation-tested in CI

**This is the mechanism that would have caught #516, and nothing else would.**

`npm run verify:gates` runs the mutation harness from `scripts/audit/mutate.mjs`
against the gates themselves, on every CI run:

- Each gate carries a small set of mutants that a correct gate must kill.
- The gate suite fails if **any** mutant survives.
- A new gate cannot be merged without at least one mutant proving it detects the
  thing it claims to detect.

The audit already demonstrated why this is not theoretical: **six defects were
found in the audit's own tooling**, and two of them (F20) were mutants that
failed in the direction that *flattered* the audit. Without mutation, a gate
degrading into a no-op is completely silent.

**Definition of Done gains one line:** a new `verify:*` gate ships with its
mutants, or it does not ship.

## 4. Mechanism 3 — Completeness gates derived from the registry

`scripts/audit/extract-registry.mjs` already derives 2,829 atoms from source. It
becomes a build artifact, and obligations are checked against it rather than
against hand-written lists.

The consequence is the important part: **a new token, prop, variant, export or
locale key automatically enters scope the moment it is added.** Nobody has to
remember to add it to a checklist, because there is no checklist — there is an
extractor.

This directly closes the failure mode DO-178C names and #516 exhibits: tests
written from code rather than from requirements make coverage look good while
requirement coverage is partial. The registry is the requirements side.

Priority order, by the audit's own gap analysis:

1. `prop` (1,002 atoms) and `export` (590) — the 60% with no coverage at all (F18)
2. `variant` (97) — the variation surface Rule 2 requires be demonstrated
3. `accent` (10) — feeds the contrast guarantee in #560

## 5. Mechanism 4 — Make drift visible where people already look

- **PR comment**: the budget table, with deltas, on every pull request. A
  regression is seen during review, not during the next audit.
- **`audit/` artifacts published per build**, so any two commits are diffable.
- **Trend, not snapshot**: budgets committed over time give a series. A slow
  three-release drift is exactly what a one-shot gate cannot see.

## 6. What this costs

| Item | Cost |
| --- | --- |
| Budget gate | seconds, offline |
| Registry extraction | ~2s, offline |
| Forward trace | ~3s, offline |
| Gate mutation suite | ~1–2 min (re-runs analyses per mutant) |
| Backward trace (render sweep) | ~2 min for 40 cells; scales with the covering array |

Backward trace is the only expensive one. Recommendation: **run it on `main` and
on release branches, not on every PR**, with the budget check running everywhere.
That keeps PR feedback fast while making regression visible within a day.

## 7. What this does not solve, stated plainly

- **It cannot detect what the extractor cannot see.** Dynamically constructed
  values, consumer overrides, and runtime-composed styles remain invisible to
  static extraction. F13's "unreachable" tokens carry exactly this caveat.
- ~~**It does not validate Phase 1.**~~ **Resolved (issue 579).** M1 and M2 are
  implemented with a rebuild step and both killed, so `untraceableRenderRate` is now a
  blocking ratchet rather than advisory, and a `renderMutationScore` budget keeps it
  that way.
- **It is not a conformance statement.** It prevents regression from a measured
  baseline. The baseline is currently 18.4% untraceable and 60% of the registry
  uncovered — holding that line is not the same as being healthy.
- **Ratchets can be gamed** by lowering a budget without fixing anything, if the
  measurement changes. Budget changes must cite the finding and the commit that
  justifies them.

## 8. Sequencing

| Order | Item | Why here |
| --- | --- | --- |
| 1 | `audit/budgets.json` + budget gate | Cheap, immediate, stops the bleeding before any fix lands |
| 2 | M1/M2 mutants for Phase 1 | Without them the headline budget is unverified |
| 3 | `verify:gates` mutation suite in CI | The #516 countermeasure |
| 4 | Registry-derived obligations for `prop`/`export` | Closes the 60% gap |
| 5 | PR budget comment | Makes it visible where decisions happen |
| 6 | Phase 3 covering array | Turns coverage from a slice into a measured number |

Item 1 should land **before** the fixes, not after. A ratchet installed after the
repair records the repaired number; a ratchet installed now records the debt and
prevents it growing while the repair is in flight.
