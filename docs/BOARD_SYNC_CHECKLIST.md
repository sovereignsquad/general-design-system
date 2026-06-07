# Board Sync Checklist

Status: Active
Last updated: 2026-06-07

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
- `#272` i18n Quality: Full-copy routes must not render mixed-language overview UI

GitHub project-board mutation completed on 2026-06-07:

- Project items for issues `#240` through `#246` and `#272` were set to Status `Done`.
- Issue `#272` was added to milestone `GDS 3.4.0 - Product delivery maturity`.
- Targeted verification confirmed project item `PVTI_lADOEEuBB84BYuSMzgu9mfc` maps to closed issue `#272` with Status `Done`.
- Full `npm run audit:board:strict` should be rerun after GitHub project-query rate limits recover; the targeted mutation is complete, but the full-board audit was blocked by GitHub API rate limiting during verification.

Repository project-board target:

- Organization: `sovereignsquad`
- Repository: `sovereignsquad/general-design-system`
- Project: `{GDS} - From IDEA to LIVE`
- Project number: `11`
- Status field: `Status`
- Target Status option: `Done`
- 3.4.x issue set: `#240`, `#241`, `#242`, `#243`, `#244`, `#245`, `#246`, `#272`

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

## 8. HVB Backlog Board Handover

Use this handover for the 25 high-value-benefit implementation issues that were created from the GDS industry comparison and remain open for future delivery.

Current issue state:

- Open repository issues: `#247` through `#271`
- P0 issues: `#247`, `#248`, `#249`, `#250`, `#251`, `#254`, `#255`, `#256`, `#257`, `#258`, `#259`, `#260`, `#261`, `#262`, `#263`, `#264`, `#266`, `#267`, `#268`, `#269`, `#270`, `#271`
- P1 issues: `#252`, `#253`, `#265`
- Milestone: `GDS 3.4.0 - Product delivery maturity`

Required project-board mutation:

- Add issues `#247` through `#271` to project `{GDS} - From IDEA to LIVE` (`sovereignsquad#11`) if missing.
- Set P0 issues to Status `Backlog (SOONER)`.
- Set P1 issues to Status `Roadmap (LATER)`.
- Run `npm run audit:board:strict` after mutation.

Current blocker:

- Partial sync completed before the GitHub GraphQL limit was exhausted again: `#247` through `#256` were added/updated.
- Remaining HVB issues to sync after reset: `#257` through `#271`.
- GitHub GraphQL project-board API returned `API rate limit exceeded for user ID 2206999`.
- Latest observed GraphQL reset: `2026-06-07T14:55:28Z` (`2026-06-07 16:55:28 CEST`).
- REST issue reads still work, but project-board reads/writes are blocked until GraphQL capacity resets.

Later board update procedure:

```bash
gh api rate_limit
# continue only when resources.graphql.remaining is comfortably above 50

npm run board:sync-hvb
```

Expected board audit after the later update:

```text
open issues: 25
state/status mismatches: 0
```
