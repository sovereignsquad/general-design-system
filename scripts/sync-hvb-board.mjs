import { execFileSync } from 'node:child_process';

const OWNER = 'sovereignsquad';
const REPO = 'general-design-system';
const PROJECT_NUMBER = '11';
const PROJECT_ID = 'PVT_kwDOEEuBB84BYuSM';
const STATUS_FIELD_ID = 'PVTSSF_lADOEEuBB84BYuSMzhTyAgE';
const BACKLOG_OPTION_ID = '1a174b4f';
const ROADMAP_OPTION_ID = '92255da5';

const ISSUE_STATUS = new Map([
  [247, BACKLOG_OPTION_ID],
  [248, BACKLOG_OPTION_ID],
  [249, BACKLOG_OPTION_ID],
  [250, BACKLOG_OPTION_ID],
  [251, BACKLOG_OPTION_ID],
  [252, ROADMAP_OPTION_ID],
  [253, ROADMAP_OPTION_ID],
  [254, BACKLOG_OPTION_ID],
  [255, BACKLOG_OPTION_ID],
  [256, BACKLOG_OPTION_ID],
  [257, BACKLOG_OPTION_ID],
  [258, BACKLOG_OPTION_ID],
  [259, BACKLOG_OPTION_ID],
  [260, BACKLOG_OPTION_ID],
  [261, BACKLOG_OPTION_ID],
  [262, BACKLOG_OPTION_ID],
  [263, BACKLOG_OPTION_ID],
  [264, BACKLOG_OPTION_ID],
  [265, ROADMAP_OPTION_ID],
  [266, BACKLOG_OPTION_ID],
  [267, BACKLOG_OPTION_ID],
  [268, BACKLOG_OPTION_ID],
  [269, BACKLOG_OPTION_ID],
  [270, BACKLOG_OPTION_ID],
  [271, BACKLOG_OPTION_ID],
]);

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

  if (remaining < ISSUE_STATUS.size * 2) {
    const resetDate = reset ? new Date(reset * 1000).toISOString() : 'unknown';
    throw new Error(`GitHub GraphQL capacity is too low for HVB board sync. Remaining: ${remaining}. Retry after ${resetDate}.`);
  }
}

function listProjectItems() {
  return parseJson(['project', 'item-list', PROJECT_NUMBER, '--owner', OWNER, '--limit', '300', '--format', 'json']).items ?? [];
}

function findProjectItem(issueNumber, items) {
  return items.find((item) => item.content?.number === issueNumber);
}

function statusName(optionId) {
  return optionId === ROADMAP_OPTION_ID ? 'Roadmap (LATER)' : 'Backlog (SOONER)';
}

function main() {
  assertGraphqlCapacity();

  let items = listProjectItems();

  for (const [issueNumber, statusOptionId] of ISSUE_STATUS) {
    const issueUrl = `https://github.com/${OWNER}/${REPO}/issues/${issueNumber}`;
    let item = findProjectItem(issueNumber, items);

    if (!item) {
      gh(['project', 'item-add', PROJECT_NUMBER, '--owner', OWNER, '--url', issueUrl]);
      items = listProjectItems();
      item = findProjectItem(issueNumber, items);
    }

    if (!item?.id) {
      throw new Error(`Could not resolve project item id for #${issueNumber}`);
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
      statusOptionId,
    ]);

    console.log(`#${issueNumber} -> ${statusName(statusOptionId)}`);
  }

  console.log('HVB board sync completed for issues #247 through #271.');
}

main();
