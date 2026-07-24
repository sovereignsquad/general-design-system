# Contributing

Status: Active
Version: 3.12.0
Last updated: 2026-07-23

This repository is shared design-system infrastructure.

## Standing Operating Rules (non-negotiable)

These apply to every change, every contributor (human or agent), regardless
of task. Full detail for agents in [`CLAUDE.md`](CLAUDE.md).

1. **Zero-tolerance quality gate for `main`** — no deprecation warnings, no
   warnings, no errors anywhere in the build/lint/test/`verify:release`
   chain for anything committed or merged to `main`. Fix the source; never
   suppress or hide the signal.
2. **Always work from GitHub issues** — decompose every request into
   deliverables and record them as GitHub issues before/while implementing.
   Reference and close issues from the commits that resolve them.
3. **Documentation is mandatory** — ship doc updates in the same change set
   as the behavior they describe, not as a follow-up.
4. **Industry-standard Definition of Done is mandatory** — implemented,
   tested, clean build/lint/test, documented, traceable to an issue, edge
   cases considered, committed and pushed. Explicitly checked, not assumed.
5. **Never guess** — read, research, and analyse the actual code/docs/system
   state before acting or reporting a result. If something can't be verified,
   say so instead of filling the gap with an assumption.
6. **Pre-authorized branch/push operations** — the repository owner uses
   Claude Code on iOS mobile with no terminal access. `dev` and `preview`
   branches may be created, merged, and pulled without asking first. When the
   owner says "commit and push to main," push directly to `main` (no PR,
   no waiting for approval) — provided Rule 1's quality gate passes.

## Allowed Change Types

- Shared foundation rules (`FOUNDATION.md`)
- Component and UX contracts (`COMPONENTS_AND_PATTERNS.md`)
- Cross-project pattern-service contracts (`PATTERN_SERVICE_MODEL.md`)
- Governance, migration, or enforcement processes (`GOVERNANCE_AND_ADOPTION.md`)
- Project-specific migration plans under `PROJECTS/`

## Rules

1. Keep normative files cross-project. Do not document project-local hacks here.
2. Put rollout details for a specific product under `PROJECTS/`.
3. If a rule is not ready for cross-project use, keep it in the project until it is.
4. Prefer durable, reviewable language over brainstorming notes.
5. Do not weaken the Mantine-only platform rule without an explicit major-version policy change.
6. Promote repeated local UI solutions into `PATTERN_SERVICE_MODEL.md` before copying them across projects.

## Validation Expectations

Before merging shared package changes, run:

- `npm run verify:release`
- `npm run build`
- `npm run lint`
- `npm run test:run`

If a change affects root composition, shared copy, or exported component behavior, the change should include or update automated tests unless there is a documented reason it cannot.

## Comment & Documentation Conventions

- **Issue references.** Use bare `#NNN` (GitHub's native auto-linking format)
  in comments, CHANGELOG entries, and doc prose — not `GH-NNN` or other
  variants. **Exception:** inside any `.js`/`.jsx`/`.ts`/`.tsx` file under
  `apps/*` (the consumer-surface apps `gds-compliance`'s `strict.raw-color`
  rule scans for raw hex color literals), do **not** write a bare `#NNN`
  issue reference — every digit `0-9` is also a valid hex character, so a
  3-8 digit issue number immediately after `#` is indistinguishable from a
  CSS hex color literal (`#316` reads as valid 3-digit hex shorthand) and
  will fail `verify:release`'s compliance gate. In those files, write
  `issue NNN` (no `#`) instead. `.md` files are never scanned by this rule
  and may always use bare `#NNN`.
- **JSDoc.** Every symbol re-exported from a package's public entry point
  (`index.ts`, `client.ts`, `server.ts`) — components, hooks, and exported
  utility functions — must carry a JSDoc comment explaining what it does and
  when to use it (one paragraph is enough; see `GdsBreadcrumbs.tsx` or
  `GdsDensity.tsx` for the target style). Internal helpers, `.test.tsx`
  files, and demo/story code are exempt. This is enforced by
  `eslint-plugin-jsdoc`'s `require-jsdoc` rule, scoped to exported
  declarations only, in `@sovereignsquad/gds-eslint-config`.
- **File-header comments are not required.** This codebase has never
  consistently used them (many long-standing files, e.g. `Typography.tsx`,
  have none) and retrofitting one everywhere would be pure diff churn with
  no functional payoff. Don't add one to a file you're not otherwise
  touching; feel free to add a short one to a file you are touching for
  another reason, if it genuinely helps orient a reader.

## Recommended Commit Scopes

- `foundation` (Changes to tokens, accessibility, Mantine baseline)
- `components` (Changes to component behaviors, responsive layouts)
- `governance` (Changes to adoption rules, review processes)
- `pattern-service` (Changes to reusable cross-project pattern contracts)
- `project-plan` (Changes under the `PROJECTS/` directory)

Examples:

- `foundation: tighten mantine-only token policy`
- `components: clarify destructive modal behavior`
- `governance: update PR checklist requirements`
- `pattern-service: add reusable article shell contract`
- `project-plan: add sso mantine refactor plan`
