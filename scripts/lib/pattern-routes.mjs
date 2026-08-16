// The route set the coverage matrix sweeps, read from App.tsx rather than hand-listed.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;

/** Every route the playground declares, in declaration order. */
export function patternRoutes() {
  const source = readFileSync(join(ROOT, 'apps/playground/src/App.tsx'), 'utf8');
  const routes = [...source.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((path) => path !== '*' && !path.includes(':'));   // wildcards and params have no single URL
  return [...new Set(routes)].map((path) => (path.startsWith('/') ? path : `/${path}`));
}
