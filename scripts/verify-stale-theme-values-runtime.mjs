// Issue 598 — no stale value may survive a theme switch.
//
// #561 delivered the theme IDENTITY and the remount key; verify:theme-identity proves the key
// is distinct and stable for all 50 preset/scheme pairs. It cannot prove the remount actually
// EMPTIES every themed value: a value read via getComputedStyle at mount, memoised at module
// scope without the theme in its deps, or painted once into SVG/canvas survives any cascade
// change invisibly. Only a browser can see those.
//
// THE DEFINITION OF STALE, and why it is honest: after switching in place from theme A to
// theme B, every watched element/property must equal what a FRESH LOAD of theme B renders.
// The fresh load is ground truth — no hand-written expectations to drift, and anything that
// legitimately does not vary by theme is identical in both snapshots, so it cannot false-
// positive. The diff includes SVG image sources (the generated-thumbnail surface) and
// background-image (gradients), the two channels a cascade change cannot reach.
//
// Also verified, per the issue's own list: switch latency against a stated budget, and that
// keyboard focus and scroll position survive the remount — a keyboard user must not be
// dropped to the top of the document because the theme changed.
//
// Switch path: the Theme Lab's own native <select> controls, driven with real value+change
// events — the path a user takes, not a synthetic runtime call.

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
// dark-public: flat surfaces, no animated gradient backdrop — deliberate. The cosmic preset
// animates its backdrop, which would diff nondeterministically; this gate is about staleness,
// not animation, and a flaky gate gets ignored.
const TO = { preset: 'dark-public', scheme: 'dark' };

/**
 * Switch latency budget. Measured on this machine when the gate was written: ~320ms from
 * change event to both identity attributes applied. 3000ms is the budget, not the target —
 * it absorbs CI load while still catching a switch that re-renders the world more than once.
 */
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
  // EVERY visible element, no cap. A first version capped at the first 600 in document order,
  // and the planted stale mutant sat past the cap — the detector reported clean while a
  // staleness was on the page. A silent cap reads as full coverage; this page is ~2k visible
  // elements and reading them all costs well under a second.
  for (const el of document.body.querySelectorAll('*')) {
    // The switch controls themselves are excluded: the trial snapshot holds focus on them by
    // design, and a :focus style difference there is the mechanism, not a staleness.
    if (el.tagName === 'SELECT' || el.closest('label')?.querySelector('select')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cs = getComputedStyle(el);
    const props = {};
    for (const p of ${JSON.stringify(WATCHED_PROPERTIES)}) {
      let v = cs.getPropertyValue(p);
      // A url(#id) paint reference names a React useId, which is random per page load — two
      // identical gradients get different names on different loads. Compare the CONTENT the id
      // points at (ids stripped), not the name: a genuinely stale paint server still differs,
      // and an identical one no longer false-positives.
      // String ops, not a regex: this code lives inside a template literal, which consumes
      // regex escapes before the page parses them — the first version's pattern never matched.
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
