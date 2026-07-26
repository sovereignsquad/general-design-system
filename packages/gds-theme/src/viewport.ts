/**
 * GDS viewport policy: the canonical `<meta name="viewport">` content generator.
 *
 * `'browser-default'` (the default) leaves pinch-zoom and browser-native zoom
 * behavior untouched — required for WCAG 1.4.4 (Resize Text) and 1.4.10 (Reflow)
 * compliance, and the correct choice for nearly every product.
 *
 * `'app-shell-fixed'` disables pinch-zoom (`maximum-scale=1, user-scalable=no`) to
 * make an installed PWA feel like a native app shell. This is a reviewed,
 * documented accessibility exception, not a default — see
 * `docs/PWA_VIEWPORT_POLICY.md` for the required mitigations (OS-level text-size
 * settings must still work; the app must still reflow at 320px CSS width; a
 * product with any non-trivial reading content should not use this lane at all).
 * Most modern mobile browsers (iOS Safari 10+, current Chrome/Android) ignore
 * `user-scalable=no` and always allow pinch-zoom regardless — this lane mainly
 * affects double-tap-to-zoom and older/embedded WebView browsers, so it is not a
 * reliable way to fully suppress zoom, only a documented best-effort signal.
 */
export type GdsViewportZoomPolicy = 'browser-default' | 'app-shell-fixed';

/** Options for `getGdsPwaViewportMetaContent`. */
export interface GdsPwaViewportOptions {
  /** Defaults to `'browser-default'`. See `docs/PWA_VIEWPORT_POLICY.md` before choosing `'app-shell-fixed'`. */
  zoomPolicy?: GdsViewportZoomPolicy;
  /** Adds `viewport-fit=<value>` for safe-area-aware standalone/fullscreen PWA shells. Omitted by default. */
  viewportFit?: 'auto' | 'contain' | 'cover';
}

/**
 * Returns the `content` attribute value for the app's `<meta name="viewport">` tag.
 * GDS does not render this tag itself — it must be set once, outside React render,
 * in the consumer's static HTML shell (`index.html`) or server-rendered document
 * head (e.g. Next.js `generateViewport()`), matching where the mandatory
 * `@sovereignsquad/gds-theme/styles.css` import already lives.
 */
export function getGdsPwaViewportMetaContent(options: GdsPwaViewportOptions = {}): string {
  const { zoomPolicy = 'browser-default', viewportFit } = options;
  const parts = ['width=device-width', 'initial-scale=1'];

  if (zoomPolicy === 'app-shell-fixed') {
    parts.push('maximum-scale=1', 'user-scalable=no');
  }

  if (viewportFit) {
    parts.push(`viewport-fit=${viewportFit}`);
  }

  return parts.join(', ');
}
