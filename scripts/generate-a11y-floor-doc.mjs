// Generates docs/ACCESSIBILITY_FLOOR.md from the rule source; not hand-edited.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const { describeGdsAccessibilityFloor, gdsAccessibilityFloorRules } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
writeFileSync(join(ROOT, 'docs/ACCESSIBILITY_FLOOR.md'), `# Accessibility floor

Minimums no GDS theme may cross, checked by \`npm run verify:a11y-floor\` across every built-in
preset (\`getGdsVibeThemes()\`) in both colour schemes.

**Scope.** The gate evaluates built-in presets only. \`auditGdsAccessibilityFloor()\` takes no
argument, so a consumer's brand theme is never an input to it. \`validateGdsAccessibilityFloor()\`
evaluates the rules against one token map, which can be a consumer's own \`--gds-*\` values.

**Severity.** Each finding carries a severity (\`GdsFloorSeverity\`). A \`violation\` fails the
build. A \`report\` is printed on every run and never fails the build: it marks a measurement that
is not enforced yet. Severity is set per finding inside each rule's \`evaluate\`, and
\`GdsFloorRule\` does not declare it, so this page does not list it per rule;
\`npm run verify:a11y-floor\` prints report findings grouped by rule.

This file is GENERATED from \`packages/gds-theme/src/accessibility-floor.ts\`. A floor described
differently from how it is checked is a floor nobody can rely on — run \`npm run docs:a11y-floor\`.

## Rules (${gdsAccessibilityFloorRules.length})

${describeGdsAccessibilityFloor()}

## What is not here

General colour-pair contrast is scored by \`createGdsThemeAccessibilityReport()\` across every
built-in preset and scheme, and the floor adopts its blocking findings rather than re-measuring
them. A second contrast implementation could disagree with the first, and two accessibility
verdicts on one pair is worse than one. The colour-axis rules above measure pairs that report
does not score.

Rules needing real rendered geometry belong to the runtime harness rather than this token-level
gate. A rule that cannot be evaluated is worse than a missing rule, because it looks like
coverage.
`);
console.log('docs/ACCESSIBILITY_FLOOR.md regenerated.');
