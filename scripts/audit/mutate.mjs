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
// Output: audit/static-analysis-mutation-score.json
//
// THREE mutation-score artifacts exist and measure three different instruments (issue 603):
//   static-analysis-mutation-score.json — this file: mutants against the audit's STATIC analyses
//     (registry extraction, forward trace), re-run in place with no rebuild.
//   render-mutation-score.json — mutants that require a REBUILD and headless Chrome, validating
//     the render-time backward trace (scripts/audit/render-mutants.mjs).
//   gate-mutation-score.json — mutants against the RELEASE-CHAIN GATES (scripts/verify-gates.mjs).
// They are not the same measurement recorded twice; this one was renamed from the generic
// mutation-score.json, whose name claimed the whole subject while covering a third of it.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
    // Re-anchored twice, both times instructive. The original anchor "Live Demos" was renamed
    // by issue 606, silently invalidating the mutant — INVALID was only noticed when the
    // artifact was regenerated for issue 603. The first replacement, "Live proofs", RAN but
    // SURVIVED: at two words it fails the measure's isProse rule (>= 3 words, one lowercase),
    // so the planted leak was excluded by design, not missed. The anchor must be a phrase the
    // measure actually counts — prose with peer evidence — and there is still no rename-proof
    // choice, so the INVALID/SURVIVED statuses existing at all are the protection.
    find: '"Badges across themes": "Insignias por temas"', replace: '"Badges across themes": "Badges across themes"',
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

// The harness rewrites audit/*.json on every analysis run, so the LAST thing it
// writes is a MUTANT's output, not the clean baseline. Left alone, the committed
// artifacts carry planted defects — which is exactly the input a budget file would
// be transcribed from. Snapshot the clean artifacts first, restore them at the end.
const ARTIFACTS = ['audit/registry.json', 'audit/forward-trace.json', 'audit/dimensions.json'];
const artifactSnapshots = Object.fromEntries(
  ARTIFACTS.filter((f) => existsSync(join(ROOT, f))).map((f) => [f, readFileSync(join(ROOT, f), 'utf8')]),
);
const restoreArtifacts = () => {
  for (const [f, content] of Object.entries(artifactSnapshots)) writeFileSync(join(ROOT, f), content);
};
process.once('SIGINT', () => { restoreArtifacts(); process.exit(130); });
process.once('SIGTERM', () => { restoreArtifacts(); process.exit(143); });

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
// Restore the clean artifacts BEFORE writing the score, so a mutant's output never
// survives the run. Verified by asserting no mutant marker remains.
restoreArtifacts();
for (const f of ARTIFACTS) {
  if (!existsSync(join(ROOT, f))) continue;
  if (/audit-mutant|MUTANT/.test(readFileSync(join(ROOT, f), 'utf8'))) {
    console.error(`FAIL: ${f} still carries a mutant marker after restore.`);
    process.exit(1);
  }
}
writeFileSync(join(ROOT, 'audit/static-analysis-mutation-score.json'), JSON.stringify(report, null, 2));

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
