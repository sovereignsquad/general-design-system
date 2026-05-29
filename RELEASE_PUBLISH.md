# Release Publish Runbook

Status: Active SSOT
Version: 2.6.6
Last updated: 2026-05-29

This runbook defines the authenticated package-publish flow for the General Design System.

Canonical registry target: **npm**

Current registry reality:

- canonical install source: npm
- latest published baseline: `2.6.6`
- current repository line: `2.6.6`

GitHub release assets remain an optional fallback distribution path for unpublished release candidates:

- public release assets attached to tag `gds-v<VERSION>`
- generated from `npm run pack:release`

`@doneisbetter/gds` is the preferred public npm convenience package. The release-bundle fallback remains split-package oriented because the umbrella package depends on the granular runtime packages.

## Preconditions

- local branch is `main`
- local `HEAD` is ready to release
- `VERSION` matches every publishable package version
- `npm run verify:release` passes
- operator is authenticated with npm

Check auth:

```bash
npm whoami
```

If that fails with `ENEEDAUTH`, authenticate first:

```bash
npm adduser
```

## Publishable packages

- `@doneisbetter/gds`
- `@doneisbetter/gds-theme`
- `@doneisbetter/gds-core`
- `@doneisbetter/gds-admin`
- `@doneisbetter/gds-eslint-config`
- `@doneisbetter/gds-compliance`

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
npm run verify:release
npm run publish:npm
npm run verify:published
```

## Expected publish order

1. `@doneisbetter/gds-theme`
2. `@doneisbetter/gds-core`
3. `@doneisbetter/gds-admin`
4. `@doneisbetter/gds`
5. `@doneisbetter/gds-eslint-config`
6. `@doneisbetter/gds-compliance`

## Post-publish verification

```bash
npm run verify:published
```

Environment knobs for propagation delay:

```bash
GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published
```

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
4. publishes all six packages
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
- if `verify:published` fails because of propagation delay, rerun only the verification step with a larger retry window before assuming publication failed
- if a partial publish succeeds, do not republish the same version with changed contents
- ship a corrective patch version instead
- update `CHANGELOG.md` if the corrective patch changes consumer behavior
