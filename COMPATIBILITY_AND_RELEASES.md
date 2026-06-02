# Compatibility & Releases

Status: Active SSOT
Version: 3.0.3
Last updated: 2026-06-01

This document defines the supported package/runtime contract for the umbrella package `@doneisbetter/gds` and the granular runtime packages `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`.

## Supported matrix

The machine-readable authority for the supported lines lives in [compatibility.matrix.json](/Users/Shared/Projects/general-design-system/compatibility.matrix.json).

| Surface | Supported now | Notes |
|---|---|---|
| Mantine | `^7.9.0` | Current in-repo build and test target |
| Mantine consumer smoke | `8.3.x`, `9.2.x` | Package peers and packed consumer smoke are validated against Mantine 8.3.6 and 9.2.1 with React 19 |
| React | `^18.2.0`, `^19.0.0` | React 19 compatibility is declared at the peer layer and validated through Mantine 8 and 9 packed-consumer smoke harnesses |
| Next.js | App Router and Pages Router consumers | Use server-safe/client-safe subpath imports where applicable |
| Vite | Supported | Playground and static/Multi-Page App consumers remain valid |

## Install contract

Canonical install path:

1. consume `@doneisbetter/gds` as the preferred public install path, or consume `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin` directly when package-level separation is intentional
2. keep Mantine, React, and React DOM aligned to the compatibility matrix
3. avoid sibling-repo `file:` links for production CI/Vercel flows unless explicitly documented as temporary local development strategy

### Production CI/Vercel note

For hosted CI and Vercel builds, the intended end state is:

1. install `@doneisbetter/gds` from a registry for the simplest path, or granular `@doneisbetter/gds-*` packages when a consumer needs tighter dependency boundaries
2. keep the consumer repo independent of a sibling GDS checkout
3. pin the consumed GDS version explicitly in the consumer repo

Canonical registry target: **npm**

Current live status:

- published npm baseline: `3.0.3`
- current repository line: `3.0.3`
- current major line: `3.0.x`

Consumer repos should install the latest published npm version unless they are explicitly validating an unpublished release candidate or an internal pre-release cut.

Authenticated release operators should use [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md) together with:

```bash
npm run verify:release
npm run publish:dry-run
npm run publish:npm
npm run verify:published
```

For the current `3.0.3` line, the install contract is:

```bash
npm install @doneisbetter/gds@3.0.3
npm install -D @doneisbetter/gds-eslint-config@3.0.3 @doneisbetter/gds-compliance@3.0.3
```

Granular consumers should use the same version across every package:

```bash
npm install @doneisbetter/gds-theme@3.0.3 @doneisbetter/gds-core@3.0.3 @doneisbetter/gds-admin@3.0.3
npm install -D @doneisbetter/gds-eslint-config@3.0.3 @doneisbetter/gds-compliance@3.0.3
```

Do not mix pre-3.0 package lines with `3.0.3` packages in the same consumer dependency graph.

### Fallback release-bundle distribution path

If npm is temporarily unavailable for operational reasons, the approved fallback install source is **public GitHub release assets** from this repository.

This fallback path:

- works in local development
- works in CI
- works in Vercel or other hosted builds
- keeps the consumer repo independent from sibling `file:` links
- preserves plain `npm install` peer resolution for Mantine `8.3.x` and `9.2.x` consumers

Tag format:

```text
gds-v<VERSION>
```

Asset URL format:

```text
https://github.com/sovereignsquad/general-design-system/releases/download/gds-v<VERSION>/<asset-name>.tgz
```

Example for `3.0.0`:

```bash
npm install \
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.0.3/doneisbetter-gds-theme-3.0.3.tgz \
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.0.3/doneisbetter-gds-core-3.0.3.tgz \
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.0.3/doneisbetter-gds-admin-3.0.3.tgz

npm install -D \
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.0.3/doneisbetter-gds-eslint-config-3.0.3.tgz \
  https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.0.3/doneisbetter-gds-compliance-3.0.3.tgz
```

Auth expectations for the temporary path:

- no `.npmrc` override is required for public release assets
- no npm token is required for consumers
- standard GitHub public release asset availability is sufficient

See [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md) for the operator-side bundling flow.

### Local workspace build note

The root workspace now declares platform-scoped optional native bindings for `rolldown` and `rollup` on the supported local and CI environments:

- macOS arm64
- macOS x64
- Linux x64 (glibc)

That means a fresh root `npm install` should provision the native build layer needed by Vite and tsup without manual follow-up installs on those platforms.

## Export contract

Every package now exposes:

- root export: backwards-compatible mixed surface
- `./client`: client-safe entrypoint for interactive hooks/components
- `./server`: server-safe entrypoint for theme data and non-hook structural components

Recommended usage:

- use `@doneisbetter/gds/server` for the simplest server-safe umbrella path
- use `@doneisbetter/gds-theme/server` for `gdsTheme`, the shipped public presets, and `createPublicBrandTheme(...)` when a consumer intentionally imports granular lanes
- use `@doneisbetter/gds-theme/server` `withGdsMotion` only when a product explicitly opts into shared motion defaults
- use `@doneisbetter/gds-core/server` or `@doneisbetter/gds-admin/server` when a server-rendered layout only needs structural primitives
- use `@doneisbetter/gds/client` for the simplest client-safe umbrella path
- use granular `@doneisbetter/gds-*/client` for hook-driven or clearly interactive surfaces when package-level separation matters
- release validation now verifies that published `server` entrypoints remain free of client-only module drift and that documented export targets exist in built `dist` output

## Next.js App Router consumer path

Recommended production split for App Router consumers:

### Server files

Use server-safe entrypoints in layouts, metadata builders, and non-interactive composition:

```ts
import { gdsTheme, createPublicBrandTheme } from '@doneisbetter/gds-theme/server';
import { AccentPanel, DocsPageShell, PageHeader, AuthShell } from '@doneisbetter/gds-core/server';
import { WorkspaceHeader } from '@doneisbetter/gds-admin/server';
```

### Client files

Use client entrypoints for providers and interactive components:

```tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds-theme/client';
import { SemanticButton, ThemeToggle } from '@doneisbetter/gds-core/client';
import { AppShell, ResponsiveDataView } from '@doneisbetter/gds-admin/client';
```

### Recommended root split

```tsx
// app/layout.tsx
import { gdsTheme } from '@doneisbetter/gds-theme/server';
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

import { GdsProvider } from '@doneisbetter/gds-theme/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

This is the intended stable consumer path for products that want direct package adoption without rebuilding GDS internals locally. The umbrella `@doneisbetter/gds` package is the preferred public install target; the granular package examples remain supported when a consumer wants stricter package boundaries.

## Canonical bootstrap notes

- `app/layout.tsx` should own `ColorSchemeScript`, root `lang`, and root `dir`.
- `app/providers.tsx` should be the only client boundary that mounts `GdsProvider`.
- non-interactive public/editorial primitives like `PublicShell`, `DocsPageShell`, `AccentPanel`, `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` may render from `@doneisbetter/gds-core/server`.
- interactive controls like `ThemeToggle`, `SemanticButton`, `UploadDropzone`, and `ResponsiveDataView` belong on `@doneisbetter/gds/client` or the granular `@doneisbetter/gds-*/client` lanes.

### Bootstrap failure states

- if `npm install` fails peer resolution, inspect the consumer's Mantine and React graph before using overrides
- if a published version is temporarily invisible, use bounded registry retries through `GDS_REGISTRY_RETRIES` and `GDS_REGISTRY_DELAY_MS`
- if npm publication is blocked, release assets may be used from `gds-v<VERSION>` as a temporary fallback only
- if compliance fails, fix the local contract drift or declare a temporary exception; do not bypass the manifest check in CI

## Canonical migration note

When a product currently uses local mirrored `src/gds/gds-*` contracts or a sibling checkout, the supported path is:

1. install the published `@doneisbetter/gds` umbrella package or the granular `@doneisbetter/gds-*` packages
2. move root provider/gds-theme imports to package entrypoints
3. replace mirrored contract imports family-by-family
4. keep the local manifest and compliance config active until all mirrors are deleted

See [ADOPTION_AND_MIGRATION_PLAYBOOK.md](/Users/Shared/Projects/general-design-system/ADOPTION_AND_MIGRATION_PLAYBOOK.md) for the full sequence and rollback path.

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
- rerun build, lint, and test/gds-compliance checks when upgrading
- review shell, theme, and state-surface changes for regressions before promoting to production

## Reference consumers

This repository now includes:

- `apps/reference-vite` for direct public-product package consumption
- `apps/reference-next` for App Router-oriented runtime structure and typed route contracts

These fixtures are verified through `npm run verify:references` and act as the living adoption baseline for new consumers.

## Compatibility evidence

- `npm run verify:mantine` packs `@doneisbetter/gds`, `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`, installs them into clean temporary consumers using Mantine `8.3.6` and `9.2.1`, React `19.2.0`, React DOM `19.2.0`, and Next `15.5.18`, then runs `tsc --noEmit`.
- `apps/reference-next` remains the typed App Router reference fixture. `npm run build:app-router --workspace=reference-next` is kept as an explicit non-gating harness while the upstream `/404` / `/_error` prerender failure on Next `15.5.x` is still reproducible even against a trivial reference route tree.

See [VERIFIED_CONSUMER_INSTALL_PROOF.md](/Users/Shared/Projects/general-design-system/VERIFIED_CONSUMER_INSTALL_PROOF.md) for the consumer-facing proof summary.
