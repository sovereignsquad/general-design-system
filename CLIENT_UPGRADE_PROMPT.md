# Client Upgrade Prompt (2.6.6)

## What this is

Use this for every product team when migrating to the 2.6.6 GDS consumer contract.

## Copy/paste message

Team, we completed the GDS upgrade to the 2.6.6 governance baseline.

- Update dependencies:
  - `@doneisbetter/gds@2.6.6`
  - `@doneisbetter/gds-eslint-config@2.6.6` (dev)
  - `@doneisbetter/gds-compliance@2.6.6` (dev)
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
