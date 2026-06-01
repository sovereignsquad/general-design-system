# Installation Guide

Status: Active SSOT
Version: 3.0.0
Last updated: 2026-05-31

This guide is the canonical consumer setup path for the public umbrella package `@doneisbetter/gds`. Granular package lanes remain available when a consumer explicitly wants them.

Release-line rule:

- current stable package line: `3.0.0`
- current major line: `3.0.0`
- do not publish, announce, or ask clients to install `3.0.0` until all `GDS 3.0.0 - Adoption Platform Release` issues are complete and `npm run verify:published` confirms npm availability

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

See [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) and [VERIFIED_CONSUMER_INSTALL_PROOF.md](/Users/Shared/Projects/general-design-system/VERIFIED_CONSUMER_INSTALL_PROOF.md) for the evidence-backed matrix.

## 2. Canonical install commands

Preferred `3.0.0` runtime package after the release gate opens:

```bash
npm install @doneisbetter/gds@3.0.0
```

Governance packages:

```bash
npm install -D @doneisbetter/gds-eslint-config@3.0.0 @doneisbetter/gds-compliance@3.0.0
```

Granular runtime packages when package separation is intentional:

```bash
npm install @doneisbetter/gds-theme@3.0.0 @doneisbetter/gds-core@3.0.0 @doneisbetter/gds-admin@3.0.0
npm install -D @doneisbetter/gds-eslint-config@3.0.0 @doneisbetter/gds-compliance@3.0.0
```

Required peers:

```bash
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

## 3. Root runtime setup

### Next.js App Router

Use the server/client split explicitly. The layout owns the color-scheme script and the provider file owns the single client boundary.

```tsx
// app/layout.tsx
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

import { GdsProvider } from '@doneisbetter/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

### Vite / SPA

Mount one provider at the application root:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GdsProvider } from '@doneisbetter/gds/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GdsProvider>
    <App />
  </GdsProvider>,
);
```

## 4. How to use the packages correctly

Use the package lanes intentionally:

- `@doneisbetter/gds` for the simplest public install path across provider, public, discovery, detail, and admin primitives
- `@doneisbetter/gds-theme` for consumers that want only the provider/theme lane
- `@doneisbetter/gds-core` for consumers that want only shared/public/editorial/discovery/detail primitives
- `@doneisbetter/gds-admin` for consumers that want only authenticated operational shells and admin scaffolds

Use the runtime entrypoints intentionally:

- `@doneisbetter/gds/server` for non-interactive structural surfaces
- `@doneisbetter/gds/client` for interactive components and provider mounting
- granular `@doneisbetter/gds-*/server` and `@doneisbetter/gds-*/client` lanes remain supported when needed

Use the theme lanes intentionally:

- `gdsTheme` for the canonical base lane
- `gdsDarkPublicTheme` for dark-default public products
- `gdsFlatSurfaceTheme` for flatter operational surfaces
- `gdsEditorialPublicTheme` for serif-forward editorial/public surfaces
- `createPublicBrandTheme(...)` when a branded public product needs governed overrides on top of the shipped lanes

Do not treat `extendGdsTheme(...)` as a consumer branding-layer API. It remains temporarily exported for bounded internal/runtime composition only and should be considered non-canonical for adopters.

Prefer canonical primitives over local reinvention:

- `DiscoveryShell` for sidebar-first applications
- `SidebarNav` for sidebar IA
- `ActionBar` for semantic button stacks
- `ListingCard` for discovery cards
- `MapPanel` for sanctioned embeds
- `DetailProfileShell` for page/drawer detail surfaces

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
gds-compliance check --manifest ./gds-adoption.json
```

Expected failure handling:

- peer conflict: run `npm ls @mantine/core @mantine/hooks @mantine/modals @mantine/notifications react react-dom`, then reinstall the supported peer line instead of forcing resolution
- registry propagation after publish: rerun `GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published`
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

If npm is temporarily unavailable, use the public release tarballs described in [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md). That path is a fallback only, not the preferred steady-state install method.

For the `3.0.0` release cutover, fallback assets must use tag `gds-v3.0.0` and must not be announced as the canonical path once npm verification passes.
