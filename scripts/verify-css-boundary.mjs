/**
 * Public CSS-selector boundary gate (issue 347).
 *
 * GDS's public styling contract should key on GDS-owned `data-gds-*` hooks, not
 * vendor-internal class names. This gate scans the published stylesheet for
 * `.mantine-*` selectors and fails on any not recorded in the committed baseline
 * (boundary/public-css-allowlist.json). A vendor class rename, or a new
 * vendor-class dependency, fails here instead of silently breaking a consumer's
 * theme.
 *
 * The styling-contract migration (#345) shrinks this baseline as surfaces move to
 * `data-gds-*` hooks; this gate guarantees the vendor-selector surface only ever
 * shrinks deliberately, never grows by accident.
 *
 * Regenerate the baseline after an intentional change:
 *   node scripts/verify-css-boundary.mjs --write
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const cssFile = 'packages/gds-theme/styles.css';
const allowPath = 'boundary/public-css-allowlist.json';

const css = readFileSync(resolve(root, cssFile), 'utf8');
const selectors = [...new Set(css.match(/\.mantine-[A-Za-z0-9-]+/g) ?? [])].sort();

if (process.argv.includes('--write')) {
  writeFileSync(resolve(root, allowPath), JSON.stringify({ [cssFile]: selectors }, null, 2) + '\n');
  console.log(`Wrote ${allowPath} (${selectors.length} vendor selectors in the public CSS contract).`);
  process.exit(0);
}

if (!existsSync(resolve(root, allowPath))) {
  console.error(`Missing ${allowPath}. Generate it with: node scripts/verify-css-boundary.mjs --write`);
  process.exit(1);
}

const allow = JSON.parse(readFileSync(resolve(root, allowPath), 'utf8'));
const allowed = new Set(allow[cssFile] ?? []);
const newSelectors = selectors.filter((s) => !allowed.has(s));
const removed = [...allowed].filter((s) => !selectors.includes(s));

if (newSelectors.length) {
  console.error('Public CSS-boundary verification failed — new vendor (.mantine-*) selector(s) in the public stylesheet:');
  for (const s of newSelectors) console.error(`- ${s}`);
  console.error('\nPrefer a GDS-owned `data-gds-*` hook. If the vendor selector is intentional, update the baseline:');
  console.error('  node scripts/verify-css-boundary.mjs --write');
  process.exit(1);
}

if (removed.length) {
  console.log(`Public CSS-boundary: ${removed.length} vendor selector(s) removed (surface shrank). Tighten the baseline with --write when convenient.`);
}

console.log(`Public CSS-boundary verification passed (${selectors.length} vendor selectors frozen to allowlist).`);
