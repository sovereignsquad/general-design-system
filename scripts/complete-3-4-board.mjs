import { execFileSync } from 'node:child_process';

const OWNER = 'sovereignsquad';
const REPO = 'general-design-system';
const PROJECT_NUMBER = '11';
const PROJECT_ID = 'PVT_kwDOEEuBB84BYuSM';
const STATUS_FIELD_ID = 'PVTSSF_lADOEEuBB84BYuSMzhTyAgE';
const DONE_OPTION_ID = '98236657';
const ISSUE_NUMBERS = [240, 241, 242, 243, 244, 245, 246];

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseJson(args) {
  return JSON.parse(gh(args));
}

function assertGraphqlCapacity() {
  const rateLimit = parseJson(['api', 'rate_limit']);
  const remaining = rateLimit.resources?.graphql?.remaining ?? 0;
  const reset = rateLimit.resources?.graphql?.reset;

  if (remaining <= 0) {
    const resetDate = reset ? new Date(reset * 1000).toISOString() : 'unknown';
    throw new Error(`GitHub GraphQL rate limit is exhausted. Retry after ${resetDate}.`);
  }
}

function findProjectItem(issueNumber, items) {
  return items.find((item) => item.content?.number === issueNumber);
}

function main() {
  assertGraphqlCapacity();

  const itemList = parseJson(['project', 'item-list', PROJECT_NUMBER, '--owner', OWNER, '--limit', '300', '--format', 'json']);
  const items = itemList.items ?? [];
  const missing = [];

  for (const issueNumber of ISSUE_NUMBERS) {
    const issueUrl = `https://github.com/${OWNER}/${REPO}/issues/${issueNumber}`;
    let item = findProjectItem(issueNumber, items);

    if (!item) {
      gh(['project', 'item-add', PROJECT_NUMBER, '--owner', OWNER, '--url', issueUrl]);
      const refreshed = parseJson(['project', 'item-list', PROJECT_NUMBER, '--owner', OWNER, '--limit', '300', '--format', 'json']);
      item = findProjectItem(issueNumber, refreshed.items ?? []);
    }

    if (!item?.id) {
      missing.push(issueNumber);
      continue;
    }

    gh([
      'project',
      'item-edit',
      '--id',
      item.id,
      '--project-id',
      PROJECT_ID,
      '--field-id',
      STATUS_FIELD_ID,
      '--single-select-option-id',
      DONE_OPTION_ID,
    ]);

    console.log(`#${issueNumber} -> Done`);
  }

  if (missing.length) {
    throw new Error(`Could not resolve project item ids for issues: ${missing.map((issue) => `#${issue}`).join(', ')}`);
  }

  console.log('GDS 3.4.0 board status normalization completed.');
}

main();
