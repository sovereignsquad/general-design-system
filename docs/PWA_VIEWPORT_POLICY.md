# PWA Viewport & Zoom Policy

Status: Active SSOT
Version: 3.10.0
Last updated: 2026-07-22

GDS owns one canonical answer for mobile viewport configuration, including whether a product may disable pinch-zoom for an installed PWA that should feel like a native app shell. Consumers must use `getGdsPwaViewportMetaContent(...)` from `@sovereignsquad/gds-theme` instead of hand-writing a `<meta name="viewport">` string per project.

## The two lanes

| `zoomPolicy` | Behavior | When to use |
|---|---|---|
| `'browser-default'` (default) | `width=device-width, initial-scale=1` — zoom untouched | Nearly every product. Required for any product with body text, articles, forms, tables, or other reading-heavy content. |
| `'app-shell-fixed'` | Adds `maximum-scale=1, user-scalable=no` | Only a bounded, reviewed exception for an installed (`display: standalone`/`fullscreen`) PWA app-shell that a product owner has explicitly decided should suppress pinch-zoom for a native-app feel. |

```ts
import { getGdsPwaViewportMetaContent } from '@sovereignsquad/gds-theme';

getGdsPwaViewportMetaContent();
// "width=device-width, initial-scale=1"

getGdsPwaViewportMetaContent({ zoomPolicy: 'app-shell-fixed', viewportFit: 'cover' });
// "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
```

GDS does not render this tag itself — `<meta name="viewport">` must be set once in the document head, outside React render, alongside the mandatory `@sovereignsquad/gds-theme/styles.css` import (see `INSTALLATION_GUIDE.md`):

- **Vite** (`index.html`): `<meta name="viewport" content="<%= viewport content %>" />`, or set it directly since the value is static per build.
- **Next.js App Router**: return the string from `generateViewport()` in the root layout.

## Why `app-shell-fixed` is an exception, not a default

Disabling user zoom conflicts with two release-gate accessibility requirements in `FOUNDATION.md` (§1.5 Accessibility as a Release Gate):

- **WCAG 1.4.4 Resize Text** — text must be resizable up to 200% without loss of content or function.
- **WCAG 1.4.10 Reflow** — content must reflow to a single column at 320 CSS px without requiring horizontal scrolling or zoom.

A fixed viewport that blocks pinch-zoom removes one of the two ways low-vision users compensate (the other being OS-level display/font-size scaling, which `app-shell-fixed` does **not** and must never block). This is why the lane is opt-in, reviewed per product, and documented — not the shipped default.

**Practical caveat:** most current mobile browsers (iOS Safari 10+, current Chrome/Android WebView) ignore `user-scalable=no` outright and always allow pinch-zoom. `app-shell-fixed` mainly suppresses double-tap-to-zoom and affects older/embedded WebViews — treat it as a best-effort native-app signal, not a guaranteed zoom lock, and never as a substitute for the mitigations below.

## Required mitigations when choosing `app-shell-fixed`

A product adopting `app-shell-fixed` must still satisfy, and document per this checklist (owner + review date recorded in the product's local adoption note, mirroring the exception-contract shape in `EXCEPTION_SURFACES.md`):

1. **Owner** — a named product owner accountable for the choice.
2. **Reflow still works** — every route renders correctly at 320 CSS px width with no horizontal scroll, independent of zoom (WCAG 1.4.10 stays satisfied through layout, not through zoom).
3. **OS-level text scaling still works** — the app must never set a fixed root font size that ignores the user's OS/browser text-size preference (`rem`-based type only, no hard-coded `px` type scale). GDS typography tokens already satisfy this; do not override them with fixed pixel values.
4. **No unique zoom-dependent content** — nothing on the bounded app-shell surface should require pinch-zoom to read or operate in the first place; if it does, the surface is not a good candidate for this lane.
5. **Scope stays narrow** — apply the fixed viewport only to the installed/standalone app-shell entry point, not to any marketing, docs, article, or public browser-tab surface the same product may also serve.
6. **Testing** — verify at OS text-size 200% (or the platform-equivalent "Larger Text" setting) that the shell remains usable before shipping.
7. **Exit condition** — revert to `'browser-default'` if the product later grows reading-heavy content (articles, long-form tables, dense forms) that the standalone shell was not scoped for.

## Relationship to the PWA manifest

`zoomPolicy: 'app-shell-fixed'` only affects in-browser zoom gestures. It does not, by itself, make a site installable or standalone — that is controlled by the web app manifest's `display` field (`standalone` or `fullscreen`) and a registered service worker, which remain product-owned and outside GDS's scope. Use the two together deliberately: a manifest `display: standalone` PWA is the intended target for this lane, not a plain browser-tab site.
