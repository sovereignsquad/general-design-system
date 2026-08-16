// WGA (Weighted Gap Augmentation) selection and ordering.
//
// Measures what the existing runtime gates already cover, drops covering-array rows
// whose pairs those gates already exercise, then orders the remainder greedily by
// weighted-new-tuples per unit transition cost, with ties broken by max Hamming
// distance from the selected set (first-index on further ties). No sampling: every
// uncovered tuple stays in the plan.

import { rowTuples } from './covering-array.mjs';
import { TRANSITION_COSTS, PAGE_FACTORS } from './factor-model.config.mjs';

const pairIdxSets = (factors) => {
  const sets = [];
  for (let a = 0; a < factors.length; a += 1) for (let b = a + 1; b < factors.length; b += 1) sets.push([a, b]);
  return sets;
};

/** Weighted value of a tuple: product of its levels' weights. */
function tupleWeight(factors, key) {
  let weight = 1;
  for (const part of key.split('|')) {
    const [name, value] = part.split('=');
    const factor = factors.find((f) => f.name === name);
    weight *= factor.weight(factor.levels.find((l) => String(l) === value) ?? value);
  }
  return weight;
}

/** What moving from one cell to the next costs under the load-based mechanism. */
export function transitionCost(previous, next) {
  if (!previous) return TRANSITION_COSTS.load;
  if (PAGE_FACTORS.some((f) => previous[f] !== next[f])) return TRANSITION_COSTS.load;
  let cost = 0;
  if (previous.viewport !== next.viewport) cost += TRANSITION_COSTS.viewport;
  if (previous.reducedMotion !== next.reducedMotion || previous.forcedColors !== next.forcedColors) cost += TRANSITION_COSTS.media;
  if (previous.state !== next.state) cost += TRANSITION_COSTS.state;
  return cost || TRANSITION_COSTS.state;
}

const hamming = (a, b, factors) => factors.reduce((n, f) => n + (a[f.name] === b[f.name] ? 0 : 1), 0);

export function selectAndOrder(factors, arrayRows, existingSuite) {
  const sets = pairIdxSets(factors);
  const covered = new Set();
  for (const cell of existingSuite) for (const k of rowTuples(factors, cell, sets)) covered.add(k);
  const measuredExisting = covered.size;

  const candidates = arrayRows.map((row) => ({ row, tuples: rowTuples(factors, row, sets) }));
  const selected = [];
  const dropped = [];
  let remaining = [...candidates];

  while (remaining.length > 0) {
    const last = selected.length > 0 ? selected[selected.length - 1] : null;
    let scored = remaining.map((c) => {
      const gained = c.tuples.filter((k) => !covered.has(k));
      const value = gained.reduce((sum, k) => sum + tupleWeight(factors, k), 0);
      return { c, gained, value, ratio: value / transitionCost(last, c.row) };
    });
    // Rows adding nothing are already covered by the gates or earlier picks — recorded, not run.
    const useful = scored.filter((s) => s.gained.length > 0);
    if (useful.length === 0) { dropped.push(...scored.map((s) => s.c.row)); break; }
    const best = useful.reduce((a, b) => (b.ratio > a.ratio ? b : a));
    const ties = useful.filter((s) => s.ratio >= best.ratio * 0.95);
    const pick = ties.reduce((a, b) => {
      const da = selected.length ? Math.min(...selected.map((s) => hamming(a.c.row, s, factors))) : 0;
      const db = selected.length ? Math.min(...selected.map((s) => hamming(b.c.row, s, factors))) : 0;
      return db > da ? b : a;
    });
    selected.push(pick.c.row);
    for (const k of pick.gained) covered.add(k);
    remaining = remaining.filter((s) => s !== pick.c);
  }

  // Execution order: group by page (route+locale+theme+scheme costs a load), pages in
  // first-selection order, cheap factors swept within a page. Ordering only, no trimming.
  const pageKey = (row) => PAGE_FACTORS.map((f) => row[f]).join('|');
  const pageOrder = [];
  const byPage = new Map();
  for (const row of selected) {
    const key = pageKey(row);
    if (!byPage.has(key)) { byPage.set(key, []); pageOrder.push(key); }
    byPage.get(key).push(row);
  }
  const ordered = pageOrder.flatMap((key) => byPage.get(key));
  const totalCost = ordered.reduce((sum, row, i) => sum + transitionCost(i ? ordered[i - 1] : null, row), 0);
  return { ordered, dropped, measuredExisting, totalCost };
}
