// CLAUDE.md Rule 13 — the CI-equivalent local run, in one command.
//
// Three consecutive red CI runs on `main` were each pushed after a local
// `npm run verify:release` that exited 0. The claim "I tested locally" was true every
// time and worth nothing, because the local run differed from CI in ways that mattered:
//
//   1. A DIRTY TREE hides leaked artifacts. `verify:gates` baselines the already-modified
//      files at start and reports only what becomes dirty during the suite, so an artifact
//      that was uncommitted beforehand is invisible. CI checks out clean and sees it. This
//      is exactly how audit/mantine-governance.json turned CI red while passing locally.
//   2. A LEFTOVER dist/ hides ordering defects. A developer tree always has one; a CI
//      checkout does not. Finding F27 lived only in the environment that lacks it.
//
// This script removes both differences, so a green preflight means something a green
// verify:release does not.

import { execFileSync } from 'node:child_process';
import { rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CLEAN_DIST = process.argv.includes('--clean-dist');

const git = (...args) => execFileSync('git', args, { cwd: ROOT }).toString().trim();
const die = (msg, hint) => {
  console.error(`\nPREFLIGHT FAILED — ${msg}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
};

// ── 1. Clean before ──────────────────────────────────────────────────────────
const before = git('status', '--porcelain');
if (before) {
  die(
    'the working tree is not clean, so this run cannot detect a leaked artifact.',
    `Commit or stash first, then re-run. Dirty:\n${before.split('\n').map((l) => `    ${l}`).join('\n')}`,
  );
}
console.log('preflight: tree clean before the run');

// ── 2. Optionally reproduce a fresh checkout's missing dist/ ─────────────────
if (CLEAN_DIST) {
  let removed = 0;
  const walk = (dir, depth = 0) => {
    if (depth > 2 || !existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name === 'node_modules') continue;
      if (e.name === 'dist') { rmSync(join(dir, e.name), { recursive: true, force: true }); removed += 1; continue; }
      walk(join(dir, e.name), depth + 1);
    }
  };
  walk(join(ROOT, 'packages'));
  walk(join(ROOT, 'apps'));
  console.log(`preflight: removed ${removed} dist/ director${removed === 1 ? 'y' : 'ies'} to match a fresh checkout`);
}

// ── 3. The full chain ────────────────────────────────────────────────────────
console.log('preflight: running verify:release\n');
try {
  execFileSync('npm', ['run', 'verify:release'], { cwd: ROOT, stdio: 'inherit' });
} catch {
  die('verify:release did not exit 0.');
}

// ── 4. Clean after ───────────────────────────────────────────────────────────
const after = git('status', '--porcelain');
if (after) {
  die(
    'the chain left the working tree dirty — CI fails on exactly this.',
    `A gate wrote an artifact that nothing restored, or a mutation leaked:\n${after.split('\n').map((l) => `    ${l}`).join('\n')}`,
  );
}

console.log('\npreflight PASSED — clean before, chain green, clean after.');
console.log('Rule 13: after pushing, watch the GDS Quality run to completion and report its actual conclusion.');
