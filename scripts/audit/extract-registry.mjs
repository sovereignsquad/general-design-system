// Phase 0 of docs/DEEP_AUDIT_PLAN.md — ground-truth registry.
//
// Derives the audit's checklist from the codebase so that no human list is
// required and nothing can be forgotten. If it exists in source, it enters the
// audit automatically. This is the mechanism that makes the plan's no-assuming
// rule mechanically true rather than a promise.
//
// Output: audit/registry.json  (schema: AuditRegistry in the plan, §Phase 0)

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('../..', import.meta.url).pathname;
const atoms = [];
let nextId = 0;

const add = (kind, name, file, line, extra = {}) => {
  atoms.push({ id: `${kind}:${name}#${nextId++}`, kind, name, source: { file: relative(ROOT, file), line }, ...extra });
};

/** Walk a directory for files matching a predicate. */
function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '__snapshots__') continue;
      walk(p, pred, out);
    } else if (pred(p)) out.push(p);
  }
  return out;
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// ── tokens: published DTCG graph ────────────────────────────────────────────
{
  const g = JSON.parse(readFileSync(join(ROOT, 'tokens/gds.tokens.json'), 'utf8'));
  const file = join(ROOT, 'tokens/gds.tokens.json');
  for (const [theme, roles] of Object.entries(g.gds ?? {})) {
    for (const role of Object.keys(roles)) {
      if (role.startsWith('$')) continue;
      add('token-published', `${theme}.${role}`, file, 0, { theme, role });
    }
  }
}

// ── tokens: every --gds-* / --mantine-* declared anywhere in shipped CSS ─────
{
  const file = join(ROOT, 'packages/gds-theme/styles.css');
  const css = readFileSync(file, 'utf8');
  const declared = new Set();
  for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
    if (declared.has(m[1])) continue;
    declared.add(m[1]);
    add('token-declared', m[1], file, lineOf(css, m.index));
  }
  // consumers: every var() reference — a var() with no declaration is a dangling token
  const referenced = new Set();
  for (const m of css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    if (referenced.has(m[1])) continue;
    referenced.add(m[1]);
    add('token-referenced', m[1], file, lineOf(css, m.index));
  }
}

// ── tokens emitted from TS (semantic roles live here, not in styles.css) ────
for (const file of walk(join(ROOT, 'packages'), (p) => p.endsWith('.ts') || p.endsWith('.tsx'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/['"`](--gds-[a-zA-Z0-9-]+)['"`]/g)) {
    add('token-emitted', m[1], file, lineOf(src, m.index));
  }
}

// ── public exports ──────────────────────────────────────────────────────────
for (const pkg of readdirSync(join(ROOT, 'packages'))) {
  for (const entry of ['index.ts', 'client.ts', 'server.ts']) {
    const file = join(ROOT, 'packages', pkg, 'src', entry);
    if (!existsSync(file)) continue;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
      for (const raw of m[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) add('export', name, file, lineOf(src, m.index), { package: pkg, entry });
      }
    }
    for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) {
      add('export', m[1], file, lineOf(src, m.index), { package: pkg, entry });
    }
  }
}

// ── component props (the variation surface Rule 2 requires be shown) ────────
for (const file of walk(join(ROOT, 'packages'), (p) => p.endsWith('.tsx') && !p.includes('.test.'))) {
  const src = readFileSync(file, 'utf8');
  for (const iface of src.matchAll(/export interface (\w*Props)\s*\{([\s\S]*?)\n\}/g)) {
    for (const prop of iface[2].matchAll(/^\s{2}(\w+)\??:\s*([^;\n]+)/gm)) {
      add('prop', `${iface[1]}.${prop[1]}`, file, lineOf(src, iface.index), { type: prop[2].trim().slice(0, 120) });
      // union literal types are the variation set that must be demonstrated
      const lits = [...prop[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
      if (lits.length > 1) for (const v of lits) add('variant', `${iface[1]}.${prop[1]}=${v}`, file, lineOf(src, iface.index));
    }
  }
}

// ── motion ──────────────────────────────────────────────────────────────────
{
  const mf = join(ROOT, 'packages/gds-theme/src/motion.ts');
  const src = readFileSync(mf, 'utf8');
  for (const m of src.matchAll(/^\s{2}([a-zA-Z][\w-]*):\s*(?:\d|'|")/gm)) add('motion-token', m[1], mf, lineOf(src, m.index));
  const cf = join(ROOT, 'packages/gds-theme/styles.css');
  const css = readFileSync(cf, 'utf8');
  for (const m of css.matchAll(/(transition|animation)(-[a-z]+)?\s*:/g)) add('motion-shipped', m[0].replace(/\s*:$/, ''), cf, lineOf(css, m.index));
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) add('motion-keyframes', m[1], cf, lineOf(css, m.index));
  for (const m of css.matchAll(/prefers-reduced-motion/g)) add('motion-reduced-guard', 'prefers-reduced-motion', cf, lineOf(css, m.index));
  for (const m of css.matchAll(/:(hover|focus-visible|active|disabled|focus-within)\b/g)) add('interaction-state', m[1], cf, lineOf(css, m.index));
}

// ── locales ─────────────────────────────────────────────────────────────────
for (const [dir, kind] of [
  [join(ROOT, 'packages/gds-core/src/locales'), 'locale-pack-package'],
  [join(ROOT, 'apps/playground/src/generated-site-phrases'), 'locale-pack-site'],
]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'index.ts')) {
    const file = join(dir, f);
    const src = readFileSync(file, 'utf8');
    const keys = (src.match(/^\s*["'][^"']+["']\s*:/gm) ?? []).length;
    add(kind, f.replace('.ts', ''), file, 1, { keyCount: keys });
  }
}

// ── routes + patterns ───────────────────────────────────────────────────────
{
  const af = join(ROOT, 'apps/playground/src/App.tsx');
  const src = readFileSync(af, 'utf8');
  for (const m of src.matchAll(/<Route\s+path="([^"]+)"/g)) add('route', m[1], af, lineOf(src, m.index));
  const rf = join(ROOT, 'apps/playground/src/pattern-registry.ts');
  const reg = readFileSync(rf, 'utf8');
  for (const m of reg.matchAll(/^\s{4}id: '([^']+)'/gm)) add('pattern', m[1], rf, lineOf(reg, m.index));
}

// ── themes + accents ────────────────────────────────────────────────────────
{
  const vf = join(ROOT, 'packages/gds-theme/src/vibe-themes.ts');
  const src = readFileSync(vf, 'utf8');
  for (const m of src.matchAll(/^\s{2,4}id: '([^']+)'/gm)) add('theme', m[1], vf, lineOf(src, m.index));
  // Issue 594 moved the accent definitions out of GdsBadge. This read a literal hex table
  // there; that table is now DERIVED from the axis, so the extractor read a computed
  // expression and found nothing. The kind fell to zero and the EXPECTED_KINDS guard caught
  // it — which is the guard working, and the reason accents are read from their source now.
  const af = join(ROOT, 'packages/gds-theme/src/accent-axis.ts');
  const a = readFileSync(af, 'utf8');
  const ramps = a.match(/GDS_DEFAULT_ACCENT_AXIS[^=]*=\s*\{[\s\S]*?ramps:\s*\{([\s\S]*?)\n  \},/);
  if (ramps) for (const m of ramps[1].matchAll(/(\w+):\s*\{\s*base:\s*'(#[0-9a-fA-F]{3,8})'/g)) {
    add('accent', m[1], af, lineOf(a, ramps.index), { value: m[2] });
  }
}

// ── emit ────────────────────────────────────────────────────────────────────
const commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
const byKind = {};
for (const a of atoms) byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;

// A kind resolving to zero means extraction is broken, not that the system lacks it.
const EXPECTED_KINDS = [
  'token-published', 'token-declared', 'token-referenced', 'token-emitted', 'export', 'prop',
  'variant', 'motion-token', 'motion-shipped', 'motion-keyframes', 'interaction-state', 'locale-pack-package',
  'locale-pack-site', 'route', 'pattern', 'theme', 'accent',
];
const missing = EXPECTED_KINDS.filter((k) => !byKind[k]);

mkdirSync(join(ROOT, 'audit'), { recursive: true });
const outPath = join(ROOT, 'audit/registry.json');
const payload = { generatedAt: null, commit, counts: byKind, atoms };

// --check: drift-verify the committed registry instead of rewriting it, matching the
// verify:tokens-dtcg pattern already in the release chain. `commit` is excluded from
// the comparison: it changes every commit by construction, so including it would make
// the registry appear to drift on every single run and train everyone to ignore it.
const stable = (o) => JSON.stringify({ counts: o.counts, atoms: o.atoms }, null, 2);
if (process.argv.includes('--check')) {
  if (!existsSync(outPath)) {
    console.error('FAIL audit/registry.json is missing. Run `npm run registry:build`.');
    process.exit(1);
  }
  const committed = JSON.parse(readFileSync(outPath, 'utf8'));
  if (stable(committed) !== stable(payload)) {
    const a = Object.entries(committed.counts ?? {});
    const b = Object.entries(payload.counts);
    console.error('FAIL audit/registry.json has drifted from source. Run `npm run registry:build` and commit the result.');
    for (const [kind, count] of b) {
      const was = committed.counts?.[kind];
      if (was !== count) console.error(`  ${kind}: committed ${was ?? 0} -> extracted ${count}`);
    }
    for (const [kind, count] of a) {
      if (payload.counts[kind] === undefined) console.error(`  ${kind}: committed ${count} -> extracted 0 (kind disappeared)`);
    }
    process.exit(1);
  }
  console.log(`Registry drift check passed: ${atoms.length} atoms across ${Object.keys(byKind).length} kinds.`);
  process.exit(0);
}

writeFileSync(outPath, JSON.stringify(payload, null, 2));

console.log(`Phase 0 registry — commit ${commit.slice(0, 7)}`);
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(6)}  ${k}`);
}
console.log(`  ${String(atoms.length).padStart(6)}  TOTAL`);
if (missing.length) {
  console.error(`\nFAIL: kinds resolved to zero (extraction broken, not absent): ${missing.join(', ')}`);
  process.exit(1);
}
