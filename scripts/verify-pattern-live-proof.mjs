// Issue 600 — a pattern may not claim `live-proof` unless the site actually proves it.
//
// `renderEntryDemo()` in apps/playground/src/pattern-pages.tsx is a switch on `entry.id`
// whose `default:` branch renders the sentence "No interactive demo renders here". Seven
// registry entries reached that branch while asserting `coverageStatus: 'live-proof'`, so
// the page contradicted its own registry, in public, per entry — and nothing noticed,
// because the claim was a hand-typed string compared to nothing.
//
// A pattern proves itself one of two ways, and this gate accepts either:
//   1. `renderEntryDemo()` has a `case '<id>':` — a purpose-built proof, or
//   2. `PatternEntryCard` special-cases the id (`entry.id === '<id>'`) and renders it
//      itself, which `partner-discovery-system` does.
//
// Absence of both means the reader is shown the fallback sentence under a `live-proof`
// badge.
//
// FIRST VERSION OF THIS GATE WAS TOO LOOSE, and the deployed site is what caught it. It
// also accepted "some playground page references one of the entry's sourceComponent
// identifiers", reasoning that such an entry must be proven inside a larger surface. That
// is not the same question. `GdsPinSystemReference` and `GdsMap` were rendered inside
// `BadgeMapDemo` — which serves the `badges` entry — so the components appeared on the page
// while the `pin-system` and `gds-map` cards showed the fallback, and this gate passed them.
// `maturity-capabilities` was worse: its functions are referenced from info-pages.tsx, a
// different route entirely.
//
// The lesson is the one in HANDOVER section 3: proximity is not proof. The rule now asks
// where the proof is ATTRIBUTED, not merely whether the identifier occurs somewhere.
//
// NOT checked here, deliberately: that `coverageStatus` is DERIVED rather than written.
// All 113 entries carry the same value, so a correct claim is still an unverified one.
// That is issue 608 — it needs a design ruling, and bundling it here would have blocked
// the fix that closes the false claims (HANDOVER section 8).

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const playgroundSrc = resolve(root, 'apps/playground/src');
const registryPath = join(playgroundSrc, 'pattern-registry.ts');

const registrySource = readFileSync(registryPath, 'utf8');

// The catalog pages only. Proof has to be attributed to the entry by the component that
// renders entry cards, so this reads where that dispatch lives rather than the whole app.
const pageFiles = readdirSync(playgroundSrc)
  .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'));
const pageSource = pageFiles.map((file) => readFileSync(join(playgroundSrc, file), 'utf8')).join('\n');

const demoCases = new Set([...pageSource.matchAll(/case '([^']+)':/g)].map((match) => match[1]));
const specialCased = new Set([...pageSource.matchAll(/entry\.id === '([^']+)'/g)].map((match) => match[1]));

const entries = [];
for (const block of registrySource.matchAll(/\n {2}\{\n([\s\S]*?)\n {2}\},/g)) {
  const body = block[1];
  const id = /^\s*id: '([^']+)',/m.exec(body)?.[1];
  if (!id) continue;
  entries.push({
    id,
    coverageStatus: /^\s*coverageStatus: '([^']+)',/m.exec(body)?.[1],
    sourceComponent: /^\s*sourceComponent: '([^']+)',/m.exec(body)?.[1],
  });
}

const failures = [];

// Refuse to pass vacuously. A parse that silently matched nothing would report a clean
// result for a registry it never read — the exact failure shape this gate exists to catch.
if (entries.length === 0) {
  failures.push('Parsed 0 entries from pattern-registry.ts — refusing to pass vacuously.');
}
if (demoCases.size === 0) {
  failures.push('Parsed 0 demo cases from the playground pages — refusing to pass vacuously.');
}

for (const entry of entries) {
  if (entry.coverageStatus !== 'live-proof') continue;
  if (demoCases.has(entry.id) || specialCased.has(entry.id)) continue;

  failures.push(
    `${entry.id} claims coverageStatus 'live-proof' but its card renders nothing: no case '${entry.id}': in `
    + `renderEntryDemo() and no entry.id === '${entry.id}' branch in PatternEntryCard. Readers see the `
    + '"No interactive demo renders here" fallback under a live-proof claim. Render it, or state the weaker status.',
  );
}

if (failures.length > 0) {
  console.error('Pattern live-proof verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const liveProofCount = entries.filter((entry) => entry.coverageStatus === 'live-proof').length;
console.log(`Pattern live-proof verification passed (${liveProofCount} live-proof entries, all proven).`);
