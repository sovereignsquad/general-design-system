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
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/react-router-dom/')) {
            return 'vendor-router'
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }

          if (
            id.includes('/@mantine/') ||
            id.includes('/@floating-ui/') ||
            id.includes('/clsx/') ||
            id.includes('/embla-carousel-')
          ) {
            return 'vendor-mantine'
          }

          if (
            id.includes('/@doneisbetter/gds-core/') ||
            id.includes('/@doneisbetter/gds-admin/') ||
            id.includes('/@doneisbetter/gds-theme/')
          ) {
            return 'vendor-gds'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
