// Render-capable mutants M1 and M2.
//
// backward-trace reads the BUILT playground, so a source mutation has no effect until
// the workspace is rebuilt. These two mutants add that build step before tracing.
//
// Run:  CHROME_PATH=... node scripts/audit/render-mutants.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../..', import.meta.url).pathname;
const TMP_OUT = 'audit/.render-mutant-trace.json';

// One route is enough to observe a per-theme delta; four would quadruple the cost for
// no additional discrimination.
const TRACE_ENV = {
  GDS_AUDIT_ROUTES: '/patterns/foundations',
  GDS_AUDIT_PRESETS: 'default,class-usa,gold-athlete,high-contrast',
  GDS_AUDIT_SCHEMES: 'light',
  GDS_AUDIT_OUT: TMP_OUT,
};

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', env: { ...process.env, ...opts.env } });

function rebuild(workspaces) {
  for (const ws of workspaces) sh('npm', ['run', 'build', '--workspace', ws]);
}

function trace() {
  sh('node', [join(ROOT, 'scripts/audit/backward-trace.mjs')], { env: TRACE_ENV });
  return JSON.parse(readFileSync(join(ROOT, TMP_OUT), 'utf8'));
}

/** Resolve a token's value for a preset, from the built theme package. */
async function tokenValue(preset, scheme, name) {
  const mod = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
  const api = mod.default ?? mod;
  return api.getGdsVibeThemeCssVariables(preset, scheme)[name];
}

const REBUILD_CHAIN = ['@sovereignsquad/gds-theme', '@sovereignsquad/gds-core', 'playground'];

/**
 * M1 — the coincidence case.
 *
 * `--gds-support` differs per preset (default `rgb(62, 129, 152)`, class-usa `#4f8a5b`,
 * gold-athlete `#b3261e`, high-contrast `rgb(84, 47, 100)`). Planting the DEFAULT
 * theme's value as a literal must classify as `token` under `default` and `literal`
 * under the other three.
 */
const M1 = {
  id: 'M1',
  description: 'Plant a colour equal to the DEFAULT theme\'s --gds-support as a literal',
  file: 'packages/gds-core/src/SectionPanel.tsx',
  targets: 'Phase 1 per-theme provenance resolution',
  async build() {
    const planted = await tokenValue('default', 'light', '--gds-support');
    if (!planted) throw new Error('could not resolve default --gds-support');
    return {
      planted,
      find: "style={{ background: toneBackgrounds[tone] }}",
      replace: `style={{ background: toneBackgrounds[tone], borderTopColor: '${planted}', borderTopWidth: 1, borderTopStyle: 'solid' }}`,
    };
  },
  verdict(base, mut, planted) {
    const delta = deltaByPreset(base, mut);
    const others = ['class-usa/light', 'gold-athlete/light', 'high-contrast/light'];
    const roseElsewhere = others.every((k) => (delta[k] ?? 0) > 0);
    const defaultFlat = (delta['default/light'] ?? 0) === 0;
    return {
      killed: roseElsewhere && defaultFlat,
      delta,
      how: roseElsewhere && defaultFlat
        ? `untraceable rose under all non-default presets and stayed flat under default — per-theme resolution confirmed (planted ${planted})`
        : `expected a rise under non-default presets and NO rise under default; got ${JSON.stringify(delta)}`,
    };
  },
};

/** M2 — a colour present in no theme's token map must be untraceable everywhere. */
const M2 = {
  id: 'M2',
  description: 'Plant a colour present in no theme token map',
  file: 'packages/gds-core/src/SectionPanel.tsx',
  targets: 'Phase 1 literal detection',
  async build() {
    return {
      planted: 'rgb(255, 0, 255)',
      find: "style={{ background: toneBackgrounds[tone] }}",
      replace: "style={{ background: toneBackgrounds[tone], borderTopColor: '#ff00ff', borderTopWidth: 1, borderTopStyle: 'solid' }}",
    };
  },
  verdict(base, mut, planted) {
    const delta = deltaByPreset(base, mut);
    const rose = Object.values(delta).filter((d) => d > 0).length;
    return {
      killed: rose === Object.keys(delta).length,
      delta,
      how: rose === Object.keys(delta).length
        ? `untraceable rose under all ${rose} preset/scheme cells (planted ${planted})`
        : `expected a rise in every cell; rose in ${rose} of ${Object.keys(delta).length}`,
    };
  },
};

function deltaByPreset(base, mut) {
  const out = {};
  for (const key of Object.keys(mut.literalsByPreset ?? {})) {
    out[key] = (mut.literalsByPreset[key] ?? 0) - (base.literalsByPreset?.[key] ?? 0);
  }
  return out;
}

async function run() {
  const results = [];
  let restoreAll = () => {};
  // Restore on both signal handlers and the finally block.
  process.once('SIGINT', () => { restoreAll(); process.exit(130); });
  process.once('SIGTERM', () => { restoreAll(); process.exit(143); });

  console.log('Render mutants (issue 579)\n');

  for (const mutant of [M1, M2]) {
    const path = join(ROOT, mutant.file);
    const original = readFileSync(path, 'utf8');
    restoreAll = () => writeFileSync(path, original);
    let status = 'INVALID';
    let how = '';
    let delta = {};

    try {
      const spec = await mutant.build();
      if (!original.includes(spec.find)) throw new Error(`anchor not found: ${spec.find}`);
      // Rejects a no-op mutation, which would read as a survivor.
      if (spec.replace === spec.find) throw new Error('planted value equals original — mutant is a no-op');

      process.stdout.write(`  ${mutant.id} baseline … `);
      rebuild(REBUILD_CHAIN);
      const baseline = trace();
      process.stdout.write('mutating … ');

      writeFileSync(path, original.split(spec.find).join(spec.replace));
      rebuild(REBUILD_CHAIN);

      // Confirms the plant reached the built bundle.
      const built = readFileSync(join(ROOT, 'packages/gds-core/dist/index.js'), 'utf8');
      if (!built.includes(spec.planted) && !built.includes('#ff00ff')) {
        throw new Error('planted value did not reach the built output — rebuild incomplete');
      }

      process.stdout.write('tracing … ');
      const mutated = trace();
      const v = mutant.verdict(baseline, mutated, spec.planted);
      status = v.killed ? 'KILLED' : 'SURVIVED';
      how = v.how;
      delta = v.delta;
    } catch (error) {
      // A mutant that could not run is never counted as killed.
      how = String(error.message ?? error).slice(0, 200);
    } finally {
      writeFileSync(path, original);
      restoreAll = () => {};
    }

    console.log(status);
    console.log(`     ${how}`);
    if (Object.keys(delta).length) {
      for (const [k, d] of Object.entries(delta)) console.log(`       ${k.padEnd(24)} ${d >= 0 ? '+' : ''}${d}`);
    }
    results.push({ id: mutant.id, description: mutant.description, targets: mutant.targets, status, how, delta });
  }

  // Leave the tree exactly as found.
  rebuild(REBUILD_CHAIN);
  if (existsSync(join(ROOT, TMP_OUT))) rmSync(join(ROOT, TMP_OUT));

  const applicable = results.filter((r) => r.status !== 'INVALID');
  const killed = applicable.filter((r) => r.status === 'KILLED');
  const score = applicable.length ? +(killed.length / applicable.length * 100).toFixed(1) : 0;

  mkdirSync(join(ROOT, 'audit'), { recursive: true });
  writeFileSync(join(ROOT, 'audit/render-mutation-score.json'),
    JSON.stringify({ mutantsRun: applicable.length, killed: killed.length, renderMutationScore: score, results }, null, 2));

  console.log(`\nRender mutation score: ${killed.length}/${applicable.length} = ${score}%`);
  if (killed.length !== 2) {
    console.error('FAIL both M1 and M2 must be killed before Phase 1 can be treated as validated.');
    process.exit(1);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
