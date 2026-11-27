import { defineConfig } from 'tsup';

// One output file per source module, so each module keeps its own 'use client' directive.
// Bundling merges modules into shared chunks and drops those directives, and a React Server
// Component bundle then evaluates client-only code (#1002). scripts/fix-esm-specifiers.mjs
// makes the ESM output's relative imports explicit after the build.
const publicEntries = ['src/index.ts', 'src/client.ts', 'src/server.ts'];

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.ts', '!src/**/*.test.tsx', '!src/**/*.test-fixture.*', '!src/__snapshots__/**'],
  bundle: false,
  format: ['cjs', 'esm'],
  dts: { entry: publicEntries },
  clean: true,
  external: ['react', 'react-dom', '@mantine/core', '@mantine/hooks', '@sovereignsquad/gds-theme', '@sovereignsquad/gds-core', '@tabler/icons-react'],
});
