/**
 * Dedicated subpath entry for `ReferenceThemeExplorer` (`@sovereignsquad/gds-core/reference-theme-explorer`).
 *
 * Moved out of the main `.`/`./client` barrel (issue #532): it's the single
 * largest module in gds-core's client bundle (`ReferenceThemeExplorer.tsx` +
 * `ReferenceThemeExplorer.copy.ts`, ~112.7 KB combined — bigger than the
 * `GdsRichTextEditor` subtree that first established this pattern), and every
 * real consumer of it (the "Theme Lab" reference page) is a single showcase
 * route, not something rendered on every page. Bundlers that group a whole
 * package's output into one vendor chunk by file path (this monorepo's own
 * playground app does exactly that) can't tree-shake it back out even when a
 * consumer never renders it. A dedicated entry point means importing anything
 * else from gds-core never pulls this in — only `import { ReferenceThemeExplorer }
 * from '@sovereignsquad/gds-core/reference-theme-explorer'` does. This is a
 * breaking change for any consumer previously importing `ReferenceThemeExplorer`
 * from the main package path — see DEPRECATIONS_AND_MIGRATIONS.md.
 */
export * from './ReferenceThemeExplorer';
