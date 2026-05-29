# General Design System Reference Site

The `playground` app is the canonical public website for General Design System documentation, patterns, and live demonstration. It is intentionally built as a strict GDS consumer and is the visual proof that the contracts in this repository can be consumed directly.

## What this site publishes

- `https://sovereignsquad.github.io/general-design-system/` — overview and positioning
- `/install` — install and verification playbook
- `/governance` — rules for GDS adoption and local exceptions
- `/themes` — theme explorer and lane comparison (legacy `/tokens`)
- `/patterns` — pattern catalog and family routes
- `/live-demos` and family routes for shipped runtime proofs
- `/request-feature` — canonical request intake for new primitives or policy updates

Every major section uses package-owned primitives from `@doneisbetter/gds`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`.

## Local runbook

Prerequisites:
- Node.js 22+
- npm workspace install completed at repo root

```bash
npm install
npm run dev   # serves apps/playground from /general-design-system/
```

The site is built and validated as part of the repository release checks:

```bash
npm run verify:release
```

## Route validation

The shell, menus, and route contracts are enforced by route tests in `src/site-routes.test.ts` and by the reference consumer contract checks in `scripts/verify-reference-consumers.mjs`.

## Why this app exists

This is not a secondary docs sandbox.

- No local shell or card authority is allowed when a canonical GDS surface already exists.
- Every visible contract must map to the markdown SSOT (`COMPONENTS_AND_PATTERNS.md`) and package-export boundaries.
- The page content is expected to remain the reference quality bar for product adoptions.

## Client rollout artifact

Use [CLIENT_UPGRADE_PROMPT.md](/Users/Shared/Projects/general-design-system/CLIENT_UPGRADE_PROMPT.md) as the standard customer-facing message when asking teams to migrate.

## Deployment

GitHub Pages deployment is handled by workflow `/.github/workflows/deploy-pages.yml` and uses an SPA fallback.
