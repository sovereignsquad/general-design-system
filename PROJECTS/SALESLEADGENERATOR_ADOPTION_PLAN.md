# Sales Lead Generator Adoption Plan

Status: Active reusable-contract driver
Version: 1.0.0
Last updated: 2026-08-25
Project: `/Users/Shared/Projects/salesleadgenerator`

## Objective

Track Sales Lead Generator's GDS adoption state. Was the most-drifted real GDS consumer found
in the 2026-08-25 audit (unsupported install path, several major versions stale); migrated the
same day.

## Current state (confirmed 2026-08-25, post-migration)

- `@sovereignsquad/gds-admin`/`gds-core`/`gds-theme` now resolve at `^6.5.0` from the
  documented GitHub Packages registry (`.npmrc`'s `@sovereignsquad:registry` block) — migrated
  off the GitHub Release tarball URL (`gds-v3.14.3/...tgz`) that `INSTALLATION_GUIDE.md` §8
  explicitly disclaims as unsupported. Zero code changes were required for the 3.14.3 → 6.5.0
  jump: `tsc --noEmit`, lint, all 728 vitest tests, and the smoke suite passed unchanged.
- `@sovereignsquad/gds-compliance` and `gds-eslint-config` are now real dev dependencies, with a
  `gds-adoption.json` manifest (`productArchetype: admin`, `strictMode: false`,
  `app/components/gds/primitives.ts` declared as a tracked local adapter — a raw Mantine/
  tabler-icons re-export barrel, not real GDS primitives). `scripts/audit-gds-style.mjs` (the
  hand-rolled ~100-line duplicate scanner) is deleted; `npm run audit:gds-style` now calls the
  real `gds-compliance validate-manifest`/`check`. The real tool immediately found what the
  hand-rolled one missed: 3 raw `#eee` literals in `forecast-client.tsx`, fixed to
  `var(--mantine-color-gray-3)`.
- 24 findings remain from the real tool, both understood and non-blocking: `app/layout.tsx`'s
  `theme-color` meta tag is declared via `themeOwnershipPaths` but the currently-published
  `gds-compliance@6.5.0` doesn't yet honor that for this non-strict rule (fixed in GDS itself,
  issue #670, not yet released as a package version — will clear on its own); the other 23 are
  all test files, confirmed false positives from bare `#NNN` issue references inside Jest
  test-description strings colliding with the raw-color regex (not fixed — rewriting 23 test
  files' wording is separate, larger, out of scope here).
- `GDS_PACKAGES_TOKEN` set as a GitHub Actions repository secret (this repo has no CI workflow
  yet to consume it). **Vercel project not confirmed** — not visible under the one Vercel team
  this session could reach; the repo owner needs to locate it (likely a different Vercel
  account/team) and add `GITHUB_TOKEN` there per the [deployment-host build-step
  recipe](../INSTALLATION_GUIDE.md#getting-github_token-into-a-deployment-hosts-build), or the
  next `vercel deploy --prod` will 401 on install.

## Exit criteria

- listed in `PORTFOLIO_ADOPTION_MATRIX.md` (done)
- migrate off the Release-tarball install to the documented canonical path — done
- upgrade from `3.14.3` to the current `6.x` line — done (`6.5.0`)
- adopt the real `@sovereignsquad/gds-compliance` package and retire
  `scripts/audit-gds-style.mjs` — done
- **outstanding**: confirm `GITHUB_TOKEN` is set on this repo's actual Vercel project
