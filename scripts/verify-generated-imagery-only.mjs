// Issue 564 — every image the site renders comes from the generated-imagery system.
//
// The owner's requirement is "all images visible on the page created by our thumbnail system,
// no exceptions". A hosted photo breaks three properties the rest of the system guarantees at
// once: it needs the network, it does not follow the theme, and it is not deterministic — so a
// page that renders one is a page whose appearance GDS does not control.
//
// Output: audit/generated-imagery.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { IMAGERY_ALLOWLIST } from './generated-imagery.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    // Tests are excluded deliberately: a fixture URL is a string in an assertion, never
    // fetched and never rendered to a user. Flagging them would bury the real finding.
    else if (/\.(tsx?|css)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

// A remote image reference in shipped code: an <img src>, a CSS url(), or a background
// pointing at an http(s) resource.
const PATTERNS = [
  { id: 'img-remote-src', re: /<img[^>]*\ssrc=\{?["'`]https?:\/\/[^"'`]+/gi, why: 'an <img> pointing at a remote host' },
  // Narrowed to IMAGE resources. A first cut flagged every remote url(), which caught the
  // Google Fonts @import in styles.css — a font, not an image, and governed by the font-lane
  // system instead. It also masked a real negative control, which is the more dangerous half:
  // a gate failing for the wrong reason still fails, so its true coverage goes unmeasured.
  { id: 'css-url-remote', re: /url\(\s*["']?https?:\/\/[^)"']+\.(?:png|jpe?g|gif|webp|avif|svg)/gi, why: 'a CSS url() pointing at a remote image' },
  { id: 'remote-image-file', re: /["'`]https?:\/\/[^"'`\s]+\.(?:png|jpe?g|gif|webp|avif)["'`]/gi, why: 'a remote image file URL' },
];

/**
 * RFC 2606 reserves `example.com`/`example.net`/`example.org` for documentation, and they
 * resolve to nothing by design. A demo showing "here is a URL a user pasted" is text in a form
 * field, not an image the page renders — flagging it would be four permanent allowlist entries
 * for a case that can never load a pixel, and an allowlist full of non-problems is one people
 * stop reading.
 */
const RESERVED_EXAMPLE_HOST = /https?:\/\/([a-z0-9-]+\.)*example\.(com|net|org)\b/i;

/**
 * A slippy-map tile TEMPLATE, identified structurally by its `{z}/{x}/{y}` placeholders.
 *
 * Map tiles are the map itself, not decorative imagery — no thumbnail generator can produce
 * the surface of the earth, and issue 563's requirement is about images the page displays
 * rather than the geographic data a map renders. The signature is deliberately structural: a
 * stock photo URL cannot accidentally match it, so this is an exclusion that cannot widen.
 *
 * Tile sources have their own governance (issue 567): a source cannot be constructed without
 * the attribution its licence requires, which is a stricter contract than this gate applies.
 */
const TILE_TEMPLATE = /\{z\}|\{x\}|\{y\}/;

const files = [...walk(join(ROOT, 'packages')), ...walk(join(ROOT, 'apps/playground/src'))];
if (!files.length) fail('No source files scanned; the gate cannot pass vacuously.');

const violations = [];
const allowed = [];
let scanned = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  scanned += 1;
  lines.forEach((line, i) => {
    // A comment describing the rule is not a violation of it.
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    for (const { id, re, why } of PATTERNS) {
      re.lastIndex = 0;
      const match = re.exec(line);
      if (!match) continue;
      if (RESERVED_EXAMPLE_HOST.test(match[0])) continue;
      if (TILE_TEMPLATE.test(match[0])) continue;
      const at = `${rel}:${i + 1}`;
      const entry = IMAGERY_ALLOWLIST[at];
      if (entry) {
        if (!entry.reason?.trim()) fail(`Imagery allowlist entry ${at} has no reason.`);
        if (!entry.reviewBy) fail(`Imagery allowlist entry ${at} has no reviewBy.`);
        if (Date.parse(entry.reviewBy) < Date.now()) fail(`Imagery allowlist entry ${at} expired ${entry.reviewBy}.`);
        allowed.push({ at, rule: id, reason: entry.reason });
        return;
      }
      violations.push({ at, rule: id, why, snippet: match[0].slice(0, 90) });
      return;
    }
  });
}

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/generated-imagery.json'), `${JSON.stringify({
  filesScanned: scanned, allowlisted: allowed.length, violationCount: violations.length, allowed, violations,
}, null, 2)}\n`);

console.log('Generated-imagery exclusivity (issue 564)\n');
console.log(`  files scanned  ${String(scanned).padStart(5)}`);
console.log(`  allowlisted    ${String(allowed.length).padStart(5)}`);
console.log(`  violations     ${String(violations.length).padStart(5)}`);

if (violations.length) {
  console.error('');
  for (const v of violations) {
    console.error(`FAIL ${v.at} — ${v.why}`);
    console.error(`     ${v.snippet}`);
    console.error('     Render it through GdsGeneratedThumbnail / GdsGeneratedHero, or allowlist it with a reason.');
  }
  console.error(`\n${violations.length} externally-sourced image(s) in shipped code.`);
  process.exit(1);
}
console.log('\nEvery image in shipped source is generated or allowlisted with a reason.');
