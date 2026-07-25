// Release-time issue-board sync for the label-based board (see PROJECT_BOARD.md).
//
// In the label model "Done" == closed, so releasing an issue means closing it.
// Given a comma-separated GDS_RELEASE_DELIVERED_ISSUES list, this:
//   1. closes each still-open delivered issue with a "Delivered in <version>"
//      comment, and
//   2. strips any `status:` label from it, so no closed issue lingers in a
//      board column.
//
// Uses the GitHub CLI authenticated by the ambient GITHUB_TOKEN — closing
// issues and editing labels needs only default `issues: write`, NOT a Projects
// v2 PAT. This replaces the retired Projects v2 board sync (previously required
// the `GDS_PROJECT_TOKEN` secret, which the default token could not stand in
// for).
//
// Idempotent: already-closed issues are skipped. Non-strict: if `gh` is
// unavailable it warns and exits 0 rather than failing a release.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OWNER, REPO, STATUS_LABEL_NAMES } from './board-labels.config.mjs';

const dryRun = process.env.GDS_RELEASE_BOARD_DRY_RUN === '1';
const version = process.env.GDS_RELEASE_VERSION ?? readFileSync(resolve(process.cwd(), 'VERSION'), 'utf8').trim();
const deliveredIssues = (process.env.GDS_RELEASE_DELIVERED_ISSUES ?? '')
  .split(',')
  .map((value) => Number.parseInt(value.trim().replace(/^#/, ''), 10))
  .filter(Number.isInteger);

function gh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function warnAndSkip(message) {
  console.warn('Release board sync skipped: GitHub CLI is unavailable or unauthenticated.');
  console.warn(String(message).slice(0, 500));
  process.exit(0);
}

function syncIssue(issueNumber) {
  const issue = JSON.parse(gh(['issue', 'view', String(issueNumber), '--repo', `${OWNER}/${REPO}`, '--json', 'state,labels']));
  if (issue.state === 'CLOSED') {
    console.log(`#${issueNumber} already closed`);
    return;
  }

  const statusLabels = (issue.labels ?? []).map((label) => label.name).filter((name) => STATUS_LABEL_NAMES.includes(name));

  if (dryRun) {
    console.log(`[dry-run] would close #${issueNumber} and remove ${statusLabels.length} status label(s)`);
    return;
  }

  for (const label of statusLabels) {
    gh(['issue', 'edit', String(issueNumber), '--repo', `${OWNER}/${REPO}`, '--remove-label', label]);
  }

  gh([
    'issue',
    'close',
    String(issueNumber),
    '--repo',
    `${OWNER}/${REPO}`,
    '--comment',
    `Delivered in GDS ${version}. Closing marks this Done on the issue board.`,
  ]);
  console.log(`#${issueNumber} closed for GDS ${version} (removed ${statusLabels.length} status label(s))`);
}

function main() {
  if (deliveredIssues.length === 0) {
    console.log('No delivered issues supplied (GDS_RELEASE_DELIVERED_ISSUES is empty); nothing to sync.');
    return;
  }

  try {
    gh(['auth', 'status']);
  } catch (error) {
    warnAndSkip(error?.stderr ?? error?.message ?? error);
    return;
  }

  for (const issueNumber of deliveredIssues) {
    syncIssue(issueNumber);
  }

  console.log(`Release board sync processed ${deliveredIssues.length} delivered issue(s) for GDS ${version}.`);
}

main();
