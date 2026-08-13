// Issue 597 — a badge pair whose contrast CANNOT BE COMPUTED is a build failure.
//
// #534 measured two light-variant badges at 1.81:1 and 2.55:1. The deeper defect is not those
// two numbers: it is that Mantine's `light` variant paints a LOW-ALPHA tint, and a translucent
// background has no contrast ratio of its own. Every contrast sweep in this system therefore
// walked past 83 badges without measuring them. They were not passing. They were INVISIBLE —
// and zero findings from a check that cannot see its subject reads exactly like a clean bill.
//
// So this gate fails on two distinct conditions, and the first one matters more:
//
//   1. UNCOMPUTABLE — the badge's own background is partially transparent, so its legibility
//      depends on whatever it happens to be dropped onto. No token-level guarantee can exist.
//   2. TOO LOW — the pair resolves opaquely but measures under 4.5:1.
//
// Condition 1 is the one that was silently true before the variant resolver in gds-theme
// governed the `light` lane into an opaque `color-mix`.
//
// Scope, stated rather than implied: every pattern route, both schemes, at the default preset.
// Preset-independence is covered numerically instead — packages/gds-theme/src/variant-colors
// .test.ts sweeps all 25 presets x 2 schemes x 14 Mantine colours and reports the worst case.
// Doing that here would mean 1,200 navigations for a property that does not vary by route.

import { join } from 'node:path';
import {
  createCdpClient, launchBrowser, startPreviewServer,
  wait, waitForReady, evaluate, disposeBrowser,
} from './lib/browser-runtime.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { patternRoutes } = await import(join(ROOT, 'scripts/lib/pattern-routes.mjs'));
const routes = patternRoutes();
if (!routes.length) fail('No routes resolved; this gate must not pass vacuously.');

const baseUrl = process.env.GDS_BADGE_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_BADGE_BASE_URL;
const previewServer = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'badge-contrast' });
const session = await launchBrowser({ tmpPrefix: 'gds-badge-contrast-', portBase: 9600, portRange: 200 });
const client = await createCdpClient(session.webSocketDebuggerUrl);

const uncomputable = [];
const tooLow = [];
let badgesSeen = 0;

try {
  await client.send('Page.enable');
  for (const scheme of ['light', 'dark']) {
    await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    for (const route of routes) {
      await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
      await wait(200);
      await waitForReady(client);

      const found = await evaluate(client, `(() => {
        // Chrome reports a resolved color-mix() as \`color(srgb r g b / a)\` with 0-1 components,
        // not as rgb(). Parsing only rgb() made every governed badge look UNPARSEABLE — the
        // gate reported 344 failures on a page that had just been fixed. A contrast gate that
        // cannot read the format its own fix produces is worse than no gate: it fails loudly
        // in the one state it was built to bless.
        const rgba = (s) => {
          const c = /color\\(srgb\\s+([^)]+)\\)/.exec(s || '');
          if (c) {
            const [chan, alpha] = c[1].split('/');
            const p = chan.trim().split(/\\s+/).map((v) => parseFloat(v) * 255);
            return { r: p[0], g: p[1], b: p[2], a: alpha === undefined ? 1 : parseFloat(alpha) };
          }
          const m = /rgba?\\(([^)]+)\\)/.exec(s || '');
          if (!m) return null;
          const p = m[1].split(',').map((v) => parseFloat(v));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lum = ({ r, g, b }) => {
          const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (x, y) => {
          const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
          return (a + 0.05) / (b + 0.05);
        };
        const over = (fg, bg) => ({
          r: fg.r * fg.a + bg.r * (1 - fg.a),
          g: fg.g * fg.a + bg.g * (1 - fg.a),
          b: fg.b * fg.a + bg.b * (1 - fg.a),
          a: 1,
        });

        const out = [];
        for (const el of document.querySelectorAll('.mantine-Badge-root, [class*="Badge-root"]')) {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue;

          const own = rgba(s.backgroundColor);
          const fg = rgba(s.color);
          if (!own || !fg) { out.push({ reason: 'unparseable', text: el.textContent.trim().slice(0, 40), bg: s.backgroundColor, fg: s.color }); continue; }

          // A fully transparent own background is fine: the badge inherits an ancestor surface,
          // and compositing up the chain resolves it deterministically. A PARTIALLY transparent
          // one is the defect — the result depends on the drop target, so no guarantee exists.
          if (own.a > 0 && own.a < 1) {
            out.push({ reason: 'translucent', text: el.textContent.trim().slice(0, 40), bg: s.backgroundColor, fg: s.color, alpha: own.a });
            continue;
          }

          let bg = own;
          if (own.a === 0) {
            let node = el.parentElement;
            while (node) {
              const c = rgba(getComputedStyle(node).backgroundColor);
              if (c && c.a === 1) { bg = c; break; }
              if (c && c.a > 0) { out.push({ reason: 'translucent-ancestor', text: el.textContent.trim().slice(0, 40), bg: getComputedStyle(node).backgroundColor, fg: s.color, alpha: c.a }); bg = null; break; }
              node = node.parentElement;
            }
            if (bg === null) continue;
            if (bg === own) bg = { r: 255, g: 255, b: 255, a: 1 };
          }

          const resolved = fg.a < 1 ? over(fg, bg) : fg;
          out.push({ reason: 'measured', text: el.textContent.trim().slice(0, 40), bg: s.backgroundColor, fg: s.color, ratio: ratio(resolved, bg) });
        }
        return out;
      })()`);

      for (const badge of found ?? []) {
        badgesSeen += 1;
        if (badge.reason === 'measured') {
          // 4.5:1 flat. Badge text is small and often the only carrier of a status, so the
          // large-text exemption does not apply to it.
          if (badge.ratio < 4.5) tooLow.push({ route, scheme, ...badge });
        } else {
          uncomputable.push({ route, scheme, ...badge });
        }
      }
    }
  }
} finally {
  await disposeBrowser(session.browser, session.userDataDir);
  // `kill`, not `close`: the handle from startPreviewServer has no `close`, so an optional
  // call to it is a SILENT NO-OP that leaks the server. It then holds port 4173, and the next
  // runtime gate — which spawns with --strictPort — waits on that port forever. Observed:
  // a preflight run that sat on verify:forced-colors-runtime indefinitely, and, earlier, a
  // gate run served by a stale build that reported 344 already-fixed failures.
  await previewServer?.kill('SIGTERM');
}

console.log('Badge contrast (issue 597)\n');
console.log(`  routes x schemes    ${String(routes.length * 2).padStart(5)}`);
console.log(`  badges measured     ${String(badgesSeen).padStart(5)}`);
console.log(`  uncomputable        ${String(uncomputable.length).padStart(5)}`);
console.log(`  below 4.5:1         ${String(tooLow.length).padStart(5)}`);

// Zero badges is what a broken selector reports, and it is indistinguishable from a clean
// system. The system renders badges on many routes, so seeing none means this gate stopped
// looking — the exact failure it was written to end.
if (!badgesSeen) fail('No badges were found across any route. The selector no longer matches; this gate is measuring nothing.');

const show = (list, label) => {
  console.error(`\n${label}:`);
  for (const b of list.slice(0, 12)) {
    console.error(`- ${b.route} [${b.scheme}] "${b.text}" bg=${b.bg} fg=${b.fg}${b.ratio ? ` ratio=${b.ratio.toFixed(2)}` : ''}`);
  }
  if (list.length > 12) console.error(`  ...and ${list.length - 12} more`);
};

if (uncomputable.length) {
  show(uncomputable, 'Badge pairs whose contrast CANNOT BE COMPUTED');
  console.error('\nA translucent badge background has no contrast ratio of its own: legibility depends on the surface it lands on. Give the badge an opaque background (see the variantColorResolver in packages/gds-theme/src/theme.ts).');
}
if (tooLow.length) show(tooLow, 'Badge pairs below 4.5:1');
if (uncomputable.length || tooLow.length) process.exit(1);

console.log('\nEvery rendered badge resolves to an opaque pair and clears 4.5:1.');
