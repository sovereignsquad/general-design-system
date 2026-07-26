# Migrating to the `@sovereignsquad` GDS scope (v3.9.0)

The General Design System has moved npm scopes. The packages previously
published under **`@doneisbetter/*`** (last release `3.8.0`) are now published
under **`@sovereignsquad/*`** at **`3.9.0`**.

This is a **mechanical scope rename**. Component names, props, `/client` and
`/server` entrypoints, and the required stylesheet are all identical. `3.9.0`
is additive over `3.8.0`, so there are no API breaks to reconcile — only the
`@doneisbetter/` import prefix changes.

The old `@doneisbetter/*` packages still exist on npm and keep working, so
nothing breaks until you migrate. All **new** work should target
`@sovereignsquad`.

## Package name mapping

| Old (`@doneisbetter`, ≤ 3.8.0) | New (`@sovereignsquad`, 3.9.0) |
| --- | --- |
| `@doneisbetter/gds` | `@sovereignsquad/gds` |
| `@doneisbetter/gds-core` | `@sovereignsquad/gds-core` |
| `@doneisbetter/gds-theme` | `@sovereignsquad/gds-theme` |
| `@doneisbetter/gds-admin` | `@sovereignsquad/gds-admin` |
| `@doneisbetter/gds-a11y` | `@sovereignsquad/gds-a11y` |
| `@doneisbetter/gds-compliance` | `@sovereignsquad/gds-compliance` |
| `@doneisbetter/gds-eslint-config` | `@sovereignsquad/gds-eslint-config` |

---

## The prompt to give each developer

Paste the block below to any developer (or straight into a coding agent
running in the consumer repository).

> **Migrate this app from the old GDS scope `@doneisbetter/*` to the new
> `@sovereignsquad/*` (v3.9.0).**
>
> The General Design System moved npm scopes. The old packages
> (`@doneisbetter/gds*`, last published 3.8.0) are replaced by
> identically-named packages under `@sovereignsquad` at **3.9.0**. This is a
> mechanical rename: same component names, same props, same `/client` and
> `/server` entrypoints, same stylesheet. No code logic changes are required —
> only the import scope and package names.
>
> Do the following in this repository:
>
> 1. **Swap the dependencies.** In `package.json`, replace every
>    `@doneisbetter/gds*` dependency with the `@sovereignsquad/` equivalent,
>    pinned to `3.9.0`. The seven packages map 1:1:
>    - `@doneisbetter/gds` → `@sovereignsquad/gds`
>    - `@doneisbetter/gds-core` → `@sovereignsquad/gds-core`
>    - `@doneisbetter/gds-theme` → `@sovereignsquad/gds-theme`
>    - `@doneisbetter/gds-admin` → `@sovereignsquad/gds-admin`
>    - `@doneisbetter/gds-a11y` → `@sovereignsquad/gds-a11y`
>    - `@doneisbetter/gds-compliance` → `@sovereignsquad/gds-compliance`
>    - `@doneisbetter/gds-eslint-config` → `@sovereignsquad/gds-eslint-config`
>
> 2. **Rewrite all source references.** Replace the string `@doneisbetter/`
>    with `@sovereignsquad/` across the whole codebase. This covers:
>    - JS/TS imports: `import { ... } from '@doneisbetter/gds-core'` →
>      `'@sovereignsquad/gds-core'` (and `/client`, `/server` subpaths).
>    - The mandatory stylesheet import:
>      `import '@doneisbetter/gds-theme/styles.css'` →
>      `import '@sovereignsquad/gds-theme/styles.css'` (keep it as the **first**
>      bootstrap import).
>    - ESLint config `extends`/`plugins` referencing
>      `@doneisbetter/gds-eslint-config`.
>    - Any references in CI config, Dockerfiles, or docs.
>
>    A safe one-liner (run from repo root, adjust excludes as needed):
>    ```bash
>    grep -rl '@doneisbetter/' . \
>      --exclude-dir=node_modules --exclude-dir=.git \
>      --exclude-dir=dist --exclude-dir=build \
>      | xargs sed -i 's#@doneisbetter/#@sovereignsquad/#g'
>    ```
>
> 3. **Reinstall cleanly.** Remove the old scope from the lockfile and
>    `node_modules`, then reinstall:
>    ```bash
>    rm -rf node_modules package-lock.json   # or pnpm-lock.yaml / yarn.lock
>    npm install
>    ```
>    You install only `@sovereignsquad/gds` plus `react`/`react-dom`. The
>    engine (`@mantine/*`, `@tabler/icons-react`) is auto-installed as peers —
>    do **not** add them yourself, and import icons through `GdsIcons` from
>    `@sovereignsquad/gds`, never `@tabler/icons-react` directly.
>
> 4. **Verify.** Confirm no `@doneisbetter` references remain
>    (`grep -rn '@doneisbetter' . --exclude-dir=node_modules`), then run your
>    build, typecheck, lint, and tests. Everything should pass with zero code
>    changes beyond the rename, since 3.9.0 is API-compatible with 3.8.0.
>
> Report back: the diff should be import-path and dependency changes only.
> Flag anything that isn't a straight rename.

---

## Fresh install (new consumers)

Consumers that are not migrating an existing integration install the umbrella
package only:

```bash
npm install @sovereignsquad/gds@3.14.4 react react-dom
```

Then import the stylesheet first, before any GDS component:

```ts
import '@sovereignsquad/gds-theme/styles.css';
```

See `INSTALLATION_GUIDE.md` for the full setup path.

## Notes

- If you are migrating from a GDS **older than 3.8.0**, you will also pick up
  the intervening changes on the way to 3.9.0 — see `CHANGELOG.md` for anything
  beyond the scope rename.
- The engine stays a peer dependency on purpose: this guarantees a single
  resolved Mantine instance and avoids dual-instance / version-skew failures.
