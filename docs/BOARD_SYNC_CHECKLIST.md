# Board Sync Checklist

Status: Active
Last updated: 2026-08-06

The GDS project board is **GitHub Issues filtered by `status:` labels** — see
[`PROJECT_BOARD.md`](../PROJECT_BOARD.md) for the taxonomy and tooling. There is
no external Projects v2 board. Use this checklist before release, after major
implementation waves, and before closing canonical issues.

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
npm run board:labels
npm run audit:board:strict
npm run verify:references
npm run verify:release
```
- Confirm no skipped checks and no local-only bypass.

## 5. Issue Board Hygiene

- Every **open** issue carries exactly one `status:` label (its board column); `npm run audit:board:strict` fails if not.
- A **closed** issue is Done — there is no `status: done` label. At release, `npm run board:sync-release` closes delivered issues and strips their status labels.
- Set a `priority:` label (`p0`/`p1`/`p2`) and one or more `area:` labels so the board is filterable.
- For each changed issue state, add a short closure/update comment with evidence paths.
- Keep canonical work on one issue number per scope; avoid parallel duplicates.
- Keep unrelated product work out of this repository and issue board. Product-specific backlog must be transferred or closed with a comment that names the owning product/repo.
- Promote feature requests only when the request describes a reusable GDS component, pattern, compliance rule, documentation gap, or migration/tooling need.
- Reject or transfer requests that are one-off product screens, private business logic, sensitive customer data, or implementation tasks that cannot become a reusable GDS contract.
- Board reads/writes use only the default `GITHUB_TOKEN` (`issues: read`/`write`); no PAT is required.

## 6. Evidence Standard for Closure

Each closure comment should include:

- implemented file paths
- verifier/test path
- command or gate proving integrity (`verify:references` or `verify:release`)

## 7. Historical — retired Projects v2 board (project #11)

Before the label-based board, GDS tracked issues on an org-level Projects v2
board, `{GDS} - From IDEA to LIVE` (`sovereignsquad#11`), with a `Status` field
and a `Done` option. Writing that board required a `GDS_PROJECT_TOKEN` PAT with
`project` scope — the default `GITHUB_TOKEN` could not perform org-level
Projects v2 writes, no repo tooling/MCP path could reach it, and it drifted after
each release. It was retired in favor of the label board (see issue #431 and its
successor). The former board-sync scripts (`board:complete-3.4`, `board:sync-hvb`,
`audit-project-board.mjs`) and their GraphQL rate-limit handling were removed.

**2026-08-06 addendum:** the board itself still exists and was given a passive,
read-only mirror by enabling two of Projects v2's own **built-in** workflow
rules (`Auto-add to project` and `Item closed`) directly in the board's UI —
no PAT, no custom Action, no repo tooling change, so none of the retirement
reasoning above is reversed. This gives a coarse open/`Todo (NEXT)` vs.
`Done` view only; see [`PROJECT_BOARD.md`](../PROJECT_BOARD.md#coarse-read-only-mirror-on-the-retired-projects-v2-board-project-11)
for the full mapping table and why finer-grained sync was deliberately not
pursued.

The 3.4.x delivery records below are preserved for historical traceability only;
their `gh project ...` / `npm run board:*` commands no longer exist.

### 3.4.0 release (delivered)

- Commit `87b2dea`; tag `gds-v3.4.0`; all six public packages verified at `3.4.0`.
- Issues delivered and closed with release evidence: `#240`–`#246` and `#272`.
- These were set to Projects v2 Status `Done` on 2026-06-07 (mechanism now retired).

### HVB backlog (created for future delivery)

- 25 high-value-benefit issues `#247`–`#271` were opened from the GDS industry comparison.
- P0: `#247`–`#251`, `#254`–`#264`, `#266`–`#271`; P1: `#252`, `#253`, `#265`.
- Milestone: `GDS 3.4.0 - Product delivery maturity`.
- Any still open should now carry a `status:` label and, where useful, `priority: p0`/`p1` on the label board.
