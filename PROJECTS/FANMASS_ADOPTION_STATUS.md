# Fanmass Adoption Status

Status: In progress
Version: 1.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/fanmass`

Paths below are relative to the Fanmass repository root.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `3e9414f0`.

- **Stack.** A FastAPI server with Jinja templates. The GDS UI is a Vite React SPA in `frontend/`, built into `static/gds/` (`frontend/vite.config.ts:9`) and hosted by `templates/gds_spa.html`. The legacy review tool (`templates/review.html`, styled by `static/global.css` and `static/review.css`, driven by `static/review.js`) is a server-rendered page outside the SPA.
- **Packages.** `frontend/package.json` declares the umbrella `@sovereignsquad/gds` (`:13`) and `overrides` for `gds-core`, `gds-theme` and `gds-admin` (`:35-37`), all 6.4.0 vendored `file:vendor/gds/` tarballs. The repository root has no `package.json`. `npm run build` runs `frontend/gds-verify.mjs` first, which checks version pinning only.
- **Provider and theme.** One `GdsProvider` (`frontend/src/providers.tsx:7`) with `gdsDarkPublicTheme` (`frontend/src/theme.ts:1-3`), an approved lane, and `forceColorScheme="dark"`.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is not imported; `frontend/src/main.tsx:3-4` imports the Mantine stylesheets. `gdsDarkPublicTheme` carries no `other.gdsCssVariables`, so with neither source no `--gds-*` token is defined at runtime.
- **Manifest.** `gds-adoption.json` sits at the repository root, and its paths point into `frontend/`. It declares `gdsVersion` 6.4.0 and `compliance.strictMode: true`. `migrationStatus` `gds-spa-primary` and a `lastReviewedAt` with a time part are outside `schemas/gds-adoption.schema.json`. The `requiredContracts` `GdsChart`, `MetricCard` and `ConsumerDashboardGrid` are used in no file under `frontend/src`.
- **Scan root.** `gds-compliance` scans the whole directory that holds the manifest, so its findings include the built SPA in `static/gds/` and the committed copy in `web/static/gds/`, as well as the Python virtual environment. It reads none of the Jinja templates or stylesheets ([COMPLIANCE_TOOLKIT.md, "Scanner scope"](../COMPLIANCE_TOOLKIT.md#scanner-scope)).
- **Dialogs.** Destructive and rename flows in `frontend/src/pages/` use `window.confirm` and `window.prompt`. No `GdsConfirmProvider` is mounted.

## Next steps

1. Import `@sovereignsquad/gds-theme/styles.css` once in `frontend/src/main.tsx`, in place of the direct Mantine stylesheet imports.
2. Mount `GdsConfirmProvider` and replace `window.confirm` with `useGdsConfirm`. GDS confirmation takes no text input at this version, so the rename prompts need a form rendered by the app.
3. Render `GdsChart`, `MetricCard` and `ConsumerDashboardGrid` where the manifest requires them, or remove them from `requiredContracts`. Replace `migrationStatus` with a schema value and write `lastReviewedAt` as `YYYY-MM-DD`.
4. Treat the review page as a surface outside `GdsProvider` ([INSTALLATION_GUIDE.md, "Surfaces outside GdsProvider"](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider)) until it moves into the SPA.
5. Move from vendored tarballs to the registry install and upgrade from 6.4.0.

Full fix list: `gds_fix_handover.md` at the Fanmass repository root. It is not committed to the Fanmass repository.
