/**
 * Checks every GDS package's declared engine/platform peer ranges match
 * vendor-governance.json, the single source of truth for the pinned versions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, 'vendor-governance.json'), 'utf8'));
const GDS_PACKAGES = ['gds', 'gds-core', 'gds-theme', 'gds-admin'];

const failures = [];

for (const pkg of GDS_PACKAGES) {
  const m = JSON.parse(readFileSync(resolve(root, `packages/${pkg}/package.json`), 'utf8'));
  const peers = m.peerDependencies ?? {};

  for (const enginePkg of manifest.enginePackages) {
    const range = peers[enginePkg];
    if (range && range !== manifest.pinnedRange) {
      failures.push(`${pkg}: ${enginePkg} peer range "${range}" != governed pinnedRange "${manifest.pinnedRange}".`);
    }
  }
  // Map engine is pinned exactly, not by range.
  const deps = { ...(m.dependencies ?? {}) };
  if (manifest.mapEngine && deps[manifest.mapEngine] && deps[manifest.mapEngine] !== manifest.mapRange) {
    failures.push(`${pkg}: ${manifest.mapEngine} "${deps[manifest.mapEngine]}" != governed mapRange "${manifest.mapRange}".`);
  }

  if (peers[manifest.iconEngine] && peers[manifest.iconEngine] !== manifest.iconRange) {
    failures.push(`${pkg}: ${manifest.iconEngine} peer range "${peers[manifest.iconEngine]}" != governed iconRange "${manifest.iconRange}".`);
  }
  for (const [dep, governed] of Object.entries(manifest.platformPeers)) {
    if (peers[dep] && peers[dep] !== governed) {
      failures.push(`${pkg}: ${dep} peer range "${peers[dep]}" != governed "${governed}".`);
    }
  }
}

if (typeof manifest.candidate !== 'string' || !manifest.candidate) {
  failures.push('vendor-governance.json: "candidate" must be a non-empty version range.');
}

if (failures.length) {
  console.error('Vendor governance verification failed — package peer ranges drifted from the governed manifest:');
  for (const f of failures) console.error(`- ${f}`);
  console.error('\nReconcile packages/*/package.json with vendor-governance.json, or update the manifest via docs/VENDOR_UPGRADE_RUNBOOK.md.');
  process.exit(1);
}

console.log(`Vendor governance verification passed (engine pinned to "${manifest.pinnedRange}" across all GDS packages; candidate "${manifest.candidate}" smoke-tested by CI matrix ${JSON.stringify(manifest.ciMatrix)}).`);
