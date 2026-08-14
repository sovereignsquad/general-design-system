// Issue 552 — the governed focus ring must exist BEFORE hydration.
//
// styles.css originally gated its focus-visible rule on html[data-gds-theme-preset], an
// attribute only applyDocumentRuntime() sets, client-side, post-mount. No server-rendered or
// pre-hydration paint can carry it, so a keyboard user tabbing before JS mounted got no
// governed focus indicator at all — and a consumer relying on the rule would not add their own.
//
// This gate renders a fixture that simulates exactly that state: a plain HTML page linking
// ONLY the published stylesheet, with NO data-gds-theme-preset attribute and no JS. It tabs
// through a native <a>, <button>, <input>, and the two Mantine classes a consumer audit named
// as the coverage contract (.mantine-NavLink-root, .mantine-Tabs-tab), asserting each focused
// element computes the governed 2px solid outline. Every token the rule reads has a :root
// default in the same stylesheet, so this must hold with zero runtime.
//
// Keyboard focus via CDP Input events, not element.focus() — :focus-visible only reliably
// matches for keyboard interaction, and keyboard is the path the ring exists for.

import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createCdpClient,
  launchBrowser,
  wait,
  evaluate,
} from './lib/browser-runtime.mjs';

const ROOT = process.cwd();
const stylesheet = join(ROOT, 'packages/gds-theme/styles.css');

const FIXTURE = `<!doctype html>
<html>
<head><link rel="stylesheet" href="file://${stylesheet}"></head>
<body>
  <a id="plain-a" href="#x">anchor</a>
  <button id="plain-button">button</button>
  <input id="plain-input" value="input">
  <a id="navlink" class="mantine-NavLink-root" href="#y">nav link</a>
  <button id="tab" class="mantine-Tabs-tab">tab</button>
</body>
</html>`;

const EXPECTED_IDS = ['plain-a', 'plain-button', 'plain-input', 'navlink', 'tab'];

const dir = mkdtempSync(join(tmpdir(), 'gds-focus-fixture-'));
const fixturePath = join(dir, 'fixture.html');
writeFileSync(fixturePath, FIXTURE);

const session = await launchBrowser({
  tmpPrefix: 'gds-focus-ring-',
  portBase: 9640,
  portRange: 200,
  windowSize: '1024,768',
  verificationLabel: 'focus-ring',
  unrefBrowser: true,
});

const failures = [];
try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);
  await client.send('Page.navigate', { url: `file://${fixturePath}` });
  await wait(600);

  const attr = await evaluate(client, `document.documentElement.hasAttribute('data-gds-theme-preset')`);
  if (attr) failures.push('fixture unexpectedly carries data-gds-theme-preset — this gate must test the PRE-hydration state.');

  const seen = [];
  for (let i = 0; i < EXPECTED_IDS.length; i += 1) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const state = await evaluate(client, `(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { id: el.id, width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor, offset: cs.outlineOffset };
    })()`);
    seen.push(state.id);
    if (state.style !== 'solid' || state.width !== '2px') {
      failures.push(`#${state.id}: computed outline is ${state.width} ${state.style} — the governed 2px solid ring is not applying pre-hydration.`);
    }
    if (state.offset !== '2px') {
      failures.push(`#${state.id}: outline-offset is ${state.offset}, expected 2px.`);
    }
  }

  for (const id of EXPECTED_IDS) {
    if (!seen.includes(id)) failures.push(`#${id} was never reached by keyboard Tab — fixture or focusability regression.`);
  }

  await client.close();
} finally {
  await session.close();
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error('Pre-hydration focus-ring verification failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(
  `Pre-hydration focus-ring verification passed: ${EXPECTED_IDS.length} elements `
  + '(native a/button/input + NavLink/Tabs.Tab classes) all carry the governed 2px solid ring '
  + 'with no theme attribute and no JS.',
);
process.exit(0);
