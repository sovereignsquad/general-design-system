// No route breaks a word that would have fitted on its line, at 390px and 320px.
//
// A word split across lines reads as two words ("Boo k"). A split is a defect only when the
// whole word, measured unbroken in the element's own font, fits in the element's width:
// then a layout squeezed it. A word longer than its line must break, and breaks at a hyphen,
// slash, dash, comma or semicolon are ordinary line-break opportunities. Inside code, any
// punctuation is a break opportunity.
//
// Text that is aria-hidden, invisible or boxless is skipped.

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
const WIDTHS = [390, 320];

const AUDIT_EXPRESSION = `(() => {
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';
  document.body.appendChild(probe);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || el.closest('[aria-hidden="true"]')) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    const box = el.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1) continue;
    const inCode = Boolean(el.closest('code, pre'));
    const words = /\\S{3,}/g;
    for (let m = words.exec(node.textContent); m; m = words.exec(node.textContent)) {
      const word = m[0];
      if (/[-\\/\\u2013\\u2014,;]/.test(word) || (inCode && /[^A-Za-z0-9]/.test(word))) continue;
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + word.length);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      if (lines.size < 2) continue;
      probe.style.font = style.font;
      probe.style.letterSpacing = style.letterSpacing;
      probe.style.textTransform = style.textTransform;
      probe.textContent = word;
      const available = box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (probe.getBoundingClientRect().width > available + 0.5) continue;
      const entry = el.closest('[id^="entry-"]');
      found.push({ word, tag: el.tagName.toLowerCase(), entry: entry ? entry.id : null, width: Math.round(available) });
    }
  }
  probe.remove();
  return found;
})()`;

const routes = patternRoutes();
if (routes.length === 0) {
  console.error('No routes declared — refusing to pass vacuously.');
  process.exit(1);
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'word-wrap' });
const browserSession = await launchChromeBrowser({
  tmpPrefix: 'gds-word-wrap-',
  portBase: 9300,
  portRange: 100,
  windowSize: '390,844',
  verificationLabel: 'word-wrap',
  unrefBrowser: true,
});

const problems = [];
let sweeps = 0;

try {
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  for (const width of WIDTHS) {
    await client.send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 2, mobile: true });
    for (const route of routes) {
      await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
      if (!(await waitForReady(client))) {
        problems.push(`${route} at ${width}px: page did not render readable content.`);
        continue;
      }
      await wait(250);
      const found = await evaluate(client, AUDIT_EXPRESSION);
      sweeps += 1;
      for (const f of found) {
        problems.push(`${route} at ${width}px: "${f.word}" in <${f.tag}>${f.entry ? ` (${f.entry})` : ''} breaks mid-word though it fits in ${f.width}px.`);
      }
    }
  }
  await client.close();
} finally {
  await browserSession.close();
  await server?.kill('SIGTERM');
}

if (problems.length > 0) {
  console.error(`Word wrap failed (${problems.length}):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Word wrap passed: ${routes.length} routes at ${WIDTHS.join('px and ')}px (${sweeps} sweeps); no word that fits its line breaks mid-word.`);
process.exit(0);
