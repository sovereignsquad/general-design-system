// Issue 617 — route a component's DEFAULT COPY through the locale catalogue.
//
// GDS components default their user-visible strings to English literals:
//
//   export function AsyncSurface({ emptyTitle = 'No results', … })
//
// The reference site hides this, because its phrase overlay rewrites the rendered DOM. A
// CONSUMER gets none of that: they install the package, set a locale, and their empty states,
// retry buttons and error titles are still English. So the site is translated while GDS is not.
//
// `getGdsMessages` already exists — 188 keys across 12 locales — and eight components already
// resolve through it. This codemod moves the rest onto the same path.
//
// THE TRANSFORM, and why this shape:
//
//   emptyTitle = 'No results',                    ->  emptyTitle: emptyTitleProp,
//   …                                             ->  const emptyTitle = emptyTitleProp
//                                                        ?? t('gds.asyncSurface.emptyTitle', 'No results');
//
// Shadowing the parameter name means every existing use of `emptyTitle` in the body keeps
// working untouched. Rewriting the use sites instead would be a far larger and riskier diff for
// no benefit. The English literal stays as the fallback argument, so a missing key renders the
// same text it does today rather than a key id.
//
// Run: node scripts/codemods/localize-component-defaults.mjs [--check] <file...>

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--'));

// COPY IS DECIDED BY THE PROP NAME, not by the shape of the value.
//
// A first cut classified by value and was wrong in both directions: it skipped `'Loading'` and
// `'Refreshing'` — real copy — because they look exactly like the icon keys `'Gallery'` and
// `'Notifications'`. No amount of pattern-matching on the string separates those, because there
// is nothing to separate: they are the same shape carrying different meanings.
//
// The prop name is unambiguous. `emptyTitle`, `retryLabel` and `placeholder` name text a reader
// sees; `icon`, `variant` and `presentation` never do.
const COPY_PROP = /(?:label|title|description|placeholder|text|message|caption|hint|summary|announcement)$/i;

// …but a copy-named prop can still hold a CSS value or a format token, so the value is checked too.
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
 * `AISearchCard.tsx` -> `aiSearchCard`.
 *
 * The leading-acronym case matters: a naive first-character lowercase produces `aISearchCard`,
 * which is the sort of key nobody wants to type into a translation file.
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
      // Two components in one file can share a prop name. Same text is harmless — they mean the
      // same thing and should share a key. DIFFERENT text under one key is a real collision: one
      // component would silently render the other's copy.
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

    // Per FUNCTION, not per file. A first cut tested the whole file, so a component in a file
    // where some OTHER function already called the hook got its `t(...)` calls without a `t` —
    // `SidebarNav` failed to compile for exactly that reason.
    const bodyText = source.slice(decl.body.start, decl.body.end);
    const existingHook = /const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useGdsTranslation\(\);/.exec(bodyText);
    const needsHook = !existingHook;
    // Where the resolved consts go. Body start is right only when this codemod adds the hook
    // itself. When the component ALREADY calls it, that call can sit anywhere in the body, and
    // going in above it puts a use of `t` before its declaration — `GdsSchemaForm` failed to
    // compile for exactly that reason. Land after the existing call instead.
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
