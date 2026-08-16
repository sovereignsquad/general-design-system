// Checks that no route makes content unreachable at 390px viewport width. An element beyond
// the viewport edge is a defect only if nothing can bring it into view:
//
//   1. An ancestor with `overflow-x: auto|scroll` that actually scrolls (scrollWidth >
//      clientWidth) makes it a rail — reachable by design.
//   2. An ancestor with `overflow-x: hidden|clip` clips it. Broken only if the element carries
//      reader content (text, image, control); decorative elements may be cropped.
//   3. An ancestor a CSS transform has moved entirely off the viewport is off-canvas chrome
//      (e.g. Mantine AppShell's collapsed mobile navbar), reachable via its trigger.
//   4. Otherwise the overflow reaches the document and the page pans sideways — not allowed.
//
// Elements that are aria-hidden, inert, invisible, or boxless are not counted as content.

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
const VIEWPORT_WIDTH = 390;

const AUDIT_EXPRESSION = `(() => {
  const vw = document.documentElement.clientWidth;
  const failures = [];

  const isHiddenFromReaders = (el) => {
    for (let node = el; node; node = node.parentElement) {
      if (node.getAttribute?.('aria-hidden') === 'true' || node.inert) return true;
    }
    const style = getComputedStyle(el);
    return style.visibility === 'hidden' || style.display === 'none';
  };

  // Reader content only; a wrapping layout element is not itself the defect.
  const isContent = (el) => {
    // alt="" declares an image decorative (ARIA contract); cropping it is not a loss.
    if (el.tagName === 'IMG') return el.getAttribute('alt') !== '';
    if (['SVG', 'VIDEO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(el.tagName)) return true;
    return [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
  };

  const verdictFor = (el) => {
    // Region the element must appear inside to be seen: viewport narrowed by each clipping
    // ancestor. Off-canvas is judged against this region, not the raw viewport.
    let clipLeft = 0;
    let clipRight = vw;
    let clipped = false;
    for (let node = el.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.transform !== 'none') {
        const box = node.getBoundingClientRect();
        if (box.right <= clipLeft || box.left >= clipRight) return 'off-canvas';
      }
      const overflowX = style.overflowX;
      if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1) {
        return 'rail';
      }
      if (overflowX === 'hidden' || overflowX === 'clip') {
        const box = node.getBoundingClientRect();
        clipLeft = Math.max(clipLeft, box.left);
        clipRight = Math.min(clipRight, box.right);
        clipped = true;
      }
    }
    return clipped ? 'clipped' : 'document';
  };

  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= vw + 1 && rect.left >= -1) continue;
    if (isHiddenFromReaders(el) || !isContent(el)) continue;

    const verdict = verdictFor(el);
    if (verdict === 'rail' || verdict === 'off-canvas') continue;
    failures.push({
      verdict,
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 60),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
    });
  }

  return {
    viewportWidth: vw,
    documentScrollWidth: document.documentElement.scrollWidth,
    failures: failures.slice(0, 10),
    failureCount: failures.length,
  };
})()`;

const routes = patternRoutes();
if (routes.length === 0) {
  console.error('No routes declared — refusing to pass vacuously.');
  process.exit(1);
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'viewport-reachability' });
const browserSession = await launchChromeBrowser({
  tmpPrefix: 'gds-viewport-reachability-',
  portBase: 9700,
  portRange: 300,
  windowSize: `${VIEWPORT_WIDTH},844`,
  verificationLabel: 'viewport-reachability',
  unrefBrowser: true,
});

const problems = [];
let sweptRoutes = 0;

try {
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  // Headless Chrome refuses window widths under ~500px; device emulation pins 390.
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT_WIDTH, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  for (const route of routes) {
    await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
    if (!(await waitForReady(client))) {
      problems.push(`${route}: page did not render readable content — cannot audit what did not paint.`);
      continue;
    }
    await wait(250);
    const audit = await evaluate(client, AUDIT_EXPRESSION);
    sweptRoutes += 1;
    if (audit.failureCount > 0) {
      for (const f of audit.failures) {
        problems.push(
          `${route}: <${f.tag}> "${f.text}" spans ${f.left}..${f.right}px in a ${audit.viewportWidth}px viewport `
          + (f.verdict === 'clipped'
            ? 'and is clipped by an overflow-hidden ancestor — unreachable.'
            : 'with no scrollable ancestor — the page itself pans sideways.'),
        );
      }
      if (audit.failureCount > audit.failures.length) {
        problems.push(`${route}: …and ${audit.failureCount - audit.failures.length} more.`);
      }
    }
  }
  await client.close();
} finally {
  await browserSession.close();
  await server?.kill('SIGTERM');
}

if (problems.length > 0) {
  console.error(`Viewport reachability failed at ${VIEWPORT_WIDTH}px:`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}

console.log(
  `Viewport reachability passed: ${sweptRoutes} routes at ${VIEWPORT_WIDTH}px — `
  + 'every content element in view, in a working rail, or decorative.',
);
process.exit(0);
