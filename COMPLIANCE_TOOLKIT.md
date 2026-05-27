# Compliance Toolkit

Status: Active SSOT
Version: 2.6.3
Last updated: 2026-05-27

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
- stale SSOT references in docs, including legacy uppercase path references such as `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM`

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

Recommended activation order:

1. migrate to `DiscoveryShell` and governed sidebar primitives
2. migrate action stacks to `ActionBar`
3. migrate repeated discovery cards to `ListingCard`
4. migrate detail surfaces to `DetailProfileShell`
5. enable `strictMode` and keep any short-lived gaps in `approvedTemporaryExceptions`

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
