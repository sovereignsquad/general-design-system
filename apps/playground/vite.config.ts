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
    // GdsRichTextEditor (Tiptap/ProseMirror) lives behind the
    // `@sovereignsquad/gds-core/rich-text-editor` subpath so consumers who don't
    // import it don't bundle it. This app does import it (admin-editor-flows), so
    // its vendor-gds chunk carries that cost.
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
              // Statically imported (renders on first paint of / and /themes), so it
              // needs its own chunk rather than fusing into vendor-gds. Priority must
              // stay higher than vendor-gds so this narrower match wins.
              name: 'vendor-gds-theme-explorer',
              test: /[\\/]packages[\\/]gds-core[\\/]dist[\\/]reference-theme-explorer/,
              priority: 2,
            },
            {
              // Workspace packages resolve to packages/ via symlink, not node_modules/.
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
