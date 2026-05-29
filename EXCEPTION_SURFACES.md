# Exception Surfaces

Status: Active SSOT
Version: 2.6.6
Last updated: 2026-05-29

This document defines which surfaces stay outside first-class GDS component ownership, how they must still integrate with the system, and how they must be documented through the canonical exception contract.

## Exception contract

Any approved exception recorded in `gds-adoption.json` must define:

1. `surface`
2. `category`
3. `scope`
4. `reason`
5. `allowedImplementation`
6. `mustStillUse`
7. `mustNotDo`
8. `owner`
9. `reviewDate`
10. `exitCondition`
11. `status`

Optional but strongly recommended:

- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`

Mandatory when `category` is `product-authored-experience`:

- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`

Exception categories:

- `runtime-constraint`
- `product-authored-experience`
- `package-coverage-gap`
- `migration-bridge`

Exceptions must remain narrow. Broad scopes such as `src/**`, `app/**`, or whole-surface bypasses are not valid.

Creator-authored experience exceptions must also remain non-authoritative:

- the exception may own only the bounded public or editorial experience canvas
- GDS still owns surrounding shell, navigation, shared controls, consent, legal, and recovery chrome
- a local exception adapter with status `exception` must be covered by an approved exception scope
- stale exception scopes that no longer match repository files are invalid and should be removed

## Chart surfaces

The GDS does not currently own chart engines.

It does own:

- chart container framing
- surrounding page rhythm
- loading, empty, error, and permission states
- summary-before-chart priority on mobile
- export/action placement around analytics panels

## Map surfaces

The GDS does not currently own third-party map engines, but it now owns the canonical containment surface through `MapPanel`.

It does own:

- surrounding shell/layout integration
- empty, blocked, and attribution framing
- side-panel, filter, and detail-card consistency around map views
- map/embed header chrome, actions, and fallback states through `MapPanel`

## Embed surfaces

The GDS does not currently own third-party embed runtimes, but it does own the host containment pattern for sanctioned embeds.

It does own:

- host-shell framing
- loading/error/permission handling
- accessibility affordances such as labels and fallback links
- map and iframe containment through `MapPanel`

## Hardware-adjacent capture surfaces

The GDS does not own hardware capture runtimes such as browser camera preview or device-specific media pipelines.

It does own:

- surrounding staged public flow through `PublicFlowShell`
- consent, review, share, and recovery shell structure
- deterministic action ordering and state semantics

Only the actual hardware-preview region should remain an exception when `PublicFlowShell` is used correctly.

## Playback and kiosk surfaces

The GDS does not own media sourcing, scheduling, or product-specific playback engines.

It does own:

- fullscreen, embedded, and kiosk playback framing through `PlaybackSurface`
- loading, empty, error, and degraded states
- lightweight control and status lanes

## Permanent or likely-long-lived exceptions

- immersive game/runtime canvases
- offline HTML report rendering
- certificate, email, and OG rendering internals
- third-party provider-branded auth controls when branding requirements cannot be normalized further
- bounded creator-authored campaign/editorial experience canvases when the shell-vs-canvas boundary remains explicit

## Required documentation for any exception

Every project-local exception note must state:

1. reason and scope
2. what shared shell/state/theme rules still apply
3. accessibility requirements
4. testing and observability expectations where applicable
5. removal condition / exit condition
