# Client Upgrade Prompt

## What this is

Use this for every product team migrating to the current stable `3.4.1` GDS adoption-platform release.

## Copy/paste message for 3.4.1 after publish verification

Team, we completed the GDS upgrade to the 3.4.1 adoption platform release.

- Update dependencies:
  - `@doneisbetter/gds@3.4.1`
  - `@doneisbetter/gds-eslint-config@3.4.1` (dev)
  - `@doneisbetter/gds-compliance@3.4.1` (dev)
- If you use granular packages, keep every GDS package on the same version:
  - `@doneisbetter/gds-theme@3.4.1`
  - `@doneisbetter/gds-core@3.4.1`
  - `@doneisbetter/gds-admin@3.4.1`
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
