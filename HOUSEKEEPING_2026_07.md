# Housekeeping Initiative — July 2026

Status: Active reference — evidence trail and retrospective (not an SSOT contract)
Last updated: 2026-07-24
Tracking issue: #406

## Purpose

Following the 3.12.0 competitive gap-closing batch (#387-#398) and its DX/
documentation follow-ups (#399-#405), this initiative ran a full
housekeeping pass: eliminate code-comment inconsistencies, fix release-note
defects, consolidate a drifting roadmap, harden the GitHub Pages pipeline,
sweep dependencies for staleness, and add missing content (a case study, a
docs cookbook expansion). It was executed as a Research → Execution →
Outcomes plan; this doc is the Outcomes-phase evidence trail (O1), with the
SWOT analysis (O2) as its terminal section below.

## What shipped

### Research (closed with concrete findings, no code changes)
- **#407** — Roadmap cross-reference audit: confirmed no script gates links
  into the two roadmap docs; all cross-references are plain prose/relative
  links, safe to consolidate.
- **#408** — JSDoc baseline audit: gds-core 724/746 public exports
  undocumented, gds-admin 75/77, gds-theme 82/93, gds-a11y 10/10 — sized
  the deferred E4 backfill precisely instead of guessing.
- **#409** — Pages route/link inventory: confirmed legacy redirects already
  work (`App.tsx` consumes `getLegacyRedirects()` via `<Navigate>`), and
  nav-active-state for `/patterns/*` sub-routes already works correctly by
  design (prefix-matched, tested) — closed two suspected gaps as non-issues.
- **#410** — Dependency staleness baseline: 28 outdated packages, 13 with a
  newer major available, 0 deprecated.

### Execution
- **Comment consistency** (#411 E1, #412 E2, #413 E3, #415 E5): standardized
  issue references to bare `#NNN` (with a documented exception for
  `apps/*` files scanned by the raw-color-literal compliance rule — a real
  false-positive collision found and fixed during this work: 3-digit issue
  numbers are also valid CSS hex color literals), added a Comment &
  Documentation Conventions section to `CONTRIBUTING.md`, added an opt-in
  `require-exported-jsdoc` ESLint rule (not yet enabled — see E4 below),
  and decided file-header comments are not required.
- **Release notes** (#416 E6, #417 E7): fixed a literal duplicate
  `## 3.6.0` CHANGELOG header; the "missing" `gds-v3.12.0` tag turned out
  to already exist (a stale local git-tag fetch, not a real gap).
- **Roadmap consolidation** (#418 E8, #419 E9): made
  `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md` canonical, applied
  resolved-strikethrough to its 2 stale P0 items, migrated
  `GDS_GAP_INVENTORY.md`'s unique theme-family gap content into a new
  appendix, archived it with a pointer stub.
- **Case study & cookbook** (#420 E12, #421 E13): first GDS case study
  (`docs/CASE_STUDY_CLASSSCOUT.md`) and a new Cookbook section in
  `docs/SCHEMA_FORMS.md`.
- **GitHub Pages hardening** (#422 E14, #423 E15, #424 E16 not_planned,
  #425 E18): added a fast pre-deploy verify gate and a post-deploy HTTP
  smoke check to `deploy-pages.yml`, and a new general internal route-link
  checker (`verify-playground-route-links.mjs`) — caught and fixed a real
  bug in the checker itself (prefix-matching was too lenient) before it
  shipped. #424 (register `/patterns/*` sub-routes) closed as not-planned:
  nav-active-state already worked correctly by design.
- **Dependency sweep** (#426 E19, #427 E20, #428 E21): extended
  `generate-dependency-risk-report.mjs` with a warn-and-record staleness/
  deprecation section, swept all compat/smoke scripts for the missing-
  peer-pin class already fixed twice this session (found no more
  instances), and recorded the first sweep's disposition in
  `DEPENDENCY_AUDIT.md`.

### Deferred
- **E4 — JSDoc backfill** (~891 public exports across 5 packages) was
  explicitly deferred to its own future pass given its size, per the plan's
  own risk section. The tooling to enforce it (`require-exported-jsdoc`)
  already exists and is ready to enable once the backfill lands.

### Real defects found and fixed along the way (not originally scoped)
- A raw-color-literal compliance false-positive caused by 3-digit issue
  numbers looking like CSS hex codes (`#316` reads as valid hex shorthand).
- A stale-tag workflow re-trigger mistake (re-running a workflow against an
  immutable tag instead of `main`, re-executing pre-fix code).
- A too-lenient internal route-link checker (prefix-matching let a
  deliberately-broken test link through) — caught by writing an explicit
  negative test case before trusting the tool.
- The same missing `@mantine/dates`/`dayjs` peer-pin bug found and fixed
  twice in two different smoke-test scripts (`verify-mantine8-compat.mjs`,
  `verify-published-consumer-smoke.mjs`) during the 3.12.0 release, which
  directly motivated E20's proactive sweep.

## Outcomes — SWOT Analysis (as of 2026-07-24, post-housekeeping)

### Strengths
- **Zero-tolerance quality gate, genuinely enforced.** Every change in this
  entire initiative (and the 3.12.0 batch before it) went through a full
  `npm run verify:release` — build, lint, 331 tests, ~25 governance/
  accessibility/i18n scripts, and a live-browser runtime pass — before
  reaching `main`. Real gate failures were fixed at the root every time
  (see "Real defects found" above), never suppressed.
- **Evidence-driven roadmap.** Both the competitive gap analysis and this
  housekeeping pass are grounded in direct source reads and real consumer
  evidence (ClassScout's 10 shipped components), not speculation — codified
  now in `docs/CASE_STUDY_CLASSSCOUT.md` as a repeatable pattern.
- **Comprehensive, self-verifying component catalog.** 270 public
  components, 141 registered/129 exempted in the live pattern catalog, 0
  unregistered gap — checked by a dedicated parity gate on every release.
- **Multi-version compatibility discipline.** Mantine 7/8/9 and React 18/19
  are smoke-tested on every release, not just the latest line.
- **Single canonical roadmap**, after this pass — no more drift between
  overlapping docs disagreeing with shipped reality or each other.

### Weaknesses
- **JSDoc coverage is very low** (724/746 undocumented in gds-core alone) —
  explicitly measured and documented, not hidden, but still a real gap
  until E4 lands. New/recently-touched components already model the target
  style (`GdsBreadcrumbs.tsx`, `GdsDensity.tsx`).
- **Comment conventions were inconsistent until this pass** and remain
  inconsistent retroactively — the new standard applies going forward and
  to newly-touched files, not as a mass retrofit (a deliberate scope
  cutline, not an oversight).
- **Home-grown compliance/lint tooling has real brittleness**, demonstrated
  concretely this session: a regex-based raw-color-literal check produced
  a false positive on ordinary issue-number references. The tooling is
  valuable but not infallible — any future rule addition needs the same
  "does this false-positive on realistic content" scrutiny applied here.
- **GitHub Pages had no verification gate or post-deploy check until this
  pass** — now fixed, but it shipped without one for the entire prior
  history of the project.

### Opportunities
- **Theme-family coverage gaps** (8 items, `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md`
  §5 Appendix): provider-branded auth themes, white-label/tenant theming,
  reporting-dashboard theme grammar, and five others — real, evidence-backed,
  not yet prioritized.
- **Remaining P2 items**: broader icon-search tooling, box-plot/choropleth
  chart types, Thai/Devanagari locale coverage.
- **JSDoc backfill (E4)** turns the biggest current Weakness into a
  Strength once complete — the enforcement tooling is already built and
  waiting.
- **Case-study pattern is proven but has one instance** — Amanoba, SSO,
  Messmass, and other `PROJECTS/*` refactors have similar real-integration
  evidence that could become additional case studies following the same
  template.

### Threats
- **13 dependencies are a major version behind** (Mantine 7→9, React 18→19,
  TypeScript 5→7, and others) — mostly intentional compatibility lanes
  today, but the gap will keep widening if the compatibility matrix itself
  is never advanced, and each of these eventually reaches its own
  end-of-support horizon.
- **Deferred JSDoc backfill is real technical debt** — every month it stays
  unaddressed, new undocumented exports may be added on top of it, growing
  the eventual backfill scope.
- **Tooling-brittleness risk is structural, not one-off** — the raw-color
  false positive was caught because a housekeeping pass happened to touch
  that exact file; a similar collision could exist undiscovered elsewhere
  until something touches it.

## Next steps (not yet started)
- E4: JSDoc backfill, phased per package, using #408's counts to size each
  phase — own future pass.
- A version bump + release for everything in this initiative (deferred
  pending a decision on whether to bundle it with E4 or ship independently).
