import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.GDS_THEME_TRUST_BASE_URL ?? process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_THEME_TRUST_BASE_URL && !process.env.GDS_A11Y_BASE_URL;
const themeRoutes = ['/themes', '/patterns/public', '/live-demos/layouts'];
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

function resolveChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function disposeBrowser(browser, userDataDir) {
  // Wait for Chrome to actually exit before removing its profile dir, otherwise
  // the still-live process holds handles under Default/ and rmSync throws ENOTEMPTY.
  if (browser.exitCode === null && browser.signalCode === null) {
    await new Promise((resolve) => {
      const done = () => { clearTimeout(kill); resolve(); };
      const kill = setTimeout(() => { try { browser.kill('SIGKILL'); } catch {} }, 2000);
      browser.once('exit', done);
      browser.kill('SIGTERM');
    });
  }
  try {
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 125 });
  } catch (error) {
    // A leftover /tmp profile directory is a cleanup nuisance, not a verification
    // failure — some environments still hold a file handle briefly after Chrome's
    // exit event fires, and this must never mask or crash before the real result.
    console.warn(`Warning: could not remove Chrome profile dir ${userDataDir}: ${error.message}`);
  }
}

async function launchBrowser() {
  const chromePath = resolveChromePath();
  if (!chromePath) {
    throw new Error('No Chrome/Chromium executable found. Set CHROME_PATH to run theme trust runtime verification.');
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'gds-theme-trust-chrome-'));
  const port = 9433 + Math.floor(Math.random() * 500);
  let stderr = '';
  const browser = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--window-size=1440,1080',
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  browser.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const versionUrl = `http://127.0.0.1:${port}/json/version`;
  const pagesUrl = `http://127.0.0.1:${port}/json/list`;
  for (let attempt = 0; attempt < 600; attempt += 1) {
    try {
      await requestJson(versionUrl);
      const pages = await requestJson(pagesUrl);
      const pageTarget = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl);
      if (!pageTarget) {
        throw new Error('Chrome page target is not ready.');
      }
      return {
        browser,
        userDataDir,
        webSocketDebuggerUrl: pageTarget.webSocketDebuggerUrl,
        async close() {
          await disposeBrowser(browser, userDataDir);
        },
      };
    } catch {
      await wait(100);
    }
  }

  await disposeBrowser(browser, userDataDir);
  throw new Error(`Timed out waiting for Chrome DevTools endpoint. ${stderr.trim()}`.trim());
}

async function startPreviewServer() {
  if (!ownsPreviewServer) {
    return null;
  }

  const server = spawn('npm', [
    'run',
    'preview',
    '--workspace=playground',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--strictPort',
  ], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/themes`);
      if (response.ok) {
        return server;
      }
    } catch {
      await wait(125);
    }
  }

  server.kill('SIGTERM');
  throw new Error('Timed out waiting for playground preview server. Run npm run build before theme trust runtime verification.');
}

function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          id += 1;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((commandResolve, commandReject) => {
            pending.set(id, { resolve: commandResolve, reject: commandReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener('error', () => reject(new Error('Unable to connect to Chrome DevTools WebSocket.')));
  });
}

function absoluteUrl(route) {
  return `${baseUrl.replace(/\/$/, '')}${route}`;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed.');
  }

  return result.result.value;
}

// Poll until the page has actually rendered a governed surface with readable
// text, instead of relying on a fixed delay. The Theme Lab (/themes) route is
// heavy and can take longer than a flat wait to paint under CI load, which
// previously caused flaky "rendered too little"/"no surface" failures.
async function waitForReady(client, { timeout = 12000, interval = 200 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ready = await evaluate(client, `(() => {
      const visible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
      };
      const surface = [...document.querySelectorAll('.mantine-Card-root,.mantine-Paper-root,[data-gds-owned-contrast],[data-gds-local-contrast]')].some(visible);
      const hasText = (document.body?.innerText || '').trim().length >= 120;
      return surface && hasText;
    })()`);
    if (ready) return true;
    await wait(interval);
  }
  return false;
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
  await waitForReady(client);

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
  await waitForReady(client);

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

      if (controlSurfaces.length !== 3) failures.push('Theme Lab must render exactly 3 owned control surfaces.');
      if (vibeGalleryCards.length < 12) failures.push('Theme Lab must render the full owned vibe gallery.');
      if (!vibeContract) failures.push('Theme Lab must render the current owned VibeTheme contract surface.');

      const firstControl = controlSurfaces[0];
      if (firstControl) {
        const style = firstControl.getAttribute('style') || '';
        if (!style.includes('--gds-vibe-control-text')) failures.push('Owned control surface is missing control text tokens.');
        if (!style.includes('background-image: var(--gds-local-background)')) failures.push('Owned control surface is missing owned local background application.');
      }
    }

    if (location.pathname.endsWith('/patterns/public') || location.pathname.endsWith('/live-demos/layouts')) {
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
          await wait(600);
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
      await wait(600);
      result = await verifyRouteCase(client, route, { preset: 'default', scheme: 'light' }, viewports[0]);
    }
    if (result.failures.length) {
      failures.push(result);
    }
  }

  client.close();
} finally {
  await browserSession.close();
  previewServer?.kill('SIGTERM');
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
