# Dependency Audit Policy

Status: Active SSOT
Version: 3.0.7
Last updated: 2026-06-06

This repository treats published runtime package dependencies and local reference/tooling dependencies differently.

## Release Gate

`npm run audit:dependencies` enforces:

- `npm audit --omit=dev` must have zero findings.
- Full `npm audit` may only contain explicitly accepted dev/reference-tooling advisories listed in this document.
- Accepted advisories must have an owner, reason, and review date.

## Accepted Dev / Reference Tooling Advisories

### GHSA-qx2v-qp2m-jg93

Owner: GDS platform
Review date: 2026-07-06
Scope: `apps/reference-next` development/reference fixture via `next@15.5.18` and nested `postcss@8.4.31`
Severity: moderate

Reason:

- The finding is currently reported through Next's nested PostCSS dependency in the private App Router reference fixture.
- `next` is kept in `devDependencies` for the reference fixture so it is not part of the production dependency audit or published GDS package runtime surface.
- The latest stable Next line available during this release still declares the same nested PostCSS version, so forcing a framework major or npm's suggested downgrade is not a safe corrective action.

Operational behavior:

- Do not ship public consumer guidance that requires `apps/reference-next` as a runtime dependency.
- Recheck monthly or when Next publishes a patched stable dependency graph.
- Remove this exception once `npm audit --json` no longer reports the advisory through the reference fixture.

## Resolved During 3.0.7

- `vitest` was upgraded from `3.2.4` to `4.1.8`, resolving GHSA-5xrq-8626-4rwp for the local test runner.
