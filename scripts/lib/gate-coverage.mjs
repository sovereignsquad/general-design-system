// Every `npm run` step of verify:release needs gate mutants or a live exemption
// (a reason and a reviewBy date that has not passed).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readReleaseChain(root) {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts['verify:release']
    .split('&&').map((c) => c.trim())
    .filter((c) => c.startsWith('npm run'))
    .map((c) => c.replace('npm run ', '').trim());
}

export function checkGateCoverage({ chain, gateMutants, exemptions, now = new Date() }) {
  const failures = [];
  if (chain.length === 0) failures.push('Could not parse verify:release — refusing to pass vacuously.');
  if (gateMutants.length === 0) failures.push('Empty gate-mutant registry — refusing to pass vacuously.');
  const covered = new Set(gateMutants.map((g) => g.npmScript));
  for (const gate of chain) {
    if (covered.has(gate)) continue;
    const exempt = exemptions[gate];
    if (!exempt) {
      failures.push(`${gate} is in verify:release but has neither mutants nor an exemption.`);
      continue;
    }
    if (!exempt.reason?.trim()) failures.push(`${gate} exemption has no reason.`);
    if (!exempt.reviewBy) failures.push(`${gate} exemption has no reviewBy date.`);
    else if (Date.parse(exempt.reviewBy) < now) {
      failures.push(`${gate} exemption expired ${exempt.reviewBy} — re-examine or add mutants.`);
    }
  }
  return failures;
}
