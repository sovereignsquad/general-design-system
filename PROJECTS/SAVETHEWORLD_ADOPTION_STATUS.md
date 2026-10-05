# Save The World Adoption Status

Status: In progress
Version: 2.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/savetheworld`

Paths below are relative to the Save The World repository root.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `052ef84e`.

- **Adopted.** The app moved onto GDS in `ae48495` ("Migrate the entire app onto the General Design System (GDS)", 2026-08-25). GDS lint and compliance tooling followed in `411b0c8` (2026-08-25). No Tailwind dependency remains.
- **Packages.** `gds-core`, `gds-theme` and `gds-admin` (`package.json:24-26`) and `gds-compliance`, `gds-eslint-config` (`:36-37`), all 6.3.0 vendored `file:vendor/gds/` tarballs.
- **Stack.** Next.js App Router with Mantine 8.
- **Provider.** One `GdsProvider` in `src/components/gds/SaveTheWorldGdsProvider.tsx`, mounted from `src/app/providers.tsx`.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is imported once, before app CSS (`src/app/layout.tsx:9`).
- **Theme.** `GdsProvider` receives `BRAND_THEME`, a hand-built Mantine theme object (`src/components/gds/theme/brandTheme.ts:109`). That is not an approved lane ([THEME_GOVERNANCE.md](../THEME_GOVERNANCE.md)): a bare Mantine object replaces `gdsTheme` instead of extending it. `createBrandTheme` is called (`:87`) only for its CSS variables, and its `mantineTheme` is discarded.
- **Primary colour.** `primaryColor` `coral` with `primaryShade` 4 (`brandTheme.ts:113,120`). The filled primary button's label fails WCAG AA text contrast (computed from the theme values in the audit, not measured in a browser). No GDS check covers a consumer theme's filled primary label at this version.
- **Local adapters.** UI reaches GDS through local barrels in `src/components/gds/`. `PublicPrimitives.tsx` re-exports `@mantine/core` components under a GDS-looking path, which [DEPENDENCY_GOVERNANCE.md, "Direct `@mantine/core` imports"](../DEPENDENCY_GOVERNANCE.md#direct-mantinecore-imports) treats as a local adapter.
- **Manifest.** `gds-adoption.json` declares `gdsVersion` 6.3.0 and `migrationStatus` `direct-consumption-in-progress`, which is not a value in `schemas/gds-adoption.schema.json`. `compliance.strictMode` is absent. `compliance.scopedBannedImports` is not a schema field and `gds-compliance` does not read it, so the declared `@mantine/core` boundary for admin surfaces is not enforced by GDS tooling.

## Next steps

1. Pass `GdsProvider` a theme built by an approved lane instead of the hand-built object. `createBrandTheme(...)` returns a `mantineTheme` that already carries the brand's `--gds-*` role map as `other.gdsCssVariables`.
2. Choose a primary shade and label pairing that passes WCAG AA, and verify it in the rendered page.
3. Replace `migrationStatus` with a schema value and set `compliance.strictMode: true`. Strict mode reports direct `@mantine/core` imports; `scopedBannedImports` has no effect.
4. Point admin and boundary files at GDS exports instead of `PublicPrimitives.tsx` wherever GDS re-exports the component.
5. Move from vendored tarballs to the registry install and upgrade from 6.3.0.

Full fix list: `gds_fix_handover.md` at the Save The World repository root. It is not committed to the Save The World repository.
