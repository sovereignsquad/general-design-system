# Compliance Toolkit

Status: Active SSOT
Version: 2.6.4
Last updated: 2026-05-28

This document defines the canonical governance enforcement toolkit for GDS consumers.

## Packages

- `@doneisbetter/gds-eslint-config` provides shared lint rules for raw design values and forbidden UI imports.
- `@doneisbetter/gds-compliance` provides the `gds-compliance` CLI for manifest validation, adapter verification, stale-doc detection, and repo-level drift checks.

## Canonical command contract

```bash
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

Supported output modes:

```bash
gds-compliance check --manifest ./gds-adoption.json --format text
gds-compliance check --manifest ./gds-adoption.json --format json
```

Exit behavior:

- `0` when the manifest is valid and no compliance errors are found
- non-zero when configuration is invalid or drift is detected

## Covered rule classes

- missing required manifest fields
- invalid approved exception metadata
- missing declared adapter paths
- forbidden raw color literals outside approved theme/token files
- forbidden UI imports such as `@radix-ui/gds-*`, `tailwindcss`, or other configured legacy UI dependencies
- stale SSOT references in docs, including legacy path references to superseded local SSOT directories

## Manifest configuration

Optional compliance extensions live in `gds-adoption.json`:

```json
{
  "compliance": {
    "documentationPaths": ["README.md"],
    "staleDocumentationReferences": ["legacy-design-system"],
    "protectedSurfacePaths": ["src/gds", "src/components/public"],
    "bannedImports": ["legacy-ui-kit"]
  }
}
```

`approvedExceptions` entries must now use the canonical exception contract, not a free-form note. Each exception should declare:

- `surface`
- `category`
- narrow `scope`
- `reason`
- `allowedImplementation`
- `mustStillUse`
- `mustNotDo`
- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`
- `owner`
- `reviewDate`
- `exitCondition`
- `status`

`gds-compliance` will fail broad scopes such as `src/**` and will flag missing canonical fields as manifest drift. Use [EXCEPTION_SURFACES.md](/Users/Shared/Projects/general-design-system/EXCEPTION_SURFACES.md) and [TEMPLATES/gds-adoption.json.template](/Users/Shared/Projects/general-design-system/TEMPLATES/gds-adoption.json.template) as the normative examples.

Additional enforcement now applies for creator-authored experience exceptions:

- `category: "product-authored-experience"` must also define `a11yRequirements`, `testingRequirements`, and `observabilityRequirements`
- approved exception scopes must match at least one real repository file
- local adapters with `status: "exception"` must be covered by an approved exception scope

Theme-governance enforcement may also be declared in `gds-adoption.json`:

```json
{
  "compliance": {
    "approvedThemeLanes": [
      "gdsTheme",
      "gdsDarkPublicTheme",
      "gdsFlatSurfaceTheme",
      "gdsEditorialPublicTheme",
      "createPublicBrandTheme"
    ],
    "themeOwnershipPaths": ["src/providers.tsx", "src/theme.ts"]
  }
}
```

When those fields are present, `gds-compliance` will flag:

- direct consumer `extendGdsTheme(...)` usage
- local Mantine theme construction in declared theme-ownership files that bypasses the approved GDS lanes

For repositories targeting true GDS-only enforcement, enable strict mode:

```json
{
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"],
    "approvedTemporaryExceptions": ["MapPanel"]
  }
}
```

Strict mode adds hard failures for:
- local Mantine `AppShell` wrappers
- local shell/detail/listing/action adapters that are not approved or explicitly excepted
- legacy local button-wrapper patterns that bypass the canonical semantic action system

For the official reference site, strict mode should also be treated as the baseline expectation, not an optional maturity step. `apps/playground` is the canonical proof that docs, demos, and theme exploration can be delivered through GDS-owned contracts.

Recommended activation order:

1. migrate to `DiscoveryShell` and governed sidebar primitives
2. migrate action stacks to `ActionBar`
3. migrate repeated discovery cards to `ListingCard`
4. migrate detail surfaces to `DetailProfileShell`
5. enable `strictMode` and keep any short-lived gaps in `approvedTemporaryExceptions`
6. add `approvedThemeLanes` and `themeOwnershipPaths` once provider/theme files are stable so custom branding-layer drift becomes measurable

Reference review input for migration teams:

- SSOT policy: [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md)
- live pattern site: `https://sovereignsquad.github.io/general-design-system/patterns`

The compliance toolkit does not replace design review. It enforces the declared contract after teams have confirmed the shipped surface inventory.

Use this only for additive repo-local bans and legacy cleanup signals. Do not use it to carve holes in the canonical GDS ruleset.

## CI integration

Recommended consumer CI step:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

If the repo uses the reference codemods during migration, run them in dry-run mode in PRs before switching to strict mode:

```bash
node scripts/codemods/run-codemod.mjs discovery-shell ./src
node scripts/codemods/run-codemod.mjs action-bar ./src
node scripts/codemods/run-codemod.mjs listing-card ./src
```

## What this toolkit does not replace

- product-specific business-rule checks
- backend/security policy scanning
- visual regression tooling

Those may exist in consumer repos, but they do not replace the canonical GDS adoption checks.
