# Verified Consumer Install Proof

Status: Active SSOT
Version: 3.14.17
Last updated: 2026-07-26

This document records the current proof points for the direct package-consumption path that consumer teams should rely on when evaluating GDS adoption readiness.

Latest published GitHub Packages baseline validated by this proof: `3.14.17`
Current repository line: `3.14.17`
Current major line: `3.0.x`

## Verified consumer baseline

- Framework: Next.js `15.5.18`
- React: `19.2.0`
- React DOM: `19.2.0`
- Mantine:
  - `8.3.6`
  - `9.2.1`
- Router style: App Router reference fixture
- Package line:
  - `@sovereignsquad/gds`
  - `@sovereignsquad/gds-theme`
  - `@sovereignsquad/gds-core`
  - `@sovereignsquad/gds-admin`
- Required subpaths:
  - `server`
  - `client`

## What is currently verified

### 1. Packed consumer install smoke

`npm run verify:mantine` packs the umbrella package plus the three runtime packages, installs them into clean temporary consumers, and verifies TypeScript compatibility against:

- Next `15.5.18`
- React `18.3.1` with Mantine `7.17.8`
- React `19.2.0`
- Mantine `8.3.6`
- Mantine `9.2.1`

The smoke fixture imports and type-checks the public umbrella entrypoint:

- `@sovereignsquad/gds/client`

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

### 2. Published GitHub Packages consumer smoke

`npm run verify:published` now runs registry availability followed by `npm run verify:published:consumer`.

The published smoke creates a temporary consumer outside the monorepo, installs the current `VERSION` from GitHub Packages (authenticated via a `read:packages`-scoped token), type-checks imports from the umbrella and granular packages, and runs runtime import checks for:

- `@sovereignsquad/gds`
- `@sovereignsquad/gds-theme`
- `@sovereignsquad/gds-core`
- `@sovereignsquad/gds-admin`
- `@sovereignsquad/gds-a11y`
- `@sovereignsquad/gds-eslint-config`
- `@sovereignsquad/gds-compliance`

The fixture also verifies the `Athlete Gold` VibeTheme, actionable `GdsDataTable` columns, and schema upload adapter types from the published packages.

### 3. Typed App Router reference fixture

`apps/reference-next` is the in-repo App Router consumer reference. It exists to validate the documented root split:

- server-side theme and structural imports from:
  - `@sovereignsquad/gds-theme/server`
  - `@sovereignsquad/gds-core/server`
  - `@sovereignsquad/gds-admin/server`
- client-side provider and interactive imports from:
  - `@sovereignsquad/gds-theme/client`
  - `@sovereignsquad/gds-core/client`
  - `@sovereignsquad/gds-admin/client`

This fixture is covered by `npm run verify:references`.

### 4. Known boundary

The App Router fixture remains a typed runtime reference rather than a hard release gate for full `next build`, because the upstream `/404` / `/_error` prerender edge on Next `15.5.x` is still reproducible even against a trivial route tree.

That means the current verified statement is:

- the package export contract is verified
- the consumer dependency graph is verified
- the App Router import split is verified
- full production Next prerender remains a tracked hardening area, not an undocumented assumption

## Consumer install commands

All installs require the `.npmrc` scope mapping to GitHub Packages first:

```ini
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Canonical `3.14.17` end-state install source after the release gate opens:

```bash
npm install @sovereignsquad/gds@3.14.17
npm install -D @sovereignsquad/gds-eslint-config@3.14.17 @sovereignsquad/gds-compliance@3.14.17 @sovereignsquad/gds-a11y@3.14.17
```

Granular package path:

```bash
npm install @sovereignsquad/gds-theme@3.14.17 @sovereignsquad/gds-core@3.14.17 @sovereignsquad/gds-admin@3.14.17
npm install -D @sovereignsquad/gds-eslint-config@3.14.17 @sovereignsquad/gds-compliance@3.14.17 @sovereignsquad/gds-a11y@3.14.17
```

Release-visibility tarballs attached to the `gds-v<VERSION>` GitHub Release (see [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md)) are audit/offline artifacts, not a documented install path — do not use them in place of the GitHub Packages install above, and do not use sibling `file:` links in CI or Vercel flows.

## Evidence commands

```bash
npm run verify:mantine
npm run audit:dependencies
npm run verify:references
npm run verify:published
```

`npm run verify:published` uses bounded registry polling. Operators may increase the retry window for registry propagation with `GDS_REGISTRY_RETRIES` and `GDS_REGISTRY_DELAY_MS`, but release communication must wait until all seven packages resolve to the same `VERSION`.

After registry polling, the command installs from npm into a clean temporary consumer. A passing publish is not considered communicable until that smoke also passes.
