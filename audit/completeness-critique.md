# Phase 6 — completeness critique

What the audit did **not** cover, what rests on reasoning rather than observation,
and where a result should not be trusted. Per Rule 12, this document exists so
partial coverage is stated rather than implied complete by omission.

## Verdict: the audit does not pass its own gate

`docs/DEEP_AUDIT_PLAN.md` Phase 5 sets the pass criterion at **100% on M1–M12**,
on the reasoning that each mutant targets one specific claim the audit makes, so
a survivor means that claim is unsupported.

**Achieved: 85.7% (6/7) on the static mutants, plus 100% (2/2) on the render mutants
added by issue 579. 8 of 12 mutants now run; 3 remain (M8, M9, M10). The gate still
requires 100% on all twelve, so it is still not met.**

Therefore:

- The defects reported in `FINDINGS.md` are **individually verified** — each was
  confirmed against source or against live computed styles, and several were
  double-checked after the first result looked wrong.
- **No claim of completeness is supported.** "18.4% untraceable" means the audit
  found that much; it does not mean the true figure is 18.4%. "0/73 tokens
  satisfy all five obligations" is a floor, not a measurement.
- Any statement of the form "the audit found no problem with X" is **not
  evidence that X is sound** for any X in the un-run set below.

## Survivor M3, and what it invalidates

M3 removed `primary` from the published DTCG graph. Phase 2's `listed` and
`variationsShown` counts did not move.

**Diagnosis, and it is not a coding bug.** The `listed` obligation resolves as
`publishedRoles.has(role) || docBlob.includes(name)`. Because the published DTCG
roles and the `--gds-*` token universe are near-disjoint (finding F12 — overlap
of exactly 1), the first clause is almost never the deciding one. So `listed` is
in practice measuring **"the token name appears somewhere in some markdown
file"**, not "the token is present in a published inventory".

Consequences:

- **The reported `listed` figure of 42/73 (58%) overstates the obligation.** The
  stricter reading — present in an actual published inventory — is closer to
  1/73, and that number is not independently verified.
- `variationsShown` at 1/73 is similarly an artifact of the same disjointness
  plus a weak heuristic, and was already flagged LOW confidence.
- F12 itself is unaffected: it was derived by direct set comparison, not by the
  obligation heuristic, and M3's survival is further evidence *for* F12 rather
  than against it.

## Mutants that did not run

| # | Targets | Reason |
| --- | --- | --- |
| ~~M1~~ | Phase 1 | **RESOLVED (issue 579).** Implemented with a rebuild step in `scripts/audit/render-mutants.mjs` and **killed**. Its premise had to be corrected: the issue specified a *radius*, but GDS has no `--gds-radius-*` token yet (#555), so a hardcoded radius is `literal` under every theme and the discriminating test collapses. Retargeted to `--gds-support`, which genuinely differs per preset. |
| ~~M2~~ | Phase 1 | **RESOLVED (issue 579).** Killed. |
| M8 remove a `prefers-reduced-motion` guard | Phase 4a | Phase 4a was a manual source analysis, not an automated script, so there is nothing to mutate against |
| M9 set a focus-ring width to 0 | Phase 3 | Phase 3 not implemented |
| M10 break a component under one theme only | Phase 3 | Phase 3 not implemented |

**M1 and M2 were the most consequential absences, and are now resolved (issue 579).**
Phase 1 is validated: both render mutants are killed, 2/2 = 100%.

M1 is the one that matters. Planting the *default* theme's `--gds-support` value as a
literal produced:

```
default/light         +0     planted value matched default's token -> classified `token`
class-usa/light      +51
gold-athlete/light   +45     same literal, no matching token -> classified `literal`
high-contrast/light  +90
```

That asymmetry is the proof. A classifier that string-matched globally, or resolved
against a single theme's map, would have raised `default` too. It did not — so
per-theme provenance resolution is confirmed by measurement rather than by reading the
code. `untraceableRenderRate` is consequently promoted from advisory to **blocking** in
`audit/budgets.json`, and a `renderMutationScore` budget pins M1/M2 at 100%: Phase 1 is
only trustworthy while they stay killed.

## Phases not run

| Phase | State | What is consequently unknown |
| --- | --- | --- |
| 3 — Combinatorial sweep | **Not implemented** | No measured *t*-way coverage exists. The WGA algorithm in plan §3.1 was designed but never executed. Phase 1's 40 cells are a hand-picked slice, not a covering array. |

## Coverage gaps inside the phases that did run

- **Phase 1 sampled 5 of 25 presets and 4 of 24 routes.** 40 of a possible ~1,200
  route×preset×scheme cells, before states, locales, viewports or density. Absence
  of a finding in an unvisited cell proves nothing.
- **Phase 1 excludes three properties by design** — `min-height`/`width`/`height`,
  `line-height`, `font-family` — with stated reasons. Ungoverned values in those
  three are invisible to this audit.
- **Phase 1 never tested viewport**, despite the defect analysis in plan §3.1.1
  showing viewport/mobile accounts for 18% of this repository's known defects.
  The factor was added to the plan and then not exercised.
- **Phase 4a was manual.** No script, therefore no mutant, therefore unvalidated.
- **Phase 4b did not test RTL rendering or pseudo-localization**, both named in
  the plan. It measured key parity and English leakage only.
- **Phase 4d found 4 uncovered registry kinds** — `export` (590 atoms), `prop`
  (1,002), `variant` (97), `accent` (10). **1,699 atoms, 60% of the registry, have
  no phase coverage at all.**

## Claims resting on reasoning rather than observation

- That the checkout-bump and other CI changes behave identically on Linux —
  reasoned from the change being additive, confirmed by CI for `quality.yml` only.
- That the 15 unreachable tokens (F13) are genuinely dead rather than referenced
  through a path the static scan cannot see (dynamic construction, consumer
  overrides). Static analysis cannot prove absence of a dynamic reference.
- That F13's four unreachable badge tone tokens relate to issue #534's badge
  contrast failure. **Explicitly not established**, flagged for Phase 4d, and
  Phase 4d did not cover it.

## What would have to happen for a clean result to mean anything

1. Implement Phase 3 and report measured *t*-way coverage.
2. ~~Build M1/M2 with a rebuild step so Phase 1 is validated.~~ **Done (issue 579).**
3. Automate Phase 4a so M8 can run.
4. Rewrite the `listed` obligation so it measures presence in a published
   inventory, then re-run M3.
5. Cover the 1,699 orphaned registry atoms.
6. Reach 100% on M1–M12.

Until then this is a defect list, not a conformance statement.
