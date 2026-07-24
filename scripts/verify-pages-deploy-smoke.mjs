import {
  launchBrowser as launchChromeBrowser,
  createCdpClient,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

// Post-deploy smoke check for the live GitHub Pages site. `apps/playground`
// is a pure client-side-rendered SPA (see scripts/generate-playground-static-routes.mjs
// — it only duplicates the empty CSR shell into route subdirectories for deep-
// linking, it never prerenders content), so a plain `curl` + text grep can
// never work: the raw served HTML is always just `<div id="root"></div>`
// plus script tags, in every environment, not only in CI. This script
// actually launches headless Chrome, navigates to the deployed URL, and
// waits for the SPA to hydrate and render real content — the same technique
// already used by this repo's local verify-*-runtime.mjs scripts, just
// pointed at the live URL instead of a local preview server.

const url = process.env.GDS_PAGES_SMOKE_URL ?? process.argv[2];
if (!url) {
  console.error('Usage: GDS_PAGES_SMOKE_URL=<deployed-url> node scripts/verify-pages-deploy-smoke.mjs');
  process.exit(1);
}

async function main() {
  const { webSocketDebuggerUrl, close } = await launchChromeBrowser({
    tmpPrefix: 'gds-pages-smoke-',
    portBase: 9500,
    portRange: 300,
    windowSize: '1280,900',
    verificationLabel: 'pages-deploy-smoke',
  });

  try {
    const client = await createCdpClient(webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('Page.navigate', { url });
    await wait(300);

    const ready = await waitForReady(client, { timeout: 20000 });
    if (!ready) {
      throw new Error(`Page at ${url} did not render visible content within the timeout.`);
    }

    const hasExpectedContent = await evaluate(client, `
      (document.body?.innerText || '').includes('What Is GDS')
    `);
    if (!hasExpectedContent) {
      throw new Error(`Page at ${url} rendered, but expected homepage content ("What Is GDS") was not found.`);
    }

    console.log(`GDS Pages deploy smoke check passed for ${url}.`);
    await client.close();
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(`GDS Pages deploy smoke check failed: ${error.message}`);
  process.exit(1);
});
