# Management Adoption Plan

Status: Active reusable-contract driver
Version: 1.0.0
Last updated: 2026-08-25
Project: `/Users/Shared/Projects/management`

## Objective

Track Management's GDS adoption state so it stops being invisible to the portfolio. Confirmed
this session (2026-08-25): a real, actively-governed adoption already in progress — this is a
tracking entry recording current state, not a refactor plan.

## Current state (confirmed 2026-08-25)

- `@sovereignsquad/gds-core`/`gds-theme` `^6.1.0` (declared `package.json` version; current GDS
  line is `6.5.0` — a routine upgrade, not urgent drift, since the range resolves against the
  real registry rather than a frozen artifact).
- Installed via the documented canonical path: `.npmrc` pointing `@sovereignsquad:registry` at
  `https://npm.pkg.github.com` with a `GITHUB_TOKEN`-backed `_authToken` — matches
  `INSTALLATION_GUIDE.md`'s "Single install surface" exactly, unlike several sibling consumers.
- `gds-compliance` installed and wired into an actual CI-facing script
  (`npm run gds:check` → `scripts/gds-check.mjs`).
- One real compliance finding at audit time: `src/app/layout.tsx:37`,
  `color: "var(--mantine-color-dimmed, #868e96)"` — a defensively-correct `var()` fallback that
  `gds-compliance`'s raw-color scanner false-positived on. Fixed upstream in issue #670; not a
  real violation.

## `scripts/gds-check.mjs` is a fork, not the real package — re-synced 2026-08-25

`npm run gds:check` in this repo does **not** call the installed `@sovereignsquad/gds-compliance`
package — `scripts/gds-check.mjs` is a hand-ported, dependency-free reimplementation of
`scanSourceFile()`'s logic, with its own header explaining why: "GitHub Packages install not
reliably available in every environment." Because of that, issue #670's fix (the `var()`
fallback exclusion + `themeOwnershipPaths` support) did not reach this fork automatically — it
was manually re-ported into `scripts/gds-check.mjs` directly in the `management` repo (commit
`fd3b61a`, merged to both `dev` and `main`). `npm run gds:check` now reports 0 findings across
177 source files. This fork will need the same manual re-port for any future upstream fix —
that's the accepted, ongoing cost of it not being the real package.

The install-reliability problem the fork exists to work around is itself now resolved:
`GDS_PACKAGES_TOKEN` is provisioned as both a GitHub Actions secret and a Vercel project
environment variable for `management` (production Vercel project) and `padel-africa` (the
hosted-client Vercel project on the same codebase) — see the [deployment-host build-step
recipe](../INSTALLATION_GUIDE.md#getting-github_token-into-a-deployment-hosts-build). Both
Vercel projects confirmed `READY` on their latest deployment as of 2026-08-25. Whether to now
retire the fork in favor of the real installed package is a call for whoever owns `management`,
not made here.

## Exit criteria

- listed in `PORTFOLIO_ADOPTION_MATRIX.md` (done)
- upgrade to the GDS release carrying issue #670's fix — done via manual re-port, not a package
  upgrade; `layout.tsx`'s finding clears (confirmed 0 findings)
- `GITHUB_TOKEN`/`GDS_PACKAGES_TOKEN` provisioned everywhere the install needs it — done
  (GitHub Actions and both Vercel projects)
