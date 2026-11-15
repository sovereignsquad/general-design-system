// `@sovereignsquad/gds-theme/tokens` must load where neither React nor Mantine can run: a Next.js
// route handler or server component, a worker, a build script.
//
// 1. Static: walk the runtime import graph of src/tokens.ts (type-only imports are erased and
//    skipped) and fail on any module that imports @mantine/*, react or react-dom, or that is
//    marked 'use client'.
// 2. Runtime: import the built dist/tokens.mjs and dist/tokens.js with a loader that throws when
//    any of those packages is resolved, then call a few exports.
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SRC = join(ROOT, 'packages/gds-theme/src');
const ENTRY = join(SRC, 'tokens.ts');
const FORBIDDEN = /^(@mantine\/|react$|react-dom$|react\/)/;
const failures = [];

function runtimeSpecifiers(source) {
  const specs = [];
  const re = /^\s*(import|export)\s+(type\s+)?([\s\S]*?)\s*from\s+['"]([^'"]+)['"]/gm;
  for (const m of source.matchAll(re)) {
    if (m[2]) continue;
    const clause = m[3].trim();
    // `import { type A, type B } from` is erased as well.
    if (/^\{[\s\S]*\}$/.test(clause) && clause.slice(1, -1).split(',').every((part) => !part.trim() || /^type\s/.test(part.trim()))) continue;
    specs.push(m[4]);
  }
  for (const m of source.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) specs.push(m[1]);
  return specs;
}

function resolveLocal(from, spec) {
  const base = resolve(dirname(from), spec);
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find((candidate) => existsSync(candidate));
}

const seen = new Map();
function walk(file, chain) {
  if (seen.has(file)) return;
  seen.set(file, chain);
  const source = readFileSync(file, 'utf8');
  const rel = file.slice(ROOT.length + 1);
  if (/^\s*['"]use client['"]/.test(source)) failures.push(`${rel} is marked 'use client' (via ${chain.join(' -> ')})`);
  for (const spec of runtimeSpecifiers(source)) {
    if (spec.startsWith('.')) {
      const next = resolveLocal(file, spec);
      if (next) walk(next, [...chain, rel]);
    } else if (FORBIDDEN.test(spec)) {
      failures.push(`${rel} imports ${spec} at runtime (via ${[...chain, rel].join(' -> ')})`);
    }
  }
}

if (!existsSync(ENTRY)) {
  console.error('FAIL packages/gds-theme/src/tokens.ts is missing.');
  process.exit(1);
}
walk(ENTRY, []);

const dist = join(ROOT, 'packages/gds-theme/dist');
for (const file of ['tokens.mjs', 'tokens.js']) {
  if (!existsSync(join(dist, file))) failures.push(`packages/gds-theme/dist/${file} is missing; run npm run build first.`);
}

if (failures.length === 0) {
  const dir = mkdtempSync(join(tmpdir(), 'gds-tokens-pure-'));
  const hooks = join(dir, 'hooks.mjs');
  writeFileSync(hooks, `export async function resolve(specifier, context, next) {
  if (${FORBIDDEN}.test(specifier)) throw new Error('tokens entry loaded ' + specifier);
  return next(specifier, context);
}
`);
  const register = join(dir, 'register.mjs');
  writeFileSync(register, `import { register } from 'node:module';\nimport { pathToFileURL } from 'node:url';\nregister(pathToFileURL(${JSON.stringify(hooks)}));\n`);
  const probe = join(dir, 'probe.mjs');
  writeFileSync(probe, `import { createRequire } from 'node:module';
const esm = await import(${JSON.stringify(pathToFileURL(join(dist, 'tokens.mjs')).href)});
const cjs = createRequire(import.meta.url)(${JSON.stringify(join(dist, 'tokens.js'))});
for (const t of [esm, cjs]) {
  const vars = t.getGdsVibeThemeCssVariables('default', 'light');
  const manifest = t.getGdsWebAppManifest({ name: 'Probe', startUrl: '/', themeColor: vars['--gds-vibe-primary'], backgroundColor: vars['--gds-vibe-canvas'] });
  if (!manifest || manifest.name !== 'Probe') throw new Error('getGdsWebAppManifest returned ' + JSON.stringify(manifest));
  if (t.getGdsVibeThemes().length === 0) throw new Error('getGdsVibeThemes returned no presets');
}
console.log('ok');
`);
  try {
    const out = execFileSync(process.execPath, ['--import', pathToFileURL(register).href, probe], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (out.trim() !== 'ok') failures.push(`runtime probe printed ${JSON.stringify(out.trim())}`);
  } catch (error) {
    failures.push(`dist/tokens could not be loaded without Mantine and React: ${String(error.stderr || error.message).split('\n').find((line) => /Error/.test(line)) ?? error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`Tokens entry purity verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Tokens entry purity verification passed: ${seen.size} modules reachable from src/tokens.ts, none imports Mantine or React at runtime; dist/tokens.mjs and dist/tokens.js load with both blocked.`);
