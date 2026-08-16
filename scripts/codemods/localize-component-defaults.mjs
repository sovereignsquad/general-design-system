// Routes a component's default copy through the locale catalogue (`getGdsMessages`).
//
// Transform:
//
//   emptyTitle = 'No results',                    ->  emptyTitle: emptyTitleProp,
//   …                                             ->  const emptyTitle = emptyTitleProp
//                                                        ?? t('gds.asyncSurface.emptyTitle', 'No results');
//
// Shadowing the parameter name keeps existing uses of `emptyTitle` in the body working
// unchanged. The English literal stays as the fallback argument, so a missing key
// renders the same text as today rather than a key id.
//
// Run: node scripts/codemods/localize-component-defaults.mjs [--check] <file...>

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--'));

// Copy is classified by prop name, not value shape: `emptyTitle`, `retryLabel`,
// `placeholder` name text a reader sees; `icon`, `variant`, `presentation` never do.
const COPY_PROP = /(?:label|title|description|placeholder|text|message|caption|hint|summary|announcement)$/i;

// A copy-named prop can still hold a CSS value or format token, so the value is checked too.
const NOT_COPY_VALUE = [
  /^(?:clamp|calc|var|min|max|rgba?|hsla?)\(/,
  /\d\s*(?:rem|px|em|%|vw|vh|ch|fr)\b/,
  /^#[0-9a-f]{3,8}$/i,
];

function isCopy(propName, value) {
  if (!COPY_PROP.test(propName)) return false;
  if (value.trim().length < 2) return false;
  return !NOT_COPY_VALUE.some((re) => re.test(value.trim()));
}

/**
 * `AsyncSurface.tsx` -> `asyncSurface`; `GdsDataTable.client.tsx` -> `gdsDataTable`;
 * `AISearchCard.tsx` -> `aiSearchCard` (leading-acronym case handled explicitly).
 */
function namespaceFor(file) {
  const base = file.split('/').pop().replace(/\.client\.tsx$|\.tsx$/, '');
  const acronym = /^([A-Z]{2,})(?=[A-Z][a-z]|$)/.exec(base);
  if (acronym) return acronym[1].toLowerCase() + base.slice(acronym[1].length);
  return base.charAt(0).toLowerCase() + base.slice(1);
}

let changedFiles = 0;
let changedProps = 0;
const catalogue = new Map();

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const ns = namespaceFor(file);
  const edits = [];

  for (const node of ast.program.body) {
    const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (!decl || decl.type !== 'FunctionDeclaration') continue;
    // Components only: an exported function whose first parameter is a destructured props object.
    const param = decl.params[0];
    if (!param || param.type !== 'ObjectPattern') continue;

    const resolved = [];
    for (const prop of param.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      if (prop.value.type !== 'AssignmentPattern') continue;
      if (prop.value.left.type !== 'Identifier') continue;
      if (prop.value.right.type !== 'StringLiteral') continue;

      const name = prop.value.left.name;
      const text = prop.value.right.value;
      if (!isCopy(name, text)) continue;

      const id = `gds.${ns}.${name}`;
      // Same text under one key is fine; different text is a collision.
      if (catalogue.has(id) && catalogue.get(id) !== text) {
        console.error(`COLLISION ${id}: ${JSON.stringify(catalogue.get(id))} vs ${JSON.stringify(text)}`);
        process.exitCode = 1;
      }
      catalogue.set(id, text);
      edits.push({ start: prop.start, end: prop.end, replacement: `${name}: ${name}Prop` });
      resolved.push(`  const ${name} = ${name}Prop ?? t('${id}', ${JSON.stringify(text)});`);
      changedProps += 1;
    }

    if (resolved.length === 0) continue;

    // Checked per function, not per file: another function in the same file may already call the hook.
    const bodyText = source.slice(decl.body.start, decl.body.end);
    const existingHook = /const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useGdsTranslation\(\);/.exec(bodyText);
    const needsHook = !existingHook;
    // If the hook call already exists, insert after it, not at body start, to avoid using `t` before its declaration.
    const bodyStart = existingHook
      ? decl.body.start + existingHook.index + existingHook[0].length
      : decl.body.start + 1;
    const preamble = [
      '',
      ...(needsHook ? ['  const { t } = useGdsTranslation();'] : []),
      ...resolved,
      '',
    ].join('\n');
    edits.push({ start: bodyStart, end: bodyStart, replacement: preamble });
  }

  if (edits.length === 0) continue;

  let output = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
  }

  if (!/import \{[^}]*useGdsTranslation/.test(output)) {
    // Import beside the other gds-theme imports when there is one, otherwise after the first line.
    const themeImport = /import \{([^}]*)\} from '@sovereignsquad\/gds-theme';/.exec(output);
    if (themeImport) {
      output = output.replace(themeImport[0], `import {${themeImport[1]}, useGdsTranslation } from '@sovereignsquad/gds-theme';`);
    } else {
      const firstNewline = output.indexOf('\n') + 1;
      output = `${output.slice(0, firstNewline)}import { useGdsTranslation } from '@sovereignsquad/gds-theme';\n${output.slice(firstNewline)}`;
    }
  }

  changedFiles += 1;
  if (!check) writeFileSync(file, output);
}

console.log(`${check ? 'Would localize' : 'Localized'} ${changedProps} default(s) across ${changedFiles} file(s).`);
writeFileSync(
  'scripts/codemods/.localize-catalogue.json',
  `${JSON.stringify(Object.fromEntries([...catalogue].sort()), null, 2)}\n`,
);
console.log(`Catalogue keys written: ${catalogue.size}`);
