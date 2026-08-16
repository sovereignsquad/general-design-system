// Generates per-locale blocks in a site copy file (page-copy.ts, site-copy.ts).
//
// `translateSiteDom` skips text inside `a`, `button`, `label`, `option` and similar — most of
// what these maps contain — so each locale needs its own real block, not a runtime overlay.
//
// Translations come from the same endpoint `generate-site-phrase-translations.mjs` uses.
//
// Formatting is preserved by splicing the `en` block's exact source and substituting only the
// string values, back to front so earlier offsets stay valid.
//
// Usage: node scripts/generate-page-copy-locales.mjs <file> <locale> [<locale> ...]

import { readFileSync, writeFileSync } from 'node:fs';
import { request } from 'node:https';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';

const root = process.cwd();
const [relativeFile, ...targetLocales] = process.argv.slice(2);

if (!relativeFile || targetLocales.length === 0) {
  console.error('Usage: node scripts/generate-page-copy-locales.mjs <file> <locale> [<locale> ...]');
  process.exit(1);
}

const filePath = resolve(root, relativeFile);

// Identifier/route values, never prose — translating href/id would break links and lookups.
const NON_PROSE_KEYS = new Set(['id', 'href', 'to', 'key', 'icon', 'action', 'variant', 'tone', 'color']);

function translate(text, locale) {
  return new Promise((resolveTranslation) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${locale}&dt=t&q=${encodeURIComponent(text)}`;
    const req = request(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolveTranslation(parsed?.[0]?.map((entry) => entry?.[0] ?? '').join('') || text);
        } catch {
          resolveTranslation(text);
        }
      });
    });
    req.setTimeout(8000, () => { req.destroy(); resolveTranslation(text); });
    req.on('error', () => resolveTranslation(text));
    req.end();
  });
}

const source = readFileSync(filePath, 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });

// Locale ids read from gds-theme (same source the font policy and leakage detector use).
const localeCatalog = new Set(
  [...readFileSync(resolve(root, 'packages/gds-theme/src/i18n.ts'), 'utf8')
    .matchAll(/^\s{2}(\w+):\s*\{[^}]*script:\s*'[^']+'/gm)].map((match) => match[1]),
);

/**
 * A locale map: has an `en` property and every key is a known locale id.
 *
 * Matched structurally, not by name or nesting depth — `page-copy.ts` holds maps at the top
 * level; `site-copy.ts` nests them inside `headerContextCopy`.
 */
function findCopyMaps() {
  const maps = [];

  function walk(node) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'ObjectExpression') {
      const props = node.properties.filter((p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier');
      const isLocaleMap = props.length > 0
        && props.every((p) => localeCatalog.has(p.key.name))
        && props.some((p) => p.key.name === 'en');
      const en = props.find((p) => p.key.name === 'en');

      if (isLocaleMap && en) {
        maps.push({ en, last: props[props.length - 1], existing: props.map((p) => p.key.name) });
        return; // Do not descend: an inner `en` belongs to this block, not a nested map.
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object' && value.type) walk(value);
    }
  }

  walk(ast.program);
  return maps;
}

/** Offsets of every translatable string inside a block, with the raw text to translate. */
function collectStrings(node, out = [], parentKey = null) {
  if (!node || typeof node !== 'object') return out;

  if (node.type === 'StringLiteral') {
    if (!NON_PROSE_KEYS.has(parentKey) && /[A-Za-z]{2}/.test(node.value)) {
      out.push({ start: node.start, end: node.end, text: node.value, kind: 'string' });
    }
    return out;
  }
  if (node.type === 'TemplateElement') {
    // Only the literal chunks; `${stableGdsVersion}` must survive untouched.
    if (/[A-Za-z]{2}/.test(node.value.raw)) {
      out.push({ start: node.start, end: node.end, text: node.value.raw, kind: 'template' });
    }
    return out;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;

    // Never descend into an object property's key — it's an identifier the code looks up by, not copy.
    if (node.type === 'ObjectProperty' && key === 'key') continue;

    if (Array.isArray(value)) {
      for (const child of value) collectStrings(child, out, parentKey);
    } else if (value && typeof value === 'object' && value.type) {
      const nextKey = node.type === 'ObjectProperty' && node.key?.type === 'Identifier' && key === 'value'
        ? node.key.name
        : parentKey;
      collectStrings(value, out, nextKey);
    }
  }
  return out;
}

const maps = findCopyMaps();
// Asserted against the actual 'hu' block count, not just > 0 — catches a partial walk before it writes a partial file.
const huBlocks = [...source.matchAll(/^\s*hu: [{']/gm)].length;
if (maps.length < huBlocks) {
  console.error(`Parsed ${maps.length} locale maps but the file has ${huBlocks} blocks reaching 'hu' — refusing to write a partial result.`);
  process.exit(1);
}

// One request per distinct phrase per locale, not per occurrence.
const phrases = new Set();
for (const map of maps) {
  for (const item of collectStrings(map.en.value)) phrases.add(item.text);
}
console.log(`${maps.length} copy maps, ${phrases.size} distinct phrases, locales: ${targetLocales.join(', ')}`);

const memo = new Map();
async function translateAll(locale) {
  const list = [...phrases];
  const results = new Map();
  let index = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (index < list.length) {
      const phrase = list[index];
      index += 1;
      const cacheKey = `${locale}::${phrase}`;
      if (!memo.has(cacheKey)) memo.set(cacheKey, await translate(phrase, locale));
      results.set(phrase, memo.get(cacheKey));
    }
  }));
  return results;
}

/** Escapes a translated value for the quoting style already used at that offset. */
function encode(value, kind, quote) {
  if (kind === 'template') return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const escaped = value.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

let output = source;
// Back to front across the whole file so every recorded offset stays valid.
const insertions = [];

// A map that already has the target locale is skipped, not an error — `siteLocaleRegistry` is
// a hand-maintained locale map that must be left alone.
for (const locale of targetLocales) {
  const translations = await translateAll(locale);
  for (const map of maps) {
    if (map.existing.includes(locale)) continue;
    const blockSource = source.slice(map.en.value.start, map.en.value.end);
    const items = collectStrings(map.en.value).sort((a, b) => b.start - a.start);

    let block = blockSource;
    for (const item of items) {
      const translated = translations.get(item.text) ?? item.text;
      const relStart = item.start - map.en.value.start;
      const relEnd = item.end - map.en.value.start;
      const quote = item.kind === 'string' ? source[item.start] : null;
      block = block.slice(0, relStart) + encode(translated, item.kind, quote) + block.slice(relEnd);
    }

    insertions.push({ at: map.last.end, text: `,\n    ${locale}: ${block}` });
  }
  console.log(`  ${locale}: prepared ${maps.length} blocks`);
}

for (const insertion of insertions.sort((a, b) => b.at - a.at)) {
  output = output.slice(0, insertion.at) + insertion.text + output.slice(insertion.at);
}

writeFileSync(filePath, output);
console.log(`Wrote ${insertions.length} locale blocks to ${relativeFile}`);
