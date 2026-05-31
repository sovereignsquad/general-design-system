# Board Sync Checklist

Status: Active
Last updated: 2026-05-31

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
npm run audit:board
npm run verify:references
npm run verify:release
```
- Confirm no skipped checks and no local-only bypass.

## 5. Project Board Hygiene

- Use `gh project item-list 11 --owner sovereignsquad --limit 200` to inspect current board items.
- For each changed issue state, add a short closure/update comment with evidence paths.
- Keep canonical work on one issue number per scope; avoid parallel duplicates.

## 6. Evidence Standard for Closure

Each closure comment should include:

- implemented file paths
- verifier/test path
- command or gate proving integrity (`verify:references` or `verify:release`)
