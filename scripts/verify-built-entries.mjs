// Checks built gds-core subpath entries the way consumers load them, against dist/ rather
// than source: the lazy locale entries register in ESM, in CommonJS and through a bundler that
// honours `sideEffects`, and `map.css` bundles without unresolvable assets.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const coreDist = resolve(root, 'packages/gds-core/dist');
const failures = [];

if (!existsSync(join(coreDist, 'locales/lazy/index.mjs'))) {
  console.error('packages/gds-core/dist is missing; build @sovereignsquad/gds-core first.');
  process.exit(1);
}

// Each probe runs in a fresh process so registrations from one cannot satisfy another.
function probe(label, source, type) {
  const args = type === 'module' ? ['--input-type=module', '-e', source] : ['-e', source];
  try {
    const out = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (out !== 'registered') failures.push(`${label}: printed "${out}", expected "registered".`);
  } catch (error) {
    failures.push(`${label}: ${String(error.stderr || error.message).split('\n')[0]}`);
  }
}

const esm = (entry, locales) => `
await import('${coreDist}/locales/lazy/${entry}.mjs');
const { getGdsMessagesLazy } = await import('${coreDist}/locales/lazy/index.mjs');
const en = getGdsMessagesLazy('en');
console.log(${JSON.stringify(locales)}.every((l) => getGdsMessagesLazy(l) !== en) ? 'registered' : 'english fallback');`;
const cjs = (entry, locales) => `
require('${coreDist}/locales/lazy/${entry}.js');
const { getGdsMessagesLazy } = require('${coreDist}/locales/lazy/index.js');
const en = getGdsMessagesLazy('en');
console.log(${JSON.stringify(locales)}.every((l) => getGdsMessagesLazy(l) !== en) ? 'registered' : 'english fallback');`;

probe('ESM locales/lazy/de', esm('de', ['de']), 'module');
probe('ESM locales/lazy/all', esm('all', ['de', 'ko', 'ar']), 'module');
probe('CJS locales/lazy/de', cjs('de', ['de']), 'commonjs');
probe('CJS locales/lazy/all', cjs('all', ['de', 'ko', 'ar']), 'commonjs');

const work = mkdtempSync(join(tmpdir(), 'gds-built-entries-'));
try {
  writeFileSync(join(work, 'locale.mjs'), [
    "import '@sovereignsquad/gds-core/locales/lazy/de';",
    "import { getGdsMessagesLazy } from '@sovereignsquad/gds-core/locales/lazy';",
    "console.log(getGdsMessagesLazy('de') !== getGdsMessagesLazy('en') ? 'registered' : 'english fallback');",
  ].join('\n'));
  await build({
    entryPoints: [join(work, 'locale.mjs')],
    outfile: join(work, 'locale.out.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    nodePaths: [join(root, 'node_modules')],
    external: ['react', 'react-dom', '@mantine/*', 'dayjs', '@tabler/icons-react'],
    logLevel: 'silent',
  });
  try {
    const out = execFileSync(process.execPath, [join(work, 'locale.out.mjs')], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (out !== 'registered') failures.push(`Bundled import '@sovereignsquad/gds-core/locales/lazy/de': printed "${out}"; a bundler dropped the side-effect import.`);
  } catch (error) {
    failures.push(`Bundled locale probe failed: ${String(error.stderr || error.message).split('\n')[0]}`);
  }

  writeFileSync(join(work, 'map.mjs'), "import '@sovereignsquad/gds-core/map.css';\n");
  try {
    await build({
      entryPoints: [join(work, 'map.mjs')],
      outfile: join(work, 'map.out.js'),
      bundle: true,
      nodePaths: [join(root, 'node_modules')],
      logLevel: 'silent',
    });
  } catch (error) {
    failures.push(`Bundling '@sovereignsquad/gds-core/map.css' failed: ${error.message.split('\n').slice(0, 3).join(' ')}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`Built entry verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Built entry verification passed: lazy locales register in ESM, CommonJS and a bundled consumer; map.css bundles.');
