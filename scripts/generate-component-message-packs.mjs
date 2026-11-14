// Regenerates the gds-core locale packs from `t()` calls in packages/gds-core/src and packages/gds-admin/src.
//
// Existing entries are never overwritten.
//
// Non-English text is machine translation, not reviewed.
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
const adminSrcDir = resolve(root, 'packages/gds-admin/src');

/** Every `t('id', 'English')` call in the components, as id -> English text. */
export function collectMessageDefaults() {
  const found = new Map();
  const conflicts = [];

  // gds-admin components read the same packs, so their `t()` calls are collected too.
  const files = [srcDir, adminSrcDir].flatMap((dir) => readdirSync(dir)
    .filter((name) => (name.endsWith('.tsx') || name.endsWith('.ts')) && !name.includes('.test.'))
    .map((name) => join(dir, name)));

  for (const file of files) {
    const name = file.slice(root.length + 1);
    const source = readFileSync(file, 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    traverse(ast, {
      CallExpression(path) {
        const { callee, arguments: args } = path.node;
        if (callee.type !== 'Identifier' || callee.name !== 't') return;
        if (args.length < 2) return;
        if (args[0].type !== 'StringLiteral' || args[1].type !== 'StringLiteral') return;

        const [id, text] = [args[0].value, args[1].value];
        // Two different English texts for one id is a conflict, not resolved by picking one.
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
 * Appends new entries; never re-serializes the whole object. Existing lines are left
 * byte-for-byte; new ones go in before the closing brace.
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

  // Missing entries computed per locale against every source id, not from en's pack, so a
  // failed translate call for one locale isn't masked by en being complete.
  for (const locale of ['en', ...TRANSLATION_LOCALES]) {
    const pack = readPack(locale);
    const additions = [];
    let deferred = 0;
    for (const [id, text] of defaults) {
      if (pack.entries.has(id)) continue;
      if (locale === 'en') { additions.push([id, text]); continue; }
      const result = await translate(text, locale);
      // A failed call must not write English into a new entry: the next run skips any id the
      // pack already holds, so a transient failure would plant it permanently. Leaving the id
      // out is what makes "gets fixed on the next run" true (issue 660).
      if (result.ok) additions.push([id, result.text]);
      else deferred += 1;
    }
    if (deferred > 0) console.log(`${locale}: ${deferred} id(s) deferred — translation call failed, left for the next run.`);
    if (additions.length === 0) continue;
    writeFileSync(join(localeDir, `${locale}.ts`), appendEntries(pack.source, additions));
    console.log(`${locale}: +${additions.length}`);
  }
}
