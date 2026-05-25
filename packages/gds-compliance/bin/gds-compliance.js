#!/usr/bin/env node
import { ensureManifestExists, formatReport, runComplianceCheck } from '../index.js';

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

try {
  ensureManifestExists(manifestPath);
} catch (error) {
  console.error(String(error));
  process.exit(1);
}

if (command !== 'check' && command !== 'validate-manifest') {
  console.error('Usage: gds-compliance <check|validate-manifest> --manifest ./gds-adoption.json [--format text|json]');
  process.exit(1);
}

const report = runComplianceCheck({ manifestPath });
const output = formatReport(report, format);
if (output) {
  console.log(output);
}

const hasErrors = report.findings.some((finding) => finding.severity === 'error');
process.exit(hasErrors ? 1 : 0);
