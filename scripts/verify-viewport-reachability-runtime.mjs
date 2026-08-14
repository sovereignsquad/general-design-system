// Issue 619 — no route may make content UNREACHABLE at phone width.
//
// The badge introduction shipped with rows clipped mid-word at the edge of a 390px screen. The
// fix restated the system's two governed answers (wrap via GdsInline, scroll via a nowrap rail),
// but nothing DETECTS the failure, so it recurs the next time a surface uses neither and is only
// caught by someone looking at a phone.
//
// THE RULE THAT MAKES THIS GATE HONEST: an element beyond the viewport edge is not a defect —
// it is a defect only if nothing can bring it into view. A first detector skipped that question
// and reported 34 "unreachable" elements: slider tracks, off-canvas chrome, deliberately
// scrollable rails. A gate that cries wolf gets deleted or ignored, which is worse than no gate.
// So, per element that extends past the viewport:
//
//   1. An ancestor with `overflow-x: auto|scroll` that actually scrolls (scrollWidth >
//      clientWidth) makes it a RAIL — reachable by design, not broken.
//   2. An ancestor with `overflow-x: hidden|clip` CLIPS it. That is broken only when the element
//      carries reader content (text, image, control). A decorative gradient bleeding out of a
//      hero exists to be cropped; the word "BLOCKED" does not.
//   3. An ancestor a CSS transform has moved ENTIRELY off the viewport is OFF-CANVAS CHROME —
//      Mantine's AppShell parks the collapsed mobile navbar at translateX(-100%), and the burger
//      brings it back. Measured, not assumed: every element of it sits at -390..0, whole. That
//      is a different situation from a box that is on screen and cutting words off at its edge.
//   4. No such ancestor means the overflow reaches the document, the page pans sideways, and
//      the shell contract (README: no horizontal overflow in any locale) says it must not.
//
// Elements that are aria-hidden, inert, invisible, or boxless (`<style>`, display:none) are not
// content and are never counted — that is where most of the 34 false positives came from.
//
// Sweeps every declared route at 390px, the width the defect shipped at.

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

  // Reader content only. A layout wrapper wider than the viewport is not itself the defect —
  // its clipped text is — and counting wrappers reports every failure several times over
  // without naming the words a reader loses.
  const isContent = (el) => {
    // alt="" is the author's own declaration that an image carries no information — the ARIA
    // decorative contract. GdsGeneratedThumbnail composes crops out of exactly such images, and
    // cropping a decoration is presentation, not loss.
    if (el.tagName === 'IMG') return el.getAttribute('alt') !== '';
    if (['SVG', 'VIDEO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(el.tagName)) return true;
    return [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
  };

  const verdictFor = (el) => {
    // The region the element would have to appear inside to be seen: the viewport, narrowed by
    // each clipping ancestor passed on the way up. Off-canvas must be judged against THIS, not
    // the raw viewport — a demo AppShell inside a BoundedPreviewSurface parks its collapsed
    // navbar outside the FRAME while still overlapping the viewport, and it is exactly as
    // reachable (tap its burger) as the page-level one.
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
  // Headless Chrome refuses window widths under ~500px, so --window-size alone silently audits
  // a wider page than any phone shows. Device emulation is what actually pins 390.
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
