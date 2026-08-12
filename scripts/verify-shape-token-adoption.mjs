// Issue 555 — no component may hardcode a corner radius.
//
// The shape axis only means something if components actually read it. A governed scale that
// nothing consumes is the same failure as F2's motion tokens: live, correct, and ignored,
// while every doc claims the system is theme-controlled.
//
// Output: audit/shape-token-adoption.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SHAPE_ALLOWLIST } from './shape-token-adoption.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { GDS_RADIUS_STEPS, GDS_RADIUS_ROLES } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
if (!GDS_RADIUS_STEPS) fail('Could not load the shape axis from packages/gds-theme/dist — run `npm run build` first.');
const KNOWN = new Set([...GDS_RADIUS_STEPS, ...GDS_RADIUS_ROLES].map((n) => `--gds-radius-${n}`));

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

const violations = [];
const allowed = [];
const adopted = [];
let scanned = 0;

for (const file of walk(join(ROOT, 'packages'))) {
  const rel = relative(ROOT, file);
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/borderRadius\s*:\s*([^,;\n}]+)/g)) {
      scanned += 1;
      const value = m[1].trim().replace(/,$/, '').trim();
      const at = `${rel}:${i + 1}`;

      const tokenRef = /var\(\s*(--gds-radius-[a-zA-Z-]+)/.exec(value);
      if (tokenRef) {
        // A reference to a token the axis does not define renders as nothing at all.
        if (!KNOWN.has(tokenRef[1])) {
          violations.push({ at, value, why: `${tokenRef[1]} is not a declared step or role — it would resolve to nothing.` });
        } else {
          adopted.push({ at, token: tokenRef[1] });
        }
        continue;
      }
      // Mantine's scale is fed FROM the axis (theme.ts), so these are governed transitively.
      if (/var\(\s*--mantine-radius-/.test(value)) { adopted.push({ at, token: 'mantine-scale' }); continue; }
      // A variable or expression is not a literal; the gate cannot judge it statically.
      if (!/^['"]?[\d.]/.test(value)) continue;

      const entry = SHAPE_ALLOWLIST[at];
      if (entry) {
        if (!entry.reason?.trim()) fail(`Shape allowlist entry ${at} has no reason.`);
        if (!entry.reviewBy) fail(`Shape allowlist entry ${at} has no reviewBy.`);
        if (Date.parse(entry.reviewBy) < Date.now()) fail(`Shape allowlist entry ${at} expired ${entry.reviewBy}.`);
        allowed.push({ at, value, category: entry.category, reviewBy: entry.reviewBy });
        continue;
      }
      violations.push({ at, value, why: 'hardcoded radius — read it from the shape axis via var(--gds-radius-<role>) or allowlist it with a reason.' });
    }
  });
}

if (!scanned) fail('No borderRadius declarations found. Extraction is broken, not the system shapeless.');

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/shape-token-adoption.json'), `${JSON.stringify({
  declarationsScanned: scanned,
  adopted: adopted.length,
  allowlisted: allowed.length,
  violationCount: violations.length,
  byCategory: allowed.reduce((a, x) => ({ ...a, [x.category]: (a[x.category] ?? 0) + 1 }), {}),
  allowed,
  violations,
}, null, 2)}\n`);

console.log('Shape token adoption (issue 555)\n');
console.log(`  borderRadius declarations  ${String(scanned).padStart(4)}`);
console.log(`  token-governed             ${String(adopted.length).padStart(4)}`);
console.log(`  allowlisted                ${String(allowed.length).padStart(4)}   ${JSON.stringify(allowed.reduce((a, x) => ({ ...a, [x.category]: (a[x.category] ?? 0) + 1 }), {}))}`);
console.log(`  violations                 ${String(violations.length).padStart(4)}`);

if (violations.length) {
  console.error('');
  for (const v of violations) console.error(`FAIL ${v.at} — borderRadius: ${v.value}\n     ${v.why}`);
  console.error(`\n${violations.length} hardcoded radius value(s).`);
  process.exit(1);
}
console.log('\nEvery borderRadius is token-governed or allowlisted with a reason.');
