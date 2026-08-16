// Checks semantic-role token values have exactly one definition, two ways:
//   1. Structural — no file other than semantic-token-source.ts may declare an object
//      literal that looks like a semantic-role table.
//   2. Behavioural — the document-level `--gds-*` path and the provider's inline-style path
//      must resolve every shared role to the same value.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'packages/gds-theme/src');
const OWNER = 'semantic-token-source.ts';

const failures = [];

const dist = join(ROOT, 'packages/gds-theme/dist/index.js');
let mod;
try {
  mod = await import(dist);
} catch (error) {
  console.error(`FAIL cannot load ${dist} — run \`npm run build\` first. ${error.message}`);
  process.exit(1);
}

// Role set is derived from what the single source actually emits, not a `--gds-*` prefix
// rule, which would wrongly include `--gds-motion-*` and `--gds-vibe-*` namespaces.
// Axis namespaces (radius, space, etc.) have their own owner (axes.ts) and adoption gates.
const AXIS_PREFIXES = [
  '--gds-radius-', '--gds-space-', '--gds-control-height-', '--gds-density',
  '--gds-font-size-', '--gds-line-height-', '--gds-weight-', '--gds-tracking-', '--gds-font-lane-',
  '--gds-elevation-', '--gds-reaction-', '--gds-focus-ring-w', '--gds-focus-ring-o',
  '--gds-focus-ring-s', '--gds-focus-ring-c', '--gds-transition-scope', '--gds-motion-',
];
const isAxisToken = (name) => AXIS_PREFIXES.some((p) => name.startsWith(p));

const SEMANTIC_ROLES = new Set([
  ...Object.keys(mod.createBrandTheme('class-usa').mantineTheme.other.gdsCssVariables),
  ...Object.keys(mod.getGdsVibeThemeCssVariables('aurora', 'light')).filter((k) => !k.startsWith('--gds-vibe-')),
].filter((name) => !isAxisToken(name)));
if (SEMANTIC_ROLES.size < 50) {
  console.error(`FAIL only ${SEMANTIC_ROLES.size} semantic roles resolved; the scan would be vacuous.`);
  process.exit(1);
}

// ── 1. Structural: no parallel table ─────────────────────────────────────────
// A "parallel table" is an object literal carrying >= 3 distinct semantic-role keys
// (a component legitimately sets one or two variables inline).
const TABLE_THRESHOLD = 3;

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.ts') && !f.includes('.test.'))) {
  if (file === OWNER) continue;
  const lines = readFileSync(join(SRC, file), 'utf8').split('\n');

  let depth = 0;
  let start = 0;
  let keys = new Set();
  lines.forEach((line, i) => {
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    if (depth === 0 && opens > 0) { start = i; keys = new Set(); }
    depth += opens - closes;
    for (const m of line.matchAll(/['"`](--gds-[a-zA-Z0-9-]+)['"`]\s*:/g)) {
      if (SEMANTIC_ROLES.has(m[1])) keys.add(m[1]);
    }
    if (depth <= 0) {
      if (keys.size >= TABLE_THRESHOLD) {
        failures.push(
          `${file}:${start + 1} declares a parallel semantic-token table (${keys.size} role keys). `
          + `Semantic-role values belong in ${OWNER}, the only place they may be defined.`,
        );
      }
      depth = 0;
      keys = new Set();
    }
  });
}

// ── 2. Behavioural: both consumption paths agree ─────────────────────────────
const LANES = ['class-usa', 'gold-athlete'];
let compared = 0;

for (const lane of LANES) {
  const brand = mod.createBrandTheme(lane).mantineTheme.other.gdsCssVariables;
  for (const scheme of ['light', 'dark']) {
    const vibe = mod.getGdsVibeThemeCssVariables(lane, scheme);
    for (const [name, value] of Object.entries(brand)) {
      // The document path collapses `-dark` onto the base name in dark mode; compare the
      // name each path actually paints with.
      const isDark = name.endsWith('-dark');
      if ((scheme === 'dark') !== isDark) continue;
      const painted = isDark ? name.replace(/-dark$/, '') : name;
      if (!(painted in vibe)) {
        failures.push(`${lane}/${scheme}: the brand path emits ${name} but the document path has no ${painted}.`);
        continue;
      }
      compared += 1;
      if (vibe[painted] !== value) {
        failures.push(
          `${lane}/${scheme}: ${painted} resolves to ${vibe[painted]} through the document path `
          + `and ${value} through the provider path. One role, two answers.`,
        );
      }
    }
  }
}

if (compared === 0) failures.push('No roles were compared. The behavioural check is not running.');

if (failures.length) {
  console.error('Token single-source verification FAILED\n');
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`\n${failures.length} violation(s).`);
  process.exit(1);
}

console.log(
  `Token single-source verification passed: no parallel tables outside ${OWNER}; `
  + `${compared} role resolutions agree across both consumption paths.`,
);
