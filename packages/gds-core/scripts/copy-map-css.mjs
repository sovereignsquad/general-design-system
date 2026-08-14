// The map subpath ships the stylesheet its engine cannot work without.
//
// `GdsMap` renders through Leaflet, and Leaflet's tile layout IS CSS: `.leaflet-tile` is
// `position: absolute`, placed by transform. WITHOUT THAT STYLESHEET THE TILES FALL INTO
// NORMAL DOCUMENT FLOW — they load, they are the right images, and they stack with blank gaps.
// It reads as "the map never loaded", which is exactly how it was reported, and no amount of
// waiting or re-measuring fixes it because nothing is still loading.
//
// Nothing imported `leaflet.css` — not the packages, not the playground — so the map had never
// rendered correctly since it shipped. Making every consumer discover that and import a vendor
// path themselves is a detour: GDS owns the map contract, so GDS ships the stylesheet behind
// its own governed specifier, `@sovereignsquad/gds-core/map.css`.
//
// Copied at build rather than re-exported, so the published package does not depend on a
// consumer's bundler resolving a CSS file out of a transitive dependency.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const source = resolve(pkgRoot, '../../node_modules/leaflet/dist/leaflet.css');
const target = resolve(pkgRoot, 'dist/map.css');

const css = readFileSync(source, 'utf8');
// Refuse to ship a stylesheet that would not lay the map out — the whole point of the file.
if (!/\.leaflet-tile\b/.test(css) || !/position\s*:\s*absolute/.test(css)) {
  console.error('leaflet.css is missing its tile positioning rules; refusing to write dist/map.css.');
  process.exit(1);
}

const version = JSON.parse(readFileSync(resolve(pkgRoot, '../../node_modules/leaflet/package.json'), 'utf8')).version;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `/* Vendored from leaflet@${version} (BSD-2-Clause), by packages/gds-core/scripts/copy-map-css.mjs.\n`
  + ` * Imported as \`@sovereignsquad/gds-core/map.css\` so the map's stylesheet is a governed\n`
  + ` * specifier rather than a vendor path every consumer has to discover for themselves. */\n`
  + css,
);

console.log(`Wrote dist/map.css from leaflet@${version} (${css.length} bytes).`);
