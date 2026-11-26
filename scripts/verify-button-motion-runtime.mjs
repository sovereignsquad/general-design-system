// SemanticButton micro-interactions on the built reference site (/patterns/feedback, the
// onAction demo), driven through Chrome:
//
// 1. Every vocabulary action with a declared motion runs its pending animation while the
//    simulated action is slow, then its success animation, and keeps its width throughout.
// 2. A success straight from rest plays the exit motion (send flies off, add turns out).
// 3. A failure shakes the button and keeps its width; the live region announces each phase.
// 4. Hover lifts (on a mouse device) and press sinks a button by the reaction tokens.
// 5. Under prefers-reduced-motion nothing animates and exit layers are not shown.
import {
  createCdpClient,
  evaluate,
  launchBrowser as launchChromeBrowser,
  startPreviewServer,
  wait,
  waitForReady,
} from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const route = '/patterns/feedback';

const PENDING_ANIMATION = {
  spinner: 'gds-button-spin',
  spin: 'gds-button-spin',
  'bob-down': 'gds-button-bob-down',
  'bob-up': 'gds-button-bob-up',
};
const SUCCESS_ANIMATION_AFTER_PENDING = {
  'fly-off': ['gds-button-pop-in'],
  turn: ['gds-button-pop-in'],
  'check-pop': ['gds-button-pop-in'],
  'check-draw': ['gds-button-draw'],
  draw: ['gds-button-draw'],
  pop: ['gds-button-pop'],
};
const SUCCESS_ANIMATION_FROM_REST = {
  'fly-off': ['gds-button-fly-off', 'gds-button-pop-in'],
  turn: ['gds-button-turn-out', 'gds-button-pop-in'],
};

// In-page helpers shared by every probe.
const PAGE_HELPERS = `
  const root = document.querySelector('[data-gds-button-motion-reference]');
  if (!root) throw new Error('No [data-gds-button-motion-reference] on the page.');
  const choose = (label, value) => {
    const input = root.querySelector('[aria-label="' + label + '"] input[value="' + value + '"]');
    if (!input) throw new Error('No ' + label + ' option ' + value);
    input.click();
  };
  const buttonFor = (action) => root.querySelector('[data-gds-button-motion-demo="' + action + '"] button');
  const animationsIn = (el) => document.getAnimations()
    .filter((a) => a.effect && a.effect.target && el.contains(a.effect.target) && a.playState === 'running')
    .map((a) => a.animationName);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, timeout = 4000) => {
    const start = performance.now();
    while (performance.now() - start < timeout) { const v = fn(); if (v) return v; await sleep(15); }
    return null;
  };
  const statusText = (button) => (button.parentElement.querySelector('[role="status"]') || {}).textContent || '';
`;

function cycleProbe(action, { outcome, speed, confirm }) {
  return `(async () => {
    ${PAGE_HELPERS}
    choose('Simulated outcome', '${outcome}');
    choose('Simulated duration', '${speed}');
    await sleep(50);
    const button = buttonFor('${action}');
    if (!button) return { error: 'no demo button for ${action}' };
    button.scrollIntoView({ block: 'center' });
    await sleep(50);
    const width = button.getBoundingClientRect().width;
    const result = { widths: [width] };
    button.click();
    if (${confirm}) {
      result.confirmPhase = await waitFor(() => button.getAttribute('data-gds-button-phase'), 1000);
      await sleep(30);
      button.click();
    }
    if ('${speed}' === 'slow') {
      await waitFor(() => button.getAttribute('data-gds-button-phase') === 'pending');
      result.pendingPhase = button.getAttribute('data-gds-button-phase');
      result.pendingAnimations = animationsIn(button);
      result.pendingAriaDisabled = button.getAttribute('aria-disabled');
      result.pendingStatus = statusText(button);
      result.widths.push(button.getBoundingClientRect().width);
    }
    const settled = '${outcome}' === 'success' ? 'success' : 'error';
    await waitFor(() => button.getAttribute('data-gds-button-phase') === settled);
    result.settledPhase = button.getAttribute('data-gds-button-phase');
    result.settledAnimations = animationsIn(button);
    result.settledStatus = statusText(button);
    result.widths.push(button.getBoundingClientRect().width);
    const exitLayer = button.querySelector('[data-gds-button-motion="fly-off"], [data-gds-button-motion="turn-out"]');
    result.exitLayerOpacity = exitLayer ? getComputedStyle(exitLayer).opacity : null;
    await waitFor(() => !button.hasAttribute('data-gds-button-phase'), 4000);
    return result;
  })()`;
}

const READ_MOTIONS = `(() => {
  const root = document.querySelector('[data-gds-button-motion-reference]');
  if (!root) return null;
  return [...root.querySelectorAll('[data-gds-button-motion-demo]')].map((el) => el.getAttribute('data-gds-button-motion-demo'));
})()`;

async function readVocabularyMotions() {
  const { GdsVocabulary } = await import('../packages/gds-core/dist/index.mjs');
  return Object.entries(GdsVocabulary).filter(([, config]) => config.motion).map(([name, config]) => ({ name, motion: config.motion }));
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'button motion' });
const browserSession = await launchChromeBrowser({
  tmpPrefix: 'gds-button-motion-',
  portBase: 9500,
  portRange: 100,
  windowSize: '1280,900',
  verificationLabel: 'button motion',
  unrefBrowser: true,
  // Headless Chrome reports no hover-capable pointer; hover rules are scoped to mouse devices.
  extraArgs: ['--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'],
});

const problems = [];
const sameWidth = (widths) => widths.every((w) => Math.abs(w - widths[0]) < 0.5);
let checked = 0;

async function open(client) {
  await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${route}` });
  if (!(await waitForReady(client))) throw new Error(`${route} did not render.`);
  await wait(300);
}

try {
  const vocabulary = await readVocabularyMotions();
  if (vocabulary.length === 0) throw new Error('No vocabulary action declares a motion — refusing to pass vacuously.');
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await open(client);

  const demoed = await evaluate(client, READ_MOTIONS);
  if (!demoed) {
    problems.push(`${route}: the onAction demo ([data-gds-button-motion-reference]) is not on the page.`);
    await client.close();
    throw new Error('missing demo');
  }
  for (const { name } of vocabulary) if (!demoed.includes(name)) problems.push(`${name}: declares a motion but has no live demo.`);

  for (const { name, motion } of vocabulary) {
    const confirm = Boolean(motion.confirm);
    const slow = await evaluate(client, cycleProbe(name, { outcome: 'success', speed: 'slow', confirm }));
    checked += 1;
    if (slow.error) { problems.push(`${name}: ${slow.error}`); continue; }
    if (confirm && slow.confirmPhase !== 'confirm') problems.push(`${name}: first click should ask for confirmation, phase was ${slow.confirmPhase}.`);
    const pendingName = PENDING_ANIMATION[motion.pending ?? 'spinner'];
    if (slow.pendingPhase !== 'pending') problems.push(`${name}: never reached pending on a slow action.`);
    else if (!slow.pendingAnimations.includes(pendingName)) problems.push(`${name}: pending should run ${pendingName}, running: [${slow.pendingAnimations.join(', ')}].`);
    if (slow.pendingAriaDisabled !== 'true') problems.push(`${name}: pending button is not aria-disabled.`);
    if (!slow.pendingStatus) problems.push(`${name}: live region was empty while pending.`);
    if (slow.settledPhase !== 'success') problems.push(`${name}: slow success settled as ${slow.settledPhase}.`);
    for (const expected of SUCCESS_ANIMATION_AFTER_PENDING[motion.success ?? 'pop']) {
      if (!slow.settledAnimations.includes(expected)) problems.push(`${name}: success should run ${expected}, running: [${slow.settledAnimations.join(', ')}].`);
    }
    if (!slow.settledStatus) problems.push(`${name}: live region was empty on success.`);
    if (!sameWidth(slow.widths)) problems.push(`${name}: width changed during the cycle: ${slow.widths.map((w) => w.toFixed(1)).join(' -> ')}px.`);

    const fromRest = SUCCESS_ANIMATION_FROM_REST[motion.success];
    if (fromRest) {
      const fast = await evaluate(client, cycleProbe(name, { outcome: 'success', speed: 'fast', confirm }));
      for (const expected of fromRest) {
        if (!fast.settledAnimations.includes(expected)) problems.push(`${name}: success from rest should run ${expected}, running: [${fast.settledAnimations.join(', ')}].`);
      }
    }
  }

  const failure = await evaluate(client, cycleProbe('save', { outcome: 'error', speed: 'fast', confirm: false }));
  if (failure.settledPhase !== 'error') problems.push(`save: a failing action settled as ${failure.settledPhase}.`);
  if (!failure.settledAnimations.includes('gds-button-shake')) problems.push(`save: a failure should shake, running: [${failure.settledAnimations.join(', ')}].`);
  if (!sameWidth(failure.widths)) problems.push(`save: width changed on failure: ${failure.widths.map((w) => w.toFixed(1)).join(' -> ')}px.`);
  if (!failure.settledStatus) problems.push('save: live region was empty on failure.');

  // Hover and press on a plain reference button.
  const rect = await evaluate(client, `(() => {
    const b = document.querySelector('[data-gds-button-variant-probe="filled"]');
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await wait(100);
  const transformOf = `getComputedStyle(document.querySelector('[data-gds-button-variant-probe="filled"]')).transform`;
  const tokens = await evaluate(client, `(() => { const s = getComputedStyle(document.documentElement); return { lift: s.getPropertyValue('--gds-reaction-hover-lift').trim(), scale: s.getPropertyValue('--gds-reaction-pressed-scale').trim() }; })()`);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
  await wait(300);
  const hover = await evaluate(client, transformOf);
  const expectedHover = `matrix(1, 0, 0, 1, 0, ${parseFloat(tokens.lift)})`;
  if (hover !== expectedHover) problems.push(`hover: transform is ${hover}, expected ${expectedHover} from --gds-reaction-hover-lift ${tokens.lift}.`);
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await wait(300);
  const press = await evaluate(client, transformOf);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  const expectedPress = `matrix(${tokens.scale}, 0, 0, ${tokens.scale}, 0, 0)`;
  if (press !== expectedPress) problems.push(`press: transform is ${press}, expected ${expectedPress} from --gds-reaction-pressed-scale ${tokens.scale}.`);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });

  // Reduced motion: nothing animates, exit layers are hidden, press does not move.
  await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await open(client);
  for (const { name, motion } of vocabulary) {
    const confirm = Boolean(motion.confirm);
    const slow = await evaluate(client, cycleProbe(name, { outcome: 'success', speed: 'slow', confirm }));
    if (slow.pendingAnimations?.length) problems.push(`${name} (reduced motion): pending animates: [${slow.pendingAnimations.join(', ')}].`);
    if (slow.settledAnimations?.length) problems.push(`${name} (reduced motion): success animates: [${slow.settledAnimations.join(', ')}].`);
    if (SUCCESS_ANIMATION_FROM_REST[motion.success]) {
      const fast = await evaluate(client, cycleProbe(name, { outcome: 'success', speed: 'fast', confirm }));
      if (fast.settledAnimations.length) problems.push(`${name} (reduced motion): success from rest animates: [${fast.settledAnimations.join(', ')}].`);
      if (fast.exitLayerOpacity !== '0') problems.push(`${name} (reduced motion): the exit layer is visible (opacity ${fast.exitLayerOpacity}).`);
    }
  }
  const reducedFailure = await evaluate(client, cycleProbe('save', { outcome: 'error', speed: 'fast', confirm: false }));
  if (reducedFailure.settledAnimations.length) problems.push(`save (reduced motion): failure animates: [${reducedFailure.settledAnimations.join(', ')}].`);
  const reducedRect = await evaluate(client, `(() => {
    const b = document.querySelector('[data-gds-button-variant-probe="filled"]');
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await wait(100);
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: reducedRect.x, y: reducedRect.y, button: 'left', clickCount: 1 });
  await wait(100);
  const reducedPress = await evaluate(client, transformOf);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: reducedRect.x, y: reducedRect.y, button: 'left', clickCount: 1 });
  if (reducedPress !== 'none') problems.push(`press (reduced motion): transform is ${reducedPress}, expected none.`);
  await client.close();
} catch (error) {
  if (problems.length === 0) throw error;
} finally {
  await browserSession.close();
  await server?.kill('SIGTERM');
}

if (problems.length > 0) {
  console.error(`Button motion failed (${problems.length}):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Button motion passed: ${checked} vocabulary actions run their pending and success motion and keep their width; failure shakes; hover lifts and press sinks by the reaction tokens; nothing animates under reduced motion.`);
process.exit(0);
