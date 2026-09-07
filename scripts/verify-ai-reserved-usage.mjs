// Reserved-usage gate for the ai.* sub-brand accent lane (issue 697).
//
// The lane's tokens (--gds-ai-gradient/-panel/-accent) are reserved to a named, closed set of
// Scout AI surfaces (THEME_GOVERNANCE.md): the gradient belongs to Scout AI exclusively and is
// never a general action colour. This scans the consumer surface — gds-core's component
// source and the shipped static stylesheet — for any reference to the reserved token family
// and fails loudly, naming file and line, on anything not explicitly allowlisted.
//
// Widening the allowlist requires a governance-reviewed change to it in the same change set as
// the sanctioned component (THEME_GOVERNANCE.md).
//
// Emission sites inside packages/gds-theme/src are exempt by construction: this scan targets
// consumers, never the emitter.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

// Sanctioned consumer files, relative to the repo root. Empty today by design: issue 697 ships
// the tokens, the reserved-usage contract, and this gate only — every sanctioned component
// (AISearchCard, the chat surfaces, the AI promo panel, BottomTabBar's emphasized disc, the
// focus ring, the featured ring) lands in a follow-on issue in this same delivery. The gate
// still runs and proves exclusivity from day one; a future PR adding a sanctioned consumer adds
// its file here in the same change set, per THEME_GOVERNANCE.md's reserved-usage rule.
export const AI_RESERVED_USAGE_ALLOWLIST = new Set([]);

const TOKEN_MARKER = '--gds-ai-';

/** Recursively lists files under `dir` whose name ends with one of `exts`. */
export function readAllFiles(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/node_modules|dist|__snapshots__/.test(entry.name)) readAllFiles(path, exts, acc);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      acc.push(path);
    }
  }
  return acc;
}

/**
 * Scans `files` (absolute paths) for the reserved `--gds-ai-` token marker, and returns one
 * violation per non-allowlisted line that references it. `root` is used only to compute the
 * relative path checked against `allowlist`.
 */
export function scanForUnsanctionedAiReferences(files, allowlist, root) {
  const violations = [];
  for (const file of files) {
    const relPath = relative(root, file);
    if (allowlist.has(relPath)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes(TOKEN_MARKER)) {
        violations.push({ file: relPath, line: index + 1, text: line.trim() });
      }
    });
  }
  return violations;
}

function main() {
  const targets = [
    ...readAllFiles(join(ROOT, 'packages/gds-core/src'), ['.ts', '.tsx']),
    join(ROOT, 'packages/gds-theme/styles.css'),
  ].filter((file) => existsSync(file));

  const violations = scanForUnsanctionedAiReferences(targets, AI_RESERVED_USAGE_ALLOWLIST, ROOT);
  const allowlistHits = targets.filter((file) => AI_RESERVED_USAGE_ALLOWLIST.has(relative(ROOT, file))).length;

  console.log('AI reserved-usage gate (issue 697)');
  console.log(`  files scanned:   ${targets.length}`);
  console.log(`  allowlist files: ${allowlistHits}`);
  console.log(`  violations:      ${violations.length}`);

  if (violations.length) {
    console.error('');
    console.error('FAIL --gds-ai-* referenced outside the sanctioned allowlist:');
    for (const v of violations) console.error(`  ${v.file}:${v.line}: ${v.text}`);
    console.error('');
    console.error('The ai.* lane is reserved for Scout AI surfaces plus the focus ring and the featured');
    console.error('ring (THEME_GOVERNANCE.md) — never a general action colour. Widening the allowlist');
    console.error('requires a governance-reviewed change to it in the same change set as the sanctioned');
    console.error('component.');
    process.exit(1);
  }

  console.log('\nNo unsanctioned --gds-ai-* reference found.');
}

// Only run as a CLI; the test suite imports the functions above directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
