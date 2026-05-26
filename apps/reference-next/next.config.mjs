import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doneisbetter/gds-theme', '@doneisbetter/gds-core', '@doneisbetter/gds-admin'],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@doneisbetter/gds-theme/server': resolve(__dirname, '../../packages/gds-theme/src/server.ts'),
      '@doneisbetter/gds-theme/client': resolve(__dirname, '../../packages/gds-theme/src/client.ts'),
      '@doneisbetter/gds-core/server': resolve(__dirname, '../../packages/gds-core/src/server.ts'),
      '@doneisbetter/gds-core/client': resolve(__dirname, '../../packages/gds-core/src/client.ts'),
      '@doneisbetter/gds-admin/server': resolve(__dirname, '../../packages/gds-admin/src/server.ts'),
      '@doneisbetter/gds-admin/client': resolve(__dirname, '../../packages/gds-admin/src/client.ts'),
    };
    return config;
  },
};

export default nextConfig;
