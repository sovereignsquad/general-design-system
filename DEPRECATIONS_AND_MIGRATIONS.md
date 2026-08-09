# Deprecations & Migrations

Status: Active SSOT  
Version: 5.0.2
Last updated: 2026-08-08

This document defines how `@sovereignsquad/gds-*` contracts are deprecated, replaced, and removed.

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
  "replacement": "@sovereignsquad/gds-core PageHeader",
  "deprecatedIn": "2.4.0",
  "removalTarget": "2.6.0",
  "detectionRule": "deprecated-import",
  "migrationGuide": "Replace the local wrapper with @sovereignsquad/gds-core PageHeader.",
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

## Registry deprecations

Beyond code contracts, a distribution channel can be deprecated.

### npmjs.com `@sovereignsquad` packages (frozen at `3.9.0`)

- `contract`: `@sovereignsquad/gds`, `@sovereignsquad/gds-core`, `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-admin` published on **npmjs.com** at `3.9.0`
- `replacement`: the same packages on **GitHub Packages** (`https://npm.pkg.github.com`) at the current release, with `@sovereignsquad/gds` as the recommended umbrella
- `deprecatedIn`: 4.0.0 (documentation); npmjs listings marked via `npm deprecate` — see [`RELEASE_PUBLISH.md`](RELEASE_PUBLISH.md#deprecating-the-legacy-npmjs-390-packages)
- `removalTarget`: **none — not unpublished.** The `3.9.0` listings stay resolvable so existing consumers are not broken; they are frozen and receive no updates
- `detectionRule`: a resolved `@sovereignsquad/*@3.9.0` from `registry.npmjs.org`
- `migrationGuide`: [`INSTALLATION_GUIDE.md` → Migrating from the legacy npmjs 3.9.0 packages](INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages). The exports the `3.9.0` line exposed (e.g. `OverlayManagerProvider`, `useOverlayManager`, `DiscoveryShell`, `SidebarNavItem`) remain available at the current release
- `riskLevel`: low (installs keep working during migration)

## Component-export relocations

Beyond deprecate-then-remove, a component can be *relocated* to a dedicated
subpath while keeping its name and behavior unchanged — this is the pattern
already used for `GdsRichTextEditor` (`@sovereignsquad/gds-core/rich-text-editor`)
so bundlers that group a whole package by file path don't force its
dependency cost onto consumers who never render it.

### `ReferenceThemeExplorer` moved to a dedicated subpath (5.0.0)

- `contract`: `ReferenceThemeExplorer` (and its `ThemeExplorerSelection`,
  `ThemePresetId`, `ThemeSchemeId` types) importable from the main
  `@sovereignsquad/gds-core` / `@sovereignsquad/gds-core/client` barrels
- `replacement`: `import { ReferenceThemeExplorer } from '@sovereignsquad/gds-core/reference-theme-explorer'` — same component, same props, same behavior, new import path only
- `deprecatedIn`: 5.0.0 (removed from the main barrel immediately — this is a relocation, not a grace-period deprecation, matching the `rich-text-editor` precedent)
- `removalTarget`: 5.0.0 (already removed from the main barrel as of this release)
- `detectionRule`: a build/type error on `import { ReferenceThemeExplorer } from '@sovereignsquad/gds-core'` (or `./client`) after upgrading to 5.0.0
- `migrationGuide`: change the import source only — `import { ReferenceThemeExplorer } from '@sovereignsquad/gds-core/reference-theme-explorer'`. No prop or behavior changes. Rationale: it was gds-core's single largest client-bundle module (~112.7 kB) and every real consumer renders it on one or two specific routes, not universally — see issue #532
- `riskLevel`: medium (a real breaking change for any consumer importing it from the main package path; caught and fixed with a single import-line change, not a rewrite)
