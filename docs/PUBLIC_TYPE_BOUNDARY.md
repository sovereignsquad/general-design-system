# Public Type Boundary

GDS owns its public TypeScript surface. The vendor UI engine (`@mantine/*`) is an
implementation detail and must not leak new types into what consumers import.

## The gate

`npm run verify:public-types` (`scripts/verify-public-types-boundary.mjs`, wired
into `verify:release`) scans the built, consumer-facing `.d.ts` entrypoints
(`packages/*/dist/{index,client,server}.d.ts`) for `@mantine/*` references and
compares them against the committed baseline:

```text
boundary/public-type-allowlist.json
```

- A **new** vendor-type reference not in the baseline → **CI fails**, naming the
  exact `file  module  symbol`. Fix by exposing a GDS-owned type instead.
- A vendor-type exposure that **disappears** (surface shrank) → reported as a
  non-failing note so the baseline can be tightened.

## Why an allowlist instead of "zero @mantine"

The allowlist is the documented, reviewed set of intentional vendor-type
exposures. Today that is almost entirely the **`GdsPrimitives` passthrough** in
`@sovereignsquad/gds-core` (it deliberately re-exports raw engine primitives and
their prop types) plus the Mantine theme-override types in `@sovereignsquad/gds-theme`.

Un-exporting those primitives is a **breaking** change for consumers that use
them with engine props, so it is done **deliberately and incrementally**, not in
one cut. This gate makes that safe: the surface can only ever **shrink on
purpose** (regenerate the baseline) and **never grow by accident**. Each future
wrap of a primitive behind a GDS-owned type shrinks the allowlist — that is the
mechanical meaning of "rely on the vendor less and less."

## Updating the baseline (intentional changes only)

After an intentional, reviewed change to the public type surface:

```bash
npm run build
node scripts/verify-public-types-boundary.mjs --write
git add boundary/public-type-allowlist.json   # review the diff
```

The baseline diff is the reviewable record of how the vendor surface changed.
