import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const policyPath = resolve(root, 'DEPENDENCY_AUDIT.md');
const policy = readFileSync(policyPath, 'utf8');

const acceptedDevAdvisories = new Set([
  'GHSA-qx2v-qp2m-jg93',
  'GHSA-f88m-g3jw-g9cj',
  'GHSA-6g55-p6wh-862q',
  'GHSA-r28c-9q8g-f849',
  'GHSA-fxqj-rqcc-2cmp',
]);

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
const undocumentedIds = [...acceptedDevAdvisories].filter((id) => !policy.includes(id));

if (unexpectedIds.length > 0) {
  console.error('Dependency audit found unaccepted advisory ids:');
  for (const id of unexpectedIds) {
    console.error(`- ${id}`);
  }
  process.exit(1);
}

if (undocumentedIds.length > 0) {
  console.error('Dependency audit policy is missing accepted advisory documentation:');
  for (const id of undocumentedIds) {
    console.error(`- ${id}`);
  }
  process.exit(1);
}

if (!/Review date:\s*2026-07-06/.test(policy)) {
  console.error('Dependency audit policy must include the current accepted-advisory review date: 2026-07-06.');
  process.exit(1);
}

console.log('Dependency audit verification passed: production audit is clean and accepted dev advisories are documented.');
