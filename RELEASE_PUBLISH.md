# Release Publish Runbook

Status: Active SSOT
Version: 3.10.0
Last updated: 2026-07-22

This runbook defines the authenticated package-publish flow for the General Design System.

Canonical registry target: **npm**

Current registry reality:

- canonical install source: npm
- latest published baseline: `3.9.0`
- current repository line: `3.10.0`

GitHub release assets remain an optional fallback distribution path for unpublished release candidates:

- public release assets attached to tag `gds-v<VERSION>`
- generated from `npm run pack:release`

`@sovereignsquad/gds` is the preferred public npm convenience package. The release-bundle fallback remains split-package oriented because the umbrella package depends on the granular runtime packages.

## Preconditions

- local branch is `main`
- local `HEAD` is ready to release
- `VERSION` matches every publishable package version
- `npm run verify:release` passes
- API documentation and i18n gates pass:
  - `npm run verify:api-docs-coverage`
  - `npm run verify:i18n-route-coverage`
  - `npm run verify:i18n-message-parity`
  - `npm run verify:i18n-package-copy`
- operator is authenticated with npm
- for strict adoption releases, all scoped implementation issues are complete before publishing
- `npm run audit:board:strict` passes before and after the version bump

Check auth:

```bash
npm whoami
```

If that fails with `ENEEDAUTH`, authenticate first:

```bash
npm adduser
```

## Publishable packages

- `@sovereignsquad/gds`
- `@sovereignsquad/gds-theme`
- `@sovereignsquad/gds-core`
- `@sovereignsquad/gds-admin`
- `@sovereignsquad/gds-eslint-config`
- `@sovereignsquad/gds-compliance`

## Dry-run first

```bash
npm run publish:dry-run
```

## Build temporary release bundles

When npm publication is blocked but consumer teams still need a supported install path, generate public tarballs first:

```bash
npm run verify:release
npm run pack:release
```

That creates:

- `dist/release-bundles/<VERSION>/manifest.json`
- `dist/release-bundles/<VERSION>/INSTALL_FROM_RELEASE_ASSETS.md`
- one `.tgz` file per publishable package

Recommended public release tag:

```text
gds-v<VERSION>
```

Recommended GitHub release asset upload:

```bash
gh release create gds-v$(cat VERSION) dist/release-bundles/$(cat VERSION)/* --title "GDS $(cat VERSION) release bundles"
```

Once the release exists, consumers may install directly from the asset URLs without `.npmrc` or auth setup because the repository is public.

## Real publish

```bash
npm run audit:board:strict
npm run verify:release
npm run publish:npm
npm run verify:published
```

Do not announce the release or update client install prompts until `npm run verify:published` confirms all seven packages resolve from npm and the clean published-consumer smoke passes.

The `3.10.0` release install matrix must remain version-locked:

```bash
npm install @sovereignsquad/gds@3.10.0
npm install -D @sovereignsquad/gds-eslint-config@3.10.0 @sovereignsquad/gds-compliance@3.10.0 @sovereignsquad/gds-a11y@3.10.0

npm install @sovereignsquad/gds-theme@3.10.0 @sovereignsquad/gds-core@3.10.0 @sovereignsquad/gds-admin@3.10.0
```

## Expected publish order

1. `@sovereignsquad/gds-theme`
2. `@sovereignsquad/gds-core`
3. `@sovereignsquad/gds-admin`
4. `@sovereignsquad/gds-a11y`
5. `@sovereignsquad/gds`
6. `@sovereignsquad/gds-eslint-config`
7. `@sovereignsquad/gds-compliance`

## Post-publish verification

```bash
npm run verify:published
```

Environment knobs for propagation delay:

```bash
GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published
```

Use `npm run verify:published:availability` when you need only registry polling during incident triage. Use `npm run verify:published:consumer` to rerun the clean npm install/import smoke after propagation succeeds.

To close known delivered issues and normalize project-board cards after publish:

```bash
GDS_RELEASE_DELIVERED_ISSUES=123,124 npm run board:sync-release
npm run audit:board:strict
```

Retry policy:

- default verification uses five attempts with a five-second delay
- retries are bounded and visible in logs
- do not loop indefinitely
- if verification still fails after the retry window, treat the release as not ready for client communication

## GitHub Actions publish path

This repository includes a manual workflow at:

- `.github/workflows/publish-npm.yml`
- `.github/workflows/release-bundles.yml`

Required secret:

- `NPM_TOKEN`

Workflow behavior:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. publishes all seven packages
5. polls the registry until the release line is visible

The bundle workflow:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. runs `npm run pack:release`
5. uploads the tarballs as a workflow artifact
6. on a `gds-v*` tag, attaches those tarballs to a GitHub release

## Recovery guidance

- if `verify:release` fails, do not publish anything
- if `verify:published` fails because of propagation delay, rerun the availability step with a larger retry window before assuming publication failed
- if `verify:published:consumer` fails, treat the release as not ready for client communication even if registry availability passed
- if a partial publish succeeds, do not republish the same version with changed contents
- ship a corrective patch version instead
- update `CHANGELOG.md` if the corrective patch changes consumer behavior
