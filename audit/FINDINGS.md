# Audit findings

Status: **IN PROGRESS — partial.** See "Coverage" for exactly what has and has not
been executed. Per Rule 12 this document states its own limits before its results.

Commit audited: `f42c65d`
Environment: local build + deployed site `sovereignsquad.github.io/general-design-system`

## Coverage

| Phase | State | Evidence |
| --- | --- | --- |
| 0 — Ground-truth registry | **Complete** | `audit/registry.json`, 2,829 atoms, all 16 expected kinds non-zero |
| 1 — Backward trace | **Not run** | — |
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
| Q2 | Are `-dark` sibling keys residue? | **Open** — Phase 1 not run. |
| Q3 | Is the motion system unused? | **Resolved — no.** It is used; the stylesheet bypasses it. See F2, F4. |
| Q4 | Does GDS govern any interaction micro-motion? | **Resolved — yes, but off-token.** 34/34 interactive elements transition at `0.14s ease`, ignoring the governed 120ms/cubic-bezier. See F2. |
| Q5 | Are `ja`/`ko`/`zh` unreachable on the site? | **Open** — Phase 4b not run. Registry confirms the asymmetry: 12 package packs, 8 site packs. |
| Q6 | How many Mantine properties are GDS-governed? | **Open** — Phase 1 not run. |
