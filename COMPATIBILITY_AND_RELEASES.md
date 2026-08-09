# Compatibility & Releases

Status: Active SSOT
Version: 6.0.0
Last updated: 2026-08-09

This document defines the supported package/runtime contract for the umbrella package `@sovereignsquad/gds` and the granular runtime packages `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`.

## Supported matrix

The machine-readable authority for the supported lines lives in [compatibility.matrix.json](compatibility.matrix.json).

| Surface | Supported now | Notes |
|---|---|---|
| Mantine | `^7.9.0` | Current in-repo build and test target |
| Mantine consumer smoke | `8.3.x`, `9.2.x` | Package peers and packed consumer smoke are validated against Mantine 8.3.6 and 9.2.1 with React 19 |
| React | `^18.2.0`, `^19.0.0` | React 19 compatibility is declared at the peer layer and validated through Mantine 8 and 9 packed-consumer smoke harnesses |
| Next.js | App Router and Pages Router consumers | Use server-safe/client-safe subpath imports where applicable |
| Vite | Supported | Playground and static/Multi-Page App consumers remain valid |
| TypeScript | `5.9.x` (packages build), `6.0.x` (reference apps) | Published packages are typechecked and their `.d.ts` emitted under TS 5.9.x (peer floor `5.4.5`); the private reference apps run TS 6.0.x — an intentional cross-major lane. A package-build TS major bump gets its own dedicated verification pass, not a routine bump. |

## Install contract

Canonical install path:

1. consume `@sovereignsquad/gds` as the preferred public install path, or consume `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin` directly when package-level separation is intentional
2. keep Mantine, React, and React DOM aligned to the compatibility matrix
3. avoid sibling-repo `file:` links for production CI/Vercel flows unless explicitly documented as temporary local development strategy

### Production CI/Vercel note

For hosted CI and Vercel builds, the intended end state is:

1. install `@sovereignsquad/gds` from a registry for the simplest path, or granular `@sovereignsquad/gds-*` packages when a consumer needs tighter dependency boundaries
2. keep the consumer repo independent of a sibling GDS checkout
3. pin the consumed GDS version explicitly in the consumer repo

Canonical registry target: **GitHub Packages** (`https://npm.pkg.github.com`)

GDS publishes current and future releases to GitHub Packages, the canonical registry. (A frozen, deprecated `3.9.0` snapshot also remains on npmjs.com; new installs use GitHub Packages — see `INSTALLATION_GUIDE.md`.) Every GitHub Packages install — including of public packages — requires authentication:

```ini
# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is a personal access token with `read:packages` scope (yours, or your CI's provisioned token) — not a GDS-owned secret.

Current live status:

- published baseline (GitHub Packages): `6.0.0`
- current repository line: `6.0.0`
- current major line: `6.x`

Consumer repos should install the latest published version unless they are explicitly validating an unpublished release candidate or an internal pre-release cut.

Authenticated release operators should use [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md); publishing itself runs only through `.github/workflows/publish-github-packages.yml` in CI, not from a maintainer's machine.

For the current `6.0.0` line, the install contract is (requires the `.npmrc` block above):

```bash
npm install @sovereignsquad/gds@6.0.0
npm install -D @sovereignsquad/gds-eslint-config@6.0.0 @sovereignsquad/gds-compliance@6.0.0
```

Granular consumers should use the same version across every package:

```bash
npm install @sovereignsquad/gds-theme@6.0.0 @sovereignsquad/gds-core@6.0.0 @sovereignsquad/gds-admin@6.0.0
npm install -D @sovereignsquad/gds-eslint-config@6.0.0 @sovereignsquad/gds-compliance@6.0.0
```

Do not mix pre-3.0 package lines with `6.0.0` packages in the same consumer dependency graph.

### Release-visibility artifacts (not an install path)

Every `gds-v<VERSION>` tag also produces a public GitHub Release with `.tgz` tarballs attached (via `npm run pack:release`), giving each release a visible page and a downloadable artifact for audit/offline purposes. These are **not** a documented consumer install path:

- the `@sovereignsquad/gds` umbrella package cannot be installed this way — its dependency ranges assume its sub-packages resolve from a registry
- do not point consumers at these tarball URLs; use the GitHub Packages install contract above

See [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) for the operator-side bundling flow.

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

- use `@sovereignsquad/gds/server` for the simplest server-safe umbrella path
- use `@sovereignsquad/gds-theme/server` for `gdsTheme`, the shipped public presets, and `createPublicBrandTheme(...)` when a consumer intentionally imports granular lanes
- use `@sovereignsquad/gds-theme/server` `withGdsMotion` only when a product explicitly opts into shared motion defaults
- use `@sovereignsquad/gds-core/server` or `@sovereignsquad/gds-admin/server` when a server-rendered layout only needs structural primitives
- use `@sovereignsquad/gds/client` for the simplest client-safe umbrella path
- use granular `@sovereignsquad/gds-*/client` for hook-driven or clearly interactive surfaces when package-level separation matters
- release validation now verifies that published `server` entrypoints remain free of client-only module drift and that documented export targets exist in built `dist` output

## Next.js App Router consumer path

Recommended production split for App Router consumers:

### Server files

Use server-safe entrypoints in layouts, metadata builders, and non-interactive composition:

```ts
import { gdsTheme, createPublicBrandTheme } from '@sovereignsquad/gds-theme/server';
import { AccentPanel, DocsPageShell, PageHeader, AuthShell } from '@sovereignsquad/gds-core/server';
import { WorkspaceHeader } from '@sovereignsquad/gds-admin/server';
```

### Client files

Use client entrypoints for providers and interactive components:

```tsx
'use client';

import { GdsProvider } from '@sovereignsquad/gds-theme/client';
import { SemanticButton, ThemeToggle } from '@sovereignsquad/gds-core/client';
import { AppShell, ResponsiveDataView } from '@sovereignsquad/gds-admin/client';
```

### Recommended root split

```tsx
// app/layout.tsx
import { gdsTheme } from '@sovereignsquad/gds-theme/server';
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

import { GdsProvider } from '@sovereignsquad/gds-theme/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

This is the intended stable consumer path for products that want direct package adoption without rebuilding GDS internals locally. The umbrella `@sovereignsquad/gds` package is the preferred public install target; the granular package examples remain supported when a consumer wants stricter package boundaries.

## Canonical bootstrap notes

- `app/layout.tsx` should own `ColorSchemeScript`, root `lang`, and root `dir`.
- `app/providers.tsx` should be the only client boundary that mounts `GdsProvider`.
- non-interactive public/editorial primitives like `PublicShell`, `DocsPageShell`, `AccentPanel`, `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` may render from `@sovereignsquad/gds-core/server`.
- interactive controls like `ThemeToggle`, `SemanticButton`, `UploadDropzone`, and `ResponsiveDataView` belong on `@sovereignsquad/gds/client` or the granular `@sovereignsquad/gds-*/client` lanes.

### Bootstrap failure states

- if `npm install` fails peer resolution, inspect the consumer's Mantine and React graph before using overrides
- if a published version is temporarily invisible, use bounded registry retries through `GDS_REGISTRY_RETRIES` and `GDS_REGISTRY_DELAY_MS`
- if npm publication is blocked, release assets may be used from `gds-v<VERSION>` as a temporary fallback only
- if compliance fails, fix the local contract drift or declare a temporary exception; do not bypass the manifest check in CI

## Canonical migration note

When a product currently uses local mirrored `src/gds/gds-*` contracts or a sibling checkout, the supported path is:

1. install the published `@sovereignsquad/gds` umbrella package or the granular `@sovereignsquad/gds-*` packages
2. move root provider/gds-theme imports to package entrypoints
3. replace mirrored contract imports family-by-family
4. keep the local manifest and compliance config active until all mirrors are deleted

See [ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md) for the full sequence and rollback path.

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

- `npm run verify:mantine` packs `@sovereignsquad/gds`, `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`, installs them into clean temporary consumers using Mantine `7.17.8` with React `18.3.1`, plus Mantine `8.3.6` and `9.2.1` with React `19.2.0`, then runs `tsc --noEmit`.
- `npm run audit:dependencies` verifies production audit cleanliness and generates `dependency-risk-report.json` with direct/peer/dev dependency categories, active dependency exceptions, and release evidence commands.
- `apps/reference-next` remains the typed App Router reference fixture. `npm run build:app-router --workspace=reference-next` is kept as an explicit non-gating harness while the upstream `/404` / `/_error` prerender failure on Next `15.5.x` is still reproducible even against a trivial reference route tree.

See [VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) for the consumer-facing proof summary.
