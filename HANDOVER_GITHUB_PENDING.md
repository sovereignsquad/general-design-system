# GitHub Handover (Safe Baseline)

Status: Safe baseline established  
Last updated: 2026-05-31

## Context

Earlier board verification was interrupted by GitHub API rate limiting. The follow-up audit has now completed successfully against the canonical GDS project board.

Completed already:

- Closed issues: `#154`, `#155`, `#156`, `#158`, `#159`, `#160`, `#174`, `#177`, `#179`
- Earlier normalization: `#178` moved to `Done`, `#175` closed as duplicate/superseded
- Earlier consistency closes: `#157`, `#169`, `#170`, `#171`, `#172`, `#173`

## Current Verified State

- Repository: `sovereignsquad/general-design-system`
- Branch: `main`
- Verified commit: `16d8ee9`
- Canonical project board: `sovereignsquad#11`
- Tracked project issue items: `71`
- Open project issues: `0`
- Issue state/project status mismatches: `0`
- Latest `GDS Quality` workflow for `main`: passed
- Latest GitHub Pages deployment workflow for `main`: passed
- Published package line: `2.6.7`

## Safe Operating Rule

Only use project board `11` as the canonical GDS delivery board. Do not use repository-wide issue lists as GDS priority input because they can include unrelated product issues.

Before starting another delivery wave, run:

```bash
npm run audit:board:strict
```

Before release or package publication, run:

```bash
npm run verify:release
```

## Exact commands

Project id:

```bash
gh project list --owner sovereignsquad
```

Run automated audit script:

```bash
npm run audit:board
npm run audit:board:strict
```

Manual fallback snapshot:

```bash
gh project item-list 11 --owner sovereignsquad --limit 300 --format json > /tmp/proj11.json
jq -r '.items[] | [.content.number, .status, .content.title] | @tsv' /tmp/proj11.json
```

Normalize one mismatched item example:

```bash
gh project item-edit \
  --id <PROJECT_ITEM_ID> \
  --project-id PVT_kwDOEEuBB84BYuSM \
  --field-id PVTSSF_lADOEEuBB84BYuSMzhTyAgE \
  --single-select-option-id 98236657
```

Where `98236657` = `Done`.

## Exit criteria

- `npm run audit:board` reports:
  - `open issues: 0` (or explicit list if new work was added)
  - `state/status mismatches: 0`
- No closed issue remains in `Declined`, `Todo`, `Backlog`, `Roadmap`, or `In Progress`.
