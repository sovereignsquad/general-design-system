# Deprecations & Migrations

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

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

## Root setup

### `GdsProvider` without the GDS stylesheet (3.8.0)

- `contract`: a React root that mounts `GdsProvider` without importing `@sovereignsquad/gds-theme/styles.css`. This includes roots that import `@mantine/core/styles.css` or `@mantine/notifications/styles.css` in its place, and roots that load a hand-copied fork of the stylesheet
- `replacement`: one `import '@sovereignsquad/gds-theme/styles.css'` in the app entry, before app styles, plus `@sovereignsquad/gds-theme/dates.css` when a GDS date component renders. See [`INSTALLATION_GUIDE.md` → Root runtime setup](INSTALLATION_GUIDE.md#3-root-runtime-setup)
- `deprecatedIn`: 3.8.0, when the import became documented as mandatory. Since 3.14.9 the default semantic-role layer is defined only in the stylesheet, so a root without it also lacks those role defaults
- `removalTarget`: none. No code is removed; a root without the stylesheet is unsupported on every release since 3.8.0
- `detectionRule`: none automated at this version. `GdsProvider` emits no warning and `gds-compliance check` has no rule for a missing import. Detect it with the load check in [`INSTALLATION_GUIDE.md` → Stylesheet troubleshooting](INSTALLATION_GUIDE.md#stylesheet-troubleshooting), or by searching the app source for the import
- `migrationGuide`:
  1. add the import to the entry file (`app/layout`, `pages/_app` or `main.tsx`)
  2. delete direct imports of `@mantine/core/styles.css` and `@mantine/notifications/styles.css`; the stylesheet `@import`s both
  3. delete any hand-copied fork of the stylesheet, together with any font `@import` it carries
  4. run the load check against a production build

  Accessibility: adding the stylesheet restores the global `:focus-visible` rules, the `forced-colors` and `prefers-reduced-motion` rules and the opaque overlay surfaces. Rendered output changes across the app, so re-run keyboard-focus, forced-colors and contrast checks after migrating
- `riskLevel`: high (a root without the stylesheet has no GDS focus indicators, forced-colors support, reduced-motion overrides or opaque overlays; adding it changes rendered output app-wide)

## API deprecations

### `GdsPageTemplateAction.pending` renamed to `loading` (3.13.0)

- `contract`: `GdsPageTemplateAction.pending` (`@sovereignsquad/gds-core`)
- `replacement`: `GdsPageTemplateAction.loading`, with the same behavior
- `deprecatedIn`: 3.13.0
- `removalTarget`: a future major; no version is set. The TSDoc on `pending` in `packages/gds-core/src/GdsPageTemplates.tsx` states the intent
- `detectionRule`: the `@deprecated` TSDoc tag on the property, and a one-time development-only console warning (`gdsDevWarnOnce` key `GdsPageTemplateAction:pending-deprecated`) when `pending` is set without `loading`. No lint or compliance rule
- `migrationGuide`: rename `pending` to `loading` on every page-template action. When both are set, `loading` wins. The busy state renders the same either way, so there is no accessibility change
- `riskLevel`: low

### `gdsBadgeAccentColors` and `gdsBadgeAccentShades` derived from the accent axis (6.1.0)

- `contract`: the `gdsBadgeAccentColors` and `gdsBadgeAccentShades` exports of `@sovereignsquad/gds-core`
- `replacement`: the `--gds-accent-<name>-<shade>` custom properties (`base` for the `gdsBadgeAccentColors` value), read with `var()`
- `deprecatedIn`: 6.1.0
- `removalTarget`: 8.0.0, as stated in the TSDoc on both exports in `packages/gds-core/src/GdsBadge.tsx`
- `detectionRule`: the `@deprecated` TSDoc tag on both exports. No lint or compliance rule
- `migrationGuide`: replace each lookup with `var(--gds-accent-<name>-<shade>)`. The exports hold values resolved once for the light scheme (`resolveGdsAccentTokens(undefined, 'light')`), so they do not follow the active theme; the custom properties do. Accessibility: re-run contrast checks on badge and pin compositions after migrating, because the rendered values now change with the theme
- `riskLevel`: low

## Registry deprecations

Beyond code contracts, a distribution channel can be deprecated.

### npmjs.com `@sovereignsquad` packages (frozen at `3.9.0`)

- `contract`: the `@sovereignsquad` packages published on **npmjs.com** at `3.9.0`: `gds`, `gds-core`, `gds-theme`, `gds-admin`, `gds-a11y`, `gds-compliance` and `gds-eslint-config`
- `replacement`: the same packages on **GitHub Packages** (`https://npm.pkg.github.com`) at the current release, with `@sovereignsquad/gds` as the recommended umbrella
- `deprecatedIn`: 4.0.0, by GDS policy and documentation. Registry state: as of 2026-10-01 none of the seven `3.9.0` listings is marked deprecated on npmjs; `npm view @sovereignsquad/<package>@3.9.0 deprecated --@sovereignsquad:registry=https://registry.npmjs.org` printed nothing for each. Marking them is the maintainer step in [`RELEASE_PUBLISH.md`](RELEASE_PUBLISH.md#deprecating-the-legacy-npmjs-packages); update this line with the date and output when it runs
- `removalTarget`: **none — not unpublished.** The `3.9.0` listings stay resolvable so existing consumers are not broken; they are frozen and receive no updates
- `detectionRule`: a resolved `@sovereignsquad/*@3.9.0` from `registry.npmjs.org`
- `migrationGuide`: [`INSTALLATION_GUIDE.md` → Migrating from the legacy npmjs 3.9.0 packages](INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages). Name changes between `3.9.0` and the current release are listed in [3.9.0 to current](#390-to-current)
- `riskLevel`: low (installs keep working during migration)

### npmjs.com `@doneisbetter` packages (superseded by the `@sovereignsquad` scope)

- `contract`: the `@doneisbetter` packages on **npmjs.com**: `gds`, `gds-core`, `gds-theme`, `gds-admin`, `gds-a11y`, `gds-compliance` and `gds-eslint-config`, with `latest` at `3.8.0`
- `replacement`: the same packages under `@sovereignsquad` on **GitHub Packages** at the current release
- `deprecatedIn`: 3.9.0, the scope rename ([`MIGRATION_TO_SOVEREIGNSQUAD.md`](MIGRATION_TO_SOVEREIGNSQUAD.md)). Registry state: as of 2026-10-01 no version of the seven packages is marked deprecated on npmjs. Marking them is the maintainer step in [`RELEASE_PUBLISH.md`](RELEASE_PUBLISH.md#deprecating-the-legacy-npmjs-packages); update this line with the date and output when it runs
- `removalTarget`: **none — not unpublished.** Existing installs keep resolving
- `detectionRule`: a resolved `@doneisbetter/*` package in the lockfile or `node_modules`
- `migrationGuide`: rename imports with the package mapping in [`MIGRATION_TO_SOVEREIGNSQUAD.md`](MIGRATION_TO_SOVEREIGNSQUAD.md), then follow [`INSTALLATION_GUIDE.md` → Migrating from the legacy npmjs 3.9.0 packages](INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages) to the current release on GitHub Packages. Regenerate the lockfile so the declared, locked and installed scopes agree
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

## Brand-lane token renames

### `class-usa` re-based onto its v2 palette; `ClassUsaColorRampName` and `classUsa*` Mantine keys renamed (6.0.0)

- `contract`: `ClassUsaColorRampName = 'navy' | 'terracotta' | 'sage' | 'cream' | 'slate'`; the corresponding Mantine `colors` keys `classUsaNavy`, `classUsaTerracotta`, `classUsaSage`, `classUsaCream`, `classUsaSlate`; and every color value `deriveClassUsaSemanticTokens`/`classUsaSemanticCssVariables` emitted from the old five-ramp palette (navy `#0b223e`, action-orange `#d63900`, badge/border/text values built from `terracotta`/`sage`)
- `replacement`: six role-named ramps — `ClassUsaColorRampName = 'navy' | 'brand' | 'action' | 'trust' | 'cream' | 'slate'` — with matching Mantine keys `classUsaNavy`, `classUsaBrand`, `classUsaAction`, `classUsaTrust`, `classUsaCream`, `classUsaSlate`. No aliases retained for the old ramp names or values. `Button.defaultProps.color` is now `classUsaAction` (was implicitly navy via `primaryColor`); `primaryColor` itself stays `classUsaNavy` for chrome. Old-to-new anchor mapping: navy `#0b223e` → `#0f2c4a`; the single old accent (`#ff6b35` terracotta) splits into two brand-governed oranges — `#c24a0a` (action, the only one that carries text/a label — buttons, links, focus ring) and `#f5793b` (brand, fill-only decorative — never under text); `#90a287` (sage) → `#4f8a5b` (trust, source/freshness signal only)
- `deprecatedIn`: 6.0.0 (renamed immediately — this is a palette re-base, not a grace-period deprecation)
- `removalTarget`: 6.0.0 (already removed as of this release)
- `detectionRule`: a build/type error on `colorRamps: { terracotta: ..., sage: ... }` passed to `createBrandTheme('class-usa', { colorRamps: {...} })`, or a Mantine `colors.classUsaTerracotta`/`colors.classUsaSage` reference, after upgrading to 6.0.0
- `migrationGuide`: replace any `colorRamps` override keys `terracotta`/`sage` with `brand`/`action`/`trust` (see `brand-requests/class-usa/class-usa-v2-token-spec.md` for the full six-ramp default and the anchor-to-role mapping); replace any direct `classUsaTerracotta`/`classUsaSage` Mantine color references with `classUsaBrand`/`classUsaAction`/`classUsaTrust` as appropriate to the use (fill vs. label vs. source-signal); if you read `--gds-brand-primary`/`--gds-text-body`/`--gds-border-card` etc. directly, re-verify against the new hex values rather than assuming an unchanged palette. Rationale: the previous palette declared unloadable fonts (Bogart/Garet) and a single accent color reused for both label-bearing and fill-only roles across both color schemes, which is the exact failure mode behind issues #533/#534 — see issue 536
- `riskLevel`: high (a real breaking change to a public type, five Mantine color keys, and every emitted class-usa hex value; any consumer styling directly against the old palette needs to re-verify, not just recompile)

## 3.9.0 to current

The names an app on `3.9.0` changes when it moves to the current release. Install-path steps (registry, `.npmrc`, CI token) and behavior changes are in [`INSTALLATION_GUIDE.md` → Migrating from the legacy npmjs 3.9.0 packages](INSTALLATION_GUIDE.md#migrating-from-the-legacy-npmjs-390-packages).

| Change | Before | After | Release | Record |
|---|---|---|---|---|
| Package scope | `@doneisbetter/*` (up to `3.8.0`) | `@sovereignsquad/*` | 3.9.0 | [`@doneisbetter` record](#npmjscom-doneisbetter-packages-superseded-by-the-sovereignsquad-scope) |
| Registry | npmjs.com `3.9.0` snapshot | GitHub Packages | 4.0.0 | [npmjs record](#npmjscom-sovereignsquad-packages-frozen-at-390) |
| Peer dependencies | `@mantine/dates` and `dayjs` not declared | `@mantine/dates` and `dayjs` are peers of `@sovereignsquad/gds` and `@sovereignsquad/gds-core` | 3.12.0 | [`INSTALLATION_GUIDE.md` → Peer dependencies](INSTALLATION_GUIDE.md#peer-dependencies) |
| Prop, alias kept | `GdsPageTemplateAction.pending` | `GdsPageTemplateAction.loading` | 3.13.0 | [record](#gdspagetemplateactionpending-renamed-to-loading-3130) |
| Export subpath | `ReferenceThemeExplorer`, `ThemeExplorerSelection`, `ThemePresetId`, `ThemeSchemeId` from `@sovereignsquad/gds-core` and `@sovereignsquad/gds-core/client` | `@sovereignsquad/gds-core/reference-theme-explorer` | 5.0.0 | [record](#referencethemeexplorer-moved-to-a-dedicated-subpath-500) |
| Type members and Mantine color keys | `ClassUsaColorRampName` `'terracotta'`, `'sage'`; `classUsaTerracotta`, `classUsaSage` | `'brand'`, `'action'`, `'trust'`; `classUsaBrand`, `classUsaAction`, `classUsaTrust` | 6.0.0 | [record](#class-usa-re-based-onto-its-v2-palette-classusacolorrampname-and-classusa-mantine-keys-renamed-600) |
| Exports, deprecated and still present | `gdsBadgeAccentColors`, `gdsBadgeAccentShades` | `var(--gds-accent-<name>-<shade>)` | 6.1.0 | [record](#gdsbadgeaccentcolors-and-gdsbadgeaccentshades-derived-from-the-accent-axis-610) |

Removed names, measured between the tags `gds-v3.9.0` and `gds-v6.7.0`: listing the exports of the root, `/client` and `/server` entries of `@sovereignsquad/gds`, `gds-core`, `gds-theme` and `gds-admin` with the TypeScript checker at both tags, the four `ReferenceThemeExplorer` names above are the only export names removed. Comparing the `exports` maps of the seven packages' `package.json` files at both tags, no subpath was removed. Releases after `6.7.0` record their changes as entries in this document.
