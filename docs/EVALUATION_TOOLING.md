# Evaluation Tooling & Tokenless Adoption Path

Status: Active SSOT
Version: 5.0.2
Last updated: 2026-08-08

Carbon and Ant put an "Edit in StackBlitz/CodeSandbox" button on every demo — the biggest "read → run" adoption accelerator (issue #449). This document records the decision for how GDS meets that need, and the one dependency that gates the full version.

## The blocker is distribution, not tooling

An "Open in StackBlitz/CodeSandbox" button is a client-side deep link (the StackBlitz/CodeSandbox SDKs encode the project files in the URL/POST — no account or API key needed to *create* the button). What it can't do today is **run GDS**, because:

> GDS packages publish to **auth-gated GitHub Packages**, so any sandbox — or CDN import (`esm.sh`, `jsDelivr`), or a first-touch evaluator — must configure an `.npmrc` with a token *before* `npm install @sovereignsquad/gds` resolves.

A "tokenless evaluation path" (the actual ask in #449) is therefore **not a sandbox-tooling problem** — it is a **package-distribution decision**. Every downstream evaluation accelerator (sandboxes, CDN playgrounds, a public docs REPL) traces back to the same root.

## Decision & recommendation

**Recommended:** publish the GDS packages (or a curated public subset) to the **public npm registry** under the `@sovereignsquad` scope. That single change unblocks:

- an "Open in StackBlitz/CodeSandbox" button on every playground demo that actually installs and runs GDS with no token,
- CDN imports for zero-install REPLs and docs embeds,
- lower first-touch friction for the "larger audience" the roadmap targets — the biggest single lever for wider adoption.

This is an **org/distribution decision** (npm-org setup, scope ownership, which packages go public, release-pipeline wiring to publish to both registries) that requires npm-org credentials and an explicit owner sign-off — it is not something the design system can flip unilaterally in code. Once the registry decision is made, the sandbox button + project scaffold is a small, mechanical follow-up.

## Interim evaluation path (available today)

Until public-npm publication lands, GDS's read → run path is:

- **Read:** the live pattern catalog, Theme Lab, and coverage views at [sovereignsquad.github.io/general-design-system](https://sovereignsquad.github.io/general-design-system).
- **Run locally:** the in-repo reference apps — [`apps/reference-vite`](../apps/reference-vite) and [`apps/reference-next`](../apps/reference-next) — are working, minimal consumers wired with `GdsProvider` and the mandatory stylesheet import; clone and run them as the canonical starting scaffold (see [`INSTALLATION_GUIDE.md`](../INSTALLATION_GUIDE.md)).
- **Install (token required):** consumers with GitHub Packages access follow [`INSTALLATION_GUIDE.md`](../INSTALLATION_GUIDE.md)'s `.npmrc` setup.

## Re-evaluation trigger

Revisit the in-browser sandbox build **when the packages are published to a public registry**. At that point, file a fresh issue to add the "Open in sandbox" button + a pre-wired project template (GdsProvider + stylesheet import + the example source) to the playground demos — a bounded, mechanical addition once the tokenless install works.
