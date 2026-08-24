# Documentation Versioning

Status: Active SSOT
Version: 6.5.0
Last updated: 2026-08-16

Peers (Chakra, Primer, …) keep prior-major documentation live so consumers pinned to an older major aren't stranded on docs that describe a newer API. GDS meets the same need (issue #454) — but because **GDS documentation lives in-repo as versioned Markdown**, every published release is already a complete, immutable documentation snapshot. This document is the decided scheme for reading docs at a specific version.

## The scheme

| Lane | Where | Use when |
|---|---|---|
| **Current major (live)** | This repository's `main` + the live site at [sovereignsquad.github.io/general-design-system](https://sovereignsquad.github.io/general-design-system) | You're on the current major (`6.x`). |
| **Any released version (pinned)** | The version's **release tag** on GitHub: `github.com/sovereignsquad/general-design-system/tree/gds-v<MAJOR>.<MINOR>.<PATCH>` | You're pinned to a specific version and want the docs that shipped with it — the tag preserves `FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, `CHANGELOG.md`, `docs/**`, and the token/DTCG snapshot exactly as released. |
| **Prior major (archived)** | The **last tag of that major** (below) | You're still on a previous major and need matching docs. |

Because every `gds-v*` tag is an immutable Git ref, this needs no separate hosted archive to keep prior-major docs readable — the tag *is* the archive, addressable forever at a stable GitHub URL, and it can never drift from the code that shipped with it.

## Version index

- **Current major — 6.x** (supported): [`main` docs](https://github.com/sovereignsquad/general-design-system/tree/main) · [live site](https://sovereignsquad.github.io/general-design-system) · latest release tag `gds-v6.5.0`.
- **Previous major — 3.x** (archived, read-only): last release [`gds-v3.14.17`](https://github.com/sovereignsquad/general-design-system/tree/gds-v3.14.17) — browse its `FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, and `docs/**` for the 3.x contracts. Not maintained; upgrade guidance lives in [`DEPRECATIONS_AND_MIGRATIONS.md`](../DEPRECATIONS_AND_MIGRATIONS.md) and [`MIGRATION_TO_SOVEREIGNSQUAD.md`](../MIGRATION_TO_SOVEREIGNSQUAD.md). Majors older than the previous one (2.x and earlier) remain tag-addressable per the support policy below but are no longer indexed here.

To read the docs for **any** other released version `X.Y.Z`, replace the tag: `github.com/sovereignsquad/general-design-system/tree/gds-vX.Y.Z`.

## What keeps the headers true

`scripts/verify-docs-governance-consistency.mjs` derives the governed set rather than listing
it: a document declaring `Status: Active SSOT` is claiming to describe the current system, so
its `Version:` header must equal `VERSION`. Documents declaring any other status — `Planned`,
`Proposed`, `Decision record`, `Active reference` — are point-in-time records, and restamping
them would make them claim to describe a release they predate, so the gate reports them
instead of governing them. Two documents are governed by explicit exception, each carrying its
reason in source.

The header states which release line a document belongs to, per the scheme above. It is not a
certificate that every sentence was re-read that release.

The gate prints the documents it does not govern on every run, so that set cannot grow
silently, and refuses to pass if the derivation collapses below the count the previous
hand-written array carried.

## Support policy

- **Current major** is actively maintained: docs, packages, and the live site track `main`.
- **Previous major** docs stay addressable at their last tag but are **frozen** — corrections land only on the current major. Consumers on a prior major should plan an upgrade using the migration docs above.
- Majors older than the previous one remain tag-addressable but are neither maintained nor indexed here.

## Why not a separately hosted multi-version site?

A hosted, side-by-side multi-version docs site (a `/v2`, `/v3` URL split with a live switcher) is the heavier alternative peers use because their docs are generated from a separate pipeline. GDS's docs are the repository's own Markdown, so the release tag already provides a complete, versioned, immutable snapshot at a stable URL for free — which is the actual consumer need (*"read the docs that match the major I'm pinned to"*) without a second hosting pipeline to build and keep in sync. If a live in-site version switcher is later warranted, it would point at exactly these tag URLs.
