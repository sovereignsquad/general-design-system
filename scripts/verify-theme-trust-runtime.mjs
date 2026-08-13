import {
  createCdpClient,
  launchBrowser as launchChromeBrowser,
  startPreviewServer as startChromePreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_THEME_TRUST_BASE_URL ?? process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_THEME_TRUST_BASE_URL && !process.env.GDS_A11Y_BASE_URL;
const themeRoutes = ['/themes', '/patterns/public', '/live-proofs/layouts'];
const localizedHeaderRoutes = ['/?locale=ru', '/?locale=de', '/?locale=he', '/?locale=ar'];
const themeCases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'dark-public', scheme: 'dark' },
  { preset: 'cosmic', scheme: 'dark' },
];
const viewports = [
  { id: 'mobile', width: 390, height: 844, mobile: true, scale: 3 },
  { id: 'desktop', width: 1440, height: 1080, mobile: false, scale: 1 },
];

async function launchBrowser() {
  return launchChromeBrowser({
    tmpPrefix: 'gds-theme-trust-chrome-',
    portBase: 9433,
    portRange: 500,
    windowSize: '1440,1080',
    verificationLabel: 'theme trust',
  });
}

async function startPreviewServer() {
  return startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'theme trust' });
}

function absoluteUrl(route) {
  return `${baseUrl.replace(/\/$/, '')}${route}`;
}

async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.scale,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
}

async function verifyRouteCase(client, route, testCase, viewport) {
  await setViewport(client, viewport);
  await client.send('Page.navigate', { url: absoluteUrl('/') });
  await wait(300);
  // This script runs last among five Chrome-launching verify:*-runtime steps
  // in the full verify:release chain, after two full workspace builds, lint,
  // and the test suite — a longer timeout here (vs. the shared 12s default)
  // gives real margin for cumulative CPU/memory pressure at that point in the
  // chain. Confirmed via direct testing: this script passes reliably in
  // isolation, and fails only intermittently (1-2 of 22 cases) at the tail of
  // the full chain — consistent with transient load, not a rendering bug.
  await waitForReady(client, { timeout: 25000 });

  await evaluate(client, `
    localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
      preset: '${testCase.preset}',
      colorScheme: '${testCase.scheme}',
      primaryColor: 'blue',
      focusRing: true,
      editorialSerif: false,
      fontLane: 'inter'
    }));
  `);
  await wait(200);
  await client.send('Page.navigate', { url: absoluteUrl(route) });
  await wait(300);
  // This script runs last among five Chrome-launching verify:*-runtime steps
  // in the full verify:release chain, after two full workspace builds, lint,
  // and the test suite — a longer timeout here (vs. the shared 12s default)
  // gives real margin for cumulative CPU/memory pressure at that point in the
  // chain. Confirmed via direct testing: this script passes reliably in
  // isolation, and fails only intermittently (1-2 of 22 cases) at the tail of
  // the full chain — consistent with transient load, not a rendering bug.
  await waitForReady(client, { timeout: 25000 });

  return evaluate(client, `(() => {
    const failures = [];
    const html = document.documentElement;
    const body = document.body;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    if ((body.innerText || '').trim().length < 200) failures.push('Page rendered too little readable text.');
    if (document.querySelector('.vite-error-overlay,[data-nextjs-dialog]')) failures.push('Development error overlay is visible.');
    if (html.getAttribute('data-gds-theme-preset') !== '${testCase.preset}') failures.push('Theme preset did not apply.');
    if (html.getAttribute('data-mantine-color-scheme') !== '${testCase.scheme}') failures.push('Color scheme did not apply.');
    if (document.documentElement.scrollWidth > window.innerWidth + 2) failures.push('Horizontal page overflow detected.');

    const header = document.querySelector('[data-gds-docs-shell-header]');
    const brand = document.querySelector('[data-gds-docs-shell-brand]');
    const actions = document.querySelector('[data-gds-docs-shell-actions]');
    if (!header || !brand || !actions) failures.push('DocsShell governed header markers are missing.');

    if (location.pathname.endsWith('/themes')) {
      const controlSurfaces = document.querySelectorAll('[data-gds-owned-contrast="theme-lab-controls"]');
      const vibeGalleryCards = document.querySelectorAll('[data-gds-owned-contrast="vibe-gallery-card"]');
      const vibeContract = document.querySelector('[data-gds-owned-contrast="vibe-contract"]');
      const activeMarkers = [...document.querySelectorAll('[data-gds-theme-lab-active]')].filter(visible);

      // Issue #461: the primary control/result cards must NOT be bespoke
      // owned-contrast surfaces (that forced a dark surface onto a light page).
      if (controlSurfaces.length !== 0) failures.push('Theme Lab control cards must not use the retired theme-lab-controls owned-contrast surface (issue #461).');
      if (vibeGalleryCards.length < 12) failures.push('Theme Lab must render the full owned vibe gallery.');
      if (!vibeContract) failures.push('Theme Lab must render the current owned VibeTheme contract surface.');

      // The active preset is clearly labelled in the control panel.
      if (activeMarkers.length !== 2) failures.push('Theme Lab must mark the active preset with exactly two visible "Selected" indicators.');

      // The control/result cards must re-theme globally exactly like any other
      // plain .gds-paper on the page — same computed background — rather than
      // carrying a divergent (dark) owned surface.
      const controlCard = activeMarkers[0] ? activeMarkers[0].closest('.gds-paper') : null;
      if (controlCard && controlCard.matches('[data-gds-owned-contrast], [data-gds-local-contrast]')) {
        failures.push('Theme Lab control card must not be a bespoke owned-contrast surface (issue #461).');
      }
      const plainPageCard = [...document.querySelectorAll('.gds-paper')].find((element) =>
        element !== controlCard
        && !element.closest('[data-gds-owned-contrast]')
        && !element.querySelector('[data-gds-theme-lab-active]')
        && visible(element));
      if (controlCard && plainPageCard) {
        const controlBackground = getComputedStyle(controlCard).backgroundImage;
        const pageBackground = getComputedStyle(plainPageCard).backgroundImage;
        if (controlBackground !== pageBackground) {
          failures.push('Theme Lab control card background diverges from the page theme — control cards must re-theme like any .gds-paper (issue #461).');
        }
      }
    }

    if (location.pathname.endsWith('/patterns/public') || location.pathname.endsWith('/live-proofs/layouts')) {
      if (!document.querySelector('[data-gds-bounded-preview-surface]')) {
        failures.push('Preview-heavy routes must keep live shells inside bounded preview surfaces.');
      }
    }

    const ownedSurfaces = [...document.querySelectorAll('[data-gds-owned-contrast]')].filter(visible);
    for (const surface of ownedSurfaces.slice(0, 8)) {
      const style = surface.getAttribute('style') || '';
      if (!style.includes('--gds-local-background') || !style.includes('--gds-vibe-control-text')) {
        failures.push('Owned contrast surface is missing required contract tokens.');
        break;
      }
    }

    return {
      route: '${route}',
      preset: '${testCase.preset}',
      scheme: '${testCase.scheme}',
      viewport: '${viewport.id}',
      failures,
    };
  })()`);
}

const previewServer = await startPreviewServer();
const browserSession = await launchBrowser();
const failures = [];

try {
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  for (const route of themeRoutes) {
    for (const testCase of themeCases) {
      for (const viewport of viewports) {
        // Retry transient render misses; genuine violations fail every attempt.
        let result = await verifyRouteCase(client, route, testCase, viewport);
        for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
          await wait(2000);
          result = await verifyRouteCase(client, route, testCase, viewport);
        }
        if (result.failures.length) {
          failures.push(result);
        }
      }
    }
  }

  for (const route of localizedHeaderRoutes) {
    let result = await verifyRouteCase(client, route, { preset: 'default', scheme: 'light' }, viewports[0]);
    for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
      await wait(2000);
      result = await verifyRouteCase(client, route, { preset: 'default', scheme: 'light' }, viewports[0]);
    }
    if (result.failures.length) {
      failures.push(result);
    }
  }

  await client.close();
} finally {
  await browserSession.close();
  await previewServer?.kill('SIGTERM');
}

if (failures.length) {
  console.error('GDS theme trust runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.route} ${failure.preset}/${failure.scheme} ${failure.viewport}: ${failure.failures.join('; ')}`);
  }
  process.exit(1);
}

console.log(`GDS theme trust runtime verification passed for ${(themeRoutes.length * themeCases.length * viewports.length) + localizedHeaderRoutes.length} route/theme/localized-header cases at ${baseUrl}.`);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
