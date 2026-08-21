#!/usr/bin/env node
import {
  createAdoptionReport,
  createExceptionLifecycleReport,
  ensureManifestExists,
  formatAdoptionReport,
  formatExceptionLifecycleReport,
  formatReport,
  runComplianceCheck,
} from '../index.js';

const [, , command, ...rest] = process.argv;

function getArg(name, fallback) {
  const flagIndex = rest.findIndex((arg) => arg === name);
  if (flagIndex === -1) {
    return fallback;
  }
  return rest[flagIndex + 1] ?? fallback;
}

const manifestPath = getArg('--manifest', './gds-adoption.json');
const format = getArg('--format', 'text');
const currentDate = getArg('--current-date');

try {
  ensureManifestExists(manifestPath);
} catch (error) {
  console.error(String(error));
  process.exit(1);
}

if (!['check', 'validate-manifest', 'adoption-report', 'exceptions', 'expire-check', 'check-design-rules'].includes(command)) {
  console.error('Usage: gds-compliance <check|validate-manifest|adoption-report|exceptions|expire-check|check-design-rules> --manifest ./gds-adoption.json [--format text|json|md|html] [--current-date YYYY-MM-DD]');
  process.exit(1);
}

const report = runComplianceCheck({ manifestPath, currentDate });
let output = '';

if (command === 'adoption-report') {
  output = formatAdoptionReport(createAdoptionReport(report, { currentDate }), format);
} else if (command === 'exceptions' || command === 'expire-check') {
  output = formatExceptionLifecycleReport(createExceptionLifecycleReport(report.manifest, { currentDate }), format);
} else if (command === 'check-design-rules') {
  // A filtered view over the same findings runComplianceCheck already produces, exactly
  // as adoption-report/exceptions are filtered/reshaped views, not an independent scan.
  const designRuleFindings = report.findings.filter((finding) => finding.rule.startsWith('design-rule.'));
  output = formatReport({ manifest: report.manifest, findings: designRuleFindings }, format);
} else {
  output = formatReport(report, format);
}

if (output) {
  console.log(output);
}

if (command === 'check-design-rules') {
  const designRuleErrors = report.findings.some((finding) => finding.rule.startsWith('design-rule.') && finding.severity === 'error');
  process.exit(designRuleErrors ? 1 : 0);
}

const hasErrors = report.findings.some((finding) => finding.severity === 'error');

if (command === 'expire-check') {
  const lifecycle = createExceptionLifecycleReport(report.manifest, { currentDate });
  const hasExpired = lifecycle.items.some((item) => item.expiryBucket === 'expired' && item.enforcementMode !== 'warn');
  process.exit(hasErrors || hasExpired ? 1 : 0);
}

process.exit(hasErrors ? 1 : 0);
