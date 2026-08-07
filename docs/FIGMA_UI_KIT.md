# Figma UI Kit — Build & Sync Playbook

Status: Active SSOT
Version: 4.1.3
Last updated: 2026-07-26

Every leading design system ships an official Figma library so designers can drag real components and bind real variables (issue #450). GDS's position is deliberate and stated in [`DESIGN_HANDOFF.md`](DESIGN_HANDOFF.md): **the code tokens and component contracts are authoritative, and the Figma kit is generated/synced from them — never the reverse.** This avoids the drift every hand-maintained Figma library eventually suffers.

This playbook is the **documented sync path**: how the published Figma kit is produced from what GDS already ships, and how it stays 1:1 with the code.

## What GDS ships (the authoritative substrate)

| Artifact | Package / file | Role in the kit |
|---|---|---|
| **DTCG token export** | [`tokens/gds.tokens.json`](../tokens/gds.tokens.json) (`verify:tokens-dtcg`) | The Figma **variables** source — W3C DTCG is the native Figma-variable interchange format. |
| **Design-to-code handoff mapping** | `getGdsDesignTokenMappings()` / `getGdsComponentMappings()` (`@sovereignsquad/gds-core`), see [`DESIGN_HANDOFF.md`](DESIGN_HANDOFF.md) | Maps each shipped component → its Figma component path, and each code token → its Figma variable path. |
| **Live component reference** | The pattern catalog + Theme Lab at the [live site](https://sovereignsquad.github.io/general-design-system) | The visual source of truth designers rebuild the Figma components against. |

Because all three regenerate from `createGdsTokenGraph()` and the component registry, the kit's inputs can never silently drift from the shipped code.

## Producing the Figma variables (automatable, no drift)

1. In Figma, install **Tokens Studio for Figma** (DTCG-aware).
2. Import [`tokens/gds.tokens.json`](../tokens/gds.tokens.json) — every GDS color token (all 25 theme lanes) becomes a Figma variable collection, mapped 1:1 to the code token id.
3. On each GDS release that changes tokens, re-import the regenerated `gds.tokens.json`. `verify:tokens-dtcg` guarantees the file matches the shipped runtime, so re-import = re-sync with zero manual editing.

The variable half of "maps 1:1 to shipped tokens" is therefore fully governed by GDS and requires no bespoke tooling.

## Producing the Figma components

The component instances (frames, variants, auto-layout) are built **in Figma** against the live catalog and bound to the imported variables, using the `getGdsComponentMappings()` Figma-path contract so each Figma component lands at the path GDS handoff notes already reference. Each component's variant set mirrors the component's public prop enums (e.g. `SemanticButton` → `action` × `brandVariant` × `size`), and its accessibility annotations come from [`ACCESSIBILITY_EVIDENCE.md`](../ACCESSIBILITY_EVIDENCE.md) / [`docs/ACCESSIBILITY_PER_COMPONENT.md`](ACCESSIBILITY_PER_COMPONENT.md).

## Publication boundary (what is GDS-owned vs. design-owned)

- **GDS-owned (in this repository, done):** the authoritative token substrate (DTCG), the component/variable mapping contract, the drift gate, and this sync path. These are what keep any Figma kit correct and current.
- **Design-owned (a Figma workspace task, requires a Figma account/editor):** authoring and **publishing** the actual Figma library file to an org/community workspace, and keeping its components visually rebuilt as the catalog evolves. This is intentionally outside the code repository — it is a design-tool artifact, and GDS's contract (`DESIGN_HANDOFF.md`) is that code stays authoritative with "external Figma sync layered on top."

## Keeping it 1:1 over time

- Re-import `gds.tokens.json` on any token-changing release (gated, deterministic).
- When a component's public props change, update its Figma variant set to match — the handoff report (`DESIGN_HANDOFF.md`) flags mappings that go **stale** so a drifted Figma component is detectable rather than silent.
- Never introduce a color or spacing value in Figma that has no corresponding code token; if the kit needs one, it must be added to the code tokens first and re-exported.
