# Impact Mantine Refactor

Status: Planned
Version: 1.0.0
Last updated: 2026-05-24
Project: `sovereignsquad/impact` (`@impact/web`)

## Objective

Bring Impact into formal GDS portfolio coverage without forcing it to keep vendored theme code and local shell/state/upload forks indefinitely.

## Current state

- 6-route static Vite MPA on Vercel
- React + Mantine 7
- local wrappers for `PublicShell`, `PageHeader`, `StateBlock`, and `StatsTable`
- local vendored theme baseline because `@doneisbetter/gds-theme` has not been the canonical deployable path
- dark public shell on top of a GDS baseline that currently defaults to light

## Required central GDS dependencies

1. installable `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, and `@doneisbetter/gds-admin`
2. public shell and docs/article shell contract
3. state block family and responsive data-view contract
4. file-upload/dropzone contract
5. dark-mode and accessibility policy for public marketing/data routes
6. CI/gds-compliance guidance suitable for Vite MPA consumers

## Approved exceptions to decide

- CLI offline `impact-report.html`: permanent exception or future tranche
- ingest backend without admin UI: currently out of scope for shared admin work

## Exit criteria

- Impact is listed in the portfolio matrix with explicit adoption status
- the repo contains a shared adoption plan and contract map
- the vendored theme can be replaced by the published/shared package path
- local wrappers either match shared contracts or are documented temporary adapters
