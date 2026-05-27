# Narimato GDS Adoption

Status: Active — npm consumer reference  
Version: 2.6.2  
Last updated: 2026-05-27  
Project: `/Users/Shared/Projects/narimato`

## Objective

Narimato is a reference consumer that installs the public `@doneisbetter/gds-*` package line directly from npm. The public participant site and local operator setup UI follow GDS shells, headers, and state patterns. Work in this phase focuses on compliance, thin adapter discipline, and surfacing real package-consumption friction back into GDS.

## Foundation signal

| Signal | Value |
|--------|--------|
| UI framework | Mantine 7 (`@mantine/core`, hooks, notifications, modals) |
| GDS packages | `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, `@doneisbetter/gds-admin`, `@doneisbetter/gds-eslint-config`, `@doneisbetter/gds-compliance` |
| SSOT reference | Local adapter: `docs/GDS_ADOPTION.md` |
| Archetype | **Direct npm consumer — enforcement** |

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
| Metric card | `NarimatoMetricCard.js` thin wrapper over shared `MetricCard` | Done |
| Article shell | Legal pages via `PublicShell` | Approved local simplification |
| Data toolbar / responsive table | — | N/A |

## Validation commands

```bash
cd /Users/Shared/Projects/narimato
npm run gds:validate
npm run gds:compliance
npm run build
```

## Remaining work

1. Keep local wrappers thin and delete them when new shared contracts make them unnecessary.
2. Keep immersive play and notification decisions as explicit local exceptions.
3. Feed only truly repeated consumer friction back into GDS.

## Approved exceptions

- Immersive play routes without app shell
- `styles/playGame.module.css` for full-viewport game layout
- `NarimatoSemanticButton` fallback while static prerender behavior remains product-local
- Mantine notifications API usage details
