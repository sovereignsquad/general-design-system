// The public-component census — ONE definition of "a GDS component", shared.
//
// Issue 605. `verify-component-catalog-parity` owned this logic privately, and the reference
// site stated the resulting number as a hardcoded "250+". Copying the logic to derive the
// number for the site would have created the same defect the token work keeps finding: one
// fact, two implementations, free to drift apart. The gate and the site now read the same
// function, so the number on the page is the number the gate enforces — by construction, not
// by anyone remembering to update a sentence.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;

export function collectRuntimeExports(file) {
  const names = new Set();
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/export\s+(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) {
    names.add(match[1]);
  }
  return names;
}

// Resolve a module specifier reachable from a package entrypoint to a concrete
// source file, so we only scan what is genuinely re-exported through the public
// index/client/server barrels — not internal-only or `.test` files.
export function resolveModule(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

// Follow `export * from './X'` / `export { ... } from './X'` re-exports from the
// package's public entrypoints (index/client/server) and collect every public
// runtime export name they expose. Returns the union across the given entrypoints.
export function collectPublicComponentExports(entrypoints) {
  const names = new Set();
  const visited = new Set();

  function visitFile(file) {
    if (!file || visited.has(file)) return;
    visited.add(file);

    // Direct runtime exports declared in this file.
    for (const name of collectRuntimeExports(file)) {
      names.add(name);
    }

    // Follow re-export barrels.
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/export\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g)) {
      const spec = match[1];
      if (!spec.startsWith('.')) continue; // external re-exports are not GDS components
      const resolved = resolveModule(file, spec);
      if (resolved) visitFile(resolved);
    }
  }

  for (const entrypoint of entrypoints) {
    if (existsSync(entrypoint)) visitFile(entrypoint);
  }

  return names;
}

// A "UI component" name: PascalCase (starts uppercase, has a lowercase letter),
// excluding hooks (use*). Type-only exports never appear here because we only
// scan runtime `export function|const|class` declarations.
export function isComponentName(name) {
  return /^[A-Z]/.test(name) && /[a-z]/.test(name) && !/^use[A-Z]/.test(name);
}

/** Package entrypoints the census walks. */
export const PACKAGE_ENTRYPOINTS = {
  '@sovereignsquad/gds-core': [
    resolve(ROOT, 'packages/gds-core/src/index.ts'),
    resolve(ROOT, 'packages/gds-core/src/client.ts'),
    resolve(ROOT, 'packages/gds-core/src/server.ts'),
  ],
  '@sovereignsquad/gds-admin': [
    resolve(ROOT, 'packages/gds-admin/src/index.ts'),
    resolve(ROOT, 'packages/gds-admin/src/client.ts'),
    resolve(ROOT, 'packages/gds-admin/src/server.ts'),
  ],
};

/**
 * Every public UI component name exported by the GDS packages.
 *
 * A "UI component": PascalCase, excluding hooks. Type-only exports never appear because only
 * runtime `export function|const|class` declarations are scanned.
 */
export function collectPublicComponents() {
  const all = new Set();
  for (const entrypoints of Object.values(PACKAGE_ENTRYPOINTS)) {
    for (const name of collectPublicComponentExports(entrypoints)) {
      if (isComponentName(name)) all.add(name);
    }
  }
  return all;
}
