# Claude Design Integration

Status: Active SSOT
Version: 3.14.4
Last updated: 2026-07-26

How to make **Claude Design** (claude.ai/design) build screens, flows, and prototypes with your real GDS components instead of generic ones — so every design the agent produces is on-brand, made of shipped GDS parts, and maps 1:1 onto code your engineers can ship.

## What this gives you

Out of the box, the Claude Design agent designs with generic components. After syncing GDS into a Claude Design project, the agent:

- builds with the real, compiled GDS components (`window.GDS.*` from the design system bundle);
- codes against the actual `<Name>Props` TypeScript contracts;
- styles with the GDS theme — Mantine base CSS plus GDS tokens and fonts;
- follows the GDS conventions (provider wrapping, prop/token styling, semantic actions) from the synced README header.

Every preview card the designer browses is a real render of the shipped component, and every design exports to code that imports `@sovereignsquad/gds`.

## How GDS was synced (reference)

The canonical GDS Claude Design project was produced with the `/design-sync` skill in Claude Code (package shape, no Storybook):

1. **Bundle** — `@sovereignsquad/gds` `dist/` is compiled to a single `window.GDS` IIFE; the theme stylesheet (Mantine + GDS tokens, with bare `@mantine/*` imports flattened via esbuild) ships as the styles closure so designs render fully themed.
2. **Provider** — every preview renders inside `GdsProvider` (the converter's `cfg.provider`), so components get the theme/tokens/locale.
3. **Previews** — each component has a hand-authored, render-verified preview (`.design-sync/previews/<Name>.tsx`) graded on an absolute rubric; a few body-portal overlays (`GdsModal`, `GdsDrawer`, `GdsSheet`) intentionally ship the typographic floor card because their open state portals outside the capture card (they remain fully usable in real designs).
4. **Conventions header** — `.design-sync/conventions.md` is prepended to the project README and inlined into the design agent's prompt, teaching it the GDS build idiom.

The reproducible inputs live in `.design-sync/` (config, conventions, NOTES, previews) and are committed, so a re-sync is one command.

## Sync your own Claude Design project

Anyone adopting GDS can sync it into their own claude.ai/design account:

1. In **Claude Code** (CLI, desktop, or IDE), `cd` into a checkout of this repo (or your fork).
2. Authenticate design access: `/login` with a Claude subscription, or `/design-login` for API-key sessions.
3. Run **`/design-sync`**. It creates a new Claude Design project, builds the bundle, verifies previews, and uploads all 252 components.
4. Open the project URL it prints. From then on, prompt the design agent and it builds with GDS.

Re-syncs (after a GDS version bump) are a single `/design-sync` run — it rebuilds, diffs against the uploaded anchor, re-verifies only what changed, and re-uploads.

## Using GDS in Claude Code and other AI tools

Claude Design is the visual lane. For building/editing code with GDS in **Claude Code** (or Cursor, Copilot, etc.), see [`AI_AGENT_GUIDE.md`](AI_AGENT_GUIDE.md) and drop [`TEMPLATES/AGENTS.md.template`](../TEMPLATES/AGENTS.md.template) / [`TEMPLATES/CLAUDE.md.template`](../TEMPLATES/CLAUDE.md.template) into your repo. The machine-readable entry point for any LLM tool is [`llms.txt`](../llms.txt).
