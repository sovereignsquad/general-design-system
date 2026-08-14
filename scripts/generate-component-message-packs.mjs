// Issue 617 — keep the 12 gds-core locale packs in step with the `t()` calls in the components.
//
// The packs are DERIVED FROM THE CALL SITES, not maintained by hand (Rule 14). Every
// `t('gds.x.y', 'Default')` in `packages/gds-core/src` is the single source of truth for both the
// key and its English text; this script reads them and writes what is missing into each pack.
// A hand-maintained pack drifts the moment a component changes its wording, and nothing notices —
// the component keeps rendering its inline fallback while the pack serves the old string to every
// other locale.
//
// Existing entries are never overwritten. Once a locale has a translation, it is that locale's,
// and re-running must not silently replace a corrected string with a fresh machine guess.
//
// The non-English text is MACHINE TRANSLATION. Human review is a separate later pass and this
// script does not claim to have done it.
//
// Run: node scripts/generate-component-message-packs.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { translate, TRANSLATION_LOCALES } from './lib/translate.mjs';

const traverse = traverseModule.default ?? traverseModule;

const root = process.cwd();
const srcDir = resolve(root, 'packages/gds-core/src');
const localeDir = join(srcDir, 'locales');

/** Every `t('id', 'English')` call in the components, as id -> English text. */
export function collectMessageDefaults() {
  const found = new Map();
  const conflicts = [];

  const files = readdirSync(srcDir)
    .filter((name) => (name.endsWith('.tsx') || name.endsWith('.ts')) && !name.includes('.test.'));

  for (const name of files) {
    const source = readFileSync(join(srcDir, name), 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    traverse(ast, {
      CallExpression(path) {
        const { callee, arguments: args } = path.node;
        if (callee.type !== 'Identifier' || callee.name !== 't') return;
        if (args.length < 2) return;
        if (args[0].type !== 'StringLiteral' || args[1].type !== 'StringLiteral') return;

        const [id, text] = [args[0].value, args[1].value];
        // One id, two different English texts means one of the call sites renders copy the packs
        // will never serve. That is a source defect, not something to resolve by picking a winner.
        if (found.has(id) && found.get(id) !== text) {
          conflicts.push(`${id}: ${JSON.stringify(found.get(id))} vs ${JSON.stringify(text)} (${name})`);
        }
        found.set(id, text);
      },
    });
  }

  return { defaults: found, conflicts };
}

/** Parse a pack file into an ordered id -> text map, and keep its header comment. */
function readPack(locale) {
  const source = readFileSync(join(localeDir, `${locale}.ts`), 'utf8');
  const body = /export const \w+ = (\{[\s\S]*\n\});/.exec(source);
  if (!body) throw new Error(`Could not parse locale pack ${locale}.ts`);
  const entries = new Map(Object.entries(Function(`return (${body[1]});`)()));
  return { source, body: body[0], entries };
}

/**
 * APPEND, never re-serialize.
 *
 * Rewriting the whole object from a parsed map is the obvious implementation and it renormalized
 * every existing entry's quoting — a 2850-line diff for 70 new strings, and it broke a gate
 * mutant that anchors on the literal text of a pack line. Existing lines are left byte-for-byte
 * as they are; new ones go in before the closing brace.
 */
function appendEntries(source, additions) {
  const lines = additions.map(([id, text]) => `  '${id}': ${JSON.stringify(text)},`);
  const close = source.lastIndexOf('\n};');
  if (close === -1) throw new Error('Could not find the end of the pack object.');
  return `${source.slice(0, close)}\n${lines.join('\n')}${source.slice(close)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { defaults, conflicts } = collectMessageDefaults();
  if (conflicts.length) {
    console.error('Conflicting English text for one message id:');
    for (const conflict of conflicts) console.error(`- ${conflict}`);
    process.exit(1);
  }

  console.log(`${defaults.size} message ids in source.`);

  // Per LOCALE, against every source id — never against en's pack. A first version computed
  // one "missing" list from en, so a run that appended en but failed one locale's translate
  // call left that locale short FOREVER: the next run saw en complete and appended nothing.
  // zh was in exactly that state when the parity gate caught it.
  for (const locale of ['en', ...TRANSLATION_LOCALES]) {
    const pack = readPack(locale);
    const additions = [];
    for (const [id, text] of defaults) {
      if (pack.entries.has(id)) continue;
      additions.push([id, locale === 'en' ? text : await translate(text, locale)]);
    }
    if (additions.length === 0) continue;
    writeFileSync(join(localeDir, `${locale}.ts`), appendEntries(pack.source, additions));
    console.log(`${locale}: +${additions.length}`);
  }
}
