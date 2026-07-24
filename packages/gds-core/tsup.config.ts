import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts', 'src/server.ts', 'src/rich-text-editor.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@mantine/core', '@mantine/hooks', '@mantine/dates', 'dayjs', '@sovereignsquad/gds-theme', '@tabler/icons-react'],
});
