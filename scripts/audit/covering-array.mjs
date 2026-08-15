// Issue 583 — deterministic IPOG-style covering-array generation (DEEP_AUDIT_PLAN §3.1.4
// step 2). 2-way across all factors; 3-way within the accessibility-critical group. No
// randomness anywhere: the same factor model produces byte-identical arrays, which is what
// makes coverage comparable between runs.

/** Every t-sized factor-index combination. */
function combinations(indices, t) {
  const out = [];
  const walk = (start, acc) => {
    if (acc.length === t) { out.push([...acc]); return; }
    for (let i = start; i < indices.length; i += 1) { acc.push(indices[i]); walk(i + 1, acc); acc.pop(); }
  };
  walk(0, []);
  return out;
}

const tupleKey = (pairs) => pairs.map(([f, v]) => `${f}=${v}`).join('|');

/** All required t-tuples for the given factor-index sets. */
function requiredTuples(factors, factorIdxSets, t) {
  const required = new Set();
  for (const combo of factorIdxSets) {
    const walk = (i, acc) => {
      if (i === combo.length) { required.add(tupleKey(acc)); return; }
      for (const level of factors[combo[i]].levels) {
        acc.push([factors[combo[i]].name, level]); walk(i + 1, acc); acc.pop();
      }
    };
    walk(0, []);
  }
  return required;
}

/** The t-tuples a full row covers, over the given factor-index sets. */
export function rowTuples(factors, row, factorIdxSets) {
  const out = [];
  for (const combo of factorIdxSets) {
    out.push(tupleKey(combo.map((fi) => [factors[fi].name, row[factors[fi].name]])));
  }
  return out;
}

/**
 * IPOG: seed with the full cross of the two widest factors, extend one factor at a time
 * choosing, per row, the level covering the most new pairs (first-index tie-break), then
 * vertically extend for any pair no assignment reached. Afterwards, strengthen the a11y group
 * to t=3 by vertical extension of missing triples (rows outside the group take each factor's
 * first level, so the extension stays deterministic and minimal-effort rather than minimal-size
 * — an honest trade recorded here: minimal-size vertical extension is NP-hard and buys nothing
 * for an audit that runs offline).
 */
export function generateCoveringArray(factors, a11yGroup) {
  const byWidth = [...factors.keys()].sort((a, b) => factors[b].levels.length - factors[a].levels.length);
  const [f0, f1] = byWidth;
  const rows = [];
  for (const l0 of factors[f0].levels) for (const l1 of factors[f1].levels) {
    rows.push({ [factors[f0].name]: l0, [factors[f1].name]: l1 });
  }

  const placed = [f0, f1];
  for (const fi of byWidth.slice(2)) {
    const factor = factors[fi];
    const pairIdxSets = placed.map((pi) => [pi, fi].sort((a, b) => a - b));
    const covered = new Set();
    for (const row of rows) {
      let best = null;
      for (const level of factor.levels) {
        const candidate = { ...row, [factor.name]: level };
        const gained = rowTuples(factors, candidate, pairIdxSets).filter((k) => !covered.has(k)).length;
        if (!best || gained > best.gained) best = { level, gained };
      }
      row[factor.name] = best.level;
      for (const k of rowTuples(factors, row, pairIdxSets)) covered.add(k);
    }
    // Vertical extension: any pair involving fi that no row reached becomes a new row, with
    // every other factor at its first level.
    const required = requiredTuples(factors, pairIdxSets, 2);
    for (const key of required) {
      if (covered.has(key)) continue;
      const row = Object.fromEntries(factors.map((f) => [f.name, f.levels[0]]));
      for (const part of key.split('|')) {
        const [name, value] = part.split('=');
        const f = factors.find((x) => x.name === name);
        row[name] = f.levels.find((l) => String(l) === value) ?? f.levels[0];
      }
      // Earlier factors may be unassigned in seed rows only; extension rows are complete.
      rows.push(row);
      for (const k of rowTuples(factors, row, pairIdxSets)) covered.add(k);
    }
    placed.push(fi);
  }

  // 3-way strengthening for the a11y-critical group.
  const groupIdx = a11yGroup.map((name) => factors.findIndex((f) => f.name === name));
  const tripleSets = combinations(groupIdx, 3).map((c) => c.sort((a, b) => a - b));
  const coveredTriples = new Set();
  for (const row of rows) for (const k of rowTuples(factors, row, tripleSets)) coveredTriples.add(k);
  const requiredTriples = requiredTuples(factors, tripleSets, 3);
  for (const key of requiredTriples) {
    if (coveredTriples.has(key)) continue;
    const row = Object.fromEntries(factors.map((f) => [f.name, f.levels[0]]));
    for (const part of key.split('|')) {
      const [name, value] = part.split('=');
      const f = factors.find((x) => x.name === name);
      row[name] = f.levels.find((l) => String(l) === value) ?? f.levels[0];
    }
    rows.push(row);
    for (const k of rowTuples(factors, row, tripleSets)) coveredTriples.add(k);
  }

  return rows;
}

/** Achieved coverage per factor-pair group (and the a11y triples), for the report. */
export function measureCoverage(factors, executedRows, a11yGroup) {
  const pairSets = combinations([...factors.keys()], 2);
  const groups = {};
  for (const combo of pairSets) {
    const name = combo.map((fi) => factors[fi].name).join('×');
    const required = requiredTuples(factors, [combo], 2);
    const covered = new Set();
    for (const row of executedRows) for (const k of rowTuples(factors, row, [combo])) if (required.has(k)) covered.add(k);
    groups[name] = { required: required.size, covered: covered.size, rate: Math.round((covered.size / required.size) * 1000) / 10 };
  }
  const groupIdx = a11yGroup.map((name) => factors.findIndex((f) => f.name === name));
  const tripleSets = combinations(groupIdx, 3).map((c) => c.sort((a, b) => a - b));
  const requiredT = requiredTuples(factors, tripleSets, 3);
  const coveredT = new Set();
  for (const row of executedRows) for (const k of rowTuples(factors, row, tripleSets)) if (requiredT.has(k)) coveredT.add(k);
  return {
    pairwise: groups,
    a11yTriples: { required: requiredT.size, covered: coveredT.size, rate: Math.round((coveredT.size / requiredT.size) * 1000) / 10 },
  };
}
