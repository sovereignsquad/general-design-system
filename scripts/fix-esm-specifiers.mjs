// Rewrites relative import and export specifiers in an unbundled ESM build so Node can resolve
// them: `./Foo` becomes `./Foo.mjs`, and a directory import becomes `./dir/index.mjs`.
// esbuild leaves specifiers as written when it does not bundle, and Node's ESM loader does not
// add extensions. Usage: node scripts/fix-esm-specifiers.mjs <dist directory>

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const distDir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(distDir)) {
  console.error('Usage: node scripts/fix-esm-specifiers.mjs <dist directory>');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*)\2/g;
let rewritten = 0;
const unresolved = [];

for (const file of walk(distDir).filter((f) => f.endsWith('.mjs'))) {
  const source = readFileSync(file, 'utf8');
  const next = source.replace(SPECIFIER, (match, lead, quote, spec) => {
    if (/\.(mjs|js|json|css)$/.test(spec)) return match;
    const base = resolve(dirname(file), spec);
    let target = null;
    if (existsSync(`${base}.mjs`)) target = `${spec}.mjs`;
    else if (existsSync(join(base, 'index.mjs'))) target = `${spec.replace(/\/$/, '')}/index.mjs`;
    if (!target) {
      unresolved.push(`${file.slice(distDir.length + 1)}: ${spec}`);
      return match;
    }
    rewritten += 1;
    return `${lead}${quote}${target}${quote}`;
  });
  if (next !== source) writeFileSync(file, next);
}

if (unresolved.length > 0) {
  console.error(`fix-esm-specifiers: ${unresolved.length} relative specifier(s) resolve to no built file:`);
  for (const u of unresolved) console.error(`- ${u}`);
  process.exit(1);
}
console.log(`fix-esm-specifiers: ${rewritten} relative specifier(s) made explicit in ${distDir}.`);
