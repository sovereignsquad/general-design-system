# Verified Consumer Install Proof

Status: Active SSOT  
Version: 3.0.0  
Last updated: 2026-05-31

This document records the current proof points for the direct package-consumption path that consumer teams should rely on when evaluating GDS adoption readiness.

Latest published npm baseline validated by this proof: `3.0.0`  
Current repository line: `3.0.0`
Current major line: `3.0.0`

## Verified consumer baseline

- Framework: Next.js `15.5.18`
- React: `19.2.0`
- React DOM: `19.2.0`
- Mantine:
  - `8.3.6`
  - `9.2.1`
- Router style: App Router reference fixture
- Package line:
  - `@doneisbetter/gds`
  - `@doneisbetter/gds-theme`
  - `@doneisbetter/gds-core`
  - `@doneisbetter/gds-admin`
- Required subpaths:
  - `server`
  - `client`

## What is currently verified

### 1. Packed consumer install smoke

`npm run verify:mantine` packs the umbrella package plus the three runtime packages, installs them into clean temporary consumers, and verifies TypeScript compatibility against:

- Next `15.5.18`
- React `19.2.0`
- Mantine `8.3.6`
- Mantine `9.2.1`

The smoke fixture imports and type-checks the public umbrella entrypoint:

- `@doneisbetter/gds/client`

This proves that the package contents, peer ranges, and export maps are internally coherent for the declared Mantine 8 and Mantine 9 compatibility lines.

### 1a. Fresh root workspace build readiness

The repository root also declares platform-scoped optional native bindings for:

- `@rolldown/binding-darwin-arm64`
- `@rolldown/binding-darwin-x64`
- `@rolldown/binding-linux-x64-gnu`
- `@rollup/rollup-darwin-arm64`
- `@rollup/rollup-darwin-x64`
- `@rollup/rollup-linux-x64-gnu`

This is intended to make a fresh root `npm install` sufficient for local Vite and tsup builds on the supported macOS and Linux x64 environments.

### 2. Typed App Router reference fixture

`apps/reference-next` is the in-repo App Router consumer reference. It exists to validate the documented root split:

- server-side theme and structural imports from:
  - `@doneisbetter/gds-theme/server`
  - `@doneisbetter/gds-core/server`
  - `@doneisbetter/gds-admin/server`
- client-side provider and interactive imports from:
  - `@doneisbetter/gds-theme/client`
  - `@doneisbetter/gds-core/client`
  - `@doneisbetter/gds-admin/client`

This fixture is covered by `npm run verify:references`.

### 3. Known boundary

The App Router fixture remains a typed runtime reference rather than a hard release gate for full `next build`, because the upstream `/404` / `/_error` prerender edge on Next `15.5.x` is still reproducible even against a trivial route tree.

That means the current verified statement is:

- the package export contract is verified
- the consumer dependency graph is verified
- the App Router import split is verified
- full production Next prerender remains a tracked hardening area, not an undocumented assumption

## Consumer install commands

Canonical `3.0.0` end-state install source after the release gate opens:

```bash
npm install @doneisbetter/gds@3.0.1
npm install -D @doneisbetter/gds-eslint-config@3.0.0 @doneisbetter/gds-compliance@3.0.0
```

Granular package path:

```bash
npm install @doneisbetter/gds-theme@3.0.1 @doneisbetter/gds-core@3.0.1 @doneisbetter/gds-admin@3.0.1
npm install -D @doneisbetter/gds-eslint-config@3.0.0 @doneisbetter/gds-compliance@3.0.0
```

Fallback release-bundle install path if npm is temporarily unavailable:

- use the release-asset tarballs described in [RELEASE_PUBLISH.md](/Users/Shared/Projects/general-design-system/RELEASE_PUBLISH.md)
- do not use sibling `file:` links in CI or Vercel flows

## Evidence commands

```bash
npm run verify:mantine
npm run verify:references
npm run verify:published
```

`npm run verify:published` uses bounded registry polling. Operators may increase the retry window for registry propagation with `GDS_REGISTRY_RETRIES` and `GDS_REGISTRY_DELAY_MS`, but release communication must wait until all six packages resolve to the same `VERSION`.
