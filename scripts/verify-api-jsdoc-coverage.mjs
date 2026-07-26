import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

// JSDoc coverage gate (#414). Asserts that public exports across the
// consumer-facing packages carry a preceding JSDoc block, so the documented
// surface can't silently regress and the ship-with-docs Definition of Done is
// mechanically enforced rather than relying on review discipline.
//
// A "public export" is a top-level `export interface|type|const|function|
// async function|class|enum <Name>` in a package `src` file (excluding test
// files and the re-export-only barrels index/client/server). It counts as
// documented when the line directly above the `export` ends a block comment
// (`*/`). The bar is a floor, not 100%, to tolerate the occasional trivial
// re-export type without forcing noise comments.

const root = process.cwd();
const packages = ['gds-core', 'gds-admin', 'gds-theme', 'gds-a11y'];
const barrels = new Set(['index.ts', 'client.ts', 'server.ts']);
const EXPORT_RE = /^export (?:async function|function|interface|const|type|class|enum) (\w+)/;

// Minimum documented fraction of public exports, per package and overall.
// The backfill (#414) brought this to 100%; the floor guards against major
// regression while leaving a small buffer for the occasional edge case.
const MIN_COVERAGE = 0.95;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      out.push(...walk(path));
    } else if ((path.endsWith('.ts') || path.endsWith('.tsx')) && !path.endsWith('.test.ts') && !path.endsWith('.test.tsx') && !barrels.has(entry)) {
      out.push(path);
    }
  }
  return out;
}

function measure(pkg) {
  const srcRoot = resolve(root, 'packages', pkg, 'src');
  let total = 0;
  let documented = 0;
  const undocumented = [];
  for (const file of walk(srcRoot)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const match = EXPORT_RE.exec(lines[i]);
      if (!match) continue;
      total += 1;
      const prev = i > 0 ? lines[i - 1].trim() : '';
      if (prev.endsWith('*/')) {
        documented += 1;
      } else {
        undocumented.push(`${file.replace(`${root}/`, '')}: ${match[1]}`);
      }
    }
  }
  return { total, documented, undocumented };
}

const failures = [];
let grandTotal = 0;
let grandDocumented = 0;

for (const pkg of packages) {
  const { total, documented, undocumented } = measure(pkg);
  grandTotal += total;
  grandDocumented += documented;
  const coverage = total === 0 ? 1 : documented / total;
  console.log(`${pkg}: ${documented}/${total} public exports documented (${(coverage * 100).toFixed(1)}%).`);
  if (coverage < MIN_COVERAGE) {
    failures.push(`${pkg} JSDoc coverage ${(coverage * 100).toFixed(1)}% is below the ${(MIN_COVERAGE * 100).toFixed(0)}% floor. Undocumented (${undocumented.length}): ${undocumented.slice(0, 20).join(', ')}${undocumented.length > 20 ? ', …' : ''}`);
  }
}

const overall = grandTotal === 0 ? 1 : grandDocumented / grandTotal;
console.log(`overall: ${grandDocumented}/${grandTotal} public exports documented (${(overall * 100).toFixed(1)}%).`);
if (overall < MIN_COVERAGE) {
  failures.push(`Overall JSDoc coverage ${(overall * 100).toFixed(1)}% is below the ${(MIN_COVERAGE * 100).toFixed(0)}% floor.`);
}

if (failures.length > 0) {
  console.error('API JSDoc coverage verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('API JSDoc coverage verification passed.');
