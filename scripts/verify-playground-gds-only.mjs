// Checks that the reference site adds no styling of its own (inline styles, local stylesheets,
// raw Mantine imports, CSS-in-JS). Scans every hand-written playground source file.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const srcDir = resolve(root, 'apps/playground/src');

// Excludes generated phrase packs (data, no markup).
const files = readdirSync(srcDir)
  .filter((name) => name.endsWith('.tsx') || name.endsWith('.ts'))
  .filter((name) => !name.includes('.test.'))
  .filter((name) => !name.startsWith('generated-'))
  .sort();

if (files.length === 0) {
  console.error('Playground GDS-only verification found no source files — refusing to pass vacuously.');
  process.exit(1);
}

// Stylesheets GDS itself publishes; only these may be imported.
const SANCTIONED_STYLESHEETS = [
  '@sovereignsquad/gds-theme/styles.css',
  '@sovereignsquad/gds-theme/dates.css',
  '@sovereignsquad/gds-core/map.css',
];

const CHECKS = [
  {
    // Real import statements only; excludes code samples embedded in docs.
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
  {
    // Character class after `a` excludes <article>, <aside>, <Anchor>, <GdsInlineLink> (case-sensitive).
    test: (line) => /<a[\s/>]/.test(line),
    message: 'renders a bare <a> tag. Use GdsInlineLink instead — an unstyled anchor ignores the theme entirely.',
  },
];

const failures = [];

for (const name of files) {
  const source = readFileSync(join(srcDir, name), 'utf8');
  source.split('\n').forEach((line, index) => {
    // Skip comment lines.
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
