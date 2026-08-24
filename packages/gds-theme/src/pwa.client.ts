'use client';

import { useEffect, useState } from 'react';
import type { GdsWebAppManifestDisplay } from './pwa';

/**
 * GDS PWA `display-mode` detection (issue 458).
 *
 * The client half of the PWA thin build: a small hook so a GDS shell can adapt
 * when the app is running installed/standalone (hide browser-only chrome, apply
 * safe-area padding, etc.) versus in a normal browser tab. Pairs with the
 * server-safe manifest generator and safe-area tokens in `pwa.ts`.
 */

/** Installed-PWA display state reported by `useGdsStandaloneDisplayMode`. */
export interface GdsStandaloneDisplayModeState {
  /**
   * `true` when the app is running as an installed PWA (`standalone` or
   * `fullscreen` display-mode, or iOS Safari's legacy `navigator.standalone`).
   */
  isStandalone: boolean;
  /** The resolved `display-mode`; `'browser'` when running in a normal tab. */
  displayMode: GdsWebAppManifestDisplay;
}

const DETECTABLE_MODES: GdsWebAppManifestDisplay[] = ['fullscreen', 'standalone', 'minimal-ui'];

function resolveState(): GdsStandaloneDisplayModeState {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { isStandalone: false, displayMode: 'browser' };
  }

  // iOS Safari predates the display-mode media feature; it exposes standalone
  // via a non-standard navigator flag instead.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  for (const mode of DETECTABLE_MODES) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      return { isStandalone: mode !== 'minimal-ui', displayMode: mode };
    }
  }

  return iosStandalone
    ? { isStandalone: true, displayMode: 'standalone' }
    : { isStandalone: false, displayMode: 'browser' };
}

/**
 * Reports whether the app is running as an installed PWA and its current
 * `display-mode`, updating live if the mode changes (e.g. the user installs the
 * app mid-session). SSR-safe: returns `{ isStandalone: false, displayMode:
 * 'browser' }` until mounted on the client.
 *
 * @example
 * ```tsx
 * const { isStandalone } = useGdsStandaloneDisplayMode();
 * return isStandalone ? <AppShellHeader /> : <BrowserHeaderWithInstallHint />;
 * ```
 */
export function useGdsStandaloneDisplayMode(): GdsStandaloneDisplayModeState {
  const [state, setState] = useState<GdsStandaloneDisplayModeState>(() => resolveState());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const update = () => setState(resolveState());
    const queries = DETECTABLE_MODES.map((mode) => window.matchMedia(`(display-mode: ${mode})`));
    queries.forEach((query) => query.addEventListener('change', update));
    // Reconcile once on mount in case the mode changed before hydration.
    update();

    return () => {
      queries.forEach((query) => query.removeEventListener('change', update));
    };
  }, []);

  return state;
}
