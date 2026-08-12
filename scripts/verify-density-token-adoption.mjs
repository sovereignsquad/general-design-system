// Issue 556 — spacing decisions come from the density axis, not from literals.
//
// A governed spacing scale that components ignore is the F2 failure in another namespace:
// live, correct tokens with every rule reaching past them.
//
// Two things are deliberately NOT violations:
//   `0`  — a reset is the absence of spacing, not a spacing decision. Routing it through a
//          token would mean `--gds-space-none`, which reads worse and governs nothing.
//   `em` — a value that scales with its own font size is doing something the step scale
//          cannot express, and is usually correct inside generated imagery.
//
// Output: audit/density-token-adoption.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DENSITY_ALLOWLIST } from './density-token-adoption.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { GDS_SPACE_STEPS } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
if (!GDS_SPACE_STEPS) fail('Could not load the density axis from packages/gds-theme/dist — run `npm run build` first.');
const KNOWN = new Set(GDS_SPACE_STEPS.map((s) => `--gds-space-${s}`));

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

const PROP = /\b(padding|margin|gap|rowGap|columnGap)(Top|Bottom|Left|Right|Inline|Block)?\s*:\s*([^,;\n}]+)/g;
const violations = [];
const allowed = [];
let scanned = 0;
let adopted = 0;

for (const file of walk(join(ROOT, 'packages'))) {
  const rel = relative(ROOT, file);
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(PROP)) {
      scanned += 1;
      const value = m[3].trim().replace(/,$/, '').trim();
      const at = `${rel}:${i + 1}`;

      const ref = /var\(\s*(--gds-space-[a-z0-9]+)/.exec(value);
      if (ref) {
        if (!KNOWN.has(ref[1])) violations.push({ at, value, why: `${ref[1]} is not a declared space step — it would resolve to nothing.` });
        else adopted += 1;
        continue;
      }
      if (/var\(\s*--mantine-spacing-/.test(value)) { adopted += 1; continue; }   // fed from the axis
      if (/^['"]?0['"]?$/.test(value)) continue;                                  // reset, not a decision
      if (/em\b/.test(value) && !/rem\b/.test(value)) continue;                   // font-relative by intent
      if (!/^['"]?[\d.]/.test(value)) continue;                                   // expression, not judgeable statically

      const entry = DENSITY_ALLOWLIST[at];
      if (entry) {
        if (!entry.reason?.trim()) fail(`Density allowlist entry ${at} has no reason.`);
        if (!entry.reviewBy) fail(`Density allowlist entry ${at} has no reviewBy.`);
        if (Date.parse(entry.reviewBy) < Date.now()) fail(`Density allowlist entry ${at} expired ${entry.reviewBy}.`);
        allowed.push({ at, value, reason: entry.reason, reviewBy: entry.reviewBy });
        continue;
      }
      violations.push({ at, value, why: 'hardcoded spacing — read it from the density axis via var(--gds-space-<step>) or allowlist it with a reason.' });
    }
  });
}

if (!scanned) fail('No spacing declarations found. Extraction is broken, not the system spaceless.');

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/density-token-adoption.json'), `${JSON.stringify({
  declarationsScanned: scanned, adopted, allowlisted: allowed.length, violationCount: violations.length, allowed, violations,
}, null, 2)}\n`);

console.log('Density token adoption (issue 556)\n');
console.log(`  spacing declarations  ${String(scanned).padStart(4)}`);
console.log(`  token-governed        ${String(adopted).padStart(4)}`);
console.log(`  allowlisted           ${String(allowed.length).padStart(4)}`);
console.log(`  violations            ${String(violations.length).padStart(4)}`);

if (violations.length) {
  console.error('');
  for (const v of violations) console.error(`FAIL ${v.at} — ${v.value}\n     ${v.why}`);
  console.error(`\n${violations.length} hardcoded spacing value(s).`);
  process.exit(1);
}
console.log('\nEvery spacing declaration is token-governed, a reset, or allowlisted with a reason.');
