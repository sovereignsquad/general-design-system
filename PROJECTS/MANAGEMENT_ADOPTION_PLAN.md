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

## Known gap: `scripts/gds-check.mjs` is a fork, not the real package

`npm run gds:check` in this repo does **not** call the installed `@sovereignsquad/gds-compliance`
package — `scripts/gds-check.mjs` is a hand-ported, dependency-free reimplementation of
`scanSourceFile()`'s logic, with its own header explaining why: "GitHub Packages install not
reliably available in every environment." This means upstream fixes to the real package (like
#670's `var()`-fallback exclusion) do not reach this repo's actual CI gate without someone
manually re-porting the change — confirmed by directly reading both the real package and this
fork's source during the 2026-08-25 audit. Flagged here rather than acted on: fixing it means
editing the `management` repo itself, out of scope for a GDS-repo-only tracking entry.

## Exit criteria

- listed in `PORTFOLIO_ADOPTION_MATRIX.md` (done, this pass)
- upgrade to the GDS release carrying issue #670's fix, confirming the `layout.tsx` finding
  clears without code changes
- decide whether `scripts/gds-check.mjs`'s fork is a permanent necessity or a fixable
  install-reliability problem worth revisiting via the [deployment-host build-step
  recipe](../INSTALLATION_GUIDE.md#getting-github_token-into-a-deployment-hosts-build)
