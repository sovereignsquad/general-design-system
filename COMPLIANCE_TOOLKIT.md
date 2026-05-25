# Compliance Toolkit

Status: Active SSOT
Version: 2.5.1
Last updated: 2026-05-25

This document defines the canonical governance enforcement toolkit for GDS consumers.

## Packages

- `@gds/eslint-config` provides shared lint rules for raw design values and forbidden UI imports.
- `@gds/compliance` provides the `gds-compliance` CLI for manifest validation, adapter verification, stale-doc detection, and repo-level drift checks.

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
- forbidden UI imports such as `@radix-ui/*`, `tailwindcss`, or other configured legacy UI dependencies
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

Use this only for additive repo-local bans and legacy cleanup signals. Do not use it to carve holes in the canonical GDS ruleset.

## CI integration

Recommended consumer CI step:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

## What this toolkit does not replace

- product-specific business-rule checks
- backend/security policy scanning
- visual regression tooling

Those may exist in consumer repos, but they do not replace the canonical GDS adoption checks.
