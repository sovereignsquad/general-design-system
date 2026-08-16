// Checks that shipped transition/animation declarations reference the governed motion scale.
// Scale itself is generated from motion.ts (see generate-motion-css.mjs).
// Output: audit/motion-scale.json

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { MOTION_ALLOWLIST } from './motion-scale.config.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

// Read from the built package, not restated here.
const { gdsMotionDurations, gdsMotionEasings } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
if (!gdsMotionDurations) fail('Could not load gdsMotionDurations from packages/gds-theme/dist — run `npm run build` first.');

const SCALE_MS = new Set(Object.values(gdsMotionDurations).map((ms) => `${ms}ms`));
const SCALE_EASINGS = new Set(Object.values(gdsMotionEasings));

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist|__snapshots__/.test(e.name)) walk(p, out); }
    else if (/\.(ts|tsx|css)$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
};

const DURATION = /(?<![\w.-])(\d*\.?\d+m?s)(?![\w-])/g;
const EASING = /(?<![\w-])(ease-in-out|ease-in|ease-out|ease|cubic-bezier\([^)]*\))(?![\w-])/g;

const violations = [];
const allowed = [];
let scanned = 0;

for (const file of [...walk(join(ROOT, 'packages')), ...walk(join(ROOT, 'apps/playground/src'))]) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');

  lines.forEach((line, i) => {
    // Declarations only; skips keyframe bodies and comments.
    if (!/(transition|animation)[A-Za-z-]*\s*:/.test(line)) return;
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    scanned += 1;

    const at = `${rel}:${i + 1}`;
    const entry = MOTION_ALLOWLIST[at];

    const bad = [];
    // Strip var(...) and scale declaration lines (`--gds-motion-*: 120ms`) before matching literals.
    const stripped = line.replace(/var\([^)]*\)/g, 'VAR').replace(/--gds-motion-[a-z-]+\s*:\s*[^;]+;?/g, '');
    for (const [, value] of stripped.matchAll(DURATION)) {
      if (!SCALE_MS.has(value)) bad.push({ kind: 'literal-duration', value, suggestion: nearestStep(value) });
      else bad.push({ kind: 'on-scale-literal-duration', value, suggestion: `var(--gds-motion-duration-${nameFor(value)})` });
    }
    for (const [, value] of stripped.matchAll(EASING)) {
      if (!SCALE_EASINGS.has(value)) bad.push({ kind: 'literal-easing', value, suggestion: 'var(--gds-motion-ease-standard)' });
    }
    if (!bad.length) return;

    if (entry) {
      if (!entry.reason?.trim()) fail(`Motion allowlist entry ${at} has no reason.`);
      if (!entry.reviewBy) fail(`Motion allowlist entry ${at} has no reviewBy.`);
      if (Date.parse(entry.reviewBy) < Date.now()) fail(`Motion allowlist entry ${at} expired ${entry.reviewBy}.`);
      allowed.push({ at, reason: entry.reason, reviewBy: entry.reviewBy, values: bad.map((b) => b.value) });
      return;
    }
    violations.push({ at, line: line.trim().slice(0, 110), findings: bad });
  });
}

function nameFor(ms) {
  return Object.entries(gdsMotionDurations).find(([, v]) => `${v}ms` === ms)?.[0] ?? 'base';
}
function nearestStep(value) {
  const ms = value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
  const [name, best] = Object.entries(gdsMotionDurations)
    .reduce((a, b) => (Math.abs(b[1] - ms) < Math.abs(a[1] - ms) ? b : a));
  return `var(--gds-motion-duration-${name})  (${best}ms, nearest step to ${value})`;
}

if (!scanned) fail('No transition/animation declarations found. Extraction is broken, not the system motionless.');

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/motion-scale.json'), `${JSON.stringify({
  declarationsScanned: scanned,
  allowlisted: allowed.length,
  violationCount: violations.length,
  scale: { durations: gdsMotionDurations, easings: gdsMotionEasings },
  allowed,
  violations,
}, null, 2)}\n`);

console.log('Motion scale verification (issue 584)\n');
console.log(`  declarations scanned  ${String(scanned).padStart(4)}`);
console.log(`  allowlisted           ${String(allowed.length).padStart(4)}   (each with a reason and an expiry)`);
console.log(`  violations            ${String(violations.length).padStart(4)}`);
for (const a of allowed) console.log(`      ${a.at} — ${a.values.join(', ')} (review by ${a.reviewBy})`);

if (violations.length) {
  console.error('');
  for (const v of violations) {
    console.error(`FAIL ${v.at} — ${v.findings.map((f) => `${f.kind} "${f.value}" -> ${f.suggestion}`).join('; ')}`);
    console.error(`     ${v.line}`);
  }
  console.error(`\n${violations.length} motion declaration(s) bypass the governed scale.`);
  process.exit(1);
}

console.log('\nEvery shipped transition and animation uses the governed motion scale.');
