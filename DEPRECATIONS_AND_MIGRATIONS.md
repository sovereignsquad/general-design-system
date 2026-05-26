# Deprecations & Migrations

Status: Active SSOT  
Version: 2.4.0  
Last updated: 2026-05-25

This document defines how `@doneisbetter/gds-*` contracts are deprecated, replaced, and removed.

## Required deprecation metadata

Every deprecated contract must declare:

- `contract`
- `replacement`
- `deprecatedIn`
- `removalTarget`
- `detectionRule`
- `migrationGuide`
- `riskLevel`

Example:

```json
{
  "contract": "LegacyPageHeader",
  "replacement": "@doneisbetter/gds-core PageHeader",
  "deprecatedIn": "2.4.0",
  "removalTarget": "2.6.0",
  "detectionRule": "deprecated-import",
  "migrationGuide": "Replace the local wrapper with @doneisbetter/gds-core PageHeader.",
  "riskLevel": "medium"
}
```

## Deprecation lifecycle

```text
active -> deprecated -> removal-ready -> removed
```

## Release expectations

- every new deprecation must be listed in `CHANGELOG.md`
- every deprecation must name a replacement
- every removal must reference the release where the deprecation first appeared
- no silent contract removals are allowed

## Consumer migration expectations

- adopt the replacement contract before the removal target release
- declare temporary local adapters and exceptions in `gds-adoption.json`
- rerun compliance checks after each migration step

## Accessibility expectations

Migration guides must call out any accessibility-impacting changes, including:

- keyboard interaction differences
- focus behavior
- semantics/ARIA changes
- reduced-motion changes
- error/loading/empty state handling

## Recovery policy

If a deprecation is introduced too early:

- mark it reversed explicitly in the next release notes
- keep deprecation history intact
- update the removal target rather than silently deleting the record
