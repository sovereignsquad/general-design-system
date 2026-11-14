// A preset's opaque declared surface paints its cards flat (#865): computed in a real browser.
//
// - colorblind-safe (opaque light and dark surface) and high-contrast paint Card/Paper flat in
//   their declared colour, with no gradient image.
// - Translucent presets keep the surface gradient on Paper; Card keeps the body colour.
// - An injected --gds-vibe-card on <html> wins over the gradient in both scheme rules.
// - A card inside an owned-contrast surface ignores the root's --gds-vibe-card.
// - Under forced colours the card paints Canvas.
import {
  createCdpClient, launchBrowser, startPreviewServer,
  wait, waitForReady, evaluate,
} from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_CARD_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_CARD_BASE_URL;
const route = '/foundations';
const failures = [];
const measured = [];

const previewServer = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'card-surface' });
const session = await launchBrowser({ tmpPrefix: 'gds-card-surface-', portBase: 9500, portRange: 100, verificationLabel: 'card-surface', unrefBrowser: true });

async function open(client, preset, scheme, forcedColors = false) {
  const features = [{ name: 'prefers-color-scheme', value: scheme }];
  if (forcedColors) features.push({ name: 'forced-colors', value: 'active' });
  await client.send('Emulation.setEmulatedMedia', { media: '', features });
  await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
  await wait(200);
  await waitForReady(client);
  await evaluate(client, `localStorage.setItem('gds-reference-theme-selection', JSON.stringify({ preset: '${preset}', colorScheme: '${scheme}', primaryColor: 'blue', focusRing: true, editorialSerif: false, fontLane: 'inter' })); location.reload();`);
  await wait(300);
  await waitForReady(client);
  for (let i = 0; i < 50; i += 1) {
    if (await evaluate(client, `document.documentElement.getAttribute('data-gds-theme-preset') === '${preset}' && Boolean(document.querySelector('.gds-card'))`)) return;
    await wait(100);
  }
  failures.push(`${preset} ${scheme}: preset runtime or a .gds-card never appeared on ${route}.`);
}

const CARD = `(() => {
  const card = [...document.querySelectorAll('.gds-card')].find((el) => el.getBoundingClientRect().width > 0 && !el.closest('[data-gds-owned-contrast],[data-gds-local-contrast],[data-gds-fixed-tone]'));
  // Prefer a Paper with no inline background, so the preset paint rule is what decides it;
  // presets whose theme styles every Paper inline fall back to any visible Paper.
  const papers = [...document.querySelectorAll('.gds-paper:not(.gds-card)')].filter((el) => el.getBoundingClientRect().width > 0 && !el.closest('[data-gds-owned-contrast],[data-gds-local-contrast],[data-gds-fixed-tone]'));
  const paper = papers.find((el) => !/background/.test(el.getAttribute('style') || '')) ?? papers[0];
  const read = (el) => el ? { color: getComputedStyle(el).backgroundColor, image: getComputedStyle(el).backgroundImage } : null;
  return { card: read(card), paper: read(paper), vibeCard: getComputedStyle(document.documentElement).getPropertyValue('--gds-vibe-card').trim() };
})()`;

const hexToRgb = (hex) => {
  const v = hex.replace('#', '');
  return `rgb(${parseInt(v.slice(0, 2), 16)}, ${parseInt(v.slice(2, 4), 16)}, ${parseInt(v.slice(4, 6), 16)})`;
};

function expectFlat(label, m, hex) {
  for (const part of ['card', 'paper']) {
    const got = m[part];
    if (!got) { failures.push(`${label}: no ${part} measured.`); continue; }
    if (got.image !== 'none') failures.push(`${label}: ${part} paints background-image ${got.image.slice(0, 60)}…, expected flat.`);
    if (got.color !== hexToRgb(hex)) failures.push(`${label}: ${part} background is ${got.color}, expected ${hexToRgb(hex)}.`);
  }
  measured.push(`${label}: card ${m.card?.color} flat`);
}

try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);
  await client.send('Page.enable');

  for (const [preset, scheme, hex] of [['colorblind-safe', 'dark', '#101b28'], ['colorblind-safe', 'light', '#ffffff'], ['high-contrast', 'dark', '#000000']]) {
    await open(client, preset, scheme);
    expectFlat(`${preset} ${scheme}`, await evaluate(client, CARD), hex);
  }

  for (const [preset, scheme] of [['default', 'light'], ['default', 'dark'], ['sunset', 'dark']]) {
    await open(client, preset, scheme);
    const m = await evaluate(client, CARD);
    if (m.vibeCard) failures.push(`${preset} ${scheme}: --gds-vibe-card is "${m.vibeCard}" for a translucent surface.`);
    if (!m.paper || m.paper.image === 'none') failures.push(`${preset} ${scheme}: paper lost its surface gradient.`);
    measured.push(`${preset} ${scheme}: paper gradient kept, card ${m.card?.color}`);
  }

  for (const scheme of ['light', 'dark']) {
    await open(client, 'default', scheme);
    await evaluate(client, `document.documentElement.style.setProperty('--gds-vibe-card', '#16161e')`);
    await wait(100);
    expectFlat(`default ${scheme} with --gds-vibe-card #16161e`, await evaluate(client, CARD), '#16161e');
    const owned = await evaluate(client, `(() => {
      const host = document.createElement('div');
      host.setAttribute('data-gds-owned-contrast', '');
      host.innerHTML = '<div class="gds-card" style="padding: 8px">owned</div>';
      document.querySelector('main, body').appendChild(host);
      const s = getComputedStyle(host.firstElementChild);
      const out = { color: s.backgroundColor, image: s.backgroundImage };
      host.remove();
      return out;
    })()`);
    if (owned.color === 'rgb(22, 22, 30)' && owned.image === 'none') failures.push(`default ${scheme}: a card inside an owned-contrast surface painted the root --gds-vibe-card.`);
  }

  await open(client, 'colorblind-safe', 'dark', true);
  const forced = await evaluate(client, `(() => {
    const probe = document.createElement('div');
    probe.style.background = 'Canvas';
    document.body.appendChild(probe);
    const canvas = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const card = [...document.querySelectorAll('.gds-card')].find((el) => el.getBoundingClientRect().width > 0);
    return { canvas, card: card ? getComputedStyle(card).backgroundColor : null, forced: matchMedia('(forced-colors: active)').matches };
  })()`);
  if (!forced.forced) failures.push('forced-colors emulation did not activate.');
  else if (forced.card !== forced.canvas) failures.push(`forced colours: colorblind-safe card paints ${forced.card}, expected Canvas ${forced.canvas}.`);
  measured.push(`forced colours: card ${forced.card}`);

  await client.close();
} finally {
  await session.close();
  previewServer?.kill('SIGTERM');
}

if (failures.length > 0) {
  console.error(`Card surface runtime verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Card surface runtime verification passed:\n  ${measured.join('\n  ')}`);
process.exit(0);
