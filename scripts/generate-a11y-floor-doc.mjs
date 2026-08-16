// Generates docs/ACCESSIBILITY_FLOOR.md from the rule source; not hand-edited.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const { describeGdsAccessibilityFloor, gdsAccessibilityFloorRules } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
writeFileSync(join(ROOT, 'docs/ACCESSIBILITY_FLOOR.md'), `# Accessibility floor

Minimums no GDS theme may cross, enforced by \`npm run verify:a11y-floor\` across every preset
in both colour schemes.

**There is no warning tier.** A floor breach fails the build. A warning would make the floor
advisory, and an advisory floor is not a floor.

This file is GENERATED from \`packages/gds-theme/src/accessibility-floor.ts\`. A floor described
differently from how it is checked is a floor nobody can rely on — run \`npm run docs:a11y-floor\`.

## Rules (${gdsAccessibilityFloorRules.length})

${describeGdsAccessibilityFloor()}

## What is not here

Colour contrast is enforced, but not by these rules: \`createGdsThemeAccessibilityReport()\`
already scores every colour pair across every preset and scheme, and the floor adopts its
blocking findings. A second contrast implementation could disagree with the first, and two
accessibility verdicts on one pair is worse than one.

Rules needing real rendered geometry belong to the runtime harness rather than this token-level
gate. A rule that cannot be evaluated is worse than a missing rule, because it looks like
coverage.
`);
console.log('docs/ACCESSIBILITY_FLOOR.md regenerated.');
