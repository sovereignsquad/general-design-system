# Try-On Adoption Status

Status: Not consuming GDS packages
Version: 1.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/try-on`

Paths below are relative to the Try-On repository root.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `804f1a45`.

- **Stack.** A Python app: FastAPI with Jinja templates for the operator pages, and Gradio for the `/try-on` and `/motogp-leather-magic` routes. The server binds to `127.0.0.1` (`app.py:2488`). There is no first-party JavaScript or TypeScript source, so no React tree can mount GDS.
- **Packages.** `package.json:9-11` declares `@sovereignsquad/gds-admin`, `gds-core` and `gds-theme` `3.9.0` as devDependencies. `pnpm-lock.yaml:11-17` resolves `@doneisbetter/gds-*` `3.4.3` instead. Nothing imports either set; the only reader is the `gds:version` script (`package.json:6`).
- **Jinja pages.** All four templates link `studio_tools/static/global.css`. Its `:root` block declares `--gds-vibe-*` custom properties with local values and aliases them into local `--color-*` names, which the component rules read.
- **Gradio routes.** Both routes take a `gr.themes.Base(...)` theme with raw hex values (`app.py:2419`) and extra CSS (`app.py:2485-2486`). They do not load `global.css`.
- **Governance.** No `gds-adoption.json`, and no GDS step in CI. `gds-compliance` reads only JavaScript and TypeScript files, so it cannot see this app's templates, stylesheet or Python theme ([COMPLIANCE_TOOLKIT.md, "Scanner scope"](../COMPLIANCE_TOOLKIT.md#scanner-scope)).

What GDS ships for this kind of app, and which contracts still apply, is stated in [INSTALLATION_GUIDE.md, "Surfaces outside GdsProvider"](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider). At this version GDS has no linkable stylesheet, no token CSS file, no static component markup and no export shaped for a Gradio theme.

## Next steps

1. Remove the `gds-admin`, `gds-core` and `gds-theme` devDependencies and the `gds:version` script: the app cannot import those packages, and the declared and locked versions disagree.
2. Meet the accessibility duties for pages outside `GdsProvider`: an accessible name and visible label for every control, a `<main>` landmark, one `<h1>` and ordered headings, `lang` on `<html>`, keyboard operation of every custom widget, the target-size floor and AA text contrast.
3. Add a root `gds-adoption.json` for a consumer that cannot import the packages ([COMPLIANCE_TOOLKIT.md, "Consumers that cannot import the packages"](../COMPLIANCE_TOOLKIT.md#consumers-that-cannot-import-the-packages)).
4. If `global.css` and the Gradio theme keep mirroring GDS token values, generate both from one source under the [runtime-constrained mirror](../ADOPTION_AND_MIGRATION_PLAYBOOK.md#runtime-constrained-mirror) profile instead of copying values by hand.
5. Scan the served routes with `runGdsAxeScan` from `@sovereignsquad/gds-a11y` in a Node test step with `@playwright/test` and `axe-core`.

Full fix list: `gds_fix_handover.md` at the Try-On repository root. It is not committed to the Try-On repository.
