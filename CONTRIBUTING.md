# Contributing

Status: Active
Version: 3.4.3
Last updated: 2026-06-06

This repository is shared design-system infrastructure.

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
