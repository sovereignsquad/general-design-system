// Regenerates the gds-core locale packs from `t()` calls in packages/gds-core/src.
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
    for (const [id, text] of defaults) {
      if (pack.entries.has(id)) continue;
      additions.push([id, locale === 'en' ? text : await translate(text, locale)]);
    }
    if (additions.length === 0) continue;
    writeFileSync(join(localeDir, `${locale}.ts`), appendEntries(pack.source, additions));
    console.log(`${locale}: +${additions.length}`);
  }
}
