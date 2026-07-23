import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const routes = ['/themes', '/patterns/public', '/install'];
const localizedHeaderRoutes = ['/?locale=ru', '/?locale=de', '/?locale=he', '/?locale=ar'];
const cases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'default', scheme: 'dark' },
  { preset: 'partner-discovery', scheme: 'light' },
  { preset: 'partner-discovery', scheme: 'dark' },
  { preset: 'cosmic', scheme: 'light' },
  { preset: 'cosmic', scheme: 'dark' },
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
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
    throw new Error('No Chrome/Chromium executable found. Set CHROME_PATH to run accessibility runtime verification.');
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'gds-a11y-chrome-'));
  const port = 9333 + Math.floor(Math.random() * 500);
  let stderr = '';
  const browser = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--window-size=390,844',
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
  throw new Error('Timed out waiting for playground preview server. Run npm run build before accessibility runtime verification.');
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
// previously caused flaky "no visible governed surface" failures.
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

async function verifyCase(client, route, testCase) {
  await client.send('Page.navigate', { url: absoluteUrl(route) });
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
    location.reload();
  `);
  await wait(400);
  await waitForReady(client);

  return evaluate(client, `(() => {
    const failures = [];
    const html = document.documentElement;
    const body = document.body;
    const interactiveSelector = 'a[href],button,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const labelText = (element) => {
      const explicit = element.getAttribute('aria-labelledby');
      if (explicit) {
        return explicit.split(/\\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ');
      }
      if ('labels' in element && element.labels?.length) {
        return [...element.labels].map((label) => label.textContent || '').join(' ');
      }
      return '';
    };
    const nameOf = (element) => [
      element.getAttribute('aria-label'),
      labelText(element),
      element.getAttribute('title'),
      element.textContent,
      element.value,
    ].filter(Boolean).join(' ').trim();

    if ((body.innerText || '').trim().length < 200) failures.push('Page rendered too little readable text.');
    if (document.querySelector('.vite-error-overlay,[data-nextjs-dialog]')) failures.push('Development error overlay is visible.');
    if (html.getAttribute('data-gds-theme-preset') !== '${testCase.preset}') failures.push('Theme preset did not apply.');
    if (html.getAttribute('data-mantine-color-scheme') !== '${testCase.scheme}') failures.push('Color scheme did not apply.');
    if (document.documentElement.scrollWidth > window.innerWidth + 2) failures.push('Horizontal page overflow detected.');

    const header = document.querySelector('[data-gds-docs-shell-header]');
    const brand = document.querySelector('[data-gds-docs-shell-brand]');
    const actions = document.querySelector('[data-gds-docs-shell-actions]');
    if (!header) failures.push('DocsShell governed header marker is missing.');
    if (!brand) failures.push('DocsShell governed brand marker is missing.');
    if (!actions) failures.push('DocsShell governed actions marker is missing.');

    if (header && brand && actions) {
      const headerRect = header.getBoundingClientRect();
      const brandRect = brand.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const brandStyle = getComputedStyle(brand);
      const visibleActionControls = [...actions.querySelectorAll(interactiveSelector)].filter(visible);

      if (headerRect.left < -1 || headerRect.right > viewportWidth + 1) failures.push('DocsShell header is clipped by the viewport.');
      if (actionsRect.width <= 0 || actionsRect.right > viewportWidth + 1 || actionsRect.left < -1) failures.push('DocsShell header actions are clipped by the viewport.');
      const inlineOverlap = Math.max(brandRect.left, actionsRect.left) < Math.min(brandRect.right, actionsRect.right) - 1;
      const blockOverlap = Math.max(brandRect.top, actionsRect.top) < Math.min(brandRect.bottom, actionsRect.bottom) - 1;
      if (inlineOverlap && blockOverlap) failures.push('DocsShell brand overlaps header actions.');
      if (brandStyle.whiteSpace !== 'nowrap' || brandStyle.overflow !== 'hidden') failures.push('DocsShell brand does not enforce localized no-wrap overflow protection.');

      for (const control of visibleActionControls) {
        const rect = control.getBoundingClientRect();
        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          failures.push('DocsShell header action control is clipped by the viewport: ' + control.outerHTML.slice(0, 100));
          break;
        }
      }
    }

    const unnamed = [...document.querySelectorAll(interactiveSelector)]
      .filter(visible)
      .filter((element) => !element.hasAttribute('aria-hidden'))
      .filter((element) => !nameOf(element))
      .slice(0, 6)
      .map((element) => element.outerHTML.slice(0, 120));
    if (unnamed.length) failures.push('Interactive elements without accessible names: ' + unnamed.join(' | '));

    const focusable = [...document.querySelectorAll(interactiveSelector)].filter(visible);
    const focusFailures = [];
    for (const element of focusable.slice(0, 20)) {
      element.focus();
      const style = getComputedStyle(element);
      const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;
      const hasOutline = outlineWidth >= 1 && style.outlineStyle !== 'none';
      const hasShadow = style.boxShadow && style.boxShadow !== 'none';
      const hasBorder = style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)';
      if (!hasOutline && !hasShadow && !hasBorder) {
        focusFailures.push(nameOf(element) || element.tagName.toLowerCase());
      }
    }
    if (focusFailures.length) failures.push('Focusable controls without visible focus styling: ' + focusFailures.slice(0, 6).join(', '));

    const themedRoots = [...document.querySelectorAll('[data-gds-preview-root]')];
    if (location.pathname.endsWith('/themes') && themedRoots.length === 0) failures.push('Theme preview roots missing from theme explorer.');

    return {
      route: '${route}',
      preset: '${testCase.preset}',
      scheme: '${testCase.scheme}',
      interactiveCount: focusable.length,
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

  for (const route of routes) {
    for (const testCase of cases) {
      // Retry transient render misses; genuine violations fail every attempt.
      let result = await verifyCase(client, route, testCase);
      for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
        await wait(600);
        result = await verifyCase(client, route, testCase);
      }
      if (result.failures.length) {
        failures.push(result);
      }
    }
  }

  for (const route of localizedHeaderRoutes) {
    let result = await verifyCase(client, route, { preset: 'default', scheme: 'light' });
    for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
      await wait(600);
      result = await verifyCase(client, route, { preset: 'default', scheme: 'light' });
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
  console.error('GDS accessibility runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.route} ${failure.preset}/${failure.scheme}: ${failure.failures.join('; ')}`);
  }
  process.exit(1);
}

console.log(`GDS accessibility runtime verification passed for ${(routes.length * cases.length) + localizedHeaderRoutes.length} route/theme and localized header cases at ${baseUrl}.`);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
