import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const policyPath = resolve(root, 'DEPENDENCY_AUDIT.md');
const policy = readFileSync(policyPath, 'utf8');

// Accepted dev/reference-tooling advisories are the `### GHSA-…` entries under
// "## Accepted Dev / Reference Tooling Advisories" in DEPENDENCY_AUDIT.md, each with a
// `Review date:` line. The document is the only list.
function readAcceptedAdvisories(text) {
  const start = text.indexOf('## Accepted Dev / Reference Tooling Advisories');
  if (start === -1) {
    console.error('DEPENDENCY_AUDIT.md has no "## Accepted Dev / Reference Tooling Advisories" section.');
    process.exit(1);
  }
  const next = text.indexOf('\n## ', start + 1);
  const section = text.slice(start, next === -1 ? undefined : next);
  const entries = new Map();
  for (const block of section.split(/\n### /).slice(1)) {
    const id = block.match(/^(GHSA-[A-Za-z0-9-]+)/)?.[1];
    if (!id) continue;
    entries.set(id, block.match(/Review date:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null);
  }
  return entries;
}

const acceptedDevAdvisories = readAcceptedAdvisories(policy);

function runAudit(args) {
  try {
    const stdout = execFileSync('npm', ['audit', '--json', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(stdout);
  } catch (error) {
    const stdout = String(error.stdout ?? '');
    if (!stdout.trim()) {
      throw error;
    }
    return JSON.parse(stdout);
  }
}

function advisoryIds(report) {
  const ids = new Set();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via === 'object' && typeof via.url === 'string') {
        const match = via.url.match(/GHSA-[A-Za-z0-9-]+/);
        if (match) {
          ids.add(match[0]);
        }
      }
    }
  }
  return ids;
}

function vulnerabilityCount(report) {
  return Number(report.metadata?.vulnerabilities?.total ?? 0);
}

const productionReport = runAudit(['--omit=dev']);
const productionCount = vulnerabilityCount(productionReport);

if (productionCount > 0) {
  console.error(`Production dependency audit failed with ${productionCount} finding(s).`);
  console.error('Run `npm audit --omit=dev --json` for details.');
  process.exit(1);
}

const fullReport = runAudit([]);
const fullIds = advisoryIds(fullReport);
const unexpectedIds = [...fullIds].filter((id) => !acceptedDevAdvisories.has(id));
const today = new Date().toISOString().slice(0, 10);
const reviewFailures = [];
for (const [id, reviewDate] of acceptedDevAdvisories) {
  if (!reviewDate) reviewFailures.push(`${id} has no "Review date: YYYY-MM-DD" line.`);
  else if (reviewDate < today) reviewFailures.push(`${id} review date ${reviewDate} has passed; re-examine it.`);
  if (!fullIds.has(id)) reviewFailures.push(`${id} is accepted but no longer reported by npm audit; remove the exception.`);
}

if (unexpectedIds.length > 0) {
  console.error('Dependency audit found unaccepted advisory ids:');
  for (const id of unexpectedIds) {
    console.error(`- ${id}`);
  }
  process.exit(1);
}

if (reviewFailures.length > 0) {
  console.error('Dependency audit policy has stale accepted advisories:');
  for (const failure of reviewFailures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Dependency audit verification passed: production audit is clean and accepted dev advisories are documented.');
