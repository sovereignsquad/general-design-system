import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Shared headless-Chrome lifecycle helper for the verify-*-runtime.mjs scripts
// (forced-colors, theme-trust, accessibility). Previously each script carried
// its own copy of this logic; all three had independently accumulated the same
// ENOTEMPTY cleanup bug, which is exactly the risk a shared module removes.

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
