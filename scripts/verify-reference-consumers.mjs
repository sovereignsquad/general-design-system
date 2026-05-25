import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runComplianceCheck, formatReport } from '../packages/gds-compliance/index.js';

const root = process.cwd();
const manifests = [
  'apps/reference-vite/gds-adoption.json',
  'apps/reference-next/gds-adoption.json',
];

const expectedOutputs = [
  'apps/reference-vite/dist/index.html',
  'apps/reference-next/app/layout.tsx',
  'apps/reference-next/app/providers.tsx',
  'apps/reference-next/app/page.tsx',
];

const reports = manifests.map((manifestPath) => runComplianceCheck({
  manifestPath: resolve(root, manifestPath),
}));

const outputFailures = expectedOutputs.filter((path) => !existsSync(resolve(root, path)));
const findingCount = reports.reduce((total, report) => total + report.findings.length, 0);

for (const report of reports) {
  console.log(formatReport(report, 'text'));
}

if (outputFailures.length) {
  console.error('Reference consumer verification failed:');
  for (const outputFailure of outputFailures) {
    console.error(`- Missing build output: ${outputFailure}`);
  }
  process.exit(1);
}

if (findingCount > 0) {
  process.exit(1);
}

console.log('Reference consumer verification passed.');
