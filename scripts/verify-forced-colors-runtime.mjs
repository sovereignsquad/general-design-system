import {
  createCdpClient,
  launchBrowser as launchChromeBrowser,
  startPreviewServer as startChromePreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;

// Original smoke coverage: broad shell/demo routes at three representative presets.
const baseCases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'dark-public', scheme: 'dark' },
  { preset: 'partner-discovery', scheme: 'dark' },
];

// Widened preset coverage (#445): well beyond the original 3/23. Applied to the
// two 3.14.0 component routes so the new controls are exercised across neutral,
// dark, flat-surface, editorial, brand-discovery, high-saturation vibe, and warm
// lanes — the kinds of themes where a dark-on-dark / light-on-light regression
// would otherwise slip through. (Presets resolve via theme-presets.ts, the
// palette that actually paints components — not the coarser vibe-themes palette
// the static theme-accessibility report scores.)
const widenedCases = [
  { preset: 'default', scheme: 'light' },
  { preset: 'dark-public', scheme: 'dark' },
  { preset: 'flat-surface', scheme: 'light' },
  { preset: 'editorial', scheme: 'light' },
  { preset: 'partner-discovery', scheme: 'dark' },
  { preset: 'neon-night', scheme: 'dark' },
  { preset: 'cosmic', scheme: 'dark' },
  { preset: 'amber', scheme: 'light' },
];

// The 3.14.0 controls that previously escaped every contrast/forced-colors gate
// (#440/#445): the Kanban collapse toggle + per-column footer, and the schema
// form's checkbox-group + repeatable rows. Each is asserted mounted-and-painted
// on the route that renders it, in forced-colors mode, across every widened
// preset — so a vanished-in-forced-colors or decorative-background regression on
// these specific controls fails verify:release instead of shipping silently.
const kanbanComponents = [
  { selector: '[data-gds-kanban-column] .mantine-ActionIcon-root[aria-expanded]', label: 'Kanban collapse toggle' },
  { selector: '[data-gds-kanban-footer] .mantine-Button-root', label: 'Kanban column footer load-more button' },
];
const formComponents = [
  { selector: '[data-gds-checkbox-group] .mantine-Checkbox-input', label: 'Schema-form checkbox-group checkbox' },
  { selector: '[data-gds-repeatable-row]', label: 'Schema-form repeatable row' },
  { selector: '[data-gds-repeatable] .mantine-Button-root', label: 'Schema-form repeatable add/remove button' },
];
// Badge shape vocabulary (#487): the six Tabler-geometry silhouettes render as
// currentColor strokes on the badges pattern; assert they stay mounted and
// painted under forced-colors instead of vanishing with a flattened palette.
const badgeShapeComponents = [
  { selector: '[data-gds-badge-shapes] svg', label: 'Badge shape silhouette (Tabler-geometry, currentColor stroke)' },
  { selector: '[data-gds-badge]', label: 'GdsBadge static status/meaning label' },
  { selector: '[data-gds-count-badge-demo] [data-gds-count-badge]', label: 'GdsCountBadge numeric pill' },
  { selector: '[data-gds-removable-tag-demo] [data-gds-removable-tag]', label: 'GdsRemovableTag filter token' },
  { selector: '[data-gds-badge-stack] [data-gds-badge-stack-layer]', label: 'GdsBadgeStack composed layer' },
  // Emoji badge glyph mode (issue #525): the SportsEmojiModeDemo defaults to
  // emoji so this fixed dark-neutral disc — real text content, not a
  // decorative background-image, so it's compatible with forced-colors —
  // stays visible instead of vanishing with a flattened palette.
  { selector: '[data-gds-badge-emoji-coin]', label: 'GdsBadge emoji glyph disc (issue #525)' },
];

// Route coverage is driven off the pattern-catalog families that actually mount
// the new components (`/patterns/operations` = Kanban and, since issue 632/633,
// Forms too; `/systems` = the badge system), which the old 4-route list never visited.
const routeConfigs = [
  { route: '/themes', cases: baseCases, components: [] },
  { route: '/live-proofs/layouts', cases: baseCases, components: [] },
  { route: '/live-proofs/analytics', cases: baseCases, components: [] },
  { route: '/live-proofs/semantics', cases: baseCases, components: [] },
  { route: '/patterns/operations', cases: widenedCases, components: kanbanComponents },
  // Issue 632/633 rebuilt Foundations to hold only the 7 design axes; Forms moved to
  // operations's existing Workflow Guidance section.
  { route: '/patterns/operations', cases: widenedCases, components: formComponents },
  // Issue 632/633 moved the badge system again, from foundations to the new systems
  // family; the forced-colors sweep follows the content, not the old filing.
  { route: '/systems', cases: baseCases, components: badgeShapeComponents },
];

async function launchBrowser() {
  return launchChromeBrowser({
    tmpPrefix: 'gds-forced-colors-',
    portBase: 9800,
    portRange: 300,
    windowSize: '390,844',
    verificationLabel: 'forced-colors',
    unrefBrowser: true,
  });
}

async function startPreviewServer() {
  return startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'forced-colors' });
}

function absoluteUrl(route) {
  return `${baseUrl.replace(/\/$/, '')}${route}`;
}

async function verifyCase(client, routeConfig, testCase) {
  const route = routeConfig.route;
  const components = routeConfig.components ?? [];
  await client.send('Page.bringToFront');
  await client.send('Emulation.setEmulatedMedia', {
    media: '',
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: testCase.scheme },
    ],
  });
  await client.send('Page.navigate', { url: absoluteUrl(route) });
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
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const interactiveSelector = 'button,input,select,textarea,a[href],[role="button"],[tabindex]:not([tabindex="-1"])';
    const isTransparent = (value) => !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)';
    const body = document.body;

    if (!matchMedia('(forced-colors: active)').matches) failures.push('forced-colors emulation did not activate.');
    if ((body.innerText || '').trim().length < 120) failures.push('Page rendered too little readable text.');
    if (document.documentElement.scrollWidth > window.innerWidth + 2) failures.push('Horizontal page overflow detected in forced-colors mode.');

    const card = [...document.querySelectorAll('.mantine-Card-root,.mantine-Paper-root,[data-gds-owned-contrast],[data-gds-local-contrast]')].find(visible);
    if (card) {
      const style = getComputedStyle(card);
      if (style.backgroundImage !== 'none') failures.push('Forced-colors card/surface still paints a background image.');
      if (isTransparent(style.borderColor)) failures.push('Forced-colors card/surface lost its visible border.');
    } else {
      failures.push('No visible governed surface found for forced-colors verification.');
    }

    const control = [...document.querySelectorAll('.mantine-Button-root,.mantine-ActionIcon-root,.mantine-Input-input,.mantine-NativeSelect-input,.mantine-Textarea-input')].find(visible);
    if (control) {
      control.focus({ preventScroll: true });
      const style = getComputedStyle(control);
      if (style.backgroundImage !== 'none') failures.push('Forced-colors control still paints a decorative background image.');
      if (isTransparent(style.backgroundColor)) failures.push('Forced-colors control lost its platform-backed background.');
      if (isTransparent(style.color)) failures.push('Forced-colors control lost readable text color.');
      if (isTransparent(style.borderColor)) failures.push('Forced-colors control lost border visibility.');
      if (!control.matches(':focus')) failures.push('Forced-colors runtime verifier could not focus the governed control.');
      const focusStyle = getComputedStyle(control);
      const outlineWidth = Number.parseFloat(focusStyle.outlineWidth) || 0;
      if (outlineWidth < 1 || focusStyle.outlineStyle === 'none') failures.push('Forced-colors control focus outline is not visible.');
    } else {
      failures.push('No visible governed control found for forced-colors verification.');
    }

    const disabledControl = [...document.querySelectorAll('button:disabled,input:disabled,select:disabled,textarea:disabled,[data-disabled]')].find(visible);
    if (disabledControl) {
      const style = getComputedStyle(disabledControl);
      if (isTransparent(style.color)) failures.push('Disabled control lost forced-colors text styling.');
    }

    const selected = [...document.querySelectorAll('[aria-selected="true"],[data-active="true"],.mantine-Button-root[data-variant="filled"]')].find(visible);
    if (selected) {
      const style = getComputedStyle(selected);
      if (isTransparent(style.backgroundColor)) failures.push('Selected/active control lost forced-colors background.');
    }

    // Targeted 3.14.0 component coverage (#445): each required control must be
    // mounted, visible, free of decorative background images, and painted with
    // at least one of text/border/background color in forced-colors mode.
    const requiredComponents = ${JSON.stringify(components)};
    for (const component of requiredComponents) {
      const element = [...document.querySelectorAll(component.selector)].find(visible);
      if (!element) {
        failures.push('Required 3.14.0 component not found/visible: ' + component.label + ' (' + component.selector + ').');
        continue;
      }
      const style = getComputedStyle(element);
      if (style.backgroundImage !== 'none') {
        failures.push(component.label + ' paints a decorative background image in forced-colors.');
      }
      const painted = !isTransparent(style.color) || !isTransparent(style.borderColor) || !isTransparent(style.backgroundColor);
      if (!painted) {
        failures.push(component.label + ' has no visible text/border/background color in forced-colors.');
      }
    }

    return {
      route: '${route}',
      preset: '${testCase.preset}',
      scheme: '${testCase.scheme}',
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

  for (const routeConfig of routeConfigs) {
    for (const testCase of routeConfig.cases) {
      // Retry transient render misses: a fresh navigation usually paints fine
      // on the next attempt. A genuine forced-colors violation fails every
      // attempt and is still recorded.
      let result = await verifyCase(client, routeConfig, testCase);
      for (let attempt = 2; attempt <= 3 && result.failures.length; attempt++) {
        await wait(600);
        result = await verifyCase(client, routeConfig, testCase);
      }
      if (result.failures.length) failures.push(result);
    }
  }

  await client.close();
} finally {
  await browserSession.close();
  await previewServer?.kill('SIGTERM');
}

if (failures.length) {
  console.error('GDS forced-colors runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.route} ${failure.preset}/${failure.scheme}: ${failure.failures.join('; ')}`);
  }
  process.exit(1);
}

const totalCases = routeConfigs.reduce((sum, config) => sum + config.cases.length, 0);
const presetCount = new Set(routeConfigs.flatMap((config) => config.cases.map((testCase) => testCase.preset))).size;
const componentCount = routeConfigs.reduce((sum, config) => sum + (config.components?.length ?? 0), 0);
console.log(
  `GDS forced-colors runtime verification passed for ${totalCases} route/theme cases ` +
    `across ${routeConfigs.length} routes and ${presetCount} presets ` +
    `(${componentCount} targeted 3.14.0 component checks) at ${baseUrl}.`,
);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
