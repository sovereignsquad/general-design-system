import { execSync } from 'node:child_process';

const PROJECT_NUMBER = process.env.GDS_PROJECT_NUMBER ?? '11';
const OWNER = process.env.GDS_PROJECT_OWNER ?? 'sovereignsquad';

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseJson(command) {
  const output = run(command);
  return JSON.parse(output);
}

function main() {
  let projectData;
  try {
    projectData = parseJson(`gh project item-list ${PROJECT_NUMBER} --owner ${OWNER} --limit 300 --format json`);
  } catch (error) {
    console.error('Board audit failed: unable to fetch project items.');
    console.error('Tip: ensure gh auth is active and API rate limit is available.');
    process.exit(1);
  }

  const items = projectData.items ?? [];
  const issueItems = items.filter((item) => Number.isInteger(item?.content?.number));
  const byIssue = new Map(issueItems.map((item) => [item.content.number, item]));

  const results = [];
  for (const issueNumber of [...byIssue.keys()].sort((a, b) => a - b)) {
    let state = 'UNKNOWN';
    try {
      state = run(`gh issue view ${issueNumber} --json state --jq .state`);
    } catch {
      state = 'ERROR';
    }

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
