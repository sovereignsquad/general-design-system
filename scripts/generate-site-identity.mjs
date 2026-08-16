// Generates the reference site's favicon and OG card from the default theme's resolved
// palette and the pin silhouette the system already owns. Deterministic: an unchanged source
// produces a no-op re-run.
//
// OG card is geometry-only: rasterizing text needs a bundled font (the wasm renderer has no
// system fonts). The favicon stays SVG and may use <text>, which browsers render with real
// system fonts.
//
// Output: apps/playground/public/favicon.svg, apps/playground/public/og-card.png
// Run: node scripts/generate-site-identity.mjs   (wired into artifacts:refresh)

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

const ROOT = new URL('..', import.meta.url).pathname;

const theme = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
const core = await import(join(ROOT, 'packages/gds-core/dist/index.js'));
const vibe = theme.getGdsVibeThemeCssVariables('default', 'light');
const [primary, accent] = [vibe['--gds-vibe-primary'], vibe['--gds-vibe-accent']];
const pinPath = core.GDS_PIN_SILHOUETTE_PATH;
if (!primary || !accent || !pinPath) {
  console.error('Site identity generation: could not resolve palette or pin path from dist — run the package builds first.');
  process.exit(1);
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#g)"/>
  <text x="24" y="25" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-weight="700" font-size="24" fill="#ffffff">G</text>
</svg>
`;
writeFileSync(join(ROOT, 'apps/playground/public/favicon.svg'), favicon);

// House gradient with the pin silhouette as a quiet oversized motif, same treatment as the
// hero, at OG dimensions.
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(880 300) rotate(-12) scale(22)" opacity="0.16">
    <path d="${pinPath}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(-12 -12)"/>
  </g>
  <g transform="translate(210 340) rotate(8) scale(11)" opacity="0.12">
    <path d="${pinPath}" fill="#ffffff" transform="translate(-12 -12)"/>
  </g>
  <rect x="80" y="470" width="220" height="14" rx="7" fill="#ffffff" opacity="0.9"/>
  <rect x="80" y="504" width="340" height="14" rx="7" fill="#ffffff" opacity="0.55"/>
</svg>`;

await initWasm(readFileSync(join(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm')));
const png = new Resvg(card, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
writeFileSync(join(ROOT, 'apps/playground/public/og-card.png'), png);
console.log(`Site identity generated: favicon.svg (${favicon.length}B), og-card.png (${png.length}B) from the default theme palette (${primary} -> ${accent}).`);
