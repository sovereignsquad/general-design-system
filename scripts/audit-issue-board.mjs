// Audits the GDS issue board — GitHub Issues labeled with the taxonomy in
// scripts/board-labels.config.mjs (see PROJECT_BOARD.md). There is no external
// Projects v2 board; the "board" is the set of open issues grouped by their
// `status:` label.
//
// Rule enforced: every OPEN issue carries exactly one canonical `status:`
// label (its board column). Violations reported:
//   - open issue with no `status:` label       (not on the board)
//   - open issue with more than one status      (ambiguous column)
//   - open issue with a `status:` label that is not in the taxonomy (drift)
//
// A CLOSED issue is "Done" by being closed, so closed issues are not required
// to carry any status label and are not audited here.
//
// Reads issues with the GitHub CLI authenticated by the ambient GITHUB_TOKEN —
// listing issues and their labels needs only default `issues: read`, NOT a
// Projects v2 PAT. This is the simplification over the retired board sync.
//
// Non-strict by default (`npm run audit:board`): if `gh` is unavailable or the
// API can't be reached, it warns and exits 0 so it never blocks a release on a
// missing CLI/token. Strict mode (`npm run audit:board:strict`, or
// GDS_BOARD_AUDIT_STRICT=1) fails hard on an unreachable API or any violation.

import { execFileSync } from 'node:child_process';
import { OWNER, REPO, STATUS_LABEL_NAMES } from './board-labels.config.mjs';

const strict = process.env.GDS_BOARD_AUDIT_STRICT === '1';
const statusSet = new Set(STATUS_LABEL_NAMES);

function gh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function warnAndExitNonStrict(message) {
  console.warn('Issue-board audit warning: GitHub issue data could not be fetched.');
  console.warn(String(message).slice(0, 500));
  console.warn('Skipping non-strict issue-board audit for this run.');
  console.warn('Use `npm run audit:board:strict` (or GDS_BOARD_AUDIT_STRICT=1) to fail hard.');
  process.exit(0);
}

function main() {
  let openIssues;
  try {
    openIssues = JSON.parse(
      gh(['issue', 'list', '--repo', `${OWNER}/${REPO}`, '--state', 'open', '--limit', '1000', '--json', 'number,title,labels']),
    );
  } catch (error) {
    const message = String(error?.stderr ?? error?.message ?? error);
    if (!strict) {
      warnAndExitNonStrict(message);
      return;
    }
    console.error('Issue-board audit failed: unable to fetch GitHub issue data.');
    console.error('Tip: ensure `gh` is authenticated (GITHUB_TOKEN) and the API is reachable.');
    console.error(message.slice(0, 500));
    process.exit(1);
  }

  const rows = openIssues.map((issue) => {
    const labelNames = (issue.labels ?? []).map((label) => label.name);
    const statuses = labelNames.filter((name) => name.startsWith('status:'));
    return { number: issue.number, title: issue.title, statuses };
  });

  const missing = rows.filter((row) => row.statuses.length === 0);
  const ambiguous = rows.filter((row) => row.statuses.length > 1);
  const unknown = rows.filter((row) => row.statuses.some((name) => !statusSet.has(name)));

  console.log(`repo: ${OWNER}/${REPO}`);
  console.log(`open issues: ${rows.length}`);
  console.log('board columns:');
  for (const status of STATUS_LABEL_NAMES) {
    const count = rows.filter((row) => row.statuses.includes(status)).length;
    console.log(`  ${status}: ${count}`);
  }

  const violations = missing.length + ambiguous.length + unknown.length;
  console.log(`violations: ${violations}`);

  if (missing.length > 0) {
    console.log('\nOpen issues with no status label (not on the board):');
    for (const row of missing) console.log(`  #${row.number} | ${row.title}`);
  }
  if (ambiguous.length > 0) {
    console.log('\nOpen issues with more than one status label:');
    for (const row of ambiguous) console.log(`  #${row.number} | ${row.statuses.join(', ')} | ${row.title}`);
  }
  if (unknown.length > 0) {
    console.log('\nOpen issues with an unrecognized status label:');
    for (const row of unknown) console.log(`  #${row.number} | ${row.statuses.join(', ')} | ${row.title}`);
  }

  if (violations > 0 && strict) {
    process.exit(2);
  }
}

main();
