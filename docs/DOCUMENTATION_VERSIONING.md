# Documentation Versioning

Status: Active SSOT
Version: 3.14.17
Last updated: 2026-07-26

Peers (Chakra, Primer, …) keep prior-major documentation live so consumers pinned to an older major aren't stranded on docs that describe a newer API. GDS meets the same need (issue #454) — but because **GDS documentation lives in-repo as versioned Markdown**, every published release is already a complete, immutable documentation snapshot. This document is the decided scheme for reading docs at a specific version.

## The scheme

| Lane | Where | Use when |
|---|---|---|
| **Current major (live)** | This repository's `main` + the live site at [sovereignsquad.github.io/general-design-system](https://sovereignsquad.github.io/general-design-system) | You're on the current major (`3.x`). |
| **Any released version (pinned)** | The version's **release tag** on GitHub: `github.com/sovereignsquad/general-design-system/tree/gds-v<MAJOR>.<MINOR>.<PATCH>` | You're pinned to a specific version and want the docs that shipped with it — the tag preserves `FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, `CHANGELOG.md`, `docs/**`, and the token/DTCG snapshot exactly as released. |
| **Prior major (archived)** | The **last tag of that major** (below) | You're still on a previous major and need matching docs. |

Because every `gds-v*` tag is an immutable Git ref, this needs no separate hosted archive to keep prior-major docs readable — the tag *is* the archive, addressable forever at a stable GitHub URL, and it can never drift from the code that shipped with it.

## Version index

- **Current major — 3.x** (supported): [`main` docs](https://github.com/sovereignsquad/general-design-system/tree/main) · [live site](https://sovereignsquad.github.io/general-design-system) · latest release tag `gds-v3.14.17`.
- **Previous major — 2.x** (archived, read-only): last release [`gds-v2.6.5`](https://github.com/sovereignsquad/general-design-system/tree/gds-v2.6.5) — browse its `FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, and `docs/**` for the 2.x contracts. Not maintained; upgrade guidance lives in [`DEPRECATIONS_AND_MIGRATIONS.md`](../DEPRECATIONS_AND_MIGRATIONS.md) and [`MIGRATION_TO_SOVEREIGNSQUAD.md`](../MIGRATION_TO_SOVEREIGNSQUAD.md).

To read the docs for **any** other released version `X.Y.Z`, replace the tag: `github.com/sovereignsquad/general-design-system/tree/gds-vX.Y.Z`.

## Support policy

- **Current major** is actively maintained: docs, packages, and the live site track `main`.
- **Previous major** docs stay addressable at their last tag but are **frozen** — corrections land only on the current major. Consumers on a prior major should plan an upgrade using the migration docs above.
- Majors older than the previous one remain tag-addressable but are neither maintained nor indexed here.

## Why not a separately hosted multi-version site?

A hosted, side-by-side multi-version docs site (a `/v2`, `/v3` URL split with a live switcher) is the heavier alternative peers use because their docs are generated from a separate pipeline. GDS's docs are the repository's own Markdown, so the release tag already provides a complete, versioned, immutable snapshot at a stable URL for free — which is the actual consumer need (*"read the docs that match the major I'm pinned to"*) without a second hosting pipeline to build and keep in sync. If a live in-site version switcher is later warranted, it would point at exactly these tag URLs.
