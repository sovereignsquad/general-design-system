# GitHub Handover (Pending Actions)

Status: Pending GitHub follow-up  
Last updated: 2026-05-31

## Context

During final board verification, GitHub API rate limiting interrupted the post-close normalization sweep.

Completed already:

- Closed issues: `#154`, `#155`, `#156`, `#158`, `#159`, `#160`, `#174`, `#177`, `#179`
- Earlier normalization: `#178` moved to `Done`, `#175` closed as duplicate/superseded
- Earlier consistency closes: `#157`, `#169`, `#170`, `#171`, `#172`, `#173`

## Required GitHub follow-up

1. Re-run board normalization audit once API quota resets.
2. Ensure all closed issues on project `11` have project status `Done`.
3. Ensure no open issues are marked `Done`.
4. If any mismatches remain, patch them with `gh project item-edit`.
5. Post one board-sync confirmation comment on the latest governance/meta issue.

## Exact commands

Project id:

```bash
gh project list --owner sovereignsquad
```

Run automated audit script:

```bash
npm run audit:board
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
