// Derives the usage code shown under each pattern demo from the demo source itself, so the code
// on the page is the code that renders the demo.
//
// For each `case '<id>':` in renderEntryDemo (apps/playground/src/pattern-pages.tsx):
// - the returned JSX, or the statements of the case;
// - a bare `<SomeDemo />` is replaced by the source of that component;
// - every top-level declaration of this file it references (transitively) is prepended in
//   source order; names imported from site modules are listed in a comment, not inlined;
// - package imports are rebuilt from the identifiers the snippet uses.
//
// Run: node scripts/generate-pattern-usage.mjs [--check]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const ROOT = process.cwd();
const PAGES = join(ROOT, 'apps/playground/src/pattern-pages.tsx');
const OUT = join(ROOT, 'apps/playground/src/generated-pattern-usage.ts');
const DATA = join(ROOT, 'apps/playground/public/pattern-usage.json');
const check = process.argv.includes('--check');

const modules = new Map();

function loadModule(path) {
  if (modules.has(path)) return modules.get(path);
  const source = readFileSync(path, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const declarations = new Map();
  const imports = new Map();
  for (const node of ast.program.body) {
    const target = node.type === 'ExportNamedDeclaration' && node.declaration ? node.declaration : node;
    if (target.type === 'ImportDeclaration') {
      for (const specifier of target.specifiers) {
        imports.set(specifier.local.name, {
          from: target.source.value,
          imported: specifier.type === 'ImportSpecifier' ? specifier.imported.name : specifier.type === 'ImportDefaultSpecifier' ? 'default' : '*',
          typeOnly: target.importKind === 'type' || specifier.importKind === 'type',
        });
      }
    } else if (target.type === 'FunctionDeclaration' && target.id) {
      declarations.set(target.id.name, target);
    } else if (target.type === 'VariableDeclaration') {
      for (const declarator of target.declarations) {
        if (declarator.id.type === 'Identifier') declarations.set(declarator.id.name, target);
      }
    } else if ((target.type === 'TSTypeAliasDeclaration' || target.type === 'TSInterfaceDeclaration') && target.id) {
      declarations.set(target.id.name, target);
    }
  }
  const module = { path, source, ast, declarations, imports };
  modules.set(path, module);
  return module;
}

// Node source with continuation lines shifted left by the node's starting column.
function text(module, node) {
  const column = node.start - (module.source.lastIndexOf('\n', node.start - 1) + 1);
  const strip = new RegExp(`^ {0,${column}}`);
  return module.source.slice(node.start, node.end).split('\n').map((line, index) => (index === 0 ? line : line.replace(strip, ''))).join('\n');
}

// Identifiers a node references that are not bound inside it.
function freeIdentifiers(module, node) {
  const names = new Set();
  const file = { type: 'File', program: { type: 'Program', body: [node.type.endsWith('Statement') || node.type.endsWith('Declaration') ? node : { type: 'ExpressionStatement', expression: node }], sourceType: 'module' } };
  traverse(file, {
    noScope: false,
    ReferencedIdentifier(path) {
      const name = path.node.name;
      if (!path.scope.hasBinding(name, true) || path.scope.getBinding(name)?.scope.block === file.program) names.add(name);
    },
    JSXIdentifier(path) {
      if (path.parentPath.isJSXOpeningElement() || path.parentPath.isJSXClosingElement() || path.parentPath.isJSXMemberExpression()) {
        const name = path.node.name;
        if (/^[A-Z]/.test(name) && !(path.parentPath.isJSXMemberExpression() && path.parentPath.node.property === path.node)) names.add(name);
      }
    },
  });
  return names;
}

// Collects the declarations and package imports a snippet needs.
function collect(module, names, localScope, state) {
  for (const name of names) {
    if (localScope?.has(name)) {
      const statement = localScope.get(name);
      if (!state.seenLocal.has(statement)) {
        state.seenLocal.add(statement);
        collect(module, freeIdentifiers(module, statement), localScope, state);
        state.locals.push(text(module, statement));
      }
      continue;
    }
    if (module.declarations.has(name)) {
      const node = module.declarations.get(name);
      const key = `${module.path}:${node.start}`;
      if (state.seen.has(key)) continue;
      state.seen.add(key);
      collect(module, freeIdentifiers(module, node), null, state);
      state.declarations.push({ order: String(node.start).padStart(8, '0'), code: text(module, node) });
      continue;
    }
    const imported = module.imports.get(name);
    if (!imported) continue;
    if (imported.from.startsWith('.')) {
      state.relative.add(`${name} (${imported.from})`);
      continue;
    }
    const key = `${imported.typeOnly ? 'type:' : ''}${imported.from}`;
    if (!state.packages.has(key)) state.packages.set(key, new Set());
    state.packages.get(key).add(imported.imported === name ? name : `${imported.imported} as ${name}`);
  }
}

const pages = loadModule(PAGES);
const renderEntryDemo = pages.declarations.get('renderEntryDemo');
if (!renderEntryDemo) throw new Error('renderEntryDemo not found in pattern-pages.tsx');

// Statements in renderEntryDemo before the switch (shared helpers such as a vocabulary pack).
const localScope = new Map();
let switchNode = null;
for (const statement of renderEntryDemo.body.body) {
  if (statement.type === 'SwitchStatement') { switchNode = statement; break; }
  if (statement.type === 'VariableDeclaration') {
    for (const declarator of statement.declarations) if (declarator.id.type === 'Identifier') localScope.set(declarator.id.name, statement);
  }
}
if (!switchNode) throw new Error('renderEntryDemo has no switch statement');

const usage = {};
let pending = [];
for (const switchCase of switchNode.cases) {
  if (!switchCase.test) break;
  pending.push(switchCase.test.value);
  if (switchCase.consequent.length === 0) continue;

  const body = switchCase.consequent.length === 1 && switchCase.consequent[0].type === 'BlockStatement' ? switchCase.consequent[0].body : switchCase.consequent;
  let snippetNodes = body;
  let snippet;
  const only = body.length === 1 && body[0].type === 'ReturnStatement' ? body[0].argument : null;
  const wrapper = only?.type === 'JSXElement' && only.openingElement.attributes.length === 0 && only.children.length === 0 && only.openingElement.name.type === 'JSXIdentifier'
    ? only.openingElement.name.name
    : null;
  if (wrapper && pages.declarations.has(wrapper)) {
    // The component's own source is the usage; collect() adds it with its dependencies.
    snippetNodes = [only];
    snippet = '';
  } else if (only) {
    snippetNodes = [only];
    snippet = text(pages, only);
  } else {
    snippet = body.map((node) => text(pages, node)).join('\n');
  }

  const state = { seen: new Set(), seenLocal: new Set(), declarations: [], locals: [], packages: new Map(), relative: new Set() };
  const names = new Set();
  for (const node of snippetNodes) for (const name of freeIdentifiers(pages, node)) names.add(name);
  collect(pages, names, localScope, state);

  const imports = [...state.packages.entries()]
    .sort(([a], [b]) => a.replace(/^type:/, '').localeCompare(b.replace(/^type:/, '')) || a.localeCompare(b))
    .map(([key, list]) => {
      const typeOnly = key.startsWith('type:');
      return `import ${typeOnly ? 'type ' : ''}{ ${[...list].sort().join(', ')} } from '${key.replace(/^type:/, '')}';`;
    });
  const parts = [
    imports.join('\n'),
    state.relative.size ? `// Site-local, not part of the packages: ${[...state.relative].sort().join(', ')}` : '',
    state.declarations.sort((a, b) => a.order.localeCompare(b.order)).map((entry) => entry.code).join('\n\n'),
    state.locals.join('\n'),
    snippet,
  ].filter(Boolean);
  const code = parts.join('\n\n');
  for (const id of pending) usage[id] = code;
  pending = [];
}

const ids = Object.keys(usage).sort();
const data = `${JSON.stringify(Object.fromEntries(ids.map((id) => [id, usage[id]])))}\n`;
const index = `// Generated from apps/playground/src/pattern-pages.tsx by scripts/generate-pattern-usage.mjs. Do not edit by hand.

/** Pattern entries whose demo has usage code in public/pattern-usage.json. */
export const patternUsageIds: ReadonlySet<string> = new Set(${JSON.stringify(ids)});

let usage: Promise<Record<string, string>> | null = null;

/** Usage code for a pattern demo, fetched once for all entries on first request. */
export function loadPatternUsage(id: string): Promise<string> {
  usage ??= fetch(\`\${import.meta.env.BASE_URL}pattern-usage.json\`).then((response) => {
    if (!response.ok) throw new Error(\`pattern-usage.json: HTTP \${response.status}\`);
    return response.json() as Promise<Record<string, string>>;
  });
  const request = usage;
  return request.then((map) => map[id] ?? Promise.reject(new Error(\`No usage code for \${id}\`))).catch((error: unknown) => {
    if (usage === request) usage = null;
    throw error;
  });
}
`;

const outputs = [[OUT, index], [DATA, data]];
if (check) {
  const stale = outputs.filter(([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content).map(([path]) => path.slice(ROOT.length + 1));
  if (stale.length) {
    console.error(`FAIL pattern usage is stale (${stale.join(', ')}). Run node scripts/generate-pattern-usage.mjs and commit the result.`);
    process.exit(1);
  }
  console.log(`Pattern usage is current: ${ids.length} entries.`);
} else {
  for (const [path, content] of outputs) writeFileSync(path, content);
  console.log(`Wrote usage code for ${ids.length} pattern entries to apps/playground/public/pattern-usage.json.`);
}
