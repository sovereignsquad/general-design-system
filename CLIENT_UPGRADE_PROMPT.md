# Client Upgrade Prompt

## What this is

Use this for every product team when migrating to the current stable `2.6.7` GDS consumer contract or preparing the `3.0.0` adoption-platform release.

## Copy/paste message for 3.0.0 after publish verification

Team, we completed the GDS upgrade to the 3.0.0 adoption platform release.

- Update dependencies:
  - `@doneisbetter/gds@3.0.0`
  - `@doneisbetter/gds-eslint-config@3.0.0` (dev)
  - `@doneisbetter/gds-compliance@3.0.0` (dev)
- If you use granular packages, keep every GDS package on the same version:
  - `@doneisbetter/gds-theme@3.0.0`
  - `@doneisbetter/gds-core@3.0.0`
  - `@doneisbetter/gds-admin@3.0.0`
- Install Mantine peers normally; do not force peer resolution.
- Keep the App Router split:
  - `app/layout.tsx` owns `ColorSchemeScript`
  - `app/providers.tsx` is the only client boundary mounting `GdsProvider`
- Replace local mirror/theme wrappers with approved GDS lanes:
  - `gdsTheme`
  - `gdsDarkPublicTheme`
  - `gdsFlatSurfaceTheme`
  - `gdsEditorialPublicTheme`
  - `createPublicBrandTheme(...)`
- Remove `extendGdsTheme(...)` from consumer-owned code paths.
- Replace local shell/navigation/action/card/detail wrappers with shipped GDS primitives.
- Run:
  - `npm run build`
  - `npm run test:run`
  - `gds-compliance check --manifest ./gds-adoption.json`

Do not start this migration until the GDS release owner confirms `npm run verify:published` passed for all six packages.

## Copy/paste message for current stable 2.6.7

Team, we completed the GDS upgrade to the 2.6.7 governance baseline.

- Update dependencies:
  - `@doneisbetter/gds@2.6.7`
  - `@doneisbetter/gds-eslint-config@2.6.7` (dev)
  - `@doneisbetter/gds-compliance@2.6.7` (dev)
- Replace local mirror/theme wrappers with approved GDS lanes:
  - `gdsTheme`
  - `gdsDarkPublicTheme`
  - `gdsFlatSurfaceTheme`
  - `gdsEditorialPublicTheme`
  - `createPublicBrandTheme(...)`
- Remove `extendGdsTheme(...)` from consumer-owned code paths.
- Ensure theme ownership fields exist in `gds-adoption.json`:
  - `compliance.approvedThemeLanes`
  - `compliance.themeOwnershipPaths`
- Replace local wrappers in these priority lanes:
  - `DiscoveryShell`
  - `SidebarNav`
  - `PageHeader`
  - `ActionBar`
  - `ListingCard`
  - `DataToolbar` / `FilterDrawer`
  - `DetailProfileShell`
- Add or refresh `gds-adoption.json` and run:
  - `npm run build`
  - `npm run test:run`
  - `npm run verify:mantine`
  - `gds-compliance check --manifest ./gds-adoption.json`

### References

- Install and migration docs: https://sovereignsquad.github.io/general-design-system/install
- Governance and strict-mode rules: https://sovereignsquad.github.io/general-design-system/governance
- Pattern coverage and runtime examples: https://sovereignsquad.github.io/general-design-system/patterns
- Theme governance reference: https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md

### When an issue appears

- If migration fails, keep `strictMode` false until the exception is resolved.
- Add a narrow exception in `gds-adoption.json` with a clear owner/review date/exit condition.
- Remove the exception as soon as the canonical surface is adopted.
