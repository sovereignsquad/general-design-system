const [{ accessibilityEvidenceEntries, accessibilityEvidenceSummary }, { patternRegistry }, { validateGdsAccessibilityEvidence }] = await Promise.all([
  import('../apps/playground/src/accessibility-evidence-registry.ts'),
  import('../apps/playground/src/pattern-registry.ts'),
  import('@sovereignsquad/gds-core'),
]);

const stableEntries = patternRegistry.filter((entry) => entry.coverageStatus === 'live-proof' || entry.coverageStatus === 'static-reference');
const evidenceIds = new Set(accessibilityEvidenceEntries.map((entry) => entry.id));
const failures = [];

for (const entry of stableEntries) {
  if (!evidenceIds.has(entry.id)) {
    failures.push(`Missing accessibility evidence for ${entry.id}.`);
  }
}

const validation = validateGdsAccessibilityEvidence(accessibilityEvidenceEntries);
failures.push(...validation.failures);

if (accessibilityEvidenceEntries.length !== stableEntries.length) {
  failures.push(`Accessibility evidence count mismatch: expected ${stableEntries.length}, found ${accessibilityEvidenceEntries.length}.`);
}

if (accessibilityEvidenceSummary.total !== stableEntries.length) {
  failures.push(`Accessibility evidence summary total mismatch: expected ${stableEntries.length}, found ${accessibilityEvidenceSummary.total}.`);
}

if (!accessibilityEvidenceSummary.withKnownLimitations) {
  failures.push('Accessibility evidence summary must report at least one known limitation entry.');
}

if (!accessibilityEvidenceSummary.atStatuses.verified) {
  failures.push('Accessibility evidence summary must include verified AT/browser rows.');
}

if (failures.length) {
  console.error('Accessibility evidence verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Accessibility evidence verification passed: ${accessibilityEvidenceSummary.total} patterns, `
  + `${accessibilityEvidenceSummary.verified} verified, `
  + `${accessibilityEvidenceSummary.knownLimitation} known limitation, `
  + `${accessibilityEvidenceSummary.partial} partial, `
  + `${accessibilityEvidenceSummary.atStatuses.verified} verified AT/browser rows.`,
);
