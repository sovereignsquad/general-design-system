# Dependency Audit Policy

Status: Active SSOT
Version: 6.8.0
Last updated: 2026-11-13

This repository treats published runtime package dependencies and local reference/tooling dependencies differently.

## Release Gate

`npm run audit:dependencies` enforces:

- `npm audit --omit=dev` must have zero findings.
- Full `npm audit` may only contain explicitly accepted dev/reference-tooling advisories listed in this document.
- Accepted advisories must have an owner, reason, and review date.

## Accepted Dev / Reference Tooling Advisories

None. `npm audit` reports no advisories as of 2026-11-13.

An accepted advisory is a `### GHSA-…` entry in this section with `Owner:`, `Review date: YYYY-MM-DD`, `Scope:`, `Severity:`, a reason and operational behavior. `scripts/verify-dependency-audit.mjs` reads this section as the only list, and fails when an accepted entry's review date has passed or when `npm audit` no longer reports it.

## Staleness & Deprecation Sweep (added 2026-07-24, housekeeping issue #406)

`scripts/generate-dependency-risk-report.mjs` now also records an
`npm outdated`-derived staleness snapshot and a deprecation check
(`npm view <pkg> deprecated`) in `dependency-risk-report.json`'s `staleness`
field, run as part of `audit:dependencies`. This is deliberately
**warn-and-record, not release-blocking** — flipping every outdated or
soft-deprecated dependency into a hard gate overnight would create an
unplannable cascade of forced upgrades. Findings are triaged here, by hand,
after each sweep; only a specific triaged item ever becomes a hard
requirement (tracked as its own dedicated issue, never a blanket policy
change to this file).

First sweep (2026-07-24): 28 outdated packages, 0 deprecated packages found.
Disposition for the 13 packages with a newer major version available:

| Package(s) | Disposition | Reason |
|---|---|---|
| `@mantine/core`, `@mantine/dates`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications` (7.17.8 → 9.4.2) | Tracked, no action | Intentional multi-version support lane — `verify:mantine` already smoke-tests Mantine 7/8/9 compatibility on every release; this is the CI matrix working as designed, not staleness. |
| `react`, `react-dom` (18.3.1 → 19.2.7) | Upgraded (workspace runtime) | Bumped the dev/app runtime to React 19 so the playground can adopt `react-router@8` (which peer-requires React ≥19.2.7) and remediate GHSA-qwww-vcr4-c8h2 (issue #430). The published peer range stays `^18.2.0 || ^19.0.0` — React 18 remains a supported consumer lane, still validated via `verify:mantine`'s Mantine 7 + React 18 consumer-install smoke. |
| `next` (15.5.21 → 16.2.11) | Accepted, review at next sweep | Dev-only reference-fixture dependency (`apps/reference-next`), not a published runtime dependency; already carries its own accepted-advisory entries above. |
| `typescript` (packages build 5.9.3 → 7.0.2 available; reference apps pinned 6.0.x) | Accepted, review at next sweep | Intentional cross-major lane: the published packages are typechecked and their `.d.ts` emitted under TS 5.9.x (peer floor `5.4.5`, root workspace line), while the private reference apps run TS 6.0.x. Tooling-only, no runtime exposure and no known compatibility blocker. A package-build TS major bump (to 6.x/7.x) warrants its own dedicated verification pass rather than a routine bump. Authoritative support line: [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) + `compatibility.matrix.json`. |
| `@babel/core` (7.29.7 → 8.0.1), `@testing-library/jest-dom` (6.9.1 → 7.0.0), `@types/node` (24.13.3 → 26.1.1), `jsdom` (26.1.0 → 29.1.1) | Accepted, review at next sweep | Dev/test tooling only, no runtime exposure; routine upgrades deferred to avoid unrelated churn in this housekeeping batch. |

Owner: GDS platform. Review cadence: re-run `npm run audit:dependencies` and
re-triage this table at least once per minor release, or sooner if a
deprecation notice appears (`staleness.deprecatedPackages` non-empty).

## Resolved 2026-11-13 (#963)

- `minimatch` GHSA-g3hv-75wg-m249 (production, through `@sovereignsquad/gds-eslint-config` → `eslint@10` → `@eslint/config-array`): root override `minimatch` `11.0.8`. The latest `eslint` (10.14.0) and `@eslint/config-array` (0.23.5) still declare `^10`; lint and the `gds-eslint-config` tests pass on 11.0.8.
- `vite` GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22: override and app ranges raised to `8.3.8`.
- `next` GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p, GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r: `apps/reference-next` raised to `^15.5.29`, still on the supported 15.x line.
- `vitest` / `@vitest/mocker` GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp: `vitest` raised to `^4.1.12`.
- `zod` GHSA-mrhx-c7xc-m3w5 (through `eslint-plugin-react-hooks`): updated within its range to `4.6.7`.
- `postcss` GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849, GHSA-fxqj-rqcc-2cmp, previously accepted: root override `postcss` `8.5.32`. `next@15.5.29` pins `postcss@8.4.31` exactly; a minimal Next 15.5.29 App Router build with the override compiled and minified its CSS correctly. Their acceptances were removed.
- `sharp` GHSA-f88m-g3jw-g9cj, previously accepted: no longer reported since the `sharp` `0.35.5` override (#934). Its acceptance was removed.

## Resolved During 3.0.7

- `vitest` was upgraded from `3.2.4` to `4.1.8`, resolving GHSA-5xrq-8626-4rwp for the local test runner.
