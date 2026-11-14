// Every axis-family token a GDS component reads without a fallback must resolve in each lane
// that runs without the preset runtime. A lane's declared set is the unconditional `:root` and
// `html[data-mantine-color-scheme]` declarations in packages/gds-theme/styles.css plus that
// lane's `theme.other.gdsCssVariables`. References are followed transitively.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const stylesPath = resolve(root, 'packages/gds-theme/styles.css');
const themeDist = resolve(root, 'packages/gds-theme/dist/index.mjs');
const AXIS_FAMILY = /^--gds-(space|radius|elevation|control-height|shell-height|layout|font-size|line-height|weight|reaction|density|focus-ring|badge|chart|brand|state|nav)(-|$)/;
const HELPER_FAMILY = { gdsRadius: 'radius', gdsSpace: 'space', gdsElevation: 'elevation' };

if (!existsSync(themeDist)) {
  console.error('packages/gds-theme/dist is missing; build @sovereignsquad/gds-theme first.');
  process.exit(1);
}
const theme = await import(pathToFileURL(themeDist).href);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Top-level rules only: declarations nested in @media / @supports are conditional.
export function readUnconditionalRootDeclarations(css) {
  const source = stripComments(css);
  const declared = {};
  let depth = 0;
  let selectorStart = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      if (depth === 0) {
        const selector = source.slice(selectorStart, i).trim();
        const close = findClose(source, i);
        const unconditional = selector === ':root' || /^html\[data-mantine-color-scheme='(light|dark)'\]$/.test(selector);
        if (unconditional) {
          for (const match of source.slice(i + 1, close).matchAll(/(--gds-[\w-]+)\s*:\s*([^;]+);/g)) {
            declared[match[1]] = match[2].trim();
          }
        }
        i = close;
        selectorStart = close + 1;
        continue;
      }
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
    } else if (ch === ';' && depth === 0) {
      selectorStart = i + 1;
    }
  }
  return declared;
}

function findClose(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return source.length;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/^(node_modules|dist|__snapshots__)$/.test(entry.name)) walk(path, out);
    } else if (/\.(tsx?|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

// `var(--gds-name)` with no fallback, and the var() references the GDS helpers return.
export function collectNoFallbackReads(files) {
  const reads = new Map();
  const add = (name, where) => {
    if (!AXIS_FAMILY.test(name)) return;
    if (!reads.has(name)) reads.set(name, []);
    reads.get(name).push(where);
  };
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      const where = `${relative(root, file)}:${index + 1}`;
      for (const match of line.matchAll(/var\((--gds-[\w-]+)\s*\)/g)) add(match[1], where);
      for (const match of line.matchAll(/\b(gdsRadius|gdsSpace|gdsElevation)\(\s*'([\w-]+)'\s*\)/g)) {
        add(`--gds-${HELPER_FAMILY[match[1]]}-${match[2]}`, where);
      }
    });
  }
  return reads;
}

function resolves(name, declared, seen = new Set()) {
  if (seen.has(name)) return false;
  seen.add(name);
  const value = declared[name];
  if (value === undefined) return false;
  for (const match of value.matchAll(/var\((--gds-[\w-]+)\s*\)/g)) {
    if (!resolves(match[1], declared, seen)) return false;
  }
  return true;
}

const opts = { brandColors: { navy: '#0b223e', terracotta: '#ca8570', sage: '#90a287', cream: '#faf7f1', slate: '#434c59' }, fonts: { display: 'Bogart', body: 'Garet' } };
const lanes = {
  gdsTheme: theme.gdsTheme,
  gdsDarkPublicTheme: theme.gdsDarkPublicTheme,
  'createPublicBrandTheme()': theme.createPublicBrandTheme(),
  'createPublicBrandTheme({ flatSurfaces: true })': theme.createPublicBrandTheme({ flatSurfaces: true }),
  'createPublicBrandTheme({ editorialSerif: true })': theme.createPublicBrandTheme({ editorialSerif: true }),
  'createBrandTheme({ brandColors, fonts })': theme.createBrandTheme(opts).mantineTheme,
};

const rootDeclared = readUnconditionalRootDeclarations(readFileSync(stylesPath, 'utf8'));
const files = [...walk(resolve(root, 'packages')).filter((file) => file.includes(`${join('src', '')}`)), stylesPath];
const reads = collectNoFallbackReads(files);
if (reads.size === 0) {
  console.error('Found no axis-family reads without a fallback — refusing to pass vacuously.');
  process.exit(1);
}

const failures = [];
for (const [lane, laneTheme] of Object.entries(lanes)) {
  const declared = { ...rootDeclared, ...(laneTheme?.other?.gdsCssVariables ?? {}) };
  for (const [name, where] of reads) {
    if (!resolves(name, declared)) failures.push(`${lane}: ${name} does not resolve (read at ${where.slice(0, 3).join(', ')}${where.length > 3 ? ', …' : ''})`);
  }
}

if (failures.length > 0) {
  console.error(`Default-lane axis token verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Default-lane axis token verification passed: ${reads.size} axis tokens read without a fallback resolve in all ${Object.keys(lanes).length} non-preset lanes.`);
