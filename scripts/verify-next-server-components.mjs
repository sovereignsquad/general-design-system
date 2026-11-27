// The published packages work in a Next.js App Router consumer's Server Components (#1002).
//
// Packs gds-theme, gds-core, gds-admin and the umbrella exactly as `npm publish` would, installs
// the tarballs into the fixture app in scripts/fixtures/next-rsc-consumer (a Next 16 App Router
// app set up as INSTALLATION_GUIDE.md describes, with optimizePackageImports on), and fails when:
//
// - `next build` fails, which is what happens when a /server entry evaluates client-only code
//   in a Server Component, or passes a function across the client boundary;
// - a server-rendered page lacks the GDS output it renders: the icon and shell on `/` and the
//   table rows on `/table`, from @sovereignsquad/gds-core/server in Server Components.
//
// Needs the packages built first (npm run build) and network access to the npm registry for the
// fixture's third-party dependencies.

import { execFileSync, spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fixture = resolve(root, 'scripts/fixtures/next-rsc-consumer');
const PACKAGES = ['gds-theme', 'gds-core', 'gds-admin', 'gds'];
// Exact versions, so a run is reproducible; Next 16 is the line consumers reported.
const THIRD_PARTY = {
  next: '16.4.6',
  react: '19.2.0',
  'react-dom': '19.2.0',
  '@mantine/core': '8.3.18',
  '@mantine/hooks': '8.3.18',
  '@mantine/dates': '8.3.18',
  '@mantine/modals': '8.3.18',
  '@mantine/notifications': '8.3.18',
  '@tabler/icons-react': '3.36.1',
  dayjs: '1.11.13',
  typescript: '5.9.3',
  '@types/react': '19.2.2',
  '@types/node': '24.10.1',
};
const PORT = Number(process.env.GDS_NEXT_RSC_PORT ?? 3197);

const work = mkdtempSync(join(tmpdir(), 'gds-next-rsc-'));
const app = join(work, 'app');
const failures = [];
let server;

function run(cmd, args, cwd, label) {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n');
    throw new Error(`${label} failed:\n${output}`);
  }
}

async function fetchPage(path) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (response.ok) return await response.text();
    } catch { /* server still starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`GET ${path} never answered on port ${PORT}.`);
}

try {
  const tarballs = join(work, 'tarballs');
  mkdirSync(tarballs);
  run('npm', ['pack', ...PACKAGES.map((p) => `--workspace=@sovereignsquad/${p}`), `--pack-destination=${tarballs}`], root, 'npm pack');
  const packed = Object.fromEntries(readdirSync(tarballs).map((file) => {
    const name = PACKAGES.find((p) => file.startsWith(`sovereignsquad-${p}-`) && /^\d/.test(file.slice(`sovereignsquad-${p}-`.length)));
    return [`@sovereignsquad/${name}`, `file:${join(tarballs, file)}`];
  }));

  cpSync(fixture, app, { recursive: true });
  writeFileSync(join(app, 'package.json'), `${JSON.stringify({
    name: 'gds-next-rsc-consumer',
    private: true,
    dependencies: { ...THIRD_PARTY, ...packed },
    overrides: Object.fromEntries(Object.entries(packed)),
  }, null, 2)}\n`);
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app, 'npm install');
  const build = run('npx', ['next', 'build'], app, 'next build');
  const routes = build.split('\n').filter((line) => /^[├└┌]/.test(line.trim())).map((l) => l.trim());

  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { cwd: app, stdio: 'ignore', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, detached: true });
  const home = await fetchPage('/');
  if (!home.includes('data-gds-icon="Search"')) failures.push('/ does not contain the server-rendered GdsIcon (data-gds-icon="Search").');
  if (!/<header[\s>]/.test(home)) failures.push('/ does not contain the PublicShell header.');
  const table = await fetchPage('/table');
  const rows = (table.match(/<tr[\s>]/g) ?? []).length;
  if (rows < 3) failures.push(`/table has ${rows} table row(s); expected a header row and two body rows from SimpleDataTable.`);
  const map = await fetchPage('/map');
  if (!map.includes('data-probe="map-box"')) failures.push('/map does not render its page.');
  if (failures.length === 0) console.log(`Next.js server components verification passed: ${routes.length} routes built with Next ${THIRD_PARTY.next} from the packed packages; / and /table render GDS output from @sovereignsquad/gds-core/server in Server Components.`);
} catch (error) {
  failures.push(error.message);
} finally {
  if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already stopped */ } }
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`Next.js server components verification failed (${failures.length}):`);
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
process.exit(0);
