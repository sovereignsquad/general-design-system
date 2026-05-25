# Release Publish Runbook

Status: Active SSOT
Version: 2.4.3
Last updated: 2026-05-25

This runbook defines the authenticated package-publish flow for the General Design System.

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

- `@gds/theme`
- `@gds/core`
- `@gds/admin`
- `@gds/eslint-config`
- `@gds/compliance`

## Dry-run first

```bash
npm run publish:dry-run
```

## Real publish

```bash
npm run verify:release
npm run publish:npm
```

## Expected publish order

1. `@gds/theme`
2. `@gds/core`
3. `@gds/admin`
4. `@gds/eslint-config`
5. `@gds/compliance`

## Post-publish verification

```bash
npm view @gds/theme version
npm view @gds/core version
npm view @gds/admin version
npm view @gds/eslint-config version
npm view @gds/compliance version
```

## Recovery guidance

- if `verify:release` fails, do not publish anything
- if a partial publish succeeds, do not republish the same version with changed contents
- ship a corrective patch version instead
- update `CHANGELOG.md` if the corrective patch changes consumer behavior
