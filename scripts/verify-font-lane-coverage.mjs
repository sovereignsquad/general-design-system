// Full-coverage font policy (owner directive, 2026-08-13) — every font lane must be able to
// render every language GDS supports.
//
// WHY THIS IS A GATE AND NOT A REVIEW NOTE. Eleven of twelve lanes used to declare coverage of
// latin (+cyrillic) only, so choosing a lane silently chose which languages a product could
// display, and `ja`/`ko`/`zh` had no lane at all — the packages shipped those locales while no
// lane's fonts contained their glyphs. Nothing objected, because nothing compared the lane
// table to the locale catalog. A partial lane is a detour: it moves "which font can show my
// users' language" out of the system and onto every consumer, one app at a time.
//
// Both sides are DERIVED. Locales come from `gdsLocaleMetadata` and coverage from the built
// lane table, so this cannot be satisfied by writing a list — adding a locale in a new script
// fails the build until a lane can actually draw it.
//
// WHAT THIS GATE CANNOT PROVE, stated rather than implied. It verifies STRUCTURE: that every
// script has a declared family, that every lane's stack names that family, that declared
// coverage is the whole catalog, and that fonts load from the approved host with `swap`. It
// does NOT verify that the named font file actually contains the script's glyphs — pointing
// `hangul` at `"Noto Sans"` still passes, because the string is present in the stack. Proving
// real glyph coverage means reading each family's `unicode-range` from the font service, which
// is a live-network assertion of the kind already exempted for `audit:dependencies`. The
// mapping is small, reviewed in one place, and each entry names why it exists; that is the
// current control, and this comment is here so nobody reads a green run as more than it is.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const distPath = resolve(root, 'packages/gds-theme/dist/index.js');
const { getGdsFontLanes, getGdsLocaleIds, getGdsLocaleScripts } = await import(distPath);

const failures = [];

const localeIds = getGdsLocaleIds();
const scripts = getGdsLocaleScripts();
const lanes = getGdsFontLanes();

// Refuse to pass vacuously — an empty catalog or lane table would clear every assertion below.
if (localeIds.length === 0) failures.push('Locale catalog is empty — refusing to pass vacuously.');
if (scripts.length === 0) failures.push('Script catalog is empty — refusing to pass vacuously.');
if (lanes.length === 0) failures.push('Font lane table is empty — refusing to pass vacuously.');

// The catalog is the source both for what must be covered and for what the lanes claim.
const source = readFileSync(resolve(root, 'packages/gds-theme/src/font-lanes.ts'), 'utf8');
const declaredScripts = new Set(
  [...source.matchAll(/^\s{2}(\w+):\s*'([^']+)',?\s*$/gm)]
    .filter(([, key]) => scripts.includes(key))
    .map(([, key]) => key),
);

for (const script of scripts) {
  if (!declaredScripts.has(script)) {
    failures.push(`No font family is declared for script "${script}" in SCRIPT_FONTS — a lane cannot cover it.`);
  }
}

for (const lane of lanes) {
  const missing = localeIds.filter((locale) => !lane.localeCoverage.includes(locale));
  if (missing.length > 0) {
    failures.push(
      `Font lane "${lane.id}" does not cover ${missing.join(', ')}. `
      + 'Every lane must render every supported language — a partial lane pushes font choice onto consumers.',
    );
  }

  // Declared coverage is only a claim; the stack has to actually name a face per script.
  for (const script of scripts) {
    const family = /^\s{2}(\w+): '([^']+)'/gm;
    let match;
    let expected = null;
    while ((match = family.exec(source)) !== null) {
      if (match[1] === script) { expected = match[2]; break; }
    }
    if (expected && !lane.body.includes(expected)) {
      failures.push(`Font lane "${lane.id}" claims to cover ${script} but its body stack never names "${expected}".`);
    }
  }

  if (lane.source === 'google-fonts-compatible') {
    if (!lane.cssImportUrl) {
      failures.push(`Font lane "${lane.id}" is web-font backed but loads no stylesheet.`);
      continue;
    }
    if (!lane.cssImportUrl.startsWith('https://fonts.googleapis.com/')) {
      failures.push(`Font lane "${lane.id}" loads fonts from an unapproved host: ${lane.cssImportUrl}`);
    }
    if (!lane.cssImportUrl.includes('display=swap')) {
      failures.push(`Font lane "${lane.id}" does not request font-display: swap.`);
    }
  }
}

if (failures.length > 0) {
  console.error('Font lane coverage verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Font lane coverage verification passed (${lanes.length} lanes, each covering all `
  + `${localeIds.length} locales across ${scripts.length} scripts).`,
);
