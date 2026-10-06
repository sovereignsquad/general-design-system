# Exception Surfaces

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

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

Exception categories (accepted values: `EXCEPTION_CATEGORIES` in `packages/gds-compliance/index.js`):

- `runtime-constraint`
- `product-authored-experience`
- `package-coverage-gap`
- `migration-bridge`
- `dependency-boundary`, for direct imports from an implementation dependency; contract in [DEPENDENCY_GOVERNANCE.md](DEPENDENCY_GOVERNANCE.md#dependency-boundary-exception-contract)

Exceptions must remain narrow. Broad scopes such as `src/**`, `app/**`, or whole-surface bypasses are not valid.

Creator-authored experience exceptions must also remain non-authoritative:

- the exception may own only the bounded public or editorial experience canvas
- GDS still owns surrounding shell, navigation, shared controls, consent, legal, and recovery chrome
- a local exception adapter with status `exception` must be covered by an approved exception scope
- stale exception scopes that no longer match repository files are invalid and should be removed

### Worked entry: creator canvas styled from stored data

A creator landing page or report whose CSS comes from stored data renders its canvas through `CreatorThemeBoundary` from `@sovereignsquad/gds-core`. The boundary wraps its children in `[data-gds-creator-theme="<scopeId>"]` and injects the CSS only when `validateCreatorCss` reports no error; on an error it renders `CreatorThemeDiagnostics` in the page instead of the styles, and it always renders the children. It does not evaluate `requiredVisibleSelectors` and has no contrast check, so the entry's accessibility and testing requirements carry those checks. Canvas rules: [THEME_GOVERNANCE.md, "Creator-authored experience theming"](THEME_GOVERNANCE.md#creator-authored-experience-theming), including "What the boundary does not enforce"; the document-root rule is in [THEME_GOVERNANCE.md, "Runtime-authored styling and the document root"](THEME_GOVERNANCE.md#runtime-authored-styling-and-the-document-root). [TEMPLATES/gds-adoption.json.template](TEMPLATES/gds-adoption.json.template) carries a campaign-canvas variant.

```json
{
  "surface": "Creator landing page canvas",
  "category": "product-authored-experience",
  "scope": ["src/features/landing/LandingCanvas.tsx"],
  "reason": "Creators style their own landing page body with CSS stored per page.",
  "allowedImplementation": ["Stored creator CSS rendered only through CreatorThemeBoundary on the canvas root"],
  "mustStillUse": [
    "GDS public shell and navigation outside the canvas",
    "Consent, privacy and terms controls rendered outside the canvas",
    "GDS recovery and error states outside the canvas"
  ],
  "mustNotDo": [
    "Inject creator CSS as an unscoped style element",
    "Write creator values to :root, html, body or document.documentElement",
    "Place consent, legal or recovery controls inside the canvas",
    "Override GDS chrome with !important"
  ],
  "a11yRequirements": [
    "Consent, privacy and terms controls stay visible and operable with the stored CSS applied",
    "Focus indicators inside the canvas stay visible",
    "Text inside the canvas meets WCAG AA contrast against its background"
  ],
  "testingRequirements": [
    "Route test applies stored creator CSS and asserts the consent, privacy and terms controls are visible and operable",
    "Route test covers the canvas when validateCreatorCss reports an error",
    "runGdsAxeScan on the landing route with creator CSS applied"
  ],
  "observabilityRequirements": [
    "validateCreatorCss issues are recorded per page and owner, de-duplicated because onDiagnostics runs on every render",
    "Moderation and publish workflows identify the canvas owner"
  ],
  "owner": "platform-ui",
  "reviewDate": "2026-12-31",
  "exitCondition": "Remove when a GDS creator-canvas lane covers stored creator styling without a product exception.",
  "status": "approved"
}
```

## Chart surfaces

The GDS does not own chart engines or data fetching, but it now owns the canonical chart containment path through `ChartTokenPanel` and the reporting composition path through `ReportingSection`.

It owns:

- chart container framing through `ChartTokenPanel`
- surrounding page rhythm through `ReportingSection`
- period/scope control placement through `PeriodSelector`
- source/freshness/confidence disclosure through `EvidencePanel`
- loading, empty, error, below-threshold, partial, stale, filtered, and permission-limited states
- summary-before-chart priority on mobile
- non-color-only legend placement and GDS token mapping
- accessible table fallback placement
- retry/action slot presentation around analytics panels

It does not own:

- chart library runtime
- data fetching or storage
- retries/timeouts
- timezone calculation
- export file generation

External chart libraries or embeds are valid only when wrapped in the sanctioned chart/reporting contract and recorded as exceptions if they need runtime behavior outside GDS.

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
- bounded creator-authored campaign/editorial experience canvases when the shell-vs-canvas boundary remains explicit

Third-party provider-branded auth controls are not a permanent exception. Products that use social authentication must declare their policy under `compliance.identityProviderBranding` and render through `SocialAuthButtons` in that policy.

## Required documentation for any exception

Every project-local exception note must state:

1. reason and scope
2. what shared shell/state/theme rules still apply
3. accessibility requirements
4. testing and observability expectations where applicable
5. removal condition / exit condition
