// Issue 597, generalised. A component that sets BOTH a background and a text colour has
// declared a contrast pair, whether or not anyone measured it.
//
// The badge work found the same mistake four times in four components: a themeable fill
// paired with a FIXED foreground, usually `--gds-text-on-inverse` — a role derived to sit on
// `--gds-bg-inverse` and on nothing else. Measured across the presets, `--gds-text-on-inverse`
// on `--gds-brand-primary` is 1.00:1 in default dark: the same colour, twice.
//
// The runtime badge gate cannot see these, because they are not badges. The token gates cannot
// see them either, because the pair is not DECLARED anywhere — it is composed by a component
// at the point of use, out of two tokens that were never meant to meet. That gap is what this
// closes: the pairing is read from the component source and measured against every preset.
//
// It is deliberately static. No browser, no build, no preview server — so it can run early and
// cheaply, and so it cannot be defeated by a route simply not rendering the component today.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { getGdsVibeThemes, getGdsVibeThemeCssVariables, getGdsContrastRatio } =
  await import(join(ROOT, 'packages/gds-theme/dist/index.js'));

const presets = getGdsVibeThemes().map((t) => t.id);
if (!presets.length) fail('No presets resolved; this gate must not pass vacuously.');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) { if (!/node_modules|dist/.test(entry.name)) walk(p, out); }
    else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) out.push(p);
  }
  return out;
}

/**
 * Resolves a CSS value to a token this preset actually defines, following `var()` fallbacks.
 *
 * A component writes `var(--a, var(--b, #fff))` precisely because `--a` may be absent. Reading
 * only the first name would measure a token the page never uses, which is a confident wrong
 * answer rather than a missing one.
 */
function resolve(value, vars) {
  const names = [...String(value).matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]);
  for (const name of names) if (vars[name]) return { token: name, color: vars[name] };
  const literal = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/i.exec(value);
  return literal ? { token: '(literal)', color: literal[0] } : null;
}

// A style object that sets a background AND a colour has declared a pair. Matching the object
// rather than the file keeps unrelated declarations from being paired with each other.
const OBJECT = /\{([^{}]*(?:background(?:Color)?|background)\s*:[^{}]*color\s*:[^{}]*|[^{}]*color\s*:[^{}]*background(?:Color)?\s*:[^{}]*)\}/g;
const BG = /(?:^|[\s,{])(?:background|backgroundColor|background-color)\s*:\s*(?:`|')([^`']+)(?:`|')/;
const FG = /(?:^|[\s,{])color\s*:\s*(?:`|')([^`']+)(?:`|')/;

const pairs = [];
for (const file of walk(join(ROOT, 'packages'))) {
  const source = readFileSync(file, 'utf8');
  for (const [, body] of source.matchAll(OBJECT)) {
    const bg = BG.exec(body)?.[1];
    const fg = FG.exec(body)?.[1];
    if (!bg || !fg) continue;
    if (/transparent|none|inherit|currentcolor/i.test(bg)) continue;
    // A pair built from a template hole (`var(--gds-badge-soft-${tone})`) is resolved per
    // tone below rather than skipped: skipping is how the tone lanes would go unmeasured.
    pairs.push({ file: relative(ROOT, file), bg, fg });
  }
}

if (!pairs.length) fail('No component colour pairs found. The matcher no longer matches; this gate is measuring nothing.');

const TEMPLATE_TONES = ['success', 'warning', 'danger', 'info', 'neutral'];
const expand = (value) => (value.includes('${')
  ? TEMPLATE_TONES.map((tone) => value.replace(/\$\{[^}]+\}/g, tone))
  : [value]);

const findings = [];
let measured = 0;
for (const pair of pairs) {
  for (const preset of presets) {
    for (const scheme of ['light', 'dark']) {
      const vars = getGdsVibeThemeCssVariables(preset, scheme);
      for (const bgValue of expand(pair.bg)) {
        for (const fgValue of expand(pair.fg)) {
          // Only compare a tone against its own lane; success-bg vs danger-fg is a pair no
          // component ever renders, and reporting it would bury the real findings.
          const bgTone = TEMPLATE_TONES.find((t) => bgValue.includes(t));
          const fgTone = TEMPLATE_TONES.find((t) => fgValue.includes(t));
          if (pair.bg.includes('${') && pair.fg.includes('${') && bgTone !== fgTone) continue;

          const bg = resolve(bgValue, vars);
          const fg = resolve(fgValue, vars);
          if (!bg || !fg) continue;
          const ratio = getGdsContrastRatio(fg.color, bg.color);
          if (ratio === null) continue;
          measured += 1;
          if (ratio < 4.5) {
            findings.push({ ...pair, preset, scheme, bgToken: bg.token, fgToken: fg.token, ratio });
          }
        }
      }
    }
  }
}

if (!measured) fail('Pairs were found but none could be resolved to colours. The resolver is broken, not the system clean.');

// WCAG 1.4.3 exempts "text that is part of an inactive user interface component" from the
// contrast minimum. A disabled control's label is exactly that, so gating it would be
// inventing a requirement the standard does not make. It is REPORTED with its measured ratio
// rather than dropped: an exemption nobody can see is indistinguishable from a gap nobody
// noticed, which is the failure this whole issue is about.
const inactive = (f) => /disabled/i.test(`${f.bgToken}${f.fgToken}`);
const reported = findings.filter(inactive);
const enforced = findings.filter((f) => !inactive(f));

// Worst case per (file, token pair): 25 presets x 2 schemes of the same defect is one defect.
const worst = new Map();
for (const f of enforced) {
  const key = `${f.file}|${f.bgToken}|${f.fgToken}`;
  if (!worst.has(key) || worst.get(key).ratio > f.ratio) worst.set(key, f);
}

console.log('Component colour pairs (issue 597)\n');
console.log(`  pairs declared      ${String(pairs.length).padStart(5)}`);
console.log(`  combinations        ${String(measured).padStart(5)}  (${presets.length} presets x 2 schemes)`);
console.log(`  below 4.5:1         ${String(worst.size).padStart(5)}  distinct pairings`);

const reportedWorst = new Map();
for (const f of reported) {
  const key = `${f.file}|${f.bgToken}|${f.fgToken}`;
  if (!reportedWorst.has(key) || reportedWorst.get(key).ratio > f.ratio) reportedWorst.set(key, f);
}
if (reportedWorst.size) {
  console.log('\n  Reported, not enforced — WCAG 1.4.3 exempts inactive components:');
  for (const f of [...reportedWorst.values()].sort((a, b) => a.ratio - b.ratio)) {
    console.log(`    ${f.file}: ${f.fgToken} on ${f.bgToken} = ${f.ratio.toFixed(2)}:1 (${f.preset}/${f.scheme})`);
  }
}

if (worst.size) {
  console.error('\nComponent-declared pairs below 4.5:1 (worst preset shown):');
  for (const f of [...worst.values()].sort((a, b) => a.ratio - b.ratio)) {
    console.error(`- ${f.file}\n    ${f.fgToken} on ${f.bgToken} = ${f.ratio.toFixed(2)}:1  (${f.preset}/${f.scheme})`);
  }
  console.error('\nA fixed foreground on a themeable fill cannot be verified by inspection. Pair the fill with a foreground DERIVED against it (see emitBadgeToneCssVariables).');
  process.exit(1);
}

console.log('\nEvery component-declared colour pair clears 4.5:1 in every preset and scheme.');
