# Agent Operating Rules — General Design System

These rules govern every agent session working in this repository. They are
standing instructions, not task-specific guidance: they apply regardless of
what the current request is, who is asking, or how the session started.
When any instruction in a specific task conflicts with these rules, follow
these rules and say so explicitly rather than silently overriding them.

## 1. Zero-tolerance quality gate for `main`

Nothing lands on `main` (directly or via merge) with:

- **any deprecation warning** — from Node, npm, TypeScript, ESLint, Vite/tsup/rolldown,
  Mantine, or any other tool in the build/test/lint chain
- **any warning** — build warnings, lint warnings, type-check warnings, test
  warnings, `npm audit`/`npm install` warnings
- **any error** — build errors, type errors, lint errors, test failures

This applies to the full chain: `npm run build`, `npm run lint`,
`npm run test:run`, and `npm run verify:release`. A warning or deprecation
notice must be **fixed at the source** (upgrade the dependency, replace the
deprecated API, correct the code) — never suppressed, silenced, filtered out
of logs, or hidden behind a flag (`--no-warnings`, ESLint disable comments,
swallowed stderr, etc.) to make a check pass. If a clean run is not
currently achievable, say so and stop before pushing to `main` — do not push
anyway and note it as a known issue.

## 2. Always work from GitHub issues

Every incoming request — feature, bug, refactor, doc update, question that
turns into work — must be broken down into concrete deliverables and
recorded as a GitHub issue (or issues) before or as part of doing the work.
This includes:

- decomposing vague or broad requests into a deliverables checklist
- opening the issue(s) before/while implementation starts, not after the fact
- referencing the issue number(s) in commit messages and closing them with a
  reference to the commit/PR that resolved them

Small, purely conversational exchanges (answering a question, checking a
workflow run status) don't need an issue. Anything that results in a code,
doc, or config change does.

## 3. Documentation is mandatory

Every change ships with the relevant documentation updated in the same
change set — not as a follow-up. This includes the SSOT docs tracked by
`scripts/verify-docs-governance-consistency.mjs`, `README.md`, `llms.txt`,
`CHANGELOG.md`, and any doc whose described behavior the change affects.
A change that alters behavior without a corresponding doc update is
incomplete, regardless of whether it builds and passes tests.

## 4. Industry-standard Definition of Done (DoD) is mandatory

Work is not done until all of the following hold, explicitly checked, not
assumed:

- the requested behavior is implemented and demonstrably works
- automated tests cover the change (new or updated), and the full suite passes
- `npm run build`, `npm run lint`, and `npm run test:run` are clean (see Rule 1)
- relevant documentation is updated (see Rule 3)
- the change is traceable to a GitHub issue (see Rule 2)
- known edge cases, failure states, and accessibility/i18n implications (where
  applicable) have been considered, not just the happy path
- the change has been committed with a clear message and pushed to the
  intended branch

## 5. Never guess — always read, research, and analyse

Before making a change or stating a fact about this codebase:

- read the actual file/code/log/output — do not assume its contents from
  memory, naming conventions, or what a similar file usually contains
- if unsure whether something exists or behaves a certain way, search for it
  (Grep/Glob/Read) or run it, rather than asserting it
- when reporting status (CI runs, publish results, test outcomes), fetch and
  report what the tool actually returned — never fabricate or extrapolate
  results that haven't been observed
- if genuinely blocked from verifying something (no access, network policy,
  missing credentials), say so plainly instead of filling the gap with a guess

## 6. Pre-authorized branch and push operations

The user operates via an AI coding assistant on iOS mobile with no terminal
access — they cannot run git commands themselves and rely on the agent to
execute them directly. The following operations are pre-authorized and do not
require asking for confirmation each time:

- **`dev` and `preview` branches** — create, merge, and pull these branches
  freely as needed for staging/preview work, without asking first.
- **Direct push to `main`** — when the user says "commit and push to main"
  (or clearly equivalent phrasing), push the commit(s) directly to `main`.
  Do not open a pull request instead and wait for approval unless the user
  asks for a PR specifically.

This authorization does not relax Rule 1: a direct push to `main` still
requires a clean build/lint/test/`verify:release` chain first. It also does
not extend to other destructive or hard-to-reverse operations (force-push,
history rewrite, branch deletion, etc.) — those still require explicit
per-instance confirmation.

### "Push to origin main" is the git operation, not the downstream CI/CD pipeline

When the user says "push to origin main" (or equivalent), that means: run
`git push origin main` directly, once the commit has passed local
`verify:release` per Rule 1. That git push succeeding is what "done" means.

It does **not** mean waiting for, blocking on, gating the report of success
on, or treating as part of the same task the separate GitHub Actions
workflows (`GDS Quality`, `Deploy GDS Playground to GitHub Pages`, etc.)
that trigger automatically afterward. Those are independent, asynchronous
CI/CD processes outside the push itself. Report the push as complete once
it lands on `origin/main`. If those downstream workflows later fail —
including for reasons outside this repository's control, such as a GitHub
Actions/Pages infrastructure incident (runner-queue starvation, OIDC
key-endpoint propagation lag, etc.) — diagnose and report that as its own
follow-up, with a definitive root-cause verdict once the evidence supports
one, not as an open-ended retry loop narrated turn-by-turn as if the push
itself were still in progress.

## 7. No GitHub Projects (v2) board API — the board is labels

This session's toolset has **no GitHub Projects (v2) board API**. The GitHub
tools can create, label, close, and comment on **issues**, and manage
**milestones** — but they cannot create a Projects v2 board, add cards/items to
one, or set its status/column fields. Never claim a Projects v2 board was
created or updated, and never attempt to write one.

The GDS "project board" is therefore **GitHub Issues organized by labels** (see
[`PROJECT_BOARD.md`](PROJECT_BOARD.md)): the `status:` / `priority:` / `area:`
label taxonomy, plus a **tracking issue** and, where useful, a **milestone**.
When asked to "add issues to the project board," deliver exactly that — file the
issues, apply the board labels, group them under a tracking issue, and assign a
milestone — and state plainly that this is the label-based board, not a
Projects v2 board. Do not offer or imply a Projects v2 capability that does not
exist in this session.

## 8. No guessing on structural, architectural, or business-logic questions

For any question about this system's structure, architecture, business logic,
data flow, contracts, dependencies, or behavior — anything structural or
crucial — you are **prohibited from answering from memory or guessing**. First
read the relevant documentation and source, research, and investigate
(Read / Grep / Glob, run the code or gate, web research where the answer is
external), then answer from what you actually found and cite the files or
sources you relied on. If you cannot verify it, say so plainly instead of
filling the gap with a plausible-sounding guess. This makes Rule 5 explicit for
the questions that matter most: when a question is structural, crucial, business-
logic, or architectural, reading and investigation are mandatory, not optional,
and a confident guess is treated as a defect — not a shortcut.

## 9. AI attribution and branding policy (owner directive, 2026-07-31)

AI systems (any provider, model, coding assistant, or agent) used on this
repository are internal implementation tools only — never authors,
contributors, publishers, reviewers, or project participants. No commit,
branch name, PR, issue, code comment, doc, UI string, API response, log
line, config file, or package manifest may carry AI/model/provider
attribution, branding, or session references (no `Co-Authored-By` AI
trailers, no session URLs, no "Generated by...", no model names) unless a
human explicitly asks whether AI was used, or law/contract/compliance
requires disclosure. Provider identifiers used strictly for functional
integration (API endpoints, model-selection config) are fine — this is
about attribution, not operational config.

If a tool or template inserts this automatically, remove it before the
commit/PR/artifact is created wherever technically possible. If removal of
already-published attribution is impossible (immutable platform history,
a platform that doesn't allow edits), say so plainly rather than claiming
success. Rewriting already-pushed git history to strip old attribution is
a destructive, hard-to-reverse operation on a shared branch — it still
requires the explicit per-instance confirmation Rule 6 already requires for
history rewrites; don't do it silently just because this policy exists.

## 10. Fixes on the GDS page are always system-level — no detours (owner directive, 2026-08-08)

`apps/playground` (the GDS website: patterns, live demos, Theme Lab, and
every other route users see) is not just documentation — it is a **live
demonstration of the system itself**. Anything wrong there is, by
construction, wrong in the shared system, because the playground is
required to consume `gds-core`/`gds-theme`/`gds-admin` the same way any
other consumer does (see the top-level "Public reference site" framing in
`COMPONENTS_AND_PATTERNS.md` and the `verify:playground-gds-only`/
`verify:owned-contrast-compliance` gates that enforce it). This makes
fixing a GDS-page bug categorically different from fixing an ordinary
consumer-app bug:

- **Diagnose to the real component, not the page.** When something is
  broken on the GDS page, find and fix the root cause in the shared package
  that renders it (`packages/gds-core`, `packages/gds-theme`,
  `packages/gds-admin`, etc.) — never in `apps/playground` itself, and never
  with a page-local override, wrapper, or workaround that only patches what
  the user happens to see. A fix that only changes `apps/playground` without
  touching the governed component it renders through is not a fix — it is a
  detour, and detours on this point are **strictly forbidden**, no
  exceptions, regardless of how small or urgent the visible symptom is.
- **No hardcoded styles, anywhere in the fix.** Every color, spacing,
  radius, size, or other visual value introduced or changed must come from
  a governed design token (Mantine's own token/spacing/radius scale, or a
  GDS `--gds-*` custom property) — never a raw hex/rgb literal, a bare
  pixel/rem number, or a magic constant invented to make one screenshot
  look right.
- **No unique/one-off CSS.** Do not add page-scoped stylesheets, inline
  `style` overrides, CSS Modules, or any selector that exists to style the
  GDS page differently from how the shared component already renders for
  every other consumer. If the shared component's own default is wrong,
  fix the shared component's default — don't carve out an exception for the
  page that happens to expose the bug.
- **Verify the fix is systemic before calling it done.** After fixing the
  shared component, confirm live (Rule 5) that the same defect doesn't
  recur elsewhere the component is used, not just on the one route that was
  reported.

This rule sharpens Rule 1 (nothing broken ships) and Rule 4 (DoD) for the
specific case of GDS-page bugs: the "requested behavior... demonstrably
works" bar for a GDS-page fix is met only when the underlying shared
component is fixed, not when the symptom on the page disappears.

## 11. No assumptions, no guessing, no hallucinations (owner directive, 2026-08-08)

This is a standalone, zero-tolerance rule, not a restatement of Rules 5/8 —
those cover guessing about codebase facts before making a change; this one
covers every output, in any form, at any point in a session:

- **No assumptions.** Do not treat something as true because it would be
  reasonable, typical, or consistent with a pattern seen elsewhere. If it
  hasn't been read, run, or otherwise directly observed in this session, it
  is not known — verify it first.
- **No guessing.** Do not fill a gap — a color value, an icon, a prop shape,
  a status, a number — with a plausible-sounding placeholder and present it
  as real. If the real value is unknown, go find it (Read/Grep/Glob, run the
  code, inspect the live output); if it genuinely cannot be found, say so
  explicitly rather than substituting an invented stand-in.
- **No hallucinations.** Never state a fact, cite a file/line, describe a
  component's behavior, or claim a result (a test outcome, a CI status, a
  visual appearance) that was not actually observed this session. Reporting
  something unverified as verified is a defect, not a shortcut — say "I
  haven't checked" instead.

This applies uniformly to code, prose, chat responses, and any generated
artifact/preview/mockup — a demo built to *represent* a real system must use
that system's actual, source-verified values (colors, tokens, copy, icons),
never an invented approximation, even when the artifact is not itself
shipped code. When in doubt, investigate before answering; if investigation
isn't possible, say so plainly instead of filling the gap.
