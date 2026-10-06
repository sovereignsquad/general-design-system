# Step Adoption Status

Status: Adopted on the frozen 3.9.0 line
Version: 1.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/step`

Paths below are relative to the Step repository root.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `b836eb14`.

- **Scope.** A pnpm workspace. Only `apps/web-app`, a Vite React SPA, depends on GDS; no other `package.json` in the workspace declares a `@sovereignsquad/*` package.
- **Packages.** The umbrella `@sovereignsquad/gds` pinned to `3.9.0` (`apps/web-app/package.json:16`). There is no `.npmrc`, so it resolves from npmjs: the frozen snapshot that GDS policy deprecates ([INSTALLATION_GUIDE.md, "Migrating from the legacy npmjs 3.9.0 packages"](../INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages)). `@tabler/icons-react`, a peer dependency of `gds-core` 3.9.0, is not declared.
- **Provider and theme.** One `GdsProvider` with `defaultColorScheme="auto"` and no `theme` prop (`apps/web-app/src/main.tsx:19`), so the 3.9.0 `gdsTheme` default applies.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is not imported; `apps/web-app/src/main.tsx:8-9` imports the Mantine stylesheets.
- **Shells.** `AppShell` (`apps/web-app/src/App.tsx:122`) and `AuthShell` (`apps/web-app/src/LoginWall.tsx`) come from GDS. Most other UI imports `@mantine/core` directly, which [DEPENDENCY_GOVERNANCE.md, "Direct `@mantine/core` imports"](../DEPENDENCY_GOVERNANCE.md#direct-mantinecore-imports) treats as off-governance.
- **Keyboard access.** The primary navigation renders Mantine `NavLink` with `onClick` and no `href` (`apps/web-app/src/App.tsx:65-74`), and the sign-in/sign-up switch and the import toggle are `Anchor` elements with `onClick` and no `href` (`apps/web-app/src/LoginWall.tsx:117,153`). Each renders an `<a>` without `href`, which is not in the tab order. No sign-in or unlock form is a `<form>`, so Enter does not submit.
- **Governance.** No `gds-adoption.json`, and no `gds-compliance`, `gds-eslint-config` or `gds-a11y` dependency in the workspace. The app's `lint` script is `tsc --noEmit`.

## Next steps

1. Render the primary navigation with `SidebarNav` and `SidebarNavItem`, each item a link with `href` or a `button` ([COMPONENTS_AND_PATTERNS.md, "Sidebar IA Composition"](../COMPONENTS_AND_PATTERNS.md#sidebar-ia-composition)). Render the sign-up and import toggles as buttons, and wrap sign-in and unlock in a `<form>` with a submit button.
2. Move `apps/web-app` from the npmjs 3.9.0 snapshot to the current line on GitHub Packages, following [INSTALLATION_GUIDE.md, "Migrating from the legacy npmjs 3.9.0 packages"](../INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages), and declare `@tabler/icons-react`.
3. Import `@sovereignsquad/gds-theme/styles.css` once in `apps/web-app/src/main.tsx`, in place of the direct Mantine stylesheet imports.
4. Add `apps/web-app/gds-adoption.json` and run `gds-compliance` in CI. The scan root is the manifest's directory, so the manifest belongs in `apps/web-app`.
5. Replace direct `@mantine/core` imports with GDS exports where GDS re-exports the component, and record an approved exception for the rest.

Full fix list: `gds_fix_handover.md` at the Step repository root. It is not committed to the Step repository.
