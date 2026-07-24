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
    // vendor-gds chunk legitimately, intentionally carries that cost — this is
    // the real, earned size of a showcase app exercising the whole component
    // surface, not an accidental leak. Raised to match that known, deliberate
    // size rather than silencing a signal that would still fire for a genuine
    // future regression.
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-router',
              test: /node_modules[\\/]react-router-dom[\\/]/,
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
