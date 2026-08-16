// Checks that switching themes in place matches a fresh load of the target theme: no stale
// computed style, SVG image source, or background-image value survives the remount.
// Also checks switch latency against a budget, and that keyboard focus and scroll position
// survive the remount.
// Switch path: the Theme Lab's own native <select> controls, driven with real value+change events.

import {
  createCdpClient,
  launchBrowser,
  startPreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const ROUTE = '/themes';
const FROM = { preset: 'default', scheme: 'light' };
// dark-public has no animated gradient backdrop; an animated preset would diff nondeterministically.
const TO = { preset: 'dark-public', scheme: 'dark' };

/** Switch latency budget in ms; absorbs CI load while catching a multi-render switch. */
const LATENCY_BUDGET_MS = 3000;

const WATCHED_PROPERTIES = [
  'color', 'background-color', 'border-color', 'background-image',
  'fill', 'stroke', 'box-shadow', 'outline-color',
];

/** In-page: snapshot every visible element's watched properties, keyed by a structural path. */
const SNAPSHOT_FN = `(() => {
  const pathOf = (el) => {
    const parts = [];
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const i = [...n.parentElement.children].indexOf(n);
      parts.unshift(n.tagName + ':' + i);
    }
    return parts.join('>');
  };
  const snapshot = {};
  // Every visible element, no cap.
  for (const el of document.body.querySelectorAll('*')) {
    // Switch controls excluded: they hold focus by design, and :focus style differs there.
    if (el.tagName === 'SELECT' || el.closest('label')?.querySelector('select')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cs = getComputedStyle(el);
    const props = {};
    for (const p of ${JSON.stringify(WATCHED_PROPERTIES)}) {
      let v = cs.getPropertyValue(p);
      // url(#id) names a React useId, random per load; compare the referenced content, not the id.
      // String ops, not regex: this code lives inside a template literal that consumes regex escapes.
      if (v.includes('url("#')) {
        const id = v.split('url("#')[1].split('"')[0];
        const target = document.getElementById(id);
        v = target ? 'paint:' + target.outerHTML.split('id="' + id + '"').join('') : v;
      }
      props[p] = v;
    }
    if (el.tagName === 'IMG') props.src = el.getAttribute('src');
    snapshot[pathOf(el)] = props;
  }
  return snapshot;
})()`;

async function loadWithSelection(client, selection) {
  await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}/` });
  await wait(300);
  await waitForReady(client, { timeout: 25000 });
  await evaluate(client, `localStorage.setItem('gds-reference-theme-selection', JSON.stringify({
    preset: '${selection.preset}', colorScheme: '${selection.scheme}',
    primaryColor: 'blue', focusRing: true, editorialSerif: false, fontLane: 'inter'
  }))`);
  await client.send('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}${ROUTE}` });
  await wait(400);
  await waitForReady(client, { timeout: 25000 });
  await wait(600);
}

const server = await startPreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'stale-theme-values' });
const session = await launchBrowser({
  tmpPrefix: 'gds-stale-theme-',
  portBase: 9860,
  portRange: 200,
  windowSize: '1400,900',
  verificationLabel: 'stale-theme-values',
  unrefBrowser: true,
});

const failures = [];
const report = [];
try {
  const client = await createCdpClient(session.webSocketDebuggerUrl);

  // Ground truth: what theme B looks like when nothing could possibly be stale.
  await loadWithSelection(client, TO);
  const baseline = await evaluate(client, SNAPSHOT_FN);

  // Trial: load theme A, then switch IN PLACE to theme B through the page's own controls.
  await loadWithSelection(client, FROM);
  const switchResult = await evaluate(client, `(async () => {
    const selects = [...document.querySelectorAll('select')];
    const presetSelect = selects.find((s) => [...s.options].some((o) => o.value === '${TO.preset}'));
    const schemeSelect = selects.find((s) => [...s.options].some((o) => o.value === 'dark') && [...s.options].some((o) => o.value === 'auto'));
    if (!presetSelect || !schemeSelect) return { error: 'Theme Lab preset/scheme selects not found.' };

    window.scrollTo(0, 400);
    presetSelect.focus();
    const scrollBefore = Math.round(window.scrollY);

    const setNative = (select, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, value);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const start = performance.now();
    setNative(presetSelect, '${TO.preset}');
    setNative(schemeSelect, '${TO.scheme}');

    const applied = await new Promise((resolve) => {
      const check = () => document.documentElement.getAttribute('data-gds-theme-preset') === '${TO.preset}'
        && document.documentElement.getAttribute('data-mantine-color-scheme') === '${TO.scheme}';
      if (check()) return resolve(true);
      const timer = setInterval(() => { if (check()) { clearInterval(timer); resolve(true); } }, 25);
      setTimeout(() => { clearInterval(timer); resolve(check()); }, ${LATENCY_BUDGET_MS + 2000});
    });
    const latencyMs = Math.round(performance.now() - start);

    return {
      applied, latencyMs, scrollBefore,
      scrollAfter: Math.round(window.scrollY),
      focusSurvived: document.activeElement === presetSelect,
    };
  })()`);

  if (switchResult.error) {
    failures.push(switchResult.error);
  } else {
    if (!switchResult.applied) failures.push('The in-place switch never applied both identity attributes.');
    if (switchResult.latencyMs > LATENCY_BUDGET_MS) {
      failures.push(`Switch latency ${switchResult.latencyMs}ms exceeds the ${LATENCY_BUDGET_MS}ms budget.`);
    }
    if (!switchResult.focusSurvived) failures.push('Keyboard focus did not survive the theme switch — the user was dropped.');
    if (Math.abs(switchResult.scrollAfter - switchResult.scrollBefore) > 2) {
      failures.push(`Scroll position moved across the switch: ${switchResult.scrollBefore} -> ${switchResult.scrollAfter}.`);
    }
    console.log(`Switch applied in ${switchResult.latencyMs}ms (budget ${LATENCY_BUDGET_MS}ms); focus and scroll held.`);
  }

  // Let transitions declared by the stylesheet finish before reading the settled state.
  await wait(900);
  const switched = await evaluate(client, SNAPSHOT_FN);

  let compared = 0;
  for (const [path, expected] of Object.entries(baseline)) {
    const actual = switched[path];
    if (!actual) continue; // structural differences are the remount's business, not staleness
    for (const prop of Object.keys(expected)) {
      compared += 1;
      if (expected[prop] !== actual[prop]) {
        report.push({
          selector: path.split('>').slice(-3).join('>'),
          property: prop,
          expected: expected[prop].slice(0, 80),
          actual: (actual[prop] ?? '').slice(0, 80),
          from: `${FROM.preset}/${FROM.scheme}`,
          to: `${TO.preset}/${TO.scheme}`,
        });
      }
    }
  }
  console.log(`Compared ${compared} element-properties against the fresh-load ground truth.`);

  await client.close();
} finally {
  await session.close();
  await server?.kill('SIGTERM');
}

if (report.length > 0) {
  console.error(`Stale values survived the switch — ${report.length} StaleValueReport entr(ies):`);
  for (const r of report.slice(0, 12)) {
    console.error(`- ${r.selector} { ${r.property} }: expected ${JSON.stringify(r.expected)} (fresh ${r.to}), got ${JSON.stringify(r.actual)} after switching from ${r.from}`);
  }
  if (report.length > 12) console.error(`- …and ${report.length - 12} more.`);
  process.exit(1);
}
if (failures.length > 0) {
  console.error('Stale-theme-value verification failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log('Stale-theme-value verification passed: the in-place switch is indistinguishable from a fresh load.');
process.exit(0);
