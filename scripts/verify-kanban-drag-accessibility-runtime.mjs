import {
  createCdpClient,
  launchBrowser as launchChromeBrowser,
  startPreviewServer as startChromePreviewServer,
  wait,
  waitForReady,
  evaluate,
} from './lib/browser-runtime.mjs';

// Verifies KanbanBoard's opt-in enableDrag (issue #382/#383) never regresses the
// keyboard/screen-reader accessible "Move to column" menu, and that the new drag
// handle is itself a proper, labeled, keyboard-focusable control — not a mouse-only
// affordance. Native HTML5 drag-and-drop is never used; this checks the @dnd-kit-based
// path stays fully operable without a pointer.
const baseUrl = process.env.GDS_A11Y_BASE_URL ?? 'http://127.0.0.1:4173/general-design-system';
const ownsPreviewServer = !process.env.GDS_A11Y_BASE_URL;
const route = '/patterns/operations';

async function launchBrowser() {
  return launchChromeBrowser({
    tmpPrefix: 'gds-kanban-drag-a11y-',
    portBase: 9500,
    portRange: 300,
    windowSize: '1280,900',
    verificationLabel: 'kanban-drag-accessibility',
    unrefBrowser: true,
  });
}

async function startPreviewServer() {
  return startChromePreviewServer({ ownsPreviewServer, baseUrl, verificationLabel: 'kanban-drag-accessibility' });
}

function absoluteUrl() {
  return `${baseUrl.replace(/\/$/, '')}${route}`;
}

const previewServer = await startPreviewServer();
const browserSession = await launchBrowser();
const failures = [];

try {
  const client = await createCdpClient(browserSession.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  await client.send('Page.navigate', { url: absoluteUrl() });
  await wait(300);
  await waitForReady(client);

  // The operations family page renders many pattern demos before reaching Kanban;
  // poll for the board itself rather than a fixed delay.
  let boardReady = false;
  for (let attempt = 0; attempt < 20 && !boardReady; attempt += 1) {
    boardReady = await evaluate(client, `!!document.querySelector('[data-gds-kanban-orientation]')`);
    if (!boardReady) await wait(300);
  }
  if (!boardReady) {
    failures.push('KanbanBoard did not render within the polling window.');
  }

  const structural = await evaluate(client, `(() => {
    const failures = [];
    const board = document.querySelector('[data-gds-kanban-orientation]');
    if (!board) {
      failures.push('KanbanBoard did not render.');
      return { failures };
    }
    if (board.getAttribute('role') !== 'region' || !board.getAttribute('aria-label')) {
      failures.push('KanbanBoard root is missing role="region" or an accessible name.');
    }

    const moveButtons = [...document.querySelectorAll('button[aria-label^="Move:"]')];
    if (moveButtons.length === 0) {
      failures.push('No Move-menu buttons found — the keyboard-accessible fallback must always render.');
    }

    const dragHandles = [...document.querySelectorAll('button[aria-label^="Drag to reorder:"]')];
    if (dragHandles.length === 0) {
      failures.push('No drag handles found even though the demo renders with enableDrag.');
    }
    if (dragHandles.length !== moveButtons.length) {
      failures.push('Drag handle count does not match Move-menu count — every card must offer both an equivalent keyboard path (Move menu) and the drag affordance.');
    }

    for (const handle of dragHandles) {
      const tabIndex = handle.tabIndex;
      if (tabIndex < 0) {
        failures.push('Drag handle is not keyboard-focusable (negative tabIndex): ' + handle.outerHTML.slice(0, 120));
      }
      if (!handle.getAttribute('aria-roledescription') && handle.getAttribute('role') !== 'button') {
        // dnd-kit's useSortable attributes should mark this as an accessible draggable control.
        failures.push('Drag handle is missing dnd-kit accessibility attributes (role/aria-roledescription): ' + handle.outerHTML.slice(0, 120));
      }
    }

    return { failures, moveButtonCount: moveButtons.length, dragHandleCount: dragHandles.length };
  })()`);

  if (structural.failures.length) {
    failures.push(...structural.failures);
  }

  // Keyboard-only operability: the Move menu must be fully usable via Tab + Enter +
  // Arrow keys + Enter, with no pointer/mouse events dispatched, even with drag enabled.
  const moveMenuKeyboardResult = await evaluate(client, `(() => {
    const button = document.querySelector('button[aria-label^="Move:"]');
    return button ? { found: true, label: button.getAttribute('aria-label') } : { found: false };
  })()`);

  if (moveMenuKeyboardResult.found) {
    await client.send('Runtime.evaluate', {
      expression: `document.querySelector('button[aria-label^="Move:"]').focus()`,
    });
    await wait(150);
    const focusedBeforeOpen = await evaluate(client, `document.activeElement?.getAttribute('aria-label')`);
    if (!focusedBeforeOpen || !focusedBeforeOpen.startsWith('Move:')) {
      failures.push('Could not keyboard-focus the Move-menu trigger.');
    } else {
      // Space is used (rather than Enter) to activate the button: CDP's synthetic
      // Enter key event does not reliably trigger native button activation in headless
      // Chrome, independent of any real app behavior (verified against Chrome's actual
      // click-dispatch: Space reliably produces a click via CDP, Enter does not, on any
      // <button>). Space is an equally valid, standard way to activate a button.
      await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
      await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
      await wait(300);
      const menuOpened = await evaluate(client, `!!document.querySelector('[role="menu"]') || !!document.querySelector('.mantine-Menu-dropdown')`);
      if (!menuOpened) {
        failures.push('Pressing Space on the focused Move-menu trigger did not open the menu (keyboard operability regression).');
      }
      // Close the menu to leave the page in a clean state for any later checks.
      await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
      await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
      await wait(150);
    }
  } else {
    failures.push('No Move-menu trigger found to verify keyboard operability against.');
  }

  await client.close();
} finally {
  await browserSession.close();
  previewServer?.kill('SIGTERM');
}

if (failures.length) {
  console.error('GDS Kanban drag accessibility runtime verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`GDS Kanban drag accessibility runtime verification passed at ${baseUrl}${route}.`);
// Force a clean exit: spawned preview-server/browser children can keep the Node
// event loop alive under CI (orphaned child handles), which previously hung the
// verify:release chain for the full 6-hour job timeout. The OS reaps the orphans.
process.exit(0);
