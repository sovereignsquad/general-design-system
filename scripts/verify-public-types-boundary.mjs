/**
 * Public type-boundary gate (issue 343).
 *
 * Scans the built, consumer-facing `.d.ts` entrypoints for references to the
 * vendor engine (`@mantine/*`) and fails if any reference appears that is not
 * recorded in the committed allowlist baseline. This SEALS GDS's public type
 * surface: a vendor major that changes prop types, or a new accidental
 * pass-through, fails here in GDS's own CI instead of silently in a consumer's
 * compile step.
 *
 * The allowlist (boundary/public-type-allowlist.json) is the documented, reviewed
 * set of intentional vendor-type exposures (today: the GdsPrimitives passthrough
 * and the Mantine theme-override types). Shrinking it — by wrapping a primitive
 * behind a GDS-owned type — is the path to "less reliance"; this gate guarantees
 * the surface only ever shrinks deliberately, never grows by accident.
 *
 * Regenerate the baseline after an *intentional* surface change:
 *   node scripts/verify-public-types-boundary.mjs --write
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const allowlistPath = 'boundary/public-type-allowlist.json';

// Consumer-facing type entrypoints. Internal `.d.ts` are intentionally excluded —
// only what a consumer can import forms the public contract.
const ENTRYPOINTS = [
  'packages/gds/dist/index.d.ts',
  'packages/gds-core/dist/index.d.ts',
  'packages/gds-core/dist/client.d.ts',
  'packages/gds-core/dist/server.d.ts',
  'packages/gds-admin/dist/index.d.ts',
  'packages/gds-admin/dist/client.d.ts',
  'packages/gds-admin/dist/server.d.ts',
  'packages/gds-theme/dist/index.d.ts',
  'packages/gds-theme/dist/client.d.ts',
  'packages/gds-theme/dist/server.d.ts',
  'packages/gds-a11y/dist/index.d.ts',
];

// Extract, per file, the set of named symbols pulled from each `@mantine/*`
// module (side-effect / namespace imports record the sentinel "*").
function extractLeaks(file) {
  const src = readFileSync(resolve(root, file), 'utf8');
  const stmtMatcher = /(?:import|export)[^;]*?['"](@mantine\/[^'"]+)['"]/g;
  const leaks = {};
  let m;
  while ((m = stmtMatcher.exec(src))) {
    const stmt = m[0];
    const mod = m[1];
    leaks[mod] = leaks[mod] || new Set();
    const brace = stmt.match(/\{([^}]*)\}/);
    if (brace) {
      for (let name of brace[1].split(',')) {
        name = name.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
        if (name) leaks[mod].add(name);
      }
    } else {
      leaks[mod].add('*');
    }
  }
  const out = {};
  for (const [mod, set] of Object.entries(leaks)) out[mod] = [...set].sort();
  return out;
}

const current = {};
for (const file of ENTRYPOINTS) {
  if (!existsSync(resolve(root, file))) continue;
  const leaks = extractLeaks(file);
  if (Object.keys(leaks).length) current[file] = leaks;
}

if (process.argv.includes('--write')) {
  writeFileSync(resolve(root, allowlistPath), JSON.stringify(current, null, 2) + '\n');
  console.log(`Wrote ${allowlistPath} (${Object.keys(current).length} entrypoints with vendor-type exposure).`);
  process.exit(0);
}

if (!existsSync(resolve(root, allowlistPath))) {
  console.error(`Missing ${allowlistPath}. Generate it with: node scripts/verify-public-types-boundary.mjs --write`);
  process.exit(1);
}

const allow = JSON.parse(readFileSync(resolve(root, allowlistPath), 'utf8'));
const newLeaks = [];
const staleEntries = [];

for (const [file, mods] of Object.entries(current)) {
  for (const [mod, names] of Object.entries(mods)) {
    const allowed = new Set(allow[file]?.[mod] ?? []);
    for (const name of names) {
      if (!allowed.has(name)) newLeaks.push(`${file}  ${mod}  ${name}`);
    }
  }
}
// Report (non-failing) allowlist entries that no longer occur, so the baseline
// can be tightened as the surface shrinks.
for (const [file, mods] of Object.entries(allow)) {
  for (const [mod, names] of Object.entries(mods)) {
    const now = new Set(current[file]?.[mod] ?? []);
    for (const name of names) {
      if (!now.has(name)) staleEntries.push(`${file}  ${mod}  ${name}`);
    }
  }
}

if (newLeaks.length) {
  console.error('Public type-boundary verification failed — new vendor (@mantine) type reference(s) in the public surface:');
  for (const leak of newLeaks) console.error(`- ${leak}`);
  console.error('\nFix by exposing a GDS-owned type instead of the vendor type. If the exposure is intentional and reviewed, update the baseline:');
  console.error('  node scripts/verify-public-types-boundary.mjs --write');
  process.exit(1);
}

if (staleEntries.length) {
  console.log(`Public type-boundary: ${staleEntries.length} allowlisted exposure(s) no longer present (surface shrank). Tighten the baseline with --write when convenient.`);
}

console.log(`Public type-boundary verification passed (${Object.keys(current).length} public entrypoints; vendor-type surface frozen to allowlist).`);
