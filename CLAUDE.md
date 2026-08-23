# Agent Operating Rules — General Design System

These rules govern every agent session working in this repository. They apply regardless of
what the current request is, who is asking, or how the session started. When a task conflicts
with these rules, follow the rules and say so explicitly rather than silently overriding them.

## 1. Zero-tolerance quality gate for `main`

Nothing lands on `main` (directly or via merge) with:

- **any deprecation warning** — from Node, npm, TypeScript, ESLint, Vite/tsup/rolldown,
  Mantine, or any other tool in the build/test/lint chain
- **any warning** — build warnings, lint warnings, type-check warnings, test
  warnings, `npm audit`/`npm install` warnings
- **any error** — build errors, type errors, lint errors, test failures

Applies to the full chain: `npm run build`, `npm run lint`, `npm run test:run`, and
`npm run verify:release`. Fix the warning or deprecation at the source (upgrade the dependency,
replace the deprecated API, correct the code) — never suppress, silence, filter out of logs, or
hide behind a flag (`--no-warnings`, ESLint disable comments, swallowed stderr) to pass a check.
If a clean run isn't currently achievable, say so and stop before pushing — don't push anyway
and note it as a known issue.

## 2. Always work from GitHub issues

Every request that results in a code, doc, or config change gets a GitHub issue — before or
as part of doing the work:

- decompose vague or broad requests into a deliverables checklist
- open the issue(s) before/while implementation starts, not after
- reference the issue number(s) in commit messages and close them with a reference to the
  commit/PR that resolved them

Purely conversational exchanges (answering a question, checking a workflow run status) don't
need an issue.

## 3. Documentation is mandatory

Every change ships with the relevant documentation updated in the same change set — the SSOT
docs tracked by `scripts/verify-docs-governance-consistency.mjs`, `README.md`, `llms.txt`,
`CHANGELOG.md`, and any doc whose described behavior the change affects. A change that alters
behavior without a corresponding doc update is incomplete, regardless of whether it builds and
passes tests.

## 4. Definition of Done (DoD)

Work is not done until all of the following hold, explicitly checked, not assumed:

- the requested behavior is implemented and demonstrably works
- automated tests cover the change (new or updated), and the full suite passes
- `npm run build`, `npm run lint`, and `npm run test:run` are clean (Rule 1)
- relevant documentation is updated (Rule 3)
- the change is traceable to a GitHub issue (Rule 2)
- known edge cases, failure states, and accessibility/i18n implications have been considered
- the change has been committed with a clear message and pushed to the intended branch

## 5. Never guess — read, research, verify

Before making a change or stating a fact about this codebase:

- read the actual file/code/log/output — don't assume its contents from memory or naming
  conventions
- if unsure whether something exists or behaves a certain way, search for it (Grep/Glob/Read)
  or run it, rather than asserting it
- when reporting status (CI runs, publish results, test outcomes), report what the tool
  actually returned — never fabricate or extrapolate unobserved results
- if genuinely blocked from verifying something, say so plainly instead of guessing

## 6. Pre-authorized branch and push operations

The user has no terminal access and relies on the agent to run git commands directly. These
operations are pre-authorized and don't require asking each time:

- **`dev` and `preview` branches** — create, merge, and pull freely for staging/preview work
- **Direct push to `main`** — when the user says "commit and push to main" (or equivalent),
  push directly. Don't open a PR instead unless asked for one specifically.

This doesn't relax Rule 1: a direct push to `main` still requires a clean
build/lint/test/`verify:release` chain first. It doesn't extend to other destructive or
hard-to-reverse operations (force-push, history rewrite, branch deletion) — those still require
explicit per-instance confirmation.

### "Push to origin main" is the git operation, not the downstream CI/CD pipeline

"Push to origin main" means: run `git push origin main` once the commit has passed local
`verify:release`. That succeeding is what "done" means for the push.

It does not mean waiting for, or gating the report of success on, the separate GitHub Actions
workflows (`GDS Quality`, `Deploy GDS Playground to GitHub Pages`) that trigger automatically
afterward — those are independent, asynchronous processes. Report the push as complete once it
lands on `origin/main`. If a downstream workflow later fails, diagnose and report that as its
own follow-up with a definitive root-cause verdict, not as an open-ended retry loop narrated
turn-by-turn.

## 7. The label board is authoritative; the Projects v2 board is used when reachable

The GDS project board is GitHub Issues organized by labels (see
[`PROJECT_BOARD.md`](PROJECT_BOARD.md)): the `status:`/`priority:`/`area:` taxonomy in
`scripts/board-labels.config.mjs`, plus a tracking issue and, where useful, a milestone. It
needs nothing but issue access, so it works in every environment. An issue's real status is its
label.

The org-level board
[`{GDS} - From IDEA to LIVE`](https://github.com/orgs/sovereignsquad/projects/11) (project 11)
carries a `Status` column, `Execution Sequence (HVB)`, and a free-text `Dependency Signal`.
Writing it requires a token with the `project` scope, which some sessions have and some don't.
Check first: if the scope is present, populate project 11 alongside the labels; if not, deliver
the label board alone and say so plainly. Never report that project 11 was updated without
having verified it, and never imply a Projects v2 capability the session can't reach.

When asked to "add issues to the project board," deliver: the issues filed, the board labels
applied, a tracking issue grouping them, a milestone assigned, and — where reachable — project
11 items with `Status`, `Execution Sequence (HVB)`, and `Dependency Signal` set.

## 8. No guessing on structural, architectural, or business-logic questions

For any question about this system's structure, architecture, business logic, data flow,
contracts, dependencies, or behavior, do not answer from memory or guess. Read the relevant
documentation and source, investigate (Read/Grep/Glob, run the code or gate, web research where
external), then answer from what was actually found and cite the sources. If it can't be
verified, say so.

## 9. AI attribution and branding policy

AI systems used on this repository are internal implementation tools only — never authors,
contributors, publishers, reviewers, or project participants. No commit, branch name, PR,
issue, code comment, doc, UI string, API response, log line, config file, or package manifest
may carry AI/model/provider attribution or branding (no `Co-Authored-By` AI trailers, no
session URLs, no "Generated by...", no model names) unless a human explicitly asks whether AI
was used, or law/contract/compliance requires disclosure. Provider identifiers used strictly
for functional integration (API endpoints, model-selection config) are fine.

If a tool or template inserts this automatically, remove it before the commit/PR/artifact is
created wherever possible. If removal of already-published attribution is impossible, say so
rather than claiming success. Rewriting already-pushed git history to strip old attribution is
destructive and hard to reverse — it requires explicit per-instance confirmation (Rule 6); don't
do it silently.

## 10. Fixes on the GDS page are always system-level — no detours

`apps/playground` (the GDS website) is a live demonstration of the system itself, required to
consume `gds-core`/`gds-theme`/`gds-admin` the same way any other consumer does. A fix there is
categorically different from an ordinary consumer-app fix:

- **Diagnose to the real component, not the page.** Find and fix the root cause in the shared
  package (`packages/gds-core`, `packages/gds-theme`, `packages/gds-admin`) — never
  `apps/playground` itself, never a page-local override/wrapper/workaround. A change that only
  touches `apps/playground` without fixing the governed component is a detour, forbidden
  regardless of how small the visible symptom is.
- **No hardcoded styles in the fix.** Every color, spacing, radius, size, or other visual value
  must come from a governed design token — never a raw hex/rgb literal, a bare pixel/rem number,
  or an invented constant.
- **No unique/one-off CSS.** No page-scoped stylesheets, inline `style` overrides, CSS Modules,
  or selectors that style the GDS page differently from every other consumer. Fix the shared
  component's default instead.
- **Verify the fix is systemic.** After fixing the shared component, confirm live that the same
  defect doesn't recur elsewhere the component is used.

## 11. No assumptions, no guessing, no hallucinations

Applies to every output, in any form, at any point in a session:

- **No assumptions.** Don't treat something as true because it would be reasonable or typical.
  If it hasn't been read, run, or directly observed this session, verify it first.
- **No guessing.** Don't fill a gap — a color value, an icon, a prop shape, a status, a number —
  with a plausible placeholder presented as real. Find it, or say it can't be found.
- **No hallucinations.** Never state a fact, cite a file/line, describe behavior, or claim a
  result that wasn't actually observed this session. Say "I haven't checked" instead of
  reporting something unverified as verified.

Applies to code, prose, chat responses, and any generated artifact/preview/mockup — a demo
built to represent a real system uses that system's actual, source-verified values, never an
invented approximation.

## 12. "Confirmed," "fixed," "legible," "done" must mean exactly what they claim

- **State scope, not vibes.** Every claim of "fixed"/"confirmed"/"legible"/"working"/"done"
  names exactly what was checked: which route(s), which elements, which environment (local
  build vs. actual live/deployed site), which states (every theme × every color scheme in play,
  not just the one open). "Confirmed legible" with no qualifier reads as "everywhere, as
  deployed" — don't say it unless true.
- **Local verification is not deployment.** A fix in a local working tree, however thoroughly
  tested, is not "done" until it's pushed. Every report states plainly whether it's been pushed
  to `main`/deployed, before any claim of resolution.
- **"Audit" means exhaustive**, not a spot check. A systematic sweep of every relevant
  route/state/element combination, using the tooling already established in this repo (live
  browser verification via CDP, computed-style/contrast checks — not visual impression alone).
  If full coverage isn't feasible in the time available, say what was covered and what wasn't.
- **A user's contradicting report is evidence, not an inconvenience.** If told something is
  still broken after a fix was reported, assume they're right and the verification was
  incomplete — re-check with fresh eyes, don't defend the earlier claim.
- **No minimizing language about a defect.** A defect a user will see is a defect — not
  "under-weighted," "minor," "cosmetic" when it isn't. If something was misjudged, say so
  plainly and fix it.

## 13. Never push without a CI-equivalent local run, and never report done before CI is green

- **A dirty working tree makes some checks structurally blind.** `verify:gates` only reports
  files that become dirty *during* the suite — an artifact already uncommitted before the run
  is invisible to it, but CI checks out clean and sees it. Run the full chain on a clean tree —
  commit or stash first.
- **Regenerate artifacts with `npm run artifacts:refresh`, never by hand.** Order matters: the
  atom registry indexes the other generated files, so rebuild it after regenerating tokens, the
  component census, and the phrase packs — not before. The audit traces run after the registry,
  since `dimensions.mjs` reads `registry.json`.
- **`git status --porcelain` must be empty after the chain.** Use `npm run preflight`, which
  enforces clean-before, clean-after, and the full chain in one command. `verify:release` alone
  doesn't satisfy this.
- **Build artifacts must not be assumed.** A developer tree always has a `dist/` from an earlier
  build; a CI checkout doesn't. When a change touches the release chain's ordering or a gate
  that reads built output, delete every `dist/` and run the chain from scratch.
- **The push is not the finish line.** Watch the `GDS Quality` run to completion and report its
  actual conclusion. Closing an issue or claiming delivery with CI unchecked, or still in
  progress, overstates the work behind it.
- **A red run is fixed at the source, immediately** — not batched, not deferred, never left on
  `main` while moving to the next task.

## 14. Documentation must be derived from the system, not describe it

- **A checkable claim must be computed, not written.** If a statement in the documentation
  (page copy, a label, a table, a README line) asserts something the system can be asked (a
  token value, a count, a contrast ratio, a threshold, which presets do what), derive it at
  render or build time from the same source the system uses — never retype it from a
  measurement taken once. `GdsPinSystemReference` is the pattern: every number on it is
  surfaced from a source export or computed live.
- **Prose that can't be derived must be gated or dated.** Some claims are design contracts, not
  measurements — legitimate as prose, but enforce them with a gate where possible, and state
  plainly where they aren't rather than implying a guarantee nothing checks.
- **The documentation page is the product.** A defect in what a page claims is the same
  severity as a defect in what the system does.
- **When docs and behaviour disagree, investigate which half is wrong before editing either.**
  Read the source and the history, establish the intent, then fix the half that's actually
  wrong.

## 15. The reference site is documentation with proofs — never staged

Every element on the reference site is the shipped system rendering itself (Rule 10 forbids
page-local fixes there). When a proof needs a capability GDS doesn't have, in priority order:

1. **Build it in the system, then document through it.** If a proof needs something the page
   can't do without a page-local workaround, the missing piece belongs in the package, not the
   page — add the primitive/prop the shared component needs.
2. **If it can't be built now, state the absence** on the page, and file an issue.
3. **Never stage it.** No page-local styling, no fake data presented as real, no hand-composed
   approximation of a component that doesn't exist.

## 16. Everything visible on the reference site is implemented in the GDS packages

Rule 10 forbids page-local fixes; this goes further: no visible behavior on the reference site
may be produced by page-local implementation at all. The page composes what the packages
export and supplies only data (copy, routes, registries, phrase packs). If a visible capability
exists only as playground code, promote the mechanism into the packages and leave the data
behind. Test: could a consumer obtain this visible behavior by installing the packages? If not,
it moves.

## 17. No AI fingerprints, watermarks, or narrative commentary in repository text

Repository-authored text must contain no AI attribution, generation markers, assistant
fingerprints, or unnecessary narrative commentary. Comments must be short, functional, and
limited to information that is non-obvious and technically useful. Never cite prompts, agents,
owner directives, or internal instruction files inside production repository text.

Applies to all text in the repository: source comments, docstrings, Markdown, documentation,
READMEs, this file, configuration comments, commit/PR templates, scripts, tests, generated
scaffolding, examples, TODOs, error messages, internal notes, and user-facing copy where
applicable — not only text added in a given session.

Remove: AI/model/provider names or attribution; `Co-Authored-By`/"Generated by"/session
links/model identifiers; comments citing an internal instruction document as justification
("per AGENTS.md", "owner directive", "as instructed"); narration of why a change was made when
the information isn't technically necessary; narration of implementation steps, cleanup, or an
agent's own actions; repeated contrastive rhetoric ("not X — Y", "instead of merely...") used
as unnecessary stylistic explanation; meta-commentary ("this ensures...", "we intentionally...",
"note that...") unless the underlying fact is genuinely required to prevent a maintenance
error; headings, prose, or summaries that exist to explain the work rather than the software.

Don't blindly delete useful information. For each affected block: keep it only if a developer
needs it to correctly understand, maintain, or safely modify the code; if needed, rewrite as
the shortest clear functional statement, keeping concrete constraints, invariants, edge cases,
and compatibility/security requirements while dropping who asked for it or why it was written
that way. Never add a comment describing this removal.

Excluded: legally required notices, third-party license/copyright text, externally required
attribution, protocol/standards references, and technically meaningful AI references where AI
is genuinely part of the product.

## Portable lesson: a framework silently picking one of two ambiguous configs is a real failure mode

A production outage in a sibling project (the `management` engine repo, built on Next.js, 2026-08-20)
came from two files that, by the framework's own routing rules, resolved to the identical URL. The
framework did not error at build time — it silently picked one and discarded the other, with no warning
anywhere, and the discarded one became completely unreachable. The bug was invisible until a real user
hit it in production; every prior check had only ever exercised the winning path.

The general lesson, applicable beyond Next.js: when a framework or tool allows two pieces of config to
plausibly resolve to the same identity (a route, a key, a slot, a registration), do not assume it will
error on the collision — verify it does, or add an explicit check that greps/validates for duplicates
before deploy. "The build succeeded" is not evidence of no collision unless the build step actually checks
for one.
