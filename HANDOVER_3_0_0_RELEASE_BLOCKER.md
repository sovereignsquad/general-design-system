# GDS 3.0.0 Release Handover

Status: blocked on npm publish permission
Date: 2026-05-31

## Completed locally

- `VERSION` prepared for `3.0.0`
- all publishable workspace package versions prepared for `3.0.0`
- internal GDS package dependency ranges prepared for `^3.0.0`
- `package-lock.json` aligned to the `3.0.0` workspace line
- compatibility matrix and reference consumer manifests prepared for `3.0.0`
- README, installation, compatibility, publish, upgrade, proof, changelog, and Pages copy prepared for the `3.0.0` release line
- `npm run verify:release` passed locally on the `3.0.0` release cut
- `npm run publish:dry-run` passed locally for all six public packages
- `npm run audit:board:strict` passed with only #192 open and in progress

## Blocker

Real npm publication failed at the first package:

```text
npm publish --workspace @doneisbetter/gds-theme --access public
E404 Not Found - PUT https://registry.npmjs.org/@doneisbetter%2fgds-theme
The requested resource '@doneisbetter/gds-theme@3.0.0' could not be found or you do not have permission to access it.
```

`npm whoami` also fails with:

```text
E401 Unauthorized - GET https://registry.npmjs.org/-/whoami
```

No `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or npm auth env var is present in the current shell.

## Registry state

`GDS_REGISTRY_RETRIES=1 GDS_REGISTRY_DELAY_MS=1000 npm run verify:published` confirms npm still resolves every package to `2.6.7`, not `3.0.0`.

Packages still pending publish:

- `@doneisbetter/gds-theme@3.0.0`
- `@doneisbetter/gds-core@3.0.0`
- `@doneisbetter/gds-admin@3.0.0`
- `@doneisbetter/gds@3.0.0`
- `@doneisbetter/gds-eslint-config@3.0.0`
- `@doneisbetter/gds-compliance@3.0.0`

## Required recovery

1. Authenticate npm with an account/token that can publish under the `@doneisbetter` scope.
2. Re-run:

```bash
npm whoami
npm run verify:release
npm run publish:dry-run
npm run publish:npm
GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published
```

3. Commit and push the `3.0.0` release prep only after publication succeeds.
4. Confirm GitHub Pages deploy passes on the pushed commit.
5. Close #192 and move it to Done only after `verify:published` and Pages both pass.

## Important

Do not announce `3.0.0` to clients and do not close the 3.0.0 release wave until npm publication and registry verification pass.
