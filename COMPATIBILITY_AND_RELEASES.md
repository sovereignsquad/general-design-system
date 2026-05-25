# Compatibility & Releases

Status: Active SSOT
Version: 2.4.4
Last updated: 2026-05-25

This document defines the supported package/runtime contract for `@gds/theme`, `@gds/core`, and `@gds/admin`.

## Supported matrix

The machine-readable authority for the supported lines lives in [compatibility.matrix.json](/Users/Shared/Projects/general-design-system/compatibility.matrix.json).

| Surface | Supported now | Notes |
|---|---|---|
| Mantine | `^7.9.0` | Current build and test target |
| React | `^18.2.0`, `^19.0.0` | React 19 compatibility is declared at the peer layer; package behavior is still validated primarily on React 18 in this repo |
| Next.js | App Router and Pages Router consumers | Use server-safe/client-safe subpath imports where applicable |
| Vite | Supported | Playground and static/Multi-Page App consumers remain valid |

## Install contract

Canonical install path:

1. consume `@gds/theme`, `@gds/core`, and `@gds/admin` as installable packages
2. keep Mantine, React, and React DOM aligned to the compatibility matrix
3. avoid sibling-repo `file:` links for production CI/Vercel flows unless explicitly documented as temporary local development strategy

### Production CI/Vercel note

For hosted CI and Vercel builds, the intended end state is:

1. install `@gds/*` from a registry
2. keep the consumer repo independent of a sibling GDS checkout
3. pin the consumed GDS version explicitly in the consumer repo

Until npm publication is executed from an authenticated release environment, this repository is only **publish-ready**, not registry-published by default.

Authenticated release operators should use [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md) together with:

```bash
npm run verify:release
npm run publish:dry-run
npm run publish:npm
npm run verify:published
```

### GitHub Packages fallback

If npm publication is not yet available, consumers may use a GitHub Packages distribution path once packages are published there by the release operator. The consumer contract remains the same: install from a registry, do not rely on sibling `file:` links in production-like flows.

## Export contract

Every package now exposes:

- root export: backwards-compatible mixed surface
- `./client`: client-safe entrypoint for interactive hooks/components
- `./server`: server-safe entrypoint for theme data and non-hook structural components

Recommended usage:

- use `@gds/theme/server` for `gdsTheme` and `extendGdsTheme`
- use `@gds/theme/server` `withGdsMotion` only when a product explicitly opts into shared motion defaults
- use `@gds/core/server` or `@gds/admin/server` when a server-rendered layout only needs structural primitives
- use `@gds/*/client` for hook-driven or clearly interactive surfaces
- release validation now verifies that published `server` entrypoints remain free of client-only module drift and that documented export targets exist in built `dist` output

## Next.js App Router consumer path

Recommended production split for App Router consumers:

### Server files

Use server-safe entrypoints in layouts, metadata builders, and non-interactive composition:

```ts
import { gdsTheme, extendGdsTheme } from '@gds/theme/server';
import { AccentPanel, DocsPageShell, PageHeader, AuthShell } from '@gds/core/server';
import { WorkspaceHeader } from '@gds/admin/server';
```

### Client files

Use client entrypoints for providers and interactive components:

```tsx
'use client';

import { GdsProvider } from '@gds/theme/client';
import { SemanticButton, ThemeToggle } from '@gds/core/client';
import { AppShell, ResponsiveDataView } from '@gds/admin/client';
```

### Recommended root split

```tsx
// app/layout.tsx
import { gdsTheme } from '@gds/theme/server';
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

import { GdsProvider } from '@gds/theme/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

This is the intended stable consumer path for products that want direct package adoption without rebuilding GDS internals locally.

## Canonical bootstrap notes

- `app/layout.tsx` should own `ColorSchemeScript`, root `lang`, and root `dir`.
- `app/providers.tsx` should be the only client boundary that mounts `GdsProvider`.
- non-interactive public/editorial primitives like `PublicShell`, `DocsPageShell`, `AccentPanel`, `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` may render from `@gds/core/server`.
- interactive controls like `ThemeToggle`, `SemanticButton`, `UploadDropzone`, and `ResponsiveDataView` belong on `@gds/*/client`.

## Versioning policy

- `VERSION` is the release-line authority for this repository
- publishable package versions must match `VERSION`
- normative changes must land in `CHANGELOG.md`
- package metadata, docs, and project plans may not drift across release lines

## Upgrade policy

For each minor release:

- update `CHANGELOG.md`
- update package versions
- document consumer-facing behavior changes
- note any new required local adapter or migration action

For each major release:

- document breaking contract changes explicitly
- define the deprecation window or migration expectation for active adopters

## Consumer expectations

Adopting products are expected to:

- pin to a known GDS release line
- record the consumed version in their local adapter doc
- rerun build, lint, and test/compliance checks when upgrading
- review shell, theme, and state-surface changes for regressions before promoting to production

## Reference consumers

This repository now includes:

- `apps/reference-vite` for direct public-product package consumption
- `apps/reference-next` for App Router-oriented runtime structure and typed route contracts

These fixtures are verified through `npm run verify:references` and act as the living adoption baseline for new consumers.
