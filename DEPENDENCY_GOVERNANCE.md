# Dependency Governance

Status: Active SSOT
Version: 4.0.0
Last updated: 2026-07-26

GDS is dependency-governed, not dependency-free. React, Mantine, and Tabler are accepted only behind GDS-owned contracts, release gates, and exception lifecycle rules.

## Dependency Classes

| Class | Packages | Public authority | Consumer rule |
|---|---|---|---|
| Platform | `react`, `react-dom` | Required React runtime foundation | Consumers install compatible peers directly |
| Primitive engine | `@mantine/core`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications`, `@mantine/dates`, `dayjs` | GDS implementation engine for accessible primitives, overlays, forms, layout, theme runtime, and date/time input | Consumers use GDS contracts first; direct use in strict surfaces requires an approved dependency-boundary exception. `@mantine/dates` and `dayjs` are peer dependencies (not regular dependencies) like the rest of this class, since `@mantine/dates` shares the same single-Mantine-instance context requirement as `@mantine/core`, and `dayjs` must be a single shared instance across the host app for locale/plugin configuration to apply consistently |
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

Strict consumers may not import dependency UI authority directly in protected surfaces:

- `@mantine/core`
- `@mantine/hooks`
- `@mantine/notifications`
- `@mantine/dates`
- `@tabler/icons-react`

Allowed direct usage must be narrow, reviewed, and represented as a `dependency-boundary` exception in `gds-adoption.json`.

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
  "status": "active"
}
```

## Operational Gates

Required release evidence:

- `npm run verify:references`
- `npm run audit:dependencies`
- `npm run verify:mantine`
- `npm run verify:release`

The dependency-risk report separates workspace packages from third-party runtime peers, dev tooling, optional native bindings, active exceptions, and accepted advisories.
