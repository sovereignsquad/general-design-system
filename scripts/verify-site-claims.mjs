// Issue 605 / Rule 14 — every absolute the reference site states must carry its evidence.
//
// Owner directive, 2026-08-13: "We can have either Approved or Non-existing cases, especially
// on visible surfaces." A guarantee on the reference site is a promise GDS makes to a client;
// there is no third state where a promise is merely plausible.
//
// This gate makes writing a new one cost something: you register what makes it true, or you do
// not write it. It is the reason the badge panel's false "fixed" claim could ship — nothing
// asked what supported it.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTERED_CLAIMS, REGISTERED_NUMERIC_CLAIMS, SITE_CLAIM_SOURCES, ABSOLUTE_PATTERN, NUMERIC_PROSE, DERIVED_PLACEHOLDER, RETIRED_VOCABULARY } from './site-claims.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const VALID_EVIDENCE = new Set(['derived', 'gate', 'test', 'contract']);

// A registry that has stopped matching anything is worse than none: it reads as coverage.
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
    // Comments explain the code; they are not shown to a reader of the site.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    // Floor lowered from 12 to 4 (issue 613) so short VISIBLE strings — nav labels, button
    // text, badges — are collected at all. Slugs and identifiers are excluded by shape on the
    // next line, which is the right discriminator; length never was.
    for (const match of line.matchAll(/(["'])((?:(?!\1)[^\\]|\\.){4,300})\1/g)) {
      const text = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
      if (/^[a-z0-9_.\-/]+$/i.test(text)) continue;
      if (!visibleStrings.has(text)) visibleStrings.set(text, `${rel}:${index + 1}`);
      // Claims are assertions about the SYSTEM; short UI strings are sample content.
      if (text.length < 40) continue;
      // A number typed into prose is a claim; a number interpolated through a %placeholder%
      // is derived by construction, which is the whole point of the placeholder.
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
    // A contract with no expiry becomes permanent by neglect — the mechanism that let 87
    // ungoverned Mantine variables accumulate.
    if (!entry.reviewBy) problems.push(`${where}\n    A "contract" claim needs a reviewBy date; one that cannot expire becomes permanent by neglect.`);
    else if (new Date(entry.reviewBy) < today) problems.push(`${where}\n    Contract claim passed its reviewBy (${entry.reviewBy}). Re-examine whether it can be gated now, or restate it.`);
  }
}

// Issue 606 / Rule 15. The site used to call its own proof surfaces "demos" — in a nav card,
// a badge across nine locales, and a public route. The word is not a style preference: it
// invites treating the page as a sandbox where a shortcut is acceptable, and that is exactly
// what happened when a positioned wrapper was nearly staged with an inline style instead of
// being built into the primitive that was missing it.
//
// Issue 613. This used to skip anything under 12 characters, reasoning that short strings are
// internal identifiers. `label: 'Live Demos'` is TEN characters — the primary nav label, the
// most-read copy on the site — and the outer capture regex required 12 too, so the string was
// never even collected. The exemption was inverted for exactly the case that matters: a nav
// label is short BECAUSE it is visible.
//
// Length is not what separates an identifier from copy. Shape is: `demo-surfaces` and
// `live-demos` are slugs, and those are already dropped by the identifier test during
// collection. Anything that survives that test and reads as words is copy, at any length.
for (const [text, where] of visibleStrings) {
  if (!/\bdemos?\b/i.test(text)) continue;
  problems.push(`${where}\n    CALLS A PROOF A DEMO: "${text.slice(0, 120)}"\n    The reference site is documentation with proofs (Rule 15). "Demo" invites staging; say what the surface actually is.`);
}

// Issue 610 — a malformed rename, caught by its signature rather than by knowing the word.
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

// A registered claim that no longer appears is stale bookkeeping, and it hides the fact that
// nobody re-reads this file.
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
