import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const files = {
  period: readFileSync(resolve(root, 'packages/gds-core/src/PeriodSelector.tsx'), 'utf8'),
  evidence: readFileSync(resolve(root, 'packages/gds-core/src/EvidencePanel.tsx'), 'utf8'),
  chart: readFileSync(resolve(root, 'packages/gds-core/src/ChartTokenPanel.tsx'), 'utf8'),
  reporting: readFileSync(resolve(root, 'packages/gds-core/src/ReportingSection.tsx'), 'utf8'),
  registry: readFileSync(resolve(root, 'apps/playground/src/pattern-registry.ts'), 'utf8'),
  pages: readFileSync(resolve(root, 'apps/playground/src/pattern-pages.tsx'), 'utf8'),
  coverage: readFileSync(resolve(root, 'apps/playground/src/pattern-export-coverage.ts'), 'utf8'),
  components: readFileSync(resolve(root, 'COMPONENTS_AND_PATTERNS.md'), 'utf8'),
  exceptions: readFileSync(resolve(root, 'EXCEPTION_SURFACES.md'), 'utf8'),
  playbook: readFileSync(resolve(root, 'ADOPTION_AND_MIGRATION_PLAYBOOK.md'), 'utf8'),
};

const failures = [];

for (const exportName of ['PeriodSelector', 'EvidencePanel', 'ChartTokenPanel', 'ReportingSection']) {
  for (const entrypoint of ['index.ts', 'client.ts', 'server.ts']) {
    const source = readFileSync(resolve(root, `packages/gds-core/src/${entrypoint}`), 'utf8');
    if (!source.includes(`./${exportName}`)) {
      failures.push(`${entrypoint} is missing ${exportName} export`);
    }
  }
  if (!files.coverage.includes(`exportName: '${exportName}'`)) {
    failures.push(`pattern export coverage is missing ${exportName}`);
  }
}

for (const state of ['loading', 'below-threshold', 'partial', 'empty', 'error', 'stale', 'filtered', 'permission-limited']) {
  if (!files.reporting.includes(`'${state}'`) && !files.chart.includes(`'${state}'`)) {
    failures.push(`reporting/chart contracts are missing state: ${state}`);
  }
  if (!files.components.includes(`\`${state}\``)) {
    failures.push(`COMPONENTS_AND_PATTERNS.md is missing state documentation: ${state}`);
  }
}

for (const required of ['timezone', 'stale', 'filtered', 'scope']) {
  if (!files.period.includes(required)) {
    failures.push(`PeriodSelector is missing ${required}`);
  }
}

for (const required of ['source', 'freshness', 'confidence', 'evidenceCount', 'permissionNote']) {
  if (!files.evidence.includes(required)) {
    failures.push(`EvidencePanel is missing ${required}`);
  }
}

for (const required of ['summary', 'legend', 'tableFallback', 'Chart legend']) {
  if (!files.chart.includes(required)) {
    failures.push(`ChartTokenPanel is missing ${required}`);
  }
}

for (const required of ['reporting-contracts', 'ReportingSection / PeriodSelector / EvidencePanel / ChartTokenPanel']) {
  if (!files.registry.includes(required)) {
    failures.push(`pattern registry is missing ${required}`);
  }
}

for (const required of ['Operational evidence report', 'ChartTokenPanel', 'EvidencePanel', 'PeriodSelector']) {
  if (!files.pages.includes(required)) {
    failures.push(`pattern pages are missing live reporting evidence: ${required}`);
  }
}

for (const required of ['Reporting, Evidence, and Chart Rules', 'text summary', 'table fallback', 'ChartTokenPanel']) {
  if (!files.components.includes(required)) {
    failures.push(`COMPONENTS_AND_PATTERNS.md is missing reporting evidence: ${required}`);
  }
}

for (const required of ['Reporting, evidence, and chart migration', 'replace local date/period selectors with `PeriodSelector`']) {
  if (!files.playbook.includes(required)) {
    failures.push(`ADOPTION_AND_MIGRATION_PLAYBOOK.md is missing reporting migration evidence: ${required}`);
  }
}

if (!files.exceptions.includes('ChartTokenPanel') || !files.exceptions.includes('does not own chart engines')) {
  failures.push('EXCEPTION_SURFACES.md must define chart ownership boundaries.');
}

if (failures.length > 0) {
  console.error('Reporting contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Reporting contract verification passed.');
