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

## GitHub Packages (registry alternative)

GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`) is a second, independent distribution channel for all seven packages, published automatically by `.github/workflows/publish-github-packages.yml`. Unlike the GitHub-release-tarball fallback, it is a real resolving registry, so the `@sovereignsquad/gds` umbrella package installs correctly there too (its internal dependency on the granular packages resolves against the same registry, the same way it does on npmjs.com).

Why it exists: it authenticates with the workflow run's own ambient `GITHUB_TOKEN` (via the `packages: write` permission), not a separate `NPM_TOKEN` secret — so it keeps working even when the npmjs.com publish is blocked on npm account/token access, and requires no additional credential setup beyond what GitHub Actions already provides.

Consumer install (requires authentication — GitHub Packages does not allow anonymous installs even for public packages, unlike npmjs.com):

```ini
# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

`GITHUB_TOKEN` here is a personal access token (classic, `read:packages` scope is sufficient) or an org-provisioned token, supplied by the consumer/their CI — not a GDS-owned secret.

Manual publish (mirrors `npm run publish:npm`, pointed at GitHub Packages):

```bash
GDS_NPM_REGISTRY=https://npm.pkg.github.com npm run publish:npm
GDS_NPM_REGISTRY=https://npm.pkg.github.com node scripts/check-registry-publication.mjs
```

Both `scripts/publish-packages.mjs` and `scripts/check-registry-publication.mjs` already read the `GDS_NPM_REGISTRY` environment variable, so no script changes are needed to target a different registry — only the active `.npmrc`/auth token changes.

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

This repository includes four workflows:

- `.github/workflows/auto-tag-release.yml`
- `.github/workflows/release-bundles.yml`
- `.github/workflows/publish-npm.yml`
- `.github/workflows/publish-github-packages.yml`

Required secret (only for the npmjs.com path):

- `NPM_TOKEN`

`publish-github-packages.yml` needs no repository secret at all — it authenticates with the workflow run's own ambient `GITHUB_TOKEN`.

### Auto-tag-release (fully automatic — no manual tag/release step)

Triggers on every push to `main` that changes the root `VERSION` file. It reads `VERSION`, checks whether the matching `gds-v<VERSION>` tag already exists on the remote, and if not, creates and pushes it using the workflow run's own ambient `GITHUB_TOKEN`. This makes a routine release a normal merge, not a separate manual step: bump `VERSION` (and the aligned package/doc versions per `check-release-alignment.mjs`), merge to `main`, and the tag push happens automatically. Pushing that tag is what fans out into the two workflows below — no maintainer needs to run `git tag`/`git push` or draft a release in the GitHub web UI for a routine version bump.

Manually creating the tag (via `git push` or the GitHub UI, as in the 3.10.0 cutover before this workflow existed) still works and is the fallback if this workflow is ever disabled or a hotfix tag is needed outside the normal `VERSION`-bump flow.

### Bundle workflow (`release-bundles.yml`)

Triggers on `workflow_dispatch` or any pushed `gds-v*` tag (including the one `auto-tag-release.yml` just pushed):

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. runs `npm run pack:release`
5. uploads the tarballs as a workflow artifact
6. on a `gds-v*` tag, creates (or updates) the GitHub Release for that tag and attaches the tarballs as release assets

### Publish workflow (`publish-npm.yml`)

Triggers on `workflow_dispatch` or any pushed `gds-v*` tag:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. publishes all seven packages
5. polls the registry until the release line is visible

### GitHub Packages workflow (`publish-github-packages.yml`)

Triggers on `workflow_dispatch` or any pushed `gds-v*` tag, independently of `publish-npm.yml`:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. publishes all seven packages to `https://npm.pkg.github.com` (via `GDS_NPM_REGISTRY` + the ambient `GITHUB_TOKEN` — see the "GitHub Packages" section above)
5. polls that registry until the release line is visible

Because this workflow doesn't depend on `NPM_TOKEN`, it keeps working even when the npmjs.com publish is blocked on npm account/token access — as it was during the 3.10.0 release.

All three publish/bundle workflows (`release-bundles.yml`, `publish-npm.yml`, `publish-github-packages.yml`) gate their real side effects (creating the release, publishing to a registry) behind their own `verify:release` run — a version bump that fails verification never reaches any of them. A tag can exist without a completed release/publish if `verify:release` fails downstream; treat that the same as any other failed release attempt (see Recovery guidance) rather than assuming the tag alone means the release shipped.

## Recovery guidance

- if `verify:release` fails, do not publish anything
- if `verify:published` fails because of propagation delay, rerun the availability step with a larger retry window before assuming publication failed
- if `verify:published:consumer` fails, treat the release as not ready for client communication even if registry availability passed
- if a partial publish succeeds, do not republish the same version with changed contents
- ship a corrective patch version instead
- update `CHANGELOG.md` if the corrective patch changes consumer behavior
