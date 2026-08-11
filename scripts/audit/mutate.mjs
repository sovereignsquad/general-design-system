// Phase 5 of docs/DEEP_AUDIT_PLAN.md — mutation testing.
//
// A "zero violations" result is worthless until the audit is shown to detect real
// defects. Each mutant targets ONE specific claim the audit makes. A survivor
// means that claim is unsupported.
//
// Mutants are applied to a scratch copy of the file, the relevant analysis is
// re-run, and the mutant is KILLED if the analysis result changes in the expected
// direction. The original file is always restored.
//
// Output: audit/mutation-score.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../..', import.meta.url).pathname;
const run = (script) => JSON.parse(
  execFileSync('node', [join(ROOT, 'scripts/audit', script)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    && readFileSync(join(ROOT, 'audit', script.replace('extract-registry', 'registry').replace('.mjs', '.json')), 'utf8'),
);

const analyses = {
  registry: () => run('extract-registry.mjs'),
  forward: () => run('forward-trace.mjs'),
  dimensions: () => run('dimensions.mjs'),
};

/** Apply a text mutation, re-run an analysis, restore, and report. */
function mutate({ id, description, file, find, replace, analysis, detect, targets }) {
  const path = join(ROOT, file);
  const original = readFileSync(path, 'utf8');
  if (!original.includes(find)) {
    return { id, description, targets, status: 'INVALID', note: `anchor not found in ${file}` };
  }
  const baseline = analyses[analysis]();
  writeFileSync(path, original.split(find).join(replace));  // ALL occurrences: a single
  // replacement left other references intact and made M4 a no-op, which read as an
  // analysis survivor when it was really a weak mutant.
  let mutated, error = null;
  try { mutated = analyses[analysis](); } catch (e) { error = String(e).slice(0, 160); }
  writeFileSync(path, original); // ALWAYS restore

  if (error) return { id, description, targets, status: 'KILLED', how: `analysis errored: ${error}` };
  const verdict = detect(baseline, mutated);
  return { id, description, targets, status: verdict.killed ? 'KILLED' : 'SURVIVED', how: verdict.how };
}

const MUTANTS = [
  {
    id: 'M3', description: 'Remove a token from the published DTCG graph',
    targets: 'Phase 2 (listed obligation)',
    file: 'tokens/gds.tokens.json', analysis: 'forward',
    find: '"primary"', replace: '"primary_MUTANT"',
    detect: (b, m) => ({
      killed: m.obligationsSatisfied.listed !== b.obligationsSatisfied.listed
           || m.obligationsSatisfied.variationsShown !== b.obligationsSatisfied.variationsShown,
      how: `listed ${b.obligationsSatisfied.listed}->${m.obligationsSatisfied.listed}, variationsShown ${b.obligationsSatisfied.variationsShown}->${m.obligationsSatisfied.variationsShown}`,
    }),
  },
  {
    id: 'M4', description: 'Make a declared token unreachable (remove its only var() reference)',
    targets: 'Phase 2 (demoed obligation)',
    file: 'packages/gds-theme/styles.css', analysis: 'forward',
    find: 'var(--gds-focus-ring,', replace: 'var(--gds-focus-ring-MUTANT,',
    detect: (b, m) => ({
      killed: m.obligationsSatisfied.demoed < b.obligationsSatisfied.demoed,
      how: `demoed ${b.obligationsSatisfied.demoed}->${m.obligationsSatisfied.demoed}`,
    }),
  },
  {
    id: 'M5', description: 'Add a new undocumented token with no obligations met',
    targets: 'Phase 0 (registry) + Phase 2 (gap detection)',
    file: 'packages/gds-theme/styles.css', analysis: 'forward',
    find: '  --gds-motion-duration-instant: 0ms;',
    replace: '  --gds-motion-duration-instant: 0ms;\n  --gds-audit-mutant-token: #abcdef;',
    detect: (b, m) => ({
      killed: m.tokenUniverse > b.tokenUniverse && m.tokensWithGaps > b.tokensWithGaps,
      how: `universe ${b.tokenUniverse}->${m.tokenUniverse}, tokensWithGaps ${b.tokensWithGaps}->${m.tokensWithGaps}`,
    }),
  },
  {
    id: 'M6', description: 'Delete a locale key from one site pack',
    targets: 'Phase 4b (key parity)',
    file: 'apps/playground/src/generated-site-phrases/de.ts', analysis: 'dimensions',
    find: '  "', replace: '  "MUTANT_DELETED_KEY_',
    detect: (b, m) => {
      const bd = b.languageVariants.siteParity.find((x) => x.locale === 'de');
      const md = m.languageVariants.siteParity.find((x) => x.locale === 'de');
      return { killed: md.missing !== bd.missing || md.extra !== bd.extra || md.keys !== bd.keys,
        how: `de keys ${bd.keys}->${md.keys}, missing ${bd.missing}->${md.missing}, extra ${bd.extra}->${md.extra}` };
    },
  },
  {
    id: 'M7', description: 'Replace a translated string with its English source',
    targets: 'Phase 4b (English-leakage detection)',
    file: 'apps/playground/src/generated-site-phrases/es.ts', analysis: 'dimensions',
    // A site pack maps English phrase -> translation, so the leak signal is key === value.
    // The previous mutant changed both sides to DIFFERENT strings and could never trip it.
    find: '"Live Demos": "Demostraciones en vivo"', replace: '"Live Demos": "Live Demos"',
    detect: (b, m) => {
      const be = b.languageVariants.englishLeakage.find((x) => x.corpus === 'site' && x.locale === 'es');
      const me = m.languageVariants.englishLeakage.find((x) => x.corpus === 'site' && x.locale === 'es');
      return { killed: me.untranslated !== be.untranslated,
        how: `es untranslated ${be.untranslated}->${me.untranslated}` };
    },
  },
  {
    id: 'M11', description: 'Introduce an undeclared Mantine variable dependency',
    targets: 'Phase 4c (theme-control census)',
    file: 'packages/gds-theme/styles.css', analysis: 'dimensions',
    find: '  --gds-motion-duration-instant: 0ms;',
    replace: '  --gds-motion-duration-instant: var(--mantine-audit-mutant-var, 0ms);',
    detect: (b, m) => ({
      killed: m.themeControl.mantineVarsGdsConsumesButNeverDeclares > b.themeControl.mantineVarsGdsConsumesButNeverDeclares,
      how: `undeclared-consumed ${b.themeControl.mantineVarsGdsConsumesButNeverDeclares}->${m.themeControl.mantineVarsGdsConsumesButNeverDeclares}`,
    }),
  },
  {
    id: 'M12', description: 'Add a component prop variant with no demo obligation',
    targets: 'Phase 0 (registry variant extraction)',
    file: 'packages/gds-core/src/MapPanel.tsx', analysis: 'registry',
    find: '  minHeight?: number | string;',
    replace: "  minHeight?: number | string;\n  mutantVariant?: 'alpha' | 'beta' | 'gamma';",
    detect: (b, m) => ({
      killed: (m.counts.variant ?? 0) > (b.counts.variant ?? 0) && (m.counts.prop ?? 0) > (b.counts.prop ?? 0),
      how: `variants ${b.counts.variant}->${m.counts.variant}, props ${b.counts.prop}->${m.counts.prop}`,
    }),
  },
];

// Mutants requiring a full playground rebuild (Phase 1/3 render sweep) are NOT run
// here. Stating them rather than omitting them, per Rule 12.
const NOT_RUN = [
  { id: 'M1', description: 'Hardcode a radius equal to the default theme value', targets: 'Phase 1', reason: 'requires a playground rebuild between baseline and mutant' },
  { id: 'M2', description: 'Hardcode a colour not in any token', targets: 'Phase 1', reason: 'same' },
  { id: 'M8', description: 'Remove a prefers-reduced-motion guard', targets: 'Phase 4a', reason: 'Phase 4a was a manual analysis, not an automated script' },
  { id: 'M9', description: 'Set a focus-ring width to 0', targets: 'Phase 3', reason: 'Phase 3 not implemented' },
  { id: 'M10', description: 'Break a component under one theme only', targets: 'Phase 3', reason: 'Phase 3 not implemented' },
];

const results = [];
for (const m of MUTANTS) {
  process.stdout.write(`  ${m.id} … `);
  const r = mutate(m);
  results.push(r);
  console.log(r.status);
}

const applicable = results.filter((r) => r.status !== 'INVALID');
const killed = applicable.filter((r) => r.status === 'KILLED');
const score = applicable.length ? killed.length / applicable.length : 0;

const report = {
  mutantsRun: applicable.length,
  killed: killed.length,
  survived: applicable.filter((r) => r.status === 'SURVIVED').map((r) => ({ id: r.id, description: r.description, targets: r.targets, how: r.how })),
  invalid: results.filter((r) => r.status === 'INVALID'),
  mutationScore: +(score * 100).toFixed(1),
  notRun: NOT_RUN,
  results,
};

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/mutation-score.json'), JSON.stringify(report, null, 2));

console.log('');
console.log(`Phase 5 mutation score: ${killed.length}/${applicable.length} = ${report.mutationScore}%`);
if (report.survived.length) {
  console.log('  SURVIVORS (the claim each targets is UNSUPPORTED):');
  for (const s of report.survived) console.log(`    ${s.id} ${s.description}  -> ${s.targets}  [${s.how}]`);
}
if (report.invalid.length) {
  console.log('  INVALID (anchor not found — mutant could not be applied):');
  for (const s of report.invalid) console.log(`    ${s.id} ${s.note}`);
}
console.log(`  NOT RUN: ${NOT_RUN.length} mutants (${NOT_RUN.map((n) => n.id).join(', ')}) — see artifact for reasons`);
