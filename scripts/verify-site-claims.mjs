// Checks that every absolute claim on the reference site is registered with supporting evidence.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTERED_CLAIMS, REGISTERED_NUMERIC_CLAIMS, SITE_CLAIM_SOURCES, ABSOLUTE_PATTERN, NUMERIC_PROSE, DERIVED_PLACEHOLDER, RETIRED_VOCABULARY } from './site-claims.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const VALID_EVIDENCE = new Set(['derived', 'gate', 'test', 'contract']);

if (!Object.keys(REGISTERED_CLAIMS).length) fail('No claims registered; this gate cannot pass vacuously.');
if (!SITE_CLAIM_SOURCES.length) fail('No claim sources configured.');

const today = new Date(process.env.GDS_CLAIMS_TODAY ?? Date.now());
const problems = [];
const found = new Map();
const numeric = new Map();
const visibleStrings = new Map();

for (const rel of SITE_CLAIM_SOURCES) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) fail(`Claim source ${rel} does not exist; the sweep would silently skip it.`);
  const source = readFileSync(path, 'utf8');
  source.split('\n').forEach((line, index) => {
    // Skip comment lines.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    // Minimum 4 chars to catch short visible strings (nav labels, badges); slugs excluded by shape below.
    for (const match of line.matchAll(/(["'])((?:(?!\1)[^\\]|\\.){4,300})\1/g)) {
      const text = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
      if (/^[a-z0-9_.\-/]+$/i.test(text)) continue;
      if (!visibleStrings.has(text)) visibleStrings.set(text, `${rel}:${index + 1}`);
      // Claims are assertions about the system; strings under 40 chars are treated as sample content.
      if (text.length < 40) continue;
      // Numbers interpolated through a %placeholder% are derived, not hardcoded claims.
      if (NUMERIC_PROSE.test(text) && !DERIVED_PLACEHOLDER.test(text) && !numeric.has(text)) {
        numeric.set(text, `${rel}:${index + 1}`);
      }
      if (!ABSOLUTE_PATTERN.test(text)) continue;
      if (!found.has(text)) found.set(text, `${rel}:${index + 1}`);
    }
  });
}

if (!found.size) fail('No absolute claims found across the site sources. The matcher no longer matches; this gate is measuring nothing.');

for (const [text, where] of found) {
  const entry = REGISTERED_CLAIMS[text];
  if (!entry) {
    problems.push(`${where}\n    UNREGISTERED: "${text.slice(0, 150)}"\n    State what makes this true in scripts/site-claims.config.mjs (derived | gate | test | contract), or do not claim it.`);
    continue;
  }
  if (!VALID_EVIDENCE.has(entry.evidence)) {
    problems.push(`${where}\n    Evidence kind "${entry.evidence}" is not one of ${[...VALID_EVIDENCE].join(', ')}.`);
    continue;
  }
  if (entry.evidence !== 'contract' && !entry.ref) {
    problems.push(`${where}\n    Evidence "${entry.evidence}" needs a ref naming the gate, test or derivation that supports it.`);
  }
  if (entry.evidence === 'contract') {
    // A contract with no expiry becomes permanent by neglect.
    if (!entry.reviewBy) problems.push(`${where}\n    A "contract" claim needs a reviewBy date; one that cannot expire becomes permanent by neglect.`);
    else if (new Date(entry.reviewBy) < today) problems.push(`${where}\n    Contract claim passed its reviewBy (${entry.reviewBy}). Re-examine whether it can be gated now, or restate it.`);
  }
}

// Flags any visible string calling a proof surface a "demo". Slugs (e.g. `live-demos`) are
// already excluded by the identifier test during collection, so this matches on words, not length.
for (const [text, where] of visibleStrings) {
  if (!/\bdemos?\b/i.test(text)) continue;
  problems.push(`${where}\n    CALLS A PROOF A DEMO: "${text.slice(0, 120)}"\n    The reference site is documentation with proofs (Rule 15). "Demo" invites staging; say what the surface actually is.`);
}

// Flags a rename fused to the tail of another word (a malformed substring replacement).
for (const [text, where] of visibleStrings) {
  for (const rename of RETIRED_VOCABULARY) {
    const allowed = new Set(rename.derived.map((word) => word.toLowerCase()));
    for (const match of text.matchAll(new RegExp(`\\b${rename.to}[a-z]*`, 'gi'))) {
      const word = match[0].toLowerCase();
      if (allowed.has(word)) continue;
      problems.push(
        `${where}\n    MALFORMED RENAME: "${word}" in "${text.slice(0, 90)}"\n    `
        + `"${rename.to}" fused to the tail of another word — the signature of a substring `
        + `replacement of "${rename.from}". #606 turned "demonstrations" into "proofnstrations" `
        + 'this way and it reached all eight locale packs. Rename on word boundaries.',
      );
    }
  }
}

for (const [text, where] of numeric) {
  if (REGISTERED_NUMERIC_CLAIMS[text]) continue;
  problems.push(`${where}\n    HARDCODED NUMBER: "${text.slice(0, 150)}"\n    Interpolate it from its source through a %placeholder%, or register it in REGISTERED_NUMERIC_CLAIMS with what makes it true. A written number drifts — "250+ components" did.`);
}

// A registered claim that no longer appears in the site is stale bookkeeping.
for (const text of Object.keys(REGISTERED_CLAIMS)) {
  if (!found.has(text)) problems.push(`REGISTERED BUT ABSENT: "${text.slice(0, 120)}"\n    The site no longer states this. Remove the entry so the registry describes the site as it is.`);
}

const byKind = {};
for (const text of found.keys()) {
  const kind = REGISTERED_CLAIMS[text]?.evidence ?? 'unregistered';
  byKind[kind] = (byKind[kind] ?? 0) + 1;
}

console.log('Site claims (issue 605 / Rule 14)\n');
console.log(`  sources scanned     ${String(SITE_CLAIM_SOURCES.length).padStart(4)}`);
console.log(`  absolute claims     ${String(found.size).padStart(4)}`);
console.log(`  hardcoded numbers   ${String(numeric.size).padStart(4)}  (interpolated ones are derived by construction)`);
for (const [kind, n] of Object.entries(byKind).sort()) console.log(`    ${kind.padEnd(16)}${String(n).padStart(4)}`);

if (problems.length) {
  console.error(`\n${problems.length} claim(s) without evidence:\n`);
  for (const p of problems) console.error(`- ${p}\n`);
  console.error('Approved or non-existent: a guarantee on the reference site is a promise to a client. Register what supports it, or do not state it.');
  process.exit(1);
}

console.log('\nEvery absolute the site states carries its evidence.');
