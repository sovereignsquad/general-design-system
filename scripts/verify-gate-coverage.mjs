// The coverage half of verify:gates, runnable on its own so verify:gates can mutation-test it
// without re-entering the full mutant suite.
import { GATE_MUTANTS, EXEMPTIONS } from './audit/gate-mutants.config.mjs';
import { checkGateCoverage, readReleaseChain } from './lib/gate-coverage.mjs';

const root = new URL('..', import.meta.url).pathname;
const chain = readReleaseChain(root);
const failures = checkGateCoverage({ chain, gateMutants: GATE_MUTANTS, exemptions: EXEMPTIONS });
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`Gate coverage passed: ${chain.length} release-chain gates each have mutants or a live exemption.`);
