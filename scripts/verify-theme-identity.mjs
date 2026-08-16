// Checks every shipped theme has a distinct, stable identity. The identity keys the themed
// subtree remount; a collision means switching between two themes does not remount.
// Output: audit/theme-identity.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const { computeGdsThemeIdentity, getGdsVibeThemes } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));

if (!computeGdsThemeIdentity) {
  console.error('FAIL could not load computeGdsThemeIdentity from packages/gds-theme/dist — run `npm run build` first.');
  process.exit(1);
}

const presets = getGdsVibeThemes();
if (!presets.length) { console.error('FAIL no presets found; the gate cannot pass vacuously.'); process.exit(1); }

// Canary: check two inputs that must (not) collide before trusting a clean sweep.
const same = computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' });
const sameAgain = computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' });
if (same !== sameAgain) {
  console.error('FAIL the identity is not stable for identical inputs; it would remount on every render.');
  process.exit(1);
}
const differs = computeGdsThemeIdentity({ preset: 'default', colorScheme: 'dark' });
if (same === differs) {
  console.error('FAIL light and dark produced the same identity. The computation is not reading the resolved tokens,');
  console.error('     and a clean sweep below would mean nothing.');
  process.exit(1);
}

const seen = new Map();
const collisions = [];
for (const { id } of presets) {
  for (const scheme of ['light', 'dark']) {
    const identity = computeGdsThemeIdentity({ preset: id, colorScheme: scheme });
    const previous = seen.get(identity);
    if (previous) collisions.push({ identity, a: previous, b: `${id}/${scheme}` });
    else seen.set(identity, `${id}/${scheme}`);
  }
}

const expected = presets.length * 2;
mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/theme-identity.json'), `${JSON.stringify({
  themesChecked: expected, distinctIdentities: seen.size, collisionCount: collisions.length, collisions,
}, null, 2)}\n`);

console.log('Theme identity (issue 561)\n');
console.log(`  preset x scheme      ${String(expected).padStart(4)}`);
console.log(`  distinct identities  ${String(seen.size).padStart(4)}`);
console.log(`  collisions           ${String(collisions.length).padStart(4)}`);

if (collisions.length) {
  console.error('');
  for (const c of collisions) console.error(`FAIL ${c.a} and ${c.b} share identity ${c.identity} — switching between them would not remount.`);
  console.error(`\n${collisions.length} identity collision(s).`);
  process.exit(1);
}
if (seen.size !== expected) {
  console.error(`\nFAIL expected ${expected} distinct identities, got ${seen.size}.`);
  process.exit(1);
}
console.log(`\nEvery shipped theme has a distinct, stable identity.`);
