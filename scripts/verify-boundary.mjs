/**
 * GDS boundary contract suite (issue 347).
 *
 * One named gate that asserts GDS owns its contract end-to-end — a vendor upgrade
 * or accidental leak fails here, in GDS's own CI, never silently in a consumer
 * app. Composes the individual boundary gates and reports a single verdict:
 *
 *   - public type surface frozen        (verify-public-types-boundary, #343)
 *   - single install surface / no skew  (verify-single-install-surface, #346)
 *   - public CSS selector surface frozen (verify-css-boundary, #347)
 *
 * The opaque-overlay invariant (#342) is exercised by the runtime theme verifiers
 * (verify:forced-colors-runtime / verify:theme-trust-runtime), and the internal
 * export contract by check-export-contract — both remain wired in verify:release
 * alongside this suite.
 *
 * Each sub-gate prints the exact offending symbol/selector/dep on failure.
 * Requires a prior `npm run build` (the type gate reads dist/*.d.ts).
 */
import { spawnSync } from 'node:child_process';

const gates = [
  ['Public type surface', 'scripts/verify-public-types-boundary.mjs'],
  ['Single install surface', 'scripts/verify-single-install-surface.mjs'],
  ['Public CSS selector surface', 'scripts/verify-css-boundary.mjs'],
];

let failed = false;
for (const [label, script] of gates) {
  const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (res.status !== 0) {
    failed = true;
    console.error(`\n✗ Boundary gate failed: ${label} (${script})`);
  }
}

if (failed) {
  console.error('\nGDS boundary contract verification FAILED. The vendor boundary was breached — see the failing gate(s) above.');
  process.exit(1);
}

console.log('\nGDS boundary contract verification passed (type, install-surface, and CSS-selector surfaces all sealed to baseline).');
