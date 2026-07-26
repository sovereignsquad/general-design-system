# Handover

Status: Historical handover record (superseded 2026-07-26)
Date: 2026-05-24
Repository: `/Users/Shared/Projects/general-design-system`

> **⚠️ Superseded — board model changed.** The "GitHub Project Board State"
> section below references the user-level **Projects v2 board #48**, which is
> **retired**. The GDS delivery board is now the **label-based GitHub Issues
> board** documented in [PROJECT_BOARD.md](PROJECT_BOARD.md) and
> [CLAUDE.md](CLAUDE.md) §7. Kept only as a historical handover record.

## Current Canonical Board Note

The current canonical GDS delivery board is organization project `sovereignsquad#11` (`{GDS} - From IDEA to LIVE`), not the older personal project listed below.

As of 2026-06-07, issues `#247` through `#271` are open high-value-benefit GDS backlog issues and are tracked on project `11`. Use:

```bash
npm run board:sync-hvb
```

The latest verified board audit reported `open issues: 25` and `state/status mismatches: 0`.

## Delivered in this repo

- aligned the GDS release line to `2.3.0`
- added publish-ready package metadata for `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`
- added `client` and `server` subpath exports for SSR-safe consumption guidance
- strengthened the shared package surface with:
  - `MetricCard`
  - `ProgressCard`
  - `ProductCard`
  - `StateBlock`
  - `DataToolbar`
  - `PublicShell`
  - `AuthShell`
  - `ArticleShell`
  - `UploadDropzone`
  - `MediaCard`
  - `AccessSummary`
  - `ResponsiveDataView`
  - `WorkspaceHeader`
  - `EditorScaffold`
- upgraded admin primitives for better mobile/action/state behavior
- added shared package tests and release-alignment verification
- added compatibility, theme-governance, and exception-surface docs
- added portfolio/adoption plans for Impact, Camera, and Pesti Est

## Validation

Verified successfully with:

- `npm run build`
- `npm run lint`
- `npm run test:run`
- `npm run verify:release`

## GitHub Project Board State

Project:

- `General Design System - Alignment Backlog`
- [https://github.com/users/moldovancsaba/projects/48](https://github.com/users/moldovancsaba/projects/48)

Closed and marked `Done`:

- `#54` through `#61`
- `#68` through `#79`

Still open:

- `#53` umbrella roadmap
- `#62` Amanoba rollout
- `#63` ClassScout rollout
- `#64` KIDEX rollout
- `#65` SSO rollout
- `#66` Messmass rollout
- `#67` Narimato rollout

## Important Boundary

The remaining open issues are adopter-repo rollout tasks, not shared-repo implementation tasks.

Available locally under `/Users/Shared/Projects`:

- `narimato`

Not available locally in this workspace:

- `amanoba`
- `classscout`
- `kidex`
- `sso`
- `messmass`
- `impact`
- `budapest-night`

That means the shared GDS work is delivered here, but the remaining cross-repo adoption issues cannot be fully completed from this repository alone.

## Recommended Next Step

To finish `#53`, bring the adopter repositories into the local workspace one by one and execute `#62` to `#67` directly in those repositories, then close the umbrella issue.
