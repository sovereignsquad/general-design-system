import {
  createCdpClient,
  launchBrowser as launchChromeBrowser,
  startPreviewServer as startChromePreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

// Verifies the mobile input-focus auto-zoom guard (gdsTheme's `Input.vars`, issue 379):
// iOS Safari/Chrome force-zoom the page when a focused input's *computed* font-size is
// under 16px. This checks the exact components a consuming app reported the gap
// against (AdminTextInput/AdminSelect/AdminTextarea) at the risky sizes (`xs`, `sm`,
// and the implicit default), across multiple theme presets, so the fix is confirmed to
// survive preset composition rather than only working on the base theme.
const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const route = '/patterns/operations';
const cases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'dark-public', scheme: 'dark' },
  { preset: 'cosmic', scheme: 'dark' },
];

async function launchBrowser() {
  return launchChromeBrowser({
    tmpPrefix: 'gds-input-zoom-guard-',
    portBase: 9600,
    portRange: 300,
    windowSize: '390,844',
    verificationLabel: 'input-zoom-guard',
    unrefBrowser: true,
  });
}

async function startPreviewServer() {
  return startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'input-zoom-guard' });
}

function absoluteUrl() {
  return `${baseUrl.replace(/\/$/, '')}${route}`;
}

async function verifyCase(client, testCase) {
  await client.send('Page.navigate', { url: absoluteUrl() });
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
    const controls = [...document.querySelectorAll(
      '.mantine-Input-input, .mantine-NativeSelect-input, .mantine-Textarea-input, .mantine-Select-input'
    )].filter((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });

    if (controls.length < 3) {
      failures.push('Expected at least 3 visible governed inputs (AdminSelect/AdminTextInput/AdminTextarea) on this route, found ' + controls.length + '.');
    }

    for (const control of controls) {
      control.focus({ preventScroll: true });
      const fontSize = Number.parseFloat(getComputedStyle(control).fontSize) || 0;
      if (fontSize < 16) {
        failures.push('Focused control renders at ' + fontSize + 'px (< 16px), which triggers mobile input-focus auto-zoom: ' + control.outerHTML.slice(0, 120));
      }
    }

    return {
      route: '${route}',
      preset: '${testCase.preset}',
      scheme: '${testCase.scheme}',
      controlCount: controls.length,
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

  for (const testCase of cases) {
    // Retry transient render misses; a genuine font-size regression fails every attempt.
    let result = await verifyCase(client, testCase);
    for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
      await wait(600);
      result = await verifyCase(client, testCase);
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
  console.error('GDS input-zoom-guard runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.route} ${failure.preset}/${failure.scheme}: ${failure.failures.join('; ')}`);
  }
  process.exit(1);
}

console.log(`GDS input-zoom-guard runtime verification passed for ${cases.length} theme presets at ${baseUrl}${route}.`);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
