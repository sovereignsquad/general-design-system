// Issue 593 — the computed contrast guarantee that replaces the frozen accent palette.
//
// `gdsBadgeAccentColors` was frozen precisely so nobody had to verify 10 accents x 4 shades x
// 3 modes x 2 schemes x 25 presets. The axis un-freezes it, so that verification now has to
// exist — this is it.
//
// Output: audit/accent-contrast.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const {
  evaluateGdsAccentContrast, getGdsVibeThemes, getGdsVibeThemeCssVariables,
  GDS_ACCENT_NAMES, GDS_ACCENT_SHADES, GDS_ACCENT_MODES, GDS_ACCENT_MODE_ENFORCEMENT,
} = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));

if (!evaluateGdsAccentContrast) {
  console.error('FAIL could not load the accent axis from packages/gds-theme/dist — run `npm run build` first.');
  process.exit(1);
}

const presets = getGdsVibeThemes();
if (!presets.length) { console.error('FAIL no presets found; the gate cannot pass vacuously.'); process.exit(1); }
if (!GDS_ACCENT_NAMES.length) { console.error('FAIL no accents declared; refusing to pass.'); process.exit(1); }

// CANARY. Zero failures is the result we want and also what a gate measuring nothing reports.
// An accent that cannot possibly pass filled mode must come back failing; if it does not, the
// clean result below means nothing. Same reasoning as verify:a11y-floor.
const canary = evaluateGdsAccentContrast(
  { ramps: { plum: { base: '#fefefe' } } },          // near-white: white-on-white in filled mode
  { light: '#ffffff', dark: '#000000' },
  'canary',
).filter((r) => r.accent === 'plum' && r.mode === 'filled' && !r.passes);
if (!canary.length) {
  console.error('FAIL the canary accent passed filled-mode contrast. White on near-white cannot pass;');
  console.error('     the evaluation is not measuring what it claims, and a clean run below would mean nothing.');
  process.exit(1);
}

// A preset MAY declare its own accent palette (`axes.accent`) — the vibe resolver has passed
// `vibe.axes` through since the axis landed. This loop used to pass `undefined`, i.e. it
// checked the DEFAULT palette 25 times over. No preset overrides today, so the numbers were
// right; the check was not. The first preset to declare its own accents would have had its
// real colours go unverified while the gate reported a clean sweep of colours nothing renders.
//
// The contract this enforces (owner directive, 2026-08-13): accents are a FIXED category
// vocabulary by default, so a category means the same thing across every theme — and a preset
// that deliberately overrides them is verified here rather than trusted.
const results = [];
let presetsWithOwnAccents = 0;
for (const preset of presets) {
  const id = preset.id;
  const axis = preset.axes?.accent;
  if (axis) presetsWithOwnAccents += 1;
  const light = getGdsVibeThemeCssVariables(id, 'light');
  const dark = getGdsVibeThemeCssVariables(id, 'dark');
  for (const r of evaluateGdsAccentContrast(axis, { light: light['--gds-bg-page'], dark: dark['--gds-bg-page'] }, id)) {
    results.push({ presetId: id, ...r });
  }
}

// The CONTRACT, stated here independently of the constants being checked.
//
// A first version computed the expected count from GDS_ACCENT_SHADES.length itself, which is
// vacuous: shrink the shade set and the expectation shrinks with it, so the assertion can
// never fail. The mutation suite proved it — the shortened-sweep mutant passed. This is
// finding F19's shape (a metric derived from the thing it measures), and the fix is to state
// the published contract as literals the source cannot move.
const CONTRACT = { accents: 10, shades: 4, modes: 3, schemes: 2 };
if (GDS_ACCENT_NAMES.length !== CONTRACT.accents || GDS_ACCENT_SHADES.length !== CONTRACT.shades || GDS_ACCENT_MODES.length !== CONTRACT.modes) {
  console.error(`FAIL the accent contract changed: ${GDS_ACCENT_NAMES.length} accents x ${GDS_ACCENT_SHADES.length} shades x ${GDS_ACCENT_MODES.length} modes,`);
  console.error(`     expected ${CONTRACT.accents} x ${CONTRACT.shades} x ${CONTRACT.modes}. Slot and step counts are published API — change this gate deliberately, not as a side effect.`);
  process.exit(1);
}
const expected = presets.length * CONTRACT.accents * CONTRACT.shades * CONTRACT.modes * CONTRACT.schemes;
if (results.length !== expected) {
  console.error(`FAIL evaluated ${results.length} combinations, expected ${expected}. A short sweep is not a clean sweep.`);
  process.exit(1);
}

const enforced = results.filter((r) => r.enforced);
const violations = enforced.filter((r) => !r.passes);

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/accent-contrast.json'), `${JSON.stringify({
  presets: presets.length,
  presetsWithOwnAccents,
  evaluated: results.length,
  enforced: enforced.length,
  violationCount: violations.length,
  modeEnforcement: GDS_ACCENT_MODE_ENFORCEMENT,
  violations,
}, null, 2)}\n`);

console.log('Accent contrast (issue 593)\n');
console.log(`  combinations evaluated  ${String(results.length).padStart(5)}`);
console.log(`  of those enforced       ${String(enforced.length).padStart(5)}`);
console.log(`  canary                  proven live (${canary.length} deliberate failures detected)`);
console.log(`  violations              ${String(violations.length).padStart(5)}`);
for (const [mode, { enforced: on, reason }] of Object.entries(GDS_ACCENT_MODE_ENFORCEMENT)) {
  if (!on) console.log(`      ${mode}: measured, not enforced — ${reason.slice(0, 96)}`);
}

if (violations.length) {
  console.error('');
  for (const v of violations.slice(0, 30)) {
    console.error(`FAIL ${v.presetId}/${v.scheme} ${v.accent}-${v.shade} ${v.mode}: ${v.ratio}:1, required ${v.required}:1`);
    console.error(`     ${v.foreground} on ${v.background}`);
  }
  if (violations.length > 30) console.error(`  … and ${violations.length - 30} more.`);
  console.error(`\n${violations.length} accent contrast violation(s).`);
  process.exit(1);
}
console.log(`\nEvery enforced accent combination clears its threshold across ${presets.length} presets.`);
