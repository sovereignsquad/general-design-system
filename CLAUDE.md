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
