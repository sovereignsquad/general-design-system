// Button variants stay distinct and legible under every preset and scheme, measured in a real
// browser on the button reference (/patterns/feedback).
//
// For each preset x scheme, each probe button in [data-gds-button-variant-reference] is
// screenshotted; its background is the most frequent pixel colour (text is a minority of the
// pixels, and the screenshot includes whatever surface a transparent variant sits on).
//
// - The filled button differs from light, outline, subtle and default.
// - Filled red differs from light red.
// - Every variant's label measures at least 4.5:1 against that background.
import sharp from 'sharp';
import { createCdpClient, launchBrowser, startPreviewServer, wait, waitForReady, evaluate } from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_BUTTON_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_BUTTON_BASE_URL;
const route = '/patterns/feedback';
const { getGdsVibeThemes } = await import(new URL('../packages/gds-theme/dist/tokens.mjs', import.meta.url).href);
const presets = getGdsVibeThemes().map((theme) => theme.id);
if (presets.length === 0) {
  console.error('FAIL no presets resolved; this gate must not pass vacuously.');
  process.exit(1);
}

const failures = [];
let worst = { ratio: Infinity, label: '' };
let measuredButtons = 0;

const lum = ([r, g, b]) => {
  const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m); return (a + 0.05) / (b + 0.05); };
const distance = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);

function parseColor(value) {
  const c = /color\(srgb\s+([^)]+)\)/.exec(value);
  if (c) {
    const [chan, alpha] = c[1].split('/');
    const p = chan.trim().split(/\s+/).map((v) => parseFloat(v) * 255);
    return { rgb: p, a: alpha === undefined ? 1 : parseFloat(alpha) };
  }
  const m = /rgba?\(([^)]+)\)/.exec(value);
  if (!m) return null;
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
  return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
}

async function modeColour(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const counts = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    // Quantise to 4-bit steps so anti-aliasing and gradient banding do not split the mode.
    const key = ((data[i] >> 2) << 16) | ((data[i + 1] >> 2) << 8) | (data[i + 2] >> 2);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const [key] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return [((key >> 16) & 0xff) << 2, ((key >> 8) & 0xff) << 2, (key & 0xff) << 2];
}

const previewServer = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'button-variants' });
const session = await launchBrowser({ tmpPrefix: 'gds-button-variants-', portBase: 9700, portRange: 100, verificationLabel: 'button-variants', unrefBrowser: true });

async function open(client, preset, scheme) {
  await client.send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-color-scheme', value: scheme }] });
  await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
  await wait(200);
  await waitForReady(client);
  await evaluate(client, `localStorage.setItem('gds-reference-theme-selection', JSON.stringify({ preset: '${preset}', colorScheme: '${scheme}', primaryColor: 'blue', focusRing: true, editorialSerif: false, fontLane: 'inter' })); location.reload();`);
  await wait(300);
  await waitForReady(client);
  for (let i = 0; i < 60; i += 1) {
    if (await evaluate(client, `document.documentElement.getAttribute('data-gds-theme-preset') === '${preset}' && document.querySelectorAll('[data-gds-button-variant-probe]').length > 0`)) return true;
    await wait(100);
  }
  failures.push(`${preset} ${scheme}: the preset or the button variant reference never appeared on ${route}.`);
  return false;
}

try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  for (const preset of presets) {
    for (const scheme of ['light', 'dark']) {
      if (!(await open(client, preset, scheme))) continue;
      await evaluate(client, `document.querySelector('[data-gds-button-variant-reference]').scrollIntoView({ block: 'center' })`);
      await wait(250);
      const probes = await evaluate(client, `[...document.querySelectorAll('[data-gds-button-variant-probe]')].map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute('data-gds-button-variant-probe'), color: getComputedStyle(el).color, x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
      })`);
      const results = {};
      for (const probe of probes) {
        const shot = await client.send('Page.captureScreenshot', { format: 'png', clip: { x: probe.x, y: probe.y, width: probe.w, height: probe.h, scale: 1 } });
        const background = await modeColour(Buffer.from(shot.data, 'base64'));
        const text = parseColor(probe.color);
        if (!text) { failures.push(`${preset} ${scheme} ${probe.id}: unparseable text colour ${probe.color}.`); continue; }
        const fg = text.rgb.map((c, i) => c * text.a + background[i] * (1 - text.a));
        const measured = ratio(fg, background);
        measuredButtons += 1;
        results[probe.id] = background;
        const label = `${preset} ${scheme} ${probe.id}`;
        if (measured < worst.ratio) worst = { ratio: measured, label };
        if (measured < 4.5) failures.push(`${label}: label ${measured.toFixed(2)}:1 on rgb(${background.join(', ')}).`);
      }
      for (const other of ['light', 'outline', 'subtle', 'default']) {
        if (results.filled && results[other] && distance(results.filled, results[other]) < 40) {
          failures.push(`${preset} ${scheme}: filled and ${other} share the background rgb(${results.filled.join(', ')}).`);
        }
      }
      if (results['red-filled'] && results['red-light'] && distance(results['red-filled'], results['red-light']) < 40) {
        failures.push(`${preset} ${scheme}: red filled and red light share the background rgb(${results['red-filled'].join(', ')}).`);
      }
    }
  }
  await client.close();
} finally {
  await session.close();
  previewServer?.kill('SIGTERM');
}

if (measuredButtons === 0) failures.push('No button was measured; this gate must not pass vacuously.');
if (failures.length > 0) {
  console.error(`Button variant runtime verification failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Button variant runtime verification passed: ${measuredButtons} buttons across ${presets.length} presets x 2 schemes; filled stays distinct from light, outline, subtle and default; worst label ${worst.ratio.toFixed(2)}:1 (${worst.label}).`);
process.exit(0);
