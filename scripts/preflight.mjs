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
import { rmSync, existsSync, readdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CLEAN_DIST = process.argv.includes('--clean-dist');
// Also runs the CI Mantine 9 leg on the committed HEAD in a throwaway worktree. The local tree
// installs Mantine 7, so without it a Mantine 9 API removal in package sources fails only in CI.
const MANTINE_9 = process.argv.includes('--mantine-9');
const WORKFLOW = join(ROOT, '.github/workflows/quality.yml');
const MANTINE_9_STEPS = [
  'Install dependencies',
  'Install Linux native build bindings',
  'Override to Mantine 9',
  'Verify release alignment and quality gates',
];

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

// ── 5. Optional: the CI Mantine 9 leg ────────────────────────────────────────
// Each step's `run:` block is read from the workflow itself, so this leg cannot drift from CI.
function workflowRun(stepName) {
  const lines = readFileSync(WORKFLOW, 'utf8').split('\n');
  const at = lines.findIndex((line) => line.trim() === `- name: ${stepName}`);
  if (at === -1) die(`.github/workflows/quality.yml has no step named "${stepName}".`, 'Update MANTINE_9_STEPS in scripts/preflight.mjs to match the workflow.');
  const stepIndent = lines[at].indexOf('-');
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const indent = line.search(/\S/);
    if (indent !== -1 && indent <= stepIndent) break;
    const inline = line.match(/^\s*run:\s*(.+)$/);
    if (!inline) continue;
    if (inline[1].trim() !== '|') return inline[1].trim();
    const block = [];
    const blockIndent = lines[i + 1].search(/\S/);
    for (let j = i + 1; j < lines.length && (lines[j].trim() === '' || lines[j].search(/\S/) >= blockIndent); j += 1) block.push(lines[j].slice(blockIndent));
    return block.join('\n').trim();
  }
  return die(`The workflow step "${stepName}" has no run command.`);
}

if (MANTINE_9) {
  const commands = MANTINE_9_STEPS.map((name) => [name, workflowRun(name)]);
  const dir = mkdtempSync(join(tmpdir(), 'gds-preflight-m9-'));
  console.log(`\npreflight: running the CI Mantine 9 leg on HEAD in ${dir}`);
  git('worktree', 'add', '--detach', dir, 'HEAD');
  let failed = null;
  try {
    for (const [name, command] of commands) {
      console.log(`\npreflight (mantine-9): ${name}`);
      try {
        execFileSync('bash', ['-eo', 'pipefail', '-c', command], { cwd: dir, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
      } catch {
        failed = name;
        break;
      }
    }
  } finally {
    git('worktree', 'remove', '--force', dir);
    git('worktree', 'prune');
  }
  if (failed) die(`the Mantine 9 leg failed at "${failed}".`);
  console.log('preflight: Mantine 9 leg green');
}

console.log('\npreflight PASSED — clean before, chain green, clean after.');
console.log('Rule 13: after pushing, watch the GDS Quality run to completion and report its actual conclusion.');
