import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Shared headless-Chrome/CDP/preview-server helper for the verify-*-runtime.mjs
// scripts (forced-colors, theme-trust, accessibility). Previously each script
// carried its own copy of this logic; duplicating it let real bugs (an ENOTEMPTY
// cleanup crash, a missing stdout/stderr drain that risked a pipe-buffer
// deadlock) exist in some copies but not others, unnoticed until this module
// consolidated them.

export function resolveChromePath() {
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

export async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json();
}

export async function disposeBrowser(browser, userDataDir) {
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

export async function launchBrowser({
  tmpPrefix,
  portBase,
  portRange,
  windowSize,
  verificationLabel,
  unrefBrowser = false,
}) {
  const chromePath = resolveChromePath();
  if (!chromePath) {
    throw new Error(`No Chrome/Chromium executable found. Set CHROME_PATH to run ${verificationLabel} runtime verification.`);
  }

  const userDataDir = mkdtempSync(join(tmpdir(), tmpPrefix));
  const port = portBase + Math.floor(Math.random() * portRange);
  let stderr = '';
  const browser = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    `--window-size=${windowSize}`,
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  if (unrefBrowser) {
    browser.unref();
  }

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
  throw new Error(`Timed out waiting for Chrome DevTools endpoint.${stderr.trim() ? ` stderr: ${stderr.trim()}` : ''}`);
}

export function createCdpClient(webSocketDebuggerUrl) {
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
          // Wait for the socket to actually close, matching disposeBrowser's
          // philosophy of not returning until cleanup has genuinely finished.
          return new Promise((closed) => {
            socket.addEventListener('close', () => closed(), { once: true });
            socket.close();
          });
        },
      });
    });
    socket.addEventListener('error', () => reject(new Error('Unable to connect to Chrome DevTools WebSocket.')));
  });
}

export async function evaluate(client, expression) {
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
export async function waitForReady(client, { timeout = 12000, interval = 200 } = {}) {
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

export async function startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel }) {
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

  // Drain stdout/stderr: an unread pipe fills its OS buffer and blocks the
  // child process from writing further output, which can silently hang the
  // preview server once it logs enough.
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
  throw new Error(`Timed out waiting for playground preview server. Run npm run build before ${verificationLabel} runtime verification.`);
}
