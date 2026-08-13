// Phase 2 of docs/DEEP_AUDIT_PLAN.md — forward trace.
//
// Rule 2: no GDS token may be absent from the lists, the live proofs, the
// explanations, the variation displays, or the use cases. A token missing any of
// the five is a gap finding (DO-178C forward traceability) regardless of whether
// the token itself works.
//
// Output: audit/forward-trace.json

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;

// ── 1. The token universe: every --gds-* GDS actually defines ───────────────
const cssPath = join(ROOT, 'packages/gds-theme/styles.css');
const cssRaw = readFileSync(cssPath, 'utf8');
const css = cssRaw.replace(/\/\*[\s\S]*?\*\//g, '');

const readAll = (dir, exts, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) readAll(p, exts, acc); }
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
};

const tsFiles = readAll(join(ROOT, 'packages'), ['.ts', '.tsx']).filter((f) => !f.includes('.test.'));
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments incl. JSDoc
  .replace(/^\s*\/\/.*$/gm, '');        // line comments
const tsBlob = tsFiles.map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n');

const tokens = new Map(); // name -> { declaredIn: [] }
for (const m of css.matchAll(/(--gds-[a-zA-Z0-9-]+)\s*:/g)) {
  (tokens.get(m[1]) ?? tokens.set(m[1], { declaredIn: [] }).get(m[1])).declaredIn.push('styles.css');
}
for (const m of tsBlob.matchAll(/['"`](--gds-[a-zA-Z0-9-]+)['"`]\s*:/g)) {
  (tokens.get(m[1]) ?? tokens.set(m[1], { declaredIn: [] }).get(m[1])).declaredIn.push('ts-emitter');
}
// `-dark` siblings are the scheme partner of their base, not independent tokens.
const isDarkSibling = (t) => t.endsWith('-dark') && tokens.has(t.slice(0, -5));

// ── 2. Obligation sources ───────────────────────────────────────────────────
const dtcg = JSON.parse(readFileSync(join(ROOT, 'tokens/gds.tokens.json'), 'utf8'));
const publishedRoles = new Set();
for (const roles of Object.values(dtcg.gds ?? {})) for (const r of Object.keys(roles)) if (!r.startsWith('$')) publishedRoles.add(r);

const docFiles = [
  ...readAll(join(ROOT, 'docs'), ['.md']),
  ...readdirSync(ROOT).filter((f) => f.endsWith('.md')).map((f) => join(ROOT, f)),
];
const docBlob = docFiles.map((f) => `\n===FILE:${relative(ROOT, f)}\n` + readFileSync(f, 'utf8')).join('\n');

const siteFiles = readAll(join(ROOT, 'apps/playground/src'), ['.ts', '.tsx'])
  .filter((f) => !f.includes('generated-site-phrases') && !f.includes('.test.'));
const siteBlob = siteFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

// Phase 1 told us which tokens actually resolved to a rendered value.
let renderedTokens = new Set();
const btPath = join(ROOT, 'audit/backward-trace.json');
if (existsSync(btPath)) {
  // backward-trace records the token that matched each traced observation only in
  // aggregate; re-derive "is applied" from whether the token is referenced by any
  // shipped CSS rule or component style, which is what makes it reachable at all.
  const referenced = new Set([...css.matchAll(/var\(\s*(--gds-[a-zA-Z0-9-]+)/g)].map((m) => m[1]));
  const tsReferenced = new Set([...tsBlob.matchAll(/var\(\s*(--gds-[a-zA-Z0-9-]+)/g)].map((m) => m[1]));
  renderedTokens = new Set([...referenced, ...tsReferenced]);
}

// ── 3. Evaluate the five obligations ────────────────────────────────────────
const rows = [];
for (const [name, meta] of tokens) {
  if (isDarkSibling(name)) continue;
  const role = name.replace(/^--gds-/, '');

  const listed = publishedRoles.has(role)
    || new RegExp(`\\b${name}\\b`).test(docBlob) && /API_REFERENCE|DESIGN_TOKENS_DTCG/.test(docBlob.split(name)[0].split('===FILE:').pop() ?? '');
  const listedSimple = publishedRoles.has(role) || docBlob.includes(name);

  const demoed = renderedTokens.has(name);

  // Explained = appears in prose with surrounding sentence text, not just a code fence.
  const explained = (() => {
    const idx = docBlob.indexOf(name);
    if (idx === -1) return false;
    const window = docBlob.slice(Math.max(0, idx - 300), idx + 300);
    return /[a-z]{4,}\s+[a-z]{4,}\s+[a-z]{4,}/.test(window.replace(/```[\s\S]*?```/g, ''));
  })();

  // Variations shown = the token's value differs across themes in the published
  // graph (i.e. its range is actually displayed), or the site renders a swatch set.
  const variationsShown = publishedRoles.has(role)
    ? new Set(Object.values(dtcg.gds).map((r) => JSON.stringify(r[role]?.$value))).size > 1
    : /ThemeExplorer|VibeThemePicker|swatch/i.test(siteBlob) && siteBlob.includes(name);

  // Use case = prose containing a directive phrase near the token.
  const useCase = (() => {
    const idx = docBlob.indexOf(name);
    if (idx === -1) return false;
    const window = docBlob.slice(Math.max(0, idx - 500), idx + 500).toLowerCase();
    return /use (this|it|when)|used for|use to|apply (this|it|when)|for the |reserved for/.test(window);
  })();

  rows.push({
    token: name, role, declaredIn: [...new Set(meta.declaredIn)],
    listed: listedSimple, demoed, explained, variationsShown, useCase,
    gaps: [
      !listedSimple && 'listed', !demoed && 'demoed', !explained && 'explained',
      !variationsShown && 'variationsShown', !useCase && 'useCase',
    ].filter(Boolean),
  });
}

// ── 4. Report ───────────────────────────────────────────────────────────────
const ob = ['listed', 'demoed', 'explained', 'variationsShown', 'useCase'];
const counts = Object.fromEntries(ob.map((o) => [o, rows.filter((r) => r[o]).length]));
const complete = rows.filter((r) => r.gaps.length === 0);

const report = {
  tokenUniverse: rows.length,
  darkSiblingsExcluded: [...tokens.keys()].filter(isDarkSibling).length,
  cellsEvaluated: rows.length * ob.length,
  obligationsSatisfied: counts,
  confidence: {
    listed: 'high - direct lookup against the published DTCG graph and docs corpus',
    demoed: 'high - direct var() reachability from shipped CSS/TS',
    explained: 'medium - prose-window heuristic around the token name',
    variationsShown: 'LOW - proxy heuristic; a false negative here does not prove the site omits the variation',
    useCase: 'LOW - directive-phrase heuristic; same caveat',
  },
  publishedRoleOverlap: null,
  tokensSatisfyingAll: complete.length,
  tokensWithGaps: rows.length - complete.length,
  rows: rows.sort((a, b) => b.gaps.length - a.gaps.length),
};

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/forward-trace.json'), JSON.stringify(report, null, 2));

console.log('Phase 2 forward trace (Rule 2)');
console.log(`  token universe: ${rows.length}  (+${report.darkSiblingsExcluded} -dark scheme siblings excluded)`);
console.log(`  matrix cells:   ${report.cellsEvaluated}  (${rows.length} tokens x 5 obligations)`);
console.log('');
for (const o of ob) {
  const n = counts[o];
  const pct = ((n / rows.length) * 100).toFixed(0);
  console.log(`  ${o.padEnd(16)} ${String(n).padStart(4)}/${rows.length}  ${String(pct).padStart(3)}%   gap: ${rows.length - n}`);
}
console.log('');
console.log(`  tokens satisfying ALL FIVE: ${complete.length}/${rows.length}`);
console.log(`  tokens with >=1 gap:        ${report.tokensWithGaps}/${rows.length}`);
console.log('');
console.log('  worst offenders (all five missing):');
for (const r of report.rows.filter((x) => x.gaps.length === 5).slice(0, 12)) console.log(`    ${r.token}`);
