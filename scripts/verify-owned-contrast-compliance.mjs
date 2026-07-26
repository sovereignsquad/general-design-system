import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const sourceRoots = [
  resolve(root, 'packages/gds-core/src'),
  resolve(root, 'apps/playground/src'),
];
const helperFile = resolve(root, 'packages/gds-core/src/OwnedContrastSurface.tsx');
const explorerFile = resolve(root, 'packages/gds-core/src/ReferenceThemeExplorer.tsx');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

const failures = [];
const helperSource = readFileSync(helperFile, 'utf8');
const explorerSource = readFileSync(explorerFile, 'utf8');

for (const proof of [
  'createGdsOwnedContrastTokens',
  'getGdsOwnedContrastProps',
  'data-gds-owned-contrast',
  'data-gds-local-contrast',
]) {
  if (!helperSource.includes(proof)) {
    failures.push(`OwnedContrastSurface.tsx must preserve helper proof: ${proof}`);
  }
}

for (const proof of [
  'getGdsOwnedContrastProps',
  'createGdsOwnedContrastTokens',
  // Owned contrast is reserved for the vibe *swatch* surfaces (gallery, contract,
  // Athlete Gold reference). The primary Theme Lab control/result cards must NOT
  // carry it — they re-theme globally like any `.gds-paper` (issue #461) — so the
  // retired `theme-lab-controls` role is intentionally absent from this list.
  "role: 'vibe-gallery-card'",
  "role: 'vibe-contract'",
  "role: 'athlete-gold-reference'",
]) {
  if (!explorerSource.includes(proof)) {
    failures.push(`ReferenceThemeExplorer.tsx must consume the owned-contrast contract: ${proof}`);
  }
}

// Guard the fix: the retired role must not creep back onto the control cards.
if (explorerSource.includes("role: 'theme-lab-controls'")) {
  failures.push("ReferenceThemeExplorer.tsx must not re-introduce the retired 'theme-lab-controls' owned-contrast role (issue #461): the Theme Lab control cards re-theme globally, not via a bespoke owned-contrast surface.");
}

for (const sourceRoot of sourceRoots) {
  for (const file of walk(sourceRoot)) {
    if (file === helperFile || /\.test\.tsx?$/.test(file)) {
      continue;
    }

    const source = readFileSync(file, 'utf8');
    if (source.includes('data-gds-local-contrast=') || source.includes('data-gds-owned-contrast=')) {
      failures.push(`${relative(root, file)} may not declare owned/local contrast markers directly. Use getGdsOwnedContrastProps().`);
    }
  }
}

if (failures.length) {
  console.error('Owned contrast compliance verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Owned contrast compliance verification passed.');
