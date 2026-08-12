// Issue 582 — render the quality-budget table with deltas against a base.
//
// #578 made regression detectable. This makes it SEEN. A CI step that fails gets noticed; a
// step that passes while a number drifts 18.4 -> 18.39 every release does not, and after ten
// releases nobody can say when it moved. `docs/HEALTH_RETENTION_PLAN.md` mechanism 4 exists
// because a snapshot gate cannot see slow multi-release drift, and because the person best
// placed to ask "why did this move?" is the reviewer, at review time.
//
// Reads `audit/budget-results.json`, written by verify-budgets.mjs. It does NOT re-measure:
// a second resolver could disagree with the gate, and a report that contradicts the gate is
// worse than no report.
//
// Usage:
//   node scripts/report-budgets.mjs                      # local table, no comparison
//   node scripts/report-budgets.mjs --base <dir>         # compare against another run
//   node scripts/report-budgets.mjs --format=markdown    # PR-comment body

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;
export const MARKER = '<!-- gds-budget-report -->';

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`)) ?? null;
  if (hit) return hit.split('=').slice(1).join('=');
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] ?? null : null;
};

const readResults = (dir) => {
  const p = join(dir, 'budget-results.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).rows : null;
};

/**
 * A budget moved in the bad direction, or it did not.
 *
 * No weighting, no ranking. Scoring budgets by "importance" invites ignoring the
 * low-ranked ones, which is precisely how drift accumulates unnoticed.
 */
export function computeDeltas(headRows, baseRows) {
  return headRows.map((h) => {
    const b = baseRows?.find((x) => x.key === h.key) ?? null;
    if (h.measured === null || h.measured === undefined) {
      return { ...h, base: null, delta: null, status: 'head-unavailable' };
    }
    if (!b || b.measured === null || b.measured === undefined) {
      return { ...h, base: null, delta: null, status: baseRows ? 'base-unavailable' : 'no-base' };
    }
    const delta = Number((h.measured - b.measured).toFixed(2));
    const worse = h.direction === 'max' ? delta > 0 : delta < 0;
    return { ...h, base: b.measured, delta, status: delta === 0 ? 'unchanged' : worse ? 'REGRESSED' : 'improved' };
  });
}

/**
 * `computeDeltas` is imported by tests, so the CLI body must not run on import — reading an
 * artifact and calling process.exit at module scope made this file untestable, which is how
 * a script with real branching ends up with no coverage at all.
 */
function main() {
  const head = readResults(join(ROOT, 'audit'));
  if (!head) {
    console.error('FAIL audit/budget-results.json missing. Run `npm run verify:budgets` first.');
    process.exit(1);
  }

  const baseDir = arg('base');
  const base = baseDir ? readResults(baseDir) : null;

  const rows = computeDeltas(head, base);
  const regressed = rows.filter((r) => r.status === 'REGRESSED');
  const improved = rows.filter((r) => r.status === 'improved');
  const unavailable = rows.filter((r) => r.status.endsWith('unavailable'));

  const fmt = (v, unit) => (v === null || v === undefined ? '—' : `${v}${unit === '%' ? '%' : ''}`);
  const sign = (d) => (d === null ? '—' : d === 0 ? '0' : d > 0 ? `+${d}` : `${d}`);
  const icon = { REGRESSED: '🔴', improved: '🟢', unchanged: '⚪️', 'base-unavailable': '⚠️', 'head-unavailable': '⚠️', 'no-base': '' };

  if (arg('format') === 'markdown' || process.argv.includes('--format=markdown')) {
    const lines = [MARKER, '## Quality budgets', ''];

    if (regressed.length) {
      lines.push(`**${regressed.length} budget(s) moved in the wrong direction.** They are within budget or the build would have failed — but the direction is the signal.`, '');
    } else if (base) {
      lines.push('No budget moved in the wrong direction.', '');
    } else {
      lines.push('_No base run to compare against; showing measured values only._', '');
    }

    lines.push('| | budget | measured | base | Δ | limit | finding |', '|---|---|---:|---:|---:|---|---|');
    for (const r of rows) {
      lines.push(`| ${icon[r.status] ?? ''} | \`${r.key}\` | ${fmt(r.measured, r.unit)} | ${fmt(r.base, r.unit)} | ${sign(r.delta)} | ${r.direction} ${r.value}${r.unit === '%' ? '%' : ''} | ${r.finding} |`);
    }
    lines.push('');

    // Notes carry the things a bare table would let a reviewer misread.
    const notes = [];
    if (unavailable.length) {
      notes.push(`⚠️ ${unavailable.length} budget(s) had no comparable value. An absent artifact is not a passing budget — check why it is missing.`);
    }
    if (improved.length && !regressed.length) {
      notes.push(`${improved.length} budget(s) improved. If an improvement is a measurement change rather than real work, say so in the PR — a budget that silently changes meaning is indistinguishable from one that was gamed.`);
    }
    notes.push('Budgets are ratchets: they only move down. This comment is informational — `verify:budgets` is what enforces them.');
    lines.push(...notes.map((n) => `- ${n}`));

    process.stdout.write(`${lines.join('\n')}\n`);
  } else {
    console.log('Quality budgets\n');
    console.log(`  ${'BUDGET'.padEnd(32)}${'MEASURED'.padStart(10)}${'BASE'.padStart(10)}${'Δ'.padStart(8)}   STATUS`);
    for (const r of rows) {
      console.log(`  ${r.key.padEnd(32)}${fmt(r.measured, r.unit).padStart(10)}${fmt(r.base, r.unit).padStart(10)}${sign(r.delta).padStart(8)}   ${r.status}`);
    }
    console.log(`\n  ${rows.length} budget(s): ${regressed.length} regressed, ${improved.length} improved, ${unavailable.length} unavailable.`);
  }

}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
