# Installation Guide

Status: Active SSOT
Version: 3.10.0
Last updated: 2026-07-22

This guide is the canonical consumer setup path for the public umbrella package `@sovereignsquad/gds`. Granular package lanes remain available when a consumer explicitly wants them.

## Single install surface

The vendor UI engine is GDS's concern, not yours. Install the umbrella package and your own React; the engine is pulled in automatically:

```bash
npm install @sovereignsquad/gds react react-dom
```

`@sovereignsquad/gds` declares the engine (`@mantine/*`, `@tabler/icons-react`) as peer dependencies, and npm 7+ installs peers automatically — so you do **not** list them yourself. They stay peers (not bundled) on purpose: that guarantees a single resolved engine instance and avoids dual-instance/version-skew failures. All GDS packages pin the **same** engine range, enforced by `npm run verify:install-surface`.

Use icons through the GDS-owned `GdsIcons` surface (`import { GdsIcons } from '@sovereignsquad/gds'`) — do not import `@tabler/icons-react` directly.

> If your installer uses `--legacy-peer-deps` (which disables peer auto-install), add the engine to your install line explicitly; see the granular lane below.

Release-line rule:

- current stable package line: `3.10.0`
- current major line: `3.0.x`
- do not publish, announce, or ask clients to install a new version until `npm run verify:published` confirms npm availability

Public install and reference routes:

- live install page: `https://sovereignsquad.github.io/general-design-system/install`
- live governance page: `https://sovereignsquad.github.io/general-design-system/governance`
- live themes page: `https://sovereignsquad.github.io/general-design-system/themes`
- live pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- live coverage matrix: `https://sovereignsquad.github.io/general-design-system/coverage`
- live demos page: `https://sovereignsquad.github.io/general-design-system/live-demos`
- feature request intake: `https://sovereignsquad.github.io/general-design-system/request-feature`

## 1. Supported consumer baseline

Current verified consumer line:

- React `19.x`
- Mantine `8.3.x` and `9.2.x`
- Next.js `15.x` App Router or Pages Router
- Vite SPA consumers

See [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) and [VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) for the evidence-backed matrix.

## 2. Canonical install commands

Preferred `3.10.0` runtime package after the release gate opens:

```bash
npm install @sovereignsquad/gds@3.10.0
```

Governance packages:

```bash
npm install -D @sovereignsquad/gds-eslint-config@3.10.0 @sovereignsquad/gds-compliance@3.10.0 @sovereignsquad/gds-a11y@3.10.0
```

Granular runtime packages when package separation is intentional:

```bash
npm install @sovereignsquad/gds-theme@3.10.0 @sovereignsquad/gds-core@3.10.0 @sovereignsquad/gds-admin@3.10.0
npm install -D @sovereignsquad/gds-eslint-config@3.10.0 @sovereignsquad/gds-compliance@3.10.0 @sovereignsquad/gds-a11y@3.10.0
```

Required peers:

```bash
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

## 3. Root runtime setup

### Next.js App Router

Use the server/client split explicitly. The layout owns the color-scheme script and the provider file owns the single client boundary.

> **Mandatory:** import `@sovereignsquad/gds-theme/styles.css` exactly once, before your own app styles. Without it, GDS surfaces — including dropdown/menu/overlay backgrounds — render unstyled (transparent dropdowns).

```tsx
// app/layout.tsx
import '@sovereignsquad/gds-theme/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx
'use client';

import { GdsProvider } from '@sovereignsquad/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

### Vite / SPA

Mount one provider at the application root:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@sovereignsquad/gds-theme/styles.css'; // mandatory: load once, before app styles
import { GdsProvider } from '@sovereignsquad/gds/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GdsProvider>
    <App />
  </GdsProvider>,
);
```

### Viewport meta (including PWA app shells)

Set `<meta name="viewport">` once, outside React render, using `getGdsPwaViewportMetaContent(...)` from `@sovereignsquad/gds-theme` instead of hand-writing the content string:

```tsx
// Next.js App Router — app/layout.tsx
import { getGdsPwaViewportMetaContent } from '@sovereignsquad/gds-theme';

export function generateViewport() {
  return { other: { viewport: getGdsPwaViewportMetaContent() } };
}
```

```html
<!-- Vite / SPA — index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

The default (`zoomPolicy: 'browser-default'`) leaves pinch-zoom untouched — required for nearly every product. See [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md) before opting an installed PWA app shell into the `'app-shell-fixed'` (zoom-disabled) lane; it is a reviewed exception with required accessibility mitigations, not a default.

## 4. How to use the packages correctly

Use the package lanes intentionally:

- `@sovereignsquad/gds` for the simplest public install path across provider, public, discovery, detail, and admin primitives
- `@sovereignsquad/gds-core/client` for interactive cookbook surfaces such as `GdsLayoutTemplatePreview`
- `@sovereignsquad/gds-core/server` or `@sovereignsquad/gds-core` for starter schema registry helpers such as `getGdsLayoutTemplates()` and `getGdsLayoutTemplate(id)`
- `@sovereignsquad/gds-theme` for consumers that want only the provider/theme lane
- `@sovereignsquad/gds-core` for consumers that want only shared/public/editorial/discovery/detail primitives
- `@sovereignsquad/gds-admin` for consumers that want only authenticated operational shells and admin scaffolds

Use the runtime entrypoints intentionally:

- `@sovereignsquad/gds/server` for non-interactive structural surfaces
- `@sovereignsquad/gds/client` for interactive components and provider mounting
- granular `@sovereignsquad/gds-*/server` and `@sovereignsquad/gds-*/client` lanes remain supported when needed

Use the theme lanes intentionally:

- `gdsTheme` for the canonical base lane
- `gdsDarkPublicTheme` for dark-default public products
- `gdsFlatSurfaceTheme` for flatter operational surfaces
- `gdsEditorialPublicTheme` for serif-forward editorial/public surfaces
- `createPublicBrandTheme(...)` when a branded public product needs governed overrides on top of the shipped lanes

Do not treat `extendGdsTheme(...)` as a consumer branding-layer API. It remains temporarily exported for bounded internal/runtime composition only and should be considered non-canonical for adopters.

Use font lanes intentionally:

- `getGdsFontLanes()` lists the approved 10+ font lanes with fallback stacks, locale coverage, source metadata, and loading strategy
- `resolveGdsFontLane(...)` and `isGdsFontLaneId(...)` recover safely from unknown stored values
- `getGdsFontLaneStylesheetUrls()` exposes the approved non-blocking stylesheet URLs when a host app wants to preload fonts
- `applyGdsFontLane(theme, laneId)` binds typography into the same provider-owned theme lane as colors and surfaces
- do not add local font catalogs, route-local `@font-face`, or unmanaged Google Fonts links outside the registry

Prefer canonical primitives over local reinvention:

- `DiscoveryShell` for sidebar-first applications
- `SidebarNav` for sidebar IA
- `ActionBar` for semantic button stacks
- `ListingCard` for discovery cards
- `MapPanel` for sanctioned embeds
- `DetailProfileShell` for page/drawer detail surfaces
- `useGdsForm` + `FormErrorSummary` for deterministic form-state, validation, and submit behavior
- `OverlayManagerProvider` + `useOverlayManager` for deterministic layered overlay close behavior
- `CommandRegistryProvider` + `useCommandLauncher` for keyboard-first quick-action execution
- `GdsTelemetryProvider` + `useGdsTelemetry` + `emitGdsEvent` for standardized UI observability events
- `createGdsTelemetryAdapter` for vendor-neutral analytics sinks with bounded retry, timeout, adapter-unavailable, payload-rejected, sampling-disabled, sampled-out, emitted, and dropped states

Before introducing a new local surface contract, verify the live catalog first:

- `.../patterns/foundations` for shells, navigation, actions, controls, and shared workflow guidance
- `.../patterns/public` for public, editorial, docs, listing, and footer surfaces
- `.../patterns/operations` for dashboards, section panels, content editors, and detail patterns
- `.../patterns/data` for search, toolbars, tables, browse, and reporting rhythm
- `.../patterns/access` for auth, upload, recovery, sharing, and staged public flows
- `.../patterns/feedback` for state messaging, alerts, badges, modals, drawers, and responsive ergonomics

## 5. Required governance setup

Every mature consumer should add a `gds-adoption.json` manifest and run shared compliance checks in CI.

Minimum CI contract:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

For repos targeting true GDS-only enforcement:

```json
{
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"]
  }
}
```

The official GitHub Pages site in `apps/playground` follows this same direction. Treat it as the public proof that docs, pattern catalogs, theme exploration, and live demos can be shipped through GDS-owned contracts instead of local Mantine-heavy composition.

For theme-governance enforcement, add explicit theme ownership paths once the repo is ready:

```json
{
  "compliance": {
    "approvedThemeLanes": [
      "gdsTheme",
      "gdsDarkPublicTheme",
      "gdsFlatSurfaceTheme",
      "gdsEditorialPublicTheme",
      "createPublicBrandTheme"
    ],
    "themeOwnershipPaths": ["src/providers.tsx", "src/theme.ts"]
  }
}
```

## 6. Required verification before adoption

Run:

```bash
npm install
npm run build
npm run test:run
npm run verify:mantine
npm run audit:dependencies
gds-compliance check --manifest ./gds-adoption.json
```

Expected failure handling:

- peer conflict: run `npm ls @mantine/core @mantine/hooks @mantine/modals @mantine/notifications react react-dom`, then reinstall the supported peer line instead of forcing resolution
- registry propagation after publish: rerun `GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published:availability`, then `npm run verify:published:consumer`
- compliance failure: keep `strictMode` disabled until the failing local shell/card/action/detail adapter is migrated or declared as a temporary exception with owner, review date, tests, and exit condition

## 7. Common mistakes

Do not:

- use sibling `file:` links in CI or hosted builds
- keep a second active token or primitive system alive
- invent local shell, card, or action wrappers when the canonical GDS primitive already exists
- mix `server` and `client` entrypoints arbitrarily
- enable strict mode before the canonical primitives are actually adopted
- assume a missing local implementation means the GDS contract does not exist; check the live pattern catalog and SSOT first

## 8. Fallback install path

If npm is temporarily unavailable, use the public release tarballs described in [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md). That path is a fallback only, not the preferred steady-state install method.

For the `3.10.0` release cutover, fallback assets must use tag `gds-v3.10.0` and must not be announced as the canonical path once npm verification passes.

## 9. GitHub Packages (alternate registry)

All seven packages also publish to GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`), independently of the npmjs.com publish. Unlike the tarball fallback above, this is a real resolving registry, so the `@sovereignsquad/gds` umbrella package works here too.

```ini
# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

`GITHUB_TOKEN` must be your own personal access token (`read:packages` scope is sufficient) — GitHub Packages requires authentication for every install, even for public packages, unlike npmjs.com. See [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) for the publish side.
