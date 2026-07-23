import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const routes = [
  '/themes',
  '/live-demos/layouts',
  '/live-demos/analytics',
  '/live-demos/semantics',
];
const cases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'dark-public', scheme: 'dark' },
  { preset: 'partner-discovery', scheme: 'dark' },
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
  if (!response.ok) throw new Error(`Request failed ${response.status} for ${url}`);
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
    throw new Error('No Chrome/Chromium executable found. Set CHROME_PATH to run forced-colors runtime verification.');
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'gds-forced-colors-'));
  const port = 9800 + Math.floor(Math.random() * 300);
  let stderr = '';
  const browser = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=390,844',
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  browser.unref();

  browser.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const versionUrl = `http://127.0.0.1:${port}/json/version`;
  const pagesUrl = `http://127.0.0.1:${port}/json/list`;

  for (let attempt = 0; attempt < 600; attempt += 1) {
    try {
      await requestJson(versionUrl);
      const pages = await requestJson(pagesUrl);
      const pageTarget = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl);
      if (!pageTarget) throw new Error('Chrome page target is not ready.');
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
  throw new Error(`Timed out waiting for Chrome DevTools endpoint.${stderr ? ` stderr: ${stderr}` : ''}`);
}

async function startPreviewServer() {
  if (!ownsPreviewServer) return null;

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

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/themes`);
      if (response.ok) return server;
    } catch {
      await wait(125);
    }
  }

  server.kill('SIGTERM');
  throw new Error('Timed out waiting for playground preview server. Run npm run build before forced-colors runtime verification.');
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
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
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
          return new Promise((resolve) => {
            socket.addEventListener('close', () => resolve(), { once: true });
            socket.close();
          });
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
// previously caused flaky "No visible governed surface found" failures.
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
  await client.send('Page.bringToFront');
  await client.send('Emulation.setEmulatedMedia', {
    media: '',
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: testCase.scheme },
    ],
  });
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
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const interactiveSelector = 'button,input,select,textarea,a[href],[role="button"],[tabindex]:not([tabindex="-1"])';
    const isTransparent = (value) => !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)';
    const body = document.body;

    if (!matchMedia('(forced-colors: active)').matches) failures.push('forced-colors emulation did not activate.');
    if ((body.innerText || '').trim().length < 120) failures.push('Page rendered too little readable text.');
    if (document.documentElement.scrollWidth > window.innerWidth + 2) failures.push('Horizontal page overflow detected in forced-colors mode.');

    const card = [...document.querySelectorAll('.mantine-Card-root,.mantine-Paper-root,[data-gds-owned-contrast],[data-gds-local-contrast]')].find(visible);
    if (card) {
      const style = getComputedStyle(card);
      if (style.backgroundImage !== 'none') failures.push('Forced-colors card/surface still paints a background image.');
      if (isTransparent(style.borderColor)) failures.push('Forced-colors card/surface lost its visible border.');
    } else {
      failures.push('No visible governed surface found for forced-colors verification.');
    }

    const control = [...document.querySelectorAll('.mantine-Button-root,.mantine-ActionIcon-root,.mantine-Input-input,.mantine-NativeSelect-input,.mantine-Textarea-input')].find(visible);
    if (control) {
      control.focus({ preventScroll: true });
      const style = getComputedStyle(control);
      if (style.backgroundImage !== 'none') failures.push('Forced-colors control still paints a decorative background image.');
      if (isTransparent(style.backgroundColor)) failures.push('Forced-colors control lost its platform-backed background.');
      if (isTransparent(style.color)) failures.push('Forced-colors control lost readable text color.');
      if (isTransparent(style.borderColor)) failures.push('Forced-colors control lost border visibility.');
      if (!control.matches(':focus')) failures.push('Forced-colors runtime verifier could not focus the governed control.');
      const focusStyle = getComputedStyle(control);
      const outlineWidth = Number.parseFloat(focusStyle.outlineWidth) || 0;
      if (outlineWidth < 1 || focusStyle.outlineStyle === 'none') failures.push('Forced-colors control focus outline is not visible.');
    } else {
      failures.push('No visible governed control found for forced-colors verification.');
    }

    const disabledControl = [...document.querySelectorAll('button:disabled,input:disabled,select:disabled,textarea:disabled,[data-disabled]')].find(visible);
    if (disabledControl) {
      const style = getComputedStyle(disabledControl);
      if (isTransparent(style.color)) failures.push('Disabled control lost forced-colors text styling.');
    }

    const selected = [...document.querySelectorAll('[aria-selected="true"],[data-active="true"],.mantine-Button-root[data-variant="filled"]')].find(visible);
    if (selected) {
      const style = getComputedStyle(selected);
      if (isTransparent(style.backgroundColor)) failures.push('Selected/active control lost forced-colors background.');
    }

    return {
      route: '${route}',
      preset: '${testCase.preset}',
      scheme: '${testCase.scheme}',
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
      // Retry transient render misses: a fresh navigation usually paints fine
      // on the next attempt. A genuine forced-colors violation fails every
      // attempt and is still recorded.
      let result = await verifyCase(client, route, testCase);
      for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
        await wait(600);
        result = await verifyCase(client, route, testCase);
      }
      if (result.failures.length) failures.push(result);
    }
  }

  await client.close();
} finally {
  await browserSession.close();
  previewServer?.kill('SIGTERM');
}

if (failures.length) {
  console.error('GDS forced-colors runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.route} ${failure.preset}/${failure.scheme}: ${failure.failures.join('; ')}`);
  }
  process.exit(1);
}

console.log(`GDS forced-colors runtime verification passed for ${routes.length * cases.length} route/theme cases at ${baseUrl}.`);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
