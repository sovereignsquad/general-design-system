# Installation Guide

Status: Active SSOT
Version: 2.6.4
Last updated: 2026-05-28

This guide is the canonical consumer setup path for the public umbrella package `@doneisbetter/gds`. Granular package lanes remain available when a consumer explicitly wants them.

## 1. Supported consumer baseline

Current verified consumer line:

- React `19.x`
- Mantine `8.3.x` and `9.2.x`
- Next.js `15.x` App Router or Pages Router
- Vite SPA consumers

See [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) and [VERIFIED_CONSUMER_INSTALL_PROOF.md](/Users/Shared/Projects/general-design-system/VERIFIED_CONSUMER_INSTALL_PROOF.md) for the evidence-backed matrix.

## 2. Canonical install commands

Preferred runtime package:

```bash
npm install @doneisbetter/gds
```

Governance packages:

```bash
npm install -D @doneisbetter/gds-eslint-config @doneisbetter/gds-compliance
```

Required peers:

```bash
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

## 3. Root runtime setup

### Next.js App Router

Use the server/client split explicitly.

```tsx
// app/layout.tsx
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

Prefer canonical primitives over local reinvention:

- `DiscoveryShell` for sidebar-first applications
- `SidebarNav` for sidebar IA
- `ActionBar` for semantic button stacks
- `ListingCard` for discovery cards
- `MapPanel` for sanctioned embeds
- `DetailProfileShell` for page/drawer detail surfaces

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

## 6. Required verification before adoption

Run:

```bash
npm install
npm run build
npm run test:run
npm run verify:mantine
gds-compliance check --manifest ./gds-adoption.json
```

## 7. Common mistakes

Do not:

- use sibling `file:` links in CI or hosted builds
- keep a second active token or primitive system alive
- invent local shell, card, or action wrappers when the canonical GDS primitive already exists
- mix `server` and `client` entrypoints arbitrarily
- enable strict mode before the canonical primitives are actually adopted

## 8. Fallback install path

If npm is temporarily unavailable, use the public release tarballs described in [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md). That path is a fallback only, not the preferred steady-state install method.
