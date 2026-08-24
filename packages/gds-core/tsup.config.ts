import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/map.ts','src/index.ts', 'src/client.ts', 'src/server.ts', 'src/rich-text-editor.ts', 'src/reference-theme-explorer.ts',
    'src/locales/lazy/index.ts', 'src/locales/lazy/all.ts', 'src/locales/lazy/es.ts', 'src/locales/lazy/hu.ts', 'src/locales/lazy/de.ts', 'src/locales/lazy/fr.ts', 'src/locales/lazy/it.ts', 'src/locales/lazy/ru.ts', 'src/locales/lazy/he.ts', 'src/locales/lazy/ar.ts', 'src/locales/lazy/zh.ts', 'src/locales/lazy/ja.ts', 'src/locales/lazy/ko.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@mantine/core', '@mantine/hooks', '@mantine/dates', 'dayjs', '@sovereignsquad/gds-theme', '@tabler/icons-react'],
});
