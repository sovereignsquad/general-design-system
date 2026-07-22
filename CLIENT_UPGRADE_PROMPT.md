# Client Upgrade Prompt

## What this is

Use this for every product team migrating to the current stable `3.10.0` GDS adoption-platform release.

## Copy/paste message for 3.10.0 after publish verification

Team, we completed the GDS upgrade to the 3.10.0 adoption platform release.

- GDS installs exclusively from GitHub Packages — if your `.npmrc` doesn't already have it, add:
  ```ini
  @sovereignsquad:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  ```
  (`GITHUB_TOKEN` is your own personal access token with `read:packages` scope — GitHub Packages requires authentication for every install, even public ones.)
- Update dependencies:
  - `@sovereignsquad/gds@3.10.0`
  - `@sovereignsquad/gds-eslint-config@3.10.0` (dev)
  - `@sovereignsquad/gds-compliance@3.10.0` (dev)
- If you use granular packages, keep every GDS package on the same version:
  - `@sovereignsquad/gds-theme@3.10.0`
  - `@sovereignsquad/gds-core@3.10.0`
  - `@sovereignsquad/gds-admin@3.10.0`
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

### References

- Install and migration docs: https://sovereignsquad.github.io/general-design-system/install
- Governance and strict-mode rules: https://sovereignsquad.github.io/general-design-system/governance
- Pattern coverage and runtime examples: https://sovereignsquad.github.io/general-design-system/patterns
- Theme governance reference: https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md

### When an issue appears

- If migration fails, keep `strictMode` false until the exception is resolved.
- Add a narrow exception in `gds-adoption.json` with a clear owner/review date/exit condition.
- Remove the exception as soon as the canonical surface is adopted.
