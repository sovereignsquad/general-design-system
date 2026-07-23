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
