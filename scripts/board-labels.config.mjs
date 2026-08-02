// Single source of truth for the GDS issue-board label taxonomy.
//
// The "board" is GitHub Issues filtered by these labels — there is no external
// Projects v2 board. Both the provisioner (`scripts/ensure-board-labels.mjs`,
// `npm run board:labels`) and the auditor (`scripts/audit-issue-board.mjs`,
// `npm run audit:board`) import this file, so the taxonomy, colors, and
// descriptions can never drift between "what we create" and "what we enforce".
//
// To evolve the board, edit these arrays and re-run `npm run board:labels`
// (needs the default `GITHUB_TOKEN` — no special PAT). Keep `PROJECT_BOARD.md`
// in sync with any change (documented, human-readable view of the same set).

/**
 * Workflow columns. Exactly one of these must be on every OPEN issue; a CLOSED
 * issue is "Done" by virtue of being closed, so there is no `status: done`
 * label. Order here is the intended left-to-right board column order.
 */
export const STATUS_LABELS = [
  { name: 'status: backlog', color: 'c5def5', description: 'Captured and scoped, not yet scheduled' },
  { name: 'status: ready', color: '1d76db', description: 'Scoped and ready to be picked up' },
  { name: 'status: in progress', color: 'fbca04', description: 'Actively being worked on' },
  { name: 'status: in review', color: 'a371f7', description: 'Implementation complete; PR open / under review' },
  { name: 'status: blocked', color: 'b60205', description: 'Waiting on a dependency or decision' },
];

/** Relative urgency. Optional, at most one per issue. */
export const PRIORITY_LABELS = [
  { name: 'priority: p0', color: 'd93f0b', description: 'Urgent — do next' },
  { name: 'priority: p1', color: 'e99695', description: 'Important' },
  { name: 'priority: p2', color: 'fef2c0', description: 'Nice to have / later' },
];

/** Subsystem an issue touches. Optional, may have more than one. Extend freely. */
export const AREA_LABELS = [
  { name: 'area: kanban', color: '5319e7', description: 'KanbanBoard / KanbanColumn / KanbanCard' },
  { name: 'area: theme', color: '0052cc', description: 'gds-theme tokens, presets, styles' },
  { name: 'area: forms', color: '006b75', description: 'GdsSchemaForm and form primitives' },
  { name: 'area: admin', color: '0e8a16', description: 'gds-admin templates and screens' },
  { name: 'area: docs', color: '0075ca', description: 'Documentation and SSOT governance' },
  { name: 'area: tooling', color: 'bfdadc', description: 'Build, release, CI, and verification scripts' },
  { name: 'area: a11y', color: 'd4c5f9', description: 'Accessibility behavior and evidence' },
  { name: 'area: onboarding', color: 'c2e0c6', description: 'Guided tours, coach-marks, and first-run onboarding' },
];

/** Every governed board label, in a stable order. */
export const ALL_BOARD_LABELS = [...STATUS_LABELS, ...PRIORITY_LABELS, ...AREA_LABELS];

/** Canonical status label names (the valid board columns for open issues). */
export const STATUS_LABEL_NAMES = STATUS_LABELS.map((label) => label.name);

/** Repository coordinates (overridable for forks/testing). */
export const OWNER = process.env.GDS_PROJECT_OWNER ?? 'sovereignsquad';
export const REPO = process.env.GDS_PROJECT_REPO ?? 'general-design-system';
