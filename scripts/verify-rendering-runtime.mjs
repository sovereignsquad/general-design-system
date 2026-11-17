// Rendering-quality rules on every reference-site route, at 390px and 1280px, in light and dark:
//
// 1. Heading consistency: within one scope (the page, one pattern entry, one dialog) each
//    heading level renders at one font weight and one font size.
// 2. Headings read as headings: weight >= 600 or size >= 1.125x the body size.
// 3. No near-miss overflow: an element that scrolls overflows by more than 8px. A smaller
//    overflow is a rounding or border artefact that shows a scrollbar for nothing.
// 4. Scroll regions are keyboard-reachable (WCAG 2.1.1): an element that scrolls is focusable
//    or contains something focusable.
//
// Hidden, aria-hidden and boxless elements are skipped.
import {
  createCdpClient,
  launchBrowser as launchChromeBrowser,
  startPreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';
import { patternRoutes } from './lib/pattern-routes.mjs';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const WIDTHS = [390, 1280];
const SCHEMES = ['light', 'dark'];
const NEAR_MISS_PX = 8;
const HEADING_MIN_WEIGHT = 600;
const HEADING_MIN_SIZE_RATIO = 1.125;

const AUDIT_EXPRESSION = `(() => {
  const out = { mixed: [], bodyLike: [], nearMiss: [], unreachable: [] };
  const visible = (el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };
  const describe = (el) => {
    const entry = el.closest('[id^="entry-"]');
    const text = (el.textContent || '').trim().slice(0, 40);
    return el.tagName.toLowerCase() + (text ? ' "' + text + '"' : '') + (entry ? ' (' + entry.id + ')' : '');
  };
  const body = parseFloat(getComputedStyle(document.body).fontSize) || 16;
  const scopes = new Map();
  for (const h of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    if (!visible(h)) continue;
    const style = getComputedStyle(h);
    const weight = parseFloat(style.fontWeight);
    const size = parseFloat(style.fontSize);
    if (weight < ${HEADING_MIN_WEIGHT} && size < body * ${HEADING_MIN_SIZE_RATIO}) {
      out.bodyLike.push(describe(h) + ' is ' + weight + ' at ' + size + 'px, like body text (' + body + 'px)');
    }
    const scopeEl = h.closest('[id^="entry-"], [role="dialog"]');
    const key = (scopeEl ? (scopeEl.id || 'dialog') : 'page') + ' ' + h.tagName.toLowerCase();
    if (!scopes.has(key)) scopes.set(key, new Set());
    scopes.get(key).add(weight + '/' + size + 'px');
  }
  for (const [key, styles] of scopes) if (styles.size > 1) out.mixed.push(key + ': ' + [...styles].join(', '));
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    const scrollsX = /(auto|scroll)/.test(style.overflowX);
    const scrollsY = /(auto|scroll)/.test(style.overflowY);
    if (!scrollsX && !scrollsY) continue;
    const over = Math.max(scrollsX ? el.scrollWidth - el.clientWidth : 0, scrollsY ? el.scrollHeight - el.clientHeight : 0);
    if (over <= 0 || !visible(el)) continue;
    if (over <= ${NEAR_MISS_PX}) out.nearMiss.push(describe(el) + ' overflows by ' + over + 'px');
    const reachable = el.tabIndex >= 0 || el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!reachable) out.unreachable.push(describe(el) + ' scrolls ' + over + 'px with nothing focusable');
  }
  return out;
})()`;

const routes = patternRoutes();
if (routes.length === 0) {
  console.error('No routes declared — refusing to pass vacuously.');
  process.exit(1);
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'rendering' });
const browserSession = await launchChromeBrowser({
  tmpPrefix: 'gds-rendering-',
  portBase: 9400,
  portRange: 100,
  windowSize: '1280,900',
  verificationLabel: 'rendering',
  unrefBrowser: true,
});

const problems = [];
let sweeps = 0;
const RULE_LABELS = {
  mixed: 'mixed heading styles',
  bodyLike: 'heading looks like body text',
  nearMiss: 'near-miss overflow',
  unreachable: 'scroll region not keyboard-reachable',
};

try {
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  await client.send('Page.enable');
  for (const scheme of SCHEMES) {
    await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    for (const width of WIDTHS) {
      await client.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      for (const route of routes) {
        await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
        if (!(await waitForReady(client))) {
          problems.push(`${route} ${scheme} ${width}px: page did not render readable content.`);
          continue;
        }
        await wait(250);
        const found = await evaluate(client, AUDIT_EXPRESSION);
        sweeps += 1;
        for (const [rule, label] of Object.entries(RULE_LABELS)) {
          for (const detail of found[rule]) problems.push(`${route} ${scheme} ${width}px — ${label}: ${detail}`);
        }
      }
    }
  }
  await client.close();
} finally {
  await browserSession.close();
  await server?.kill('SIGTERM');
}

if (problems.length > 0) {
  console.error(`Rendering quality failed (${problems.length}):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Rendering quality passed: ${routes.length} routes x ${SCHEMES.length} schemes x ${WIDTHS.length} widths (${sweeps} sweeps); headings consistent and distinct from body text, no near-miss overflow, every scroll region keyboard-reachable.`);
process.exit(0);
