import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts', 'src/server.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@mantine/core',
    '@mantine/hooks',
    '@mantine/modals',
    '@mantine/notifications',
    '@tabler/icons-react',
    '@doneisbetter/gds-theme',
    '@doneisbetter/gds-core',
    '@doneisbetter/gds-admin',
  ],
});
