import { defineConfig } from 'tsup';

// One output file per source module, so each module keeps its own 'use client' directive.
// Bundling merges modules into shared chunks and drops those directives, and a React Server
// Component bundle then evaluates client-only code (#1002). scripts/fix-esm-specifiers.mjs
// makes the ESM output's relative imports explicit after the build.
const publicEntries = [
    'src/map.ts','src/index.ts', 'src/client.ts', 'src/server.ts', 'src/rich-text-editor.ts', 'src/reference-theme-explorer.ts',
    'src/locales/lazy/index.ts', 'src/locales/lazy/all.ts', 'src/locales/lazy/es.ts', 'src/locales/lazy/hu.ts', 'src/locales/lazy/de.ts', 'src/locales/lazy/fr.ts', 'src/locales/lazy/it.ts', 'src/locales/lazy/ru.ts', 'src/locales/lazy/he.ts', 'src/locales/lazy/ar.ts', 'src/locales/lazy/zh.ts', 'src/locales/lazy/ja.ts', 'src/locales/lazy/ko.ts'];

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.ts', '!src/**/*.test.tsx', '!src/**/*.test-fixture.*', '!src/__snapshots__/**'],
  bundle: false,
  format: ['cjs', 'esm'],
  dts: { entry: publicEntries },
  clean: true,
  external: ['react', 'react-dom', '@mantine/core', '@mantine/hooks', '@mantine/dates', 'dayjs', '@sovereignsquad/gds-theme', '@tabler/icons-react'],
});
