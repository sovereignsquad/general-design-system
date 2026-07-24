import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const srcDir = resolve(root, 'apps/playground/src');
const basePrefix = '/general-design-system';

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.tsx?$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

const appSource = readFileSync(resolve(srcDir, 'App.tsx'), 'utf8');
const routesSource = readFileSync(resolve(srcDir, 'site-routes.ts'), 'utf8');

// Registered routes: every literal <Route path="..."> in App.tsx (the source
// of truth for what the router actually serves), plus publicSiteRoutes'
// `path` values and getLegacyRedirects()'s `legacyPath` values (both of
// which are valid navigation targets even though the latter renders a
// <Navigate> rather than a page).
const validPaths = new Set(['/']);
for (const match of appSource.matchAll(/<Route\s+path=["']([^"']+)["']/g)) {
  validPaths.add(match[1]);
}
for (const match of routesSource.matchAll(/path:\s*'([^']+)'/g)) {
  validPaths.add(match[1]);
}
for (const match of routesSource.matchAll(/legacyPaths:\s*\[([^\]]*)\]/g)) {
  for (const pathMatch of match[1].matchAll(/'([^']+)'/g)) {
    validPaths.add(pathMatch[1]);
  }
}

function isKnownPath(path) {
  // Deliberately an EXACT match against literal <Route> paths only — no
  // prefix-matching fallback. site-routes.ts's isRouteActive() uses prefix
  // matching for nav-highlighting purposes (any /patterns/* sub-path is
  // "active" under the /patterns nav item), but that's the wrong semantics
  // here: a link to a genuinely nonexistent nested path (e.g.
  // /patterns/typo-route) must still fail this check, not be waved through
  // because it happens to share a registered top-level prefix.
  return validPaths.has(path);
}

const failures = [];
const files = walk(srcDir);

for (const file of files) {
  if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
  const source = readFileSync(file, 'utf8');
  const relativeFile = file.replace(`${root}/`, '');

  for (const match of source.matchAll(/(?:href|to)=["'](\/[a-z0-9/-]*)["']/gi)) {
    let path = match[1];
    if (path.startsWith(basePrefix)) {
      path = path.slice(basePrefix.length) || '/';
    }
    if (!path.startsWith('/')) continue;
    // Skip anything still carrying the raw base prefix unresolved (e.g. an
    // external or asset path that happens to start with a slash) — only
    // check paths that look like in-app site routes (single path segment
    // start matches a known top-level route family).
    if (!isKnownPath(path)) {
      failures.push(`${relativeFile}: internal link "${match[1]}" does not resolve to any registered route.`);
    }
  }
}

if (failures.length > 0) {
  console.error('Playground route-link verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Playground route-link verification passed (${validPaths.size} registered routes, ${files.length} files scanned).`);
