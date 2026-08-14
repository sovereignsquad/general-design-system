// The reference site alters no styling of its own — owner directive, 2026-08-14.
//
// Rule 10 makes a defect on the GDS page a defect in the shared system, and that only holds if
// the page has no way to paint around one. The moment a route can add an inline style, a local
// stylesheet or a raw Mantine import, a bug there can be "fixed" locally while the shared
// component stays broken for every consumer. This gate is what makes the page an honest witness.
//
// WHY IT WAS WIDENED. It read FOUR files and checked TWO things. The playground has 17 source
// files, so the other 13 were ungoverned — the property held there by luck rather than by rule.
// Measured when widening: zero violations across all of them, so this records a state the page
// had already reached rather than demanding new work.
//
// Each leak form is a separate check, so a failure names the mechanism and not just the file.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const srcDir = resolve(root, 'apps/playground/src');

// Every hand-written source file. Generated phrase packs are excluded: they are data, carry no
// markup, and are rewritten wholesale by a generator.
const files = readdirSync(srcDir)
  .filter((name) => name.endsWith('.tsx') || name.endsWith('.ts'))
  .filter((name) => !name.includes('.test.'))
  .filter((name) => !name.startsWith('generated-'))
  .sort();

if (files.length === 0) {
  console.error('Playground GDS-only verification found no source files — refusing to pass vacuously.');
  process.exit(1);
}

// The stylesheets GDS itself publishes. Importing one of these IS the governed path; importing
// anything else is the page inventing its own design authority.
const SANCTIONED_STYLESHEETS = [
  '@sovereignsquad/gds-theme/styles.css',
  '@sovereignsquad/gds-theme/dates.css',
  '@sovereignsquad/gds-core/map.css',
];

const CHECKS = [
  {
    // Real import statements only. `info-pages.tsx` embeds Mantine imports inside code samples
    // that teach a consumer what to write — documentation about an import is not an import.
    test: (line) => /^\s*import\b[^'"]*from\s+['"]@mantine\//.test(line),
    message: 'imports from @mantine/* directly. Compose GDS exports instead; a raw Mantine import lets the page style around a GDS component rather than fix it.',
  },
  {
    test: (line) => /style=\{\{/.test(line),
    message: 'uses an inline style object. Inline styles beat every stylesheet rule, so they silently override the governed component — that is exactly how a bar which must hide above `sm` stayed visible on desktop (issue 609).',
  },
  {
    test: (line) => {
      const match = /^\s*import\s+['"]([^'"]+\.css)['"]/.exec(line);
      return Boolean(match) && !SANCTIONED_STYLESHEETS.includes(match[1]);
    },
    message: 'imports a stylesheet GDS does not publish. The page may load the governed GDS stylesheets and nothing else.',
  },
  {
    test: (line) => /\.module\.css/.test(line),
    message: 'uses a CSS module. A page-scoped class is a local design authority under another name.',
  },
  {
    test: (line) => /<style[\s>]/.test(line),
    message: 'renders a <style> element. Styling belongs in the packages, not in the page documenting them.',
  },
  {
    test: (line) => /\bstyled\.[a-z]|\bstyled\(|\bcss`/.test(line),
    message: 'uses a CSS-in-JS construct. GDS ships the styling; the page consumes it.',
  },
];

const failures = [];

for (const name of files) {
  const source = readFileSync(join(srcDir, name), 'utf8');
  source.split('\n').forEach((line, index) => {
    // Comments explain code; they are not code. This is the same false positive that failed a
    // release when a compliance rule read `<select>` inside a comment (issue 615).
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const check of CHECKS) {
      if (check.test(line)) {
        failures.push(`apps/playground/src/${name}:${index + 1} ${check.message}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error('Playground GDS-only verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Playground GDS-only verification passed (${files.length} source files, `
  + `${CHECKS.length} styling-leak forms, 0 violations).`,
);
