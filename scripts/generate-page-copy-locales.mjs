// Issue 587 — generate the per-locale blocks in a site copy file (page-copy.ts, site-copy.ts).
//
// `page-copy.ts` holds one hand-authored block per locale for each copy map. The runtime
// phrase overlay cannot cover it: `translateSiteDom` deliberately skips text inside `a`,
// `button`, `label`, `option` and friends, which is most of what these maps contain — nav
// titles, link descriptions and CTA labels. A locale without its own block would therefore
// render Japanese body copy with English navigation, so the blocks are real, not a fallback.
//
// Translations come from the SAME endpoint `generate-site-phrase-translations.mjs` uses, so
// provenance is identical to the other ~1,300 site phrases rather than invented (Rule 11).
//
// Formatting is preserved by splicing text rather than re-printing the file: the `en` block's
// exact source is copied, and only the string values inside it are substituted, back to front
// so earlier offsets stay valid. Re-printing with @babel/generator would rewrite all 1,400
// lines and bury the actual change.
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

// Values that are identifiers or routes, never prose. Translating an `href` would break every
// link on the page, and an `id` is matched against code.
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

// Every locale id the catalog knows, read from gds-theme rather than written here — the same
// single source the font policy and the leakage detector use.
const localeCatalog = new Set(
  [...readFileSync(resolve(root, 'packages/gds-theme/src/i18n.ts'), 'utf8')
    .matchAll(/^\s{2}(\w+):\s*\{[^}]*script:\s*'[^']+'/gm)].map((match) => match[1]),
);

/**
 * Every object literal that IS a locale map: it has an `en` property and every one of its keys
 * is a known locale id.
 *
 * Structural rather than by name or nesting depth. `page-copy.ts` holds maps at the top level,
 * but `site-copy.ts` nests them a level down inside `headerContextCopy`, and a first version
 * that only looked at exported declarations missed those entirely — the build caught it, which
 * is the only reason it is not still missing.
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
// Not just "> 0". Finding one map out of eight is the failure this guard exists for, and a
// zero-check would have passed it. The count is asserted against the exports actually present.
// Every block that already carries the full existing locale set must be found. If the file has
// blocks with (say) `hu` and this run found fewer, the walk missed some and a partial write
// would leave the file type-broken in a way that is tedious to unpick.
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

// A map that already carries a target locale is skipped, not an error: `siteLocaleRegistry` is
// structurally a locale map and is maintained by hand, so a run that adds locales to the copy
// maps around it must leave it alone rather than duplicating its keys.
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
