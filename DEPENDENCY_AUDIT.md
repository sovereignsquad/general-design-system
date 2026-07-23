# Dependency Audit Policy

Status: Active SSOT
Version: 3.0.9
Last updated: 2026-07-23

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

### GHSA-f88m-g3jw-g9cj

Owner: GDS platform
Review date: 2026-08-22
Scope: `apps/reference-next` development/reference fixture via `next@15.5.20` and nested `sharp@0.34.5` (libvips CVE-2026-33327/33328/35590/35591)
Severity: high

Reason:

- The finding is reported through Next's nested `sharp` image-optimization dependency in the private App Router reference fixture, the same non-shipped dependency chain as `GHSA-qx2v-qp2m-jg93`.
- `next` is kept in `devDependencies` for the reference fixture so it is not part of the production dependency audit or published GDS package runtime surface. The reference fixture does not serve or process untrusted images.
- The only automated fix path (`npm audit fix --force`) downgrades `next` to `9.3.3`, a major regression far below the supported `15.x` reference line, so it is not a safe corrective action.

Operational behavior:

- Do not ship public consumer guidance that requires `apps/reference-next` as a runtime dependency.
- Recheck monthly or when Next publishes a patched `sharp`/libvips dependency graph.
- Remove this exception once `npm audit --json` no longer reports the advisory through the reference fixture.

### GHSA-6g55-p6wh-862q

Owner: GDS platform
Review date: 2026-08-23
Scope: nested `postcss@8.4.31` (`<=8.5.11` vulnerable range) reached via two dev-only paths — `apps/reference-next`'s `next` dependency (same non-shipped reference fixture as the other accepted advisories above) and the root `tsup` devDependency used to build the published packages
Severity: high

Reason:

- The advisory ("Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments") requires processing attacker-controlled CSS input containing a malicious `sourceMappingURL` comment. Neither path applies here: `apps/reference-next` doesn't serve or process untrusted CSS, and `tsup` only ever processes GDS's own first-party, repo-controlled source during the build — no untrusted CSS ever reaches PostCSS in either case.
- `postcss` is a nested dev-tooling dependency in both paths, not a runtime dependency of any published `@sovereignsquad/*` package (`npm audit --omit=dev` reports zero findings) — it never ships in built package output.
- The only automated fix (`npm audit fix --force`) downgrades `next` to `9.3.3`, a major regression far below the supported `15.x` reference line, so it is not a safe corrective action.

Operational behavior:

- Do not ship public consumer guidance that requires `apps/reference-next` or `tsup` as a runtime dependency (already true — both are dev-only).
- Recheck monthly or when Next/tsup publish a patched nested PostCSS dependency graph.
- Remove this exception once `npm audit --json` no longer reports the advisory through either path.

## Resolved During 3.0.7

- `vitest` was upgraded from `3.2.4` to `4.1.8`, resolving GHSA-5xrq-8626-4rwp for the local test runner.
