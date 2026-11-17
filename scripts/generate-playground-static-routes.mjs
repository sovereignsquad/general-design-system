import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(repoRoot, 'apps', 'playground', 'dist');
const indexPath = join(distRoot, 'index.html');

// Route shells are derived from the router so a new route cannot be left without one:
// every literal `path="..."` in App.tsx except "/" and parameterised paths.
const appSource = readFileSync(join(repoRoot, 'apps', 'playground', 'src', 'App.tsx'), 'utf8');
const staticRoutes = [...new Set([...appSource.matchAll(/\bpath="(\/[^"]*)"/g)].map((match) => match[1]))]
  .filter((route) => route !== '/' && !/[:*]/.test(route))
  .sort();

// Every route the site navigation declares must have a shell.
const siteRoutesSource = readFileSync(join(repoRoot, 'apps', 'playground', 'src', 'site-routes.ts'), 'utf8');
const declared = [...siteRoutesSource.matchAll(/\bpath: '(\/[^']*)'/g)].map((match) => match[1]).filter((route) => route !== '/');
const missing = declared.filter((route) => !staticRoutes.includes(route));
if (missing.length > 0) {
  throw new Error(`site-routes.ts declares routes with no <Route path> in App.tsx: ${missing.join(', ')}`);
}

if (!existsSync(indexPath)) {
  throw new Error(`Missing playground build shell at ${indexPath}`);
}

for (const route of staticRoutes) {
  const routeDir = join(distRoot, route.replace(/^\//, ''));
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(indexPath, join(routeDir, 'index.html'));
}

copyFileSync(indexPath, join(distRoot, '404.html'));

// The agent index is served from the site as the repository copy itself, so the two cannot differ.
copyFileSync(join(repoRoot, 'llms.txt'), join(distRoot, 'llms.txt'));

console.log(`Generated ${staticRoutes.length} static playground route shells.`);
