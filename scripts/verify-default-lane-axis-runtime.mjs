// Computed-style proof that axis tokens resolve without the preset runtime.
//
// 1. Fixture: plain HTML linking Mantine's stylesheet and packages/gds-theme/styles.css, no
//    preset attribute and no injected variables (the gdsTheme / createPublicBrandTheme lane),
//    measuring the reads components make (axis tokens, badge pairs and the brand-primary fill),
//    in light and dark.
// 2. apps/reference-vite (gdsDarkPublicTheme), served from its built dist/: the FeatureBand
//    process step pill and the EditorialHero action, in light and dark.
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { createCdpClient, evaluate, launchBrowser, wait } from './lib/browser-runtime.mjs';

const ROOT = process.cwd();
const gdsStyles = join(ROOT, 'packages/gds-theme/styles.css');
const mantineStyles = join(ROOT, 'node_modules/@mantine/core/styles.css');
const referenceDist = join(ROOT, 'apps/reference-vite/dist');
const failures = [];

for (const path of [gdsStyles, mantineStyles, join(referenceDist, 'index.html')]) {
  if (!existsSync(path)) {
    console.error(`${path} is missing; run npm run build first.`);
    process.exit(1);
  }
}

const FIXTURE = `<!doctype html>
<html data-mantine-color-scheme="light">
<head>
  <link rel="stylesheet" href="file://${mantineStyles}">
  <link rel="stylesheet" href="file://${gdsStyles}">
</head>
<body>
  <span id="pill" style="border-radius: var(--gds-radius-pill)">step</span>
  <a id="hero-action" style="display: inline-flex; padding: var(--gds-space-xs) var(--gds-space-md)">action</a>
  <a id="navlink" class="mantine-NavLink-root" style="display: flex; min-height: var(--gds-control-height-md)">nav</a>
  <div id="map-item" style="border: var(--gds-focus-ring-width) solid var(--gds-focus-ring-color)">selected</div>
  <div id="card" style="box-shadow: var(--gds-elevation-card)">card</div>
  <span id="badge-solid" style="background: var(--gds-badge-solid-success); color: var(--gds-badge-solid-success-fg)">done</span>
  <span id="badge-soft" style="background: var(--gds-badge-soft-info); color: var(--gds-badge-soft-info-fg)">info</span>
  <span id="brand-primary" style="background: var(--gds-brand-primary); color: var(--gds-brand-primary-fg)">primary</span>
</body>
</html>`;

const MEASURE_FIXTURE = `(() => {
  const cs = (id) => getComputedStyle(document.getElementById(id));
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    presetAttr: document.documentElement.hasAttribute('data-gds-theme-preset'),
    inlineGds: [...document.documentElement.style].filter((p) => p.startsWith('--gds-')).length,
    pillRadius: cs('pill').borderTopLeftRadius,
    declaredPill: rootStyle.getPropertyValue('--gds-radius-pill').trim(),
    heroPadding: [cs('hero-action').paddingTop, cs('hero-action').paddingLeft],
    navHeight: document.getElementById('navlink').getBoundingClientRect().height,
    mapBorder: [cs('map-item').borderTopWidth, cs('map-item').borderTopStyle, cs('map-item').borderTopColor],
    cardShadow: cs('card').boxShadow,
    badges: ['badge-solid', 'badge-soft', 'brand-primary'].map((id) => ({ id, bg: cs(id).backgroundColor, fg: cs(id).color })),
    bodyText: getComputedStyle(document.body).color,
  };
})()`;

const MEASURE_REFERENCE = `(() => {
  const pill = document.querySelector('[style*="--gds-radius-pill"]');
  const hero = document.querySelector('[style*="var(--gds-space-xs) var(--gds-space-md)"]');
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    presetAttr: document.documentElement.hasAttribute('data-gds-theme-preset'),
    pillFound: Boolean(pill),
    heroFound: Boolean(hero),
    pillRadius: pill ? getComputedStyle(pill).borderTopLeftRadius : null,
    declaredPill: rootStyle.getPropertyValue('--gds-radius-pill').trim(),
    heroPadding: hero ? [getComputedStyle(hero).paddingTop, getComputedStyle(hero).paddingLeft] : null,
  };
})()`;

function luminance(rgb) {
  const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const opaque = (color) => /^rgb\(/.test(color) || /^rgba\([^)]*,\s*1\)$/.test(color);

// Polls until the page has loaded its stylesheets and the root declares --gds-radius-pill, or
// the timeout passes; the caller then measures either way so a real absence is reported.
const READY = `document.readyState === 'complete' && getComputedStyle(document.documentElement).getPropertyValue('--gds-radius-pill').trim() !== ''`;
async function untilReady(client, extra = 'true', timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(client, `(${READY}) && (${extra})`)) return true;
    await wait(150);
  }
  return false;
}
const settle = (client) => evaluate(client, 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))');

const setScheme = (scheme) => `document.documentElement.setAttribute('data-mantine-color-scheme', '${scheme}')`;
const px = (value) => Number.parseFloat(value);

function checkCommon(label, m) {
  if (m.presetAttr) failures.push(`${label}: data-gds-theme-preset is set; this check needs a lane without the preset runtime.`);
  if (m.declaredPill !== '9999px') failures.push(`${label}: --gds-radius-pill computes to "${m.declaredPill}", expected the generated 9999px.`);
  if (px(m.pillRadius) < 9999) failures.push(`${label}: step pill border-radius is ${m.pillRadius}, not the pill radius.`);
  if (!m.heroPadding || px(m.heroPadding[0]) <= 0 || px(m.heroPadding[1]) <= 0) failures.push(`${label}: hero action padding is ${m.heroPadding}, expected non-zero.`);
}

const fixtureDir = mkdtempSync(join(tmpdir(), 'gds-axis-lane-'));
const fixturePath = join(fixtureDir, 'fixture.html');
writeFileSync(fixturePath, FIXTURE);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = normalize(join(referenceDist, urlPath));
  if (!file.startsWith(referenceDist) || !existsSync(file) || urlPath.endsWith('/')) file = join(referenceDist, 'index.html');
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const referenceUrl = `http://127.0.0.1:${server.address().port}/`;

const session = await launchBrowser({
  tmpPrefix: 'gds-axis-lane-',
  portBase: 9340,
  portRange: 200,
  windowSize: '1280,900',
  verificationLabel: 'default-lane axis',
  unrefBrowser: true,
});

const measured = [];
try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);

  await client.send('Page.navigate', { url: `file://${fixturePath}` });
  await untilReady(client, `Boolean(document.getElementById('badge-soft'))`);
  for (const scheme of ['light', 'dark']) {
    await evaluate(client, setScheme(scheme));
    await settle(client);
    const m = await evaluate(client, MEASURE_FIXTURE);
    const label = `fixture (no preset, no injected variables) ${scheme}`;
    checkCommon(label, m);
    if (m.inlineGds !== 0) failures.push(`${label}: ${m.inlineGds} --gds-* properties are inline on <html>; the fixture must rely on styles.css alone.`);
    if (m.navHeight < 44) failures.push(`${label}: NavLink-class row is ${m.navHeight}px high, below the 44px floor.`);
    if (m.mapBorder[0] !== '2px' || m.mapBorder[1] !== 'solid' || !/^rgb/.test(m.mapBorder[2])) failures.push(`${label}: selected map item border is ${m.mapBorder.join(' ')}, expected 2px solid with a resolved colour.`);
    if (!m.cardShadow || m.cardShadow === 'none') failures.push(`${label}: --gds-elevation-card computes to no shadow.`);
    for (const badge of m.badges) {
      if (!opaque(badge.bg)) failures.push(`${label}: #${badge.id} background is ${badge.bg}, expected an opaque badge colour.`);
      else if (contrast(badge.bg, badge.fg) < 4.5) failures.push(`${label}: #${badge.id} text is ${contrast(badge.bg, badge.fg).toFixed(2)}:1 on its background, below 4.5:1.`);
      // A brand fill in the body text colour reads as text, not as a control (#968).
      if (badge.id === 'brand-primary' && opaque(badge.bg) && badge.bg === m.bodyText) failures.push(`${label}: #brand-primary fill is the body text colour ${badge.bg}.`);
    }
    measured.push(`${label}: pill ${m.pillRadius}, padding ${m.heroPadding.join('/')}, NavLink ${m.navHeight}px, map border ${m.mapBorder.join(' ')}, badges ${m.badges.map((b) => (opaque(b.bg) ? contrast(b.bg, b.fg).toFixed(2) : 'transparent')).join('/')}:1`);
  }

  await client.send('Page.navigate', { url: referenceUrl });
  await untilReady(client, `Boolean(document.querySelector('[style*="--gds-radius-pill"]')) && Boolean(document.querySelector('[style*="var(--gds-space-xs) var(--gds-space-md)"]'))`);
  for (const scheme of ['light', 'dark']) {
    await evaluate(client, setScheme(scheme));
    await settle(client);
    const m = await evaluate(client, MEASURE_REFERENCE);
    const label = `apps/reference-vite (gdsDarkPublicTheme) ${scheme}`;
    if (!m.pillFound || !m.heroFound) {
      failures.push(`${label}: FeatureBand process pill or EditorialHero action not rendered.`);
      continue;
    }
    checkCommon(label, m);
    measured.push(`${label}: pill ${m.pillRadius}, padding ${m.heroPadding.join('/')}`);
  }
  await client.close();
} finally {
  await session.close();
  server.close();
  rmSync(fixtureDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`Default-lane axis runtime verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Default-lane axis runtime verification passed:\n  ${measured.join('\n  ')}`);
process.exit(0);
