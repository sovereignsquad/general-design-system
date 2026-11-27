// React Server Component safety of the packages' `/server` entries (#1002).
//
// Follows every module a `/server` entry loads on the server: the entry, the modules it
// imports, and onward, stopping at modules marked 'use client' (those load on the client, and
// a server module may render what they export as JSX). Imports of `@sovereignsquad/gds-theme`
// are followed into that package's source. Two rules for every module reached that is not
// 'use client':
//
// 1. It calls no React hook and no createContext. React's server build has neither.
// 2. It calls no function, constructs nothing, and reads no property from an export of a
//    'use client' module. On the server those exports are references, not values; only
//    rendering them as JSX (or passing them along) works.
// 3. It passes no function as a prop to a component from a 'use client' module. React cannot
//    send a function from a Server Component to a client component.
//
// Usage: node scripts/verify-server-entry-boundaries.mjs

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const root = resolve(import.meta.dirname, '..');

const ENTRIES = ['packages/gds-theme/src/server.ts', 'packages/gds-core/src/server.ts', 'packages/gds-admin/src/server.ts'];
const PACKAGE_SOURCE = {
  '@sovereignsquad/gds-theme': 'packages/gds-theme/src/index.ts',
  '@sovereignsquad/gds-theme/server': 'packages/gds-theme/src/server.ts',
  '@sovereignsquad/gds-theme/client': 'packages/gds-theme/src/client.ts',
  '@sovereignsquad/gds-core': 'packages/gds-core/src/index.ts',
  '@sovereignsquad/gds-core/server': 'packages/gds-core/src/server.ts',
  '@sovereignsquad/gds-core/client': 'packages/gds-core/src/client.ts',
};
const HOOK = /^use[A-Z0-9]/;

const modules = new Map();

function resolveFile(from, spec) {
  if (PACKAGE_SOURCE[spec]) return resolve(root, PACKAGE_SOURCE[spec]);
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(from), spec);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`, base]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function load(file) {
  if (modules.has(file)) return modules.get(file);
  const source = readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const isClient = ast.program.directives.some((d) => d.value.value === 'use client');
  const imports = new Map(); // local name -> { file, imported }
  const reexports = new Map(); // exported name -> { file, imported }
  const starReexports = [];
  const localExports = new Set();
  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration' && node.importKind !== 'type') {
      const target = resolveFile(file, node.source.value);
      if (!target) continue;
      for (const s of node.specifiers) {
        if (s.importKind === 'type') continue;
        const imported = s.type === 'ImportSpecifier' ? (s.imported.name ?? s.imported.value) : s.type === 'ImportDefaultSpecifier' ? 'default' : '*';
        imports.set(s.local.name, { file: target, imported });
      }
    } else if (node.type === 'ExportNamedDeclaration' && node.source && node.exportKind !== 'type') {
      const target = resolveFile(file, node.source.value);
      if (!target) continue;
      for (const s of node.specifiers) {
        if (s.exportKind === 'type') continue;
        reexports.set(s.exported.name ?? s.exported.value, { file: target, imported: s.local.name ?? s.local.value });
      }
    } else if (node.type === 'ExportAllDeclaration' && node.exportKind !== 'type') {
      const target = resolveFile(file, node.source.value);
      if (target) starReexports.push(target);
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const d = node.declaration;
      if (d.id?.name) localExports.add(d.id.name);
      for (const decl of d.declarations ?? []) if (decl.id?.name) localExports.add(decl.id.name);
    }
  }
  const info = { file, source, ast, isClient, imports, reexports, starReexports, localExports };
  modules.set(file, info);
  return info;
}

/** The module that defines `name` as exported from `file`, following re-export chains. */
function definingModule(file, name, seen = new Set()) {
  const key = `${file}#${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  const info = load(file);
  if (info.localExports.has(name)) return info;
  const re = info.reexports.get(name);
  if (re) return definingModule(re.file, re.imported, seen);
  for (const star of info.starReexports) {
    const found = definingModule(star, name, seen);
    if (found) return found;
  }
  return null;
}

const problems = [];
const visited = new Set();
const queue = ENTRIES.map((e) => resolve(root, e));
let serverModules = 0;

while (queue.length) {
  const file = queue.shift();
  if (visited.has(file)) continue;
  visited.add(file);
  const info = load(file);
  if (info.isClient) continue;
  serverModules += 1;
  for (const { file: target } of info.imports.values()) queue.push(target);
  for (const { file: target } of info.reexports.values()) queue.push(target);
  for (const target of info.starReexports) queue.push(target);

  const rel = relative(root, file);
  const clientBinding = (name) => {
    const imp = info.imports.get(name);
    if (!imp) return null;
    if (imp.imported === '*') return load(imp.file).isClient ? relative(root, imp.file) : null;
    const owner = definingModule(imp.file, imp.imported);
    return owner?.isClient ? relative(root, owner.file) : null;
  };
  traverse(info.ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const name = callee.type === 'Identifier' ? callee.name
        : callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name : null;
      const line = path.node.loc.start.line;
      if (name && (HOOK.test(name) || name === 'createContext')) {
        problems.push(`${rel}:${line} calls ${name}() but is not 'use client'. Mark the module 'use client', or move the hook into one.`);
        return;
      }
      if (callee.type === 'Identifier') {
        const owner = clientBinding(callee.name);
        if (owner) problems.push(`${rel}:${line} calls ${callee.name}(), an export of the 'use client' module ${owner}. On the server it is a reference; move ${callee.name} into a module without 'use client'.`);
      }
    },
    NewExpression(path) {
      if (path.node.callee.type !== 'Identifier') return;
      const owner = clientBinding(path.node.callee.name);
      if (owner) problems.push(`${rel}:${path.node.loc.start.line} constructs ${path.node.callee.name} from the 'use client' module ${owner}.`);
    },
    JSXOpeningElement(path) {
      const nameNode = path.node.name;
      if (nameNode.type !== 'JSXIdentifier') return;
      const owner = clientBinding(nameNode.name);
      if (!owner) return;
      for (const attr of path.node.attributes) {
        if (attr.type !== 'JSXAttribute' || attr.value?.type !== 'JSXExpressionContainer') continue;
        const expr = attr.value.expression;
        let isFunction = expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression';
        // A call in a callback-named prop is a factory returning a function (renderer={make()}).
        if (!isFunction && expr.type === 'CallExpression') isFunction = /^(on[A-Z]|render)/.test(attr.name.name);
        if (!isFunction && expr.type === 'Identifier') {
          const binding = path.scope.getBinding(expr.name);
          const node = binding?.path.node;
          isFunction = Boolean(node && (node.type === 'FunctionDeclaration'
            || (node.type === 'VariableDeclarator' && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init?.type))));
        }
        // A function nested in an object or array prop (columns={[{ render: (row) => … }]}) is
        // just as unsendable; JSX nested in a prop is fine and is not searched.
        if (!isFunction && (expr.type === 'ObjectExpression' || expr.type === 'ArrayExpression')) {
          const stack = [expr];
          while (stack.length && !isFunction) {
            const n = stack.pop();
            if (!n || typeof n !== 'object') continue;
            if (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression' || n.type === 'ObjectMethod') { isFunction = true; break; }
            if (n.type === 'JSXElement' || n.type === 'JSXFragment') continue;
            for (const key of Object.keys(n)) {
              if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
              const v = n[key];
              if (Array.isArray(v)) stack.push(...v); else if (v && typeof v.type === 'string') stack.push(v);
            }
          }
        }
        if (isFunction) problems.push(`${rel}:${attr.loc.start.line} passes a function (${attr.name.name}) to <${nameNode.name}>, a component from the 'use client' module ${owner}. Mark this module 'use client', or pass data instead.`);
      }
    },
    MemberExpression(path) {
      const object = path.node.object;
      if (object.type !== 'Identifier') return;
      if (path.parentPath.isCallExpression() && path.parentPath.node.callee === path.node && HOOK.test(path.node.property?.name ?? '')) return;
      const owner = clientBinding(object.name);
      if (owner) problems.push(`${rel}:${path.node.loc.start.line} reads ${object.name}.${path.node.property?.name ?? '[…]'} from the 'use client' module ${owner}. On the server it is a reference.`);
    },
  });
}

if (problems.length > 0) {
  console.error(`Server entry boundary check failed (${problems.length}):`);
  for (const p of [...new Set(problems)]) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Server entry boundary check passed: ${serverModules} modules load on the server from ${ENTRIES.length} /server entries; none calls a hook or createContext, calls into a 'use client' module, or passes a function to a client component.`);
