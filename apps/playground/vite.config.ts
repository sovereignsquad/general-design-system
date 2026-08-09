import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/general-design-system/',
  resolve: {
    dedupe: ['react', 'react-dom', '@mantine/core', '@mantine/hooks']
  },
  build: {
    // GdsRichTextEditor's Tiptap/ProseMirror "Content engine" dependency lives
    // behind a dedicated `@sovereignsquad/gds-core/rich-text-editor` subpath
    // (see packages/gds-core/src/rich-text-editor.ts) specifically so consumers
    // who never import it don't bundle it — confirmed working: apps/reference-vite,
    // which doesn't use the editor, dropped from a 561kB to a 217kB vendor-gds
    // chunk once the subpath split landed. This playground app DOES deliberately
    // demo GdsRichTextEditor (in the admin-editor-flows pattern), so its own
    // vendor-gds chunk legitimately, intentionally carries that cost.
    //
    // Issue 528 explicitly ruled out raising this limit as an acceptable fix
    // for a genuine overage ("suppresses the signal rather than fixing the
    // underlying size") — correctly. This session temporarily raised it
    // 940->960 anyway (issue 532) while investigating, which was a mistake in
    // light of that standing decision; the real fix landed in the same push:
    // `ReferenceThemeExplorer` (gds-core's single largest client-bundle
    // module, ~112.7 kB) moved behind its own `reference-theme-explorer`
    // subpath with a dedicated chunk group (see the `vendor-gds-theme-explorer`
    // rule below), mirroring rich-text-editor's proven pattern. Net result:
    // vendor-gds dropped 954kB -> 665kB — comfortably under even the
    // *original* 940 limit, not just the temporarily-raised one. Reset the
    // ceiling down to reflect that real, tight number rather than leaving it
    // loosened now that it's no longer needed. issue 528, closed.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-router',
              test: /node_modules[\\/]react-router[\\/]/,
              priority: 4,
            },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 3,
            },
            {
              name: 'vendor-mantine',
              test: /node_modules[\\/](@mantine|@floating-ui|clsx|embla-carousel-)/,
              priority: 2,
            },
            {
              // ReferenceThemeExplorer (issue 532) is rendered on first paint
              // of both / and /themes, so it stays a statically-imported,
              // eagerly-loaded chunk (no Suspense/loading-flash) — but as its
              // OWN chunk rather than fused into vendor-gds below: it alone was
              // ~112.7 kB of that chunk's now-fixed size overage. Must be a
              // higher priority than vendor-gds so this narrower path wins.
              name: 'vendor-gds-theme-explorer',
              test: /[\\/]packages[\\/]gds-core[\\/]dist[\\/]reference-theme-explorer/,
              priority: 2,
            },
            {
              // GDS workspace packages resolve through npm workspace symlinks to
              // their real path under packages/, not through node_modules/, so
              // they need their own test pattern instead of a node_modules match.
              name: 'vendor-gds',
              test: /[\\/]packages[\\/]gds-(core|admin|theme)[\\/]/,
              priority: 1,
            },
            {
              name: 'vendor-misc',
              test: /node_modules[\\/]/,
              priority: 0,
            },
          ],
        },
      },
    },
  },
})
