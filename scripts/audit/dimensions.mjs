// Phase 4b/4c/4d of docs/DEEP_AUDIT_PLAN.md — named and underived dimensions.
//
//   4b  language variants   (resolves Q5)
//   4c  theme-controlled elements  (resolves Q6)
//   4d  underived dimensions — registry atom kinds with no coverage from 1-3
//
// Output: audit/dimensions.json

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { measureCorpusLeakage } from '../lib/i18n-leakage.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;
const out = {};

// ── 4b. Language variants ───────────────────────────────────────────────────
{
  const pkgDir = join(ROOT, 'packages/gds-core/src/locales');
  const siteDir = join(ROOT, 'apps/playground/src/generated-site-phrases');

  const keysOf = (file) => {
    const src = readFileSync(file, 'utf8');
    return new Set([...src.matchAll(/^\s*["']([^"']+)["']\s*:/gm)].map((m) => m[1]));
  };

  const pkgLocales = readdirSync(pkgDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => f.replace('.ts', ''));
  const siteLocales = readdirSync(siteDir).filter((f) => f.endsWith('.ts')).map((f) => f.replace('.ts', ''));

  // Key parity: every pack must carry the same key set as the reference pack.
  const pkgKeys = Object.fromEntries(pkgLocales.map((l) => [l, keysOf(join(pkgDir, `${l}.ts`))]));
  const siteKeys = Object.fromEntries(siteLocales.map((l) => [l, keysOf(join(siteDir, `${l}.ts`))]));

  const pkgRef = pkgKeys.en ?? pkgKeys[pkgLocales[0]];
  const siteRef = siteKeys[siteLocales[0]];

  const parity = (packs, ref, refName) => Object.entries(packs).map(([l, k]) => ({
    locale: l, keys: k.size,
    missing: [...ref].filter((x) => !k.has(x)).length,
    extra: [...k].filter((x) => !ref.has(x)).length,
  })).sort((a, b) => b.missing - a.missing);

  // English leakage.
  //
  // MEASUREMENT CHANGED in issue 588, stated rather than slipped in (the F24 rule). The old
  // figure counted every value byte-identical to its English source, which put ~46 non-defects
  // per pack into the metric: `"you@company.com"`, `"Cmd+1"`, `"npm run verify:references"`,
  // component-name lists, and — in the package corpus — genuine cognates, since `Pause`,
  // `Filter` and `Message` are real German and French words. Of the 15 package values it
  // flagged, exactly ONE was a defect.
  //
  // The measurement now lives in scripts/lib/i18n-leakage.mjs, shared with the generator that
  // repairs leakage and the gate that fails on it, and requires peer evidence that the phrase
  // is translatable plus a script-aware test. `untranslated` therefore counts provable misses
  // rather than identical strings; the two numbers answer different questions and must not be
  // compared. `identicalToEnglish` keeps the old raw count for continuity.
  const leakage = [];
  for (const [d, label, referenceIsKey] of [[siteDir, 'site', true], [pkgDir, 'package', false]]) {
    for (const row of measureCorpusLeakage(d, { referenceIsKey }).rows) {
      leakage.push({
        corpus: label, locale: row.locale, total: row.total,
        untranslated: row.leaked, rate: row.rate,
      });
    }
  }

  out.languageVariants = {
    packageLocales: pkgLocales, siteLocales,
    // Q5: which package locales have no site pack at all?
    packageLocalesWithNoSitePack: pkgLocales.filter((l) => !siteLocales.includes(l) && l !== 'en'),
    siteLocalesWithNoPackagePack: siteLocales.filter((l) => !pkgLocales.includes(l)),
    packageParity: parity(pkgKeys, pkgRef),
    siteParity: parity(siteKeys, siteRef),
    englishLeakage: leakage.sort((a, b) => b.rate - a.rate),
    rtlLocales: ['ar', 'he'].filter((l) => pkgLocales.includes(l) || siteLocales.includes(l)),
  };
}

// ── 4c. Theme-controlled elements (Q6) ──────────────────────────────────────
{
  const css = readFileSync(join(ROOT, 'packages/gds-theme/styles.css'), 'utf8');
  const readAll = (dir, exts, acc = []) => {
    if (!existsSync(dir)) return acc;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) readAll(p, exts, acc); }
      else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
    }
    return acc;
  };
  const ts = readAll(join(ROOT, 'packages'), ['.ts', '.tsx'])
    .filter((f) => !f.includes('.test.'))
    .map((f) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''))
    .join('\n');

  // Mantine component variables GDS explicitly sets vs. leaves at framework default.
  const mantineVarsGdsSets = new Set([
    ...[...css.matchAll(/(--mantine-[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]),
    ...[...ts.matchAll(/['"`](--mantine-[a-zA-Z0-9-]+)['"`]\s*:/g)].map((m) => m[1]),
  ]);
  const mantineVarsReferenced = new Set([
    ...[...css.matchAll(/var\(\s*(--mantine-[a-zA-Z0-9-]+)/g)].map((m) => m[1]),
    ...[...ts.matchAll(/var\(\s*(--mantine-[a-zA-Z0-9-]+)/g)].map((m) => m[1]),
  ]);
  // Mantine theme keys GDS overrides via the theme object.
  const themeSrc = readFileSync(join(ROOT, 'packages/gds-theme/src/theme.ts'), 'utf8');
  const componentsOverridden = [...themeSrc.matchAll(/^\s{4}(\w+):\s*\{/gm)].map((m) => m[1]);

  out.themeControl = {
    mantineVarsGdsDeclares: mantineVarsGdsSets.size,
    mantineVarsGdsConsumes: mantineVarsReferenced.size,
    mantineVarsGdsConsumesButNeverDeclares: [...mantineVarsReferenced].filter((v) => !mantineVarsGdsSets.has(v)).length,
    mantineComponentsWithGdsDefaults: componentsOverridden.length,
    mantineComponentsList: componentsOverridden,
  };
}

// ── 4d. Underived dimensions ────────────────────────────────────────────────
{
  const reg = JSON.parse(readFileSync(join(ROOT, 'audit/registry.json'), 'utf8'));
  const coveredByPhase = {
    'token-declared': 'Phase 1 + 2', 'token-emitted': 'Phase 2', 'token-published': 'Phase 2',
    'token-referenced': 'Phase 2', 'motion-token': 'Phase 4a', 'motion-shipped': 'Phase 4a',
    'motion-keyframes': 'Phase 4a', 'motion-reduced-guard': 'Phase 4a',
    'interaction-state': 'Phase 4a', 'locale-pack-package': 'Phase 4b', 'locale-pack-site': 'Phase 4b',
    'theme': 'Phase 1', 'route': 'Phase 1 (4 of 24)', 'pattern': 'Phase 1 (partial)',
  };
  const uncovered = Object.keys(reg.counts).filter((k) => !coveredByPhase[k]);
  out.underived = {
    registryKinds: Object.keys(reg.counts).length,
    coveredKinds: Object.keys(reg.counts).length - uncovered.length,
    uncoveredKinds: uncovered.map((k) => ({ kind: k, atoms: reg.counts[k] })),
  };
}

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/dimensions.json'), JSON.stringify(out, null, 2));

const lv = out.languageVariants;
console.log('Phase 4b — language variants');
console.log(`  package locales: ${lv.packageLocales.length}  site locales: ${lv.siteLocales.length}`);
console.log(`  Q5 -> package locales with NO site pack: ${lv.packageLocalesWithNoSitePack.join(', ') || 'none'}`);
console.log(`  site locales with no package pack:       ${lv.siteLocalesWithNoPackagePack.join(', ') || 'none'}`);
console.log('  key parity (package):');
for (const p of lv.packageParity.filter((x) => x.missing || x.extra)) console.log(`    ${p.locale}: ${p.keys} keys, missing ${p.missing}, extra ${p.extra}`);
console.log('  key parity (site):');
for (const p of lv.siteParity.filter((x) => x.missing || x.extra)) console.log(`    ${p.locale}: ${p.keys} keys, missing ${p.missing}, extra ${p.extra}`);
console.log('  untranslated (value identical to English):');
for (const l of lv.englishLeakage.filter((x) => x.untranslated > 0)) console.log(`    ${l.corpus}/${l.locale}: ${l.untranslated}/${l.total} (${l.rate}%)`);
console.log('');
const tc = out.themeControl;
console.log('Phase 4c — theme control (Q6)');
console.log(`  --mantine-* GDS declares:                 ${tc.mantineVarsGdsDeclares}`);
console.log(`  --mantine-* GDS consumes:                 ${tc.mantineVarsGdsConsumes}`);
console.log(`  consumed but never declared by GDS:       ${tc.mantineVarsGdsConsumesButNeverDeclares}`);
console.log(`  Mantine components with GDS defaults:     ${tc.mantineComponentsWithGdsDefaults}`);
console.log('');
console.log('Phase 4d — underived dimensions');
console.log(`  registry kinds: ${out.underived.registryKinds}  covered: ${out.underived.coveredKinds}`);
for (const u of out.underived.uncoveredKinds) console.log(`    UNCOVERED  ${u.kind} (${u.atoms} atoms)`);
