// Issue 554, Phase 1 — ground truth captured from the CURRENT implementation.
//
// The consolidation's success criterion is that nothing moves: every semantic token
// value rendered today must be byte-identical afterwards. That claim is only checkable
// against a snapshot taken BEFORE the refactor, from the shipped build, so this runs
// first and its output is committed as evidence.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('../..', import.meta.url).pathname;
const { getGdsVibeThemes, getGdsVibeThemeCssVariables, createBrandTheme } = await import(
  join(ROOT, 'packages/gds-theme/dist/index.js')
);

const snapshot = {};
for (const { id } of getGdsVibeThemes()) {
  for (const scheme of ['light', 'dark']) {
    snapshot[`vibe:${id}:${scheme}`] = Object.fromEntries(
      Object.entries(getGdsVibeThemeCssVariables(id, scheme)).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
}
for (const lane of ['class-usa', 'gold-athlete']) {
  snapshot[`brand:${lane}`] = Object.fromEntries(
    Object.entries(createBrandTheme(lane).mantineTheme.other.gdsCssVariables).sort(([a], [b]) => a.localeCompare(b)),
  );
}

const keys = Object.values(snapshot).reduce((n, v) => n + Object.keys(v).length, 0);
writeFileSync(join(ROOT, 'packages/gds-theme/src/__snapshots__/token-baseline.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Token baseline captured: ${Object.keys(snapshot).length} (preset, scheme) pairs, ${keys} token values.`);
