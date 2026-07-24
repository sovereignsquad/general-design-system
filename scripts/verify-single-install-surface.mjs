/**
 * Single consumer install surface (issue #346).
 *
 * Goal: a consumer installs `@sovereignsquad/gds` (+ their own React) and nothing
 * else — the vendor UI engine is GDS's concern, not part of the consumer's
 * hand-managed dependency contract.
 *
 * Approach (production-safe): the engine packages stay **peerDependencies** so
 * there is exactly one resolved instance (peers de-duplicate — this is what
 * prevented the dual-React/dual-Mantine context failures). Modern npm (7+)
 * auto-installs peers, so `npm install @sovereignsquad/gds` pulls the engine in
 * automatically; the consumer never lists it explicitly. This gate enforces the
 * invariants that make that safe:
 *
 *   1. Every GDS package that declares an engine peer uses the SAME version
 *      range for it (no skew → npm resolves a single shared instance).
 *   2. React / react-dom stay peers everywhere (consumer-owned platform).
 *   3. The umbrella `@sovereignsquad/gds` declares the full engine + icon peers,
 *      so a single install of it pulls the whole engine.
 *   4. The GDS-owned icon surface (`GdsIcons`) is reachable from a consumer
 *      entrypoint, so consumers never import `@tabler/icons-react` directly.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const GDS_PACKAGES = ['gds', 'gds-core', 'gds-theme', 'gds-admin'];
const ENGINE_PEERS = [
  '@mantine/core',
  '@mantine/hooks',
  '@mantine/modals',
  '@mantine/notifications',
  '@mantine/dates',
  'dayjs',
  '@tabler/icons-react',
];
const PLATFORM_PEERS = ['react', 'react-dom'];

const manifests = {};
for (const pkg of GDS_PACKAGES) {
  manifests[pkg] = JSON.parse(readFileSync(resolve(root, `packages/${pkg}/package.json`), 'utf8'));
}

const failures = [];

// 1. Engine peer ranges must be identical across every package that declares them.
for (const dep of ENGINE_PEERS) {
  const declared = {};
  for (const pkg of GDS_PACKAGES) {
    const range = manifests[pkg].peerDependencies?.[dep];
    if (range) declared[pkg] = range;
  }
  const ranges = new Set(Object.values(declared));
  if (ranges.size > 1) {
    failures.push(
      `Engine peer "${dep}" has inconsistent ranges across GDS packages (version skew → risk of multiple resolved instances): ` +
        Object.entries(declared).map(([p, r]) => `${p}=${r}`).join(', '),
    );
  }
}

// 2. React / react-dom must remain peers (consumer-owned) and be range-consistent.
for (const dep of PLATFORM_PEERS) {
  const declared = {};
  for (const pkg of GDS_PACKAGES) {
    const range = manifests[pkg].peerDependencies?.[dep];
    if (range) declared[pkg] = range;
    if (manifests[pkg].dependencies?.[dep]) {
      failures.push(`${pkg} declares "${dep}" as a dependency — it must remain a consumer-owned peer.`);
    }
  }
  if (new Set(Object.values(declared)).size > 1) {
    failures.push(
      `Platform peer "${dep}" has inconsistent ranges: ` +
        Object.entries(declared).map(([p, r]) => `${p}=${r}`).join(', '),
    );
  }
}

// 3. The umbrella package must declare the full engine + icon peers so a single
//    install of @sovereignsquad/gds pulls the whole engine.
const umbrella = manifests['gds'].peerDependencies ?? {};
for (const dep of ENGINE_PEERS) {
  if (!umbrella[dep]) {
    failures.push(`Umbrella @sovereignsquad/gds is missing engine peer "${dep}" — a single install would not pull it.`);
  }
}

// 4. The GDS-owned icon surface must be reachable from a consumer entrypoint.
const coreDts = 'packages/gds-core/dist/index.d.ts';
if (existsSync(resolve(root, coreDts))) {
  if (!readFileSync(resolve(root, coreDts), 'utf8').includes('GdsIcons')) {
    failures.push('GdsIcons is not exported from gds-core public entrypoint — consumers would have to import @tabler/icons-react directly.');
  }
} else {
  failures.push(`${coreDts} not built — run \`npm run build\` before this gate.`);
}

if (failures.length) {
  console.error('Single install-surface verification failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log('Single install-surface verification passed (engine peers consistent and single-instance-safe; umbrella pulls the engine; GdsIcons surface present).');
