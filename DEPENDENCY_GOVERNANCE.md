# Dependency Governance

Status: Active SSOT
Version: 6.8.0
Last updated: 2026-10-01

GDS is dependency-governed, not dependency-free. React, Mantine, and Tabler are accepted only behind GDS-owned contracts, release gates, and exception lifecycle rules.

## Dependency Classes

| Class | Packages | Public authority | Consumer rule |
|---|---|---|---|
| Platform | `react`, `react-dom` | Required React runtime foundation | Consumers install compatible peers directly |
| Primitive engine | `@mantine/core`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications`, `@mantine/dates`, `dayjs` | GDS implementation engine for accessible primitives, overlays, forms, layout, theme runtime, and date/time input | Consumers use GDS exports, including the sanctioned passthroughs. A direct `@mantine/core` import is off-governance in every consumer and needs an approved exception; tooling enforces this only in part (see [Mantine boundary](#mantine-boundary)). `@mantine/dates` and `dayjs` are peer dependencies (not regular dependencies) like the rest of this class, since `@mantine/dates` shares the same single-Mantine-instance context requirement as `@mantine/core`, and `dayjs` must be a single shared instance across the host app for locale/plugin configuration to apply consistently |
| Asset | `@tabler/icons-react` | Internal icon source behind semantic GDS icon APIs | Consumers use `GdsIcon`, `GdsIcons`, or semantic actions instead of direct Tabler imports |
| Interaction engine | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Internal pointer/touch/keyboard drag-and-drop engine for `KanbanBoard`'s opt-in `enableDrag` interaction | Fully encapsulated inside `KanbanBoard.client.tsx` — never a public GDS export or a consumer-facing import; no dependency-boundary exception applies since consumers have no legitimate direct-import path to gate |
| Content engine | `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit` | Internal rich-text editing engine for `GdsRichTextEditor` | Fully encapsulated inside `GdsRichTextEditor.client.tsx` — never a public GDS export or a consumer-facing import; consumers get/set HTML strings through `GdsRichTextEditor`'s props only, never Tiptap's `Editor`/extension APIs directly |
| Tooling | `eslint`, `typescript`, `vite`, `vitest`, `tsup`, compatibility/audit tooling | Build, validation, docs, and compliance only | Tooling does not become runtime UI authority |

## Replacement Triggers

A dependency replacement or package-native rewrite is justified only when at least one trigger is concrete and documented:

- unresolved production accessibility defect
- unsupported React/Mantine compatibility line
- security advisory affecting production runtime with no acceptable mitigation
- unacceptable bundle or performance cost measured in a release report
- abandoned dependency or incompatible license change
- repeated governance exceptions proving a missing GDS contract

Preference alone is not a replacement trigger.

## Public API Boundary

Consumers build against GDS exports. API reference entries classify each export by:

- `canonical`: stable product-facing GDS contract
- `support-api`: helper, hook, registry, or utility that supports a canonical contract
- `compatibility`: retained migration surface with preferred replacement guidance
- `internal-risk`: published but not recommended as product UI authority

Dependency boundaries are also classified:

- `gds-contract`
- `mantine-backed`
- `tabler-backed`
- `tooling`

## Import Boundary

`@mantine/core` follows [Mantine boundary](#mantine-boundary), which applies to every consumer.

Strict consumers may not import the other dependency UI packages directly in protected surfaces:

- `@mantine/hooks`
- `@mantine/notifications`
- `@mantine/dates`
- `@tabler/icons-react`

Allowed direct usage must be narrow, reviewed, and represented as a `dependency-boundary` exception in `gds-adoption.json`.

Tooling covers less than this rule. The built-in `gds-compliance` checks cover only `@mantine/core` and `@tabler/icons-react` imports, and only when `compliance.strictMode` is `true`. Other packages are checked only when a consumer lists them in `compliance.bannedImports`. Scanner scope: [COMPLIANCE_TOOLKIT.md, "Scanner scope"](COMPLIANCE_TOOLKIT.md#scanner-scope).

## Mantine boundary

This section is the canonical rule for using Mantine components in a consumer. Other documents link here.

### Sanctioned passthroughs

`packages/gds-core/src/GdsPrimitives.tsx` re-exports a fixed set of `@mantine/core` components, and their `*Props` types, unchanged. Those names are GDS exports. The file is the list; this document does not copy it.

- Import them from `@sovereignsquad/gds` or `@sovereignsquad/gds-core`, root or `/client` entry, never from `@mantine/core`. Type-only imports (`SelectProps` and the other `*Props` types) come from the same entry.
- Use the root or `/client` entry from client components. The `/server` entry also re-exports the passthroughs; this document does not designate `/server` for interactive passthroughs such as `Modal`, `Tabs` or `Select`.
- A passthrough has Mantine's behaviour only. Where a GDS component carries a contract for the same job, use it:
  - `SemanticButton` rather than `Button` for an action with a vocabulary entry (its label resolves from the semantic `action` id)
  - `InlineAlert` rather than a hand-built alert (`role="alert"` for errors, `role="status"` otherwise, live region from `getGdsNotificationLivePolicy`)
  - `FormField` to give an input its label, description and error text
  - `SearchableSelect` (`@sovereignsquad/gds-core`) or `AdminSelect` (`@sovereignsquad/gds-admin`) as the governed selects; the `Select` and `MultiSelect` passthroughs stay allowed
  - `SidebarNavItem` (sets `aria-current="page"` when `active`) or `SemanticNavLink` (`@sovereignsquad/gds-admin`) for navigation links
- The passthrough set changes only through a [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md) entry. Removing a name is a breaking change ([docs/PUBLIC_TYPE_BOUNDARY.md](docs/PUBLIC_TYPE_BOUNDARY.md)).

### Mantine style props

Mantine style props (`c`, `p*`, `m*`, `variant`, `color`, `size`, `radius` and the rest) work on the passthroughs, because the passthroughs are Mantine components. GDS-owned components accept only the props their own types declare; for example, the typography roles take no `c`, `size`, `truncate` or `lineClamp`. Using a style prop is not permission to import `@mantine/core`.

### Direct `@mantine/core` imports

A direct `@mantine/core` import is off-governance in every consumer, whatever `compliance.strictMode` is. Each one needs an approved exception in `gds-adoption.json`: `dependency-boundary` for a reviewed direct dependency (contract below), or `package-coverage-gap` where the replacement table lists no GDS export.

A consumer-side barrel that re-exports `@mantine/core` components under a GDS-looking path (for example `components/gds/Primitives.tsx`) is a local adapter, not a GDS entry. Declare it in `localAdapters` and point every name GDS re-exports at the GDS entry instead.

Enforcement at this version:

- `gds-compliance check` reports `strict.import.mantine-core` only when `compliance.strictMode` is `true`. It matches `from '@mantine/core'` statements (named, type-only and re-export forms). It does not match side-effect imports, `require()` or dynamic `import()`, and it skips files under `packages/gds-core/`, `packages/gds-admin/` and `packages/gds-theme/`.
- Under strict mode an exception suppresses the finding only when its `status` is `approved` or `temporary` (`getSuppressionDecision` in `packages/gds-compliance/index.js`). A `dependency-boundary` exception in status `active` or `removing` does not.
- Under strict mode, `strict.local-gds-adapter` reports any scanned file whose path contains `components/gds/` and that is not declared in `localAdapters`.
- In any mode, listing `@mantine/core` in `compliance.bannedImports` makes `gds-compliance` report each direct import statement as `forbidden-import`. An exception's `dependency` or `allowImports` entry exempts that specifier in every file, not only inside the exception's `scope`.
- `@sovereignsquad/gds-eslint-config` does not cover `@mantine/core`. `gds/no-forbidden-ui-imports` checks the fixed `DEFAULT_FORBIDDEN_IMPORTS` list in `packages/gds-eslint-config/index.js`, and the config has no option to add a specifier.
- Without `strictMode` or that `bannedImports` entry, a direct `@mantine/core` import produces no tool signal.

Scope: this rule covers `@mantine/core` component imports. Mantine stylesheets are a separate rule: `@sovereignsquad/gds-theme/styles.css` already imports Mantine's core and notifications sheets, so a consumer does not import them directly ([INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md), section 3). The other Mantine packages follow [Import Boundary](#import-boundary).

### Replacements for names GDS does not re-export

| `@mantine/core` name | GDS export | Notes |
|---|---|---|
| `Alert` | `InlineAlert` | Live-region role and `aria-live` from `getGdsNotificationLivePolicy`. |
| `AspectRatio` | `GdsMediaFrame` (`aspectRatio` token), `MediaWithFallback` (`ratio`) | |
| `Avatar` | `GdsGeneratedAvatar` | Initials mark derived from `name`; it renders no photo. Exported from the root entries only (`@sovereignsquad/gds`, `@sovereignsquad/gds-core`). No photo avatar export exists. |
| `Burger` | No standalone export | `DiscoveryShell` and `DocsShell` render their own labelled navigation toggle. |
| `Card` | `ListingCard`, `SectionPanel`, `InfoCard` (`@sovereignsquad/gds-admin`) | |
| `ColorSchemeScript` | No GDS export | The Next.js layout in [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) imports it from `@mantine/core`. Under `strictMode` that file reports `strict.import.mantine-core` unless an exception covers it. |
| `Drawer` | `GdsDrawer`, `AdminDetailDrawer` (`@sovereignsquad/gds-admin`) | `GdsDrawer` throws outside an `OverlayManagerProvider`. |
| `FileInput` | `MediaField`, `UploadDropzone`, `AdminFileUpload` (`@sovereignsquad/gds-admin`) | |
| `Grid` | `GdsGrid`, or the `SimpleGrid` passthrough | |
| `Image` | `MediaWithFallback`, `GdsMediaFrame` | `MediaWithFallback` requires `alt` and renders a fallback when the image fails. |
| `NavLink` | `SidebarNavItem`, `SemanticNavLink` (`@sovereignsquad/gds-admin`) | |
| `Paper` | `SectionPanel` | |
| `Skeleton` | No GDS export | `StateBlock` with `variant="loading"` covers a loading state; `MediaWithFallback` shows a shimmer while its image loads. |
| `Text` | `BodyText`, `MetadataText`, `LabelText`, `InlineText` | These take only `children`, `id`, `className` and `component`. Colour, size, `truncate` and `lineClamp` have no GDS replacement. |
| `Title` | `PageTitle`, `SectionTitle`, `CardTitle` | `order` sets the heading level (defaults 1, 2 and 3); there is no `size` prop. |
| `UnstyledButton` | No GDS export | Use `SemanticButton`, or the `Button` or `ActionIcon` passthrough. |

Exports without a package named come from `@sovereignsquad/gds-core`; every export in the table is also available from `@sovereignsquad/gds`. No gate checks this table against the package exports.

## Dependency-Boundary Exception Contract

```json
{
  "surface": "Legacy icon bridge",
  "category": "dependency-boundary",
  "scope": ["src/icons/legacy/*.tsx"],
  "dependency": "@tabler/icons-react",
  "allowImports": ["@tabler/icons-react"],
  "reason": "Migration bridge while semantic GDS icon coverage is completed.",
  "allowedImplementation": ["Imports remain confined to the reviewed bridge layer"],
  "mustStillUse": ["GDS action semantics", "GDS spacing and color tokens"],
  "mustNotDo": ["Import Tabler icons from feature UI", "Use the bridge as permanent icon policy"],
  "a11yRequirements": ["Icon-only controls keep accessible names"],
  "testingRequirements": ["Bridge usage is covered by import-boundary verification"],
  "observabilityRequirements": ["Dependency-risk report lists the active exception"],
  "owner": "platform-ui",
  "reviewDate": "2026-08-31",
  "replacementIssue": "https://github.com/sovereignsquad/general-design-system/issues/299",
  "exitCondition": "Remove once GDS semantic icon registry covers the requested symbols.",
  "rollbackPlan": "Revert the bridge and replace feature usage with GdsIcon/GdsIcons.",
  "riskLevel": "medium",
  "enforcementMode": "error",
  "status": "active"
}
```

`gds-compliance` rejects a `dependency-boundary` exception that omits any field in `DEPENDENCY_BOUNDARY_REQUIRED_FIELDS` (`packages/gds-compliance/index.js`). Under `compliance.strictMode`, an exception in status `active` does not suppress `strict.import.*` findings; see [Mantine boundary](#mantine-boundary).

## Operational Gates

Required release evidence:

- `npm run verify:references`
- `npm run audit:dependencies`
- `npm run verify:mantine`
- `npm run verify:release`

The dependency-risk report separates workspace packages from third-party runtime peers, dev tooling, optional native bindings, active exceptions, and accepted advisories.
