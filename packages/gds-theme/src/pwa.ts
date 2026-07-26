/**
 * GDS PWA thin-build helpers (issue #458).
 *
 * GDS is a component/theme library, not an app framework, so its PWA surface is
 * deliberately a *partial build* (see `docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md`):
 * the standards-based pieces that belong in a design system — a governed web-app
 * manifest generator, `display-mode` detection (see `pwa.client.ts`), and
 * safe-area inset tokens — and nothing more. Service-worker/offline caching and
 * install-prompt UX are explicit non-goals owned by the consuming application.
 *
 * This module is server-safe (pure data, no React, no DOM). The `display-mode`
 * detection hook lives in the client entrypoint.
 */

/** Standard web-app-manifest `display` modes, most-immersive first. */
export type GdsWebAppManifestDisplay = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';

/** A single manifest icon entry. `purpose` follows the W3C manifest spec. */
export interface GdsWebAppManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: 'any' | 'maskable' | 'monochrome' | string;
}

export interface GdsWebAppManifestOptions {
  /** Human-readable application name (required). */
  name: string;
  /** Short name for the home-screen label (falls back to `name`). */
  shortName?: string;
  description?: string;
  /**
   * Manifest `theme_color` — the browser UI / status-bar color. Pass a resolved
   * GDS brand/vibe color (e.g. `resolveGdsVibeTheme(id).primary`).
   */
  themeColor: string;
  /**
   * Manifest `background_color` — the splash-screen background shown before the
   * app paints. Pass the theme's light canvas (e.g. `vibe.canvasLight`).
   */
  backgroundColor: string;
  /** Defaults to `'standalone'`. */
  display?: GdsWebAppManifestDisplay;
  /** Defaults to `'/'`. */
  startUrl?: string;
  /** Defaults to `'/'`. */
  scope?: string;
  /** Stable manifest identity; defaults to `scope` when omitted. */
  id?: string;
  orientation?: 'any' | 'natural' | 'portrait' | 'landscape' | 'portrait-primary' | 'landscape-primary';
  icons?: GdsWebAppManifestIcon[];
  lang?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  categories?: string[];
}

/** A serializable W3C web-app-manifest object (snake_case, spec-shaped). */
export interface GdsWebAppManifest {
  name: string;
  short_name: string;
  description?: string;
  theme_color: string;
  background_color: string;
  display: GdsWebAppManifestDisplay;
  start_url: string;
  scope: string;
  id: string;
  orientation?: string;
  icons: GdsWebAppManifestIcon[];
  lang?: string;
  dir?: string;
  categories?: string[];
}

/**
 * Builds a valid, spec-shaped web-app-manifest object from GDS theme/brand
 * inputs. GDS does not serve the manifest itself — serialize the result and
 * expose it at your app's `manifest.webmanifest` URL (e.g. a Next.js
 * `app/manifest.ts` route, or a static file), then link it from the document
 * head. Keeps the manifest's `theme_color`/`background_color` aligned to the
 * active GDS theme instead of a hand-maintained duplicate.
 *
 * @throws if `name`, `themeColor`, or `backgroundColor` is missing/empty.
 *
 * @example
 * ```ts
 * import { getGdsWebAppManifest, resolveGdsVibeTheme } from '@sovereignsquad/gds-theme/server';
 * const vibe = resolveGdsVibeTheme('cosmic');
 * export default function manifest() {
 *   return getGdsWebAppManifest({
 *     name: 'Cosmic App',
 *     themeColor: vibe.primary,
 *     backgroundColor: vibe.canvasLight,
 *     icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
 *   });
 * }
 * ```
 */
export function getGdsWebAppManifest(options: GdsWebAppManifestOptions): GdsWebAppManifest {
  const name = options.name?.trim();
  if (!name) {
    throw new Error('getGdsWebAppManifest: `name` is required.');
  }
  if (!options.themeColor?.trim()) {
    throw new Error('getGdsWebAppManifest: `themeColor` is required (pass a resolved GDS theme color).');
  }
  if (!options.backgroundColor?.trim()) {
    throw new Error('getGdsWebAppManifest: `backgroundColor` is required (pass the theme canvas color).');
  }

  const scope = options.scope ?? '/';

  const manifest: GdsWebAppManifest = {
    name,
    short_name: (options.shortName ?? name).trim(),
    theme_color: options.themeColor.trim(),
    background_color: options.backgroundColor.trim(),
    display: options.display ?? 'standalone',
    start_url: options.startUrl ?? '/',
    scope,
    id: options.id ?? scope,
    icons: options.icons ?? [],
  };

  if (options.description) manifest.description = options.description;
  if (options.orientation) manifest.orientation = options.orientation;
  if (options.lang) manifest.lang = options.lang;
  if (options.dir) manifest.dir = options.dir;
  if (options.categories?.length) manifest.categories = options.categories;

  return manifest;
}

/**
 * GDS safe-area inset CSS variables, exposed as ready-to-use `var(...)` strings
 * for JS/inline styling. `@sovereignsquad/gds-theme/styles.css` defines the
 * `--gds-safe-area-inset-*` custom properties (each `env(safe-area-inset-*, 0px)`)
 * so notch/rounded-display insets resolve to `0px` on non-notched devices.
 *
 * Use these instead of hard-coding `env(safe-area-inset-*)` so every GDS shell
 * and consumer surface reads the same governed inset source.
 *
 * @example
 * ```tsx
 * import { gdsSafeAreaInset } from '@sovereignsquad/gds-theme';
 * <footer style={{ paddingBottom: gdsSafeAreaInset.bottom }} />
 * ```
 */
export const gdsSafeAreaInset = {
  top: 'var(--gds-safe-area-inset-top)',
  right: 'var(--gds-safe-area-inset-right)',
  bottom: 'var(--gds-safe-area-inset-bottom)',
  left: 'var(--gds-safe-area-inset-left)',
} as const;
