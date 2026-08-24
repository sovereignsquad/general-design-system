# Narimato GDS Audit

Status: Active reference-consumer audit
Version: 2.6.2
Last updated: 2026-05-27
Reference consumer: `/Users/Shared/Projects/narimato`

## Purpose

Narimato is a permitted reference consumer for validating the real package-consumption path and learning where GDS still forces unnecessary local adapters. This document records what Narimato revealed and what should flow back into GDS versus remain product-local.

## Validated consumer baseline

- Installs `@sovereignsquad/gds-*` from npm directly
- Uses `gds-adoption.json` and shared compliance tooling
- Passes:
  - `npm run gds:validate`
  - `npm run gds:compliance`
  - `npm run build`

## Findings

### Promote to GDS

1. `ChoiceChip`
   - Narimato had a thin neutral chip wrapper for lightweight selection, filter, and mode-toggle UI.
   - This is generic across consumers and now belongs in `@sovereignsquad/gds-core`.

2. Server-safe semantic action label helper
   - Narimato used a local `SemanticButton` fallback during static prerender.
   - The real reusable need was not a second button component, but a server-safe way to resolve the canonical semantic label without reaching into raw vocabulary internals.
   - GDS now exports `getSemanticActionLabel(...)` for that use case.

### Keep local

These remain intentionally product-local and should not be promoted into GDS core without a second adopter proving the same contract:

- branded public shell composition and footer/legal content
- operator shell
- admin credentials shell
- immersive play surfaces
- full-viewport game layout CSS
- notification usage details

### Replace with existing GDS

Narimato already has thin wrappers that should remain thin and not become a second authority:

- `NarimatoPageHeader`
- `NarimatoMetricCard`
- `NarimatoGdsAlert`
- root provider composition around `GdsProvider`

## Outcome

Narimato confirms that the current direct `@sovereignsquad/gds-*` path is viable. The remaining useful GDS work from this consumer is incremental hardening, not another migration wave.
