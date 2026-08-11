// Offline pre-publish guard for issue 553.
//
// scripts/verify-published-consumer-smoke.mjs builds a throwaway consumer against the
// PUBLISHED packages and type-checks it. That runs only inside the publish workflow —
// after publish has already happened, and publish is irreversible. So a stale import in
// the fixture cannot be caught by any local run, which is exactly how gds-v5.0.0,
// v5.0.2 and v6.0.0 all reported failure while the packages published correctly.
//
// This gate resolves the fixture's imports against the workspace `exports` maps and the
// built .d.ts barrels, offline, before publish. It is deliberately part of verify:release
// rather than verify:published.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCOPE = '@sovereignsquad/';

/** Fixture sources the smoke script writes. Adding one here is required, not optional. */
const FIXTURE_SOURCES = ['scripts/verify-published-consumer-smoke.mjs'];

/** Extract `import { a, b as c } from 'x'` and `import type { … }` from template literals. */
function parseNamedImports(file) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  const out = [];
  const re = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"`]([^'"`]+)['"`]/g;
  for (const m of src.matchAll(re)) {
    const specifier = m[3];
    if (!specifier.startsWith(SCOPE)) continue;
    const names = m[2]
      .split(',')
      .map((raw) => raw.trim())
      .filter(Boolean)
      // `a as b` — the imported name is the left side; that is what must exist.
      .map((raw) => raw.split(/\s+as\s+/)[0].trim())
      .filter((n) => n && n !== 'type');
    out.push({ file, line: src.slice(0, m.index).split('\n').length, specifier, names, typeOnly: Boolean(m[1]) });
  }
  return out;
}

/** Resolve a bare specifier to the package's declared `types` entry for that subpath. */
function resolveTypesEntry(specifier) {
  const [scope, name, ...rest] = specifier.split('/');
  const pkgName = `${scope}/${name}`;
  const subpath = rest.length ? `./${rest.join('/')}` : '.';

  // Map the published package name back to its workspace directory.
  const dir = pkgName === `${SCOPE}gds` ? 'gds' : pkgName.slice(SCOPE.length);
  const pkgJsonPath = join(ROOT, 'packages', dir, 'package.json');
  if (!existsSync(pkgJsonPath)) return { error: `no workspace package for ${pkgName}` };

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const entry = pkg.exports?.[subpath];
  if (!entry) {
    return { error: `package.json "exports" has no "${subpath}" entry`, available: Object.keys(pkg.exports ?? {}) };
  }
  // Read the `types` condition. Its absence is a real defect, not a reason to skip.
  const types = typeof entry === 'string' ? null : entry.types ?? entry.import?.types ?? entry.require?.types;
  if (!types) return { error: `"exports"["${subpath}"] declares no \`types\` condition` };

  const abs = join(ROOT, 'packages', dir, types);
  if (!existsSync(abs)) return { error: `declared types file missing (run npm run build): ${types}` };
  return { path: abs, pkgName, subpath };
}

/** Names a .d.ts barrel exports, following `export * from './x'` one level. */
function readDeclaredExports(dtsPath, seen = new Set()) {
  if (seen.has(dtsPath) || !existsSync(dtsPath)) return new Set();
  seen.add(dtsPath);
  const src = readFileSync(dtsPath, 'utf8');
  const names = new Set();

  for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:function|const|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g)) {
    names.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const raw of m[1].split(',')) {
      const n = raw.trim().split(/\s+as\s+/).pop()?.trim();
      if (n && n !== 'type') names.add(n.replace(/^type\s+/, ''));
    }
  }
  for (const m of src.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = m[1];
    // The umbrella package re-exports through BARE specifiers
    // (`export * from '@sovereignsquad/gds-core/client'`), not relative paths.
    // Resolving only relative paths reported every umbrella export as missing —
    // a false positive that would have made this gate untrustworthy on day one.
    if (target.startsWith(SCOPE)) {
      const resolved = resolveTypesEntry(target);
      if (!resolved.error) for (const n of readDeclaredExports(resolved.path, seen)) names.add(n);
      continue;
    }
    const rel = target.replace(/\.js$/, '');
    for (const cand of [`${rel}.d.ts`, `${rel}.d.mts`, join(rel, 'index.d.ts')]) {
      for (const n of readDeclaredExports(join(dirname(dtsPath), cand), seen)) names.add(n);
    }
  }
  return names;
}

/** Every entrypoint of every workspace package that exports `name` — powers the fix hint. */
function findEntrypointsExporting(name) {
  const hits = [];
  for (const dir of ['gds', 'gds-core', 'gds-theme', 'gds-admin', 'gds-a11y', 'gds-compliance']) {
    const pkgJsonPath = join(ROOT, 'packages', dir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    for (const subpath of Object.keys(pkg.exports ?? {})) {
      const resolved = resolveTypesEntry(`${pkg.name}${subpath === '.' ? '' : subpath.slice(1)}`);
      if (resolved.error) continue;
      if (readDeclaredExports(resolved.path).has(name)) {
        hits.push(`${pkg.name}${subpath === '.' ? '' : subpath.slice(1)}`);
      }
    }
  }
  return hits;
}

const specifiers = FIXTURE_SOURCES.flatMap(parseNamedImports);
if (specifiers.length === 0) {
  console.error('FAIL smoke import surface: no scoped imports found in the fixture sources.');
  console.error('  A vacuous pass is worse than a failure — the fixture may have moved.');
  process.exit(1);
}

const violations = [];
for (const spec of specifiers) {
  const resolved = resolveTypesEntry(spec.specifier);
  if (resolved.error) {
    violations.push({ ...spec, missing: spec.names, reason: resolved.error, availableFrom: [] });
    continue;
  }
  const declared = readDeclaredExports(resolved.path);
  const missing = spec.names.filter((n) => !declared.has(n));
  if (missing.length) {
    violations.push({
      ...spec, missing, reason: `not exported from ${spec.specifier}`,
      availableFrom: [...new Set(missing.flatMap(findEntrypointsExporting))].filter((e) => e !== spec.specifier),
    });
  }
}

if (violations.length) {
  console.error('FAIL smoke import surface\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    '${v.specifier}' — ${v.reason}`);
    console.error(`    missing: ${v.missing.join(', ')}`);
    if (v.availableFrom.length) console.error(`    -> available from: ${v.availableFrom.join(', ')}`);
    console.error('');
  }
  console.error(`${violations.length} violation(s). Fix the fixture import or the exports map before publishing.`);
  process.exit(1);
}

console.log(`Smoke import surface verified: ${specifiers.length} scoped specifier(s), 0 violations.`);
