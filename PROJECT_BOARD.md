# Project Board

Status: Active
Last updated: 2026-07-25

The GDS project board is **GitHub Issues filtered by labels** — not an external
Projects v2 board. This is a deliberate simplification: every board operation
(create a card, move a column, set priority) is just adding or changing a label,
which the default `GITHUB_TOKEN` and the standard issue tools can do. There is no
org-level Projects v2 board, no `GDS_PROJECT_TOKEN` PAT, and no GraphQL project
API in the loop.

The label taxonomy is defined once in
[`scripts/board-labels.config.mjs`](scripts/board-labels.config.mjs) and enforced
by `npm run audit:board`. This document is the human-readable view of that same
source of truth; keep the two in sync.

## Columns — `status:` labels

Every **open** issue carries exactly one status label; that label is its column.
A **closed** issue is "Done" by virtue of being closed, so there is no
`status: done` label.

| Column | Label | Meaning |
| --- | --- | --- |
| Backlog | `status: backlog` | Captured and scoped, not yet scheduled |
| Ready | `status: ready` | Scoped and ready to be picked up |
| In progress | `status: in progress` | Actively being worked on |
| In review | `status: in review` | Implementation complete; PR open / under review |
| Blocked | `status: blocked` | Waiting on a dependency or decision |
| Done | *(issue closed)* | Delivered; closing the issue is the "move to Done" |

Moving a card between columns = swapping its `status:` label. Finishing a card =
closing the issue (which also strips its status label at release time via
`npm run board:sync-release`).

## Priority — `priority:` labels

Optional, at most one per issue: `priority: p0` (urgent — do next),
`priority: p1` (important), `priority: p2` (nice to have / later).

## Area — `area:` labels

Optional, one or more per issue, to group work by subsystem:
`area: kanban`, `area: theme`, `area: forms`, `area: admin`, `area: docs`,
`area: tooling`, `area: a11y`, `area: onboarding`. Extend the set by editing the
config and running `npm run board:labels`.

## Type labels

The existing repository type labels remain in use: `bug`, `enhancement`,
`documentation`, `housekeeping`.

## Board views (saved searches)

The board "columns" are just issue searches. Open these, or bookmark them:

- **In progress** — `is:issue is:open label:"status: in progress"`
- **Ready** — `is:issue is:open label:"status: ready"`
- **Backlog** — `is:issue is:open label:"status: backlog"`
- **Blocked** — `is:issue is:open label:"status: blocked"`
- **P0, open** — `is:issue is:open label:"priority: p0"`
- **Kanban area** — `is:issue is:open label:"area: kanban"`

URL form (replace the query, keeping it URL-encoded):
`https://github.com/sovereignsquad/general-design-system/issues?q=is%3Aissue+is%3Aopen+label%3A%22status%3A+in+progress%22`

## Tooling

| Command | What it does | Auth |
| --- | --- | --- |
| `npm run board:labels` | Idempotently provisions the label taxonomy (colors + descriptions) from the config SSOT | default `GITHUB_TOKEN` (`issues: write`) |
| `npm run audit:board` | Reports each open issue's column; **warns and skips** if `gh` is unavailable | default `GITHUB_TOKEN` (`issues: read`) |
| `npm run audit:board:strict` | Same audit, **fails hard** on any open issue missing/duplicating a status label — used for release sign-off | default `GITHUB_TOKEN` |
| `npm run board:sync-release` | Closes each `GDS_RELEASE_DELIVERED_ISSUES` issue ("Done") and strips its status label | default `GITHUB_TOKEN` (`issues: write`) |

CI keeps the board consistent via
[`.github/workflows/board-sync.yml`](.github/workflows/board-sync.yml), which
provisions labels and runs the strict audit after each release (and on changes
to the board tooling) using the ambient `GITHUB_TOKEN` — no secret required.

`npm run audit:board` is part of `npm run verify:release`; it is non-strict there
so a missing `gh`/token never blocks a release.

## Repository hygiene

Only reusable GDS work belongs on this board — components, patterns, docs,
compliance, migration, release, or package tooling. Product-specific requests
must be transferred to the owning product's repository or closed with a comment
naming the owner. Promote a request to a GitHub issue only when it can become a
reusable GDS contract with accessibility, tests, documentation, and migration
value.

## History

This board replaced an org-level Projects v2 board (project #11) whose writes
required a `GDS_PROJECT_TOKEN` PAT that the default CI token could not stand in
for, no MCP/tooling path could reach, and which therefore drifted. The retired
approach and its 3.4.x board handovers are preserved for reference in
[`docs/BOARD_SYNC_CHECKLIST.md`](docs/BOARD_SYNC_CHECKLIST.md).
