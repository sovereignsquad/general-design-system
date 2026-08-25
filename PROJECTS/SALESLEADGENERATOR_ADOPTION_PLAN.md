# Sales Lead Generator Adoption Plan

Status: Active reusable-contract driver
Version: 1.0.0
Last updated: 2026-08-25
Project: `/Users/Shared/Projects/salesleadgenerator`

## Objective

Track Sales Lead Generator's GDS adoption state — confirmed this session (2026-08-25) as the
most-drifted real GDS consumer in the audited portfolio, on an unsupported install path and
several major versions stale.

## Current state (confirmed 2026-08-25)

- `@sovereignsquad/gds-admin`/`gds-core`/`gds-theme` pinned to
  `https://github.com/sovereignsquad/general-design-system/releases/download/gds-v3.14.3/...tgz`
  — a GitHub Release tarball URL. `INSTALLATION_GUIDE.md` §8 explicitly states this artifact
  exists for release-notes visibility and offline/audit purposes only, and is **not** a
  documented or supported consumer install path.
- Declared version `3.14.3` against a current GDS line of `6.5.0` — three-plus major versions
  behind. A Release-tarball URL carries no update signal (unlike a registry semver range), so
  nothing has ever prompted an upgrade.
- No `@sovereignsquad/gds-compliance` dependency at all. Instead, `scripts/audit-gds-style.mjs`
  is a hand-written ~100-line regex scanner checking for hardcoded Tailwind color classes and
  inline hex/rgb literals — functionally a weaker, unmaintained duplicate of `gds-compliance`'s
  `strict.raw-color`/`strict.inline-color` rules, confirmed by reading both scripts directly. The
  team correctly internalized the underlying rule ("use semantic tone props, not hardcoded
  colors" — their own script's comment) but never adopted the real enforcement tool for it.

## Exit criteria

- listed in `PORTFOLIO_ADOPTION_MATRIX.md` (done, this pass)
- migrate off the Release-tarball install to the documented canonical path
  (`INSTALLATION_GUIDE.md` "Single install surface" + the [deployment-host build-step
  recipe](../INSTALLATION_GUIDE.md#getting-github_token-into-a-deployment-hosts-build) if the
  original blocker was getting `GITHUB_TOKEN` into a hosted build)
- upgrade from `3.14.3` to the current `6.x` line once the install path is fixed
- adopt the real `@sovereignsquad/gds-compliance` package and retire
  `scripts/audit-gds-style.mjs` in favor of it, so future upstream rule fixes (for example issue
  #670) actually reach this repo
