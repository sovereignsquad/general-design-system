# Release Publish Runbook

Status: Active SSOT
Version: 3.14.4
Last updated: 2026-07-25

This runbook defines the authenticated package-publish flow for the General Design System.

Canonical registry target: **GitHub Packages** (`https://npm.pkg.github.com`)

Current registry reality:

- canonical install source: GitHub Packages
- current repository line: `3.14.4`

GDS does not publish to npmjs.com. GitHub Packages is the sole registry, chosen specifically because it authenticates with the same ambient `GITHUB_TOKEN` every GitHub Actions run already has — no separate npm.com account, no `NPM_TOKEN` secret, no external credential to lose access to. `@sovereignsquad/gds` is the preferred convenience package; it installs correctly from GitHub Packages because it's a real resolving registry (its dependency on the granular runtime packages resolves against the same registry, exactly like npmjs.com would).

The one real tradeoff: GitHub Packages requires authentication for every install, even of public packages — there is no anonymous `npm install`. Every consumer needs a personal access token (`read:packages` scope) and an `.npmrc` entry. See "Consumer install" below and `INSTALLATION_GUIDE.md`.

## Consumer install

```ini
# .npmrc
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

`GITHUB_TOKEN` here is the consumer's own personal access token or their CI's provisioned token — not a GDS-owned secret.

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
- for strict adoption releases, all scoped implementation issues are complete before publishing
- `npm run audit:board:strict` passes before and after the version bump

No local npm authentication step is required — publishing runs exclusively through `.github/workflows/publish-github-packages.yml`, authenticated by that workflow run's own `GITHUB_TOKEN`. There is no `npm whoami`/`npm adduser` precondition.

## Publishable packages

- `@sovereignsquad/gds`
- `@sovereignsquad/gds-theme`
- `@sovereignsquad/gds-core`
- `@sovereignsquad/gds-admin`
- `@sovereignsquad/gds-a11y`
- `@sovereignsquad/gds-eslint-config`
- `@sovereignsquad/gds-compliance`

## Dry-run first

```bash
npm run publish:dry-run
```

## Real publish

The real publish runs in CI, not from a maintainer's machine:

```bash
npm run audit:board:strict
```

then trigger `.github/workflows/publish-github-packages.yml` (automatically, via a `gds-v<VERSION>` tag push — see "Fully automatic release cutover" below — or manually via `workflow_dispatch`). That workflow runs `verify:release`, publishes all seven packages to GitHub Packages, and polls the registry until the release line is visible (`npm run verify:published`).

Do not announce the release or update client install prompts until that workflow's "Verify registry publication" step passes.

The `3.14.4` release install matrix must remain version-locked:

```bash
npm install @sovereignsquad/gds@3.14.4
npm install -D @sovereignsquad/gds-eslint-config@3.14.4 @sovereignsquad/gds-compliance@3.14.4 @sovereignsquad/gds-a11y@3.14.4

npm install @sovereignsquad/gds-theme@3.14.4 @sovereignsquad/gds-core@3.14.4 @sovereignsquad/gds-admin@3.14.4
```

(All installs above require the `.npmrc` scope mapping from "Consumer install".)

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

Use `npm run verify:published:availability` when you need only registry polling during incident triage. Use `npm run verify:published:consumer` to rerun the clean npm install/import smoke after propagation succeeds (this needs a `read:packages`-scoped token in `NODE_AUTH_TOKEN`/`GDS_NPM_TOKEN` to authenticate the temporary install against GitHub Packages).

To close known delivered issues on the label board after publish (closing an issue is its "move to Done"; this also strips its `status:` label):

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

This repository includes three workflows:

- `.github/workflows/auto-tag-release.yml`
- `.github/workflows/release-bundles.yml`
- `.github/workflows/publish-github-packages.yml`

No repository secret is required for any of them — each authenticates with the workflow run's own ambient `GITHUB_TOKEN`.

### Auto-tag-release (fully automatic — no manual tag/release step)

Triggers on every push to `main` that changes the root `VERSION` file. It reads `VERSION`, checks whether the matching `gds-v<VERSION>` tag already exists on the remote, and if not, creates and pushes it using the workflow run's own ambient `GITHUB_TOKEN`. This makes a routine release a normal merge, not a separate manual step: bump `VERSION` (and the aligned package/doc versions per `check-release-alignment.mjs`), merge to `main`, and the tag push happens automatically. Pushing that tag is what fans out into the two workflows below — no maintainer needs to run `git tag`/`git push` or draft a release in the GitHub web UI for a routine version bump.

Manually creating the tag (via `git push` or the GitHub UI) still works and is the fallback if this workflow is ever disabled or a hotfix tag is needed outside the normal `VERSION`-bump flow.

### Bundle workflow (`release-bundles.yml`)

Triggers on `workflow_dispatch` or any pushed `gds-v*` tag:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. runs `npm run pack:release`
5. uploads the tarballs as a workflow artifact
6. on a `gds-v*` tag, creates (or updates) the GitHub Release for that tag and attaches the tarballs as release assets

This workflow is **not** a documented consumer install path — it exists to give each release a visible GitHub Release page (notes, tag history) and a downloadable artifact for audit/offline purposes. The canonical way to install GDS is GitHub Packages; do not point consumers at these tarball URLs.

### Publish workflow (`publish-github-packages.yml`)

Triggers on `workflow_dispatch` or any pushed `gds-v*` tag:

1. runs `npm ci --omit=optional`
2. installs Linux-native `rollup` and `rolldown` bindings explicitly
3. runs `npm run verify:release`
4. publishes all seven packages to `https://npm.pkg.github.com` (via `actions/setup-node`'s `registry-url`/`scope` inputs + the ambient `GITHUB_TOKEN` — no repository secret configured)
5. polls that registry until the release line is visible

Both `release-bundles.yml` and `publish-github-packages.yml` gate their real side effects (creating the release, publishing to the registry) behind their own `verify:release` run — a version bump that fails verification never reaches either. A tag can exist without a completed release/publish if `verify:release` fails downstream; treat that the same as any other failed release attempt (see Recovery guidance) rather than assuming the tag alone means the release shipped.

### Issue board (`board-sync.yml`)

The project board is **GitHub Issues filtered by `status:` labels**, not a Projects v2 board — see [`PROJECT_BOARD.md`](PROJECT_BOARD.md). The `board-sync.yml` workflow keeps that label board consistent: it provisions the canonical labels (`npm run board:labels`) and runs the strict board audit (`npm run audit:board:strict`, every open issue in exactly one status column). It triggers via `workflow_run` after **GDS Release Bundles** completes, plus manual `workflow_dispatch` and pushes to `main` that touch the board tooling — deliberately not `push: tags`, since a `GITHUB_TOKEN`-pushed tag never fires `push`/`tag` triggers (the same anti-recursion rule documented under Auto-tag-release).

Both steps use the ambient `GITHUB_TOKEN` with `issues: write` — **no secret PAT is required**. This is the point of the label-based board: unlike the retired org-level Projects v2 board (project #11), which needed a `GDS_PROJECT_TOKEN` PAT the default token could not stand in for, every board operation here is a label change the default token can perform. See issue #431 (the superseded Projects v2 sync) and `PROJECT_BOARD.md`.

## Recovery guidance

- if `verify:release` fails, do not publish anything
- if `verify:published` fails because of propagation delay, rerun the availability step with a larger retry window before assuming publication failed
- if `verify:published:consumer` fails, treat the release as not ready for client communication even if registry availability passed
- if a partial publish succeeds, do not republish the same version with changed contents
- ship a corrective patch version instead
- update `CHANGELOG.md` if the corrective patch changes consumer behavior
