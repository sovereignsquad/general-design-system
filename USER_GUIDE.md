# GDS User Guide

## For Developers

1. Install the package lane shown on `/install`.
2. Open `/api` to confirm the export, import path, runtime lane, and state contract.
3. Open `/patterns` or `/live-demos` to inspect the implementation pattern.
4. Add or update `gds-adoption.json`.
5. Run:

```bash
npm run build
npm run test:run
npm run verify:references
gds-compliance check --manifest ./gds-adoption.json
```

## For Product Owners

1. Open `/use-cases`.
2. Match the product need to a shipped GDS lane.
3. Confirm the recommended contracts, accessibility requirement, operational checks, and risk level.
4. Request a feature only when no shipped contract covers the reusable need.

## Recommended Maturity Capabilities

Use `/maturity` and `getGdsRecommendedMaturityCapabilities()` before creating local UI infrastructure. The seven recommended areas are now package-native delivery contracts:

- Admin delivery contracts for forms, tables, analytics, and resource managers.
- Runtime feedback for confirmation, toast, modal, drawer, and command surfaces.
- Foundation surface governance for layout primitives, safe styling, and icons.
- Global readiness for i18n runtime behavior and accessibility evidence.
- Adoption governance for compliance, codemods, dashboards, and exception lifecycle.
- Theme operations for token authoring, high contrast, motion, and design handoff.
- Product system delivery for content standards, page templates, and telemetry.

Product owners should approve local UI work only when the need is not covered by these contracts or when a temporary exception is recorded in `gds-adoption.json` with owner, review date, exit condition, and replacement path.

## Accessibility DoD

Every UI delivered with GDS must preserve keyboard operation, visible focus, semantic labels, contrast, reduced motion, non-color-only meaning, and mobile-safe layout.

## Localization DoD

Routes declared in `localizedRouteCoverage` must expose full-copy locale coverage. Package locale packs must maintain message-key parity.
