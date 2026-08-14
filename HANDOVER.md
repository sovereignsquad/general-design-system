# HANDOVER

**Written 2026-08-13. Supersedes every earlier handover.**

Read this top to bottom before touching anything. It is written for an agent or
engineer with **no memory of the sessions that produced this state**.

---

## 1. Where we are, in one paragraph

`main` is at **`ab39afb`**, version **6.0.0**, working tree **clean**, and **CI
is green** on both workflows (`GDS Quality`, `Deploy GDS Playground to GitHub
Pages`). The site is deployed at
<https://sovereignsquad.github.io/general-design-system/>. The release chain is
**43 steps**; the gate mutation suite runs **38 mutants with 0 survivors**. There
are **34 open issues** and nothing is blocked except #512 (needs repo
permissions the agent does not have).

---

## 2. The owner's standing requirements — read these first

These are not preferences. They have each been stated emphatically, and work
that violates one gets rejected regardless of how well it is built.

1. **"Complete delivery the full reliable rock solid system."** The goal is not
   features; it is a system a client can trust.
2. **"No hardcoded values."** Anywhere. If a value cannot be computed where it
   is displayed, **make it available there** — generate it, publish it, inject
   it. "The page cannot compute it in this slot" is a constraint to solve, not a
   licence to delete the information. Deleting a number instead of deriving it
   was explicitly rejected.
3. **"We can have either Approved or Non-existing cases, especially on visible
   surfaces."** There is no third state where a claim is merely plausible.
4. **"The page is PURE professional documentation with proofs."** Never call it
   a demo. Nothing on it belongs to whoever built it — not "my demo", not "my
   page".
5. **"No hand authored things."** Themes are the only hand-authored input, and
   even those follow a rigid structure.
6. **"No defects accepted."**
7. **Do not commit and push without a local CI-equivalent run.** (Rule 13.)

The owner works from **iOS with no terminal**. They cannot run anything. Every
git operation is the agent's to execute; see CLAUDE.md Rule 6 for what is
pre-authorised.

---

## 3. The one lesson that explains most of this session's work

**A check that reports clean because it never looked is indistinguishable from a
clean system.**

Every significant defect closed in this session had that shape:

- 344 badges whose contrast could not be computed at all, because the background
  was translucent — so every contrast sweep walked past them and reported
  nothing. One shipped at **1.07:1, white on white**.
- `motion-keyframes` sitting at **zero** in the registry, unremarked, while GDS
  shipped an `animation` referencing keyframes that did not exist.
- A motion scale described as the source of truth that was **duplicated**, so
  adding a step emitted no CSS and nothing failed.
- `verify-accent-contrast` checking the **default** palette 25 times over,
  passing `undefined` where each preset's own palette belonged.
- A budget named `gateMutationScore` that measured a **different** mutation run.
- The reference site asserting a rule that **two of its own examples broke**.

When you find a gate that passes, ask what it would take for it to fail. If you
cannot answer, it is not a gate.

**Two sharper forms of this, both found in the #600 work:**

- **A test can assert the claim instead of checking it.**
  `pattern-registry.test.tsx` asserted `every(entry => coverageStatus ===
  'live-proof')`. That passes for exactly as long as the claim is written down,
  and it *required* the uniformity that made the field meaningless — 113 entries,
  one value, so no entry could be observed to be wrong. If a test would still
  pass with the system deleted and the constant left behind, it is not a test.
- **A gate can ask a nearby question instead of the real one.** The first version
  of `verify:pattern-live-proof` accepted "some page references this entry's
  component", reasoning that the entry must therefore be proven somewhere. Three
  entries passed on it while their own cards printed the fallback, because the
  components rendered under a *different* entry's card. **Proximity is not proof.**
  The deployed site caught it; the gate did not. When writing a gate, state the
  question it actually asks and check that it is the question you meant.

---

## 4. What shipped in this session (all deployed, all CI-green)

### Closed issues

| Issue | What it actually was |
| --- | --- |
| **#597** | Badge contrast was *uncomputable*, not merely low. 344 badges invisible to every sweep; worst real case 2.25:1; one at 1.07:1 |
| **#592** | The only keyframe animation GDS declared animated **nothing** — zero `@keyframes` in the repo |
| **#591** | A governed token the component kept a **private copy** of (hardcoded `8` beside `--gds-tour-spotlight-padding: 8px`) |
| **#601** | A budget key naming something it did not measure |
| **#602** | The gate suite had **no floor on its own coverage** |
| **#590** | Closed as decomposed into #601/#602/#603 |
| **#605** | Every claim on the reference site now carries its evidence |
| **#546** | `GdsSavedIndicator` — one save toggle, not two |
| **#606** | "demos" → "live proofs", everywhere a reader can see it |
| **#600** | Seven patterns claimed `live-proof` while their cards printed "No interactive demo renders here". The test that should have caught it asserted `every(entry => 'live-proof')` — the claim restated as a test |
| **#607** | The #606 rename was a substring replacement: "demonstrations" → **"proofnstrations"**, live on `/patterns` and translated into all 8 locale packs |
| **#517 / #588** | Four i18n gates were green while English paragraphs sat mid-page in `he`/`ar`. All four check KEY parity; none ever read a VALUE. The generator never retried a value left in English, so leakage could only accumulate |
| **#518** | `changedTitle` said 6.0.0 above a description of the 3.14 line, in 9 locales — and a gate REQUIRED the stale sentence |
| **#587** | The site could not render `ja`/`ko`/`zh` though the packages shipped them. Exposed a latent crash that blanked the home route in any locale without explorer copy |
| **#599** | The theme matrix was not reproducible; a fixed `wait(350)` sampled whatever had rendered |
| **#608** | `coverageStatus` was written, not derived — 113 entries, one value |
| **#609** | No bounded viewport frame existed, so viewport-fixed surfaces could not be proven |
| **#610 / #613** | The site still said **"Live Demos"** in ENGLISH; `verify-website-trust` was *requiring* that literal label |

### New gates (all in `verify:release`, all with mutants or dated exemptions)

| Gate | Fails when |
| --- | --- |
| `verify:badge-contrast` | a badge pair is **uncomputable** (translucent), or below 4.5:1, or no badges are found at all |
| `verify:component-color-pairs` | a component pairs a themeable fill with a foreground not derived against it |
| `verify:site-claims` | an absolute on a visible surface has no registered evidence; a **number is typed into prose**; a proof surface is called a "demo" |
| `verify:component-census` | the component count the site quotes is stale |
| `verify:pattern-coverage` | a demo is removed without the derived coverage being regenerated |
| `verify:i18n-leakage` | a pack ships English where a translation belongs (peer evidence + script) |
| `verify:font-lane-coverage` | a font lane cannot render every supported language |

### New rules in CLAUDE.md

- **Rule 13** (extended): regenerate artifacts with `npm run artifacts:refresh`,
  never by hand — the atom registry **indexes the other generated files**, so
  rebuilding it first leaves it stale. This cost three preflight cycles.
- **Rule 14**: documentation must be **derived** from the system, not describe
  it. A checkable claim is computed, never written. When docs and behaviour
  disagree, establish which half is wrong **before** editing either.
- **Rule 15**: the reference site is documentation with proofs, never a demo,
  never staged. **If documenting something honestly requires a workaround, the
  system is incomplete** — the workaround is only where the incompleteness
  surfaced.

---

## 5. Decisions the owner made — do not re-litigate

| Decision | Ruling |
| --- | --- |
| Category accents identical in every theme | **Fixed by default, overridable per theme**, with the contrast gate verifying any override |
| Badge panel said warning/info were "fixed" when they shift | **Investigate first** — the implementation was right, the copy was wrong |
| Term for proof surfaces | **"Live proofs"** |
| `/live-demos` URL | **Renamed without redirects** — old paths 404 by choice |
| `coverageStatus: 'live-demo'` enum | **Renamed in lockstep with its five gates** |

---

## 6. How to work here

```bash
npm run preflight            # THE gate before any push: clean-before, full chain, clean-after
npm run artifacts:refresh    # regenerate ALL generated artifacts in dependency order
npm run verify:release       # the chain alone (preflight wraps it)
```

**The loop that actually works:**

1. Make the change.
2. `npm run artifacts:refresh` — **last**, after every source edit.
3. Commit.
4. `npm run preflight`. It will often fail once on artifact churn: gates write
   `audit/*.json`, so commit those and run it again. Two cycles is normal.
5. Push, then **watch CI to completion** and report its real conclusion.

**Traps that have each cost real time:**

- The atom registry must be rebuilt **after** everything else. Use
  `artifacts:refresh`.
- Two gates read **live external state** — `audit:dependencies` (npm advisory
  database) and `verify-mantine8-compat` (fresh `npm install`). A green local
  chain **cannot** guarantee a green CI run for those two. Both went red today
  for exactly this reason. Tracked as #604.
- A mutant anchored to a legitimately-changing value (a count, a line number)
  goes INVALID the moment the system grows. Anchor on the **definition**.
- `startPreviewServer` returns a handle with `kill`, **not** `close`.
  `previewServer?.close` is a silent no-op that leaks the server, holds port
  4173 and hangs the next runtime gate forever.
- The shape allowlist pins by `file:line`. Adding a comment moves the line and
  the gate correctly fails. That churn is deliberate.
- The site's phrase extractor sees **string literals only** and rejects braces.
  A template literal silently drops the sentence from all 8 locales. Use a
  `%placeholder%` and substitute after translation — and use a **regex** in the
  `.replace()`, or the bare `'%count%'` literal enters the phrase corpus and
  comes back translated as nonsense.

---

## 7. Open work, graded honestly

### Real defects

All of the session-stream defects are now CLOSED, CI-green on `main`
(`bd9fb34`, `e150bde`, `3076754`): #604 (install failures now retry and are
classified by name, never readable as a compat result), #612 (the nine gaps are
classified with verified reasons and review dates in
`scripts/audit/forward-trace.config.mjs`; they still count in the ratchet),
#614 (allowlists re-keyed by declaration text; stale entries fail the gate),
#615 (comments are lexed out before every gds-compliance source scanner),
#617 (69 component defaults through the locale catalogue; 12 packs at 258 keys;
source→pack parity gate), #619 (`verify:viewport-reachability-runtime`, 24
routes at a true 390px; found and fixed two real long-token overflow defects at
token level in gds-theme), and #606's missing half (the `/live-demos` URL
rename had shipped **without redirects** — the whole legacy family now
redirects, pinned by `site-routes.test.ts`).

Still open:

- **#611** — 7 Hebrew phrases machine translation cannot resolve. Needs a human
  translator; inventing them would violate Rule 11. Genuinely blocked.

### Two lessons worth more than the fixes

- **A probe that is not the real component is not a verification.** The first
  `GdsViewportFrame` check used a synthetic `<div>` and reported the gate
  working. `BottomTabBar` set `display: 'flex'` **inline**, which beats any
  stylesheet rule — the bar would have appeared on every desktop page for every
  consumer. The synthetic probe lacked the one property that made the real one
  fail.
- **A gate can hold a defect in place.** `verify-website-trust` *required* the
  literal label `'Live Demos'`, so #606 could not have renamed it without
  failing the check — which is very likely why the label survived. The same
  shape as #518, where a gate required the stale sentence. When a rename is
  blocked by a gate, ask whether the gate is asserting the claim rather than
  checking it.

### The largest block: the map system (#544 tracker)

`GdsMap` (Leaflet + real OSM tiles), the tile-source contract, keyboard and
text-equivalent access, and `GdsPinSystemReference` have **shipped**, exported
from the **`@sovereignsquad/gds-core/map` subpath** (not the root index —
deliberately, to keep Leaflet out of the main bundle).

Remaining, and it is the **harder half**, because what is left is governed
behaviour *under failure* rather than rendering:

- **#545** — `GdsMapPinBadge` state contract (hover / selected / saved /
  approximate-location / no-emoji-fallback). `saved` composes
  `GdsSavedIndicator`, which now exists. Needs `strokeDasharray` support on the
  pin shape for `approximate`. **Preserve the source principle: the fill belongs
  to the activity, so state is carried by silhouette and scale** — state must
  never repaint the category's own hue.
- **#547** `GdsMapFilterRail`, **#548** `GdsMapPinPreviewCard`,
  **#549** basemap-wash overlay + `docs/MAP_SYSTEM.md`,
  **#550** neighborhood-fill recipe + no-clustering architecture rules,
  **#569** themed basemap, **#570** offline/blocked-tile degradation,
  **#572** `docs/MAP_SYSTEM.md` as SSOT.

### Lessons this closing pass added (same shape as the two above)

- **Anchoring a mutant on visible copy means anchoring on something the product
  may rename.** M7's anchor "Live Demos" was invalidated by #606's rename, and
  the first re-anchor *ran but survived* — a two-word phrase fails the leakage
  measure's own `isProse` rule, so the planted leak was excluded by design, not
  missed. The INVALID/SURVIVED statuses existing at all are the protection.
- **A rename is not shipped until the old name still works.** #606's URL rename
  went out without redirects — the exact break its own checklist forbade — and
  was only caught by re-walking the checklist while closing the issue.

### Everything else

Design-intake contract (#538–#543), imagery expansion (#565), health trackers
(#576, #577, #583 — #603 is closed: three instruments, now named so), theme
details (#551, #552, #598), docs epic (#498), bundle splitting (#532),
attribution cleanup (#512, blocked on permissions).

---

## 8. Before starting any large issue

Check it for **bundling** before you start, not three attempts in. #590 stalled
repeatedly because it packed a 15-minute rename and a 15-minute ratchet together
with an open-ended design question and a **self-referential** mutant — the two
cheap fixes that closed the real risk were hostage to the two hard ones.

Also check the prescribed *mechanism*. #590 asked for a suite mutant that would
have recursed; a direct negative control proved the same property with none of
the recursion. **The blocker was in how the deliverable was written, not in the
problem.**

`#544` is already well-decomposed and says so explicitly. Its "what exists
today" section was stale and has been corrected in a comment, not rewritten.

---

## 9. Standard of proof for any claim you make

- Say **which** routes, elements, themes and colour schemes were checked, and
  whether it was a local build or the **deployed** site. "Confirmed" with no
  qualifier reads as "everywhere, as deployed".
- Local verification is **not** deployment. The owner cannot see your working
  tree.
- "Audit" means an exhaustive sweep, not a spot check.
- If the owner says something is still broken, the default assumption is that
  they are right and the verification was incomplete.
- Never minimise a defect. There is no "minor" or "cosmetic" tier for something
  a user will see.

---

## 10. If you read nothing else

1. `npm run preflight` before every push. Watch CI after every push.
2. Never write a value you could compute.
3. Never claim something you have not observed **this session**.
4. When a gate blocks you, it has probably found a design flaw, not an
   inconvenience. The GDS-only gate refusing an inline style today turned out to
   mean a **primitive was missing a prop**, not that the page needed an
   exception.
