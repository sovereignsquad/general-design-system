import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // More specific subpath alias must precede the bare package alias below —
      // Vite/Rollup alias matching checks entries in order and this one would
      // otherwise never be reached.
      '@sovereignsquad/gds-core/map': resolve(__dirname, 'packages/gds-core/src/map.ts'),
      '@sovereignsquad/gds-core/rich-text-editor': resolve(__dirname, 'packages/gds-core/src/rich-text-editor.ts'),
      '@sovereignsquad/gds-core/reference-theme-explorer': resolve(__dirname, 'packages/gds-core/src/reference-theme-explorer.ts'),
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
    // Every file boots a full jsdom + React + Mantine tree, so a worker costs memory rather
    // than CPU. One worker per core oversubscribes: on a 10-core/16GB machine the default
    // measured 121s wall / 551s test time with 8 timeout failures, against 39s / 58s and no
    // failures at 4. Raise only with a measurement on the machine class that has to hold it.
    //
    // CI (issue 732): GitHub Actions' shared, virtualized runners have less consistent headroom
    // than a dedicated local machine at the same nominal core count -- 4 workers there produced
    // the same class of intermittent timeout failure this comment already documents locally
    // (KanbanBoard.test.tsx's Move-menu test, mantine-9 leg specifically, 3 times across two
    // unrelated PRs, never reproduced locally including under a real mantine-9 install). Capped
    // lower only under CI; local development keeps the full 4.
    maxWorkers: process.env.CI ? 2 : 4,
    include: [
      // Issue 582. Verification scripts carry real branching — the budget report's
      // direction rule inverts for `min` budgets, and getting it backwards would tell a
      // reviewer the opposite of the truth about their own change. Until now nothing under
      // scripts/ could be tested at all, which is why 45 gates had no unit coverage.
      'scripts/**/*.test.mjs',
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
