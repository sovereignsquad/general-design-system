import { execSync } from 'node:child_process';

const PROJECT_NUMBER = process.env.GDS_PROJECT_NUMBER ?? '11';
const OWNER = process.env.GDS_PROJECT_OWNER ?? 'sovereignsquad';
const REPOSITORY = process.env.GDS_PROJECT_REPO ?? 'general-design-system';

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isRateLimitError(error) {
  const stderr = String(error?.stderr ?? '');
  const message = String(error?.message ?? '');
  return stderr.includes('API rate limit exceeded') ||
    message.includes('API rate limit exceeded') ||
    stderr.includes('rate limit') ||
    message.includes('rate limit');
}

function runWithRetry(command, retries = 3) {
  let attempt = 0;
  // Simple bounded retry for transient GitHub API limits.
  while (true) {
    try {
      return run(command);
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= retries) {
        throw error;
      }
      const waitMs = 2000 * (attempt + 1);
      console.warn(`GitHub API rate limit hit. Retrying in ${waitMs}ms...`);
      sleep(waitMs);
      attempt += 1;
    }
  }
}

function parseJson(command, retries = 3) {
  const output = runWithRetry(command, retries);
  return JSON.parse(output);
}

function warnAndExitNonStrict(message) {
  console.warn('Board audit warning: GitHub board data could not be fetched.');
  console.warn(message.slice(0, 500));
  console.warn('Skipping non-strict board audit for this run.');
  console.warn('Use `npm run audit:board:strict` or `GDS_BOARD_AUDIT_STRICT=1 npm run audit:board` to fail hard.');
  process.exit(0);
}

function main() {
  let projectData;
  let issueList;
  const strictMode = process.env.GDS_BOARD_AUDIT_STRICT === '1';
  try {
    projectData = parseJson(`gh project item-list ${PROJECT_NUMBER} --owner ${OWNER} --limit 300 --format json`);
    issueList = parseJson(`gh issue list --repo ${OWNER}/${REPOSITORY} --state all --limit 500 --json number,state`);
  } catch (error) {
    const message = String(error?.stderr ?? error?.message ?? error);
    if (!strictMode) {
      warnAndExitNonStrict(message);
    }
    console.error('Board audit failed: unable to fetch required GitHub data.');
    console.error('Tip: ensure gh auth is active and API rate limit is available.');
    process.exit(1);
  }

  const items = projectData.items ?? [];
  const issueItems = items.filter((item) => Number.isInteger(item?.content?.number));
  const byIssue = new Map(issueItems.map((item) => [item.content.number, item]));
  const stateByIssue = new Map((issueList ?? []).map((issue) => [issue.number, issue.state]));

  const results = [];
  for (const issueNumber of [...byIssue.keys()].sort((a, b) => a - b)) {
    const state = stateByIssue.get(issueNumber) ?? 'UNKNOWN';
    const status = byIssue.get(issueNumber)?.status ?? 'UNKNOWN';
    const title = byIssue.get(issueNumber)?.content?.title ?? '';
    results.push({ issueNumber, state, status, title });
  }

  const mismatches = results.filter((row) =>
    (row.state === 'CLOSED' && row.status !== 'Done') ||
    (row.state === 'OPEN' && row.status === 'Done'),
  );

  const openItems = results.filter((row) => row.state === 'OPEN');

  console.log(`project: ${OWNER}#${PROJECT_NUMBER}`);
  console.log(`tracked issue items: ${results.length}`);
  console.log(`open issues: ${openItems.length}`);
  console.log(`state/status mismatches: ${mismatches.length}`);

  if (openItems.length > 0) {
    console.log('\nOpen issues:');
    for (const item of openItems) {
      console.log(`#${item.issueNumber} | ${item.status} | ${item.title}`);
    }
  }

  if (mismatches.length > 0) {
    console.log('\nMismatches:');
    for (const item of mismatches) {
      console.log(`#${item.issueNumber} | ${item.state} | ${item.status} | ${item.title}`);
    }
    process.exit(2);
  }
}

main();
