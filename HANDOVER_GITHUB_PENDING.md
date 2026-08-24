# GitHub Handover (Safe Baseline)

Status: Historical handover record (superseded 2026-07-26)
Last updated: 2026-05-31

> **⚠️ Superseded — board model changed.** The GDS delivery board is now the
> **label-based GitHub Issues board** (`status:` / `priority:` / `area:` labels),
> documented in [PROJECT_BOARD.md](PROJECT_BOARD.md) and [CLAUDE.md](CLAUDE.md) §7.
> The org-level **Projects v2 board `sovereignsquad#11`** referenced below is
> **retired** — its `gh project …` commands and PAT-era item IDs no longer apply.
> This file is kept only as a historical handover record; do not follow its board
> operating rules.

## 2026-06-07 HVB Board Sync Completed

Repository issue inspection found 25 open high-value-benefit implementation issues that are reusable GDS backlog and are now tracked on canonical project board `sovereignsquad#11`:

- `#247` Layout primitive completeness - governed responsive composition API
- `#248` Safe styling API - token-backed constrained style props
- `#249` Icon registry and semantic icon API - approved package-native symbols
- `#250` Token authoring and validation tools - diff, lint, contrast, and theme reports
- `#251` High-contrast and forced-colors mode - explicit accessibility theme contract
- `#252` Motion system - tokens, presets, reduced-motion, and no-motion fallbacks
- `#253` Design-to-code integration - Figma library mapping and handoff contract
- `#254` Notification center - unified toast, status, announcement, and audit API
- `#255` Confirmation and destructive action API - typed async risk and undo service
- `#256` Modal, drawer, and command surface system - overlay lifecycle contract
- `#257` Advanced form orchestration - validation, dirty state, autosave, optimistic submit, and recovery
- `#258` Schema-driven forms - typed Zod, JSON Schema, and OpenAPI form builder
- `#259` Data table engine - sort, filter, paginate, select, virtualize, export, and mobile states
- `#260` Resource manager framework - CRUD list detail edit activate copy-preview pattern
- `#261` Media and asset management system - upload preview metadata retry and accessibility contracts
- `#262` Task-based pattern library - best-practice workflow contracts for product tasks
- `#263` Production page templates - package-native admin settings resource CRUD analytics public event error empty states
- `#264` i18n runtime components - pluralization formatting sorting RTL expansion and telemetry
- `#265` Content design system - voice tone error CTA confirmation empty-state and localization-safe copy
- `#266` Accessibility evidence framework - keyboard screen reader focus WCAG and AT/browser status
- `#267` Automated accessibility CI package - Playwright axe keyboard focus and contrast gates
- `#268` Migration codemods - Mantine Tabler raw controls inline styles alerts confirms and tables
- `#269` Adoption dashboard - consumer app scoring for imports controls styles i18n tokens a11y and exceptions
- `#270` Exception lifecycle governance - owner expiry risk replacement issue link and CI decay
- `#271` Observability and operational contracts - standardized UX telemetry hooks

Completed board target:

- Added all 25 issues to project `11`.
- Set P0 issues to `Backlog (SOONER)`.
- Set P1 issues `#252`, `#253`, and `#265` to `Roadmap (LATER)`.
- Verified with `npm run audit:board:strict`.

Verified result:

- `tracked issue items: 161`
- `open issues: 25`
- `state/status mismatches: 0`

## Context

Earlier board verification was interrupted by GitHub API rate limiting. The follow-up audit has now completed successfully against the canonical GDS project board.

Completed already:

- Closed issues: `#154`, `#155`, `#156`, `#158`, `#159`, `#160`, `#174`, `#177`, `#179`
- Earlier normalization: `#178` moved to `Done`, `#175` closed as duplicate/superseded
- Earlier consistency closes: `#157`, `#169`, `#170`, `#171`, `#172`, `#173`

## Current Verified State

- Repository: `sovereignsquad/general-design-system`
- Branch: `main`
- Verified commit: `16d8ee9`
- Canonical project board: `sovereignsquad#11`
- Tracked project issue items: `71`
- Open project issues: `0`
- Issue state/project status mismatches: `0`
- Latest `GDS Quality` workflow for `main`: passed
- Latest GitHub Pages deployment workflow for `main`: passed
- Published package line: `2.6.7`

## Safe Operating Rule

Only use project board `11` as the canonical GDS delivery board. Do not use repository-wide issue lists as GDS priority input because they can include unrelated product issues.

Before starting another delivery wave, run:

```bash
npm run audit:board:strict
```

Before release or package publication, run:

```bash
npm run verify:release
```

## Exact commands

Project id:

```bash
gh project list --owner sovereignsquad
```

Run automated audit script:

```bash
npm run audit:board
npm run audit:board:strict
```

Manual fallback snapshot:

```bash
gh project item-list 11 --owner sovereignsquad --limit 300 --format json > /tmp/proj11.json
jq -r '.items[] | [.content.number, .status, .content.title] | @tsv' /tmp/proj11.json
```

Normalize one mismatched item example:

```bash
gh project item-edit \
  --id <PROJECT_ITEM_ID> \
  --project-id PVT_kwDOEEuBB84BYuSM \
  --field-id PVTSSF_lADOEEuBB84BYuSMzhTyAgE \
  --single-select-option-id 98236657
```

Where `98236657` = `Done`.

## Exit criteria

- `npm run audit:board` reports:
  - `open issues: 0` (or explicit list if new work was added)
  - `state/status mismatches: 0`
- No closed issue remains in `Declined`, `Todo`, `Backlog`, `Roadmap`, or `In Progress`.
