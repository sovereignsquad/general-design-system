# Templates

Status: Reference
Version: 6.7.0
Last updated: 2026-10-01

These starter templates are reference implementations for adopting projects.

They are not copy-paste mandates, but they define the expected shape of a GDS-governed implementation:

- [theme.ts.template](theme.ts.template)
- [providers.tsx.template](providers.tsx.template)
- [next-app-layout.tsx.template](next-app-layout.tsx.template)
- [vite-main.tsx.template](vite-main.tsx.template)
- [AppButton.tsx.template](AppButton.tsx.template)
- [AppPageHeader.tsx.template](AppPageHeader.tsx.template)
- [AppShell.tsx.template](AppShell.tsx.template)
- [gds-adoption.json.template](gds-adoption.json.template)
- [AGENTS.md.template](AGENTS.md.template) — drop-in agent rules for a consuming repository
- [GDS_THEME_CREATION_PROMPT.md](GDS_THEME_CREATION_PROMPT.md) — the operational prompt for authoring a new theme lane

Use them to:

- initialize a new Mantine-only app structure
- align an existing project on provider/theme shape
- standardize thin wrappers and page-level layout patterns
- declare machine-readable GDS adoption state and compliance exceptions

## Root setup

- The entry files are [next-app-layout.tsx.template](next-app-layout.tsx.template) (Next.js App Router) and [vite-main.tsx.template](vite-main.tsx.template) (Vite). Each imports `@sovereignsquad/gds-theme/styles.css` once, before app styles. The import is mandatory and `GdsProvider` does not replace it.
- The stylesheet already contains `@mantine/core/styles.css` and `@mantine/notifications/styles.css` and loads the Inter font. Do not import those sheets or load Inter again.
- [providers.tsx.template](providers.tsx.template) is the client boundary that `next-app-layout.tsx.template` imports as `./providers`. It mounts the single `GdsProvider` with the theme from `theme.ts.template`; keep its `mode` equal to the layout's `ColorSchemeScript` `defaultColorScheme`.
- No Next.js Pages Router template exists. See [INSTALLATION_GUIDE.md, "Next.js Pages Router"](../INSTALLATION_GUIDE.md#nextjs-pages-router).
- Setup errors and the stylesheet load check: [INSTALLATION_GUIDE.md, "Stylesheet troubleshooting"](../INSTALLATION_GUIDE.md#stylesheet-troubleshooting) and ["Common setup mistakes"](../INSTALLATION_GUIDE.md#common-setup-mistakes).

## Fonts

- Bind a registered font lane with `applyGdsFontLane(theme, laneId)`. A face that is not a lane follows [INSTALLATION_GUIDE.md, "Unregistered brand font"](../INSTALLATION_GUIDE.md#unregistered-brand-font).
- A theme `fontFamily` that reads a CSS custom property needs that property defined on `<html>`, plus a `var()` fallback for when it is not. An undefined property with no fallback invalidates the declaration, and text renders in the browser's default font.
