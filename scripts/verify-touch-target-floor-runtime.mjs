// Issue 628 — GDS holds a 44px touch-target floor (GDS_MIN_TARGET_PX, packages/gds-theme/src/
// axes.ts) with recorded exceptions for xs/sm dense-toolbar controls (GDS_CONTROL_HEIGHT_
// EXCEPTIONS). Nothing measured what actually renders against that floor: CardContracts.ts
// even computes a resolved minTouchTarget per card and nothing reads it.
//
// This is a MEASURING gate, not a hard-fail one — same shape as verify-theme-coverage-matrix.mjs.
// A live sweep found real, non-zero violations (drag handles, checkboxes, map pins); wiring
// this in as a zero-tolerance chain member would immediately break the build over debt that
// needs paying down incrementally, not a same-day rewrite. It writes audit/touch-target-floor.json;
// npm run verify:budgets (already in verify:release) enforces the ratcheted threshold against
// the committed artifact, exactly like themeMatrixUntraceableRate/untraceableRenderRate.
//
// Output: audit/touch-target-floor.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createCdpClient, launchBrowser as launchChromeBrowser, startPreviewServer as startChromePreviewServer,
  wait, waitForReady, evaluate, disposeBrowser,
} from './lib/browser-runtime.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };

const { GDS_MIN_TARGET_PX, GDS_CONTROL_HEIGHT_EXCEPTIONS } = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));
const { patternRoutes } = await import(join(ROOT, 'scripts/lib/pattern-routes.mjs'));

const routes = patternRoutes();
if (!routes.length) fail('No routes resolved; the gate cannot measure vacuously.');
if (!GDS_MIN_TARGET_PX) fail('GDS_MIN_TARGET_PX did not resolve from the built gds-theme package.');

const baseUrl = process.env.GDS_TOUCH_TARGET_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_TOUCH_TARGET_BASE_URL;

const MEASURE = (minTarget) => `(() => {
  const MIN_TARGET = ${minTarget};
  const EXEMPT_SIZES = new Set(${JSON.stringify(Object.keys(GDS_CONTROL_HEIGHT_EXCEPTIONS ?? {}))});

  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0' && r.width > 0 && r.height > 0;
  };

  const INTERACTIVE = 'button, a[href], input:not([type=hidden]), select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"]';
  const rows = [];
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w >= MIN_TARGET && h >= MIN_TARGET) continue;

    // WCAG 2.5.8's inline-text-link exception: a link inside a run of body text, sized by its
    // own text metrics rather than as a discrete control, is exempt from the target-size rule.
    const inlineInText = el.tagName === 'A' && el.parentElement
      && ['P', 'SPAN', 'LI', 'TD', 'DIV'].includes(el.parentElement.tagName)
      && getComputedStyle(el).display.startsWith('inline');
    if (inlineInText) continue;

    // A recorded, deliberate exception: either this exact control opted out with a reason
    // (data-gds-target-exception, issue 628), or it's a Mantine control at a documented xs/sm
    // size step (GDS_CONTROL_HEIGHT_EXCEPTIONS).
    const exceptionMarker = el.getAttribute('data-gds-target-exception');
    const mantineSize = el.getAttribute('data-size');
    if (exceptionMarker) continue;
    if (mantineSize && EXEMPT_SIZES.has(mantineSize)) continue;

    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 60),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 50),
      w, h,
    });
  }
  return rows;
})()`;

const previewServer = await startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'touch-target-floor' });
const browserSession = await launchChromeBrowser({
  tmpPrefix: 'gds-touch-target-', portBase: 9800, portRange: 200, windowSize: '1280,900', verificationLabel: 'touch-target-floor',
});
const client = await createCdpClient(browserSession.webSocketDebuggerUrl);

const findings = [];
let totalUnexempt = 0;
const skipped = [];

try {
  await client.send('Page.enable');
  for (const route of routes) {
    try {
      await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
      await wait(300);
      await waitForReady(client);
      await wait(300);
      const rows = await evaluate(client, MEASURE(GDS_MIN_TARGET_PX));
      totalUnexempt += rows.length;
      for (const row of rows) findings.push({ route, ...row });
    } catch (error) {
      skipped.push({ route, reason: String(error).slice(0, 200) });
    }
  }
} finally {
  await client.close?.();
  await disposeBrowser(browserSession.browser, browserSession.userDataDir);
  await previewServer?.kill?.('SIGTERM');
}

const report = {
  minTargetPx: GDS_MIN_TARGET_PX,
  routesSwept: routes.length,
  routesSkipped: skipped,
  totalUnexemptViolations: totalUnexempt,
  findings: findings.slice(0, 500),
  findingsTruncated: findings.length > 500,
};

mkdirSync(join(ROOT, 'audit'), { recursive: true });
writeFileSync(join(ROOT, 'audit/touch-target-floor.json'), JSON.stringify(report, null, 2));

console.log(`Touch-target floor (issue 628)`);
console.log(`  routes swept          ${routes.length - skipped.length}/${routes.length}`);
if (skipped.length) {
  console.log(`  SKIPPED ${skipped.length} route(s) — coverage is PARTIAL:`);
  for (const s of skipped) console.log(`    ${s.route}: ${s.reason}`);
}
console.log(`  unexempt violations   ${totalUnexempt}  (below ${GDS_MIN_TARGET_PX}px, no recorded exception)`);
if (findings.length > 500) console.log(`  findings truncated to 500 of ${findings.length} — full count is in totalUnexemptViolations`);
console.log(`\nMeasured, not gated here — npm run verify:budgets enforces the ratcheted threshold.`);
process.exit(0);
