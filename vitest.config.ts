import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@sovereignsquad/gds-theme': resolve(__dirname, 'packages/gds-theme/src/index.ts'),
      '@sovereignsquad/gds-core': resolve(__dirname, 'packages/gds-core/src/index.ts'),
      '@sovereignsquad/gds-admin': resolve(__dirname, 'packages/gds-admin/src/index.ts'),
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    testTimeout: 15000,
    include: [
      'apps/*/src/*.test.ts',
      'apps/*/src/*.test.tsx',
      'apps/*/src/*.test.js',
      'apps/*/src/*.test.jsx',
      'packages/gds-*/src/*.test.ts',
      'packages/gds-*/src/*.test.tsx',
      'packages/gds-*/src/*.test.js',
      'packages/gds-*/src/*.test.jsx',
      'packages/gds-*/*.test.ts',
      'packages/gds-*/*.test.tsx',
      'packages/gds-*/*.test.js',
      'packages/gds-*/*.test.jsx',
    ],
    coverage: {
      reporter: ['text'],
    },
  },
});
