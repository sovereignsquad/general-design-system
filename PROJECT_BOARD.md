# Project Board

Status: Active
Last updated: 2026-08-06

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

## Coarse read-only mirror on the retired Projects v2 board (project #11)

Project #11 (`{GDS} - From IDEA to LIVE`, `https://github.com/orgs/sovereignsquad/projects/11`)
still exists and has **not** been reconnected via a PAT or a custom GitHub
Action — that would reintroduce the exact write-access mechanism it was
retired over. What it does have, confirmed directly in the board's own
**Workflows** panel, is two of Projects v2's **built-in** rules already
enabled, which need no PAT and no repo tooling at all:

| Built-in rule | Effect | Status |
| --- | --- | --- |
| `Auto-add to project` + `Item added to project` | New repo issues/PRs are added to the board with Status `Todo (NEXT)` | **Live** |
| `Item closed` | Closing an issue sets Status to `Done` | **Live** |

There is **no built-in "label changed → set field" trigger** in Projects v2
Workflows (confirmed against the board's full trigger list: `Auto-add
sub-issues to project`, `Auto-close issue`, `Item added to project`, `Item
closed`, `Pull request linked to issue`, `Pull request merged`, `Auto-add to
project`, `Auto-archive items`, `Code changes requested`, `Code review
approved`, `Item reopened` — none of them fire on a label event). So **while
an issue is open, its board position never reflects its actual `status:`
label** — every open issue sits at `Todo (NEXT)` regardless of whether it's
`backlog`, `ready`, `in progress`, `in review`, or `blocked`, and only jumps
to `Done` on close. The board is therefore only a coarse, two-state (open vs.
done) secondary mirror — **the Issues tab filtered by `status:` labels
remains the sole authoritative live source**, exactly as described above.

The full `status:` label → board `Status` field mapping was decided for
reference (in case anyone chooses to drag cards manually, or revisits the
custom-Action option later), even though only the last row is actually live:

| Repo label | Board `Status` | Live? |
| --- | --- | --- |
| `status: backlog` | `Backlog (SOONER)` | manual only |
| `status: ready` | `Todo (NEXT)` | manual only (coincides with the auto "new item" default) |
| `status: in progress` | `In Progress (NOW)` | manual only |
| `status: in review` | `Review (ALMOST)` | manual only |
| `status: blocked` | `Roadmap (LATER)` | manual only — **owner's explicit choice**; this dual-purposes the board's "someday roadmap" column as "blocked," so a `Roadmap (LATER)` card there is not necessarily an actual roadmap idea |
| *(issue closed)* | `Done` | **live** |

`IDEABANK (SOMEDAY)` and `Declined (NEVER)` are intentionally left with no
label mapping.
