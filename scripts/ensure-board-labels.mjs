// Idempotently provisions the GDS issue-board labels (see PROJECT_BOARD.md and
// scripts/board-labels.config.mjs) on the repository, so their colors and
// descriptions match the taxonomy SSOT exactly.
//
// Uses the GitHub CLI, authenticated by the ambient GITHUB_TOKEN. Managing
// repository labels needs only the default token's `issues: write` — NO
// Projects v2 PAT (`GDS_PROJECT_TOKEN`) is required. This is the deliberate
// simplification over the retired Projects v2 board sync.
//
// `gh label create --force` creates the label if absent and updates its color
// and description if it already exists, so re-running is safe and convergent.
//
// Non-strict by default: if `gh` is unavailable or unauthenticated (e.g. a
// local dev box or a runner without a token), it warns and exits 0 instead of
// failing. Set GDS_BOARD_LABELS_STRICT=1 to fail hard (used by CI).

import { execFileSync } from 'node:child_process';
import { ALL_BOARD_LABELS, OWNER, REPO } from './board-labels.config.mjs';

const strict = process.env.GDS_BOARD_LABELS_STRICT === '1';

function gh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function warnAndSkip(message) {
  console.warn('Board label provisioning skipped: GitHub CLI is unavailable or unauthenticated.');
  console.warn(String(message).slice(0, 500));
  console.warn('Set GDS_BOARD_LABELS_STRICT=1 (CI does) to fail hard instead.');
  process.exit(0);
}

function main() {
  // Probe gh once so a missing/unauthenticated CLI degrades cleanly.
  try {
    gh(['auth', 'status']);
  } catch (error) {
    if (strict) {
      console.error('Board label provisioning failed: `gh` is unavailable or unauthenticated.');
      console.error(String(error?.stderr ?? error?.message ?? error).slice(0, 500));
      process.exit(1);
    }
    warnAndSkip(error?.stderr ?? error?.message ?? error);
    return;
  }

  let created = 0;
  for (const label of ALL_BOARD_LABELS) {
    gh([
      'label',
      'create',
      label.name,
      '--repo',
      `${OWNER}/${REPO}`,
      '--color',
      label.color,
      '--description',
      label.description,
      '--force',
    ]);
    created += 1;
    console.log(`ensured: ${label.name}`);
  }

  console.log(`Provisioned ${created} board label(s) on ${OWNER}/${REPO}.`);
}

main();
