# Narimato GDS Adoption

Status: Active — enforcement phase  
Version: 1.0.0  
Last updated: 2026-05-23  
Project: `/Users/moldovancsaba/Projects/narimato`

## Objective

Narimato is a **Mantine-only** product with vendored `@doneisbetter/gds-core` and `@doneisbetter/gds-theme`. The public participant site and local operator setup UI follow GDS shells, headers, and state patterns. Work in this phase focuses on **provable compliance** (package sync, guardrails, pattern inventory), not greenfield UI discovery.

## Foundation signal

| Signal | Value |
|--------|--------|
| UI framework | Mantine 7 (`@mantine/core`, hooks, notifications, modals) |
| GDS packages | Vendored `packages/gds-core`, `packages/gds-theme` |
| SSOT reference | Local adapter: `docs/GDS_ADOPTION.md` |
| Archetype | **Mantine-rooted — enforcement** |

## Surfaces

| Surface | Shell / adapter |
|---------|-----------------|
| Public site (narimato.com) | `PublicShell`, `NarimatoPageHeader` |
| Local operator (`:10006`) | `NarimatoOperatorShell` |
| Admin credentials | `AdminShell`, `NarimatoAuthShell` |
| Immersive play | No shell (approved exception) |

## Pattern contract status

| Contract | Local path | Status |
|----------|------------|--------|
| Root provider | `components/NarimatoProviders.js` | Done |
| Theme | `lib/ui/narimatoTheme.js` | Done |
| Public shell | `components/public/PublicShell.js` | Done |
| Operator shell | `components/operator/NarimatoOperatorShell.js` | Done |
| Auth shell | `components/NarimatoAuthShell.js` | Done |
| Page header | `components/NarimatoPageHeader.js` | Done |
| State block | `@doneisbetter/gds-core` EmptyState, StatusBadge, ConfirmDialog | Done |
| Metric card | Inline in operator dashboard | Backlog |
| Article shell | Legal pages via `PublicShell` | Partial |
| Data toolbar / responsive table | — | N/A |

## Validation commands

```bash
cd /Users/moldovancsaba/Projects/narimato
npm run gds:sync      # after SSOT build
npm run gds:ci-guard
npm run build
npm run build:operator
```

## Remaining work

1. Keep vendored `@doneisbetter/gds-*` in sync with SSOT `dist/` after normative releases.
2. Extend CI guard as GDS enforcement rules grow.
3. Extract `NarimatoMetricCard` if metrics appear on multiple surfaces.
4. Optional: `SemanticButton` / `GdsVocabulary` for repeated operator actions.
5. Optional: dedicated article shell for legal/docs if `PublicShell` becomes too heavy.

## Approved exceptions

- Immersive play routes without app shell
- `styles/playGame.module.css` for full-viewport game layout
- Admin routes not linked from public navigation
