# Board Sync Checklist

Status: Active
Last updated: 2026-06-06

Use this checklist before release, after major implementation waves, and before closing canonical project-board issues.

## 1. Implementation vs Issue State

- Verify each closed issue has code evidence in `packages/*`, `apps/*`, `scripts/*`, or tests.
- Verify each open issue is actually not yet fully delivered.
- Close duplicates explicitly with a cross-reference comment.
- If an issue is superseded, close it and point to the canonical successor issue.

## 2. Docs vs Implementation

- Verify `README.md`, `INSTALLATION_GUIDE.md`, and SSOT docs reflect the current enforced contracts.
- Remove or downgrade wording that implies canonical status for legacy/compatibility surfaces.
- Verify route and feature claims match what is implemented in `apps/playground`.

## 3. Governance Contracts

- Ensure `apps/playground/gds-adoption.json` is up to date:
- `requiredContracts`
- `approved*Primitives`
- `approvedThemeLanes`
- `themeOwnershipPaths`
- `localizedRouteCoverage`
- `lastReviewedAt`

## 4. Verification Gates

- Run:
```bash
npm run audit:board:strict
npm run audit:board
npm run verify:references
npm run verify:release
```
- Confirm no skipped checks and no local-only bypass.

## 5. Project Board Hygiene

- Use `npm run audit:board:strict` as the canonical board safety check before relying on project-board status.
- Use `gh project item-list 11 --owner sovereignsquad --limit 200` only for manual inspection or targeted repair.
- For each changed issue state, add a short closure/update comment with evidence paths.
- Keep canonical work on one issue number per scope; avoid parallel duplicates.
- Keep unrelated product work out of this repository and project board. Product-specific backlog must be transferred or closed with a comment that names the owning product/repo.
- Promote feature requests only when the request describes a reusable GDS component, pattern, compliance rule, documentation gap, or migration/tooling need.
- Reject or transfer requests that are one-off product screens, private business logic, sensitive customer data, or implementation tasks that cannot become a reusable GDS contract.

## 6. Evidence Standard for Closure

Each closure comment should include:

- implemented file paths
- verifier/test path
- command or gate proving integrity (`verify:references` or `verify:release`)

## 7. GDS 3.4.0 Board Handover

Use this handover when GitHub GraphQL rate limiting prevents immediate project-board mutation after the `3.4.0` release.

Delivered release evidence:

- Commit: `87b2dea`
- Handover continuation commits: `42fa0c1`, `2549073`, `a2d4247`
- Tag: `gds-v3.4.0`
- Release: `https://github.com/sovereignsquad/general-design-system/releases/tag/gds-v3.4.0`
- npm publication: all six public packages verified at `3.4.0`
- Verification passed: `npm run verify:release`
- Registry verification passed: `npm run verify:published`

Issues created from the issue #81 production-grade standard and closed with release evidence:

- `#240` Admin Delivery: Data tables, resource managers, and form orchestration - production contracts
- `#241` Runtime Feedback: Confirmation, toast, modal, drawer, and command surfaces - unified API
- `#242` Foundation Surfaces: Layout primitives, safe styling, and icon registry - governed composition API
- `#243` Global Readiness: i18n runtime and accessibility evidence - localized product quality API
- `#244` Adoption Governance: Codemods, dashboard, and exception lifecycle - CI-enforced migration API
- `#245` Theme Operations: Token authoring, high contrast, motion, and design handoff - release-safe theming API
- `#246` Product System: Content standards, page templates, and observability - product-owner delivery contract

Pending GitHub project-board mutation if GraphQL is rate-limited:

- Move project items for issues `#240` through `#246` to Status `Done`.
- Keep them in milestone `GDS 3.4.0 - Product delivery maturity`.
- Run `npm run audit:board:strict` after the project-board Status field is updated.
- Expected strict board result after normalization: no open project-board issues for the 3.4.0 delivery set and no state/status mismatches.

Repository project-board target:

- Organization: `sovereignsquad`
- Repository: `sovereignsquad/general-design-system`
- Project: `{GDS} - From IDEA to LIVE`
- Project number: `11`
- Status field: `Status`
- Target Status option: `Done`
- 3.4.0 issue set: `#240`, `#241`, `#242`, `#243`, `#244`, `#245`, `#246`

Later board update procedure:

```bash
gh api rate_limit
# continue only when resources.graphql.remaining is greater than 0

npm run board:complete-3.4
```

Expected board audit after the later update:

```text
state/status mismatches: 0
```

Operational note:

- REST API may still allow issue comments, issue closure, and release creation while GraphQL project-board mutations are blocked.
- Project-board Status updates require GraphQL capacity. If blocked, retry after the reset shown by `gh api rate_limit`.
